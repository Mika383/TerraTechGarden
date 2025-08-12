import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HeroSection from '../../components/customer/Layout/HeroSection';
import FeaturedProducts from '../../components/customer/Terrarium/FeaturedProducts';
import MemberBenefits from '../../components/customer/Layout/MemberBenefits';
import CustomerReviews from '../../components/customer/Terrarium/CustomerReviews';
import CallToAction from '../../components/customer/Layout/CallToAction';
import ProductShowcase from '@/components/customer/Shop/ProductShowcase';
import NewestProducts from '../../components/customer/Terrarium/FeaturedProducts';

gsap.registerPlugin(ScrollTrigger);

const Home: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<Array<HTMLDivElement | null>>([]);
  const gsapContext = useRef<gsap.Context | null>(null);

  useEffect(() => {
    gsapContext.current = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { 
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out'
        }
      );

      sectionsRef.current.forEach((section, index) => {
        if (!section) return;

        gsap.fromTo(
          section,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 90%',
              toggleActions: 'play none none none',
              once: true 
            }
          }
        );
      });
    }, containerRef);

    return () => {
      gsapContext.current?.revert();
    };
  }, []);

  const setRef = (index: number) => (el: HTMLDivElement | null) => {
    sectionsRef.current[index] = el;
  };

  return (
    <div 
      ref={containerRef}
      className="home-container bg-gradient-to-b from-green-50 via-white to-emerald-50 font-roboto min-h-screen pt-16"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30 z-0">
        <div className="absolute top-20 left-10 w-16 h-16 bg-green-200 rounded-full blur-sm"></div>
        <div className="absolute top-40 right-20 w-12 h-12 bg-emerald-200 rounded-full blur-sm"></div>
        <div className="absolute bottom-40 left-20 w-20 h-20 bg-teal-200 rounded-full blur-sm"></div>
      </div>

      <div className="relative z-10">
        <HeroSection />
      </div>

      <div className="container mx-auto py-12 relative z-10">
        <div ref={setRef(0)} className="mb-16 opacity-0">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-green-100">
            <ProductShowcase />
          </div>
        </div>

        <div ref={setRef(1)} className="mb-16 opacity-0">
          <div className="bg-gradient-to-r from-white/95 to-green-50/95 rounded-2xl shadow-lg p-6 border border-emerald-100">
            <NewestProducts />
          </div>
        </div>

        <div ref={setRef(2)} className="mb-16 opacity-0">
          <div className="bg-gradient-to-l from-white/95 to-teal-50/95 rounded-2xl shadow-lg p-6 border border-teal-100">
            <MemberBenefits />
          </div>
        </div>

        <div ref={setRef(3)} className="mb-16 opacity-0">
          <div className="bg-gradient-to-r from-white/95 to-emerald-50/95 rounded-2xl shadow-lg p-6 border border-emerald-100">
            <CustomerReviews />
          </div>
        </div>

        <div ref={setRef(4)} className="opacity-0">
          <div className="bg-gradient-to-br from-green-50/95 to-white/95 rounded-2xl shadow-xl p-8 border border-green-200">
            <CallToAction />
          </div>
        </div>
      </div>

      <style>{`
        .home-container {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .home-container img {
          width: 100%;
          height: 192px;
          transition: transform 0.2s ease;
        }
        
        .home-container img:hover {
          transform: scale(1.02);
        }
        
        .home-container * {
          transition-duration: 0.2s;
          transition-timing-function: ease-out;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .home-container * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        
        :root {
          --terrarium-green: #059669;
          --terrarium-light: #d1fae5;
          --terrarium-dark: #064e3b;
          --terrarium-accent: #10b981;
        }
        
        .home-container .container {
          max-width: 1200px;
        }
        
        @media (max-width: 768px) {
          .home-container .container {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;