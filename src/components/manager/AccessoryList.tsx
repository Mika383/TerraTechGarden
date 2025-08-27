import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Eye, Plus, Search, Upload, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { notification, Modal, Upload as AntUpload } from 'antd';
import axios from 'axios';

interface Accessory {
  accessoryId: number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
  status: string;
  size: string;
  accessoryImages: { accessoryImageId: number; accessoryId: number; imageUrl: string }[];
}

interface Category {
  categoryId: number;
  categoryName: string;
  description: string;
}

interface AccessoryApiResponse {
  results: Accessory[];
  includeProperties: string[] | null;
  totalPages: number;
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  isPagination: boolean;
}

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: 'https://terarium.shop/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage, sessionStorage, or your auth context
    const token = localStorage.getItem('authToken') || 
                  sessionStorage.getItem('authToken') || 
                  localStorage.getItem('token') ||
                  sessionStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      notification.error({
        message: 'Lỗi xác thực',
        description: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        placement: 'topRight',
      });
      
      // Optionally redirect to login
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const AccessoryList: React.FC = () => {
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);

  // Image management states
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [selectedAccessory, setSelectedAccessory] = useState<Accessory | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Search and filter states
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isFilterMode, setIsFilterMode] = useState(false);

  const fetchAccessories = async (page: number = currentPage, size: number = pageSize) => {
    try {
      setLoading(true);
      
      const accessoryResponse = await apiClient.get<ApiResponse<AccessoryApiResponse>>(
        `/Accessory/get-all?Pagination.PageNumber=${page}&Pagination.PageSize=${size}&IncludeProperties=AccessoryImages`
      );
      
      if (accessoryResponse.data.status === 200) {
        const data = accessoryResponse.data.data;
        setAccessories(data.results);
        setTotalPages(data.totalPages);
        setTotalRecords(data.totalRecords);
        setCurrentPage(data.pageNumber);
      } else {
        notification.error({
          message: 'Lỗi',
          description: 'Không thể tải danh sách phụ kiện',
          placement: 'topRight',
        });
      }
    } catch (error) {
      console.error('Error fetching accessories:', error);
      notification.error({
        message: 'Lỗi',
        description: 'Có lỗi xảy ra khi tải dữ liệu phụ kiện',
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };

  const searchAccessories = async (searchName: string) => {
    if (!searchName.trim()) {
      // If search term is empty, fetch all accessories
      setIsSearchMode(false);
      await fetchAccessories(1, pageSize);
      return;
    }

    try {
      setSearchLoading(true);
      setIsSearchMode(true);
      
      const response = await apiClient.get<ApiResponse<Accessory[]>>(
        `/Accessory/get-by-name/${encodeURIComponent(searchName.trim())}`
      );
      
      if (response.data.status === 200) {
        const searchResults = response.data.data;
        setAccessories(searchResults);
        // For search results, we don't have pagination info from API
        setTotalPages(1);
        setTotalRecords(searchResults.length);
        setCurrentPage(1);
        
        if (searchResults.length === 0) {
          notification.info({
            message: 'Thông báo',
            description: 'Không tìm thấy phụ kiện nào phù hợp với từ khóa tìm kiếm',
            placement: 'topRight',
          });
        }
      } else {
        throw new Error(response.data?.message || 'Không thể tìm kiếm phụ kiện');
      }
    } catch (error: any) {
      console.error('Error searching accessories:', error);
      notification.error({
        message: 'Lỗi tìm kiếm',
        description: error.response?.data?.message || 'Có lỗi xảy ra khi tìm kiếm phụ kiện',
        placement: 'topRight',
      });
      // On error, fallback to showing all accessories
      setIsSearchMode(false);
      await fetchAccessories();
    } finally {
      setSearchLoading(false);
    }
  };

  const filterAccessoriesByCategory = async (categoryId: string) => {
    if (categoryId === 'all') {
      // If "all" is selected, fetch all accessories
      setIsFilterMode(false);
      await fetchAccessories(1, pageSize);
      return;
    }

    try {
      setLoading(true);
      setIsFilterMode(true);
      
      const response = await apiClient.get<ApiResponse<Accessory[]>>(
        `/Accessory/filter-by-category/${categoryId}`
      );
      
      if (response.data.status === 200) {
        const filteredResults = response.data.data;
        setAccessories(filteredResults);
        // For filtered results, we don't have pagination info from API
        setTotalPages(1);
        setTotalRecords(filteredResults.length);
        setCurrentPage(1);
        
        if (filteredResults.length === 0) {
          notification.info({
            message: 'Thông báo',
            description: 'Không tìm thấy phụ kiện nào trong danh mục này',
            placement: 'topRight',
          });
        }
      } else {
        throw new Error(response.data?.message || 'Không thể lọc phụ kiện theo danh mục');
      }
    } catch (error: any) {
      console.error('Error filtering accessories by category:', error);
      notification.error({
        message: 'Lỗi lọc dữ liệu',
        description: error.response?.data?.message || 'Có lỗi xảy ra khi lọc phụ kiện theo danh mục',
        placement: 'topRight',
      });
      // On error, fallback to showing all accessories
      setIsFilterMode(false);
      await fetchAccessories();
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // Try the correct endpoint first
      let categoryResponse;
      
      try {
        categoryResponse = await apiClient.get<ApiResponse<Category[]>>('/Category/get-all');
      } catch (error: any) {
        if (error.response?.status === 404) {
          // If get-all doesn't exist, try the base endpoint
          categoryResponse = await apiClient.get<ApiResponse<Category[]>>('/Category');
        } else {
          throw error;
        }
      }
      
      if (categoryResponse.data.status === 200) {
        setCategories(categoryResponse.data.data);
      } else {
        notification.error({
          message: 'Lỗi',
          description: 'Không thể tải danh sách danh mục',
          placement: 'topRight',
        });
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      
      if (error.response?.status === 401) {
        notification.error({
          message: 'Lỗi xác thực',
          description: 'Bạn cần đăng nhập để truy cập dữ liệu danh mục',
          placement: 'topRight',
        });
      } else {
        notification.error({
          message: 'Lỗi',
          description: 'Có lỗi xảy ra khi tải danh mục',
          placement: 'topRight',
        });
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchAccessories(), fetchCategories()]);
    };
    fetchData();
  }, []);

  useEffect(() => {
    // Only fetch with pagination when not in search or filter mode
    if (!isSearchMode && !isFilterMode) {
      fetchAccessories(currentPage, pageSize);
    }
  }, [currentPage, pageSize]);

  // Handle search input with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm.trim()) {
        searchAccessories(searchTerm);
      } else if (isSearchMode) {
        // Clear search mode when search term is empty
        setIsSearchMode(false);
        fetchAccessories(1, pageSize);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Handle category filter
  useEffect(() => {
    filterAccessoriesByCategory(filterCategory);
  }, [filterCategory]);

  // Apply status filter to current data (client-side filtering)
  const filteredAccessories = accessories.filter((accessory) => {
    const matchesStatus = filterStatus === 'all' || accessory.status === filterStatus;
    return matchesStatus;
  });

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phụ kiện này?')) {
      try {
        setLoading(true);
        const response = await apiClient.delete(`/Accessory/delete-accessory/${id}`);

        // Check for successful deletion (status 200, 204, or successful response)
        if (response.status === 200 || response.status === 204 || 
            (response.data && (response.data.status === 200 || response.data.status === 204))) {
          
          notification.success({
            message: 'Thành công',
            description: 'Phụ kiện đã được xóa thành công!',
            placement: 'topRight',
          });

          // Refresh current data based on current mode
          if (isSearchMode && searchTerm.trim()) {
            await searchAccessories(searchTerm);
          } else if (isFilterMode && filterCategory !== 'all') {
            await filterAccessoriesByCategory(filterCategory);
          } else {
            await fetchAccessories(currentPage, pageSize);
          }
          
        } else {
          throw new Error(response.data?.message || 'Không thể xóa phụ kiện');
        }
      } catch (error: any) {
        console.error('Error deleting accessory:', error);
        
        // Show detailed error message
        let errorMessage = 'Không thể xóa phụ kiện';
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data?.errors) {
          errorMessage = Object.values(error.response.data.errors).flat().join(', ');
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        notification.error({
          message: 'Lỗi xóa phụ kiện',
          description: errorMessage,
          placement: 'topRight',
          duration: 5, // Show for 5 seconds
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!selectedAccessory) return;

    const formData = new FormData();
    formData.append('AccessoryId', selectedAccessory.accessoryId.toString());
    formData.append('ImageFile', file);

    try {
      setUploadingImage(true);
      const response = await apiClient.post('/AccessoryImage/add-accessoryimage', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status === 201 || response.status === 200) {
        notification.success({
          message: 'Thành công',
          description: 'Tải ảnh lên thành công!',
          placement: 'topRight',
        });

        // Refresh data based on current mode
        if (isSearchMode && searchTerm.trim()) {
          await searchAccessories(searchTerm);
        } else if (isFilterMode && filterCategory !== 'all') {
          await filterAccessoriesByCategory(filterCategory);
        } else {
          await fetchAccessories(currentPage, pageSize);
        }
        
        // Update selected accessory with fresh data
        const updatedAccessory = accessories.find(a => a.accessoryId === selectedAccessory.accessoryId);
        if (updatedAccessory) {
          setSelectedAccessory(updatedAccessory);
        }

      } else {
        throw new Error(response.data?.message || 'Không thể tải ảnh lên');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      notification.error({
        message: 'Lỗi tải ảnh',
        description: error.response?.data?.message || 'Không thể tải ảnh lên',
        placement: 'topRight',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageDelete = async (imageId: number) => {
    if (!selectedAccessory) return;

    if (window.confirm('Bạn có chắc chắn muốn xóa ảnh này?')) {
      try {
        const response = await apiClient.delete(`/AccessoryImage/delete-accessoryimage/${imageId}`);

        if (response.data.status === 200 || response.status === 204) {
          notification.success({
            message: 'Thành công',
            description: 'Xóa ảnh thành công!',
            placement: 'topRight',
          });

          // Refresh data based on current mode
          if (isSearchMode && searchTerm.trim()) {
            await searchAccessories(searchTerm);
          } else if (isFilterMode && filterCategory !== 'all') {
            await filterAccessoriesByCategory(filterCategory);
          } else {
            await fetchAccessories(currentPage, pageSize);
          }
          
          // Update selected accessory with fresh data
          const updatedAccessory = accessories.find(a => a.accessoryId === selectedAccessory.accessoryId);
          if (updatedAccessory) {
            setSelectedAccessory(updatedAccessory);
          }

        } else {
          throw new Error(response.data?.message || 'Không thể xóa ảnh');
        }
      } catch (error: any) {
        console.error('Error deleting image:', error);
        notification.error({
          message: 'Lỗi xóa ảnh',
          description: error.response?.data?.message || 'Không thể xóa ảnh',
          placement: 'topRight',
        });
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && !isSearchMode && !isFilterMode) {
      setCurrentPage(newPage);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    if (!isSearchMode && !isFilterMode) {
      setCurrentPage(1); // Reset to first page when changing page size
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setFilterStatus('all');
    setIsSearchMode(false);
    setIsFilterMode(false);
    fetchAccessories(1, pageSize);
  };

  const openImageModal = (accessory: Accessory) => {
    setSelectedAccessory(accessory);
    setIsImageModalVisible(true);
  };

  const closeImageModal = () => {
    setIsImageModalVisible(false);
    setSelectedAccessory(null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(cat => cat.categoryId === categoryId);
    return category ? category.categoryName : `Danh mục ${categoryId}`;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Phụ kiện</h1>
          <p className="text-gray-600">Quản lý danh sách phụ kiện trong hệ thống</p>
        </div>
        <Link
          to="/manager/accessory/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Phụ kiện</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm phụ kiện..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((category) => (
              <option key={category.categoryId} value={category.categoryId.toString()}>
                {category.categoryName}
              </option>
            ))}
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          >
            <option value={5}>5 / trang</option>
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
          </select>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Hiển thị {filteredAccessories.length} trong số {totalRecords} kết quả
            {(isSearchMode || isFilterMode) && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                {isSearchMode && `Tìm kiếm: "${searchTerm}"`}
                {isFilterMode && `Lọc theo danh mục`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Tên</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Danh mục</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Giá</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Số lượng</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Kích thước</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Hình ảnh</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Trạng thái</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Ngày tạo</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAccessories.map((accessory) => (
                <tr key={accessory.accessoryId} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{accessory.name}</p>
                      <p className="text-sm text-gray-500 truncate max-w-xs">
                        {accessory.description}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {getCategoryName(accessory.categoryId)}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">
                    {formatPrice(accessory.price)}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {accessory.stockQuantity}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {accessory.size}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => openImageModal(accessory)}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {accessory.accessoryImages.length} hình
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        accessory.status === 'active' || accessory.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {accessory.status === 'active' || accessory.status === 'Active' ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(accessory.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center space-x-2">
                      <Link
                        to={`/manager/accessory/edit/${accessory.accessoryId}`}
                        className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(accessory.accessoryId)}
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

        {filteredAccessories.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Không tìm thấy phụ kiện nào phù hợp với tiêu chí tìm kiếm
          </div>
        )}
      </div>

      {/* Pagination - Only show when not in search/filter mode */}
      {totalPages > 1 && !isSearchMode && !isFilterMode && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Trang {currentPage} trong tổng số {totalPages} trang
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 border rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Management Modal */}
      <Modal
        title={`Quản lý ảnh - ${selectedAccessory?.name}`}
        open={isImageModalVisible}
        onCancel={closeImageModal}
        footer={null}
        width={800}
      >
        {selectedAccessory && (
          <div className="space-y-4">
            {/* Upload Section */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-2">
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Tải ảnh lên
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      PNG, JPG, GIF tối đa 10MB
                    </span>
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                    disabled={uploadingImage}
                  />
                </div>
                {uploadingImage && (
                  <div className="mt-2">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <span className="text-sm text-gray-600">Đang tải ảnh lên...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Images Grid */}
            <div className="grid grid-cols-3 gap-4">
              {selectedAccessory.accessoryImages.map((image) => (
                <div key={image.accessoryImageId} className="relative group">
                  <img
                    src={image.imageUrl}
                    alt="Accessory"
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    onClick={() => handleImageDelete(image.accessoryImageId)}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                    title="Xóa ảnh"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {selectedAccessory.accessoryImages.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Chưa có ảnh nào cho phụ kiện này
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AccessoryList;