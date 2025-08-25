import React from 'react';
import { ChevronLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';
import axios from 'axios';

const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/dsp6pjeey/upload';
const CLOUDINARY_UPLOAD_PRESET = 'TerraTech';

interface TankMethod {
  tankMethodId: number;
  tankMethodType: string;
  tankMethodDescription: string;
}

interface Shape {
  shapeId: number;
  shapeName: string;
  shapeDescription: string;
  shapeMaterial: string;
}

interface Environment {
  environmentId: number;
  environmentName: string;
  environmentDescription: string;
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

interface FormData {
  terrariumName: string;
  description: string;
  status: string;
  bodyHTML: string;
}

interface Step5Props {
  selectedTankMethod: TankMethod | null;
  selectedShape: Shape | null;
  selectedEnvironment: Environment | null;
  selectedAccessories: Accessory[];
  formData: FormData;
  onFormDataChange: (data: Partial<FormData>) => void;
  onSubmit: () => void;
  onPrev: () => void;
  loading: boolean;
  submitMessage: { type: 'success' | 'error'; text: string } | null;
}

const Step5FinalDetails: React.FC<Step5Props> = ({
  selectedTankMethod,
  selectedShape,
  selectedEnvironment,
  selectedAccessories,
  formData,
  onFormDataChange,
  onSubmit,
  onPrev,
  loading,
  submitMessage
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onFormDataChange({ [name]: value });
  };

  const handleEditorChange = (content: string) => {
    onFormDataChange({ bodyHTML: content });
  };

  const canSubmit = formData.terrariumName.trim() && 
                   formData.description.trim() && 
                   selectedTankMethod && 
                   selectedShape && 
                   selectedEnvironment;

  const totalAccessoryPrice = selectedAccessories.reduce((sum, acc) => sum + acc.price, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Bước 5: Thông Tin Chi Tiết</h2>
        <p className="text-gray-600">Hoàn thiện thông tin cho terrarium của bạn</p>
      </div>

      {submitMessage && (
        <div className={`p-4 rounded-lg ${
          submitMessage.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            {submitMessage.type === 'success' ? (
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center mr-3">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <AlertCircle className="w-5 h-5 mr-3" />
            )}
            {submitMessage.text}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin cơ bản</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên Terrarium *</label>
                <input
                  type="text"
                  name="terrariumName"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.terrariumName}
                  onChange={handleInputChange}
                  placeholder="Nhập tên terrarium"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả *</label>
                <textarea
                  name="description"
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Mô tả chi tiết về terrarium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái *</label>
                <select
                  name="status"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Nội dung HTML (Tùy chọn)</h3>
            <Editor
              apiKey="2pcpzgtdmmp5f43t7bqpc9rmxkok9ben1axiy628f53zad6s"
              value={formData.bodyHTML}
              init={{
                height: 400,
                resize: true,
                plugins: ['advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table', 'paste', 'help', 'wordcount'],
                toolbar: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | image | help',
                images_upload_handler: async (blobInfo: any, success: (url: string) => void, failure: (err: string) => void) => {
                  const formDataUpload = new FormData();
                  formDataUpload.append('file', blobInfo.blob());
                  formDataUpload.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                  try {
                    const res = await axios.post(CLOUDINARY_UPLOAD_URL, formDataUpload);
                    success(res.data.secure_url || '');
                  } catch {
                    failure('Upload ảnh thất bại');
                  }
                },
                content_style: 'img { max-width: 400px; height: auto; }'
              }}
              onEditorChange={handleEditorChange}
            />
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tóm tắt lựa chọn</h3>
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-700 text-sm">Phương pháp Tank</div>
                <div className="text-sm text-gray-600 mt-1">
                  {selectedTankMethod ? selectedTankMethod.tankMethodType : 'Chưa chọn'}
                </div>
                {selectedTankMethod && (
                  <div className="text-xs text-gray-500 mt-1">{selectedTankMethod.tankMethodDescription}</div>
                )}
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-700 text-sm">Hình dạng</div>
                <div className="text-sm text-gray-600 mt-1">
                  {selectedShape ? selectedShape.shapeName : 'Chưa chọn'}
                </div>
                {selectedShape && (
                  <div className="text-xs text-gray-500 mt-1">
                    <div>{selectedShape.shapeDescription}</div>
                    <div>Chất liệu: {selectedShape.shapeMaterial}</div>
                  </div>
                )}
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-700 text-sm">Môi trường</div>
                <div className="text-sm text-gray-600 mt-1">
                  {selectedEnvironment ? selectedEnvironment.environmentName : 'Chưa chọn'}
                </div>
                {selectedEnvironment && (
                  <div className="text-xs text-gray-500 mt-1">{selectedEnvironment.environmentDescription}</div>
                )}
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-700 text-sm">Phụ kiện</div>
                <div className="text-sm text-gray-600 mt-1">
                  {selectedAccessories.length === 0 ? 'Chưa chọn' : `${selectedAccessories.length} phụ kiện đã chọn`}
                </div>
                {selectedAccessories.length > 0 && (
                  <div className="text-xs text-gray-500 mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {selectedAccessories.map(accessory => (
                      <div key={accessory.accessoryId} className="flex justify-between items-center">
                        <span className="truncate max-w-[120px]" title={accessory.name}>{accessory.name}</span>
                        <span className="text-blue-600 font-medium">{accessory.price.toLocaleString()} VNĐ</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-300">
                      <div className="flex justify-between font-medium text-gray-700">
                        <span>Tổng giá trị:</span>
                        <span className="text-blue-600">{totalAccessoryPrice.toLocaleString()} VNĐ</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="space-y-3">
              <button
                type="button"
                onClick={onSubmit}
                disabled={!canSubmit || loading}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{loading ? 'Đang lưu...' : 'Tạo Terrarium'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onPrev}
          disabled={loading}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Quay lại
        </button>
        <div className="text-sm text-gray-500">
          {!canSubmit && "Vui lòng điền đầy đủ thông tin bắt buộc"}
        </div>
      </div>
    </div>
  );
};

export default Step5FinalDetails;