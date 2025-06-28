import React, { useEffect, useRef } from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import forestImg from '../../../assets/image/1.jpg';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const gsapContext = useRef<gsap.Context | null>(null);

  useEffect(() => {
    gsapContext.current = gsap.context(() => {
      gsap.fromTo(
        heroRef.current,
        { opacity: 0, scale: 1.1 },
        { opacity: 1, scale: 1, duration: 1.5, ease: 'power4.out', delay: 0.2 }
      );
      gsap.fromTo(
        titleRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, delay: 0.4, ease: 'power4.out' }
      );
      gsap.fromTo(
        buttonRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, delay: 0.6, ease: 'expo.out' }
      );
    }, heroRef);

    return () => {
      gsapContext.current?.revert();
    };
  }, []);

  const handleMembershipClick = () => {
    const role = localStorage.getItem('userRole');
    if (!role || role === 'guest') {
      alert('Vui lòng đăng nhập để tham gia thành viên.');
      navigate('/login');
    } else {
      navigate('/membership');
    }
  };

  return (
    <div
      ref={heroRef}
      className="h-[600px] bg-cover bg-center flex items-center justify-center relative will-change-transform-opacity font-roboto"
      style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${forestImg})` }}
    >
      <div className="text-center text-white">
        <h1 ref={titleRef} className="text-5xl font-bold mb-6 font-roboto">
          Tạo Terrarium Của Riêng Bạn
        </h1>
        <div ref={buttonRef} className="space-x-4">
          <Button
            type="primary"
            size="large"
            className="bg-teal-700 hover:bg-teal-500 !text-white font-semibold"
            onClick={() => navigate('/shop')}
          >
            Mua Ngay
          </Button>
          <Button
            type="default"
            size="large"
            className="bg-yellow-500 hover:bg-yellow-600 !text-white border-none font-semibold"
            onClick={handleMembershipClick}
          >
            Tham Gia Thành Viên
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;