// src/pages/NotFound.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const leaves = [
  { top: '8%',  left: '65%', dur: 6 },
  { top: '12%', left: '15%', dur: 7 },
  { top: '18%', left: '82%', dur: 8 },
  { top: '22%', left: '35%', dur: 6.5 },
  { top: '5%',  left: '52%', dur: 7.5 },
  { top: '28%', left: '72%', dur: 6.8 },
  { top: '30%', left: '10%', dur: 8.2 },
  { top: '14%', left: '55%', dur: 7.2 },
];

const NotFound: React.FC = () => {
  return (
    <>
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-14px) rotate(5deg); }
          }
        `}
      </style>

      {/* isolate tạo stacking context để dùng -z-10 an toàn */}
      <main className="relative isolate min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col items-center justify-center p-6">
        {/* Layer animation luôn dưới nội dung */}
        <section
          aria-hidden
          className="relative w-full max-w-md h-64 md:h-72 mb-12 -z-10 overflow-hidden pointer-events-none"
        >
          {/* Terrarium */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="w-48 h-48 rounded-lg border-8 border-green-200 shadow-lg flex items-center justify-center bg-white/30 backdrop-blur-sm">
                <div className="flex space-x-4">
                  <div className="w-6 h-16 bg-green-500 rounded-full rotate-12"></div>
                  <div className="w-4 h-12 bg-green-400 rounded-full -rotate-6"></div>
                  <div className="w-5 h-14 bg-green-600 rounded-full rotate-3"></div>
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl font-bold text-green-700/20 select-none">
                404
              </div>
            </div>
          </div>

          {/* Lá bay – vị trí cố định, không tràn xuống nội dung */}
          {leaves.map((leaf, i) => (
            <div
              key={i}
              className="absolute w-8 h-8 bg-green-400 rounded-full opacity-60"
              style={{
                top: leaf.top,
                left: leaf.left,
                animation: `float ${leaf.dur}s infinite ease-in-out`,
              }}
            />
          ))}
        </section>

        {/* Nội dung luôn trên cùng */}
        <section className="relative z-10 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Trang không tồn tại!
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-xl">
            Có vẻ như bạn đã lạc vào vùng đất không có terrarium. Hãy quay lại trang chủ để khám phá bộ sưu tập của chúng tôi.
          </p>
          <Link
            to="/"
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition duration-300 transform hover:scale-105"
          >
            Về trang chủ
          </Link>
        </section>
      </main>
    </>
  );
};

export default NotFound;
