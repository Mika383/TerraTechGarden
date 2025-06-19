import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const TerrariumModel: React.FC = () => {
  const terrariumRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/terrarium1.glb');

  useEffect(() => {
    console.log('Scene loaded:', scene); // Debug: Kiểm tra scene
  }, [scene]);

  return (
    <group ref={terrariumRef} rotation={[0, Math.PI / 2, 0]}>
      <primitive object={scene} scale={[0.01, 0.01, 0.01]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <OrbitControls enableZoom={false} enablePan={false} enableRotate={true} />
    </group>
  );
};

const Loading: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      {/* Container chính */}
      <div className="relative w-80 h-80 perspective">
        {/* Vòng tròn các chấm nối đuôi nhau */}
        <div className="absolute inset-0 flex items-center justify-center transform-style-preserve-3d">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-5 h-5 bg-green-500 rounded-full animate-orbit"
              style={{
                animationDelay: `-${i * 0.2}s`,
                transformOrigin: '50% 50%',
              }}
            />
          ))}
        </div>

        {/* Bể terrarium 3D (mô hình) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-rotate-y transform-style-preserve-3d">
            <Canvas
              camera={{ position: [0, 0, 100], fov: 75 }}
              style={{ width: '200px', height: '160px' }} // Tăng kích thước để kiểm tra
            >
              <Suspense fallback={null}>
                <TerrariumModel />
              </Suspense>
            </Canvas>
          </div>
        </div>
      </div>
      <p className="mt-8 text-gray-600 font-medium">Đang tải hệ sinh thái...</p>

      {/* Custom animations */}
      <style>{`
        @keyframes orbit {
          0% {
            transform: rotate(0deg) translate(80px) translateZ(20px);
            opacity: 1;
          }
          50% {
            transform: rotate(180deg) translate(80px) translateZ(-20px);
            opacity: 0.5;
          }
          100% {
            transform: rotate(360deg) translate(80px) translateZ(20px);
            opacity: 1;
          }
        }
        @keyframes rotate-y {
          to { transform: rotateY(360deg); }
        }
        .animate-orbit {
          animation: orbit 2.4s linear infinite;
        }
        .animate-rotate-y {
          animation: rotate-y 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
        .translate-z-3 {
          transform: translateZ(3px);
        }
        .translate-z-5 {
          transform: translateZ(5px);
        }
        .translate-z-10 {
          transform: translateZ(10px);
        }
        .perspective {
          perspective: 500px;
        }
      `}</style>
    </div>
  );
};

export default Loading;