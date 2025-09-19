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
  terrariumVariantId: number;
  terrariumId: number;
  variantName: string;
  price: number;
  urlImage: string;
  stockQuantity: number;
  imageFile: File | null;
  selectedTank: SelectedTank | null;
  accessories: SelectedAccessory[];
  laborCost: number;
}

const EditVariantPage: React.FC = () => {
  const { terrariumId, variantId } = useParams<{ terrariumId: string; variantId: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [availableAccessories, setAvailableAccessories] = useState<Accessory[]>([]);
  const [loadingAccessories, setLoadingAccessories] = useState(false);
  const [fetchingVariant, setFetchingVariant] = useState(true);

  const [variantData, setVariantData] = useState<VariantData>({
    terrariumVariantId: parseInt(variantId || '0'),
    terrariumId: parseInt(terrariumId || '0'),
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
      initializeData();
    }
  }, [terrariumId, variantId]);

  const initializeData = async () => {
    try {
      setFetchingVariant(true);
      setLoadingAccessories(true);
      
      // Fetch accessories first
      await fetchAvailableAccessories();
      
      // Then fetch variant data
      await fetchVariantData();
    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      setFetchingVariant(false);
      setLoadingAccessories(false);
    }
  };

  const fetchAvailableAccessories = async (): Promise<Accessory[]> => {
    try {
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
        return activeAccessories;
      } else {
        setAvailableAccessories([]);
        return [];
      }
    } catch (error) {
      console.error('Error fetching accessories:', error);
      setAvailableAccessories([]);
      return [];
    }
  };

  // Helper function để kiểm tra xem accessory có phải là tank không
  const isTankAccessory = (accessory: Accessory): boolean => {
    // Kiểm tra theo categoryId (giả sử categoryId = 6 là tank)
    if (accessory.categoryId === 6) return true;
    
    // Kiểm tra theo tên
    const name = accessory.name.toLowerCase();
    return name.includes('tank') || name.includes('bể') || name.includes('thủy tinh');
  };

  const fetchVariantData = async () => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        notification.error({
          message: 'Lỗi xác thực',
          description: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
          placement: 'topRight',
        });
        return;
      }

      const response = await fetch(`https://terarium.shop/api/TerrariumVariant/get-terrariumVariant/${variantId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 200 && result.data) {
        const variant = result.data;
        
        // Separate tank and other accessories
        let selectedTank: SelectedTank | null = null;
        const selectedAccessories: SelectedAccessory[] = [];
        
        for (const acc of variant.terrariumVariantAccessories) {
          // Find accessory in available accessories
          let accessory = availableAccessories.find(a => a.accessoryId === acc.accessoryId);
          
          // If accessory is not found in available accessories, fetch it individually
          if (!accessory) {
            try {
              const accessoryResponse = await fetch(`https://terarium.shop/api/Accessory/get/${acc.accessoryId}`);
              if (accessoryResponse.ok) {
                const accessoryResult = await accessoryResponse.json();
                if (accessoryResult.status === 200 && accessoryResult.data) {
                  accessory = accessoryResult.data;
                }
              }
            } catch (error) {
              console.error(`Error fetching accessory ${acc.accessoryId}:`, error);
            }
          }
          
          if (!accessory) {
            // Create placeholder if accessory can't be found
            accessory = {
              accessoryId: acc.accessoryId,
              name: `Unknown Accessory #${acc.accessoryId}`,
              size: '',
              description: '',
              price: 0,
              stockQuantity: 0,
              categoryId: 0,
              createdAt: '',
              updatedAt: '',
              status: '',
              accessoryImages: []
            };
          }

          // Kiểm tra xem accessory có phải là tank không
          if (isTankAccessory(accessory) && !selectedTank) {
            selectedTank = {
              accessoryId: acc.accessoryId,
              tank: {
                ...accessory,
                accessoryImages: accessory.accessoryImages || []
              } as Tank
            };
          } else if (!isTankAccessory(accessory)) {
            // Chỉ thêm vào accessories nếu không phải tank
            selectedAccessories.push({
              accessoryId: acc.accessoryId,
              quantity: acc.quantity,
              accessory: accessory
            });
          }
        }

        // Calculate initial accessories total (including tank)
        const tankPrice = selectedTank?.tank.price || 0;
        const accessoriesPrice = selectedAccessories.reduce((sum, acc) => sum + (acc.accessory.price * acc.quantity), 0);
        const totalAccessoriesPrice = tankPrice + accessoriesPrice;

        // Calculate laborCost as price - totalAccessoriesPrice
        const laborCost = variant.price - totalAccessoriesPrice;

        setVariantData({
          terrariumVariantId: variant.terrariumVariantId,
          terrariumId: variant.terrariumId,
          variantName: variant.variantName,
          price: variant.price,
          urlImage: variant.urlImage || '',
          stockQuantity: variant.stockQuantity,
          imageFile: null,
          selectedTank: selectedTank,
          accessories: selectedAccessories,
          laborCost: laborCost >= 0 ? laborCost : 0 // Ensure non-negative
        });
      } else {
        throw new Error(result.message || 'Failed to fetch variant data');
      }
    } catch (error) {
      console.error('Error fetching variant:', error);
      notification.error({
        message: 'Lỗi',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải dữ liệu variant',
        placement: 'topRight',
      });
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
        terrariumVariantId: variantData.terrariumVariantId,
        terrariumId: variantData.terrariumId,
        variantName: variantData.variantName,
        price: variantData.price,
        urlImage: imageUrl,
        stockQuantity: variantData.stockQuantity,
        accessories: allAccessories,
        updatedAt: new Date().toISOString()
      };

      const response = await fetch(`https://terarium.shop/api/TerrariumVariant/update-terrariumVariant/${variantId}`, {
        method: 'PUT',
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
      
      if (result.status === 200) {
        notification.success({
          message: 'Thành công',
          description: 'Variant đã được cập nhật thành công!',
          placement: 'topRight',
        });
        
        navigate(`/manager/terrarium/${terrariumId}/variants`);
      } else {
        throw new Error(result.message || 'Failed to update variant');
      }
    } catch (error) {
      console.error('Error updating variant:', error);
      notification.error({
        message: 'Lỗi',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật variant',
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật thứ tự steps giống create
  const steps = [
    { number: 1, title: 'Chọn bể', description: 'Chọn loại bể cho terrarium' },
    { number: 2, title: 'Phụ kiện', description: 'Chọn phụ kiện đi kèm' },
    { number: 3, title: 'Thông tin cơ bản', description: 'Nhập tên, tiền công và hình ảnh' },
    { number: 4, title: 'Xác nhận', description: 'Xem lại và cập nhật variant' }
  ];

  const canProceedFromStep1 = () => {
    return variantData.selectedTank !== null;
  };

  if (fetchingVariant || loadingAccessories) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-gray-600">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to={`/manager/terrarium/${terrariumId}/variants`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại danh sách variants
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa Variant</h1>
          <p className="mt-2 text-gray-600">Terrarium #{terrariumId} • Variant #{variantId}</p>
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

export default EditVariantPage;