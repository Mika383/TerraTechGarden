import React, { useEffect, useState } from 'react';
import {
  addToCart,
  updateCartItem,
  getCart
} from '@/api/cart';
import { useParams } from 'react-router-dom';
import {
  getAccessoryById,
  getAccessoryImagesByAccessoryId,
  getAllAccessoryCategories,
} from '@/api/accessory';
import { Accessory } from '@/types/accessory';
import { Button, Image, Spin } from 'antd';
import { toast } from 'react-toastify';
import { HeartFilled, HeartOutlined } from '@ant-design/icons';

const AccessoryDetail: React.FC = () => {
  const { id } = useParams();
  const [accessory, setAccessory] = useState<Accessory | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [categoryName, setCategoryName] = useState<string>('Không rõ');
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;

        const [accRes, imgRes, categories] = await Promise.all([
          getAccessoryById(+id),
          getAccessoryImagesByAccessoryId(+id),
          getAllAccessoryCategories(),
        ]);

        if (!accRes) {
          toast.error('Không tìm thấy phụ kiện!');
          setLoading(false);
          return;
        }

        setAccessory(accRes);
        setImages((imgRes || []).map((img) => img.imageUrl));
        const foundCategory = categories.find((c) => c.categoryId === accRes.categoryId);
        setCategoryName(foundCategory?.categoryName || 'Không rõ');

        const wishlist = JSON.parse(localStorage.getItem('wishlistAccessories') || '[]');
        setLiked(wishlist.some((item: any) => item.id === id));
      } catch (err) {
        toast.error('Lỗi khi tải dữ liệu phụ kiện');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleAddToCart = async () => {
  if (!accessory) return;

  const isLoggedIn = !!localStorage.getItem('authToken');

  if (isLoggedIn) {
    try {
      const cartData = JSON.parse(localStorage.getItem('cartData') || '{}');
      const existing = cartData?.cartItems?.find(
        (item: any) => item.accessoryId === accessory.accessoryId
      );

      if (existing) {
        await updateCartItem(existing.cartItemId, {
          accessoryQuantity: existing.totalCartQuantity + quantity,
          variantQuantity: 0,
        });
        toast.info('Đã tăng số lượng sản phẩm trong giỏ hàng');
      } else {
        await addToCart({
          accessoryId: accessory.accessoryId,
          terrariumVariantId: 0,
          accessoryQuantity: quantity,
          variantQuantity: 0,
        });
        toast.success('Đã thêm sản phẩm vào giỏ hàng!');
      }
    } catch (err) {
      toast.error('Không thể thêm vào giỏ hàng. Vui lòng thử lại!');
    }
  } else {
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');

    const newItem = {
      id: `accessory-${accessory.accessoryId}`,
      accessoryId: accessory.accessoryId,
      name: accessory.name,
      price: accessory.price,
      image: images[0] || '/default.jpg',
      quantity,
      selected: false,
    };

    const existingIndex = cartItems.findIndex((item: any) => item.id === newItem.id);

    if (existingIndex >= 0) {
      cartItems[existingIndex].quantity += quantity;
      toast.info('Đã tăng số lượng trong giỏ hàng (local)');
    } else {
      cartItems.push(newItem);
      toast.success('Đã thêm sản phẩm vào giỏ hàng (local)');
    }

    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }
};


  const toggleWishlist = () => {
    const wishlist = JSON.parse(localStorage.getItem('wishlistAccessories') || '[]');
    const exists = wishlist.findIndex((item: any) => item.id === id);
    if (exists >= 0) {
      wishlist.splice(exists, 1);
      toast.info('Đã xóa khỏi danh sách yêu thích');
      setLiked(false);
    } else {
      wishlist.push({ id, name: accessory?.name, price: accessory?.price, image: images[0] });
      toast.success('Đã thêm vào danh sách yêu thích');
      setLiked(true);
    }
    localStorage.setItem('wishlistAccessories', JSON.stringify(wishlist));
  };

  const increaseQuantity = () => setQuantity((prev) => prev + 1);
  const decreaseQuantity = () => setQuantity((prev) => Math.max(1, prev - 1));

  if (loading || !accessory)
    return (
      <div className="text-center mt-20">
        <Spin size="large" />
      </div>
    );

  return (
    <div className="container mx-auto py-10 px-4 md:px-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/2">
          <Image.PreviewGroup>
            <div className="grid grid-cols-2 gap-4">
              {images.map((url, idx) => (
                <Image key={idx} src={url} alt={`img-${idx}`} className="rounded-lg shadow" />
              ))}
            </div>
          </Image.PreviewGroup>
        </div>

        <div className="md:w-1/2">
          <h1 className="text-3xl font-bold mb-2">{accessory.name}</h1>
          <p className="text-gray-600 text-sm mb-4">Danh mục: {categoryName}</p>
          <p className="text-gray-700 mb-4">{accessory.description}</p>
          <p className="text-2xl font-semibold text-green-700 mb-4">
            {accessory.price.toLocaleString('vi-VN')} VND
          </p>
          <p className="text-gray-600 mb-2">Tồn kho: {accessory.stockQuantity}</p>

          {/* Số lượng */}
          <div className="flex items-center gap-4 mt-6">
            <span className="font-medium">Số lượng:</span>
            <div className="flex border rounded overflow-hidden">
              <button
                onClick={decreaseQuantity}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-lg"
              >
                −
              </button>
              <span className="px-4 py-1">{quantity}</span>
              <button
                onClick={increaseQuantity}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-lg"
              >
                +
              </button>
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex items-center gap-4 mt-6">
            <Button
              type="primary"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleAddToCart}
            >
              Thêm vào giỏ
            </Button>
            <Button
              icon={liked ? <HeartFilled /> : <HeartOutlined />}
              onClick={toggleWishlist}
              className={liked ? 'text-pink-500' : 'text-gray-400'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessoryDetail;
