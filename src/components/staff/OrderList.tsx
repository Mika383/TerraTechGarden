import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Eye, Plus, Search, Filter, Archive } from 'lucide-react';
import { toast } from 'react-toastify';

interface OrderItem {
  // Add order item properties as needed
}

interface Order {
  orderId: number;
  userId: number;
  totalAmount: number;
  deposit: number;
  orderDate: string;
  status: number; // Numeric status code
  paymentStatus: string;
  shippingStatus: string;
  transactionId: string | null;
  paymentMethod: string;
  orderItems: OrderItem[];
}

// Status mapping for numeric status codes
const getStatusText = (statusCode: number): string => {
  switch (statusCode) {
    case 0: return 'Chờ xử lí';
    case 1: return 'Đang chuẩn bị';
    case 2: return 'Đang giao';
    case 3: return 'Đã giao';
    case 4: return 'Hoàn tiền';
    case 5: return 'Đã hủy';
    default: return 'Không xác định';
  }
};

// Status color mapping
const getStatusColor = (status: string | number, type: 'order' | 'payment' | 'shipping') => {
  let normalizedStatus: string;
  
  if (type === 'order' && typeof status === 'number') {
    normalizedStatus = getStatusText(status).toLowerCase();
  } else {
    normalizedStatus = status.toString().toLowerCase();
  }
  
  if (type === 'order') {
    switch (normalizedStatus) {
      case 'chờ xử lí': return 'text-yellow-600 bg-yellow-50';
      case 'đang chuẩn bị': return 'text-purple-600 bg-purple-50';
      case 'đang giao': return 'text-blue-600 bg-blue-50';
      case 'đã giao': return 'text-green-600 bg-green-50';
      case 'hoàn tiền': return 'text-orange-600 bg-orange-50';
      case 'đã hủy': return 'text-red-600 bg-red-50';
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
  const [shippingFilter, setShippingFilter] = useState('all');

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
        
        const result: Order[] = await response.json();
        setOrders(result);
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
    const matchesSearch = 
      order.orderId.toString().includes(searchTerm) ||
      order.userId.toString().includes(searchTerm) ||
      getStatusText(order.status).toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.paymentStatus.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shippingStatus.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || getStatusText(order.status).toLowerCase() === statusFilter.toLowerCase();
    const matchesPayment = paymentFilter === 'all' || order.paymentStatus.toLowerCase() === paymentFilter.toLowerCase();
    const matchesShipping = shippingFilter === 'all' || order.shippingStatus.toLowerCase() === shippingFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesPayment && matchesShipping;
  });

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) {
      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token') || localStorage.getItem('accessToken');
        
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`https://terarium.shop/api/Order/${id}`, {
          method: 'DELETE',
          headers: headers,
        });

        if (response.status === 401) {
          toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        setOrders(orders.filter((order) => order.orderId !== id));
        toast.success('Xóa đơn hàng thành công');
      } catch (error) {
        console.error('Error deleting order:', error);
        toast.error('Không thể xóa đơn hàng');
      }
    }
  };

  const handleStatusUpdate = async (orderId: number, newStatus: string, type: 'status' | 'paymentStatus' | 'shippingStatus') => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token') || localStorage.getItem('accessToken');
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`https://terarium.shop/api/Order/${orderId}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({
          [type]: newStatus
        }),
      });

      if (response.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setOrders(orders.map(order => 
        order.orderId === orderId 
          ? { ...order, [type]: newStatus }
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <option value="chờ xử lí">Chờ xử lí</option>
            <option value="đang chuẩn bị">Đang chuẩn bị</option>
            <option value="đang giao">Đang giao</option>
            <option value="đã giao">Đã giao</option>
            <option value="hoàn tiền">Hoàn tiền</option>
            <option value="đã hủy">Đã hủy</option>
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

          <select 
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={shippingFilter}
            onChange={(e) => setShippingFilter(e.target.value)}
          >
            <option value="all">Tất cả giao hàng</option>
            <option value="unprocessed">Unprocessed</option>
            <option value="pending">Pending</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>

          <button 
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setPaymentFilter('all');
              setShippingFilter('all');
            }}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Tổng đơn hàng</div>
          <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Đã thanh toán</div>
          <div className="text-2xl font-bold text-green-600">
            {orders.filter(o => o.paymentStatus.toLowerCase() === 'paid').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Chưa thanh toán</div>
          <div className="text-2xl font-bold text-red-600">
            {orders.filter(o => o.paymentStatus.toLowerCase() === 'unpaid').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Đã giao hàng</div>
          <div className="text-2xl font-bold text-green-600">
            {orders.filter(o => getStatusText(o.status).toLowerCase() === 'đã giao').length}
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
                <th className="text-left py-3 px-4 font-medium text-gray-700">Giao hàng</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Tổng tiền</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Thao tác</th>
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
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.shippingStatus, 'shipping')}`}>
                      {order.shippingStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center space-x-2">
                      <Link
                        to={`/order/${order.orderId}`}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/manager/order/edit/${order.orderId}`}
                        className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(order.orderId)}
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

        {filteredOrders.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all' || shippingFilter !== 'all' 
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