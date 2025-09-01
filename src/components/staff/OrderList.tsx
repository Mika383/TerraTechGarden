import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Archive, ChevronLeft, ChevronRight, Eye, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';

interface OrderItem {
  orderItemId: number;
  accessoryId: number | null;
  terrariumVariantId: number | null;
  accessoryQuantity: number;
  terrariumVariantQuantity: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  orderId: number;
  userId: number;
  addressId: number | null;
  totalAmount: number;
  deposit: number;
  discountAmount: number | null;
  orderDate: string;
  status: string | null;
  paymentStatus: string;
  transactionId: string | null;
  paymentMethod: string;
  orderItems: OrderItem[];
}

interface PaginationData {
  items: Order[];
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Status mapping for string status codes
const getStatusText = (status: string | null | undefined): string => {
  if (!status) return 'Không xác định';
  
  switch (status.toLowerCase()) {
    case 'failed': return 'Giao thất bại';
    case 'cancel':
    case 'cancle': return 'Đơn bị hủy'; // Handle both spellings
    case 'pending': return 'Chờ xử lý';
    case 'confirmed': return 'Đã xác nhận';
    case 'processing': return 'Đang xử lý';
    case 'shipping': return 'Đang vận chuyển';
    case 'completed': return 'Hoàn thành';
    case 'requestrefund': return 'Yêu cầu hoàn tiền';
    case 'refuning': return 'Đang hoàn tiền';
    case 'refunded': return 'Đã hoàn tiền';
    default: return 'Không xác định';
  }
};

// Status color mapping
const getStatusColor = (status: string | null | undefined, type: 'order' | 'payment' | 'shipping') => {
  if (!status) return 'text-gray-600 bg-gray-50';
  
  const normalizedStatus = status.toLowerCase();
  
  if (type === 'order') {
    switch (normalizedStatus) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'confirmed': return 'text-blue-600 bg-blue-50';
      case 'processing': return 'text-purple-600 bg-purple-50';
      case 'shipping': return 'text-indigo-600 bg-indigo-50';
      case 'completed': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'cancel':
      case 'cancle': return 'text-gray-600 bg-gray-50';
      case 'requestrefund': return 'text-orange-600 bg-orange-50';
      case 'refuning': return 'text-orange-500 bg-orange-50';
      case 'refunded': return 'text-green-500 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }
  
  if (type === 'payment') {
    switch (normalizedStatus) {
      case 'paid': return 'text-green-600 bg-green-50';
      case 'unpaid': return 'text-red-600 bg-red-50';
      case 'cancelled': return 'text-gray-600 bg-gray-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  }
  
  if (type === 'shipping') {
    switch (normalizedStatus) {
      case 'shipped': return 'text-green-600 bg-green-50';
      case 'delivered': return 'text-blue-600 bg-blue-50';
      case 'unprocessed': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }
  
  return 'text-gray-600 bg-gray-50';
};

// Get next status for progression
const getNextStatus = (currentStatus: string | null): string | null => {
  if (!currentStatus) return null;
  
  switch (currentStatus.toLowerCase()) {
    case 'pending': return 'confirmed';
    case 'confirmed': return 'processing';
    case 'processing': return 'shipping';
    case 'shipping': return 'completed';
    default: return null;
  }
};

// Get button config for status updates
const getStatusButtonConfig = (status: string | null) => {
  if (!status) return null;
  
  switch (status.toLowerCase()) {
    case 'pending':
      return {
        text: 'Xác nhận đơn',
        icon: CheckCircle,
        className: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-sm hover:shadow-md',
        nextStatus: 'confirmed'
      };
    case 'confirmed':
      return {
        text: 'Bắt đầu xử lý',
        icon: Clock,
        className: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm hover:shadow-md',
        nextStatus: 'processing'
      };
    default:
      return null;
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]); // For statistics
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrders, setUpdatingOrders] = useState<Set<number>>(new Set());
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Fetch orders from API with pagination
  const fetchOrders = async (page: number = 1, size: number = 10) => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('authToken') || localStorage.getItem('token') || localStorage.getItem('accessToken');
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`https://terarium.shop/api/Order/paginated?Page=${page}&PageSize=${size}`, {
        method: 'GET',
        headers: headers,
      });
      
      if (response.status === 401) {
        throw new Error('Chưa xác thực, vui lòng đăng nhập.');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Handle "no orders" case
      if (result.status === 4) {
        setOrders([]);
        setTotalItems(0);
        setTotalPages(0);
        setHasNextPage(false);
        setHasPreviousPage(false);
        toast.info('Không có đơn hàng nào!');
        return;
      }
      
      const paginationData: PaginationData = result.data || {
        items: [],
        currentPage: 1,
        pageSize: size,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };
      
      setOrders(paginationData.items || []);
      setCurrentPage(paginationData.currentPage);
      setPageSize(paginationData.pageSize);
      setTotalItems(paginationData.totalItems);
      setTotalPages(paginationData.totalPages);
      setHasNextPage(paginationData.hasNextPage);
      setHasPreviousPage(paginationData.hasPreviousPage);
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      
      if (errorMessage.includes('xác thực') || errorMessage.includes('đăng nhập')) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        toast.error('Không thể tải danh sách đơn hàng');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch all orders for statistics
  const fetchAllOrders = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token') || localStorage.getItem('accessToken');
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('https://terarium.shop/api/Order', {
        method: 'GET',
        headers: headers,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Handle "no orders" case
      if (result.status === 4) {
        setAllOrders([]);
        return;
      }
      
      const orderData = result.data || [];
      setAllOrders(orderData);
    } catch (error) {
      console.error('Error fetching all orders for statistics:', error);
      toast.error('Không thể tải dữ liệu thống kê');
    }
  };

  useEffect(() => {
    fetchOrders(currentPage, pageSize);
    fetchAllOrders(); // For statistics
  }, [currentPage, pageSize]);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const orderStatus = order.status || '';
    const paymentStatus = order.paymentStatus || '';
    
    const matchesSearch = 
      order.orderId.toString().includes(searchTerm) ||
      order.userId.toString().includes(searchTerm) ||
      getStatusText(orderStatus).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (paymentStatus && paymentStatus.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (orderStatus && orderStatus.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || (orderStatus && orderStatus.toLowerCase() === statusFilter.toLowerCase());
    const matchesPayment = paymentFilter === 'all' || (paymentStatus && paymentStatus.toLowerCase() === paymentFilter.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const handleStatusUpdate = async (orderId: number, currentStatus: string | null) => {
    const nextStatus = getNextStatus(currentStatus);
    if (!nextStatus) {
      toast.error('Trạng thái không hợp lệ để cập nhật');
      return;
    }

    // Add to updating set
    setUpdatingOrders(prev => new Set(prev).add(orderId));

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token') || localStorage.getItem('accessToken');
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`https://terarium.shop/api/Order/${orderId}/status`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(nextStatus),
      });

      if (response.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update the order status in state
      setOrders(orders.map(order => 
        order.orderId === orderId 
          ? { ...order, status: nextStatus }
          : order
      ));
      
      toast.success(`Cập nhật trạng thái thành: ${getStatusText(nextStatus)}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Không thể cập nhật trạng thái');
    } finally {
      // Remove from updating set
      setUpdatingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let end = Math.min(totalPages, start + maxVisiblePages - 1);
    
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Lỗi: {error}</p>
          <button 
            onClick={() => fetchOrders(currentPage, pageSize)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh sách Đơn hàng</h1>
          <p className="text-gray-600">Quản lý đơn hàng trong hệ thống</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select 
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          >
            <option value="5">5 / trang</option>
            <option value="10">10 / trang</option>
            <option value="20">20 / trang</option>
            <option value="50">50 / trang</option>
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Tổng đơn hàng</div>
          <div className="text-2xl font-bold text-gray-900">{totalItems}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Đã thanh toán</div>
          <div className="text-2xl font-bold text-green-600">
            {allOrders.filter(o => o.paymentStatus && o.paymentStatus.toLowerCase() === 'paid').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Chưa thanh toán</div>
          <div className="text-2xl font-bold text-red-600">
            {allOrders.filter(o => o.paymentStatus && o.paymentStatus.toLowerCase() === 'unpaid').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Hoàn thành</div>
          <div className="text-2xl font-bold text-green-600">
            {allOrders.filter(o => o.status && o.status.toLowerCase() === 'completed').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Đã hủy</div>
          <div className="text-2xl font-bold text-red-600">
            {allOrders.filter(o => o.status && (o.status.toLowerCase() === 'cancel' || o.status.toLowerCase() === 'cancle')).length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Mã</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Ngày tạo</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Khách hàng</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Trạng thái đơn hàng</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Thanh toán</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Tổng tiền</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Cọc</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Cập nhật trạng thái</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order) => {
                const buttonConfig = getStatusButtonConfig(order.status);
                const isUpdating = updatingOrders.has(order.orderId);
                
                return (
                  <tr key={order.orderId} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <Link 
                        to={`/staff/order/${order.orderId}`}
                        className="text-green-600 hover:text-green-800 font-medium"
                      >
                        #{order.orderId}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {formatDate(order.orderDate)}
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      User #{order.userId}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status, 'order')}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.paymentStatus, 'payment')}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-600">
                      {formatCurrency(order.deposit)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {buttonConfig && (
                        <button
                          onClick={() => handleStatusUpdate(order.orderId, order.status)}
                          disabled={isUpdating}
                          className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${buttonConfig.className}`}
                        >
                          {isUpdating ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                          ) : (
                            <buttonConfig.icon className="w-4 h-4 mr-2" />
                          )}
                          {isUpdating ? 'Đang cập nhật...' : buttonConfig.text}
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        to={`/staff/order/${order.orderId}/detail`}
                        className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Xem chi tiết
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            Không có đơn hàng nào!
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t sm:px-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!hasPreviousPage}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                hasPreviousPage 
                  ? 'text-gray-700 bg-white hover:bg-gray-50' 
                  : 'text-gray-400 bg-gray-100 cursor-not-allowed'
              }`}
            >
              Trước
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasNextPage}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                hasNextPage 
                  ? 'text-gray-700 bg-white hover:bg-gray-50' 
                  : 'text-gray-400 bg-gray-100 cursor-not-allowed'
              }`}
            >
              Tiếp
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Hiển thị{' '}
                <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span>
                {' '}đến{' '}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, totalItems)}
                </span>
                {' '}trên tổng số{' '}
                <span className="font-medium">{totalItems}</span> đơn hàng
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!hasPreviousPage}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                    hasPreviousPage 
                      ? 'text-gray-500 bg-white hover:bg-gray-50' 
                      : 'text-gray-300 bg-gray-100 cursor-not-allowed'
                  }`}
                >
                  <span className="sr-only">Trang trước</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                
                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === currentPage
                        ? 'z-10 bg-green-50 border-green-500 text-green-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!hasNextPage}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                    hasNextPage 
                      ? 'text-gray-500 bg-white hover:bg-gray-50' 
                      : 'text-gray-300 bg-gray-100 cursor-not-allowed'
                  }`}
                >
                  <span className="sr-only">Trang sau</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList;