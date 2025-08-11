import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Plus, Package, DollarSign, Box, Calendar, Image as ImageIcon, X, Upload } from 'lucide-react';
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
  data: TerrariumVariant[] | null;
}

interface CreateVariantData {
  terrariumId: number;
  variantName: string;
  price: number;
  stockQuantity: number;
  imageFile: File | null;
}

const TerrariumVariants: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [variants, setVariants] = useState<TerrariumVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [terrariumName, setTerrariumName] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<CreateVariantData>({
    terrariumId: parseInt(id || '0'),
    variantName: '',
    price: 0,
    stockQuantity: 0,
    imageFile: null
  });

  const [editFormData, setEditFormData] = useState<CreateVariantData>({
    terrariumId: parseInt(id || '0'),
    variantName: '',
    price: 0,
    stockQuantity: 0,
    imageFile: null
  });

  // Add state for image preview
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  // Helper function to get auth token - FIXED VERSION
  const getAuthToken = (): string | null => {
    // Try different possible keys in localStorage
    const token = localStorage.getItem('authToken') || 
                  localStorage.getItem('token') || 
                  localStorage.getItem('accessToken') || 
                  localStorage.getItem('access_token');
    
    return token;
  };

  // Helper function to handle authentication errors
  const handleAuthError = () => {
    // Clear any stored tokens
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('access_token');
    
    notification.error({
      message: 'Lỗi xác thực',
      description: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      placement: 'topRight',
    });

    // Redirect to login page after a short delay
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
    if (id && checkAuth()) {
      fetchVariants(id);
      setFormData(prev => ({ ...prev, terrariumId: parseInt(id) }));
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
        // Handle case where no variants are found - this is normal, not an error
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

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setEditFormData({ ...editFormData, imageFile: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!checkAuth()) return;

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
      setCreating(true);
      
      const token = getAuthToken();
      if (!token) {
        handleAuthError();
        return;
      }

      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();
      
      // Add fields according to API specification
      formDataToSend.append('TerrariumId', formData.terrariumId.toString());
      formDataToSend.append('VariantName', formData.variantName);
      formDataToSend.append('Price', formData.price.toString());
      formDataToSend.append('StockQuantity', formData.stockQuantity.toString());
      
      // Add image file if selected
      if (formData.imageFile) {
        formDataToSend.append('ImageFile', formData.imageFile);
      }
      
      // Add timestamps (current time)
      const now = new Date().toISOString();
      formDataToSend.append('CreatedAt', now);
      formDataToSend.append('UpdatedAt', now);

      const response = await fetch('https://terarium.shop/api/TerrariumVariant/create-terrariumVariant', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError();
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 201 || result.status === 200) {
        notification.success({
          message: 'Thành công',
          description: 'Variant đã được tạo thành công!',
          placement: 'topRight',
        });
        
        // Reset form
        setFormData({
          terrariumId: parseInt(id || '0'),
          variantName: '',
          price: 0,
          stockQuantity: 0,
          imageFile: null
        });
        
        // Clear image preview
        setImagePreview(null);
        
        // Close modal
        setShowModal(false);
        
        // Refresh variants list
        if (id) {
          fetchVariants(id);
        }
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
      setCreating(false);
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

  const fetchVariantForEdit = async (variantId: number) => {
    if (!checkAuth()) return;

    try {
      const token = getAuthToken();
      if (!token) {
        handleAuthError();
        return;
      }

      const response = await fetch(`https://terarium.shop/api/TerrariumVariant/get-terrariumVariant/${variantId}`, {
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

      const result = await response.json();
      
      if (result.status === 200 && result.data) {
        const variant = result.data;
        setEditFormData({
          terrariumId: variant.terrariumId,
          variantName: variant.variantName,
          price: variant.price,
          stockQuantity: variant.stockQuantity,
          imageFile: null
        });
        
        // Set existing image as preview if available
        if (variant.urlImage) {
          setEditImagePreview(variant.urlImage);
        }
        
        setEditingVariantId(variantId);
        setShowEditModal(true);
      } else {
        throw new Error(result.message || 'Failed to fetch variant data');
      }
    } catch (error) {
      console.error('Error fetching variant for edit:', error);
      notification.error({
        message: 'Lỗi',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải dữ liệu variant',
        placement: 'topRight',
      });
    }
  };

  const handleUpdateVariant = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!checkAuth()) return;

    if (!editingVariantId) {
      notification.error({
        message: 'Lỗi',
        description: 'Không tìm thấy ID của variant',
        placement: 'topRight',
      });
      return;
    }

    // Validation
    if (!editFormData.variantName.trim()) {
      notification.error({
        message: 'Lỗi',
        description: 'Vui lòng nhập tên variant',
        placement: 'topRight',
      });
      return;
    }

    if (editFormData.price <= 0) {
      notification.error({
        message: 'Lỗi',
        description: 'Giá phải lớn hơn 0',
        placement: 'topRight',
      });
      return;
    }

    if (editFormData.stockQuantity < 0) {
      notification.error({
        message: 'Lỗi',
        description: 'Số lượng tồn kho không được âm',
        placement: 'topRight',
      });
      return;
    }

    try {
      setUpdating(true);

      const token = getAuthToken();
      if (!token) {
        handleAuthError();
        return;
      }

      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();
      formDataToSend.append('TerrariumVariantId', editingVariantId.toString());
      formDataToSend.append('TerrariumId', editFormData.terrariumId.toString());
      formDataToSend.append('VariantName', editFormData.variantName);
      formDataToSend.append('Price', editFormData.price.toString());
      formDataToSend.append('StockQuantity', editFormData.stockQuantity.toString());

      // Add image file if selected
      if (editFormData.imageFile) {
        formDataToSend.append('ImageFile', editFormData.imageFile);
      }

      // Add timestamps
      const now = new Date().toISOString();
      formDataToSend.append('UpdatedAt', now);

      const response = await fetch(
        `https://terarium.shop/api/TerrariumVariant/update-terrariumVariant/${editingVariantId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError();
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle empty response for 204 status
      let result;
      if (response.status !== 204) {
        result = await response.json();
      } else {
        result = { status: 204 };
      }

      if (result.status === 200 || result.status === 204) {
        notification.success({
          message: 'Thành công',
          description: 'Variant đã được cập nhật thành công!',
          placement: 'topRight',
        });

        // Close modal and refresh variants list
        handleCloseEditModal();
        if (id) {
          await fetchVariants(id);
        }
      } else {
        throw new Error(result.message || 'Không thể cập nhật variant');
      }
    } catch (error) {
      console.error('Error updating variant:', error);
      notification.error({
        message: 'Lỗi',
        description:
          error instanceof Error
            ? error.message
            : 'Có lỗi xảy ra khi cập nhật variant',
        placement: 'topRight',
      });
    } finally {
      setUpdating(false);
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

  const getAveragePrice = () => {
    if (variants.length === 0) return 0;
    const totalPrice = variants.reduce((total, variant) => total + variant.price, 0);
    return totalPrice / variants.length;
  };

  // Reset modal when closing
  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      terrariumId: parseInt(id || '0'),
      variantName: '',
      price: 0,
      stockQuantity: 0,
      imageFile: null
    });
    setImagePreview(null);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingVariantId(null);
    setEditFormData({
      terrariumId: parseInt(id || '0'),
      variantName: '',
      price: 0,
      stockQuantity: 0,
      imageFile: null
    });
    setEditImagePreview(null);
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
            <div className="text-red-500">❌</div>
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
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Variant</span>
        </button>
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
              <p className="text-sm font-medium text-gray-600">Giá Trung Bình</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(getAveragePrice())}</p>
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
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Ngày tạo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Cập nhật</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {variants.map((variant) => (
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
                      {formatPrice(variant.price)}
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
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {formatDate(variant.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {formatDate(variant.updatedAt)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => fetchVariantForEdit(variant.terrariumVariantId)}
                          className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
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
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl font-medium text-gray-900 mb-2">Chưa có biến thể nào</p>
            <p className="text-gray-500 mb-6">Terrarium này chưa có variant nào. Tạo variant đầu tiên để bắt đầu bán hàng.</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Thêm Variant Đầu Tiên
            </button>
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
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Create Variant Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Thêm Variant Mới</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateVariant} className="space-y-4">
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hình ảnh
                </label>
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
                            <span>Tải lên file</span>
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

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={creating}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {creating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Đang tạo...
                    </>
                  ) : (
                    'Tạo Variant'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Variant Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Chỉnh Sửa Variant</h2>
              <button
                onClick={handleCloseEditModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateVariant} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Variant ID
                </label>
                <input
                  type="number"
                  value={editingVariantId || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Terrarium ID
                </label>
                <input
                  type="number"
                  value={editFormData.terrariumId}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên Variant <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.variantName}
                  onChange={(e) => setEditFormData({ ...editFormData, variantName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập tên variant..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá (VND) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={editFormData.price}
                  onChange={(e) => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                  step="1000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số lượng tồn kho <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={editFormData.stockQuantity}
                  onChange={(e) => setEditFormData({ ...editFormData, stockQuantity: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hình ảnh
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                  <div className="space-y-1 text-center">
                    {editImagePreview ? (
                      <div className="relative">
                        <img
                          src={editImagePreview}
                          alt="Preview"
                          className="mx-auto h-32 w-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setEditFormData({ ...editFormData, imageFile: null });
                            setEditImagePreview(null);
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
                            htmlFor="edit-image-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                          >
                            <span>Tải lên file</span>
                            <input
                              id="edit-image-upload"
                              name="edit-image-upload"
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={handleEditImageChange}
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

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={updating}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {updating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Đang cập nhật...
                    </>
                  ) : (
                    'Cập Nhật Variant'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TerrariumVariants;