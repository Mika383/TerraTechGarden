import React, { useEffect, useState, useRef } from 'react';
import { Row, Col, Button } from 'antd';
import { getFeaturedTerrariums } from '@/api'; // ✅ dùng API mới
import { Terrarium } from '@/types';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import TerrariumCard from './TerrariumCard';
import miniForest from '@/assets/image/1.jpg';

gsap.registerPlugin(ScrollTrigger);

const ITEMS_PER_PAGE = 6;

const FeaturedProducts: React.FC = () => {
  const [terrariums, setTerrariums] = useState<Terrarium[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const featuredRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const gsapContext = useRef<gsap.Context | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getFeaturedTerrariums(currentPage); // ✅ gọi đúng trang
      const validData = data.filter(item => item.terrariumId);
      setTerrariums(validData);
    };
    fetchData();
  }, [currentPage]);

  useEffect(() => {
    gsapContext.current = gsap.context(() => {
      gsap.fromTo(
        featuredRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1.3,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: featuredRef.current,
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
              delay: index * 0.2,
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
    }, featuredRef);

    return () => {
      gsapContext.current?.revert();
    };
  }, [terrariums]);

  return (
    <div ref={featuredRef} className="mb-16 font-roboto will-change-transform-opacity">
      <h2 className="text-4xl font-bold text-center mb-10 text-teal-700">
        Sản Phẩm Nổi Bật
      </h2>
      <Row gutter={[24, 24]} justify="center">
        {terrariums.map((item, index) => (
          <Col xs={24} sm={12} md={8} key={item.terrariumId}>
            <div
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              className="will-change-transform-opacity"
            >
              <TerrariumCard
                id={item.terrariumId.toString()}
                name={item.terrariumName}
                description={item.description}
                type={`#${item.terrariumId}`}
                price={item.minPrice}
                rating={4}
                purchases={0}
                image={item.terrariumImages?.[0]?.imageUrl || miniForest}
                environmentName={item.environment?.environmentName}
              />
            </div>
          </Col>
        ))}
      </Row>

      <div className="flex justify-center mt-8 space-x-4">
        <Button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(prev => prev - 1)}
        >
          Trang trước
        </Button>
        <Button
          disabled={currentPage === 2} // ✅ chỉ 2 trang
          onClick={() => setCurrentPage(prev => prev + 1)}
        >
          Trang sau
        </Button>
      </div>
    </div>
  );
};

export default FeaturedProducts;
