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

interface SelectedAccessory {
  accessoryId: number;
  quantity: number;
  accessory: Accessory;
}

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

interface VariantFormData {
  variantName: string;
  notes: string;
  laborCost: number;
}

const TerrariumCustomizePage: React.FC = () => {
  const { layoutId } = useParams<{ layoutId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [request] = useState<TerrariumRequest | null>(location.state?.request || null);
  const [terrariumDetail, setTerrariumDetail] = useState<TerrariumDetail | null>(null);
  const [selectedAccessories, setSelectedAccessories] = useState<SelectedAccessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'accessories' | 'variant' | 'complete'>('accessories');
  
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

  const calculateAccessoriesTotal = () => {
    return selectedAccessories.reduce((sum, acc) => sum + (acc.accessory.price * acc.quantity), 0);
  };

  const calculateTotalPrice = (laborCost: number = 0) => {
    const basePrice = terrariumDetail?.minPrice || 0;
    const accessoriesPrice = calculateAccessoriesTotal();
    return basePrice + accessoriesPrice + laborCost;
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

  const createTerrariumVariant = async (price: number, variantName: string, laborCost: number) => {
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

      // Get first terrarium image for variant
      const imageUrl = terrariumDetail?.terrariumImages?.[0]?.imageUrl || '';

      // Prepare request body
      const requestBody = {
        terrariumId: request.terrariumId,
        variantName: variantName,
        price: price,
        urlImage: imageUrl,
        stockQuantity: 1, // Default to 1 for custom variants
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        accessories: selectedAccessories.map(acc => ({
          accessoryId: acc.accessoryId,
          quantity: acc.quantity
        }))
      };

      const response = await fetch('https://terarium.shop/api/TerrariumVariant/create-terrariumVariant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(requestBody),
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

  const handleAccessoriesNext = () => {
    setCurrentStep('variant');
    toast.success('Đã chọn phụ kiện thành công');
  };

  const handleAccessoriesPrev = () => {
    navigate('/staff/support/requests');
  };

  // Convert SelectedAccessory[] to the format expected by Step4Accessories
  const handleAccessoriesChange = (accessories: SelectedAccessory[]) => {
    setSelectedAccessories(accessories);
  };

  // Show modal to get variant name, labor cost, and notes
  const showCreateVariantModal = () => {
    // Set default values
    form.setFieldsValue({
      variantName: `${request?.layoutName} - Custom`,
      notes: 'Terrarium đã được duyệt và tạo variant thành công',
      laborCost: 0
    });
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setIsModalVisible(false);
      await executeCreateVariantAndApprove(values.variantName, values.notes, values.laborCost);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  const executeCreateVariantAndApprove = async (variantName: string, notes: string, laborCost: number) => {
    const totalPrice = calculateTotalPrice(laborCost);

    try {
      setProcessing(true);

      // Step 1: Create terrarium variant
      console.log('Creating terrarium variant...');
      message.loading({ content: 'Đang tạo variant terrarium...', key: 'variant' });
      await createTerrariumVariant(totalPrice, variantName, laborCost);
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
            onSelectionChange={handleAccessoriesChange}
            onNext={handleAccessoriesNext}
            onPrev={handleAccessoriesPrev}
          />
        </div>
      )}

      {currentStep === 'variant' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Xác nhận và tạo Variant</h2>
          
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
                      <span>• {accessory.accessory.name} x{accessory.quantity}</span>
                      <span>{formatPrice(accessory.accessory.price * accessory.quantity)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm">
                    <span>Tổng phụ kiện:</span>
                    <span className="font-medium">
                      {formatPrice(calculateAccessoriesTotal())}
                    </span>
                  </div>
                </>
              )}
              <div className="border-t pt-2 mt-3">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Tạm tính (chưa bao gồm tiền công):</span>
                  <span className="text-green-600">
                    {formatPrice(calculateTotalPrice(0))}
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
              <div>• Giá cơ bản + phụ kiện: <span className="font-semibold text-green-600">{formatPrice(calculateTotalPrice(0))}</span></div>
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
              name="laborCost"
              label="Tiền công (VNĐ)"
              rules={[
                { required: true, message: 'Vui lòng nhập tiền công!' },
                { type: 'number', min: 0, message: 'Tiền công không được âm!' }
              ]}
            >
              <Input
                type="number"
                placeholder="Nhập tiền công gia công, lắp đặt"
                min={0}
                step={1000}
                style={{ width: '100%' }}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  form.setFieldValue('laborCost', value);
                }}
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

          {/* Real-time price preview */}
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm text-green-700">
              <div>Tổng giá cuối cùng sẽ bao gồm:</div>
              <div>• Giá cơ bản + phụ kiện: {formatPrice(calculateTotalPrice(0))}</div>
              <div>• Tiền công: {formatPrice(form.getFieldValue('laborCost') || 0)}</div>
              <div className="font-semibold mt-1">
                Tổng cộng: {formatPrice(calculateTotalPrice(form.getFieldValue('laborCost') || 0))}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TerrariumCustomizePage;