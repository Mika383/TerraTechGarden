
import React, { useState } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { notification } from 'antd';
import { useNavigate } from 'react-router-dom';

// Import step components
import Step1TankMethod from './Step1TankMethod';
import Step2Shape from './Step2Shape';
import Step3Environment from './Step3Environment';
import Step4Accessories from './Step4Accessories';
import Step5FinalDetails from './Step5FinalDetails';

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

const STEPS = [
  { id: 1, title: 'Phương Pháp Tank', description: 'Chọn loại tank phù hợp' },
  { id: 2, title: 'Hình Dạng', description: 'Chọn hình dạng và chất liệu' },
  { id: 3, title: 'Môi Trường', description: 'Chọn loại môi trường sống' },
  { id: 4, title: 'Phụ Kiện', description: 'Chọn các phụ kiện bổ sung' },
  { id: 5, title: 'Hoàn Thiện', description: 'Điền thông tin chi tiết' },
];

const TerrariumCreate: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Selection states
  const [selectedTankMethod, setSelectedTankMethod] = useState<TankMethod | null>(null);
  const [selectedShape, setSelectedShape] = useState<Shape | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | null>(null);
  const [selectedAccessories, setSelectedAccessories] = useState<Accessory[]>([]);

  // Form data state
  const [formData, setFormData] = useState<FormData>({
    terrariumName: '',
    description: '',
    status: 'active',
    bodyHTML: ''
  });

  const navigateToTerrariumList = () => {
    window.location.href = '/manager/terrarium/list';
  };

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
      ...formData,
      tankMethodId: selectedTankMethod.tankMethodId,
      shapeId: selectedShape.shapeId,
      environmentId: selectedEnvironment.environmentId,
      accessories: selectedAccessories,
      accessoryNames: selectedAccessories.map(a => a.name),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://terarium.shop/api/Terrarium/add-terrarium', {
        method: 'POST',
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

      if (result.status === 200 || result.message === "Save data success") {
        setSubmitMessage({ type: 'success', text: 'Terrarium đã được tạo thành công! Đang chuyển hướng...' });
        setTimeout(() => {
          navigateToTerrariumList();
        }, 1500);
      } else {
        throw new Error(result.message || 'Có lỗi xảy ra khi tạo terrarium');
      }
    } catch (error) {
      setSubmitMessage({ 
        type: 'error', 
        text: `Có lỗi xảy ra khi tạo terrarium: ${error instanceof Error ? error.message : 'Unknown error'}` 
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
          <Step4Accessories
            selectedAccessories={selectedAccessories}
            onSelectionChange={setSelectedAccessories}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        );
      case 5:
        return (
          <Step5FinalDetails
            selectedTankMethod={selectedTankMethod}
            selectedShape={selectedShape}
            selectedEnvironment={selectedEnvironment}
            selectedAccessories={selectedAccessories}
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
          <h1 className="text-2xl font-bold text-gray-900">Thêm Terrarium Mới</h1>
          <p className="text-gray-600">Tạo một terrarium mới qua các bước hướng dẫn</p>
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
    </div>
  );
};

export default TerrariumCreate;