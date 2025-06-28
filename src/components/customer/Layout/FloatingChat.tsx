import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Button, Input } from 'antd';
import { MessageOutlined, InfoCircleOutlined, LayoutOutlined, FileImageOutlined, CloseOutlined } from '@ant-design/icons';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const FloatingChat: React.FC = () => {
  const location = useLocation();
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const chatButtonsRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatButtonsRef.current) {
      const buttons = Array.from(chatButtonsRef.current.children);
      gsap.fromTo(
        buttons,
        { opacity: 0, x: 20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: chatButtonsRef.current,
            start: 'top 80%',
          },
        }
      );
    }

    if (activeChat && chatWindowRef.current) {
      gsap.fromTo(
        chatWindowRef.current,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' }
      );
    }
  }, [activeChat]);

  if (location.pathname === '/checkout') {
    return null;
  }

  const toggleChat = (chatType: string) => {
    setActiveChat(activeChat === chatType ? null : chatType);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-roboto">
      <div ref={chatButtonsRef} className="flex flex-col items-end space-y-3">
        <div className="relative group">
          <Button
            type="primary"
            shape="circle"
            icon={<MessageOutlined />}
            size="large"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => toggleChat('support')}
          />
          <span className="absolute right-14 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            Chat với CSKH
          </span>
        </div>
        <div className="relative group">
          <Button
            type="primary"
            shape="circle"
            icon={<InfoCircleOutlined />}
            size="large"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => toggleChat('info')}
          />
          <span className="absolute right-14 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            Hỏi thông tin Terrarium
          </span>
        </div>
        <div className="relative group">
          <Button
            type="primary"
            shape="circle"
            icon={<LayoutOutlined />}
            size="large"
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => toggleChat('layout')}
          />
          <span className="absolute right-14 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            Tạo layout Terrarium
          </span>
        </div>
        <div className="relative group">
          <Button
            type="primary"
            shape="circle"
            icon={<FileImageOutlined />}
            size="large"
            className="bg-orange-600 hover:bg-orange-700"
            onClick={() => toggleChat('analysis')}
          />
          <span className="absolute right-14 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            Phân tích bể Terrarium
          </span>
        </div>
      </div>

      {activeChat && (
        <div
          ref={chatWindowRef}
          className="fixed bottom-24 right-6 w-80 h-96 bg-white rounded-lg shadow-lg flex flex-col"
        >
          <div className="bg-green-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              {activeChat === 'support' && 'Chat với CSKH'}
              {activeChat === 'info' && 'Hỏi thông tin Terrarium'}
              {activeChat === 'layout' && 'Tạo layout Terrarium'}
              {activeChat === 'analysis' && 'Phân tích bể Terrarium'}
            </h3>
            <Button
              type="text"
              icon={<CloseOutlined />}
              className="text-white hover:text-yellow-500"
              onClick={() => setActiveChat(null)}
            />
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            {activeChat === 'support' && (
              <p className="text-gray-600">
                Chào bạn! Tôi là nhân viên CSKH của TerraTech. Bạn cần hỗ trợ gì hôm nay?
              </p>
            )}
            {activeChat === 'info' && (
              <p className="text-gray-600">
                Chào bạn! Tôi là AI Terrarium Info. Bạn muốn biết thông tin gì về Terrarium?
              </p>
            )}
            {activeChat === 'layout' && (
              <p className="text-gray-600">
                Chào bạn! Tôi là AI Layout Creator. Hãy mô tả ý tưởng Terrarium bạn muốn tạo nhé!
              </p>
            )}
            {activeChat === 'analysis' && (
              <div>
                <p className="text-gray-600 mb-2">
                  Chào bạn! Tôi là AI Terrarium Analyzer. Vui lòng tải lên hình ảnh bể Terrarium của bạn.
                </p>
                <Input type="file" accept="image/*" className="w-full p-2 border rounded-lg" />
              </div>
            )}
          </div>
          <div className="p-4 border-t">
            <Input
              placeholder="Nhập tin nhắn..."
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
        .font-roboto {
          font-family: 'Roboto', sans-serif;
        }
      `}</style>
    </div>
  );
};

export default FloatingChat;