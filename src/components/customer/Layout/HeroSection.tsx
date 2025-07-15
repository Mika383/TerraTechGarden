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
  const buttonRef = useRef<HTMLDivElement>(null);
  const gsapContext = useRef<gsap.Context | null>(null);

  useEffect(() => {
    gsapContext.current = gsap.context(() => {
      // Parallax background
      gsap.fromTo(
        bgRef.current,
        { y: 0 },
        {
          y: 100,
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        }
      );
      // Hero container
      gsap.fromTo(
        heroRef.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1.5, ease: 'power4.out', delay: 0.2 }
      );
      // Title
      gsap.fromTo(
        titleRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.3, delay: 0.4, ease: 'power4.out' }
      );
      // Buttons with stagger
      if (buttonRef.current) {
        const buttons = Array.from(buttonRef.current.children);
        gsap.fromTo(
          buttons,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 1.2, delay: 0.6, ease: 'expo.out', stagger: 0.2 }
        );
      }
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
      className="relative h-[600px] flex items-center justify-center overflow-hidden will-change-transform-opacity font-roboto"
    >
      <div
        ref={bgRef}
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${forestImg})` }}
      />
      <div className="relative text-center text-white z-10">
        <h1 ref={titleRef} className="text-5xl font-bold mb-6">
          Tạo Terrarium Của Riêng Bạn
        </h1>
        <div ref={buttonRef} className="space-x-4">
          <Button
            type="primary"
            size="large"
            className="bg-teal-700 hover:bg-teal-500 !text-white font-semibold transition-transform hover:scale-105"
            onClick={() => navigate('/shop')}
          >
            Mua Ngay
          </Button>
          <Button
            type="default"
            size="large"
            className="bg-yellow-500 hover:bg-yellow-600 !text-white border-none font-semibold transition-transform hover:scale-105"
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