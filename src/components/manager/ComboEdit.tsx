import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload, X, Image, ChevronLeft, ChevronRight } from 'lucide-react';
import { notification } from 'antd';
import Step4Accessories from './Step4Accessories';
import Step5TerrariumVariant from './Step5TerrariumVariant';

// Update the ComboFormData interface
interface ComboFormData {
  comboId: number;
  comboCategoryId: number;
  name: string;
  description: string;
  imageUrl: string;
  comboPrice: number;
  discountPercent: number;
  stockQuantity: number;
  isFeatured: boolean;
  items: {
    terrariumId?: number;
    terrariumVariantId?: number;
    accessoryId?: number;
    quantity: number;
  }[];
}

interface ComboFormErrors {
  comboCategoryId?: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  comboPrice?: string;
  discountPercent?: string;
  stockQuantity?: string;
  items?: string;
}

interface ComboCategory {
  comboCategoryId: number;
  name: string;
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

interface SelectedTerrariumVariant {
  terrariumVariantId: number;
  terrariumId: number;
  variantName: string;
  price: number;
  stockQuantity: number;
  urlImage: string | null;
  createdAt: string | null;
  updatedAt: string;
  terrariumName: string;
  quantity: number;
}

interface ComboData {
  comboId: number;
  comboCategoryId: number;
  categoryName: string;
  name: string;
  description: string;
  imageUrl: string;
  originalPrice: number;
  comboPrice: number;
  discountPercent: number;
  saveAmount: number;
  isActive: boolean;
  isFeatured: boolean;
  stockQuantity: number;
  soldQuantity: number;
  isInStock: boolean;
  items: {
    comboItemId: number;
    terrariumVariantId: number | null;
    accessoryId: number | null;
    productType: string;
    productName: string;
    productImage: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  createdAt: string;
}

interface TerrariumVariant {
  terrariumVariantId: number;
  terrariumId: number;
  variantName: string;
  price: number;
  stockQuantity: number;
  urlImage: string | null;
  createdAt: string | null;
  updatedAt: string;
}

interface Terrarium {
  terrariumId: number;
  terrariumName: string;
}

const ComboEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState<ComboFormData>({
    comboId: Number(id) || 0,
    comboCategoryId: 0,
    name: '',
    description: '',
    imageUrl: '',
    comboPrice: 0,
    discountPercent: 0,
    stockQuantity: 0,
    isFeatured: false,
    items: [],
  });
  
  const [formErrors, setFormErrors] = useState<ComboFormErrors>({});
  const [comboCategories, setComboCategories] = useState<ComboCategory[]>([]);
  
  // Step-specific states
  const [selectedAccessories, setSelectedAccessories] = useState<Accessory[]>([]);
  const [selectedTerrariumVariants, setSelectedTerrariumVariants] = useState<SelectedTerrariumVariant[]>([]);

  // Fetch combo categories and combo data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchingData(true);
        
        // Fetch Combo Categories
        const categoryResponse = await fetch('https://terarium.shop/api/ComboCategories');
        const categoryData = await categoryResponse.json();
        if (categoryData.status === 200) {
          setComboCategories(categoryData.data);
        }

        // Fetch combo data
        if (id) {
          const token = localStorage.getItem('authToken');
          const comboResponse = await fetch(`https://terarium.shop/api/Combos/${id}`, {
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
            },
          });
          if (!comboResponse.ok) throw new Error(`HTTP error! status: ${comboResponse.status}`);
          
          const comboResult = await comboResponse.json();
          if (comboResult.status === 200) {
            const combo: ComboData = comboResult.data;
            setFormData({
              comboId: combo.comboId,
              comboCategoryId: combo.comboCategoryId,
              name: combo.name,
              description: combo.description,
              imageUrl: combo.imageUrl,
              comboPrice: combo.comboPrice,
              discountPercent: combo.discountPercent,
              stockQuantity: combo.stockQuantity,
              isFeatured: combo.isFeatured,
              items: combo.items.map(item => ({
                accessoryId: item.accessoryId ?? undefined,
                terrariumVariantId: item.terrariumVariantId ?? undefined,
                quantity: item.quantity,
              })),
            });

            // Populate selected accessories and variants
            // First fetch all accessories and variants
            const accessoryResponse = await fetch('https://terarium.shop/api/Accessory/get-all?Pagination.PageNumber=1&Pagination.PageSize=1000');
            const accessoryData = await accessoryResponse.json();
            const allAccessories: Accessory[] = accessoryData.data?.results || [];

            const variantResponse = await fetch('https://terarium.shop/api/TerrariumVariant/get-all-terrariumVariant');
            const variantData = await variantResponse.json();
            const allVariants: TerrariumVariant[] = variantData.data || [];

            // Fetch terrariums for names
            const terrariumResponse = await fetch('https://terarium.shop/api/Terrarium/get-all?Pagination.PageNumber=1&Pagination.PageSize=1000');
            const terrariumData = await terrariumResponse.json();
            const allTerrariums: Terrarium[] = terrariumData.data?.results || [];

            // Map selected accessories
            const selectedAcc = combo.items
              .filter(item => item.accessoryId)
              .map(item => {
                const acc = allAccessories.find(a => a.accessoryId === item.accessoryId);
                return acc ? { ...acc } : null;
              })
              .filter(Boolean) as Accessory[];

            setSelectedAccessories(selectedAcc);

            // Map selected variants
            const selectedVar = combo.items
              .filter(item => item.terrariumVariantId)
              .map(item => {
                const variant = allVariants.find(v => v.terrariumVariantId === item.terrariumVariantId);
                if (variant) {
                  const terrarium = allTerrariums.find(t => t.terrariumId === variant.terrariumId);
                  return {
                    ...variant,
                    terrariumName: terrarium?.terrariumName || 'Unknown',
                    quantity: item.quantity,
                  };
                }
                return null;
              })
              .filter(Boolean) as SelectedTerrariumVariant[];

            setSelectedTerrariumVariants(selectedVar);
          }
        }
      } catch (error) {
        notification.error({
          message: 'Lỗi',
          description: 'Không thể tải dữ liệu.',
          placement: 'topRight',
        });
        navigate('/manager/combo/list');
      } finally {
        setFetchingData(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  // Update formData.items based on selections
  useEffect(() => {
    const items: ComboFormData['items'] = [];
    
    // Add accessories
    selectedAccessories.forEach(accessory => {
      items.push({
        accessoryId: accessory.accessoryId,
        quantity: 1, // Assuming quantity 1 for accessories as in create
      });
    });
    
    // Add terrarium variants
    selectedTerrariumVariants.forEach(variant => {
      items.push({
        terrariumId: variant.terrariumId,
        terrariumVariantId: variant.terrariumVariantId,
        quantity: variant.quantity,
      });
    });
    
    setFormData(prev => ({ ...prev, items }));
  }, [selectedAccessories, selectedTerrariumVariants]);

  // Image upload function
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('authToken');
    const response = await fetch('https://terarium.shop/api/Image/upload', {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const result = await response.json();
    return result.url;
  };

  // Handle file selection and upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      notification.error({
        message: 'Lỗi',
        description: 'Vui lòng chọn file hình ảnh.',
        placement: 'topRight',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      notification.error({
        message: 'Lỗi',
        description: 'Kích thước file không được vượt quá 5MB.',
        placement: 'topRight',
      });
      return;
    }

    setUploadingImage(true);
    try {
      const imageUrl = await uploadImage(file);
      setFormData(prev => ({ ...prev, imageUrl }));
      if (formErrors.imageUrl) {
        setFormErrors(prev => ({ ...prev, imageUrl: undefined }));
      }
      notification.success({
        message: 'Thành công',
        description: 'Upload hình ảnh thành công!',
        placement: 'topRight',
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      notification.error({
        message: 'Lỗi',
        description: `Không thể upload hình ảnh: ${error instanceof Error ? error.message : 'Unknown error'}`,
        placement: 'topRight',
      });
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Clear image
  const clearImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  const validateForm = useCallback((): boolean => {
    const errors: ComboFormErrors = {};

    if (!formData.comboCategoryId) {
      errors.comboCategoryId = 'Danh mục combo là bắt buộc';
    }
    if (!formData.name.trim()) {
      errors.name = 'Tên combo là bắt buộc';
    }
    if (!formData.description.trim()) {
      errors.description = 'Mô tả là bắt buộc';
    }
    if (!formData.imageUrl.trim()) {
      errors.imageUrl = 'Hình ảnh là bắt buộc';
    }
    if (formData.comboPrice <= 0) {
      errors.comboPrice = 'Giá combo phải lớn hơn 0';
    }
    if (formData.discountPercent < 0 || formData.discountPercent > 100) {
      errors.discountPercent = 'Tỷ lệ giảm giá phải từ 0 đến 100';
    }
    if (formData.stockQuantity < 0) {
      errors.stockQuantity = 'Số lượng tồn kho không thể âm';
    }
    if (formData.items.length === 0) {
      errors.items = 'Phải chọn ít nhất một phụ kiện hoặc biến thể terrarium';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const processedValue =
      type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
      name === 'comboCategoryId' || name === 'comboPrice' || name === 'discountPercent' || name === 'stockQuantity' 
        ? parseFloat(value) || 0 : value;

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    if (formErrors[name as keyof ComboFormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      notification.error({
        message: 'Lỗi',
        description: 'Vui lòng điền đầy đủ thông tin bắt buộc',
        placement: 'topRight',
      });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://terarium.shop/api/Combos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          notification.error({
            message: 'Lỗi',
            description: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
            placement: 'topRight',
          });
          throw new Error('Unauthorized');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 200) {
        notification.success({
          message: 'Thành công',
          description: 'Combo đã được cập nhật thành công!',
          placement: 'topRight',
        });
        navigate('/manager/combo/list');
      } else {
        throw new Error(result.message || 'Failed to update combo');
      }
    } catch (error) {
      console.error('Error updating combo:', error);
      notification.error({
        message: 'Lỗi',
        description: `Có lỗi xảy ra khi cập nhật combo: ${error instanceof Error ? error.message : 'Unknown error'}`,
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate basic info before proceeding
      const errors: ComboFormErrors = {};
      if (!formData.comboCategoryId) {
        errors.comboCategoryId = 'Danh mục combo là bắt buộc';
      }
      if (!formData.name.trim()) {
        errors.name = 'Tên combo là bắt buộc';
      }
      if (!formData.description.trim()) {
        errors.description = 'Mô tả là bắt buộc';
      }
      if (!formData.imageUrl.trim()) {
        errors.imageUrl = 'Hình ảnh là bắt buộc';
      }
      if (formData.comboPrice <= 0) {
        errors.comboPrice = 'Giá combo phải lớn hơn 0';
      }
      
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        notification.error({
          message: 'Lỗi',
          description: 'Vui lòng điền đầy đủ thông tin cơ bản trước khi tiếp tục.',
          placement: 'topRight',
        });
        return;
      }
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 3) {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInfoStep();
      case 2:
        return (
          <Step4Accessories
            selectedAccessories={selectedAccessories}
            onSelectionChange={setSelectedAccessories}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        );
      case 3:
        return (
          <Step5TerrariumVariant
            selectedTerrariumVariants={selectedTerrariumVariants}
            onSelectionChange={setSelectedTerrariumVariants}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        );
      default:
        return renderBasicInfoStep();
    }
  };

  const renderBasicInfoStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Bước 1: Thông tin cơ bản</h2>
        <p className="text-gray-600">Cập nhật thông tin cơ bản cho combo</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin cơ bản</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục Combo *</label>
                <select
                  name="comboCategoryId"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.comboCategoryId ? 'border-red-500' : 'border-gray-300'}`}
                  value={formData.comboCategoryId}
                  onChange={handleInputChange}
                  disabled={loading || fetchingData}
                >
                  <option value={0}>Chọn danh mục</option>
                  {comboCategories.map((category) => (
                    <option key={category.comboCategoryId} value={category.comboCategoryId}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {formErrors.comboCategoryId && <p className="mt-1 text-sm text-red-500">{formErrors.comboCategoryId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên Combo *</label>
                <input
                  type="text"
                  name="name"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Nhập tên combo"
                  disabled={loading || fetchingData}
                />
                {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả *</label>
                <textarea
                  name="description"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.description ? 'border-red-500' : 'border-gray-300'}`}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Nhập mô tả combo"
                  rows={4}
                  disabled={loading || fetchingData}
                />
                {formErrors.description && <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh *</label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                    disabled={loading || uploadingImage || fetchingData}
                  />
                  <label
                    htmlFor="image-upload"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 disabled:opacity-50"
                  >
                    {uploadingImage ? 'Đang upload...' : 'Upload hình ảnh'}
                  </label>
                  {formData.imageUrl && (
                    <div className="relative">
                      <img
                        src={formData.imageUrl}
                        alt="Combo"
                        className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCA0OEM0MCA0NC42ODYzIDQyLjY4NjMgNDIgNDYgNDJINDhDNTEuMzEzNyA0MiA1NCA0NC42ODYzIDU0IDQ4VjUwQzU0IDUzLjMxMzcgNTEuMzEzNyA1NiA0OCA1Nkg0NkM0Mi42ODYzIDU2IDQwIDUzLjMxMzcgNDAgNTBWNDhaIiBmaWxsPSIjOUI5Qjk4Ii8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMzIgMzJDMjcuNTgyIDMyIDI0IDM1LjU4MiAyNCA0MEwyNCA4OEMyNCA5Mi40MTggMjcuNTgyIDk2IDMyIDk2TDk2IDk2QzEwMC40MTggOTYgMTA0IDkyLjQxOCAxMDQgODhMMTA0IDQwQzEwNCAzNS41ODIgMTAwLjQxOCAzMiA5NiAzMkwzMiAzMlpNMzIgODhMNzIuODQzIDQ3LjE1N0M3My42MjUgNDYuMzc1IDc0Ljg3NSA0Ni4zNzUgNzUuNjU3IDQ3LjE1N0w4OCA2MEw5MiA1NkM5Mi43ODEgNTUuMjE5IDk0LjIxOSA1NS4yMTkgOTUgNTZMOTYgNTdWODhDOTYgODguNzk2IDk1LjM2NCA4OS40MyA5NC41NjggODkuNDNMMzIgODhaTTMyIDQwQzMyIDM5LjIwNCAzMi42MzYgMzguNTY4IDMzLjQzMiAzOC41NjhMNzYuNjYgMzguNTY4SDk2Qzk2Ljc5NiAzOC41NjggOTcuNDMyIDM5LjIwNCA5Ny40MzIgNDBWNDguNjU3TDkzIDUzLjY1N0w5MCA1MC42NTdDODkuMjE5IDQ5Ljg3NiA4Ny43ODEgNDkuODc2IDg3IDUwLjY1N0w4NiA1MS42NTdMODQgNTMuNjU3TDczLjI1NyA0NC4yNzVDNzIuNDc1IDQzLjQ5MyA3MS4xMjUgNDMuNDkzIDcwLjM0MyA0NC4yNzVMMzIgODIuNjE4TDMyIDQwWiIgZmlsbD0iIzlCOUI5OCIvPgo8L3N2Zz4K';
                        }}
                      />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        disabled={loading || fetchingData}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                {formErrors.imageUrl && <p className="mt-1 text-sm text-red-500">{formErrors.imageUrl}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Giá Combo *</label>
                <input
                  type="number"
                  name="comboPrice"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.comboPrice ? 'border-red-500' : 'border-gray-300'}`}
                  value={formData.comboPrice}
                  onChange={handleInputChange}
                  placeholder="Nhập giá combo"
                  min="0"
                  disabled={loading || fetchingData}
                />
                {formErrors.comboPrice && <p className="mt-1 text-sm text-red-500">{formErrors.comboPrice}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tỷ lệ Giảm giá (%)</label>
                <input
                  type="number"
                  name="discountPercent"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.discountPercent ? 'border-red-500' : 'border-gray-300'}`}
                  value={formData.discountPercent}
                  onChange={handleInputChange}
                  placeholder="Nhập tỷ lệ giảm giá"
                  min="0"
                  max="100"
                  disabled={loading || fetchingData}
                />
                {formErrors.discountPercent && <p className="mt-1 text-sm text-red-500">{formErrors.discountPercent}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng Tồn kho</label>
                <input
                  type="number"
                  name="stockQuantity"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.stockQuantity ? 'border-red-500' : 'border-gray-300'}`}
                  value={formData.stockQuantity}
                  onChange={handleInputChange}
                  placeholder="Nhập số lượng tồn kho"
                  min="0"
                  disabled={loading || fetchingData}
                />
                {formErrors.stockQuantity && <p className="mt-1 text-sm text-red-500">{formErrors.stockQuantity}</p>}
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleInputChange}
                    disabled={loading || fetchingData}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Combo Nổi bật</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Hành động</h3>
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleNext}
                disabled={loading || uploadingImage || fetchingData}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <span>Tiếp theo</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/manager/combo/list')}
                disabled={loading || uploadingImage || fetchingData}
                className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
            </div>
          </div>

          {/* Help */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-lg font-medium text-blue-900 mb-2">Hướng dẫn</h3>
            <div className="text-sm text-blue-700 space-y-2">
              <p>• Tên combo nên ngắn gọn và hấp dẫn</p>
              <p>• Mô tả chi tiết giúp khách hàng hiểu rõ về combo</p>
              <p>• Upload hình ảnh trực tiếp hoặc sử dụng URL</p>
              <p>• Giá combo và số lượng tồn kho phải hợp lý</p>
              <p>• Hình ảnh nên có chất lượng tốt và kích thước phù hợp</p>
            </div>
          </div>

          {/* Image Upload Tips */}
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h3 className="text-lg font-medium text-green-900 mb-2">
              <Image className="w-5 h-5 inline mr-2" />
              Mẹo Upload Ảnh
            </h3>
            <div className="text-sm text-green-700 space-y-2">
              <p>• Định dạng: JPG, PNG, GIF</p>
              <p>• Kích thước tối đa: 5MB</p>
              <p>• Tỷ lệ khuyến dùng: 1:1 (vuông) hoặc 4:3</p>
              <p>• Chất lượng cao để hiển thị đẹp trên website</p>
              <p>• Nền sáng, rõ nét, tập trung vào sản phẩm</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={() => navigate('/manager/combo/list')}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
          disabled={loading || fetchingData}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={loading || uploadingImage || fetchingData}
          className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Tiếp theo
        </button>
      </div>
    </div>
  );

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-4 text-gray-700">Đang tải dữ liệu combo...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/manager/combo/list')}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          disabled={loading}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sửa Combo</h1>
          <p className="text-gray-600">Cập nhật thông tin combo trong hệ thống</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === currentStep
                    ? 'bg-blue-600 text-white'
                    : step < currentStep
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step < currentStep ? '✓' : step}
              </div>
              {step < 3 && (
                <div
                  className={`flex-1 h-1 mx-4 ${
                    step < currentStep ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span className={currentStep === 1 ? 'font-medium text-blue-600' : ''}>
            Thông tin cơ bản
          </span>
          <span className={currentStep === 2 ? 'font-medium text-blue-600' : ''}>
            Chọn phụ kiện
          </span>
          <span className={currentStep === 3 ? 'font-medium text-blue-600' : ''}>
            Chọn Terrarium
          </span>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {renderStep()}
      </div>

      {/* Summary at final step */}
      {currentStep === 3 && (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tóm tắt Combo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Thông tin cơ bản</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Tên:</strong> {formData.name}</div>
                <div><strong>Danh mục:</strong> {comboCategories.find(c => c.comboCategoryId === formData.comboCategoryId)?.name}</div>
                <div><strong>Giá:</strong> {formData.comboPrice.toLocaleString()} VNĐ</div>
                <div><strong>Giảm giá:</strong> {formData.discountPercent}%</div>
                <div><strong>Tồn kho:</strong> {formData.stockQuantity}</div>
                <div><strong>Nổi bật:</strong> {formData.isFeatured ? 'Có' : 'Không'}</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Sản phẩm trong combo</h4>
              <div className="space-y-2 text-sm">
                {selectedAccessories.length > 0 && (
                  <div>
                    <strong>Phụ kiện ({selectedAccessories.length}):</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      {selectedAccessories.map(acc => (
                        <li key={acc.accessoryId}>{acc.name} - {acc.price.toLocaleString()} VNĐ</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedTerrariumVariants.length > 0 && (
                  <div>
                    <strong>Terrarium Variant ({selectedTerrariumVariants.length}):</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      {selectedTerrariumVariants.map(variant => (
                        <li key={variant.terrariumVariantId}>
                          {variant.terrariumName} - {variant.variantName} x{variant.quantity} - {(variant.price * variant.quantity).toLocaleString()} VNĐ
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {formData.items.length === 0 && (
                  <div className="text-gray-500 italic">Chưa chọn sản phẩm nào</div>
                )}
                
                <div className="pt-2 border-t border-gray-200">
                  <strong>Tổng giá trị sản phẩm: {(
                    selectedAccessories.reduce((sum, acc) => sum + acc.price, 0) +
                    selectedTerrariumVariants.reduce((sum, variant) => sum + (variant.price * variant.quantity), 0)
                  ).toLocaleString()} VNĐ</strong>
                </div>
              </div>
            </div>
          </div>
          
          {formData.imageUrl && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">Hình ảnh</h4>
              <img
                src={formData.imageUrl}
                alt="Combo preview"
                className="w-32 h-32 object-cover rounded-lg border border-gray-300"
              />
            </div>
          )}
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
                  disabled={loading}
                >
                  Quay lại
                </button>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || uploadingImage || formData.items.length === 0}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Cập nhật Combo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComboEdit;