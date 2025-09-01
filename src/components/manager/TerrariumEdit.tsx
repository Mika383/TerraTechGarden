import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Upload as UploadIcon, Copy } from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';
import axios from 'axios';
import { notification } from 'antd';
import { PictureOutlined } from '@ant-design/icons';

// Import step components (reuse from create)
import Step1TankMethod from './Step1TankMethod';
import Step2Shape from './Step2Shape';
import Step3Environment from './Step3Environment';
import Step5FinalDetails from './Step5FinalDetails';

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

interface TerrariumData {
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
  createdAt: string;
  updatedAt: string;
  bodyHTML: string;
  terrariumImages: any[];
}

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

const STEPS = [
  { id: 1, title: 'Phương Pháp Tank', description: 'Chọn loại tank phù hợp' },
  { id: 2, title: 'Hình Dạng', description: 'Chọn hình dạng và chất liệu' },
  { id: 3, title: 'Môi Trường', description: 'Chọn loại môi trường sống' },
  { id: 4, title: 'Hoàn Thiện', description: 'Điền thông tin chi tiết' },
];

const TerrariumEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Selection states
  const [selectedTankMethod, setSelectedTankMethod] = useState<TankMethod | null>(null);
  const [selectedShape, setSelectedShape] = useState<Shape | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | null>(null);

  // Form data state
  const [formData, setFormData] = useState<FormData>({
    terrariumName: '',
    description: '',
    status: 'active',
    bodyHTML: ''
  });

  // Image upload modal states
  const [imgModalOpen, setImgModalOpen] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const editorRef = useRef<any>(null);

  const navigateToTerrariumList = () => {
    window.location.href = '/manager/terrarium/list';
  };

  // Load initial data
  useEffect(() => {
    const loadTerrarium = async () => {
      try {
        setInitialLoading(true);
        const response = await fetch(`https://terarium.shop/api/Terrarium/get/${id}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result: ApiResponse<TerrariumData> = await response.json();
        if (result.status !== 200) throw new Error(result.message || 'Failed to load terrarium data');
        
        const terrarium = result.data;
        
        // Load related data to populate selections
        const [tankMethodResponse, shapeResponse, environmentResponse] = await Promise.all([
          fetch('https://terarium.shop/api/TankMethod/get-all'),
          fetch('https://terarium.shop/api/Shape/get-all'),
          fetch('https://terarium.shop/api/Environment/get-all')
        ]);

        const [tankMethodResult, shapeResult, environmentResult] = await Promise.all([
          tankMethodResponse.json() as Promise<ApiResponse<TankMethod[]>>,
          shapeResponse.json() as Promise<ApiResponse<Shape[]>>,
          environmentResponse.json() as Promise<ApiResponse<Environment[]>>
        ]);

        // Find selected objects based on IDs
        const selectedTankMethod = tankMethodResult.data?.find(
          tm => tm.tankMethodId === terrarium.tankMethodId
        );
        const selectedShape = shapeResult.data?.find(
          s => s.shapeId === terrarium.shapeId
        );
        const selectedEnvironment = environmentResult.data?.find(
          e => e.environmentId === terrarium.environmentId
        );

        // Set form data
        setFormData({
          terrariumName: terrarium.terrariumName,
          description: terrarium.description,
          status: terrarium.status,
          bodyHTML: terrarium.bodyHTML || ''
        });

        // Set selections
        setSelectedTankMethod(selectedTankMethod || null);
        setSelectedShape(selectedShape || null);
        setSelectedEnvironment(selectedEnvironment || null);

      } catch (error) {
        notification.error({
          message: 'Lỗi',
          description: error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải dữ liệu terrarium',
          placement: 'topRight',
        });
        setTimeout(() => navigate('/manager/terrarium/list'), 2000);
      } finally {
        setInitialLoading(false);
      }
    };

    if (id) loadTerrarium();
  }, [id, navigate]);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepNumber: number) => {
    // Allow navigation to previous steps or current step
    if (stepNumber <= currentStep) {
      setCurrentStep(stepNumber);
    }
  };

  const handleFormDataChange = (data: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  // Image upload functions
  const openImageModal = () => {
    setUploadedUrl('');
    setImgModalOpen(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImgUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    formDataUpload.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await axios.post(CLOUDINARY_UPLOAD_URL, formDataUpload);
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
      notification.success({
        message: 'Thành công',
        description: 'Đã copy URL ảnh',
        placement: 'topRight',
      });
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const insertToEditor = () => {
    if (!uploadedUrl || !editorRef.current) return;
    editorRef.current.insertContent(`<img src="${uploadedUrl}" alt="" />`);
    const latest = editorRef.current.getContent();
    setFormData(prev => ({ ...prev, bodyHTML: latest }));
    setImgModalOpen(false);
  };

  const validateAndSubmit = async () => {
    // Validation
    if (!selectedTankMethod) {
      setSubmitMessage({ type: 'error', text: 'Vui lòng chọn phương pháp tank' });
      return;
    }
    if (!selectedShape) {
      setSubmitMessage({ type: 'error', text: 'Vui lòng chọn hình dạng' });
      return;
    }
    if (!selectedEnvironment) {
      setSubmitMessage({ type: 'error', text: 'Vui lòng chọn môi trường' });
      return;
    }
    if (!formData.terrariumName.trim()) {
      setSubmitMessage({ type: 'error', text: 'Vui lòng nhập tên terrarium' });
      return;
    }
    if (!formData.description.trim()) {
      setSubmitMessage({ type: 'error', text: 'Vui lòng nhập mô tả' });
      return;
    }

    setLoading(true);
    setSubmitMessage(null);

    const payload = {
      terrariumId: parseInt(id || '0'),
      environmentId: selectedEnvironment.environmentId,
      shapeId: selectedShape.shapeId,
      tankMethodId: selectedTankMethod.tankMethodId,
      terrariumName: formData.terrariumName,
      description: formData.description,
      status: formData.status,
      bodyHTML: formData.bodyHTML
    };

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://terarium.shop/api/Terrarium/update-terrarium/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        if (response.status === 401) {
          notification.error({
            message: 'Lỗi',
            description: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
            placement: 'topRight',
          });
          navigate('/login');
          return;
        }
        throw new Error((await response.json())?.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 200 || result.message === "Save data success" || result.status === 201) {
        setSubmitMessage({ type: 'success', text: 'Terrarium đã được cập nhật thành công! Đang chuyển hướng...' });
        setTimeout(() => {
          navigateToTerrariumList();
        }, 1500);
      } else {
        throw new Error(result.message || 'Có lỗi xảy ra khi cập nhật terrarium');
      }
    } catch (error) {
      setSubmitMessage({ 
        type: 'error', 
        text: `Có lỗi xảy ra khi cập nhật terrarium: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1TankMethod
            selectedTankMethod={selectedTankMethod}
            onSelect={setSelectedTankMethod}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <Step2Shape
            selectedShape={selectedShape}
            onSelect={setSelectedShape}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        );
      case 3:
        return (
          <Step3Environment
            selectedEnvironment={selectedEnvironment}
            onSelect={setSelectedEnvironment}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        );
      case 4:
        return (
          <Step5FinalDetails
            selectedTankMethod={selectedTankMethod}
            selectedShape={selectedShape}
            selectedEnvironment={selectedEnvironment}
            formData={formData}
            onFormDataChange={handleFormDataChange}
            onSubmit={validateAndSubmit}
            onPrev={handlePrev}
            loading={loading}
            submitMessage={submitMessage}
          />
        );
      default:
        return null;
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <button 
          type="button" 
          onClick={navigateToTerrariumList} 
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chỉnh Sửa Terrarium</h1>
          <p className="text-gray-600">Cập nhật thông tin terrarium #{id}</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => handleStepClick(step.id)}
                disabled={step.id > currentStep}
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-medium transition-colors duration-200 ${
                  step.id === currentStep
                    ? 'bg-blue-600 text-white border-blue-600'
                    : step.id < currentStep
                    ? 'bg-green-600 text-white border-green-600 hover:bg-green-700 cursor-pointer'
                    : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                }`}
              >
                {step.id < currentStep ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.id
                )}
              </button>
              
              <div className="ml-3 hidden sm:block">
                <div className={`text-sm font-medium ${step.id <= currentStep ? 'text-gray-900' : 'text-gray-400'}`}>
                  {step.title}
                </div>
                <div className={`text-xs ${step.id <= currentStep ? 'text-gray-600' : 'text-gray-400'}`}>
                  {step.description}
                </div>
              </div>
              
              {index < STEPS.length - 1 && (
                <div className={`hidden sm:block w-12 h-0.5 mx-4 ${step.id < currentStep ? 'bg-green-600' : 'bg-gray-300'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-8">
          {renderStepContent()}
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

export default TerrariumEdit;