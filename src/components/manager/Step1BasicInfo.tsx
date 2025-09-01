import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Upload, X } from 'lucide-react';
import { notification } from 'antd';

interface VariantData {
  terrariumId: number;
  variantName: string;
  price: number;
  urlImage: string;
  stockQuantity: number;
  imageFile: File | null;
  accessories: any[];
  laborCost: number;
}

interface Step1Props {
  data: VariantData;
  onChange: (data: Partial<VariantData>) => void;
  onNext: () => void;
  onPrev?: () => void;
  accessoriesTotal: number;
  showPrevButton?: boolean;
}

const Step1BasicInfo: React.FC<Step1Props> = ({
  data,
  onChange,
  onNext,
  onPrev,
  accessoriesTotal,
  showPrevButton = false,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(
    data.urlImage || null
  );
  const [uploadingImage, setUploadingImage] = useState(false);

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('authToken');
    const response = await fetch('https://terarium.shop/api/Image/upload', {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const result = await response.json();
    return result.url;
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notification.error({
        message: 'Lỗi',
        description: 'Vui lòng chọn file hình ảnh',
        placement: 'topRight',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      notification.error({
        message: 'Lỗi',
        description: 'Kích thước file không được vượt quá 5MB',
        placement: 'topRight',
      });
      return;
    }

    setUploadingImage(true);
    try {
      const imageUrl = await uploadImage(file);
      onChange({ imageFile: file, urlImage: imageUrl });
      setImagePreview(imageUrl);
      notification.success({
        message: 'Thành công',
        description: 'Upload hình ảnh thành công!',
        placement: 'topRight',
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      notification.error({
        message: 'Lỗi',
        description: `Không thể upload hình ảnh: ${error instanceof Error ? error.message : 'Unknown error'}`,
        placement: 'topRight',
      });
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const removeImage = () => {
    onChange({ imageFile: null, urlImage: '' });
    setImagePreview(null);
  };

  const handleNext = () => {
    if (!data.variantName.trim()) {
      notification.error({
        message: 'Lỗi',
        description: 'Vui lòng nhập tên variant',
        placement: 'topRight',
      });
      return;
    }

    if (data.laborCost < 0) {
      notification.error({
        message: 'Lỗi',
        description: 'Tiền công không được âm',
        placement: 'topRight',
      });
      return;
    }

    if (data.stockQuantity < 0) {
      notification.error({
        message: 'Lỗi',
        description: 'Số lượng tồn kho không được âm',
        placement: 'topRight',
      });
      return;
    }

    onNext();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Thông tin cơ bản</h2>
        <p className="text-gray-600">Nhập các thông tin cơ bản cho variant mới</p>
      </div>

      {/* Price Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-blue-900 mb-3">Tính toán giá bán</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-blue-700">Tổng giá trị phụ kiện:</span>
            <span className="font-medium text-blue-900">{formatPrice(accessoriesTotal)} VNĐ</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-blue-700">Tiền công:</span>
            <span className="font-medium text-blue-900">{formatPrice(data.laborCost)} VNĐ</span>
          </div>
          <div className="border-t border-blue-200 pt-2 mt-2">
            <div className="flex justify-between text-base">
              <span className="font-medium text-blue-900">Tổng giá bán:</span>
              <span className="font-bold text-blue-900 text-lg">{formatPrice(data.price)} VNĐ</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Terrarium ID
          </label>
          <input
            type="number"
            value={data.terrariumId}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tên Variant <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.variantName}
            onChange={(e) => onChange({ variantName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập tên variant..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tiền công (VNĐ) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={data.laborCost}
            onChange={(e) => onChange({ laborCost: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
            min="0"
            step="1000"
          />
          <p className="text-xs text-gray-500 mt-1">Chi phí gia công, lắp đặt</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Số lượng tồn kho <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={data.stockQuantity}
            onChange={(e) => onChange({ stockQuantity: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
            min="0"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tổng giá bán (VNĐ)
          </label>
          <input
            type="number"
            value={data.price}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-medium"
          />
          <p className="text-xs text-gray-500 mt-1">Được tính tự động từ phụ kiện + tiền công</p>
        </div>
      </div>

      {/* URL Image Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          URL Hình ảnh
        </label>
        <div className="relative">
          <input
            type="url"
            value={data.urlImage}
            onChange={(e) => {
              onChange({ urlImage: e.target.value });
              if (e.target.value) {
                setImagePreview(e.target.value);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/image.jpg"
            disabled={uploadingImage}
          />
          {data.urlImage && (
            <button
              type="button"
              onClick={removeImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={uploadingImage}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Hoặc tải lên hình ảnh
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
          <div className="space-y-1 text-center">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="mx-auto h-32 w-32 object-cover rounded-lg"
                  onError={() => {
                    setImagePreview(null);
                    notification.error({
                      message: 'Lỗi',
                      description: 'Không thể tải hình ảnh',
                      placement: 'topRight',
                    });
                  }}
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-600"
                  disabled={uploadingImage}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="image-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>{uploadingImage ? 'Đang upload...' : 'Tải lên file'}</span>
                    <input
                      id="image-upload"
                      name="image-upload"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleImageChange}
                      disabled={uploadingImage}
                    />
                  </label>
                  <p className="pl-1">hoặc kéo thả</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF tối đa 5MB</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        {showPrevButton && onPrev ? (
          <button
            type="button"
            onClick={onPrev}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={uploadingImage}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Quay lại
          </button>
        ) : (
          <div></div>
        )}
        
        <button
          onClick={handleNext}
          className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          disabled={uploadingImage}
        >
          Tiếp theo
          <ChevronRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default Step1BasicInfo;