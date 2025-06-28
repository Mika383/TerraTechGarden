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

  const handleAddToCart = () => {
    const cartItem = { id, name, price, image, quantity: 1, selected: false };
    const storedCart = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const existingItemIndex = storedCart.findIndex((item: any) => item.id === id);
    if (existingItemIndex > -1) {
      storedCart[existingItemIndex].quantity += 1;
      toast.success(`${name} đã được tăng số lượng trong giỏ hàng!`, {
        position: 'top-right',
        autoClose: 2000,
      });
    } else {
      storedCart.push(cartItem);
      toast.success(`${name} đã được thêm vào giỏ hàng!`, {
        position: 'top-right',
        autoClose: 2000,
      });
    }
    localStorage.setItem('cartItems', JSON.stringify(storedCart));
  };

  const handleAddToWishlist = () => {
    const wishlistItem = { id, name, price, image };
    const storedWishlist = JSON.parse(localStorage.getItem('wishlistItems') || '[]');
    const existingItemIndex = storedWishlist.findIndex((item: any) => item.id === id);

    if (existingItemIndex > -1) {
      storedWishlist.splice(existingItemIndex, 1);
      toast.info(`${name} đã được xóa khỏi danh sách yêu thích!`, {
        position: 'top-right',
        autoClose: 2000,
      });
    } else {
      storedWishlist.push(wishlistItem);
      toast.success(`${name} đã được thêm vào danh sách yêu thích!`, {
        position: 'top-right',
        autoClose: 2000,
      });
    }
    localStorage.setItem('wishlistItems', JSON.stringify(storedWishlist));
  };

  const handleViewDetail = () => {
    navigate(`/terrarium/${id}`);
  };

  const isInWishlist = JSON.parse(localStorage.getItem('wishlistItems') || '[]').some(
    (item: any) => item.id === id
  );

  return (
    <Card
      ref={cardRef}
      className="shadow-lg rounded-lg transition-transform hover:scale-105"
      cover={
        <img
          ref={imageRef}
          src={image}
          alt={name}
          className="w-full h-48 object-cover rounded-t-lg"
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
      <div ref={contentRef}>
        <h3 className="text-xl font-semibold mt-4 font-roboto">{name}</h3>
        <p className="text-gray-600 text-sm mt-1">{description}</p>
        <p className="text-gray-600 text-sm mt-1">Loại bể: {type}</p>
        <p className="text-gray-800 font-semibold mt-1">{price.toLocaleString('vi-VN')} VND</p>
        <div className="flex items-center mt-1">
          <Rate disabled defaultValue={rating} className="text-sm" />
          <span className="ml-2 text-gray-600 text-sm">({purchases} lượt mua)</span>
        </div>
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

export default TerrariumCard;