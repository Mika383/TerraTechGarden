// ✅ AccessoryCard.tsx
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { gsap } from 'gsap';
import { Button, Card } from 'antd';
import { HeartFilled, HeartOutlined } from '@ant-design/icons';
import { addAccessoryToCart, addToCart } from '@/api/cart';

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
    gsap.fromTo(imageRef.current, { opacity: 0, scale: 1.1 }, {
      opacity: 1,
      scale: 1,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: { trigger: cardRef.current, start: 'top 85%' },
    });
    gsap.fromTo(contentRef.current, { opacity: 0, y: 20 }, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      delay: 0.2,
      ease: 'power2.out',
      scrollTrigger: { trigger: cardRef.current, start: 'top 85%' },
    });
    gsap.fromTo(buttonsRef.current, { opacity: 0, y: 20 }, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      delay: 0.4,
      ease: 'back.out(1.7)',
      scrollTrigger: { trigger: cardRef.current, start: 'top 85%' },
    });
  }, []);

  const handleAddToCart = async () => {
  const isLoggedIn = !!localStorage.getItem('authToken');

  if (isLoggedIn) {
    try {
      await addAccessoryToCart(Number(id), 1); // chỉ gửi đúng field cần
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

  const handleAddToWishlist = () => {
    const wishlistItem = { id, name, price, image };
    const storedWishlist = JSON.parse(localStorage.getItem('wishlistAccessories') || '[]');
    const existing = storedWishlist.findIndex((item: any) => item.id === id);
    if (existing > -1) {
      storedWishlist.splice(existing, 1);
      toast.info(`${name} đã được xóa khỏi danh sách yêu thích!`);
    } else {
      storedWishlist.push(wishlistItem);
      toast.success(`${name} đã được thêm vào danh sách yêu thích!`);
    }
    localStorage.setItem('wishlistAccessories', JSON.stringify(storedWishlist));
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = '/src/assets/image/1.jpg';
  };

  const isInWishlist = JSON.parse(localStorage.getItem('wishlistAccessories') || '[]').some(
    (item: any) => item.id === id
  );

  return (
    <Card
      ref={cardRef}
      className="shadow-lg rounded-lg transition-transform hover:scale-105 flex flex-col h-full"
      cover={
        <img
          ref={imageRef}
          src={image}
          alt={name}
          className="w-full object-contain max-h-64"
          onError={handleImageError}
        />
      }
    >
      <Button
        icon={isInWishlist ? <HeartFilled /> : <HeartOutlined />}
        className={`absolute top-4 right-4 ${
          isInWishlist ? 'text-pink-500' : 'text-gray-400'
        } border-none hover:text-pink-500 transition duration-200`}
        onClick={handleAddToWishlist}
      />
      <div ref={contentRef} className="flex-1 flex flex-col">
        <h3 className="text-xl font-semibold mt-4 font-roboto">{name}</h3>
        <p className="text-gray-600 text-sm mt-1">
          {description.length > 50 ? `${description.slice(0, 50)}...` : description}
        </p>
        <p className="text-gray-600 text-sm mt-1">Danh mục: {categoryName}</p>
        <p className="text-gray-800 font-semibold mt-1">
          {price.toLocaleString('vi-VN')} VND
        </p>
      </div>
      <div ref={buttonsRef} className="flex space-x-2 mt-4">
        <Button
          type="primary"
          className="flex-1 bg-green-600 hover:bg-green-700 font-roboto"
          onClick={handleAddToCart}
        >
          Thêm vào giỏ
        </Button>
        <Button
          type="default"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-none font-roboto"
          onClick={handleViewDetail}
        >
          Xem chi tiết
        </Button>
      </div>
    </Card>
  );
};

export default AccessoryCard;
