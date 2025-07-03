import React, { useEffect, useRef } from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import forestImg from '../../../assets/image/1.jpg';

gsap.registerPlugin(ScrollTrigger);

interface CallToActionProps {
  className?: string;
}

const CallToAction: React.FC<CallToActionProps> = ({ className }) => {
  const navigate = useNavigate();
  const ctaRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax background
      gsap.to(bgRef.current, {
        y: 80,
        ease: 'none',
        scrollTrigger: {
          trigger: ctaRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });

      // Container animation
      gsap.fromTo(
        ctaRef.current,
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          duration: 1.5,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: ctaRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        },
      );

      // Text animation
      gsap.fromTo(
        textRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.3,
          delay: 0.3,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: textRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        },
      );

      // Button animation
      gsap.fromTo(
        buttonRef.current,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.2,
          delay: 0.5,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: buttonRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        },
      );
    }, ctaRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={ctaRef}
      className={`relative py-20 mt-16 overflow-hidden rounded-xl will-change-transform-opacity font-roboto ${className || ''}`}
    >
      <div
        ref={bgRef}
        className="absolute inset-0 bg-cover bg-center parallax-bg"
        style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${forestImg})` }}
        data-speed="0.6"
      />
      <div className="relative text-center text-white z-10">
        <div ref={textRef}>
          <h2 className="text-4xl font-bold mb-4">Bắt Đầu Hành Trình Terrarium Của Bạn!</h2>
          <p className="text-lg mb-6">Khám phá bộ sưu tập terrarium độc đáo và tạo không gian xanh riêng bạn.</p>
        </div>
        <div ref={buttonRef}>
          <Button
            type="primary"
            size="large"
            className="bg-teal-700 hover:bg-teal-500 !text-white font-semibold transition-transform hover:scale-105"
            onClick={() => navigate('/shop')}
          >
            Khám Phá Ngay
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CallToAction;