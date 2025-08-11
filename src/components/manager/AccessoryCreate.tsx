import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { notification } from 'antd';
import axios from 'axios';

interface AccessoryFormData {
  name: string;
  size: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: number;
  status: string;
}

interface AccessoryFormErrors {
  name?: string;
  size?: string;
  description?: string;
  price?: string;
  stockQuantity?: string;
  categoryId?: string;
}

interface Category {
  categoryId: number;
  categoryName: string;
  description: string;
}

const AccessoryCreate: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<AccessoryFormData>({
    name: '',
    size: '',
    description: '',
    price: 0,
    stockQuantity: 0,
    categoryId: 0,
    status: 'active',
  });
  const [formErrors, setFormErrors] = useState<AccessoryFormErrors>({});

  const validateForm = useCallback((): boolean => {
    const errors: AccessoryFormErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Tên phụ kiện là bắt buộc';
    }
    if (!formData.size.trim()) {
      errors.size = 'Kích thước là bắt buộc';
    }
    if (!formData.description.trim()) {
      errors.description = 'Mô tả là bắt buộc';
    }
    if (formData.price <= 0) {
      errors.price = 'Giá phải lớn hơn 0';
    }
    if (formData.stockQuantity < 0) {
      errors.stockQuantity = 'Số lượng phải lớn hơn hoặc bằng 0';
    }
    if (formData.categoryId === 0) {
      errors.categoryId = 'Danh mục là bắt buộc';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const token = localStorage.getItem('authToken'); // Retrieve token from localStorage
        const response = await axios.get('https://terarium.shop/api/Category/get-all', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });
        if (response.data.status === 200) {
          setCategories(response.data.data);
        } else {
          throw new Error('Không thể tải danh sách danh mục');
        }
      } catch (error: any) {
        console.error('Error fetching categories:', error);
        if (error.response?.status === 401) {
          notification.error({
            message: 'Lỗi',
            description: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
            placement: 'topRight',
          });
          // Optionally redirect to login page
          // navigate('/login');
        } else {
          notification.error({
            message: 'Lỗi',
            description: error.response?.data?.message || 'Có lỗi xảy ra khi tải danh mục',
            placement: 'topRight',
          });
        }
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'stockQuantity' || name === 'categoryId' ? Number(value) : value,
    }));

    if (formErrors[name as keyof AccessoryFormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
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
      const token = localStorage.getItem('authToken'); // Retrieve token from localStorage
      const payload = {
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const response = await axios.post('https://terarium.shop/api/Accessory/add-accessory', payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      
      if (response.data.status === 200 || response.status === 200 || response.status === 201) {
        notification.success({
          message: 'Thành công',
          description: 'Phụ kiện đã được tạo thành công!',
          placement: 'topRight',
        });
        navigate('/manager/accessory/list');
      } else {
        throw new Error(response.data?.message || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      console.error('Error creating accessory:', error);
      if (error.response?.status === 401) {
        notification.error({
          message: 'Lỗi',
          description: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
          placement: 'topRight',
        });
        // Optionally redirect to login page
        // navigate('/login');
      } else {
        notification.error({
          message: 'Lỗi',
          description: error.response?.data?.message || 'Có lỗi xảy ra khi tạo phụ kiện',
          placement: 'topRight',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingCategories) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Đang tải danh mục...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/manager/accessory/list')}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          disabled={loading}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thêm Phụ kiện Mới</h1>
          <p className="text-gray-600">Tạo một phụ kiện mới trong hệ thống</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin cơ bản</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên Phụ kiện *
                  </label>
                  <input
                    type="text"
                    name="name"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nhập tên phụ kiện"
                    disabled={loading}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kích thước *
                  </label>
                  <input
                    type="text"
                    name="size"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.size ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.size}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: 10x15 cm"
                    disabled={loading}
                  />
                  {formErrors.size && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.size}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả *
                  </label>
                  <textarea
                    name="description"
                    rows={4}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Mô tả chi tiết về phụ kiện"
                    disabled={loading}
                  />
                  {formErrors.description && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giá (VNĐ) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      min="0"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.price ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0"
                      disabled={loading}
                    />
                    {formErrors.price && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.price}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số lượng *
                    </label>
                    <input
                      type="number"
                      name="stockQuantity"
                      min="0"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.stockQuantity ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={formData.stockQuantity}
                      onChange={handleInputChange}
                      placeholder="0"
                      disabled={loading}
                    />
                    {formErrors.stockQuantity && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.stockQuantity}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Danh mục *
                  </label>
                  <select
                    name="categoryId"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.categoryId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    disabled={loading}
                  >
                    <option value="0">Chọn danh mục</option>
                    {categories.map((category) => (
                      <option key={category.categoryId} value={category.categoryId}>
                        {category.categoryName}
                      </option>
                    ))}
                  </select>
                  {formErrors.categoryId && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.categoryId}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Trạng thái</h3>
              <select
                name="status"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.status}
                onChange={handleInputChange}
                disabled={loading}
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </select>
            </div>

            {/* Actions */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Đang lưu...' : 'Lưu Phụ kiện'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/manager/accessory/list')}
                  className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AccessoryCreate;