import React, { useEffect, useRef } from 'react';
import { Card, Col, Row, Rate } from 'antd';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reviews = [
  {
    name: 'Nguyễn Văn A',
    rating: 5,
    comment: 'Terrarium tuyệt đẹp, dịch vụ chăm sóc khách hàng rất tốt!',
  },
  {
    name: 'Trần Thị B',
    rating: 4,
    comment: 'Sản phẩm chất lượng, giao hàng nhanh chóng.',
  },
  {
    name: 'Lê Văn C',
    rating: 5,
    comment: 'Tôi rất thích thiết kế tùy chỉnh, rất sáng tạo!',
  },
];

const CustomerReviews: React.FC = () => {
  const reviewsRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const gsapContext = useRef<gsap.Context | null>(null);

  useEffect(() => {
    gsapContext.current = gsap.context(() => {
      gsap.fromTo(
        reviewsRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1.3,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: reviewsRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
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
            }
          );
        }
      });
    }, reviewsRef);

    return () => {
      gsapContext.current?.revert();
    };
  }, []);

  return (
    <div ref={reviewsRef} className="py-16 bg-gray-100 font-roboto will-change-transform-opacity">
      <h2 className="text-4xl font-bold text-center mb-10 text-teal-700">
        Đánh Giá Từ Khách Hàng
      </h2>
      <div className="container mx-auto">
        <Row gutter={[24, 24]}>
          {reviews.map((review, index) => (
            <Col xs={24} md={8} key={index}>
              <div
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                className="will-change-transform-opacity"
              >
                <Card className="shadow-md rounded-lg transition-transform hover:scale-105">
                  <div className="flex flex-col items-center">
                    <h3 className="text-lg font-semibold text-teal-700">{review.name}</h3>
                    <Rate disabled defaultValue={review.rating} className="my-2" />
                    <p className="text-gray-600 text-center">{review.comment}</p>
                  </div>
                </Card>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default CustomerReviews;