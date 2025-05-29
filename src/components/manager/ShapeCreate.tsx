import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import { toast } from 'react-toastify';

interface ShapeFormData {
  name: string;
  description: string;
}

interface ImageFile {
  file: File;
  preview: string;
  loading: boolean;
  error?: string;
}

const ShapeCreate: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ShapeFormData>({
    name: '',
    description: '',
  });
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<ShapeFormData>>({});

  const validateForm = useCallback((): boolean => {
    const errors: Partial<ShapeFormData> = {};
    if (!formData.name.trim()) {
      errors.name = 'Tên hình dạng là bắt buộc';
    }
    if (!formData.description.trim()) {
      errors.description = 'Mô tả là bắt buộc';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const validateImage = (file: File): { valid: boolean; error?: string } => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      return { valid: false, error: 'Chỉ hỗ trợ PNG, JPG, JPEG, GIF' };
    }
    if (file.size > maxSize) {
      return { valid: false, error: 'Kích thước file không được vượt quá 10MB' };
    }
    return { valid: true };
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newImages: ImageFile[] = [];

    for (const file of files) {
      const { valid, error } = validateImage(file);
      if (!valid) {
        toast.error(error);
        continue;
      }

      const image: ImageFile = {
        file,
        preview: '',
        loading: true,
        error: undefined,
      };

      try {
        const preview = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
        image.preview = preview;
        image.loading = false;
      } catch (err) {
        image.loading = false;
        image.error = 'Không thể tải hình ảnh';
        toast.error(`Không thể tải ${file.name}`);
      }

      newImages.push(image);
    }

    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      const payload = {
        ...formData,
        images: images.map((img) => img.file),
      };
      console.log('Submitting shape data:', payload);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Hình dạng đã được tạo thành công!');
      navigate('/manager/shape/list');
    } catch (error) {
      console.error('Error creating shape:', error);
      toast.error('Có lỗi xảy ra khi tạo hình dạng');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/manager/shape/list')}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          disabled={isSubmitting}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thêm Hình dạng Mới</h1>
          <p className="text-gray-600">Tạo một hình dạng terrarium mới trong hệ thống</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin cơ bản</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên Hình dạng *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nhập tên hình dạng"
                    disabled={isSubmitting}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Mô tả chi tiết về hình dạng"
                    disabled={isSubmitting}
                  />
                  {formErrors.description && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Images */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Hình ảnh</h3>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/gif"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="imageUpload"
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor="imageUpload"
                    className={`cursor-pointer flex flex-col items-center space-y-2 ${
                      isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600">Click để tải lên hình ảnh</span>
                    <span className="text-xs text-gray-500">PNG, JPG, GIF tối đa 10MB</span>
                  </label>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        {image.loading ? (
                          <div className="w-full h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : (
                          <>
                            <img
                              src={image.preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            {!isSubmitting && (
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </>
                        )}
                        {image.error && (
                          <p className="text-xs text-red-500 mt-1">{image.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isSubmitting ? 'Đang lưu...' : 'Lưu Hình dạng'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/manager/shape/list')}
                  disabled={isSubmitting}
                  className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ShapeCreate;