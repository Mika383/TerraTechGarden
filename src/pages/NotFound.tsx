// src/pages/NotFound.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <>
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }
        `}
      </style>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col items-center justify-center p-6">
        {/* Animation container */}
        <div className="relative w-full max-w-md mb-12">
          {/* Terrarium animation */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              {/* Glass terrarium */}
              <div className="w-48 h-48 rounded-lg border-8 border-green-200 shadow-lg flex items-center justify-center bg-white bg-opacity-30 backdrop-filter backdrop-blur-sm">
                {/* Plants inside */}
                <div className="flex space-x-4">
                  <div className="w-6 h-16 bg-green-500 rounded-full transform rotate-12"></div>
                  <div className="w-4 h-12 bg-green-400 rounded-full transform -rotate-6"></div>
                  <div className="w-5 h-14 bg-green-600 rounded-full transform rotate-3"></div>
                </div>
              </div>
              
              {/* 404 Text floating inside */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl font-bold text-green-700 opacity-20">
                404
              </div>
            </div>
          </div>
          
          {/* Floating leaves around */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-8 h-8 bg-green-400 rounded-full opacity-60"
              style={{
                top: `${Math.random() * 80 + 10}%`,
                left: `${Math.random() * 80 + 10}%`,
                transform: `rotate(${Math.random() * 360}deg)`,
                animation: `float ${5 + Math.random() * 5}s infinite ease-in-out`,
              }}
            ></div>
          ))}
        </div>

        {/* Content */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 text-center">
          Trang không tồn tại!
        </h1>
        <p className="text-lg text-gray-600 mb-8 text-center max-w-md">
          Có vẻ như bạn đã lạc vào vùng đất không có terrarium. Hãy quay lại trang chủ để khám phá bộ sưu tập của chúng tôi.
        </p>
        
        <Link 
          to="/" 
          className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition duration-300 transform hover:scale-105"
        >
          Về trang chủ
        </Link>
      </div>
    </>
  );
};

export default NotFound;
