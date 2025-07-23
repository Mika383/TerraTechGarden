import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTerrariumById, getAllTerrariumVariants } from '@/api';
import TerrariumDetail from '../../components/customer/Terrarium/TerrariumDetail';
import BodyDetail from '../../components/customer/Terrarium/BodyDetail';
import TerrariumReviews from '../../components/customer/Terrarium/TerrariumReviews';
import Loading from '../../components/Loading';
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
      if (id) {
        setLoading(true);
        const apiData = await getTerrariumById(Number(id));
        if (apiData) {
          setTerrarium({
            id: apiData.terrariumId.toString(),
            name: apiData.name,
            description: apiData.description,
            type: apiData.environments.join(', '),
            price: apiData.price,
            rating: 4,
            purchases: 0,
            image: apiData.terrariumImages[0]?.url || 'https://via.placeholder.com/400x300',
            bodyHTML: apiData.bodyHTML || '',
            terrariumImages: apiData.terrariumImages || [],
            accessories: apiData.accessories || [],
          });

          const allVariants = await getAllTerrariumVariants();
          const relatedVariants = allVariants.filter((v: any) => v.terrariumId === apiData.terrariumId);
          setVariants(relatedVariants);
        }
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSelectVariant = (variant: any) => {
    setSelectedVariant(variant);
    toast.info(`Đã chọn: ${variant.variantName}`);
  };

  const handleAddToCart = () => {
  if (!selectedVariant) {
    toast.error('Vui lòng chọn phiên bản trước khi thêm vào giỏ hàng!');
    return;
  }

  const totalPrice = terrarium.price + selectedVariant.additionalPrice;

  const cartItem = {
    id: `variant-${selectedVariant.terrariumVariantId}`,
    name: `${terrarium.name} - ${selectedVariant.variantName}`,
    price: totalPrice,
    image: terrarium.image,
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
    if (!accessories.length) {
      toast.info('Không có phụ kiện nào để mua.');
      return;
    }

    const storedCart = JSON.parse(localStorage.getItem('cartItems') || '[]');

    accessories.forEach(acc => {
      storedCart.push({
        id: `acc-${acc.accessoryId}`,
        name: acc.name,
        price: acc.price,
        image: 'https://via.placeholder.com/100',
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
        <h2 className="text-3xl font-bold text-red-600 mb-6">Không tìm thấy Terrarium</h2>
        <button onClick={() => navigate('/')}>Quay lại Trang chủ</button>
      </div>
    );
  }

  const displayedPrice = terrarium.price + (selectedVariant?.additionalPrice || 0);

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <button onClick={() => navigate(-1)}>Quay lại</button>

      <TerrariumDetail
        {...terrarium}
        price={displayedPrice}
      />

      {/* Variant options */}
      {variants.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Chọn Phiên Bản</h3>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant: any) => (
              <button
                key={variant.terrariumVariantId}
                onClick={() => handleSelectVariant(variant)}
                className={`px-4 py-2 rounded ${selectedVariant?.terrariumVariantId === variant.terrariumVariantId ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
              >
                {variant.variantName} (+{variant.additionalPrice.toLocaleString('vi-VN')} VND)
              </button>
            ))}
          </div>
        </div>
      )}

      <BodyDetail {...terrarium} />

      {/* Accessories */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Phụ Kiện Cấu Thành</h3>
        <ul className="space-y-2">
          {terrarium.accessories.map((acc: any) => (
            <li key={acc.accessoryId}>{acc.name} - {acc.price.toLocaleString('vi-VN')} VND</li>
          ))}
        </ul>
        <button onClick={() => handleBuyAsAccessories(terrarium.accessories)} className="mt-4 bg-green-600 text-white px-4 py-2 rounded">
          Mua dưới dạng linh kiện
        </button>
      </div>

      <button
          onClick={handleAddToCart}
          disabled={!selectedVariant}
          className={`px-6 py-3 rounded ${selectedVariant ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
        >
          Thêm vào giỏ hàng
        </button>


      <TerrariumReviews reviews={[]} />
    </div>
  );
};

export default Detail;
