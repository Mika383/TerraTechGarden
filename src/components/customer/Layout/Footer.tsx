import React, { useEffect, useRef } from 'react';
import { Button, Input } from 'antd';
import { FacebookOutlined, TwitterOutlined, InstagramOutlined, LinkedinOutlined } from '@ant-design/icons';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Footer: React.FC = () => {
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
    <footer ref={footerRef} className="bg-green-800 text-white py-12 font-roboto">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div ref={(el) => { sectionRefs.current[0] = el; }}>
          <h3 className="text-xl font-semibold mb-4 text-yellow-500">Về Chúng Tôi</h3>
          <p>SĐT: +84 123 456 789</p>
          <p>Email: support@terratech.com</p>
          <p className="cursor-pointer hover:text-yellow-500 transition-colors" onClick={() => window.location.href = 'mailto:support@terratech.com'}>
            Liên Hệ
          </p>
        </div>
        <div ref={(el) => { sectionRefs.current[1] = el; }}>
          <h3 className="text-xl font-semibold mb-4 text-yellow-500">Theo Dõi Chúng Tôi</h3>
          <div className="flex space-x-4">
            <FacebookOutlined className="text-2xl hover:text-yellow-500 cursor-pointer transition-colors" />
            <TwitterOutlined className="text-2xl hover:text-yellow-500 cursor-pointer transition-colors" />
            <InstagramOutlined className="text-2xl hover:text-yellow-500 cursor-pointer transition-colors" />
            <LinkedinOutlined className="text-2xl hover:text-yellow-500 cursor-pointer transition-colors" />
          </div>
        </div>
        <div ref={(el) => { sectionRefs.current[2] = el; }}>
          <h3 className="text-xl font-semibold mb-4 text-yellow-500">Bản Tin</h3>
          <p className="mb-4">Đăng ký để nhận các mẹo và ưu đãi mới nhất!</p>
          <div className="flex">
            <Input placeholder="Nhập email của bạn" className="mr-2 rounded-md" />
            <Button type="primary" className="bg-yellow-500 hover:bg-yellow-600 rounded-md" onClick={handleSubscribe}>
              Đăng Ký
            </Button>
          </div>
        </div>
        <div ref={(el) => { sectionRefs.current[3] = el; }}>
          <h3 className="text-xl font-semibold mb-4 text-yellow-500">Liên Kết Nhanh</h3>
          <ul className="space-y-2">
            <li className="cursor-pointer hover:text-yellow-500 transition-colors">Giới Thiệu</li>
            <li className="cursor-pointer hover:text-yellow-500 transition-colors">Chính Sách Bảo Mật</li>
            <li className="cursor-pointer hover:text-yellow-500 transition-colors">Điều Khoản Dịch Vụ</li>
            <li className="cursor-pointer hover:text-yellow-500 transition-colors">Hỗ Trợ</li>
          </ul>
        </div>
      </div>
      <div className="text-center mt-8">
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
