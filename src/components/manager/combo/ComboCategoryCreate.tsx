import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { notification } from 'antd';

interface ComboCategoryFormData {
  name: string;
  description: string;
  displayOrder: number;
}

interface ComboCategoryFormErrors {
  name?: string;
  description?: string;
  displayOrder?: string;
}

const ComboCategoryCreate: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ComboCategoryFormData>({
    name: '',
    description: '',
    displayOrder: 0,
  });
  const [formErrors, setFormErrors] = useState<ComboCategoryFormErrors>({});

  const validateForm = useCallback((): boolean => {
    const errors: ComboCategoryFormErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Tên danh mục là bắt buộc';
    }
    if (!formData.description.trim()) {
      errors.description = 'Mô tả là bắt buộc';
    }
    if (formData.displayOrder < 0) {
      errors.displayOrder = 'Thứ tự hiển thị không thể âm';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const processedValue = name === 'displayOrder' ? parseInt(value) || 0 : value;
    
    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    if (formErrors[name as keyof ComboCategoryFormErrors]) {
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
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://terarium.shop/api/ComboCategories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          displayOrder: formData.displayOrder,
        }),
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
          description: 'Danh mục gói quà đã được tạo thành công!',
          placement: 'topRight',
        });
        navigate('/manager/combo-category/list');
      } else {
        throw new Error(result.message || 'Failed to create combo category');
      }
    } catch (error) {
      console.error('Error creating combo category:', error);
      notification.error({
        message: 'Lỗi',
        description: `Có lỗi xảy ra khi tạo danh mục: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
          onClick={() => navigate('/manager/combo-category/list')}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          disabled={loading}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thêm Danh mục Gói quà Mới</h1>
          <p className="text-gray-600">Tạo một danh mục gói quà combo mới trong hệ thống</p>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên Danh mục *
                  </label>
                  <input
                    type="text"
                    name="name"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nhập tên danh mục gói quà"
                    disabled={loading}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
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
                    placeholder="Mô tả chi tiết về danh mục gói quà"
                    disabled={loading}
                  />
                  {formErrors.description && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thứ tự hiển thị
                  </label>
                  <input
                    type="number"
                    name="displayOrder"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.displayOrder ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.displayOrder}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    disabled={loading}
                  />
                  {formErrors.displayOrder && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.displayOrder}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Số thứ tự để sắp xếp hiển thị danh mục. Số nhỏ hơn sẽ hiển thị trước.
                  </p>
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
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Đang lưu...' : 'Lưu Danh mục'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/manager/combo-category/list')}
                  disabled={loading}
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
                <p>• Tên danh mục nên ngắn gọn và dễ hiểu</p>
                <p>• Mô tả chi tiết giúp khách hàng hiểu rõ hơn về nhóm sản phẩm</p>
                <p>• Thứ tự hiển thị quyết định vị trí xuất hiện trên giao diện</p>
                <p>• Danh mục mới tạo sẽ có trạng thái hoạt động mặc định</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ComboCategoryCreate;