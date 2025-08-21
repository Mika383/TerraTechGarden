import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Upload, X, Image } from 'lucide-react';
import { notification } from 'antd';

interface ComboFormData {
  comboCategoryId: number;
  name: string;
  description: string;
  imageUrl: string;
  comboPrice: number;
  discountPercent: number;
  stockQuantity: number;
  isFeatured: boolean;
  items: { accessoryId?: number; terrariumVariantId?: number; quantity: number }[];
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

interface TerrariumVariant {
  terrariumVariantId: number;
  variantName: string;
}

interface Accessory {
  accessoryId: number;
  name: string;
}

const ComboCreate: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState<ComboFormData>({
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
  const [terrariumVariants, setTerrariumVariants] = useState<TerrariumVariant[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [newItem, setNewItem] = useState<{ type: 'accessory' | 'terrariumVariant'; id: number; quantity: number }>({
    type: 'accessory',
    id: 0,
    quantity: 1,
  });

  // Fetch combo categories, terrarium variants, and accessories
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Combo Categories
        const categoryResponse = await fetch('https://terarium.shop/api/ComboCategories');
        const categoryData = await categoryResponse.json();
        if (categoryData.status === 200) {
          setComboCategories(categoryData.data);
        }

        // Fetch Terrarium Variants
        const variantResponse = await fetch('https://terarium.shop/api/TerrariumVariant/get-all-terrariumVariant');
        const variantData = await variantResponse.json();
        if (variantData.status === 200) {
          setTerrariumVariants(variantData.data);
        }

        // Fetch Accessories
        const accessoryResponse = await fetch('https://terarium.shop/api/Accessory/get-all?Pagination.PageNumber=1&Pagination.PageSize=100');
        const accessoryData = await accessoryResponse.json();
        if (accessoryData.status === 200) {
          setAccessories(accessoryData.data.results);
        }
      } catch (error) {
        notification.error({
          message: 'Lỗi',
          description: 'Không thể tải dữ liệu danh mục hoặc phụ kiện.',
          placement: 'topRight',
        });
      }
    };
    fetchData();
  }, []);

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
      // Clear the input value so the same file can be selected again
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
      type === 'checkbox' ? (e.target as HTMLInputElement).checked : name === 'comboCategoryId' || name === 'comboPrice' || name === 'discountPercent' || name === 'stockQuantity' ? parseFloat(value) || 0 : value;

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    if (formErrors[name as keyof ComboFormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleNewItemChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 1 : name === 'id' ? parseInt(value) || 0 : value,
    }));
  };

  const addItem = () => {
    if (newItem.id === 0 || newItem.quantity <= 0) {
      notification.error({
        message: 'Lỗi',
        description: 'Vui lòng chọn phụ kiện/biến thể và số lượng hợp lệ',
        placement: 'topRight',
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          [newItem.type === 'accessory' ? 'accessoryId' : 'terrariumVariantId']: newItem.id,
          quantity: newItem.quantity,
        },
      ],
    }));
    setNewItem({ type: 'accessory', id: 0, quantity: 1 });
    setFormErrors((prev) => ({ ...prev, items: undefined }));
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const response = await fetch('https://terarium.shop/api/Combos', {
        method: 'POST',
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

      if (result.status === 200 || result.status === 201) {
        notification.success({
          message: 'Thành công',
          description: 'Combo đã được tạo thành công!',
          placement: 'topRight',
        });
        navigate('/manager/combo/list');
      } else {
        throw new Error(result.message || 'Failed to create combo');
      }
    } catch (error) {
      console.error('Error creating combo:', error);
      notification.error({
        message: 'Lỗi',
        description: `Có lỗi xảy ra khi tạo combo: ${error instanceof Error ? error.message : 'Unknown error'}`,
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Thêm Combo Mới</h1>
          <p className="text-gray-600">Tạo một combo mới trong hệ thống</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
                    disabled={loading}
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
                    disabled={loading}
                  />
                  {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả *</label>
                  <textarea
                    name="description"
                    rows={4}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.description ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Mô tả chi tiết về combo"
                    disabled={loading}
                  />
                  {formErrors.description && <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>}
                </div>

                {/* Enhanced Image Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh Combo *</label>
                  
                  {/* Image Upload Options */}
                  <div className="space-y-4">
                    {/* File Upload */}
                    <div>
                      <div className="flex items-center space-x-4">
                        <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 border-2 border-dashed border-blue-300 rounded-lg p-4 flex items-center space-x-2 transition-colors">
                          <Upload className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium text-blue-600">
                            {uploadingImage ? 'Đang upload...' : 'Chọn file từ máy tính'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={loading || uploadingImage}
                            className="hidden"
                          />
                        </label>
                        {uploadingImage && (
                          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Chấp nhận: JPG, PNG, GIF (tối đa 5MB)</p>
                    </div>

                    {/* URL Input */}
                    <div className="relative">
                      <input
                        type="text"
                        name="imageUrl"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.imageUrl ? 'border-red-500' : 'border-gray-300'}`}
                        value={formData.imageUrl}
                        onChange={handleInputChange}
                        placeholder="Hoặc nhập URL hình ảnh"
                        disabled={loading}
                      />
                      {formData.imageUrl && (
                        <button
                          type="button"
                          onClick={clearImage}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          disabled={loading}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Image Preview */}
                    {formData.imageUrl && (
                      <div className="mt-4">
                        <div className="relative inline-block">
                          <img
                            src={formData.imageUrl}
                            alt="Preview"
                            className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCA0OEM0MCA0NC42ODYzIDQyLjY4NjMgNDIgNDYgNDJINDhDNTEuMzEzNyA0MiA1NCA0NC42ODYzIDU0IDQ4VjUwQzU0IDUzLjMxMzcgNTEuMzEzNyA1NiA0OCA1Nkg0NkM0Mi42ODYzIDU2IDQwIDUzLjMxMzcgNDAgNTBWNDhaIiBmaWxsPSIjOUI5Qjk4Ii8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMzIgMzJDMjcuNTgyIDMyIDI0IDM1LjU4MiAyNCA0MEwyNCA4OEMyNCA5Mi40MTggMjcuNTgyIDk2IDMyIDk2TDk2IDk2QzEwMC40MTggOTYgMTA0IDkyLjQxOCAxMDQgODhMMTA0IDQwQzEwNCAzNS41ODIgMTAwLjQxOCAzMiA5NiAzMkwzMiAzMlpNMzIgODhMNzIuODQzIDQ3LjE1N0M3My42MjUgNDYuMzc1IDc0Ljg3NSA0Ni4zNzUgNzUuNjU3IDQ3LjE1N0w4OCA2MEw5MiA1NkM5Mi43ODEgNTUuMjE5IDk0LjIxOSA1NS4yMTkgOTUgNTZMOTYgNTdWODhDOTYgODguNzk2IDk1LjM2NCA4OS40MyA5NC41NjggODkuNDNMMzIgODhaTTMyIDQwQzMyIDM5LjIwNCAzMi42MzYgMzguNTY4IDMzLjQzMiAzOC41NjhMNzYuNjYgMzguNTY4SDk2Qzk2Ljc5NiAzOC41NjggOTcuNDMyIDM5LjIwNCA5Ny40MzIgNDBWNDguNjU3TDkzIDUzLjY1N0w5MCA1MC42NTdDODkuMjE5IDQ5Ljg3NiA4Ny43ODEgNDkuODc2IDg3IDUwLjY1N0w4NiA1MS42NTdMODQgNTMuNjU3TDczLjI1NyA0NC4yNzVDNzIuNDc1IDQzLjQ5MyA3MS4xMjUgNDMuNDkzIDcwLjM0MyA0NC4yNzVMMzIgODIuNjE4TDMyIDQwWiIgZmlsbD0iIzlCOUI5OCIvPgo8L3N2Zz4K';
                            }}
                          />
                          <button
                            type="button"
                            onClick={clearImage}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            disabled={loading}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
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
                    disabled={loading}
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
                    disabled={loading}
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
                    disabled={loading}
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
                      disabled={loading}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Combo Nổi bật</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Items Selection */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Chọn Phụ kiện/Terrarium Variant</h3>
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại</label>
                    <select
                      name="type"
                      value={newItem.type}
                      onChange={handleNewItemChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                    >
                      <option value="accessory">Phụ kiện</option>
                      <option value="terrariumVariant">Terrarium Variant</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên</label>
                    <select
                      name="id"
                      value={newItem.id}
                      onChange={handleNewItemChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                    >
                      <option value={0}>Chọn {newItem.type === 'accessory' ? 'phụ kiện' : 'biến thể'}</option>
                      {newItem.type === 'accessory'
                        ? accessories.map((accessory) => (
                            <option key={accessory.accessoryId} value={accessory.accessoryId}>
                              {accessory.name}
                            </option>
                          ))
                        : terrariumVariants.map((variant) => (
                            <option key={variant.terrariumVariantId} value={variant.terrariumVariantId}>
                              {variant.variantName}
                            </option>
                          ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng</label>
                    <input
                      type="number"
                      name="quantity"
                      value={newItem.quantity}
                      onChange={handleNewItemChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addItem}
                    className="mt-8 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    disabled={loading}
                  >
                    Thêm
                  </button>
                </div>
                {formErrors.items && <p className="mt-1 text-sm text-red-500">{formErrors.items}</p>}

                {/* Display selected items */}
                {formData.items.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700">Danh sách mục đã chọn:</h4>
                    <ul className="mt-2 space-y-2">
                      {formData.items.map((item, index) => (
                        <li key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <span>
                            {item.accessoryId
                              ? accessories.find((a) => a.accessoryId === item.accessoryId)?.name
                              : terrariumVariants.find((v) => v.terrariumVariantId === item.terrariumVariantId)?.variantName}{' '}
                            (Số lượng: {item.quantity})
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:text-red-700"
                            disabled={loading}
                          >
                            Xóa
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
                  type="submit"
                  disabled={loading || uploadingImage}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Đang lưu...' : 'Lưu Combo'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/manager/combo/list')}
                  disabled={loading || uploadingImage}
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
                <p>• Chọn ít nhất một phụ kiện hoặc biến thể terrarium</p>
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
                <p>• Tỷ lệ khuyên dùng: 1:1 (vuông) hoặc 4:3</p>
                <p>• Chất lượng cao để hiển thị đẹp trên website</p>
                <p>• Nền sáng, rõ nét, tập trung vào sản phẩm</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ComboCreate;