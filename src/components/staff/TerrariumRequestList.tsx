import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle, XCircle, Search, Calendar, User, Package } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
interface TerrariumRequest {
  layoutId: number;
  layoutName: string;
  status: string;
  finalPrice: number | null;
  createdDate: string;
  updatedDate: string;
  userId: number;
  terrariumId: number;
  reviewedBy: number | null;
  reviewDate: string | null;
  reviewNotes: string | null;
}

interface TerrariumDetail {
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
  averageRating: number;
  feedbackCount: number;
  purchaseCount: number;
  accessories: any[];
  createdAt: string;
  updatedAt: string;
  bodyHTML: string;
  terrariumImages: Array<{
    terrariumImageId: number;
    terrariumId: number;
    imageUrl: string;
  }>;
}

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

const TerrariumRequestList: React.FC = () => {
  const [requests, setRequests] = useState<TerrariumRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<TerrariumRequest | null>(null);
  const [terrariumDetail, setTerrariumDetail] = useState<TerrariumDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();
  // Fetch pending requests from API
  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('https://terarium.shop/api/TerrariumLayout/pending', {
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
      
      const result = await response.json();
      setRequests(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải danh sách yêu cầu');
      toast.error('Không thể tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  // Fetch terrarium detail
  const fetchTerrariumDetail = async (terrariumId: number) => {
    try {
      setLoadingDetail(true);
      
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`https://terarium.shop/api/Terrarium/get/${terrariumId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<TerrariumDetail> = await response.json();
      
      if (result.status === 200 && result.data) {
        setTerrariumDetail(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch terrarium detail');
      }
    } catch (error) {
      console.error('Error fetching terrarium detail:', error);
      toast.error('Không thể tải chi tiết terrarium');
    } finally {
      setLoadingDetail(false);
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
  const handleViewDetail = async (request: TerrariumRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
    await fetchTerrariumDetail(request.terrariumId);
  };

  
// Updated handleApprove function in TerrariumRequestList.tsx
const handleApprove = async (request: TerrariumRequest) => {
  try {
    setActionLoading(true);
    
    // Navigate to the terrarium customization page
    // Pass the request data through navigation state or props
    // This assumes you're using React Router or similar navigation
    navigate(`/staff/terrarium-customize/${request.layoutId}`, {
      state: { 
        request: request,
        terrariumId: request.terrariumId,
        userId: request.userId
      }
    });
    
  } catch (error) {
    console.error('Error navigating to customization page:', error);
    toast.error('Có lỗi xảy ra khi chuyển trang');
  } finally {
    setActionLoading(false);
  }
};

  // Handle reject request
  const handleReject = async (request: TerrariumRequest) => {
    const notes = prompt('Nhập lý do từ chối:');
    if (!notes) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`https://terarium.shop/api/TerrariumLayout/${request.layoutId}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          status: 'Rejected',
          price: 0,
          notes: notes
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Create notification after successful rejection
      await createNotification(
        request.userId,
        'Yêu cầu custom terrarium',
        notes
      );

      toast.success('Đã từ chối yêu cầu!');
      fetchRequests(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Có lỗi xảy ra khi từ chối yêu cầu');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Filter requests based on search term
  const filteredRequests = requests.filter(request =>
    request.layoutName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.layoutId.toString().includes(searchTerm)
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
          <h1 className="text-2xl font-bold text-gray-900">Yêu cầu định giá Terrarium</h1>
          <p className="text-gray-600">Quản lý các yêu cầu định giá terrarium từ khách hàng</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên terrarium hoặc ID..."
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
                <th className="text-left py-3 px-4 font-medium text-gray-700">ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Tên Terrarium</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Trạng thái</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Giá định</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">User ID</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Ngày tạo</th>
                <th className="button py-3 px-4 font-medium text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.layoutId} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-600">#{request.layoutId}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{request.layoutName}</div>
                    <div className="text-xs text-gray-500">Terrarium ID: #{request.terrariumId}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      request.status === 'Pending' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : request.status === 'Approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {request.status === 'Pending' ? 'Chờ duyệt' : 
                       request.status === 'Approved' ? 'Đã duyệt' : 'Đã từ chối'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {request.finalPrice ? (
                      <span className="font-medium text-green-600">
                        {formatPrice(request.finalPrice)}
                      </span>
                    ) : (
                      <span className="text-gray-400">Chưa định giá</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-400 mr-1" />
                      <span className="text-gray-600">#{request.userId}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-600 text-sm">
                    {formatDate(request.createdDate)}
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
                      {request.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(request)}
                            disabled={actionLoading}
                            className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded disabled:opacity-50"
                            title="Đồng ý"
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
            {searchTerm ? 'Không tìm thấy yêu cầu nào phù hợp với tiêu chí tìm kiếm' : 'Chưa có yêu cầu nào'}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Chi tiết yêu cầu</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedRequest(null);
                  setTerrariumDetail(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Request Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Thông tin yêu cầu</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>ID:</strong> #{selectedRequest.layoutId}</div>
                  <div><strong>Tên:</strong> {selectedRequest.layoutName}</div>
                  <div><strong>Trạng thái:</strong> {selectedRequest.status}</div>
                  <div><strong>User ID:</strong> #{selectedRequest.userId}</div>
                  <div><strong>Ngày tạo:</strong> {formatDate(selectedRequest.createdDate)}</div>
                  {selectedRequest.finalPrice && (
                    <div><strong>Giá định:</strong> {formatPrice(selectedRequest.finalPrice)}</div>
                  )}
                  {selectedRequest.reviewNotes && (
                    <div><strong>Ghi chú:</strong> {selectedRequest.reviewNotes}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Terrarium Detail */}
            {loadingDetail ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600">Đang tải chi tiết...</span>
                </div>
              </div>
            ) : terrariumDetail ? (
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-4">Chi tiết Terrarium</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="space-y-3">
                      <div><strong>Tên:</strong> {terrariumDetail.terrariumName}</div>
                      <div><strong>Mô tả:</strong> {terrariumDetail.description}</div>
                      <div><strong>Khoảng giá:</strong> {formatPrice(terrariumDetail.minPrice)} - {formatPrice(terrariumDetail.maxPrice)}</div>
                      <div><strong>Tồn kho:</strong> {terrariumDetail.stock}</div>
                      <div><strong>Trạng thái:</strong> {terrariumDetail.status}</div>
                      <div><strong>Đánh giá:</strong> {terrariumDetail.averageRating}/5 ({terrariumDetail.feedbackCount} đánh giá)</div>
                      <div><strong>Đã bán:</strong> {terrariumDetail.purchaseCount}</div>
                    </div>
                  </div>
                  <div>
                    {terrariumDetail.terrariumImages && terrariumDetail.terrariumImages.length > 0 && (
                      <div>
                        <strong className="block mb-2">Hình ảnh:</strong>
                        <div className="grid grid-cols-2 gap-2">
                          {terrariumDetail.terrariumImages.map((image) => (
                            <img
                              key={image.terrariumImageId}
                              src={image.imageUrl}
                              alt={terrariumDetail.terrariumName}
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {terrariumDetail.bodyHTML && (
                  <div className="mt-4">
                    <strong className="block mb-2">Nội dung chi tiết:</strong>
                    <div 
                      className="prose max-w-none text-sm text-gray-700 bg-gray-50 p-3 rounded-lg"
                      dangerouslySetInnerHTML={{ __html: terrariumDetail.bodyHTML }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Không thể tải chi tiết terrarium
              </div>
            )}

            {/* Action buttons */}
            {selectedRequest.status === 'Pending' && (
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
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
                  <span>Đồng ý</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TerrariumRequestList;