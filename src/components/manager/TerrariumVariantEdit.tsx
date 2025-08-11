import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, Upload, ImageIcon } from 'lucide-react';
import { notification } from 'antd';

interface TerrariumVariant {
  terrariumVariantId: number;
  terrariumId: number;
  variantName: string;
  price: number;
  stockQuantity: number;
  urlImage: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  layoutTerrarium: any[];
  orderItems: any[];
  promotionTerrariumVariants: any[];
  terrarium: any;
}

interface ApiResponse {
  status: number;
  message: string;
  data: TerrariumVariant;
}

interface UpdateVariantData {
  terrariumVariantId: number;
  terrariumId: number;
  variantName: string;
  price: number;
  stockQuantity: number;
  imageFile: File | null;
  updatedAt: string;
}

const EditTerrariumVariant: React.FC = () => {
  const { id, variantId } = useParams<{ id: string; variantId: string }>();
  const navigate = useNavigate();
  
  const [variant, setVariant] = useState<TerrariumVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<UpdateVariantData>({
    terrariumVariantId: parseInt(variantId || '0'),
    terrariumId: parseInt(id || '0'),
    variantName: '',
    price: 0,
    stockQuantity: 0,
    imageFile: null,
    updatedAt: new Date().toISOString()
  });

  // Add state for image preview
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (variantId) {
      fetchVariant(variantId);
    }
  }, [variantId]);

  const fetchVariant = async (variantId: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching variant with ID:', variantId);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`https://terarium.shop/api/TerrariumVariant/get-terrariumVariant/${variantId}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse = await response.json();
      console.log('API Response data:', result);
      
      if (result.status === 200 && result.data) {
        setVariant(result.data);
        setCurrentImageUrl(result.data.urlImage);
        
        // Set form data with fetched variant data
        setFormData({
          terrariumVariantId: result.data.terrariumVariantId,
          terrariumId: result.data.terrariumId,
          variantName: result.data.variantName,
          price: result.data.price,
          stockQuantity: result.data.stockQuantity,
          imageFile: null,
          updatedAt: new Date().toISOString()
        });
        console.log('Variant data loaded successfully');
      } else {
        throw new Error(result.message || 'Failed to fetch variant');
      }
    } catch (error) {
      console.error('Error fetching variant:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        setError('Request timeout - API took too long to respond');
        notification.error({
          message: 'Lỗi',
          description: 'Yêu cầu quá thời gian - API phản hồi chậm',
          placement: 'topRight',
        });
      } else {
        setError(error instanceof Error ? error.message : 'An error occurred while fetching variant');
        notification.error({
          message: 'Lỗi',
          description: error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải dữ liệu',
          placement: 'topRight',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        notification.error({
          message: 'Lỗi',
          description: 'Vui lòng chọn file hình ảnh',
          placement: 'topRight',
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        notification.error({
          message: 'Lỗi',
          description: 'Kích thước file không được vượt quá 5MB',
          placement: 'topRight',
        });
        return;
      }

      setFormData({ ...formData, imageFile: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.variantName.trim()) {
      notification.error({
        message: 'Lỗi',
        description: 'Vui lòng nhập tên variant',
        placement: 'topRight',
      });
      return;
    }

    if (formData.price <= 0) {
      notification.error({
        message: 'Lỗi',
        description: 'Giá phải lớn hơn 0',
        placement: 'topRight',
      });
      return;
    }

    if (formData.stockQuantity < 0) {
      notification.error({
        message: 'Lỗi',
        description: 'Số lượng tồn kho không được âm',
        placement: 'topRight',
      });
      return;
    }

    try {
      setSaving(true);
      
      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();
      
      // Add fields according to API specification
      formDataToSend.append('TerrariumVariantId', formData.terrariumVariantId.toString());
      formDataToSend.append('TerrariumId', formData.terrariumId.toString());
      formDataToSend.append('VariantName', formData.variantName);
      formDataToSend.append('Price', formData.price.toString());
      formDataToSend.append('StockQuantity', formData.stockQuantity.toString());
      formDataToSend.append('UpdatedAt', new Date().toISOString());
      
      // Add image file if selected
      if (formData.imageFile) {
        formDataToSend.append('ImageFile', formData.imageFile);
      }

      const response = await fetch(`https://terarium.shop/api/TerrariumVariant/update-terrariumVariant/${variantId}`, {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyIiwidW5pcXVlX25hbWUiOiJhZG1pbiIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFkbWluIiwiZW1haWwiOiJzdHJpbmdAZ21haWwuY29tIiwiZnVsbE5hbWUiOiJOWFF1YW5nbmciLCJwaG9uZU51bWJlciI6InN0cmluZyIsImdlbmRlciI6Im1hbGUiLCJzdGF0dXMiOiJBY3RpdmUiLCJleHAiOjE3NTMyODA4OTIsImlzcyI6IlRlcnJhcml1bUdhcmRlblRlY2hBUEkiLCJhdWQiOiJUZXJyYXJpdW1HYXJkZW5UZWNoQ2xpZW50In0._pF1a4g9arjGAKmpoej0n913oI2RB0XkXbAxRCGRqJ8'
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 200 || result.status === 201) {
        notification.success({
          message: 'Thành công',
          description: 'Variant đã được cập nhật thành công!',
          placement: 'topRight',
        });
        
        // Navigate back to variants list
        navigate(`/manager/terrarium/${id}/variants`);
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
      setSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  if (error || !variant) {
    return (
      <div className="space-y-4">
        <Link
          to={`/manager/terrarium/${id}/variants`}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách variants
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="text-red-500">❌</div>
            <div>
              <h3 className="text-red-800 font-medium">Có lỗi xảy ra</h3>
              <p className="text-red-600">{error || 'Không tìm thấy variant'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to={`/manager/terrarium/${id}/variants`}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Chỉnh sửa Variant #{variantId}
          </h1>
          <p className="text-gray-600">Cập nhật thông tin variant của terrarium</p>
        </div>
      </div>

      {/* Current Variant Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <div className="text-blue-500 mt-0.5">ℹ️</div>
          <div>
            <h3 className="text-blue-800 font-medium">Thông tin hiện tại</h3>
            <ul className="text-blue-700 text-sm mt-1 space-y-1">
              <li>• ID Variant: {variant.terrariumVariantId}</li>
              <li>• ID Terrarium: {variant.terrariumId}</li>
              <li>• Tên: {variant.variantName}</li>
              <li>• Giá: {formatPrice(variant.price)}</li>
              <li>• Tồn kho: {variant.stockQuantity}</li>
              <li>• Ngày tạo: {formatDate(variant.createdAt)}</li>
              <li>• Cập nhật lần cuối: {formatDate(variant.updatedAt)}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900">Chỉnh sửa thông tin Variant</h3>
          <p className="text-gray-600 text-sm">Cập nhật các thông tin cần thiết cho variant</p>
        </div>

        <form onSubmit={handleUpdateVariant} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Terrarium ID
              </label>
              <input
                type="number"
                value={formData.terrariumId}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Variant ID
              </label>
              <input
                type="number"
                value={formData.terrariumVariantId}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên Variant <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.variantName}
              onChange={(e) => setFormData({ ...formData, variantName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập tên variant..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá (VND) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
                step="1000"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Hiện tại: {formatPrice(variant.price)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số lượng tồn kho <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Hiện tại: {variant.stockQuantity}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hình ảnh
            </label>
            
            {/* Current Image */}
            {currentImageUrl && !imagePreview && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Hình ảnh hiện tại:</p>
                <img
                  src={currentImageUrl}
                  alt="Current variant"
                  className="h-32 w-32 object-cover rounded-lg border border-gray-200"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Upload New Image */}
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
              <div className="space-y-1 text-center">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mx-auto h-32 w-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, imageFile: null });
                        setImagePreview(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="image-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>{currentImageUrl ? 'Thay đổi hình ảnh' : 'Tải lên file'}</span>
                        <input
                          id="image-upload"
                          name="image-upload"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleImageChange}
                        />
                      </label>
                      <p className="pl-1">hoặc kéo thả</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF tối đa 5MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link
              to={`/manager/terrarium/${id}/variants`}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center"
            >
              <X className="w-4 h-4 mr-2" />
              Hủy
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTerrariumVariant;