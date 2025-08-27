import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, User, Calendar, CheckCircle, Loader2, Calculator } from 'lucide-react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Modal, Input, Form, message } from 'antd';

// Import your Step4Accessories component
import Step4Accessories from '../manager/Step4Accessories';

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

interface Accessory {
  accessoryId: number;
  name: string;
  size: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
  status: string;
  accessoryImages: any[];
}

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

interface VariantFormData {
  variantName: string;
  notes: string;
}

const TerrariumCustomizePage: React.FC = () => {
  const { layoutId } = useParams<{ layoutId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [request] = useState<TerrariumRequest | null>(location.state?.request || null);
  const [terrariumDetail, setTerrariumDetail] = useState<TerrariumDetail | null>(null);
  const [selectedAccessories, setSelectedAccessories] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'accessories' | 'variant' | 'complete'>('accessories');
  const [markupPercentage, setMarkupPercentage] = useState<number>(0);
  
  // Ant Design Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm<VariantFormData>();

  useEffect(() => {
    if (request) {
      fetchTerrariumDetail(request.terrariumId);
    } else {
      toast.error('Không tìm thấy thông tin yêu cầu');
      navigate('/staff/support/requests');
    }
  }, [request, navigate]);

  const fetchTerrariumDetail = async (terrariumId: number) => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  // New function to update terrarium accessories
  const updateTerrariumAccessories = async () => {
    try {
      if (!terrariumDetail || !request) {
        throw new Error('Missing terrarium detail or request');
      }

      const token = localStorage.getItem('authToken');
      const accessoryNames = selectedAccessories.map(acc => acc.name);

      const response = await fetch(`https://terarium.shop/api/Terrarium/update-terrarium/${request.terrariumId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          terrariumId: request.terrariumId,
          environmentId: terrariumDetail.environmentId,
          shapeId: terrariumDetail.shapeId,
          tankMethodId: terrariumDetail.tankMethodId,
          accessoryNames: accessoryNames,
          terrariumName: terrariumDetail.terrariumName,
          description: terrariumDetail.description,
          status: terrariumDetail.status,
          bodyHTML: terrariumDetail.bodyHTML
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating terrarium accessories:', error);
      toast.error('Không thể cập nhật danh sách phụ kiện');
      throw error;
    }
  };

  const calculateTotalPrice = () => {
    const basePrice = terrariumDetail?.minPrice || 0;
    const accessoriesPrice = selectedAccessories.reduce((sum, acc) => sum + acc.price, 0);
    const markupAmount = (accessoriesPrice * markupPercentage) / 100;
    return basePrice + accessoriesPrice + markupAmount;
  };

  const validateTerrariumExists = async (terrariumId: number): Promise<boolean> => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://terarium.shop/api/Terrarium/get/${terrariumId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      
      if (!response.ok) {
        return false;
      }
      
      const result: ApiResponse<TerrariumDetail> = await response.json();
      return result.status === 200 && !!result.data;
    } catch (error) {
      console.error('Error validating terrarium:', error);
      return false;
    }
  };

  const createTerrariumVariant = async (price: number, variantName: string) => {
    try {
      const token = localStorage.getItem('authToken');
      
      // Validate TerrariumId before creating variant
      if (!request?.terrariumId) {
        throw new Error('Terrarium ID is missing');
      }

      const terrariumExists = await validateTerrariumExists(request.terrariumId);
      if (!terrariumExists) {
        throw new Error('Terrarium not found in the database');
      }

      // Prepare form data for multipart/form-data request
      const formData = new FormData();
      formData.append('TerrariumId', request.terrariumId.toString());
      formData.append('VariantName', variantName);
      formData.append('Price', price.toString());
      formData.append('StockQuantity', '1');
      formData.append('CreatedAt', new Date().toISOString());
      formData.append('UpdatedAt', new Date().toISOString());

      const response = await fetch('https://terarium.shop/api/TerrariumVariant/create-terrariumVariant', {
        method: 'POST',
        headers: {
          'accept': 'text/plain',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating terrarium variant:', error);
      throw error;
    }
  };

  const approveRequest = async (price: number, notes: string) => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`https://terarium.shop/api/TerrariumLayout/${request?.layoutId}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          status: 'Approved',
          price: price,
          notes: notes
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error approving request:', error);
      throw error;
    }
  };

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
    }
  };

  const handleAccessoriesNext = async () => {
    try {
      setProcessing(true);
      await updateTerrariumAccessories();
      setCurrentStep('variant');
      toast.success('Đã cập nhật danh sách phụ kiện thành công');
    } catch (error) {
      console.error('Error in handleAccessoriesNext:', error);
      toast.error('Có lỗi khi cập nhật phụ kiện');
    } finally {
      setProcessing(false);
    }
  };

  const handleAccessoriesPrev = () => {
    navigate('/staff/support/requests');
  };

  // Show modal to get variant name and notes
  const showCreateVariantModal = () => {
    // Set default values
    form.setFieldsValue({
      variantName: `${request?.layoutName} - Custom`,
      notes: 'Terrarium đã được duyệt và tạo variant thành công'
    });
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setIsModalVisible(false);
      await executeCreateVariantAndApprove(values.variantName, values.notes);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  const executeCreateVariantAndApprove = async (variantName: string, notes: string) => {
    const totalPrice = calculateTotalPrice();

    try {
      setProcessing(true);

      // Step 1: Create terrarium variant
      console.log('Creating terrarium variant...');
      message.loading({ content: 'Đang tạo variant terrarium...', key: 'variant' });
      await createTerrariumVariant(totalPrice, variantName);
      message.success({ content: 'Tạo variant thành công!', key: 'variant', duration: 2 });

      // Step 2: Approve the request
      console.log('Approving request...');
      message.loading({ content: 'Đang phê duyệt yêu cầu...', key: 'approve' });
      await approveRequest(totalPrice, notes);
      message.success({ content: 'Phê duyệt thành công!', key: 'approve', duration: 2 });

      // Step 3: Create notification
      if (request?.userId) {
        console.log('Creating notification...');
        message.loading({ content: 'Đang gửi thông báo...', key: 'notification' });
        await createNotification(
          request.userId,
          'Yêu cầu custom terrarium',
          notes
        );
        message.success({ content: 'Gửi thông báo thành công!', key: 'notification', duration: 2 });
      }

      setCurrentStep('complete');
      message.success('Đã tạo variant và phê duyệt yêu cầu thành công!');

    } catch (error: any) {
      console.error('Error in workflow:', error);
      if (error.message.includes('Terrarium not found')) {
        message.error('Không tìm thấy terrarium với ID cung cấp. Vui lòng kiểm tra lại.');
      } else {
        message.error('Có lỗi xảy ra trong quá trình xử lý: ' + error.message);
      }
    } finally {
      setProcessing(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  if (!request || !terrariumDetail) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">Không tìm thấy thông tin yêu cầu hoặc terrarium</div>
        <button 
          onClick={() => navigate('/staff/support/requests')}
          className="mt-2 text-red-600 underline hover:text-red-800"
        >
          Quay lại danh sách yêu cầu
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/staff/support/requests')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Quay lại</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tùy chỉnh Terrarium</h1>
            <p className="text-gray-600">Thêm phụ kiện và tạo variant cho yêu cầu #{request.layoutId}</p>
          </div>
        </div>
      </div>

      {/* Request Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin yêu cầu</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <Package className="w-5 h-5 text-gray-400" />
            <div>
              <div className="text-sm text-gray-500">Tên Terrarium</div>
              <div className="font-medium">{request.layoutName}</div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-gray-400" />
            <div>
              <div className="text-sm text-gray-500">User ID</div>
              <div className="font-medium">#{request.userId}</div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <div className="text-sm text-gray-500">Ngày tạo</div>
              <div className="font-medium">{formatDate(request.createdDate)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Terrarium Detail */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Chi tiết Terrarium</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">{terrariumDetail.terrariumName}</h3>
              <p className="text-gray-600 mt-1">{terrariumDetail.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Giá cơ bản:</span>
                <div className="font-medium">{formatPrice(terrariumDetail.minPrice)} - {formatPrice(terrariumDetail.maxPrice)}</div>
              </div>
              <div>
                <span className="text-gray-500">Tồn kho:</span>
                <div className="font-medium">{terrariumDetail.stock}</div>
              </div>
              <div>
                <span className="text-gray-500">Đánh giá:</span>
                <div className="font-medium">{terrariumDetail.averageRating}/5 ({terrariumDetail.feedbackCount})</div>
              </div>
              <div>
                <span className="text-gray-500">Đã bán:</span>
                <div className="font-medium">{terrariumDetail.purchaseCount}</div>
              </div>
            </div>
          </div>
          <div>
            {terrariumDetail.terrariumImages && terrariumDetail.terrariumImages.length > 0 && (
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
            )}
          </div>
        </div>
      </div>

      {/* Steps */}
      {currentStep === 'accessories' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <Step4Accessories
            selectedAccessories={selectedAccessories}
            onSelectionChange={setSelectedAccessories}
            onNext={handleAccessoriesNext}
            onPrev={handleAccessoriesPrev}
          />
        </div>
      )}

      {currentStep === 'variant' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Xác nhận và tạo Variant</h2>
          
          {/* Markup Percentage Input */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <Calculator className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-blue-900">Tính toán giá bán</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phần trăm công thêm trên phụ kiện (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={markupPercentage}
                  onChange={(e) => setMarkupPercentage(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập phần trăm (VD: 10 cho 10%)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Số phần trăm sẽ được tính trên tổng giá phụ kiện
                </p>
              </div>
              <div className="flex items-end">
                <div className="w-full">
                  <div className="text-sm text-gray-700 mb-2">Tổng giá cuối cùng:</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatPrice(calculateTotalPrice())}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Tóm tắt đơn hàng</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Giá cơ bản terrarium:</span>
                <span className="font-medium">{formatPrice(terrariumDetail.minPrice)}</span>
              </div>
              {selectedAccessories.length > 0 && (
                <>
                  <div className="text-sm text-gray-600 mt-3 mb-2">Phụ kiện đã chọn:</div>
                  {selectedAccessories.map((accessory) => (
                    <div key={accessory.accessoryId} className="flex justify-between text-sm">
                      <span>• {accessory.name}</span>
                      <span>{formatPrice(accessory.price)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm">
                    <span>Tổng phụ kiện:</span>
                    <span className="font-medium">
                      {formatPrice(selectedAccessories.reduce((sum, acc) => sum + acc.price, 0))}
                    </span>
                  </div>
                  {markupPercentage > 0 && (
                    <div className="flex justify-between text-sm text-blue-600">
                      <span>Công thêm ({markupPercentage}%):</span>
                      <span className="font-medium">
                        {formatPrice((selectedAccessories.reduce((sum, acc) => sum + acc.price, 0) * markupPercentage) / 100)}
                      </span>
                    </div>
                  )}
                </>
              )}
              <div className="border-t pt-2 mt-3">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Tổng cộng:</span>
                  <span className="text-green-600">
                    {formatPrice(calculateTotalPrice())}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep('accessories')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={processing}
            >
              Quay lại chọn phụ kiện
            </button>
            <button
              onClick={showCreateVariantModal}
              disabled={processing}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Tạo Variant & Phê duyệt</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {currentStep === 'complete' && (
        <div className="bg-green-50 rounded-lg border border-green-200 p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-green-900 mb-2">Hoàn thành!</h2>
          <p className="text-green-700 mb-4">
            Đã tạo variant terrarium và phê duyệt yêu cầu thành công.
            Khách hàng sẽ nhận được thông báo qua hệ thống.
          </p>
          <div className="text-sm text-gray-600 mb-4">
            Giá cuối cùng: <span className="font-semibold text-green-600">{formatPrice(calculateTotalPrice())}</span>
          </div>
          <button
            onClick={() => navigate('/staff/support/requests')}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Quay lại danh sách yêu cầu
          </button>
        </div>
      )}

      {/* Ant Design Modal for Variant Creation */}
      <Modal
        title="Tạo Variant và Phê duyệt"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
        okText="Xác nhận"
        cancelText="Hủy"
        confirmLoading={processing}
        destroyOnClose
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Thông tin variant sẽ được tạo:</h4>
            <div className="text-sm space-y-1">
              <div>• Terrarium: {terrariumDetail?.terrariumName}</div>
              <div>• Phụ kiện: {selectedAccessories.length} item(s)</div>
              <div>• Giá cuối cùng: <span className="font-semibold text-green-600">{formatPrice(calculateTotalPrice())}</span></div>
            </div>
          </div>
          
          <Form 
            form={form} 
            layout="vertical"
            requiredMark={false}
          >
            <Form.Item
              name="variantName"
              label="Tên Variant"
              rules={[
                { required: true, message: 'Vui lòng nhập tên variant!' },
                { min: 3, message: 'Tên variant phải có ít nhất 3 ký tự!' }
              ]}
            >
              <Input 
                placeholder="Nhập tên variant terrarium"
                maxLength={100}
                showCount
              />
            </Form.Item>
            
            <Form.Item
              name="notes"
              label="Ghi chú phê duyệt"
              rules={[
                { required: true, message: 'Vui lòng nhập ghi chú phê duyệt!' },
                { min: 10, message: 'Ghi chú phải có ít nhất 10 ký tự!' }
              ]}
            >
              <Input.TextArea 
                placeholder="Nhập ghi chú về việc phê duyệt yêu cầu"
                rows={4}
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default TerrariumCustomizePage;