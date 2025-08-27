import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Edit, Trash2, Eye, Plus, Search, Image as ImageIcon, Upload, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { notification } from 'antd';

interface TerrariumImage {
  terrariumImageId: number;
  terrariumId: number;
  imageUrl: string;
}

interface Terrarium {
  terrariumId: number;
  environmentId: number;
  shapeId: number;
  tankMethodId: number;
  terrariumName: string;
  description: string;
  minPrice: number;
  maxPrice: number;
  stock: number;
  status: string;
  terrariumImages: TerrariumImage[];
  averageRating?: number;
  feedbackCount?: number;
  purchaseCount?: number;
  bodyHTML?: string;
}

interface ApiResponse {
  status: number;
  message: string;
  data: {
    results: Terrarium[];
    includeProperties: string[];
    totalPages: number;
    totalRecords: number;
    pageNumber: number;
    pageSize: number;
    isPagination: boolean;
  };
}

interface SearchApiResponse {
  status: number;
  message: string;
  data: Terrarium[];
}

const TerrariumList: React.FC = () => {
  const navigate = useNavigate();
  const [terrariums, setTerrariums] = useState<Terrarium[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Terrarium[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState<{ [key: number]: boolean }>({});
  const [showImageModal, setShowImageModal] = useState<{ terrariumId: number; images: TerrariumImage[] } | null>(null);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalRecords: 0,
    pageNumber: 1,
    pageSize: 10,
  });

  // Debounce hook for search
  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch terrariums from API with pagination
  useEffect(() => {
    if (!isSearching) {
      fetchTerrariums();
    }
  }, [pagination.pageNumber, pagination.pageSize, isSearching]);

  // Handle search when debounced search term changes
  useEffect(() => {
    if (debouncedSearchTerm.trim()) {
      handleSearch(debouncedSearchTerm.trim());
    } else {
      // Clear search and fetch all terrariums
      setIsSearching(false);
      setSearchResults([]);
      fetchTerrariums();
    }
  }, [debouncedSearchTerm]);

  const fetchTerrariums = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      const url = `https://terarium.shop/api/Terrarium/get-all?Pagination.PageNumber=${pagination.pageNumber}&Pagination.PageSize=${pagination.pageSize}&IncludeProperties=TerrariumImages`;
      const response = await fetch(url, {
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
          navigate('/login');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse = await response.json();
      
      if (result.status === 200 && result.data) {
        setTerrariums(result.data.results);
        setPagination(prev => ({
          ...prev,
          totalPages: result.data.totalPages,
          totalRecords: result.data.totalRecords,
          pageNumber: result.data.pageNumber,
          pageSize: result.data.pageSize,
        }));
      } else {
        throw new Error(result.message || 'Failed to fetch terrariums');
      }
    } catch (error) {
      console.error('Error fetching terrariums:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while fetching terrariums');
      notification.error({
        message: 'Lỗi',
        description: error instanceof Error ? error.message : 'An error occurred while fetching terrariums',
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setIsSearching(true);

      const token = localStorage.getItem('authToken');
      const encodedQuery = encodeURIComponent(searchQuery);
      const url = `https://terarium.shop/api/Terrarium/get-by-terrariumname/${encodedQuery}`;
      
      const response = await fetch(url, {
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
          navigate('/login');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: SearchApiResponse = await response.json();
      
      if (result.status === 200) {
        setSearchResults(result.data || []);
      } else {
        setSearchResults([]);
        if (result.status !== 404) { // Don't show error for "not found" cases
          throw new Error(result.message || 'Search failed');
        }
      }
    } catch (error) {
      console.error('Error searching terrariums:', error);
      setSearchResults([]);
      // Only show error notification for actual errors, not for empty results
      if (error instanceof Error && !error.message.includes('404')) {
        notification.error({
          message: 'Lỗi tìm kiếm',
          description: error.message,
          placement: 'topRight',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // If search is cleared, immediately show all terrariums
    if (!value.trim()) {
      setIsSearching(false);
      setSearchResults([]);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setIsSearching(false);
    setSearchResults([]);
    fetchTerrariums();
  };

  // Get current data to display (search results or all terrariums)
  const currentTerrariums = isSearching ? searchResults : terrariums;

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa terrarium này?')) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`https://terarium.shop/api/Terrarium/delete-terraium/${id}`, {
          method: 'DELETE',
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
            navigate('/login');
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Refresh data after delete
        if (isSearching && searchTerm.trim()) {
          await handleSearch(searchTerm.trim());
        } else {
          await fetchTerrariums();
        }
        
        notification.success({
          message: 'Thành công',
          description: 'Terrarium đã được xóa thành công!',
          placement: 'topRight',
        });
      } catch (error) {
        console.error('Error deleting terrarium:', error);
        notification.error({
          message: 'Lỗi',
          description: 'Có lỗi xảy ra khi xóa terrarium',
          placement: 'topRight',
        });
      }
    }
  };

const handleImageUpload = async (terrariumId: number, file: File) => {
  try {
    setUploadingImages(prev => ({ ...prev, [terrariumId]: true }));

    const formData = new FormData();
    formData.append('TerrariumId', terrariumId.toString());
    formData.append('ImageFile', file);

    const token = localStorage.getItem('authToken');
    const response = await fetch('https://terarium.shop/api/TerrariumImage/upload', {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) {
        notification.error({
          message: 'Lỗi',
          description: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
          placement: 'topRight',
        });
        navigate('/login');
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.status === 201) {
      console.log('Upload successful, refreshing data...');
      console.log('isSearching:', isSearching);
      console.log('searchTerm:', searchTerm);
      
      notification.success({
        message: 'Thành công',
        description: 'Hình ảnh đã được tải lên thành công!',
        placement: 'topRight',
      });

      // Refresh data immediately after successful upload
      try {
        if (isSearching && searchTerm.trim()) {
          console.log('Refreshing search results...');
          await handleSearch(searchTerm.trim());
        } else {
          console.log('Refreshing all terrariums...');
          await fetchTerrariums();
        }
        console.log('Data refresh completed');
      } catch (refreshError) {
        console.error('Error refreshing data:', refreshError);
      }

    } else {
      throw new Error(result.message || 'Failed to upload image');
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    notification.error({
      message: 'Lỗi',
      description: 'Có lỗi xảy ra khi tải lên hình ảnh',
      placement: 'topRight',
    });
  } finally {
    setUploadingImages(prev => ({ ...prev, [terrariumId]: false }));
  }
};

  const handleImageDelete = async (imageId: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa hình ảnh này?')) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`https://terarium.shop/api/TerrariumImage/delete-terrariumImage/${imageId}`, {
          method: 'DELETE',
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
            navigate('/login');
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Refresh the current view
        if (isSearching && searchTerm.trim()) {
          await handleSearch(searchTerm.trim());
        } else {
          await fetchTerrariums();
        }
        
        notification.success({
          message: 'Thành công',
          description: 'Hình ảnh đã được xóa thành công!',
          placement: 'topRight',
        });

        // Update modal if it's open
        if (showImageModal) {
          const currentData = isSearching ? searchResults : terrariums;
          const updatedTerrariums = currentData.map(t => 
            t.terrariumId === showImageModal.terrariumId 
              ? { ...t, terrariumImages: t.terrariumImages.filter(img => img.terrariumImageId !== imageId) }
              : t
          );
          const updatedTerrarium = updatedTerrariums.find(t => t.terrariumId === showImageModal.terrariumId);
          if (updatedTerrarium) {
            setShowImageModal({
              terrariumId: updatedTerrarium.terrariumId,
              images: updatedTerrarium.terrariumImages
            });
          }
        }
      } catch (error) {
        console.error('Error deleting image:', error);
        notification.error({
          message: 'Lỗi',
          description: 'Có lỗi xảy ra khi xóa hình ảnh',
          placement: 'topRight',
        });
      }
    }
  };

  // Pagination handlers (only for non-search mode)
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages && !isSearching) {
      setPagination(prev => ({ ...prev, pageNumber: newPage }));
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    if (!isSearching) {
      setPagination(prev => ({ 
        ...prev, 
        pageSize: newPageSize,
        pageNumber: 1
      }));
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    const currentPage = pagination.pageNumber;
    const totalPages = pagination.totalPages;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) pages.push(-1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push(-1);
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const formatPrice = (minPrice: number, maxPrice: number) => {
    const formatter = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    });
    
    if (maxPrice === 0 || minPrice === maxPrice) {
      return formatter.format(minPrice);
    }
    
    return `${formatter.format(minPrice)} - ${formatter.format(maxPrice)}`;
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'Hoạt động';
      case 'inactive':
        return 'Không hoạt động';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'inactive':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPrimaryImage = (images: TerrariumImage[]) => {
    return images[0];
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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="text-red-500">⌘</div>
          <div>
            <h3 className="text-red-800 font-medium">Có lỗi xảy ra</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Terrarium</h1>
          <p className="text-gray-600">Quản lý danh sách terrarium trong hệ thống</p>
        </div>
        <Link
          to="/manager/terrarium/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Terrarium</span>
        </Link>
      </div>

      {/* Filters & Stats */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên terrarium..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={handleSearchInputChange}
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="flex items-center justify-between text-gray-600">
            <span>
              {isSearching 
                ? `Tìm thấy ${currentTerrariums.length} kết quả` 
                : `Tìm thấy ${currentTerrariums.length} kết quả`
              }
            </span>
            {!isSearching && (
              <span>Tổng: {pagination.totalRecords} terrarium</span>
            )}
          </div>
          
          {!isSearching && (
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Hiển thị:</label>
              <select
                value={pagination.pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-600">/ trang</span>
            </div>
          )}
        </div>

        {isSearching && (
          <div className="mt-2 text-sm text-blue-600">
            Đang hiển thị kết quả tìm kiếm cho: "{searchTerm}"
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700">ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Hình ảnh</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Tên</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Mô tả</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Giá</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Số lượng tồn</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Trạng thái</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentTerrariums.map((terrarium) => {
                const primaryImage = getPrimaryImage(terrarium.terrariumImages);
                const isUploading = uploadingImages[terrarium.terrariumId];
                
                return (
                  <tr key={terrarium.terrariumId} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{terrarium.terrariumId}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {primaryImage ? (
                          <img
                            src={primaryImage.imageUrl}
                            alt={`Terrarium ${terrarium.terrariumName}`}
                            className="w-12 h-12 object-cover rounded-lg cursor-pointer"
                            onClick={() => setShowImageModal({
                              terrariumId: terrarium.terrariumId,
                              images: terrarium.terrariumImages
                            })}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div 
                            className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer"
                            onClick={() => setShowImageModal({
                              terrariumId: terrarium.terrariumId,
                              images: terrarium.terrariumImages
                            })}
                          >
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        
                        {terrarium.terrariumImages.length > 0 && (
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                            {terrarium.terrariumImages.length}
                          </span>
                        )}
                        
                        <label className="cursor-pointer p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded">
                          <Upload className={`w-4 h-4 ${isUploading ? 'animate-spin' : ''}`} />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(terrarium.terrariumId, file);
                              }
                            }}
                            disabled={isUploading}
                          />
                        </label>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{terrarium.terrariumName}</td>
                    <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{terrarium.description}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {formatPrice(terrarium.minPrice, terrarium.maxPrice)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{terrarium.stock}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(terrarium.status)}`}>
                        {getStatusText(terrarium.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center space-x-2">
                        <Link
                          to={`/manager/terrarium/${terrarium.terrariumId}/variants`}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="Xem variants"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/manager/terrarium/edit/${terrarium.terrariumId}`}
                          className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(terrarium.terrariumId)}
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

        {currentTerrariums.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            {isSearching 
              ? `Không tìm thấy terrarium nào với từ khóa "${searchTerm}"`
              : 'Không tìm thấy terrarium nào phù hợp với tiêu chí tìm kiếm'
            }
          </div>
        )}
      </div>

      {/* Pagination - only show when not searching */}
      {!isSearching && pagination.totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Hiển thị {((pagination.pageNumber - 1) * pagination.pageSize) + 1} đến{' '}
              {Math.min(pagination.pageNumber * pagination.pageSize, pagination.totalRecords)} của{' '}
              {pagination.totalRecords} kết quả
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.pageNumber - 1)}
                disabled={pagination.pageNumber === 1}
                className={`px-3 py-2 rounded-lg flex items-center space-x-1 ${
                  pagination.pageNumber === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Trước</span>
              </button>

              <div className="flex items-center space-x-1">
                {getPageNumbers().map((page, index) => (
                  page === -1 ? (
                    <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 rounded-lg ${
                        page === pagination.pageNumber
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>

              <button
                onClick={() => handlePageChange(pagination.pageNumber + 1)}
                disabled={pagination.pageNumber === pagination.totalPages}
                className={`px-3 py-2 rounded-lg flex items-center space-x-1 ${
                  pagination.pageNumber === pagination.totalPages
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>Sau</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Hình ảnh Terrarium #{showImageModal.terrariumId}
              </h3>
              <button
                onClick={() => setShowImageModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {showImageModal.images.map((image) => (
                <div key={image.terrariumImageId} className="relative group">
                  <img
                    src={image.imageUrl}
                    alt={`Terrarium image ${image.terrariumImageId}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => handleImageDelete(image.terrariumImageId)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Xóa hình ảnh"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            
            {showImageModal.images.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Chưa có hình ảnh nào
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TerrariumList;