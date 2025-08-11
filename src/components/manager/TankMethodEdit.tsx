import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { notification } from 'antd';

interface TankMethodFormData {
  tankMethodId: number;
  tankMethodType: string;
  tankMethodDescription: string;
}

interface TankMethodFormErrors {
  tankMethodType?: string;
  tankMethodDescription?: string;
}

const TankMethodEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<TankMethodFormData>({
    tankMethodId: 0,
    tankMethodType: '',
    tankMethodDescription: '',
  });
  const [formErrors, setFormErrors] = useState<TankMethodFormErrors>({});

  const validateForm = useCallback((): boolean => {
    const errors: TankMethodFormErrors = {};

    if (!formData.tankMethodType.trim()) {
      errors.tankMethodType = 'Loại bể là bắt buộc';
    }
    if (!formData.tankMethodDescription.trim()) {
      errors.tankMethodDescription = 'Mô tả là bắt buộc';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Load existing tank method data
  useEffect(() => {
    const loadTankMethod = async () => {
      try {
        setInitialLoading(true);
        setError(null);
        
        const token = localStorage.getItem('authToken'); // Retrieve token from localStorage
        const response = await fetch(`https://terarium.shop/api/TankMethod/get/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            notification.error({
              message: 'Lỗi',
              description: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
              placement: 'topRight',
            });
            // Optionally redirect to login page
            // navigate('/login');
            throw new Error('Unauthorized');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 200 && result.data) {
          setFormData({
            tankMethodId: result.data.tankMethodId,
            tankMethodType: result.data.tankMethodType,
            tankMethodDescription: result.data.tankMethodDescription,
          });
        } else {
          throw new Error(result.message || 'Failed to load tank method');
        }
      } catch (error) {
        console.error('Error loading tank method:', error);
        setError(error instanceof Error ? error.message : 'An error occurred while loading tank method');
        notification.error({
          message: 'Lỗi',
          description: 'Có lỗi xảy ra khi tải dữ liệu loại bể',
          placement: 'topRight',
        });
      } finally {
        setInitialLoading(false);
      }
    };

    if (id) {
      loadTankMethod();
    }
  }, [id, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    if (formErrors[name as keyof TankMethodFormErrors]) {
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
    setError(null);

    try {
      const token = localStorage.getItem('authToken'); // Retrieve token from localStorage
      const response = await fetch(`https://terarium.shop/api/TankMethod/update-tankmethod/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          tankMethodId: formData.tankMethodId,
          tankMethodType: formData.tankMethodType,
          tankMethodDescription: formData.tankMethodDescription,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          notification.error({
            message: 'Lỗi',
            description: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
            placement: 'topRight',
          });
          // Optionally redirect to login page
          // navigate('/login');
          throw new Error('Unauthorized');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 200) {
        notification.success({
          message: 'Thành công',
          description: 'Bể đã được cập nhật thành công!',
          placement: 'topRight',
        });
        navigate('/manager/tank-method/list');
      } else {
        throw new Error(result.message || 'Failed to update tank method');
      }
    } catch (error) {
      console.error('Error updating tank method:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Có lỗi xảy ra khi cập nhật bể: ${errorMessage}`);
      notification.error({
        message: 'Lỗi',
        description: `Có lỗi xảy ra khi cập nhật bể: ${errorMessage}`,
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="text-red-500">❌</div>
          <div>
            <h3 className="text-red-800 font-medium">Có lỗi xảy ra</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => navigate('/manager/tank-method/list')}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/manager/tank-method/list')}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          disabled={loading}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa loại bể</h1>
          <p className="text-gray-600">Cập nhật thông tin loại bể #{formData.tankMethodId}</p>
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
                    Loại bể *
                  </label>
                  <input
                    type="text"
                    name="tankMethodType"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.tankMethodType ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.tankMethodType}
                    onChange={handleInputChange}
                    placeholder="Nhập loại bể"
                    disabled={loading}
                  />
                  {formErrors.tankMethodType && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.tankMethodType}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả *
                  </label>
                  <textarea
                    name="tankMethodDescription"
                    rows={4}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.tankMethodDescription ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.tankMethodDescription}
                    onChange={handleInputChange}
                    placeholder="Mô tả chi tiết về loại bể"
                    disabled={loading}
                  />
                  {formErrors.tankMethodDescription && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.tankMethodDescription}</p>
                  )}
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
                  <span>{loading ? 'Đang cập nhật...' : 'Cập nhật loại bể'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/manager/tank-method/list')}
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

export default TankMethodEdit;