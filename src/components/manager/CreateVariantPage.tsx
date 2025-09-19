import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { notification } from 'antd';
import Step1TankSelection from './Step1TankSelection';
import Step4Accessories from './Step4Accessories';
import Step1BasicInfo from './Step1BasicInfo';
import Step3Review from './Step3Review';

interface TankImage {
  id: number;
  url: string;
  alt?: string;
}

interface Tank {
  accessoryId: number;
  name: string;
  size: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
  status: string;
  accessoryImages: TankImage[];
}

interface SelectedTank {
  accessoryId: number;
  tank: Tank;
}

interface Accessory {
  accessoryId: number;
  name: string;
  size: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
  status: string;
  accessoryImages: any[];
}

interface SelectedAccessory {
  accessoryId: number;
  quantity: number;
  accessory: Accessory;
}

interface VariantData {
  terrariumId: number;
  variantName: string;
  price: number;
  urlImage: string;
  stockQuantity: number;
  imageFile: File | null;
  selectedTank: SelectedTank | null;
  accessories: SelectedAccessory[];
  laborCost: number; // Tiền công
}

const CreateVariantPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [availableAccessories, setAvailableAccessories] = useState<Accessory[]>([]);
  const [loadingAccessories, setLoadingAccessories] = useState(false);

  const [variantData, setVariantData] = useState<VariantData>({
    terrariumId: parseInt(id || '0'),
    variantName: '',
    price: 0,
    urlImage: '',
    stockQuantity: 0,
    imageFile: null,
    selectedTank: null,
    accessories: [],
    laborCost: 0
  });

  // Tính tổng giá tank + accessories
  const calculateTankAndAccessoriesTotal = () => {
    const tankPrice = variantData.selectedTank?.tank.price || 0;
    const accessoriesTotal = variantData.accessories.reduce((sum, acc) => sum + (acc.accessory.price * acc.quantity), 0);
    return tankPrice + accessoriesTotal;
  };

  // Tính tổng giá cuối cùng
  const calculateTotalPrice = () => {
    return calculateTankAndAccessoriesTotal() + variantData.laborCost;
  };

  // Cập nhật giá tự động khi tank, accessories hoặc laborCost thay đổi
  useEffect(() => {
    const newPrice = calculateTotalPrice();
    setVariantData(prev => ({ ...prev, price: newPrice }));
  }, [variantData.selectedTank, variantData.accessories, variantData.laborCost]);

  const getAuthToken = (): string | null => {
    return localStorage.getItem('authToken') || 
           localStorage.getItem('token') || 
           localStorage.getItem('accessToken') || 
           localStorage.getItem('access_token');
  };

  const checkAuth = (): boolean => {
    const token = getAuthToken();
    if (!token) {
      notification.error({
        message: 'Chưa đăng nhập',
        description: 'Vui lòng đăng nhập để tiếp tục.',
        placement: 'topRight',
      });
      navigate('/login');
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (checkAuth()) {
      fetchAvailableAccessories();
    }
  }, []);

  const fetchAvailableAccessories = async () => {
    try {
      setLoadingAccessories(true);
      const response = await fetch('https://terarium.shop/api/Accessory/get-all');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.status === 200 && result.data) {
        const activeAccessories = result.data.filter((acc: Accessory) => 
          acc.status === 'ACTIVE' || acc.status === 'Active'
        );
        setAvailableAccessories(activeAccessories);
      } else {
        setAvailableAccessories([]);
      }
    } catch (error) {
      console.error('Error fetching accessories:', error);
      setAvailableAccessories([]);
    } finally {
      setLoadingAccessories(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTankSelectionChange = (tank: SelectedTank | null) => {
    setVariantData({ ...variantData, selectedTank: tank });
  };

  const handleAccessoriesChange = (accessories: SelectedAccessory[]) => {
    setVariantData({ ...variantData, accessories });
  };

  const handleBasicInfoChange = (data: Partial<VariantData>) => {
    setVariantData({ ...variantData, ...data });
  };

  const handleSubmit = async () => {
    if (!checkAuth()) return;

    if (!variantData.selectedTank) {
      notification.error({
        message: 'Lỗi',
        description: 'Vui lòng chọn loại bể',
        placement: 'topRight',
      });
      return;
    }

    if (!variantData.variantName.trim()) {
      notification.error({
        message: 'Lỗi',
        description: 'Vui lòng nhập tên variant',
        placement: 'topRight',
      });
      return;
    }

    if (variantData.stockQuantity < 0) {
      notification.error({
        message: 'Lỗi',
        description: 'Số lượng tồn kho không được âm',
        placement: 'topRight',
      });
      return;
    }

    try {
      setLoading(true);
      
      const token = getAuthToken();
      if (!token) {
        notification.error({
          message: 'Lỗi xác thực',
          description: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
          placement: 'topRight',
        });
        return;
      }

      let imageUrl = variantData.urlImage;

      // Upload image if file is selected
      if (variantData.imageFile) {
        const imageFormData = new FormData();
        imageFormData.append('file', variantData.imageFile);

        const imageResponse = await fetch('https://terarium.shop/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: imageFormData,
        });

        if (imageResponse.ok) {
          const imageResult = await imageResponse.json();
          imageUrl = imageResult.url || imageResult.data?.url || '';
        }
      }

      // Prepare accessories array including the selected tank
      const allAccessories = [
        // Add tank as first accessory
        {
          accessoryId: variantData.selectedTank.accessoryId,
          quantity: 1
        },
        // Add other accessories
        ...variantData.accessories.map(acc => ({
          accessoryId: acc.accessoryId,
          quantity: acc.quantity
        }))
      ];

      // Prepare request body
      const requestBody = {
        terrariumId: variantData.terrariumId,
        variantName: variantData.variantName,
        price: variantData.price, // Này sẽ là tổng giá đã tính
        urlImage: imageUrl,
        stockQuantity: variantData.stockQuantity,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        accessories: allAccessories
      };

      const response = await fetch('https://terarium.shop/api/TerrariumVariant/create-terrariumVariant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 201 || result.status === 200) {
        notification.success({
          message: 'Thành công',
          description: 'Variant đã được tạo thành công!',
          placement: 'topRight',
        });
        
        navigate(`/manager/terrarium/${id}/variants`);
      } else {
        throw new Error(result.message || 'Failed to create variant');
      }
    } catch (error) {
      console.error('Error creating variant:', error);
      notification.error({
        message: 'Lỗi',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo variant',
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật thứ tự steps
  const steps = [
    { number: 1, title: 'Chọn bể', description: 'Chọn loại bể cho terrarium' },
    { number: 2, title: 'Phụ kiện', description: 'Chọn phụ kiện đi kèm' },
    { number: 3, title: 'Thông tin cơ bản', description: 'Nhập tên, tiền công và hình ảnh' },
    { number: 4, title: 'Xác nhận', description: 'Xem lại và tạo variant' }
  ];

  const canProceedFromStep1 = () => {
    return variantData.selectedTank !== null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to={`/manager/terrarium/${id}/variants`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại danh sách variants
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Tạo Variant Mới</h1>
          <p className="mt-2 text-gray-600">Terrarium #{id}</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              {steps.map((step, stepIdx) => (
                <li key={step.number} className={stepIdx !== steps.length - 1 ? 'flex-1' : ''}>
                  <div className="flex items-center">
                    <div className="relative flex items-center">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                          step.number < currentStep
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : step.number === currentStep
                            ? 'border-blue-600 text-blue-600 bg-white'
                            : 'border-gray-300 text-gray-400 bg-white'
                        }`}
                      >
                        {step.number < currentStep ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <span className="text-sm font-medium">{step.number}</span>
                        )}
                      </div>
                      <div className="ml-4 min-w-0">
                        <p className={`text-sm font-medium ${
                          step.number <= currentStep ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {step.title}
                        </p>
                        <p className="text-sm text-gray-500">{step.description}</p>
                      </div>
                    </div>
                    {stepIdx !== steps.length - 1 && (
                      <div
                        className={`flex-1 ml-4 h-0.5 ${
                          step.number < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Step Content */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-8">
            {/* Bước 1: Chọn loại bể */}
            {currentStep === 1 && (
              <Step1TankSelection
                selectedTank={variantData.selectedTank}
                onSelectionChange={handleTankSelectionChange}
                onNext={handleNext}
                onPrev={() => {}} // Không có bước trước
                showPrevButton={false}
              />
            )}

            {/* Bước 2: Chọn phụ kiện */}
            {currentStep === 2 && (
              <Step4Accessories
                selectedAccessories={variantData.accessories}
                onSelectionChange={handleAccessoriesChange}
                onNext={handleNext}
                onPrev={handlePrev}
                showPrevButton={true}
              />
            )}

            {/* Bước 3: Thông tin cơ bản (với tiền công) */}
            {currentStep === 3 && (
              <Step1BasicInfo
                data={variantData}
                onChange={handleBasicInfoChange}
                onNext={handleNext}
                onPrev={handlePrev}
                accessoriesTotal={calculateTankAndAccessoriesTotal()}
                showPrevButton={true}
              />
            )}

            {/* Bước 4: Review */}
            {currentStep === 4 && (
              <Step3Review
                data={variantData}
                availableAccessories={availableAccessories}
                onPrev={handlePrev}
                onSubmit={handleSubmit}
                loading={loading}
                accessoriesTotal={calculateTankAndAccessoriesTotal()}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateVariantPage;