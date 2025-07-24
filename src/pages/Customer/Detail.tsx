import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getTerrariumById,
  getTerrariumImagesByTerrariumId,
  getVariantsByTerrariumId,
} from '@/api/terrarium';
import TerrariumDetail from '@/components/customer/Terrarium/TerrariumDetail';
import Loading from '@/components/Loading';
import { toast } from 'react-toastify';

const Detail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [terrarium, setTerrarium] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      const terrariumId = Number(id);
      if (!terrariumId || isNaN(terrariumId)) {
        toast.error('ID không hợp lệ!');
        navigate('/');
        return;
      }

      setLoading(true);
      try {
        const apiData = await getTerrariumById(terrariumId);
        const images = await getTerrariumImagesByTerrariumId(terrariumId);
        


        if (!apiData || typeof apiData.terrariumId !== 'number') {
          toast.error('Không tìm thấy dữ liệu bể!');
          return;
        }

        const formattedTerrarium = {
  ...apiData,
  id: apiData.terrariumId.toString(),
  name: apiData.terrariumName || 'Không rõ tên',
  type: `#${apiData.environmentId || 'N/A'}`,
  image: images[0]?.imageUrl || 'https://res.cloudinary.com/dia8sg8u7/image/upload/v1753283976/placeholder/placeholder_400x300.jpg',
  terrariumImages: images || [] 
};


        setTerrarium(formattedTerrarium);

        const fetchedVariants = await getVariantsByTerrariumId(terrariumId);
        setVariants(Array.isArray(fetchedVariants) ? fetchedVariants : []);
      } catch (err) {
        console.error('Lỗi khi tải chi tiết Terrarium:', err);
        toast.error('Đã xảy ra lỗi khi tải chi tiết!');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleSelectVariant = (variant: any) => {
    setSelectedVariant(variant);
    toast.info(`Đã chọn: ${variant.variantName}`);
  };

  const handleAddToCart = () => {
    if (!selectedVariant) {
      toast.error('Vui lòng chọn phiên bản trước khi thêm vào giỏ hàng!');
      return;
    }

    const cartItem = {
      id: `variant-${selectedVariant.terrariumVariantId}`,
      name: `${terrarium.name} - ${selectedVariant.variantName}`,
      price: selectedVariant.price,
      image: selectedVariant.urlImage || terrarium.image,
      quantity: 1,
      selected: false,
      variant: selectedVariant,
    };

    const storedCart = JSON.parse(localStorage.getItem('cartItems') || '[]');
    storedCart.push(cartItem);
    localStorage.setItem('cartItems', JSON.stringify(storedCart));
    toast.success('Đã thêm variant vào giỏ hàng!');
  };

  const handleBuyAsAccessories = (accessories: any[]) => {
    if (!accessories?.length) {
      toast.info('Không có phụ kiện nào để mua.');
      return;
    }

    const storedCart = JSON.parse(localStorage.getItem('cartItems') || '[]');
    accessories.forEach((acc) => {
      storedCart.push({
        id: `acc-${acc.accessoryId}`,
        name: acc.name,
        price: acc.price,
        image: acc.imageUrl || 'https://via.placeholder.com/100',
        quantity: 1,
        selected: false,
      });
    });

    localStorage.setItem('cartItems', JSON.stringify(storedCart));
    toast.success('Đã thêm toàn bộ phụ kiện vào giỏ hàng!');
  };

  if (loading) return <Loading />;

  if (!terrarium) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h2 className="text-3xl font-bold text-red-600 mb-6">
          Không tìm thấy Terrarium
        </h2>
        <button onClick={() => navigate('/')}>Quay lại Trang chủ</button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <button onClick={() => navigate(-1)}>Quay lại</button>

      <TerrariumDetail
        terrarium={terrarium}
        variants={variants}
        selectedVariant={selectedVariant}
        onSelectVariant={handleSelectVariant}
        onAddToCart={handleAddToCart}
        onBuyAccessories={() => handleBuyAsAccessories(terrarium.accessories || [])}
      />
    </div>
  );
};

export default Detail;
