import React, { useEffect, useRef } from 'react';
import { Card, Col, Row } from 'antd';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const benefits = [
  {
    title: 'Hỗ Trợ Chăm Sóc Cây 24/7',
    description: 'Nhận câu trả lời tức thì cho các thắc mắc về chăm sóc cây.',
  },
  {
    title: 'Thiết Kế Terrarium Tùy Chỉnh',
    description: 'Tạo layout terrarium độc đáo với ứng dụng của chúng tôi.',
  },
  {
    title: 'Theo Dõi Sức Khỏe Cây Thông Minh',
    description: 'Giám sát điều kiện terrarium và nhận cảnh báo.',
  },
];

interface MemberBenefitsProps {
  className?: string;
}

const MemberBenefits: React.FC<MemberBenefitsProps> = ({ className }) => {
  const benefitsRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        benefitsRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1.3,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: benefitsRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        },
      );

      cardRefs.current.forEach((card, index) => {
        if (card) {
          gsap.fromTo(
            card,
            { opacity: 0, y: 40, scale: 0.95 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 1.2,
              delay: index * 0.3,
              ease: 'expo.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none reverse',
              },
            },
          );
        }
      });
    }, benefitsRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={benefitsRef} className={`py-16 bg-green-50 font-roboto will-change-transform-opacity ${className || ''}`}>
      <h2 className="text-4xl font-bold text-center mb-10 text-teal-700">Quyền Lợi Thành Viên</h2>
      <div className="container mx-auto">
        <Row gutter={[24, 24]}>
          {benefits.map((benefit, index) => (
            <Col xs={24} md={8} key={index}>
              <div
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                className="will-change-transform-opacity"
              >
                <Card
                  hoverable
                  className="shadow-md rounded-lg transition-transform hover:scale-105"
                >
                  <h3 className="text-xl font-semibold text-teal-700">{benefit.title}</h3>
                  <p className="mt-2 text-gray-600">{benefit.description}</p>
                </Card>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default MemberBenefits;