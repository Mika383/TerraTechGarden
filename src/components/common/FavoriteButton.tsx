import React, { useEffect, useState } from 'react';
import { Button, Tooltip } from 'antd';
import { HeartFilled, HeartOutlined } from '@ant-design/icons';
import {
  addFavorite,
  getFavorites,
  removeFavorite,
  findFavoriteId,
  FavoriteType,
} from '@/api/favorite';
import { toast } from 'react-toastify';

type Props = {
  type: FavoriteType;
  productId: number;
  size?: 'small' | 'middle' | 'large';
  className?: string;
  labelWhenFull?: string;
  labelWhenEmpty?: string;
};

const FavoriteButton: React.FC<Props> = ({
  type,
  productId,
  size = 'middle',
  className = '',
  labelWhenFull = 'Bỏ khỏi yêu thích',
  labelWhenEmpty = 'Thêm vào yêu thích',
}) => {
  const [favoriteId, setFavoriteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const isLoggedIn = !!localStorage.getItem('authToken');

  useEffect(() => {
    let mounted = true;
    if (!isLoggedIn) return;
    (async () => {
      try {
        const list = await getFavorites();
        if (mounted) {
          setFavoriteId(findFavoriteId(list, { type, id: productId }));
        }
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, [isLoggedIn, type, productId]);

  const toggleFavorite = async () => {
    if (!isLoggedIn) {
      toast.info('Vui lòng đăng nhập để sử dụng Yêu thích.');
      return;
    }
    try {
      setLoading(true);
      if (favoriteId) {
        await removeFavorite(favoriteId);
        setFavoriteId(null);
        toast.info('Đã xoá khỏi yêu thích.');
      } else {
        const created = await addFavorite(
          type === 'accessory' ? { accessoryId: productId } : { terrariumId: productId }
        );
        setFavoriteId(created.favoriteId);
        toast.success('Đã thêm vào yêu thích.');
      }
    } catch {
      toast.error('Không thể cập nhật yêu thích. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const filled = !!favoriteId;
  const icon = filled ? <HeartFilled /> : <HeartOutlined />;
  const tooltipText = filled ? labelWhenFull : labelWhenEmpty;

  return (
    <Tooltip title={tooltipText}>
      <Button
        type="text"
        size={size}
        icon={icon}
        onClick={toggleFavorite}
        loading={loading}
        className={`
          !rounded-full !p-1.5
          ${filled ? 'text-pink-500 bg-pink-100 hover:bg-pink-200' : 'text-gray-600 bg-white/70 hover:bg-white'}
          shadow-sm backdrop-blur-sm
          ${className}
        `}
      />
    </Tooltip>
  );
};

export default FavoriteButton;
