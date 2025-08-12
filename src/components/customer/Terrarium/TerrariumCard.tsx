// TerrariumCard.tsx
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { gsap } from 'gsap';
import { Button, Card, Rate } from 'antd';
import { HeartOutlined, HeartFilled } from '@ant-design/icons';

interface TerrariumCardProps {
  id: string;
  name: string;
  description: string;
  type: string;
  price: number;
  rating: number;
  purchases: number;
  image: string;
  environmentName?: string;
  page?: number;
}

const TerrariumCard: React.FC<TerrariumCardProps> = ({
  id,
  name,
  description,
  type,
  price,
  rating,
  purchases,
  image,
  environmentName,
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
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top 85%',
        },
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
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top 85%',
        },
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
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top 85%',
        },
      }
    );
  }, []);

  const handleAddToWishlist = () => {
    const wishlistItem = { id, name, price, image };
    const storedWishlist = JSON.parse(localStorage.getItem('wishlistItems') || '[]');
    const existingItemIndex = storedWishlist.findIndex((item: any) => item.id === id);

    if (existingItemIndex > -1) {
      storedWishlist.splice(existingItemIndex, 1);
      toast.info(`${name} đã được xóa khỏi danh sách yêu thích!`);
    } else {
      storedWishlist.push(wishlistItem);
      toast.success(`${name} đã được thêm vào danh sách yêu thích!`);
    }
    localStorage.setItem('wishlistItems', JSON.stringify(storedWishlist));
  };

  const handleViewDetail = () => {
    navigate(`/terrarium/${id}`);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = '/src/assets/image/1.jpg';
  };

  const isInWishlist = JSON.parse(localStorage.getItem('wishlistItems') || '[]').some(
    (item: any) => item.id === id
  );

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
      <Button
        icon={isInWishlist ? <HeartFilled /> : <HeartOutlined />}
        className={`absolute top-2 right-2 sm:top-3 sm:right-3 ${
          isInWishlist ? 'text-pink-500' : 'text-gray-400'
        } border-none hover:text-pink-500 transition duration-200 text-lg sm:text-xl`}
        onClick={handleAddToWishlist}
      />
      <div ref={contentRef} className="flex-1 flex flex-col px-2 sm:px-3 md:px-4 py-2 sm:py-3">
        <h3 className="text-base sm:text-lg md:text-xl font-semibold mt-1 sm:mt-2 font-roboto">{name}</h3>
        <p className="text-gray-600 text-xs sm:text-sm mt-1">
          {description.length > 50 ? `${description.slice(0, 50)}...` : description}
        </p>
        <p className="text-gray-600 text-xs sm:text-sm mt-1">Loại bể: {type}</p>
        {environmentName && (
          <p className="text-gray-600 text-xs sm:text-sm mt-1">Môi trường: {environmentName}</p>
        )}
        <p className="text-gray-800 font-semibold mt-1 text-sm sm:text-base md:text-lg">
          {price.toLocaleString('vi-VN')} VND
        </p>
        <div className="flex items-center mt-1">
          <Rate disabled defaultValue={rating} className="text-xs sm:text-sm" />
          <span className="ml-2 text-gray-600 text-xs sm:text-sm">({purchases} lượt mua)</span>
        </div>
      </div>
      <div ref={buttonsRef} className="flex space-x-2 mt-2 sm:mt-3 px-2 sm:px-3 md:px-4 pb-2 sm:pb-3">
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

export default TerrariumCard;