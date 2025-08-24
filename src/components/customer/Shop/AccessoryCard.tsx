// AccessoryCard.tsx
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { gsap } from 'gsap';
import { Button, Card } from 'antd';
import { addAccessoryToCart } from '@/api/cart';
import FavoriteButton from '@/components/common/FavoriteButton';

interface AccessoryCardProps {
  id: string;
  name: string;
  description: string;
  categoryName: string;
  price: number;
  image: string;
  page?: number;
}

const AccessoryCard: React.FC<AccessoryCardProps> = ({
  id,
  name,
  description,
  categoryName,
  price,
  image,
  page,
}) => {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(
      imageRef.current,
      { opacity: 0, scale: 1.1 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: cardRef.current, start: 'top 85%' },
      }
    );
    gsap.fromTo(
      contentRef.current,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 0.2,
        ease: 'power2.out',
        scrollTrigger: { trigger: cardRef.current, start: 'top 85%' },
      }
    );
    gsap.fromTo(
      buttonsRef.current,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 0.4,
        ease: 'back.out(1.7)',
        scrollTrigger: { trigger: cardRef.current, start: 'top 85%' },
      }
    );
  }, []);

  const handleAddToCart = async () => {
    const isLoggedIn = !!localStorage.getItem('authToken');

    if (isLoggedIn) {
      try {
        await addAccessoryToCart(Number(id), 1);
        toast.success(`${name} đã được thêm vào giỏ hàng!`);
      } catch {
        toast.error('Thêm vào giỏ hàng thất bại');
      }
    } else {
      const localCart = JSON.parse(localStorage.getItem('cartItems') || '[]');
      const index = localCart.findIndex((item: any) => item.accessoryId === Number(id));
      if (index !== -1) {
        localCart[index].quantity += 1;
      } else {
        localCart.push({
          id: id + '-accessory',
          accessoryId: Number(id),
          name,
          price,
          quantity: 1,
          image,
          selected: false,
        });
      }
      localStorage.setItem('cartItems', JSON.stringify(localCart));
      toast.success(`${name} đã được thêm vào giỏ hàng (local)!`);
    }
  };

  const handleViewDetail = () => {
    navigate(`/accessory/${id}`);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = '/TerraTechLogo.png';
  };

  return (
    <Card
      ref={cardRef}
      className="shadow-lg rounded-lg transition-transform hover:scale-105 flex flex-col h-full font-roboto w-full max-w-sm mx-auto"
      cover={
        <img
          ref={imageRef}
          src={image}
          alt={name}
          className="w-full h-48 sm:h-56 md:h-64 object-cover rounded-t-lg"
          onError={handleImageError}
        />
      }
    >
      {/* ❤️ Favorite */}
      <FavoriteButton
        type="accessory"
        productId={Number(id)}
        className="!absolute top-2 right-2 sm:top-3 sm:right-3 text-lg sm:text-xl"
      />

      <div ref={contentRef} className="flex-1 flex flex-col px-2 sm:px-3 md:px-4 py-2 sm:py-3">
        <h3 className="text-base sm:text-lg md:text-xl font-semibold mt-1 sm:mt-2 font-roboto">
          {name}
        </h3>
        <p className="text-gray-600 text-xs sm:text-sm mt-1">
          {description.length > 50 ? `${description.slice(0, 50)}.` : description}
        </p>
        <p className="text-gray-600 text-xs sm:text-sm mt-1">Danh mục: {categoryName}</p>
        <p className="text-gray-800 font-semibold mt-1 text-sm sm:text-base md:text-lg">
          {price.toLocaleString('vi-VN')} VND
        </p>
      </div>

      <div ref={buttonsRef} className="flex space-x-2 mt-2 sm:mt-3 px-2 sm:px-3 md:px-4 pb-2 sm:pb-3">
        <Button
          type="primary"
          className="flex-1 bg-green-600 hover:bg-green-700 font-roboto text-xs sm:text-sm md:text-base py-1 sm:py-2"
          onClick={handleAddToCart}
        >
          Thêm vào giỏ
        </Button>
        <Button
          type="default"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-none font-roboto text-xs sm:text-sm md:text-base py-1 sm:py-2"
          onClick={handleViewDetail}
        >
          Xem chi tiết
        </Button>
      </div>
    </Card>
  );
};

export default AccessoryCard;
