import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle, Clock, ArrowRight, X, MapPin, User, Phone } from 'lucide-react';
import { toast } from 'react-toastify';

interface OrderItem {
  orderItemId: number;
  comboId: number;
  accessoryId: number | null;
  terrariumVariantId: number | null;
  terrariumId: number;
  accessoryQuantity: number;
  terrariumVariantQuantity: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemType: string | null;
  parentOrderItemId: number | null;
  isFeedBack: boolean;
  childItems: any[];
  productName: string;
  imageUrl: string;
}

interface Order {
  orderId: number;
  userId: number;
  voucherId: number | null;
  addressId: number | null;
  totalAmount: number;
  deposit: number;
  originalAmount: number;
  discountAmount: number | null;
  orderDate: string;
  status: string | null;
  paymentStatus: string;
  transactionId: string | null;
  paymentMethod: string;
  isPayFull: boolean;
  note: string;
  refunds: Array<{
    status: string;
    reason: string;
  }>;
  orderItems: OrderItem[];
}

interface Address {
  id: number;
  tagName: string;
  userId: number;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  latitude: string;
  longitude: string;
  isDefault: boolean;
}

interface LocationData {
  level1_id: string;
  name: string;
  type: string;
  level2s: Array<{
    level2_id: string;
    name: string;
    type: string;
    level3s: Array<{
      level3_id: string;
      name: string;
      type: string;
    }>;
  }>;
}

interface TerrariumVariant {
  terrariumVariantId: number;
  terrariumId: number;
  variantName: string;
  price: number;
  stockQuantity: number;
  urlImage: string;
}

interface Accessory {
  accessoryId: number;
  name: string;
  size: string;
  description: string;
  price: number;
  stockQuantity: number;
  accessoryImages: { imageUrl: string }[];
}

interface Combo {
  comboId: number;
  name: string;
  comboPrice: number;
  imageUrl: string;
}

// Reject Modal Component
interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (rejectReason: string, internalNote: string) => void;
  loading: boolean;
}

const RejectModal: React.FC<RejectModalProps> = ({ isOpen, onClose, onConfirm, loading }) => {
  const [rejectReason, setRejectReason] = useState('');
  const [internalNote, setInternalNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    onConfirm(rejectReason.trim(), internalNote.trim());
  };

  const handleClose = () => {
    if (!loading) {
      setRejectReason('');
      setInternalNote('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Từ chối đơn hàng</h3>
            {!loading && (
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="rejectReason" className="block text-sm font-medium text-gray-700 mb-2">
                Lý do từ chối <span className="text-red-500">*</span>
              </label>
              <textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối đơn hàng..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={3}
                disabled={loading}
                required
              />
            </div>
            
            <div>
              <label htmlFor="internalNote" className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú nội bộ
              </label>
              <textarea
                id="internalNote"
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Ghi chú cho nhân viên (không bắt buộc)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={2}
                disabled={loading}
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading || !rejectReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Từ chối đơn hàng'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Type guards
const isTerrariumVariant = (item: TerrariumVariant | Accessory | Combo | null): item is TerrariumVariant => {
  return item !== null && 'variantName' in item;
};

const isAccessory = (item: TerrariumVariant | Accessory | Combo | null): item is Accessory => {
  return item !== null && 'accessoryId' in item;
};

const isCombo = (item: TerrariumVariant | Accessory | Combo | null): item is Combo => {
  return item !== null && 'comboId' in item;
};

const getStatusText = (status: string | null | undefined): string => {
  if (!status) return 'Không xác định';
  switch (status) {
    case 'Failed': return 'Giao thất bại';
    case 'Cancel': return 'Đơn bị hủy';
    case 'Rejected': return 'Đã từ chối';
    case 'Pending': return 'Chờ xử lý';
    case 'Approved': return 'Đã phê duyệt';
    case 'Confirmed': return 'Đã xác nhận';
    case 'Processing': return 'Đang xử lý';
    case 'Shipping': return 'Đang vận chuyển';
    case 'Completed': return 'Hoàn thành';
    case 'RequestRefund': return 'Yêu cầu hoàn tiền';
    case 'Refuning': return 'Đang hoàn tiền';
    case 'Refunded': return 'Đã hoàn tiền';
    default: return 'Không xác định';
  }
};

const getStatusColor = (status: string | null | undefined, type: 'order' | 'payment') => {
  if (!status) return 'text-gray-600 bg-gray-50 border-gray-200';
  if (type === 'order') {
    switch (status) {
      case 'Pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Approved': return 'text-blue-500 bg-blue-50 border-blue-200';
      case 'Confirmed': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Processing': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'Shipping': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'Completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'Failed': return 'text-red-600 bg-red-50 border-red-200';
      case 'Rejected': return 'text-red-600 bg-red-50 border-red-200';
      case 'Cancel': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'RequestRefund': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Refuning': return 'text-orange-500 bg-orange-50 border-orange-200';
      case 'Refunded': return 'text-green-500 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }
  if (type === 'payment') {
    switch (status) {
      case 'Paid': return 'text-green-600 bg-green-50 border-green-200';
      case 'Unpaid': return 'text-red-600 bg-red-50 border-red-200';
      case 'Cancelled': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  }
  return 'text-gray-600 bg-gray-50 border-gray-200';
};

// Get next status for progression
const getNextStatus = (currentStatus: string | null): string | null => {
  if (!currentStatus) return null;
  
  switch (currentStatus) {
    case 'Pending': return 'Confirmed';
    case 'Confirmed': return 'Processing';
    case 'Processing': return 'Shipping';
    case 'Shipping': return 'Completed';
    default: return null;
  }
};

// Get button config for status updates
const getStatusButtonConfig = (status: string | null) => {
  if (!status) return null;
  
  switch (status) {
    case 'Pending':
      return {
        text: 'Xác nhận đơn',
        icon: CheckCircle,
        className: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-sm hover:shadow-md',
        nextStatus: 'Confirmed'
      };
    case 'Confirmed':
      return {
        text: 'Bắt đầu xử lý',
        icon: Clock,
        className: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm hover:shadow-md',
        nextStatus: 'Processing'
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

// Location data helper functions
const findLocationName = (locationData: LocationData[], code: string, type: 'province' | 'district' | 'ward', parentCode?: string): string => {
  if (type === 'province') {
    const province = locationData.find(p => p.level1_id === code);
    return province ? province.name : `Tỉnh/TP (${code})`;
  }
  
  if (type === 'district' && parentCode) {
    const province = locationData.find(p => p.level1_id === parentCode);
    if (province) {
      const district = province.level2s.find(d => d.level2_id === code);
      return district ? district.name : `Quận/Huyện (${code})`;
    }
  }
  
  if (type === 'ward' && parentCode) {
    for (const province of locationData) {
      for (const district of province.level2s) {
        if (district.level2_id === parentCode) {
          const ward = district.level3s.find(w => w.level3_id === code);
          if (ward) return ward.name;
        }
      }
    }
    return `Phường/Xã (${code})`;
  }
  
  return `Không xác định (${code})`;
};

const OrderDetailStaff: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [locationData, setLocationData] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemsDetails, setItemsDetails] = useState<(TerrariumVariant | Accessory | Combo | null)[]>([]);
  const [updating, setUpdating] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Load location data (you would need to import this data or fetch it from your API)
  useEffect(() => {
    // Sample location data structure - you should replace this with your actual data loading
    const loadLocationData = async () => {
      try {
        // Replace this with your actual data loading logic
        // For example: const response = await fetch('/path/to/data.json');
        // const data = await response.json();
        // setLocationData(data.data);
        
        // For now, using empty array - replace with your data loading logic
        setLocationData([]);
      } catch (error) {
        console.error('Error loading location data:', error);
      }
    };
    
    loadLocationData();
  }, []);

  const fetchAddress = async (addressId: number) => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token') || localStorage.getItem('accessToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`https://terarium.shop/api/Address/get/${addressId}`, {
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
      setAddress(result.data);
    } catch (err) {
      console.error('Error fetching address:', err);
      toast.error('Không thể tải thông tin địa chỉ');
    }
  };

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('token') || localStorage.getItem('accessToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`https://terarium.shop/api/Order/${id}`, {
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
      setOrder(result.data);

      // Fetch address if addressId exists
      if (result.data.addressId) {
        await fetchAddress(result.data.addressId);
      }

      const detailsPromises = result.data.orderItems.map(async (item: OrderItem) => {
        if (item.terrariumVariantId) {
          const variantResponse = await fetch(`https://terarium.shop/api/TerrariumVariant/get-terrariumVariant/${item.terrariumVariantId}`, { headers });
          if (variantResponse.ok) {
            const variantResult = await variantResponse.json();
            return variantResult.data;
          }
        } else if (item.accessoryId) {
          const accessoryResponse = await fetch(`https://terarium.shop/api/Accessory/get/${item.accessoryId}`, { headers });
          if (accessoryResponse.ok) {
            const accessoryResult = await accessoryResponse.json();
            return accessoryResult.data;
          }
        } else if (item.comboId) {
          const comboResponse = await fetch(`https://terarium.shop/api/Combos/${item.comboId}`, { headers });
          if (comboResponse.ok) {
            const comboResult = await comboResponse.json();
            return comboResult.data;
          }
        }
        return null;
      });

      const details = await Promise.all(detailsPromises);
      setItemsDetails(details);
    } catch (err) {
      console.error('Error fetching order:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage.includes('xác thực') || errorMessage.includes('đăng nhập')
        ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
        : 'Không thể tải chi tiết đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!order) return;
    
    const nextStatus = getNextStatus(order.status);
    if (!nextStatus) {
      toast.error('Trạng thái không hợp lệ để cập nhật');
      return;
    }

    setUpdating(true);
    
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token') || localStorage.getItem('accessToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`https://terarium.shop/api/Order/${id}/status`, {
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

      setOrder({ ...order, status: nextStatus });
      toast.success(`Cập nhật trạng thái thành: ${getStatusText(nextStatus)}`);
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Không thể cập nhật trạng thái');
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectOrder = async (rejectReason: string, internalNote: string) => {
    if (!order) return;
    
    setRejecting(true);
    
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token') || localStorage.getItem('accessToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const requestBody = {
        rejectReason,
        internalNote
      };

      const response = await fetch(`https://terarium.shop/api/Order/${id}/reject`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(requestBody),
      });

      if (response.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
      }

      setOrder({ ...order, status: 'Rejected' });
      setShowRejectModal(false);
      toast.success('Đã từ chối đơn hàng thành công');
    } catch (err) {
      console.error('Error rejecting order:', err);
      toast.error('Không thể từ chối đơn hàng');
    } finally {
      setRejecting(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-600">Đang tải...</div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-red-600 mb-4">Lỗi: {error || 'Không tìm thấy đơn hàng'}</p>
            <Link
              to="/staff/order/list"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
            >
              <ArrowLeft size={16} />
              Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const buttonConfig = getStatusButtonConfig(order.status);
  const canReject = order.status === 'Pending';

  // Format full address with location names
  const formatFullAddress = () => {
    if (!address) return '';
    
    const provinceName = findLocationName(locationData, address.provinceCode, 'province');
    const districtName = findLocationName(locationData, address.districtCode, 'district', address.provinceCode);
    const wardName = findLocationName(locationData, address.wardCode, 'ward', address.districtCode);
    
    return `${address.receiverAddress}, ${wardName}, ${districtName}, ${provinceName}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-green-700">Chi tiết đơn hàng</h1>
          <Link
            to="/staff/order/list"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded hover:bg-gray-100"
          >
            <ArrowLeft size={16} />
            Quay lại
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-gray-800">Đơn hàng #{order.orderId}</div>
              <div className="text-sm text-gray-500">
                Ngày đặt: {formatDate(order.orderDate)}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span
                className={`px-2 py-0.5 rounded border text-xs ${getStatusColor(order.status, 'order')}`}
                title={String(order.status)}
              >
                {getStatusText(order.status)}
              </span>
              <span
                className={`px-2 py-0.5 rounded border text-xs ${getStatusColor(order.paymentStatus, 'payment')}`}
                title={String(order.paymentStatus)}
              >
                {order.paymentStatus}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-sm">
            <div>
              <div>Tổng tiền: <b>{formatCurrency(order.totalAmount)}</b></div>
              <div>Tiền gốc: <b>{formatCurrency(order.originalAmount)}</b></div>
              <div>Đặt cọc: <b>{formatCurrency(order.deposit)}</b></div>
            </div>
            <div>
              {/* <div>Mã giao dịch: {order.transactionId || 'N/A'}</div>
              <div>Phương thức: {order.paymentMethod || 'N/A'}</div> */}
              <div>Đã thanh toán đủ: {order.isPayFull ? 'Có' : 'Không'}</div>
            </div>
            <div className="flex gap-2 sm:justify-end">
              {buttonConfig && (
                <button
                  onClick={handleStatusUpdate}
                  disabled={updating || rejecting}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${buttonConfig.className}`}
                >
                  {updating ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <buttonConfig.icon className="w-4 h-4 mr-2" />
                  )}
                  {updating ? 'Đang cập nhật...' : buttonConfig.text}
                </button>
              )}
              {canReject && (
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={updating || rejecting}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-sm hover:shadow-md"
                >
                  <X className="w-4 h-4 mr-2" />
                  Từ chối đơn
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Address Information */}
        {address && (
          <div className="bg-white rounded-lg shadow p-4 border">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-800">Thông tin giao hàng</h3>
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                {address.tagName}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Người nhận:</span>
                  <span>{address.receiverName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Số điện thoại:</span>
                  <span>{address.receiverPhone}</span>
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-700 mb-1">Địa chỉ giao hàng:</div>
                <div className="text-gray-600">
                  {locationData.length > 0 ? formatFullAddress() : address.receiverAddress}
                </div>
                {/* {locationData.length === 0 && (
                  <div className="text-xs text-orange-600 mt-1">
                    * Chưa tải được dữ liệu địa danh chi tiết
                  </div>
                )} */}
              </div>
            </div>
          </div>
        )}

        {/* Refund Information */}
        {order.refunds && order.refunds.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-semibold text-orange-800 mb-2">Thông tin hoàn tiền</h3>
            {order.refunds.map((refund, index) => (
              <div key={index} className="text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">Trạng thái:</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    refund.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                    refund.status === 'Approved' ? 'bg-green-100 text-green-800' :
                    refund.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {refund.status === 'Pending' ? 'Chờ xử lý' :
                     refund.status === 'Approved' ? 'Đã duyệt' :
                     refund.status === 'Rejected' ? 'Đã từ chối' :
                     refund.status}
                  </span>
                </div>
                <div><span className="font-medium">Lý do:</span> {refund.reason}</div>
              </div>
            ))}
          </div>
        )}

        {/* Note */}
        {order.note && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Ghi chú đơn hàng</h3>
            <p className="text-sm text-blue-700">{order.note}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow border p-4">
          <div className="font-semibold mb-3">Sản phẩm</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="p-2 border w-10">#</th>
                  <th className="p-2 border">Sản phẩm</th>
                  <th className="p-2 border w-16">SL</th>
                  <th className="p-2 border w-36">Đơn giá</th>
                  <th className="p-2 border w-36">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {order.orderItems.map((item, index) => {
                  const itemDetail = itemsDetails[index];
                  return (
                    <tr key={item.orderItemId} className="align-top">
                      <td className="p-2 border">{index + 1}</td>
                      <td className="p-2 border">
                        <div className="flex items-center gap-3">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.productName || 'Product'}
                              className="w-12 h-12 object-cover rounded border bg-white"
                              onError={(e) => (e.currentTarget.src = '/TerraTechLogo.png')}
                            />
                          ) : itemDetail && (
                            <>
                              {isTerrariumVariant(itemDetail) && itemDetail.urlImage ? (
                                <img
                                  src={itemDetail.urlImage}
                                  alt={itemDetail.variantName}
                                  className="w-12 h-12 object-cover rounded border bg-white"
                                  onError={(e) => (e.currentTarget.src = '/TerraTechLogo.png')}
                                />
                              ) : isAccessory(itemDetail) && itemDetail.accessoryImages?.[0]?.imageUrl ? (
                                <img
                                  src={itemDetail.accessoryImages[0].imageUrl}
                                  alt={itemDetail.name}
                                  className="w-12 h-12 object-cover rounded border bg-white"
                                  onError={(e) => (e.currentTarget.src = '/TerraTechLogo.png')}
                                />
                              ) : isCombo(itemDetail) && itemDetail.imageUrl ? (
                                <img
                                  src={itemDetail.imageUrl}
                                  alt={itemDetail.name}
                                  className="w-12 h-12 object-cover rounded border bg-white"
                                  onError={(e) => (e.currentTarget.src = '/TerraTechLogo.png')}
                                />
                              ) : (
                                <img
                                  src="/TerraTechLogo.png"
                                  alt="No Image"
                                  className="w-12 h-12 object-cover rounded border bg-white"
                                />
                              )}
                            </>
                          )}
                          <div>
                            <div className="text-green-700 hover:underline font-medium">
                              {item.productName || (itemDetail ? (isTerrariumVariant(itemDetail) ? itemDetail.variantName : itemDetail?.name) : `Item #${item.orderItemId}`)}
                            </div>
                            {item.itemType && (
                              <div className="text-xs text-gray-500 mt-1">
                                {item.itemType === 'MAIN_ITEM' ? 'Sản phẩm chính' : 
                                 item.itemType === 'BUNDLE_ACCESSORY' ? 'Phụ kiện' :
                                 item.itemType === 'COMBO' ? 'Combo' : 
                                 item.itemType === 'SINGLE' ? 'Sản phẩm đơn' :
                                 item.itemType}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-2 border">{item.quantity}</td>
                      <td className="p-2 border">{formatCurrency(item.unitPrice)}</td>
                      <td className="p-2 border">{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {order.orderItems.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              Không có sản phẩm trong đơn hàng
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow border p-4">
          <div className="font-semibold mb-3">Tổng kết đơn hàng</div>
          <div className="space-y-2 text-sm max-w-md ml-auto">
            <div className="flex justify-between">
              <span>Tổng tiền sản phẩm:</span>
              <span>{formatCurrency(order.originalAmount)}</span>
            </div>
            {order.discountAmount && order.discountAmount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Giảm giá:</span>
                <span>-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Tổng cộng:</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Đã thanh toán (đặt cọc):</span>
              <span className="text-green-600">{formatCurrency(order.deposit)}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg">
              <span>Còn lại:</span>
              <span className={order.totalAmount - order.deposit > 0 ? 'text-orange-600' : 'text-green-600'}>
                {formatCurrency(order.totalAmount - order.deposit)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      <RejectModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleRejectOrder}
        loading={rejecting}
      />
    </div>
  );
};

export default OrderDetailStaff;