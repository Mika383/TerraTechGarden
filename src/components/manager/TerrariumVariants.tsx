import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Plus, Package, DollarSign, Box, Calendar, Image as ImageIcon } from 'lucide-react';
import { notification } from 'antd';

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

interface TerrariumVariantAccessory {
  terrariumVariantAccessoryId: number;
  terrariumVariantId: number;
  accessoryId: number;
  quantity: number;
}

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
  terrariumVariantAccessories: TerrariumVariantAccessory[];
}

interface ApiResponse {
  status: number;
  message: string;
  data: TerrariumVariant[] | null;
}

const TerrariumVariants: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [variants, setVariants] = useState<TerrariumVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [terrariumName, setTerrariumName] = useState<string>('');
  const [availableAccessories, setAvailableAccessories] = useState<Accessory[]>([]);
  const [loadingAccessories, setLoadingAccessories] = useState(false);

  // Helper function to get auth token
  const getAuthToken = (): string | null => {
    return localStorage.getItem('authToken') || 
           localStorage.getItem('token') || 
           localStorage.getItem('accessToken') || 
           localStorage.getItem('access_token');
  };

  // Helper function to handle authentication errors
  const handleAuthError = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('access_token');
    
    notification.error({
      message: 'Lỗi xác thực',
      description: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      placement: 'topRight',
    });

    setTimeout(() => {
      navigate('/login');
    }, 2000);
  };

  // Helper function to check if user is authenticated
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
    // FIX: Early validation for param to prevent invalid fetches
    if (!id || id === 'undefined' || isNaN(parseInt(id))) {
      setError('ID terrarium không hợp lệ. Đang chuyển hướng...');
      setLoading(false);
      notification.error({
        message: 'Lỗi',
        description: 'ID terrarium không hợp lệ.',
        placement: 'topRight',
      });
      navigate('/manager/terrarium/list');
      return;
    }

    if (checkAuth()) {
      fetchVariants(id);
      fetchAvailableAccessories();
    }
  }, [id]);

  const fetchVariants = async (terrariumId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`https://terarium.shop/api/TerrariumVariant/get-VariantByTerrarium/${terrariumId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse = await response.json();
      
      if (result.status === 200 && result.data) {
        setVariants(result.data);
      } else if (result.status === -1 && result.data === null) {
        setVariants([]);
        console.log('No variants found for this terrarium');
      } else {
        throw new Error(result.message || 'Failed to fetch variants');
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while fetching variants');
      notification.error({
        message: 'Lỗi',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải dữ liệu',
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableAccessories = async () => {
    try {
      setLoadingAccessories(true);
      const response = await fetch('https://terarium.shop/api/Accessory/get-all');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.status === 200 && result.data) {
        // Filter only active accessories
        const activeAccessories = result.data.filter((acc: Accessory) => 
          acc.status === 'ACTIVE' || acc.status === 'Active'
        );
        setAvailableAccessories(activeAccessories);
      } else {
        console.log('No accessories found');
        setAvailableAccessories([]);
      }
    } catch (error) {
      console.error('Error fetching accessories:', error);
      setAvailableAccessories([]);
    } finally {
      setLoadingAccessories(false);
    }
  };

  const handleDeleteVariant = async (variantId: number) => {
    if (!checkAuth()) return;

    if (window.confirm('Bạn có chắc chắn muốn xóa variant này?')) {
      try {
        const token = getAuthToken();
        if (!token) {
          handleAuthError();
          return;
        }

        const response = await fetch(`https://terarium.shop/api/TerrariumVariant/delete-terrariumVariant/${variantId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            handleAuthError();
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        setVariants(variants.filter(v => v.terrariumVariantId !== variantId));
        notification.success({
          message: 'Thành công',
          description: 'Variant đã được xóa thành công!',
          placement: 'topRight',
        });
      } catch (error) {
        console.error('Error deleting variant:', error);
        notification.error({
          message: 'Lỗi',
          description: error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa variant',
          placement: 'topRight',
        });
      }
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

  const getTotalStock = () => {
    return variants.reduce((total, variant) => total + variant.stockQuantity, 0);
  };

  const getMinPrice = () => {
    if (variants.length === 0) return 0;
    return Math.min(...variants.map(v => v.price));
  };

  const getMaxPrice = () => {
    if (variants.length === 0) return 0;
    return Math.max(...variants.map(v => v.price));
  };

  const getVariantAccessoryCount = (variant: TerrariumVariant) => {
    if (!variant.terrariumVariantAccessories) return 0;
    return variant.terrariumVariantAccessories.reduce((sum, acc) => sum + acc.quantity, 0);
  };

  const getVariantAccessoryPrice = (variant: TerrariumVariant) => {
    if (!variant.terrariumVariantAccessories) return 0;
    return variant.terrariumVariantAccessories.reduce((sum, variantAcc) => {
      const accessory = availableAccessories.find(acc => acc.accessoryId === variantAcc.accessoryId);
      return sum + (accessory ? accessory.price * variantAcc.quantity : 0);
    }, 0);
  };

  // Show auth error if no token is available
  if (!checkAuth() && !loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Cần đăng nhập</h3>
          <p className="text-gray-600 mb-4">Vui lòng đăng nhập để truy cập trang này.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

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

  if (error) {
    return (
      <div className="space-y-4">
        <Link
          to="/manager/terrarium/list"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="text-red-500">⚠</div>
            <div>
              <h3 className="text-red-800 font-medium">Có lỗi xảy ra</h3>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/manager/terrarium/list"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Variants của Terrarium #{id}
            </h1>
            <p className="text-gray-600">Quản lý các biến thể của terrarium</p>
          </div>
        </div>
        <Link
          to={`/manager/terrarium/${id}/variants/create`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Variant</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng Variants</p>
              <p className="text-2xl font-bold text-gray-900">{variants.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Box className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng Tồn Kho</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalStock()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Giao Động Giá</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(getMinPrice())}-{formatPrice(getMaxPrice())}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Variants Table or Empty State */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Danh sách Variants</h3>
        </div>
        
        {variants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Hình ảnh</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Tên Variant</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Giá</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Tồn kho</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Phụ kiện</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Ngày tạo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Cập nhật</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {variants.map((variant) => {
                  const accessoryCount = getVariantAccessoryCount(variant);
                  const accessoryPrice = getVariantAccessoryPrice(variant);
                  
                  return (
                    <tr key={variant.terrariumVariantId} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {variant.terrariumVariantId}
                      </td>
                      <td className="py-3 px-4">
                        {variant.urlImage ? (
                          <img
                            src={variant.urlImage}
                            alt={variant.variantName}
                            className="w-12 h-12 object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {variant.variantName}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        <div className="space-y-1">
                          <div>{formatPrice(variant.price)}</div>
                          {accessoryPrice > 0 && (
                            <div className="text-xs text-gray-500">
                              +{formatPrice(accessoryPrice)} phụ kiện
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          variant.stockQuantity > 10 
                            ? 'text-green-600 bg-green-50'
                            : variant.stockQuantity > 0 
                            ? 'text-yellow-600 bg-yellow-50'
                            : 'text-red-600 bg-red-50'
                        }`}>
                          {variant.stockQuantity}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {accessoryCount > 0 ? (
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {accessoryCount} phụ kiện
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Không có</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {formatDate(variant.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {formatDate(variant.updatedAt)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center space-x-2">
                          <Link
                            to={`/manager/terrarium/${id}/variants/edit/${variant.terrariumVariantId}`}
                            className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteVariant(variant.terrariumVariantId)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl font-medium text-gray-900 mb-2">Chưa có biến thể nào</p>
            <p className="text-gray-500 mb-6">Terrarium này chưa có variant nào. Tạo variant đầu tiên để bắt đầu bán hàng.</p>
            <Link
              to={`/manager/terrarium/${id}/variants/create`}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Thêm Variant Đầu Tiên
            </Link>
          </div>
        )}
      </div>

      {/* Additional Info - Only show if there are variants */}
      {variants.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <div className="text-blue-500 mt-0.5">ℹ️</div>
            <div>
              <h3 className="text-blue-800 font-medium">Thông tin thêm</h3>
              <ul className="text-blue-700 text-sm mt-1 space-y-1">
                <li>• Có {variants.length} variant(s) cho terrarium này</li>
                <li>• Tổng số lượng tồn kho: {getTotalStock()} sản phẩm</li>
                <li>• Giá cao nhất: {formatPrice(Math.max(...variants.map(v => v.price)))}</li>
                <li>• Giá thấp nhất: {formatPrice(Math.min(...variants.map(v => v.price)))}</li>
                {availableAccessories.length > 0 && (
                  <li>• Có {availableAccessories.length} phụ kiện có sẵn để thêm vào variants</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Loading Accessories Indicator */}
      {loadingAccessories && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-yellow-700">Đang tải danh sách phụ kiện...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TerrariumVariants;