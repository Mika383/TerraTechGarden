import React, { useEffect, useRef } from 'react';
import { Button, Input } from 'antd';
import { FacebookOutlined, TwitterOutlined, InstagramOutlined, LinkedinOutlined } from '@ant-design/icons';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useNavigate } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const Footer: React.FC = () => {
  const navigate = useNavigate();
  const footerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    gsap.fromTo(
      footerRef.current,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: footerRef.current,
          start: 'top 80%',
        },
      }
    );
    sectionRefs.current.forEach((section, index) => {
      if (section) {
        gsap.fromTo(
          section,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: index * 0.2,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 85%',
            },
          }
        );
      }
    });
  }, []);

  const handleSubscribe = () => {
    alert('Đã đăng ký nhận bản tin!');
  };

  return (
    <footer ref={footerRef} className="bg-green-800 text-white py-8 md:py-12 font-roboto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        <div ref={(el) => { sectionRefs.current[0] = el; }} className="space-y-3">
          <h3 className="text-lg md:text-xl font-semibold text-yellow-500">Về Chúng Tôi</h3>
          <p className="text-sm md:text-base">SĐT: +84 123 456 789</p>
          <p className="text-sm md:text-base">Email: support@terratech.com</p>
          <p
            className="text-sm md:text-base cursor-pointer hover:text-yellow-500 transition-colors"
            onClick={() => window.location.href = 'mailto:support@terratech.com'}
          >
            Liên Hệ
          </p>
        </div>
        <div ref={(el) => { sectionRefs.current[1] = el; }} className="space-y-3">
          <h3 className="text-lg md:text-xl font-semibold text-yellow-500">Theo Dõi Chúng Tôi</h3>
          <div className="flex space-x-4">
            <FacebookOutlined
              className="text-xl md:text-2xl hover:text-yellow-500 cursor-pointer transition-colors"
              onClick={() => window.open('https://facebook.com', '_blank')}
            />
            <TwitterOutlined
              className="text-xl md:text-2xl hover:text-yellow-500 cursor-pointer transition-colors"
              onClick={() => window.open('https://twitter.com', '_blank')}
            />
            <InstagramOutlined
              className="text-xl md:text-2xl hover:text-yellow-500 cursor-pointer transition-colors"
              onClick={() => window.open('https://instagram.com', '_blank')}
            />
            <LinkedinOutlined
              className="text-xl md:text-2xl hover:text-yellow-500 cursor-pointer transition-colors"
              onClick={() => window.open('https://linkedin.com', '_blank')}
            />
          </div>
        </div>
        <div ref={(el) => { sectionRefs.current[2] = el; }} className="space-y-3">
          <h3 className="text-lg md:text-xl font-semibold text-yellow-500">Bản Tin</h3>
          <p className="text-sm md:text-base">Đăng ký để nhận các mẹo và ưu đãi mới nhất!</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Nhập email của bạn"
              className="rounded-md text-black"
              size="large"
            />
            <Button
              type="primary"
              className="bg-yellow-500 hover:bg-yellow-600 rounded-md"
              onClick={handleSubscribe}
              size="large"
            >
              Đăng Ký
            </Button>
          </div>
        </div>
        <div ref={(el) => { sectionRefs.current[3] = el; }} className="space-y-3">
          <h3 className="text-lg md:text-xl font-semibold text-yellow-500">Liên Kết Nhanh</h3>
          <ul className="space-y-2 text-sm md:text-base">
            <li
              className="cursor-pointer hover:text-yellow-500 transition-colors"
              onClick={() => navigate('/about')}
            >
              Giới Thiệu
            </li>
            <li
              className="cursor-pointer hover:text-yellow-500 transition-colors"
              onClick={() => navigate('/privacy-policy')}
            >
              Chính Sách Bảo Mật
            </li>
            <li
              className="cursor-pointer hover:text-yellow-500 transition-colors"
              onClick={() => navigate('/terms-of-service')}
            >
              Điều Khoản Dịch Vụ
            </li>
            <li
              className="cursor-pointer hover:text-yellow-500 transition-colors"
              onClick={() => navigate('/support')}
            >
              Hỗ Trợ
            </li>
          </ul>
        </div>
      </div>
      <div className="text-center mt-6 md:mt-8 text-sm md:text-base">
        <p>© 2025 TerraTech. Mọi quyền được bảo lưu.</p>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
        .font-roboto {
          font-family: 'Roboto', sans-serif;
        }
      `}</style>
    </footer>
  );
};

export default Footer;