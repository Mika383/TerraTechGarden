import React, { useEffect, useRef } from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import forestImg from '../../../assets/image/1.jpg';

gsap.registerPlugin(ScrollTrigger);

const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const gsapContext = useRef<gsap.Context | null>(null);

  useEffect(() => {
    gsapContext.current = gsap.context(() => {
      // Optimized parallax with reduced calculation
      gsap.to(bgRef.current, {
        yPercent: 20,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      });

      // Simplified entrance animations
      const tl = gsap.timeline({ delay: 0.2 });
      
      tl.fromTo(
        titleRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }
      )
      .fromTo(
        subtitleRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
        '-=0.4'
      )
      .fromTo(
        buttonRef.current?.children || [],
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out', stagger: 0.1 },
        '-=0.3'
      );

    }, heroRef);

    return () => {
      gsapContext.current?.revert();
    };
  }, []);

  const handleMembershipClick = () => {
    
      navigate('/membership');
   
  };

  return (
    <div
      ref={heroRef}
      className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden"
    >
      {/* Optimized background with terrarium theme */}
      <div
        ref={bgRef}
        className="absolute inset-0 bg-cover bg-center scale-110"
        style={{ 
          backgroundImage: `linear-gradient(
            135deg, 
            rgba(5, 150, 105, 0.7) 0%, 
            rgba(6, 78, 59, 0.8) 50%,
            rgba(0, 0, 0, 0.6) 100%
          ), url(${forestImg})` 
        }}
      />
      
      {/* Decorative terrarium elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-green-400/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-emerald-300/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/3 right-10 w-16 h-16 bg-teal-400/15 rounded-full blur-lg animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Content */}
      <div className="relative text-center text-white z-10 max-w-4xl px-6">
        <h1 ref={titleRef} className="text-4xl md:text-6xl font-bold mb-4 opacity-0">
          🌿 TerraTechGarden
        </h1>
        <p ref={subtitleRef} className="text-lg md:text-xl mb-8 opacity-0 font-light leading-relaxed">
          Khám phá và tạo ra những khu vườn mini tuyệt đẹp trong lọ thủy tinh.<br/>
          Mang thiên nhiên vào ngôi nhà của bạn với các sản phẩm terrarium độc đáo.
        </p>
        
        <div ref={buttonRef} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            type="primary"
            size="large"
            className="bg-emerald-600 hover:bg-emerald-500 !text-white font-semibold px-8 py-6 h-auto border-none shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            onClick={() => navigate('/shop')}
          >
            🛒 Khám Phá Cửa Hàng
          </Button>
          <Button
            type="default"
            size="large"
            className="bg-white/90 hover:bg-white !text-emerald-700 border-2 border-white/50 font-semibold px-8 py-6 h-auto shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            onClick={handleMembershipClick}
          >
            🌱 Tham Gia Cộng Đồng
          </Button>
        </div>

        {/* Terrarium features highlight */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="text-2xl mb-2">🌿</div>
            <div className="font-semibold">Cây Xanh Tự Nhiên</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="text-2xl mb-2">💧</div>
            <div className="font-semibold">Hệ Thống Khép Kín</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="text-2xl mb-2">✨</div>
            <div className="font-semibold">Thiết Kế Độc Đáo</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        
        .animate-pulse {
          animation: pulse 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default HeroSection;