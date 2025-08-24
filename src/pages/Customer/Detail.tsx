import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getTerrariumById,
  getVariantsByTerrariumId,
} from '@/api/terrarium';
import {
  addTerrariumVariantToCart,   // ✅ API mới: add variant
  addBundleAccessories,        // ✅ API mới: mua dưới dạng linh kiện
} from '@/api/cart';
import TerrariumDetail from '@/components/customer/Terrarium/TerrariumDetail';
import Loading from '@/components/common/Loading';
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

        if (!apiData || typeof apiData.terrariumId !== 'number') {
          toast.error('Không tìm thấy dữ liệu bể!');
          return;
        }

        const formattedTerrarium = {
          ...apiData,
          id: apiData.terrariumId.toString(),
          name: apiData.terrariumName || 'Không rõ tên',
          type: `#${apiData.environmentId || 'N/A'}`,
          image:
            apiData.terrariumImages?.[0]?.imageUrl ||
            '/TerraTechLogo.png',
          terrariumImages: apiData.terrariumImages || [],
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

  // ✅ Thêm vào giỏ: TERRARIUM VARIANT (API mới /Cart/add-item)
  const handleAddToCart = async () => {
    if (!selectedVariant) {
      toast.error('Vui lòng chọn phiên bản trước khi thêm vào giỏ hàng!');
      return;
    }

    const isLoggedIn = !!localStorage.getItem('authToken');
    const terrariumId = Number(id);

    if (isLoggedIn) {
      try {
        await addTerrariumVariantToCart(
          terrariumId,
          selectedVariant.terrariumVariantId,
          1
        );
        toast.success('Đã thêm variant vào giỏ hàng!');
      } catch (error) {
        console.error(error);
        toast.error('Lỗi khi thêm vào giỏ hàng!');
      }
    } else {
      // Fallback local cho khách chưa đăng nhập
      const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');

      const newItem = {
        id: `variant-${selectedVariant.terrariumVariantId}`,
        variantId: selectedVariant.terrariumVariantId,
        name: `${terrarium.name} - ${selectedVariant.variantName}`,
        price: selectedVariant.price,
        image: selectedVariant.urlImage || terrarium.image,
        quantity: 1,
        selected: false,
        createdAt: new Date().toISOString(),
      };

      cartItems.push(newItem);
      localStorage.setItem('cartItems', JSON.stringify(cartItems));

      toast.success('Đã thêm variant vào giỏ hàng (local)!');
    }
  };

  // ✅ Mua DƯỚI DẠNG LINH KIỆN (API mới /Cart/add-items/multiple)
  // TerrariumDetail sẽ truyền vào mảng các accessoryId đã tick.
  const handleBuyAsAccessories = async (selectedAccessoryIds: number[]) => {
    if (!selectedAccessoryIds?.length) {
      toast.info('Bạn chưa chọn phụ kiện nào.');
      return;
    }

    const terrariumId = Number(id);
    const isLoggedIn = !!localStorage.getItem('authToken');

    if (isLoggedIn) {
      try {
        // Theo spec bạn gửi: tổng hợp thành 1 item cho 1 terrarium
        const payload = [
          {
            terrariumId,
            totalPrice: 0, // server có thể tự tính; để 0 theo ví dụ bạn đưa
            bundleAccessories: selectedAccessoryIds.map((accessoryId) => ({
              accessoryId,
              quantity: 1,
            })),
          },
        ];

        await addBundleAccessories(payload);
        toast.success('Đã thêm các phụ kiện vào giỏ hàng!');
      } catch (error) {
        console.error(error);
        toast.error('Không thể thêm phụ kiện vào giỏ hàng!');
      }
    } else {
      // Fallback local: lấy thông tin phụ kiện từ terrarium.accessories
      const storedCart = JSON.parse(localStorage.getItem('cartItems') || '[]');

      const selected = (terrarium?.accessories || []).filter((acc: any) =>
        selectedAccessoryIds.includes(acc.accessoryId)
      );

      selected.forEach((acc: any) => {
        storedCart.push({
          id: `acc-${acc.accessoryId}`,
          accessoryId: acc.accessoryId,
          name: acc.name,
          price: acc.price,
          image:
            (Array.isArray(acc.accessoryImages) && acc.accessoryImages[0]?.imageUrl) ||
            '/TerraTechLogo.png',
          quantity: 1,
          selected: false,
          createdAt: new Date().toISOString(),
        });
      });

      localStorage.setItem('cartItems', JSON.stringify(storedCart));
      toast.success('Đã thêm các phụ kiện vào giỏ hàng (local)!');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <button onClick={() => navigate(-1)}>Quay lại</button>

      <TerrariumDetail
        terrarium={terrarium}
        variants={variants}
        selectedVariant={selectedVariant}
        onSelectVariant={handleSelectVariant}
        onAddToCart={handleAddToCart}
        // 🔁 Truyền thẳng mảng accessoryId được chọn từ component con
        onBuyAccessories={handleBuyAsAccessories}
      />
    </div>
  );
};

export default Detail;
