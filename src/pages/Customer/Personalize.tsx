import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from 'antd';
import { ArrowRightOutlined, HomeOutlined } from '@ant-design/icons';
import { ToastContainer, toast } from 'react-toastify';
import { gsap } from 'gsap';
import 'react-toastify/dist/ReactToastify.css';

import cylinderImg from '../../assets/image/tron.webp';
import rectangleImg from '../../assets/image/chunhat.jpg';
import squareImg from '../../assets/image/hop.jpg';
import forestImg from '../../assets/image/1.jpg';
import desertImg from '../../assets/image/2.jpg';
import aquaticImg from '../../assets/image/3.jpg';

interface UserPreferences {
  experienceLevel: string | null;
  purpose: string | null;
  tankShape: string | null;
  environment: string | null;
  agreeToProvideInfo: boolean | null;
}

const Personalize: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<UserPreferences>({
    experienceLevel: null,
    purpose: null,
    tankShape: null,
    environment: null,
    agreeToProvideInfo: null,
  });
  const cardRef = useRef<HTMLDivElement>(null);

  // Tạm thời vô hiệu hóa animation để kiểm tra
  useEffect(() => {
    if (cardRef.current) {
      // Chỉ áp dụng opacity: 1 để đảm bảo hiển thị rõ
      gsap.set(cardRef.current, { opacity: 1, y: 0 });
    }
  }, [currentStep]);

  const handleNext = () => {
    const currentField = steps[currentStep].field;
    if (currentStep === 0 && !preferences.agreeToProvideInfo) {
      toast.error('Vui lòng đồng ý cung cấp thông tin để tiếp tục!', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }
    if (currentStep > 0 && !preferences[currentField as keyof UserPreferences]) {
      toast.error('Vui lòng chọn một tùy chọn trước khi tiếp tục!', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      if (cardRef.current) {
        // Tạm thời bỏ animation chuyển bước
        gsap.set(cardRef.current, { opacity: 1, y: 0 });
      }
    } else {
      console.log('Saving preferences:', preferences);
      toast.success('Cảm ơn bạn đã hoàn thành! Đang lưu thông tin...', {
        position: 'top-right',
        autoClose: 3000,
      });
      setTimeout(() => navigate('/'), 3000);
    }
  };

  const triggerSelectionAnimation = () => {
    if (cardRef.current) {
      // Tạm thời vô hiệu hóa animation chọn
      gsap.set(cardRef.current, { scale: 1 });
    }
  };

  const handleSelection = (field: keyof UserPreferences, value: string | boolean) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
    triggerSelectionAnimation();
  };

  const handleSkip = () => {
    toast.info('Bạn đã bỏ qua quá trình cá nhân hóa. Chào mừng bạn!', {
      position: 'top-right',
      autoClose: 3000,
    });
    navigate('/');
  };

  const steps = [
    {
      title: 'Chào mừng bạn!',
      content: (
        <div className="text-center">
          <h2 className="text-4xl font-bold text-green-900 mb-6">Chào bạn đến với TerraTechGarden!</h2>
          <p className="text-xl text-gray-800 mb-8">
            Để mang đến trải nghiệm tốt nhất, chúng tôi muốn tìm hiểu thêm về sở thích của bạn. 
            Hãy dành chút thời gian trả lời các câu hỏi sau nhé!
          </p>
          <div className="flex flex-col items-center space-y-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={preferences.agreeToProvideInfo === true}
                onChange={(e) => handleSelection('agreeToProvideInfo', e.target.checked)}
                className="h-5 w-5 text-green-600 border-green-300 focus:ring-green-500"
              />
              <span className="text-lg text-brown-900">Tôi đồng ý cung cấp thông tin để nâng cao trải nghiệm của mình</span>
            </label>
          </div>
          <div className="mt-8 flex justify-center space-x-6">
            <Button
              type="primary"
              className="bg-green-600 hover:bg-green-700 text-lg px-6 py-3 transition duration-300 transform hover:scale-105"
              onClick={handleNext}
              disabled={preferences.agreeToProvideInfo !== true}
            >
              Bắt đầu <ArrowRightOutlined />
            </Button>
            <Button
              type="default"
              className="bg-gray-200 hover:bg-gray-300 text-lg px-6 py-3 transition duration-300 transform hover:scale-105"
              onClick={handleSkip}
            >
              Bỏ qua
            </Button>
          </div>
        </div>
      ),
      field: 'agreeToProvideInfo',
    },
    {
      title: 'Bạn là ai trong thế giới Terrarium?',
      field: 'experienceLevel',
      content: (
        <div className="flex flex-col space-y-6">
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer ${preferences.experienceLevel === 'beginner' ? 'border-green-600 bg-green-50' : 'border-gray-300'} hover:shadow-lg hover:border-green-700 hover:bg-green-100 transition duration-300`}
            onClick={() => handleSelection('experienceLevel', 'beginner')}
          >
            <h3 className="text-2xl font-semibold text-green-900">Người mới bắt đầu tìm hiểu về terrarium</h3>
          </div>
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer ${preferences.experienceLevel === 'owner' ? 'border-green-600 bg-green-50' : 'border-gray-300'} hover:shadow-lg hover:border-green-700 hover:bg-green-100 transition duration-300`}
            onClick={() => handleSelection('experienceLevel', 'owner')}
          >
            <h3 className="text-2xl font-semibold text-green-900">Người đã sở hữu terrarium và muốn tìm hiểu thêm</h3>
          </div>
        </div>
      ),
    },
    {
      title: 'Bạn tìm đến trang web này để làm gì?',
      field: 'purpose',
      content: (
        <div className="flex flex-col space-y-6">
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer ${preferences.purpose === 'buy_terrarium' ? 'border-green-600 bg-green-50' : 'border-gray-300'} hover:shadow-lg hover:border-green-700 hover:bg-green-100 transition duration-300`}
            onClick={() => handleSelection('purpose', 'buy_terrarium')}
          >
            <h3 className="text-2xl font-semibold text-green-900">Mua terrarium</h3>
          </div>
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer ${preferences.purpose === 'buy_accessories' ? 'border-green-600 bg-green-50' : 'border-gray-300'} hover:shadow-lg hover:border-green-700 hover:bg-green-100 transition duration-300`}
            onClick={() => handleSelection('purpose', 'buy_accessories')}
          >
            <h3 className="text-2xl font-semibold text-green-900">Mua phụ kiện</h3>
          </div>
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer ${preferences.purpose === 'learn_care' ? 'border-green-600 bg-green-50' : 'border-gray-300'} hover:shadow-lg hover:border-green-700 hover:bg-green-100 transition duration-300`}
            onClick={() => handleSelection('purpose', 'learn_care')}
          >
            <h3 className="text-2xl font-semibold text-green-900">Tìm hiểu về cách chăm sóc terrarium</h3>
          </div>
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer ${preferences.purpose === 'create_terrarium' ? 'border-green-600 bg-green-50' : 'border-gray-300'} hover:shadow-lg hover:border-green-700 hover:bg-green-100 transition duration-300`}
            onClick={() => handleSelection('purpose', 'create_terrarium')}
          >
            <h3 className="text-2xl font-semibold text-green-900">Tạo một bể terrarium</h3>
          </div>
        </div>
      ),
    },
    {
      title: 'Hình dáng bể nào bạn thích?',
      field: 'tankShape',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer ${preferences.tankShape === 'cylinder' ? 'border-green-600 bg-green-50' : 'border-gray-300'} hover:shadow-xl hover:border-green-700 hover:bg-green-100 transition duration-300 transform hover:scale-105`}
            onClick={() => handleSelection('tankShape', 'cylinder')}
          >
            <img src={cylinderImg} alt="Trụ tròn" className="w-full h-48 object-cover rounded-md mb-4" />
            <h3 className="text-2xl font-semibold text-center text-green-900">Trụ tròn</h3>
          </div>
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer ${preferences.tankShape === 'rectangle' ? 'border-green-600 bg-green-50' : 'border-gray-300'} hover:shadow-xl hover:border-green-700 hover:bg-green-100 transition duration-300 transform hover:scale-105`}
            onClick={() => handleSelection('tankShape', 'rectangle')}
          >
            <img src={rectangleImg} alt="Trụ chữ nhật" className="w-full h-48 object-cover rounded-md mb-4" />
            <h3 className="text-2xl font-semibold text-center text-green-900">Trụ chữ nhật</h3>
          </div>
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer ${preferences.tankShape === 'square' ? 'border-green-600 bg-green-50' : 'border-gray-300'} hover:shadow-xl hover:border-green-700 hover:bg-green-100 transition duration-300 transform hover:scale-105`}
            onClick={() => handleSelection('tankShape', 'square')}
          >
            <img src={squareImg} alt="Hình vuông" className="w-full h-48 object-cover rounded-md mb-4" />
            <h3 className="text-2xl font-semibold text-center text-green-900">Hình vuông</h3>
          </div>
        </div>
      ),
    },
    {
      title: 'Môi trường Terrarium nào bạn thích?',
      field: 'environment',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer ${preferences.environment === 'forest' ? 'border-green-600 bg-green-50' : 'border-gray-300'} hover:shadow-xl hover:border-green-700 hover:bg-green-100 transition duration-300 transform hover:scale-105`}
            onClick={() => handleSelection('environment', 'forest')}
          >
            <img src={forestImg} alt="Bể rừng" className="w-full h-48 object-cover rounded-md mb-4" />
            <h3 className="text-2xl font-semibold text-center text-green-900">Bể rừng</h3>
          </div>
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer ${preferences.environment === 'desert' ? 'border-green-600 bg-green-50' : 'border-gray-300'} hover:shadow-xl hover:border-green-700 hover:bg-green-100 transition duration-300 transform hover:scale-105`}
            onClick={() => handleSelection('environment', 'desert')}
          >
            <img src={desertImg} alt="Bể sa mạc" className="w-full h-48 object-cover rounded-md mb-4" />
            <h3 className="text-2xl font-semibold text-center text-green-900">Bể sa mạc</h3>
          </div>
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer ${preferences.environment === 'aquatic' ? 'border-green-600 bg-green-50' : 'border-gray-300'} hover:shadow-xl hover:border-green-700 hover:bg-green-100 transition duration-300 transform hover:scale-105`}
            onClick={() => handleSelection('environment', 'aquatic')}
          >
            <img src={aquaticImg} alt="Bể thủy sinh" className="w-full h-48 object-cover rounded-md mb-4" />
            <h3 className="text-2xl font-semibold text-center text-green-900">Bể thủy sinh</h3>
          </div>
        </div>
      ),
    },
    {
      title: 'Cảm ơn bạn!',
      content: (
        <div className="text-center">
          <h2 className="text-4xl font-bold text-green-900 mb-6">Cảm ơn bạn đã chia sẻ!</h2>
          <p className="text-xl text-gray-800 mb-8">
            Thông tin của bạn đã giúp chúng tôi hiểu hơn về sở thích của bạn. 
            Hãy khám phá thêm các sản phẩm và kiến thức về Terrarium nhé!
          </p>
          <Button
            type="primary"
            className="bg-green-600 hover:bg-green-700 text-lg px-6 py-3 transition duration-300 transform hover:scale-105"
            onClick={() => navigate('/')}
          >
            Về trang chủ <HomeOutlined />
          </Button>
        </div>
      ),
      field: null,
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <ToastContainer />
      <Card
        ref={cardRef}
        className="w-full max-w-3xl mx-4 bg-white shadow-xl z-10"
        style={{ borderColor: '#4B7043', borderWidth: '3px' }}
      >
        <h1 className="text-5xl font-bold text-center text-green-900 mb-10">
          {steps[currentStep].title}
        </h1>
        <div className="mb-10">{steps[currentStep].content}</div>
        {currentStep < steps.length - 1 && currentStep > 0 && (
          <div className="flex justify-end">
            <Button
              type="primary"
              className="bg-green-600 hover:bg-green-700 text-lg px-6 py-3 transition duration-300 transform hover:scale-105"
              onClick={handleNext}
            >
              Tiếp tục <ArrowRightOutlined />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Personalize;