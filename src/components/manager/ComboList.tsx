import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Plus, Search, ToggleLeft, ToggleRight, Star, Package, Eye } from 'lucide-react';
import { toast } from 'react-toastify';

interface ComboItem {
  comboItemId: number;
  terrariumVariantId: number | null;
  accessoryId: number | null;
  productType: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Combo {
  comboId: number;
  comboCategoryId: number;
  categoryName: string;
  name: string;
  description: string;
  imageUrl: string;
  originalPrice: number;
  comboPrice: number;
  discountPercent: number;
  saveAmount: number;
  isActive: boolean;
  isFeatured: boolean;
  stockQuantity: number;
  soldQuantity: number;
  isInStock: boolean;
  items: ComboItem[];
  createdAt: string;
}

interface ComboListResponse {
  items: Combo[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

interface ApiResponse {
  status: number;
  message: string;
  data: ComboListResponse;
}

const ComboList: React.FC = () => {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize] = useState(12);

  // Fetch combos from API
  const fetchCombos = async (page: number, search?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      
      if (search && search.trim()) {
        queryParams.append('search', search.trim());
      }
      
      const response = await fetch(`https://terarium.shop/api/Combos?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
          throw new Error('Unauthorized');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse = await response.json();
      
      if (result.status === 200 && result.data) {
        setCombos(result.data.items);
        setTotalPages(result.data.totalPages);
        setTotalItems(result.data.totalItems);
        setCurrentPage(result.data.currentPage);
      } else {
        throw new Error(result.message || 'Failed to fetch combos');
      }
    } catch (error) {
      console.error('Error fetching combos:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while fetching combos');
      toast.error('Không thể tải danh sách combo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCombos(1, searchTerm);
  }, []);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCombos(1, searchTerm);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchCombos(page, searchTerm);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa combo này?')) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`https://terarium.shop/api/Combos/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
            throw new Error('Unauthorized');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Refresh the list
        fetchCombos(currentPage, searchTerm);
        toast.success('Combo đã được xóa thành công!');
      } catch (error) {
        console.error('Error deleting combo:', error);
        toast.error('Có lỗi xảy ra khi xóa combo');
      }
    }
  };

  const toggleActive = async (combo: Combo) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://terarium.shop/api/Combos/${combo.comboId}/toggle-active`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
          throw new Error('Unauthorized');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local state
      setCombos(combos.map(c => 
        c.comboId === combo.comboId 
          ? { ...c, isActive: !c.isActive }
          : c
      ));
      
      toast.success(`Combo đã được ${!combo.isActive ? 'kích hoạt' : 'vô hiệu hóa'}!`);
    } catch (error) {
      console.error('Error toggling combo status:', error);
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái combo');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-3 py-2 text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Trước
        </button>
      );
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 border rounded-md ${
            i === currentPage
              ? 'bg-blue-600 text-white border-blue-600'
              : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }

    // Next button
    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-3 py-2 text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Sau
        </button>
      );
    }

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          Hiển thị {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalItems)} trong tổng số {totalItems} combo
        </div>
        <div className="flex space-x-1">
          {pages}
        </div>
      </div>
    );
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
          <div className="text-red-500">⚠</div>
          <div>
            <h3 className="text-red-800 font-medium">Có lỗi xảy ra</h3>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => fetchCombos(currentPage, searchTerm)}
              className="mt-2 text-red-600 underline hover:text-red-800"
            >
              Thử lại
            </button>
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
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Combo</h1>
          <p className="text-gray-600">Quản lý danh sách combo sản phẩm trong hệ thống</p>
        </div>
        <Link
          to="/manager/combo/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Combo</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm combo..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700">ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Tên Combo</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Danh mục</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Giá gốc</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Giá combo</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Giảm giá</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Kho</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Đã bán</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Trạng thái</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Nổi bật</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Ngày tạo</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {combos.map((combo) => (
                <tr key={combo.comboId} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-600">#{combo.comboId}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      {/* {combo.imageUrl && (
                        <img 
                          src={combo.imageUrl} 
                          alt={combo.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      )} */}
                      <div>
                        <div className="font-medium text-gray-900">{combo.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{combo.description}</div>
                        <div className="text-xs text-blue-600">{combo.items.length} sản phẩm</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{combo.categoryName}</td>
                  <td className="py-3 px-4 text-right text-gray-500 line-through">
                    {formatPrice(combo.originalPrice)}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-green-600">
                    {formatPrice(combo.comboPrice)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                      -{combo.discountPercent}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      combo.isInStock 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {combo.stockQuantity}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-600">{combo.soldQuantity}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => toggleActive(combo)}
                      className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                        combo.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {combo.isActive ? (
                        <>
                          <ToggleRight className="w-3 h-3" />
                          <span>Hoạt động</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-3 h-3" />
                          <span>Tạm dừng</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {combo.isFeatured ? (
                      <Star className="w-4 h-4 text-yellow-500 mx-auto" fill="currentColor" />
                    ) : (
                      <Star className="w-4 h-4 text-gray-300 mx-auto" />
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-gray-600 text-sm">
                    {formatDate(combo.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center space-x-2">
                      {/* <Link
                        to={`/manager/combo/view/${combo.comboId}`}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </Link> */}
                      <Link
                        to={`/manager/combo/edit/${combo.comboId}`}
                        className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(combo.comboId)}
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

        {combos.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'Không tìm thấy combo nào phù hợp với tiêu chí tìm kiếm' : 'Chưa có combo nào'}
          </div>
        )}

        {/* Pagination */}
        {renderPagination()}
      </div>
    </div>
  );
};

export default ComboList;