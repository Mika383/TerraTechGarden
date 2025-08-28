import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTerrariumById, getVariantsByTerrariumId } from '@/api/terrarium';
import { addTerrariumVariantToCart } from '@/api/cart';
import TerrariumDetail from '@/components/customer/Terrarium/TerrariumDetail';
import Loading from '@/components/common/Loading';
import { toast } from 'react-toastify';
import axios from 'axios';

const IDEMPOTENCY_TTL_MS = 5000;

function buildBundleKey(terrariumId: number, ids: number[]) {
  const sorted = [...ids].sort((a, b) => a - b);
  return `bundle:${terrariumId}:${sorted.join(',')}`;
}
function setLock(key: string) { sessionStorage.setItem(key, String(Date.now())); }
function hasValidLock(key: string) {
  const v = sessionStorage.getItem(key);
  if (!v) return false;
  const ts = Number(v);
  return Number.isFinite(ts) && Date.now() - ts < IDEMPOTENCY_TTL_MS;
}
function clearLock(key: string) { sessionStorage.removeItem(key); }

const Detail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [terrarium, setTerrarium] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [buying, setBuying] = useState<boolean>(false);
  const buyingRef = useRef(false);
  useEffect(() => { buyingRef.current = buying; }, [buying]);

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
          image: apiData.terrariumImages?.[0]?.imageUrl || '/TerraTechLogo.png',
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

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      toast.error('Vui lòng chọn phân loại trước khi thêm vào giỏ hàng!');
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
      const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
      cartItems.push({
        id: `variant-${selectedVariant.terrariumVariantId}`,
        variantId: selectedVariant.terrariumVariantId,
        name: `${terrarium.name} - ${selectedVariant.variantName}`,
        price: selectedVariant.price,
        image: selectedVariant.urlImage || terrarium.image,
        quantity: 1,
        selected: false,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      toast.success('Đã thêm variant vào giỏ hàng (local)!');
    }
  };

  // 🧪 LOG JSON gửi khi "Mua dưới dạng linh kiện"
  const handleBuyAsAccessories = useCallback(
    async (selectedAccessoryIds: number[]) => {
      if (!selectedAccessoryIds?.length) {
        toast.info('Bạn chưa chọn phụ kiện nào.');
        return;
      }
      const terrariumId = Number(id);
      const isLoggedIn = !!localStorage.getItem('authToken');

      const uniqueIds = Array.from(new Set(selectedAccessoryIds));
      const lockKey = buildBundleKey(terrariumId, uniqueIds);

      if (buyingRef.current || hasValidLock(lockKey)) {
        console.warn('⏭️ Bỏ qua request trùng (đang chạy/đã khoá):', lockKey);
        return;
      }

      // Chuẩn bị payload & header để LOG
      const payload = [
        {
          terrariumId,
          totalPrice: 0, // để BE tự tính
          bundleAccessories: uniqueIds.map((accessoryId) => ({
            accessoryId,
            quantity: 1,
          })),
        },
      ];
      const idemKey = `${lockKey}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
      const headers = {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idemKey,
        Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`,
      };
      const url = `${import.meta.env.VITE_API_BASE_URL}/Cart/add-items/multiple`;

      // 🔎 LOG ra console một cách rõ ràng
      console.groupCollapsed('%c[MUA LINH KIỆN] Payload gửi đi', 'color:#0ea5e9;font-weight:bold;');
      console.log('➡️ POST', url);
      console.log('📦 Body JSON:', JSON.stringify(payload, null, 2));
      console.log('🧾 Headers:', headers);
      console.log('👤 Logged in:', isLoggedIn);
      console.groupEnd();

      // Nếu cần expose nhanh để copy:
      (window as any).__DEBUG_BUNDLE__ = { url, headers, payload };

      setLock(lockKey);
      setBuying(true);

      try {
        if (isLoggedIn) {
          const res = await axios.post(url, payload, { headers });
          console.groupCollapsed('%c[MUA LINH KIỆN] Response', 'color:#22c55e;font-weight:bold;');
          console.log('✅ Status:', res.status);
          console.log('✅ Data:', res.data);
          console.groupEnd();

          toast.success('Đã thêm các phụ kiện vào giỏ hàng!');
        } else {
          // Fallback local (cũng LOG lại những item sẽ thêm local)
          const storedCart = JSON.parse(localStorage.getItem('cartItems') || '[]');
          const selected = (terrarium?.accessories || []).filter((acc: any) =>
            uniqueIds.includes(acc.accessoryId)
          );

          console.groupCollapsed('%c[MUA LINH KIỆN][LOCAL] Items sẽ thêm', 'color:#f59e0b;font-weight:bold;');
          console.table(
            selected.map((acc: any) => ({
              accessoryId: acc.accessoryId,
              name: acc.name,
              price: acc.price,
              image: Array.isArray(acc.accessoryImages) && acc.accessoryImages[0]?.imageUrl,
              quantity: 1,
            }))
          );
          console.groupEnd();

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
      } catch (error: any) {
        console.groupCollapsed('%c[MUA LINH KIỆN] ERROR', 'color:#ef4444;font-weight:bold;');
        console.error(error);
        if (error?.response) {
          console.log('❌ Status:', error.response.status);
          console.log('❌ Data:', error.response.data);
        }
        console.groupEnd();
        toast.error('Không thể thêm phụ kiện vào giỏ hàng!');
        clearLock(lockKey); // lỗi thì cho phép thử lại
      } finally {
        setBuying(false);
      }
    },
    [id, terrarium]
  );

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
        onBuyAccessories={handleBuyAsAccessories}
      />
    </div>
  );
};

export default Detail;
