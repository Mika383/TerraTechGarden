import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';

interface OrderItem {
  orderItemId: number;
  comboId: number;
  accessoryId: number | null;
  terrariumVariantId: number | null;
  accessoryQuantity: number;
  terrariumVariantQuantity: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemType: string | null;
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
  switch (status.toLowerCase()) {
    case 'failed': return 'Giao thất bại';
    case 'cancel':
    case 'cancle': return 'Đơn bị hủy';
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

const getStatusColor = (status: string | null | undefined, type: 'order' | 'payment') => {
  if (!status) return 'text-gray-600 bg-gray-50 border-gray-200';
  const normalizedStatus = status.toLowerCase();
  if (type === 'order') {
    switch (normalizedStatus) {
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'confirmed': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'processing': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'shipping': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      case 'cancel':
      case 'cancle': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'requestrefund': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'refuning': return 'text-orange-500 bg-orange-50 border-orange-200';
      case 'refunded': return 'text-green-500 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }
  if (type === 'payment') {
    switch (normalizedStatus) {
      case 'paid': return 'text-green-600 bg-green-50 border-green-200';
      case 'unpaid': return 'text-red-600 bg-red-50 border-red-200';
      case 'cancelled': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  }
  return 'text-gray-600 bg-gray-50 border-gray-200';
};

// Get next status for progression - Same as OrderList
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

// Get button config for status updates - Same as OrderList
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
    // case 'processing':
    //   return {
    //     text: 'Chuyển giao hàng',
    //     icon: ArrowRight,
    //     className: 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-sm hover:shadow-md',
    //     nextStatus: 'shipping'
    //   };
    // case 'shipping':
    //   return {
    //     text: 'Hoàn thành',
    //     icon: CheckCircle,
    //     className: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-sm hover:shadow-md',
    //     nextStatus: 'completed'
    //   };
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

const OrderDetailStaff: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemsDetails, setItemsDetails] = useState<(TerrariumVariant | Accessory | Combo | null)[]>([]);
  const [updating, setUpdating] = useState(false);

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
              <div>Đặt cọc: <b>{formatCurrency(order.deposit)}</b></div>
            </div>
            <div>
              <div>Mã giao dịch: {order.transactionId || 'N/A'}</div>
              <div>Phương thức: {order.paymentMethod || 'MoMo'}</div>
            </div>
            <div className="flex gap-2 sm:justify-end">
              {buttonConfig && (
                <button
                  onClick={handleStatusUpdate}
                  disabled={updating}
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
            </div>
          </div>
        </div>

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
                          {itemDetail && (
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
                              <span className="text-green-700 hover:underline">
                                {isTerrariumVariant(itemDetail) ? itemDetail.variantName : itemDetail?.name || `Item #${item.orderItemId}`}
                              </span>
                            </>
                          )}
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
        </div>
      </div>
    </div>
  );
};

export default OrderDetailStaff;