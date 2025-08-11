import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'react-toastify';

interface ShapeFormData {
  shapeName: string;
  shapeDescription: string;
  shapeMaterial: string;
}

interface ShapeFormErrors {
  shapeName?: string;
  shapeDescription?: string;
  shapeMaterial?: string;
}

const ShapeCreate: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ShapeFormData>({
    shapeName: '',
    shapeDescription: '',
    shapeMaterial: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<ShapeFormErrors>({});

  const validateForm = useCallback((): boolean => {
    const errors: ShapeFormErrors = {};
    
    if (!formData.shapeName.trim()) {
      errors.shapeName = 'Tên hình dạng là bắt buộc';
    }
    if (!formData.shapeDescription.trim()) {
      errors.shapeDescription = 'Mô tả là bắt buộc';
    }
    if (!formData.shapeMaterial.trim()) {
      errors.shapeMaterial = 'Chất liệu là bắt buộc';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (formErrors[name as keyof ShapeFormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('authToken'); // Retrieve token from localStorage
      const response = await fetch('https://terarium.shop/api/Shape/add-shape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
          // Optionally redirect to login page
          // navigate('/login');
          throw new Error('Unauthorized');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 200 || response.status === 200) {
        toast.success('Hình dạng đã được tạo thành công!');
        navigate('/manager/shape/list');
      } else {
        throw new Error(result.message || 'Failed to create shape');
      }
    } catch (error) {
      console.error('Error creating shape:', error);
      toast.error('Có lỗi xảy ra khi tạo hình dạng');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/manager/shape/list')}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          disabled={isSubmitting}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thêm Hình dạng Mới</h1>
          <p className="text-gray-600">Tạo một hình dạng terrarium mới trong hệ thống</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin cơ bản</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên Hình dạng *
                  </label>
                  <input
                    type="text"
                    name="shapeName"
                    value={formData.shapeName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.shapeName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nhập tên hình dạng"
                    disabled={isSubmitting}
                  />
                  {formErrors.shapeName && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.shapeName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả *
                  </label>
                  <textarea
                    name="shapeDescription"
                    value={formData.shapeDescription}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.shapeDescription ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Mô tả chi tiết về hình dạng"
                    disabled={isSubmitting}
                  />
                  {formErrors.shapeDescription && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.shapeDescription}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chất liệu *
                    </label>
                    <input
                      type="text"
                      name="shapeMaterial"
                      value={formData.shapeMaterial}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.shapeMaterial ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Ví dụ: Thủy tinh, Nhựa, Gỗ"
                      disabled={isSubmitting}
                    />
                    {formErrors.shapeMaterial && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.shapeMaterial}</p>
                    )}
                  </div>
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
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isSubmitting ? 'Đang lưu...' : 'Lưu Hình dạng'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/manager/shape/list')}
                  disabled={isSubmitting}
                  className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

export default ShapeCreate;