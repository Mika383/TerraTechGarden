import React, { useEffect, useState, useRef } from 'react';
import { Col, Row } from 'antd';
import { getAllTerrariums } from '../../../api/terrarium';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import TerrariumCard from './TerrariumCard';
import { Terrarium } from '@/types';

// Ảnh fallback
import miniForest from '../../../assets/image/1.jpg';
import desertOasis from '../../../assets/image/2.jpg';
import tropicalParadise from '../../../assets/image/3.jpg';

gsap.registerPlugin(ScrollTrigger);

interface ProductDisplay {
  id: string;
  name: string;
  description: string;
  type: string;
  price: number;
  rating: number;
  purchases: number;
  image: string;
}

const fallbackProducts: ProductDisplay[] = [
  {
    id: '2',
    name: 'Desert Oasis Terrarium',
    description: 'Terrarium chủ đề sa mạc ấn tượng.',
    type: 'Desert',
    price: 899000,
    rating: 4,
    purchases: 85,
    image: desertOasis,
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
  },
];

const FeaturedProducts: React.FC = () => {
  const [products, setProducts] = useState<ProductDisplay[]>([]);
  const featuredRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const gsapContext = useRef<gsap.Context | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const terrariums: Terrarium[] = await getAllTerrariums();

      const formattedTerrariums: ProductDisplay[] = terrariums.map((item) => ({
            id: item.terrariumId.toString(),
            name: item.name,
            description: item.description,
            type: item.environments.join(', ') || 'Unknown',
            price: item.price,
            rating: 4,
            purchases: 0,
            image: item.terrariumImages[0]?.url || miniForest, 
      }));

      setProducts([...formattedTerrariums, ...fallbackProducts]);
    };

    fetchData();
  }, []);

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

    return () => {
      gsapContext.current?.revert();
    };
  }, [products]);

  return (
    <div ref={featuredRef} className="mb-16 font-roboto will-change-transform-opacity">
      <h2 className="text-4xl font-bold text-center mb-10 text-teal-700">
        Sản Phẩm Nổi Bật
      </h2>
      <Row gutter={[24, 24]} justify="center">
        {products.map((product, index) => (
          <Col xs={24} sm={12} md={8} key={product.id}>
            <div
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              className="will-change-transform-opacity"
            >
              <TerrariumCard {...product} />
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default FeaturedProducts;
