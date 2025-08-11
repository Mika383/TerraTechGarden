import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Archive } from 'lucide-react';
import { toast } from 'react-toastify';

interface OrderItem {
  // Add order item properties as needed
}

interface Order {
  orderId: number;
  userId: number;
  addressId: number | null;
  totalAmount: number;
  deposit: number;
  discountAmount: number | null;
  orderDate: string;
  status: string | null; // Allow null status
  paymentStatus: string;
  transactionId: string | null;
  paymentMethod: string;
  orderItems: OrderItem[];
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
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        
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
        
        if (response.status === 401) {
          throw new Error('Chưa xác thực, vui lòng đăng nhập.');
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        // Extract data array from the response
        const orderData = result.data || result;
        setOrders(orderData);
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

    fetchOrders();
  }, []);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    // Safe string conversion for search
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

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
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
      
      toast.success('Cập nhật trạng thái thành công');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Không thể cập nhật trạng thái');
    }
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
            onClick={() => window.location.reload()}
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
        <div className="flex space-x-3">
          <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-200 transition-colors">
            <Archive className="w-4 h-4" />
            <span>Lưu bộ lọc</span>
          </button>
          <Link
            to="/staff/order/create"
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo đơn hàng</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="processing">Đang xử lý</option>
            <option value="shipping">Đang vận chuyển</option>
            <option value="completed">Hoàn thành</option>
            <option value="failed">Giao thất bại</option>
            <option value="cancel">Đơn bị hủy</option>
            <option value="requestrefund">Yêu cầu hoàn tiền</option>
            <option value="refuning">Đang hoàn tiền</option>
            <option value="refunded">Đã hoàn tiền</option>
          </select>

          <select 
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="all">Tất cả thanh toán</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button 
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setPaymentFilter('all');
            }}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Tổng đơn hàng</div>
          <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Đã thanh toán</div>
          <div className="text-2xl font-bold text-green-600">
            {orders.filter(o => o.paymentStatus && o.paymentStatus.toLowerCase() === 'paid').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Chưa thanh toán</div>
          <div className="text-2xl font-bold text-red-600">
            {orders.filter(o => o.paymentStatus && o.paymentStatus.toLowerCase() === 'unpaid').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Hoàn thành</div>
          <div className="text-2xl font-bold text-green-600">
            {orders.filter(o => o.status && o.status.toLowerCase() === 'completed').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Đã hủy</div>
          <div className="text-2xl font-bold text-red-600">
            {orders.filter(o => o.status && (o.status.toLowerCase() === 'cancel' || o.status.toLowerCase() === 'cancle')).length}
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
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
                  <td className="py-3 px-4">
                    <select
                      value={order.status || ''}
                      onChange={(e) => handleStatusUpdate(order.orderId, e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Chọn trạng thái</option>
                      <option value="pending">Chờ xử lý</option>
                      <option value="confirmed">Đã xác nhận</option>
                      <option value="processing">Đang xử lý</option>
                      <option value="shipping">Đang vận chuyển</option>
                      <option value="completed">Hoàn thành</option>
                      <option value="failed">Giao thất bại</option>
                      <option value="cancel">Đơn bị hủy</option>
                      <option value="requestrefund">Yêu cầu hoàn tiền</option>
                      <option value="refuning">Đang hoàn tiền</option>
                      <option value="refunded">Đã hoàn tiền</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all'
              ? 'Không tìm thấy đơn hàng nào phù hợp với tiêu chí tìm kiếm' 
              : 'Chưa có đơn hàng nào được tạo'
            }
          </div>
        )}
      </div>

      {/* Pagination (Optional) */}
      {filteredOrders.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Hiển thị {filteredOrders.length} trên tổng số {orders.length} đơn hàng
          </div>
          <div className="flex space-x-2">
            {/* Add pagination buttons here if needed */}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList;