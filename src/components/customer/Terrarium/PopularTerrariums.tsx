import React, { useEffect, useRef } from 'react';
import { Col, Row } from 'antd';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import TerrariumCard from './TerrariumCard';
import terrarium1 from '../../../assets/image/4.jpg';
import terrarium2 from '../../../assets/image/5.jpg';
import terrarium3 from '../../../assets/image/6.jpg';

gsap.registerPlugin(ScrollTrigger);

const popularTerrariums = [
  {
    id: '4',
    name: 'Classic Glass Terrarium',
    description: 'Thiết kế cổ điển với cây xanh tươi mát.',
    type: 'Classic',
    price: 599000,
    rating: 4,
    purchases: 200,
    image: terrarium1,
  },
  {
    id: '5',
    name: 'Modern Cube Terrarium',
    description: 'Hình khối hiện đại với cây cảnh độc đáo.',
    type: 'Modern',
    price: 799000,
    rating: 5,
    purchases: 130,
    image: terrarium2,
  },
  {
    id: '6',
    name: 'Eco Sphere Terrarium',
    description: 'Hệ sinh thái tự duy trì trong lồng kính.',
    type: 'Eco',
    price: 999000,
    rating: 4,
    purchases: 95,
    image: terrarium3,
  },
];

const PopularTerrariums: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const gsapContext = useRef<gsap.Context | null>(null);

  useEffect(() => {
    gsapContext.current = gsap.context(() => {
      gsap.fromTo(
        sectionRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1.3,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      cardRefs.current.forEach((card, index) => {
        if (card) {
          gsap.fromTo(
            card,
            { opacity: 0, x: index % 2 === 0 ? -40 : 40, scale: 0.95 },
            {
              opacity: 1,
              x: 0,
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
    }, sectionRef);

    return () => {
      gsapContext.current?.revert();
    };
  }, []);

  return (
    <div ref={sectionRef} className="mb-16 font-roboto will-change-transform-opacity">
      <h2 className="text-4xl font-bold text-center mb-10 text-teal-700">
        Terrarium Phổ Biến
      </h2>
      <Row gutter={[24, 24]} justify="center">
        {popularTerrariums.map((terrarium, index) => (
          <Col xs={24} sm={12} md={8} key={terrarium.id}>
            <div
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              className="will-change-transform-opacity"
            >
              <TerrariumCard
                id={terrarium.id}
                name={terrarium.name}
                description={terrarium.description}
                type={terrarium.type}
                price={terrarium.price}
                rating={terrarium.rating}
                purchases={terrarium.purchases}
                image={terrarium.image}
              />
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default PopularTerrariums;