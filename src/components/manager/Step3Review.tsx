import React from 'react';
import { ChevronLeft, Package, DollarSign, Image as ImageIcon, Wrench } from 'lucide-react';

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

interface VariantData {
  terrariumId: number;
  variantName: string;
  price: number;
  urlImage: string;
  stockQuantity: number;
  imageFile: File | null;
  accessories: SelectedAccessory[];
  laborCost: number;
}

interface Step3Props {
  data: VariantData;
  availableAccessories: Accessory[];
  onPrev: () => void;
  onSubmit: () => void;
  loading: boolean;
  accessoriesTotal: number;
}

const Step3Review: React.FC<Step3Props> = ({
  data,
  availableAccessories,
  onPrev,
  onSubmit,
  loading,
  accessoriesTotal,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getTotalQuantity = () => {
    return data.accessories.reduce((sum, acc) => sum + acc.quantity, 0);
  };

  const getImageUrl = () => {
    if (data.imageFile) {
      return URL.createObjectURL(data.imageFile);
    }
    return data.urlImage;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Xác nhận thông tin</h2>
        <p className="text-gray-600">Xem lại thông tin trước khi tạo variant</p>
      </div>

      {/* Basic Information Review */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin cơ bản</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Terrarium ID</label>
              <p className="text-base text-gray-900">{data.terrariumId}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Tên Variant</label>
              <p className="text-base text-gray-900 font-medium">{data.variantName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Tiền công</label>
              <p className="text-base text-gray-900 font-medium">{formatPrice(data.laborCost)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Tổng giá bán</label>
              <p className="text-base font-bold text-blue-600">{formatPrice(data.price)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Số lượng tồn kho</label>
              <p className="text-base text-gray-900">{data.stockQuantity}</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Hình ảnh</label>
            {getImageUrl() ? (
              <div className="w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={getImageUrl()}
                  alt={data.variantName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}
            {data.imageFile && (
              <p className="text-xs text-gray-500 mt-2">File: {data.imageFile.name}</p>
            )}
            {data.urlImage && !data.imageFile && (
              <p className="text-xs text-gray-500 mt-2">URL: {data.urlImage}</p>
            )}
          </div>
        </div>
      </div>

      {/* Accessories Review */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Phụ kiện đã chọn</h3>
          {data.accessories.length > 0 && (
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{getTotalQuantity()} sản phẩm</span>
              <span className="font-medium">{formatPrice(accessoriesTotal)}</span>
            </div>
          )}
        </div>
        
        {data.accessories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p>Không có phụ kiện nào được chọn</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.accessories.map((acc) => (
              <div key={acc.accessoryId} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{acc.accessory.name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      Kích thước: {acc.accessory.size || 'Không có'} • 
                      Danh mục ID: {acc.accessory.categoryId}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {acc.accessory.description}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-medium text-gray-900">
                      {formatPrice(acc.accessory.price)} × {acc.quantity}
                    </div>
                    <div className="text-sm text-gray-500">
                      = {formatPrice(acc.accessory.price * acc.quantity)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Price Breakdown Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-4">Chi tiết giá bán</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-600">Phụ kiện</p>
              <p className="text-xl font-bold text-green-900">{formatPrice(accessoriesTotal)}</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg mr-4">
              <Wrench className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-orange-600">Tiền công</p>
              <p className="text-xl font-bold text-orange-900">{formatPrice(data.laborCost)}</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600">Tổng giá bán</p>
              <p className="text-xl font-bold text-blue-900">{formatPrice(data.price)}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-blue-200">
          <div className="text-sm text-blue-700 space-y-1">
            <p>• Tổng giá trị phụ kiện: {formatPrice(accessoriesTotal)} ({getTotalQuantity()} sản phẩm)</p>
            <p>• Tiền công gia công, lắp đặt: {formatPrice(data.laborCost)}</p>
            <p className="font-medium text-base">• Tổng giá bán cuối cùng: {formatPrice(data.price)}</p>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <div className="text-yellow-500 mt-0.5">ℹ️</div>
          <div>
            <h4 className="text-yellow-800 font-medium">Lưu ý quan trọng</h4>
            <ul className="text-yellow-700 text-sm mt-1 space-y-1">
              <li>• Giá bán được tính tự động từ tổng phụ kiện + tiền công</li>
              <li>• Sau khi tạo, bạn có thể chỉnh sửa variant trong danh sách variants</li>
              <li>• Phụ kiện có thể được thêm/xóa sau khi tạo variant</li>
              <li>• Hình ảnh sẽ được tải lên tự động nếu bạn đã chọn file</li>
              <li>• Kiểm tra kỹ thông tin vì một số thay đổi có thể ảnh hưởng đến đơn hàng</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onPrev}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
          disabled={loading}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Quay lại
        </button>
        
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Đang tạo variant...
            </>
          ) : (
            'Tạo Variant'
          )}
        </button>
      </div>
    </div>
  );
};

export default Step3Review;