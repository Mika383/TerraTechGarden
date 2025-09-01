import React, { useRef, useState } from 'react';
import { ChevronLeft, Save, Loader2, AlertCircle, Upload as UploadIcon, Link, Copy } from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';
import axios from 'axios';
import {PictureOutlined} from '@ant-design/icons'
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
  formData,
  onFormDataChange,
  onSubmit,
  onPrev,
  loading,
  submitMessage
}) => {
  const editorRef = useRef<any>(null);
  
  // Modal state cho upload ảnh
  const [imgModalOpen, setImgModalOpen] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string>('');

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

  // Cloudinary upload functions
  const openImageModal = () => {
    setUploadedUrl('');
    setImgModalOpen(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImgUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await axios.post(CLOUDINARY_UPLOAD_URL, formData);
      const url = response.data.secure_url;
      setUploadedUrl(url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setImgUploading(false);
    }
  };

  const copyUrl = async () => {
    if (!uploadedUrl) return;
    try {
      await navigator.clipboard.writeText(uploadedUrl);
      alert('Đã copy URL ảnh');
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const insertToEditor = () => {
    if (!uploadedUrl || !editorRef.current) return;
    editorRef.current.insertContent(`<img src="${uploadedUrl}" alt="" />`);
    const latest = editorRef.current.getContent();
    onFormDataChange({ bodyHTML: latest });
    setImgModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Thông Tin Chi Tiết</h2>
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
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Nội dung HTML (Tùy chọn)</h3>
              <button
                type="button"
                onClick={openImageModal}
                className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <PictureOutlined className="w-4 h-4 mr-1" />
                Upload ảnh
              </button>
            </div>
            
            <Editor
              apiKey="lfiqogz55f5k6y6cuza7ih9b59tc7t8h62v0z9lp8661yu2w"
              value={formData.bodyHTML}
              onInit={(_, editor) => {
                editorRef.current = editor;
              }}
              onEditorChange={handleEditorChange}
              init={{
                height: 500,
                menubar: false,
                plugins: 'lists link image code table',
                toolbar: 'undo redo | blocks | bold italic underline | alignleft aligncenter alignright | bullist numlist | link image | removeformat | code',
                automatic_uploads: false,
                paste_data_images: false,
                content_style: 'body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; font-size:14px } img{max-width:100%;height:auto;}'
              }}
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

      {/* Image Upload Modal */}
      {imgModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Upload ảnh (Cloudinary)</h3>
              <button 
                onClick={() => setImgModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <UploadIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Kéo & thả ảnh vào đây hoặc bấm để chọn</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={imgUploading}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700 disabled:opacity-50"
              >
                {imgUploading ? 'Đang upload...' : 'Chọn ảnh'}
              </label>
            </div>

            {uploadedUrl && (
              <div className="mt-4">
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={uploadedUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="URL ảnh sau khi upload"
                  />
                  <button
                    onClick={copyUrl}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={insertToEditor}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Chèn vào nội dung
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Step5FinalDetails;