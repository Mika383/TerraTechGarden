import React, { useEffect, useRef } from 'react';
import { Col, Row } from 'antd';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import TerrariumCard from './TerrariumCard';
import miniForest from '../../../assets/image/1.jpg';
import desertOasis from '../../../assets/image/2.jpg';
import tropicalParadise from '../../../assets/image/3.jpg';

gsap.registerPlugin(ScrollTrigger);

const featuredProducts = [
  {
    id: '1',
    name: 'Mini Forest Terrarium',
    description: 'Hệ sinh thái nhỏ gọn với cây xanh tươi tốt.',
    type: 'Forest',
    price: 699000,
    rating: 5,
    purchases: 120,
    image: miniForest,
    speed: 0.8,
  },
  {
    id: '2',
    name: 'Desert Oasis Terrarium',
    description: 'Terrarium chủ đề sa mạc ấn tượng.',
    type: 'Desert',
    price: 899000,
    rating: 4,
    purchases: 85,
    image: desertOasis,
    speed: 0.9,
  },
  {
    id: '3',
    name: 'Tropical Paradise Terrarium',
    description: 'Cây nhiệt đới rực rỡ trong lồng kính.',
    type: 'Tropical',
    price: 1199000,
    rating: 5,
    purchases: 150,
    image: tropicalParadise,
    speed: 0.7,
  },
];

const FeaturedProducts: React.FC = () => {
  const featuredRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
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
    }, featuredRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={featuredRef} className="mb-16 font-roboto will-change-transform-opacity">
      <h2 className="text-4xl font-bold text-center mb-10 text-teal-700">Sản Phẩm Nổi Bật</h2>
      <Row gutter={[24, 24]} justify="center">
        {featuredProducts.map((product, index) => (
          <Col xs={24} sm={12} md={8} key={product.id}>
            <div
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              className="will-change-transform-opacity"
            >
              <TerrariumCard
                id={product.id}
                name={product.name}
                description={product.description}
                type={product.type}
                price={product.price}
                rating={product.rating}
                purchases={product.purchases}
                image={product.image}
                className="parallax-img"
                data-speed={product.speed}
              />
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default FeaturedProducts;