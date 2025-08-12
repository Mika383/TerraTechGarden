// src/components/customer/Home/NewestProducts.tsx
import React, { useEffect, useState, useRef } from 'react';
import { Row, Col } from 'antd';
import { getAllTerrariums } from '@/api/terrarium';
import { Terrarium } from '@/types/terrarium';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import TerrariumCard from './TerrariumCard';
import miniForest from '@/assets/image/1.jpg';

gsap.registerPlugin(ScrollTrigger);

const PAGE_SIZE = 6; // số item hiển thị (3 cột x 2 hàng). Tuỳ ý: 6 hoặc 9

const NewestProducts: React.FC = () => {
  const [terrariums, setTerrariums] = useState<Terrarium[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const gsapCtx = useRef<gsap.Context | null>(null);

  useEffect(() => {
    (async () => {
      // Chỉ include TerrariumImages để tránh lỗi 500 trên BE
      const list = await getAllTerrariums(1, PAGE_SIZE, true, 'TerrariumImages');
      const sorted = (list || [])
        .filter((t: any) => t?.terrariumId)
        .sort((a: any, b: any) => {
          const ad = a?.createdAt ? +new Date(a.createdAt) : 0;
          const bd = b?.createdAt ? +new Date(b.createdAt) : 0;
          return bd - ad; // mới nhất trước
        });
      setTerrariums(sorted);
    })();
  }, []);

  useEffect(() => {
    gsapCtx.current = gsap.context(() => {
      gsap.fromTo(
        rootRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top 80%',
          },
        }
      );

      cardRefs.current.forEach((card, index) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { opacity: 0, y: 40, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.0,
            delay: index * 0.15,
            ease: 'expo.out',
            scrollTrigger: { trigger: card, start: 'top 85%' },
          }
        );
      });
    }, rootRef);

    return () => gsapCtx.current?.revert();
  }, [terrariums]);

  return (
    <div ref={rootRef} className="mb-16 font-roboto will-change-transform-opacity">
      <h2 className="text-4xl font-bold text-center mb-10 text-teal-700">
        Sản phẩm mới nhất
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
                // không truyền environmentName để tránh yêu cầu include thêm
              />
            </div>
          </Col>
        ))}
      </Row>
      
    </div>
  );
};

export default NewestProducts;
