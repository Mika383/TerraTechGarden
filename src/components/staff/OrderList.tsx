import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Archive, ChevronLeft, ChevronRight, Eye, CheckCircle, Clock, ArrowRight, X } from 'lucide-react';
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
  
  switch (status) {
    case 'Failed': return 'Giao thất bại';
    case 'Cancel': return 'Đơn bị hủy';
    case 'Pending': return 'Chờ xử lý';
    case 'Confirmed': return 'Đã xác nhận';
    case 'Processing': return 'Đang xử lý';
    case 'Shipping': return 'Đang vận chuyển';
    case 'Completed': return 'Hoàn thành';
    case 'RequestRefund': return 'Yêu cầu hoàn tiền';
    case 'Refuning': return 'Đang hoàn tiền';
    case 'Refunded': return 'Đã hoàn tiền';
    case 'Rejected': return 'Đã từ chối';
    case 'Approved': return 'Đã phê duyệt';
    default: return 'Không xác định';
  }
};

// Status color mapping
const getStatusColor = (status: string | null | undefined, type: 'order' | 'payment' | 'shipping') => {
  if (!status) return 'text-gray-600 bg-gray-50';
  
  if (type === 'order') {
    switch (status) {
      case 'Pending': return 'text-yellow-600 bg-yellow-50';
      case 'Approved': return 'text-blue-500 bg-blue-50';
      case 'Confirmed': return 'text-blue-600 bg-blue-50';
      case 'Processing': return 'text-purple-600 bg-purple-50';
      case 'Shipping': return 'text-indigo-600 bg-indigo-50';
      case 'Completed': return 'text-green-600 bg-green-50';
      case 'Failed': return 'text-red-600 bg-red-50';
      case 'Cancel': return 'text-gray-600 bg-gray-50';
      case 'Rejected': return 'text-red-700 bg-red-100';
      case 'RequestRefund': return 'text-orange-600 bg-orange-50';
      case 'Refuning': return 'text-orange-500 bg-orange-50';
      case 'Refunded': return 'text-green-500 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }
  
  if (type === 'payment') {
    switch (status) {
      case 'Paid': return 'text-green-600 bg-green-50';
      case 'Unpaid': return 'text-red-600 bg-red-50';
      case 'Cancelled': return 'text-gray-600 bg-gray-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  }
  
  if (type === 'shipping') {
    switch (status) {
      case 'Shipped': return 'text-green-600 bg-green-50';
      case 'Delivered': return 'text-blue-600 bg-blue-50';
      case 'Unprocessed': return 'text-red-600 bg-red-50';
      case 'Pending': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }
  
  return 'text-gray-600 bg-gray-50';
};

// Get next status for progression - UPDATED
const getNextStatus = (currentStatus: string | null): string | null => {
  if (!currentStatus) return null;
  
  switch (currentStatus) {
    case 'Pending': return 'Confirmed'; // Changed from 'Approved' to 'Confirmed'
    case 'Confirmed': return 'Processing';
    case 'Processing': return 'Shipping';
    case 'Shipping': return 'Completed';
    default: return null;
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

// Enhanced Reject Confirmation Modal Component
const RejectConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (rejectReason: string, internalNote: string) => void;
  orderId: number;
  isLoading: boolean;
}> = ({ isOpen, onClose, onConfirm, orderId, isLoading }) => {
  const [rejectReason, setRejectReason] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [errors, setErrors] = useState<{rejectReason?: string; internalNote?: string}>({});

  const handleSubmit = () => {
    const newErrors: {rejectReason?: string; internalNote?: string} = {};
    
    if (!rejectReason.trim()) {
      newErrors.rejectReason = 'Vui lòng nhập lý do từ chối';
    }
    
    if (!internalNote.trim()) {
      newErrors.internalNote = 'Vui lòng nhập ghi chú nội bộ';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    onConfirm(rejectReason.trim(), internalNote.trim());
  };

  const handleClose = () => {
    if (!isLoading) {
      setRejectReason('');
      setInternalNote('');
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Xác nhận từ chối đơn hàng</h3>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Bạn có chắc chắn muốn từ chối đơn hàng <span className="font-semibold">#{orderId}</span> không?
          </p>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="rejectReason" className="block text-sm font-medium text-gray-700 mb-1">
                Lý do từ chối <span className="text-red-500">*</span>
              </label>
              <textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  if (errors.rejectReason) {
                    setErrors(prev => ({...prev, rejectReason: undefined}));
                  }
                }}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed ${
                  errors.rejectReason ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                rows={3}
                placeholder="Nhập lý do từ chối đơn hàng..."
              />
              {errors.rejectReason && (
                <p className="mt-1 text-sm text-red-600">{errors.rejectReason}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="internalNote" className="block text-sm font-medium text-gray-700 mb-1">
                Ghi chú nội bộ <span className="text-red-500">*</span>
              </label>
              <textarea
                id="internalNote"
                value={internalNote}
                onChange={(e) => {
                  setInternalNote(e.target.value);
                  if (errors.internalNote) {
                    setErrors(prev => ({...prev, internalNote: undefined}));
                  }
                }}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed ${
                  errors.internalNote ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                rows={3}
                placeholder="Nhập ghi chú nội bộ..."
              />
              {errors.internalNote && (
                <p className="mt-1 text-sm text-red-600">{errors.internalNote}</p>
              )}
            </div>
          </div>
          
          <p className="text-sm text-red-600 mt-4">
            Hành động này không thể hoàn tác.
          </p>
        </div>
        
        <div className="flex space-x-3 justify-end">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 flex items-center"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <X className="w-4 h-4 mr-2" />
            )}
            {isLoading ? 'Đang xử lý...' : 'Từ chối đơn'}
          </button>
        </div>
      </div>
    </div>
  );
};

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]); // For statistics
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrders, setUpdatingOrders] = useState<Set<number>>(new Set());
  
  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [orderToReject, setOrderToReject] = useState<number | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);
  
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
    
    const matchesStatus = statusFilter === 'all' || (orderStatus && orderStatus === statusFilter);
    const matchesPayment = paymentFilter === 'all' || (paymentStatus && paymentStatus === paymentFilter);
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const handleStatusUpdate = async (orderId: number, currentStatus: string | null, newStatus: string) => {
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
        body: JSON.stringify(newStatus),
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
          ? { ...order, status: newStatus }
          : order
      ));
      
      toast.success(`Cập nhật trạng thái thành: ${getStatusText(newStatus)}`);
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

  const handleConfirmOrder = (orderId: number, currentStatus: string | null) => {
    const nextStatus = getNextStatus(currentStatus);
    if (nextStatus) {
      handleStatusUpdate(orderId, currentStatus, nextStatus);
    }
  };

  const handleRejectOrder = (orderId: number) => {
    setOrderToReject(orderId);
    setShowRejectModal(true);
  };

  const handleConfirmReject = async (rejectReason: string, internalNote: string) => {
    if (!orderToReject) return;

    setRejectLoading(true);
    
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token') || localStorage.getItem('accessToken');
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`https://terarium.shop/api/Order/${orderToReject}/reject`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({
          rejectReason,
          internalNote
        }),
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
        order.orderId === orderToReject 
          ? { ...order, status: 'Rejected' }
          : order
      ));
      
      toast.success('Đã từ chối đơn hàng thành công');
      
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast.error('Không thể từ chối đơn hàng');
    } finally {
      setRejectLoading(false);
      setShowRejectModal(false);
      setOrderToReject(null);
    }
  };

  const handleCloseRejectModal = () => {
    if (!rejectLoading) {
      setShowRejectModal(false);
      setOrderToReject(null);
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
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Tổng đơn hàng</div>
          <div className="text-2xl font-bold text-gray-900">{totalItems}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Đã thanh toán</div>
          <div className="text-2xl font-bold text-green-600">
            {allOrders.filter(o => o.paymentStatus === 'Paid').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Chưa thanh toán</div>
          <div className="text-2xl font-bold text-red-600">
            {allOrders.filter(o => o.paymentStatus === 'Unpaid').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Hoàn thành</div>
          <div className="text-2xl font-bold text-green-600">
            {allOrders.filter(o => o.status === 'Completed').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Đã hủy</div>
          <div className="text-2xl font-bold text-red-600">
            {allOrders.filter(o => o.status === 'Cancel').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Đã từ chối</div>
          <div className="text-2xl font-bold text-red-700">
            {allOrders.filter(o => o.status === 'Rejected').length}
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
                const isUpdating = updatingOrders.has(order.orderId);
                const isPendingStatus = order.status === 'Pending';
                
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
                      {isPendingStatus ? (
                        <div className="flex space-x-2 justify-center">
                          {/* Confirm Button */}
                          <button
                            onClick={() => handleConfirmOrder(order.orderId, order.status)}
                            disabled={isUpdating}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-sm hover:shadow-md"
                          >
                            {isUpdating ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            {isUpdating ? 'Đang cập nhật...' : 'Xác nhận đơn'}
                          </button>

                          {/* Reject Button */}
                          <button
                            onClick={() => handleRejectOrder(order.orderId)}
                            disabled={isUpdating}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-sm hover:shadow-md"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Từ chối đơn
                          </button>
                        </div>
                      ) : order.status === 'Confirmed' ? (
                        // Show "Start Processing" button for confirmed orders
                        <button
                          onClick={() => handleConfirmOrder(order.orderId, order.status)}
                          disabled={isUpdating}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm hover:shadow-md"
                        >
                          {isUpdating ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                          ) : (
                            <Clock className="w-4 h-4 mr-2" />
                          )}
                          {isUpdating ? 'Đang cập nhật...' : 'Bắt đầu xử lý'}
                        </button>
                      ) : (
                        // No action button for processing, shipping, completed, cancelled, rejected orders
                        <span className="text-gray-400 text-sm">Không có hành động</span>
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

      {/* Enhanced Reject Confirmation Modal */}
      <RejectConfirmModal
        isOpen={showRejectModal}
        onClose={handleCloseRejectModal}
        onConfirm={handleConfirmReject}
        orderId={orderToReject || 0}
        isLoading={rejectLoading}
      />
    </div>
  );
};

export default OrderList;