import React from 'react';
import HeroSection from '../../components/customer/Layout/HeroSection';
import FeaturedProducts from '../../components/customer/Terrarium/FeaturedProducts';
import PopularTerrariums from '../../components/customer/Terrarium/PopularTerrariums';
import MemberBenefits from '../../components/customer/Layout/MemberBenefits';
import CustomerReviews from '../../components/customer/Terrarium/CustomerReviews';
import CallToAction from '../../components/customer/Layout/CallToAction';

const Home: React.FC = () => {
  return (
    <div className="bg-gray-50 font-roboto">
      <HeroSection />
      <div className="container mx-auto py-12">
        <FeaturedProducts />
        <PopularTerrariums />
        <MemberBenefits />
        <CustomerReviews />
        <CallToAction />
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
        .font-roboto {
          font-family: 'Roboto', sans-serif;
        }
        img {
          width: 100%;
          height: 192px; /* Fixed height to prevent layout shifts */
        }
      `}</style>
    </div>
  );
};

export default Home;