import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle, XCircle, Search, Calendar, User, Package, CreditCard, Mail } from 'lucide-react';
import { toast } from 'react-toastify';
import { Modal, Input, Form, message } from 'antd';

interface RefundRequest {
  refundId: number;
  userId: number;
  userEmail: string;
  orderId: number;
  refundAmount: number;
  reason: string;
  refundStatus: string;
  requestDate: string;
  orderStatus: string;
  images: string[];
}

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

const RefundRequestList: React.FC = () => {
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modal states for different actions
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [currentAction, setCurrentAction] = useState<RefundRequest | null>(null);
  
  // Form instances
  const [approveForm] = Form.useForm();
  const [rejectForm] = Form.useForm();
  const [cancelForm] = Form.useForm();

  // Fetch pending refund requests from API
  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('https://terarium.shop/api/Order/refund/pending', {
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
      
      const result: ApiResponse<RefundRequest[]> = await response.json();
      
      if (result.status === 200 && result.data) {
        setRequests(result.data);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching refund requests:', error);
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải danh sách yêu cầu hoàn tiền');
      toast.error('Không thể tải danh sách yêu cầu hoàn tiền');
    } finally {
      setLoading(false);
    }
  };

  // Create notification
  const createNotification = async (userId: number, title: string, description: string) => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('https://terarium.shop/api/Notification/web/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          userId: userId,
          title: title,
          description: description,
          broadcastToAll: false
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Notification created successfully');
    } catch (error) {
      console.error('Error creating notification:', error);
      // Don't show error to user as this is a background operation
    }
  };

  // Handle view detail
  const handleViewDetail = (request: RefundRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  // Handle approve refund
  const handleApprove = (request: RefundRequest) => {
    setCurrentAction(request);
    setShowApproveModal(true);
    approveForm.resetFields();
  };

  const confirmApprove = async (values: any) => {
    if (!currentAction) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`https://terarium.shop/api/Order/refund/${currentAction.refundId}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          isApproved: true,
          notes: values.notes || '',
          rejectionReason: ""
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Create notification after successful approval
      await createNotification(
        currentAction.userId,
        'Yêu cầu hoàn tiền đã được phê duyệt',
        `Yêu cầu hoàn tiền cho đơn hàng #${currentAction.orderId} đã được phê duyệt. ${values.notes ? 'Ghi chú: ' + values.notes : ''}`
      );

      message.success('Đã phê duyệt yêu cầu hoàn tiền!');
      fetchRequests(); // Refresh the list
      setShowDetailModal(false);
      setShowApproveModal(false);
    } catch (error) {
      console.error('Error approving refund request:', error);
      message.error('Có lỗi xảy ra khi phê duyệt yêu cầu hoàn tiền');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reject refund
  const handleReject = (request: RefundRequest) => {
    setCurrentAction(request);
    setShowRejectModal(true);
    rejectForm.resetFields();
  };

  const confirmReject = async (values: any) => {
    if (!currentAction) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`https://terarium.shop/api/Order/refund/${currentAction.refundId}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          isApproved: false,
          notes: values.notes || '',
          rejectionReason: values.rejectionReason
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Create notification after successful rejection
      await createNotification(
        currentAction.userId,
        'Yêu cầu hoàn tiền đã bị từ chối',
        `Yêu cầu hoàn tiền cho đơn hàng #${currentAction.orderId} đã bị từ chối. Lý do: ${values.rejectionReason}. ${values.notes ? 'Ghi chú: ' + values.notes : ''}`
      );

      message.success('Đã từ chối yêu cầu hoàn tiền!');
      fetchRequests(); // Refresh the list
      setShowDetailModal(false);
      setShowRejectModal(false);
    } catch (error) {
      console.error('Error rejecting refund request:', error);
      message.error('Có lỗi xảy ra khi từ chối yêu cầu hoàn tiền');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle cancel order
  const handleCancelOrder = (request: RefundRequest) => {
    setCurrentAction(request);
    setShowCancelModal(true);
    cancelForm.resetFields();
  };

  const confirmCancelOrder = async (values: any) => {
    if (!currentAction) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`https://terarium.shop/api/Order/${currentAction.orderId}/cancel?userId=${currentAction.userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          cancelReason: values.cancelReason,
          additionalNotes: values.additionalNotes || ''
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Create notification after successful cancellation
      await createNotification(
        currentAction.userId,
        'Đơn hàng đã được hủy',
        `Đơn hàng #${currentAction.orderId} đã được hủy. Lý do: ${values.cancelReason}. ${values.additionalNotes ? 'Ghi chú: ' + values.additionalNotes : ''}`
      );

      message.success('Đã hủy đơn hàng!');
      fetchRequests(); // Refresh the list
      setShowDetailModal(false);
      setShowCancelModal(false);
    } catch (error) {
      console.error('Error cancelling order:', error);
      message.error('Có lỗi xảy ra khi hủy đơn hàng');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Filter requests based on search term
  const filteredRequests = requests.filter(request =>
    request.orderId.toString().includes(searchTerm) ||
    request.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.refundId.toString().includes(searchTerm)
  );

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
              onClick={fetchRequests}
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
          <h1 className="text-2xl font-bold text-gray-900">Yêu cầu hoàn tiền</h1>
          <p className="text-gray-600">Quản lý các yêu cầu hoàn tiền từ khách hàng</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm theo ID hoàn tiền, ID đơn hàng, email hoặc lý do..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700">ID Hoàn tiền</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Đơn hàng</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Khách hàng</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Trạng thái</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Số tiền</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Lý do</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Ngày yêu cầu</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.refundId} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-600">#{request.refundId}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">#{request.orderId}</div>
                    <div className="text-xs text-gray-500">{request.orderStatus}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">User #{request.userId}</div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      {request.userEmail}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      request.refundStatus === 'Pending' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : request.refundStatus === 'Approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {request.refundStatus === 'Pending' ? 'Chờ duyệt' : 
                       request.refundStatus === 'Approved' ? 'Đã duyệt' : 'Đã từ chối'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {request.refundAmount > 0 ? (
                      <span className="font-medium text-green-600">
                        {formatPrice(request.refundAmount)}
                      </span>
                    ) : (
                      <span className="text-gray-400">Chưa xác định</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="max-w-xs truncate text-gray-600 text-sm" title={request.reason}>
                      {request.reason}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-600 text-sm">
                    {formatDate(request.requestDate)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleViewDetail(request)}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {request.refundStatus === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(request)}
                            disabled={actionLoading}
                            className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded disabled:opacity-50"
                            title="Phê duyệt"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(request)}
                            disabled={actionLoading}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded disabled:opacity-50"
                            title="Từ chối"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRequests.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'Không tìm thấy yêu cầu hoàn tiền nào phù hợp với tiêu chí tìm kiếm' : 'Chưa có yêu cầu hoàn tiền nào'}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Chi tiết yêu cầu hoàn tiền</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedRequest(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Request Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Thông tin yêu cầu</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>ID Hoàn tiền:</strong> #{selectedRequest.refundId}</div>
                  <div><strong>ID Đơn hàng:</strong> #{selectedRequest.orderId}</div>
                  <div><strong>Trạng thái đơn hàng:</strong> {selectedRequest.orderStatus}</div>
                  <div><strong>Trạng thái hoàn tiền:</strong> {selectedRequest.refundStatus}</div>
                  <div><strong>Ngày yêu cầu:</strong> {formatDate(selectedRequest.requestDate)}</div>
                  {selectedRequest.refundAmount > 0 && (
                    <div><strong>Số tiền hoàn:</strong> {formatPrice(selectedRequest.refundAmount)}</div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Thông tin khách hàng</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>User ID:</strong> #{selectedRequest.userId}</div>
                  <div><strong>Email:</strong> {selectedRequest.userEmail}</div>
                </div>
              </div>
            </div>

            {/* Refund Reason */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Lý do hoàn tiền</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">{selectedRequest.reason}</p>
              </div>
            </div>

            {/* Images */}
            {selectedRequest.images && selectedRequest.images.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Hình ảnh đính kèm</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedRequest.images.map((image, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      {image.startsWith('http') ? (
                        <img
                          src={image}
                          alt={`Evidence ${index + 1}`}
                          className="w-full h-32 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className="hidden bg-gray-100 h-32 items-center justify-center text-gray-500 text-sm">
                        {image.length > 30 ? `${image.substring(0, 30)}...` : image}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            {selectedRequest.refundStatus === 'Pending' && (
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => handleCancelOrder(selectedRequest)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <Package className="w-4 h-4" />
                  <span>Hủy đơn hàng</span>
                </button>
                <button
                  onClick={() => handleReject(selectedRequest)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Từ chối</span>
                </button>
                <button
                  onClick={() => handleApprove(selectedRequest)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Phê duyệt</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approve Modal */}
      <Modal
        title="Phê duyệt yêu cầu hoàn tiền"
        open={showApproveModal}
        onOk={() => approveForm.submit()}
        onCancel={() => setShowApproveModal(false)}
        okText="Phê duyệt"
        cancelText="Hủy"
        confirmLoading={actionLoading}
        okButtonProps={{ className: 'bg-green-600 hover:bg-green-700' }}
      >
        <Form
          form={approveForm}
          layout="vertical"
          onFinish={confirmApprove}
        >
          <Form.Item
            name="notes"
            label="Ghi chú (tùy chọn)"
          >
            <Input.TextArea
              rows={4}
              placeholder="Nhập ghi chú cho việc phê duyệt..."
              maxLength={500}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Từ chối yêu cầu hoàn tiền"
        open={showRejectModal}
        onOk={() => rejectForm.submit()}
        onCancel={() => setShowRejectModal(false)}
        okText="Từ chối"
        cancelText="Hủy"
        confirmLoading={actionLoading}
        okButtonProps={{ className: 'bg-red-600 hover:bg-red-700' }}
      >
        <Form
          form={rejectForm}
          layout="vertical"
          onFinish={confirmReject}
        >
          <Form.Item
            name="rejectionReason"
            label="Lý do từ chối"
            rules={[{ required: true, message: 'Vui lòng nhập lý do từ chối!' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Nhập lý do từ chối yêu cầu hoàn tiền..."
              maxLength={500}
            />
          </Form.Item>
          <Form.Item
            name="notes"
            label="Ghi chú bổ sung (tùy chọn)"
          >
            <Input.TextArea
              rows={3}
              placeholder="Nhập ghi chú bổ sung..."
              maxLength={500}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Cancel Order Modal */}
      <Modal
        title="Hủy đơn hàng"
        open={showCancelModal}
        onOk={() => cancelForm.submit()}
        onCancel={() => setShowCancelModal(false)}
        okText="Hủy đơn hàng"
        cancelText="Đóng"
        confirmLoading={actionLoading}
        okButtonProps={{ className: 'bg-orange-600 hover:bg-orange-700' }}
      >
        <Form
          form={cancelForm}
          layout="vertical"
          onFinish={confirmCancelOrder}
        >
          <Form.Item
            name="cancelReason"
            label="Lý do hủy đơn hàng"
            rules={[{ required: true, message: 'Vui lòng nhập lý do hủy đơn hàng!' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Nhập lý do hủy đơn hàng..."
              maxLength={500}
            />
          </Form.Item>
          <Form.Item
            name="additionalNotes"
            label="Ghi chú bổ sung (tùy chọn)"
          >
            <Input.TextArea
              rows={3}
              placeholder="Nhập ghi chú bổ sung..."
              maxLength={500}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RefundRequestList;