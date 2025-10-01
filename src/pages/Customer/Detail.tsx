import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTerrariumById, getVariantsByTerrariumId } from '@/api/terrarium';
import { addTerrariumVariantToCart } from '@/api/cart';
import TerrariumDetail from '@/components/customer/Terrarium/TerrariumDetail';
import Loading from '@/components/common/Loading';
import { toast } from 'react-toastify';
import axios from 'axios';
import TerrariumFeedbackList from '@/components/customer/Terrarium/TerrariumFeedbackList';

/**
 * Idempotency window để tránh double-submit.
 */
const IDEMPOTENCY_TTL_MS = 5000;

/**
 * ⚠️ Đổi khoá idempotency theo "variantId" (KHÔNG còn theo terrariumId)
 * vì mua dưới dạng linh kiện bây giờ phụ thuộc vào biến thể đang chọn.
 */
function buildBundleKey(variantId: number, ids: number[]) {
  const sorted = [...ids].sort((a, b) => a - b);
  return `bundle:v${variantId}:${sorted.join(',')}`;
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
        // 1) Lấy chi tiết Terrarium
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

        // 2) Lấy danh sách variants & CHỌN MẶC ĐỊNH biến thể đầu tiên
        const fetchedVariants = await getVariantsByTerrariumId(terrariumId);
        const list = Array.isArray(fetchedVariants) ? fetchedVariants : [];
        setVariants(list);
        if (list.length > 0) {
          setSelectedVariant(list[0]); // ✅ MẶC ĐỊNH CHỌN VARIANT ĐẦU TIÊN
        }
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
    
  };

  const handleAddToCart = async (qty: number = 1) => {
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
          qty
        );
        toast.success('Đã thêm variant vào giỏ hàng!');
      } catch (error) {
        console.error(error);
        toast.error('Lỗi khi thêm vào giỏ hàng!');
      }
    } else {
      // Fallback local
      const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
      cartItems.push({
        id: `variant-${selectedVariant.terrariumVariantId}`,
        variantId: selectedVariant.terrariumVariantId,
        name: `${terrarium.name} - ${selectedVariant.variantName}`,
        price: selectedVariant.price,
        image: selectedVariant.urlImage || terrarium.image,
        quantity: qty,
        selected: false,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      toast.success('Đã thêm variant vào giỏ hàng (local)!');
    }
  };

  /**
   * MUA DƯỚI DẠNG LINH KIỆN
   * - Dựa trên "selectedVariant"
   * - Payload theo BE mới: [{ terrariumVarientId, totalPrice, bundleAccessories: [{ accessoryId, quantity }] }]
   */
  const handleBuyAsAccessories = useCallback(
    async (selected: number[] | { id: number; qty: number }[]) => {
      if (!selectedVariant) {
        toast.error('Vui lòng chọn phân loại trước khi mua linh kiện!');
        return;
      }
      if (!selected?.length) {
        toast.info('Bạn chưa chọn phụ kiện nào.');
        return;
      }

      const isLoggedIn = !!localStorage.getItem('authToken');

      // Chuẩn hoá thành object {id, qty}
      const normalized =
        typeof selected[0] === 'number'
          ? (selected as number[]).map((id) => ({ id, qty: 1 }))
          : (selected as { id: number; qty: number }[]);

      const uniqueIds = Array.from(new Set(normalized.map((x) => x.id)));
      const lockKey = buildBundleKey(selectedVariant.terrariumVariantId, uniqueIds);

      if (buyingRef.current || hasValidLock(lockKey)) {
        console.warn('⏭️ Bỏ qua request trùng (đang chạy/đã khoá):', lockKey);
        return;
      }

      // ✅ Payload mới theo BE: terrariumVarientId (chính tả như BE cung cấp)
      const payload = [
        {
          terrariumVarientId: selectedVariant.terrariumVariantId,
          totalPrice: 0,
          bundleAccessories: normalized.map((item) => ({
            accessoryId: item.id,
            quantity: item.qty,
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

      console.groupCollapsed('%c[MUA LINH KIỆN THEO VARIANT] Payload', 'color:#0ea5e9;font-weight:bold;');
      console.log('➡️ POST', url);
      console.log('📦 Body JSON:', JSON.stringify(payload, null, 2));
      console.log('🧾 Headers:', headers);
      console.log('🧩 selectedVariant:', selectedVariant);
      console.groupEnd();

      (window as any).__DEBUG_BUNDLE__ = { url, headers, payload };

      setLock(lockKey);
      setBuying(true);

      try {
        if (isLoggedIn) {
          const res = await axios.post(url, payload, { headers });
          console.groupCollapsed('%c[MUA LINH KIỆN THEO VARIANT] Response', 'color:#22c55e;font-weight:bold;');
          console.log('✅ Status:', res.status);
          console.log('✅ Data:', res.data);
          console.groupEnd();
          toast.success('Đã thêm các phụ kiện vào giỏ hàng!');
        } else {
          // Fallback local — không còn dữ liệu accessories từ terrarium.
          // Lưu "một item bundle" tối giản theo variantId + danh sách accessoryId/qty để client khác (giỏ) xử lý tiếp.
          const storedCart = JSON.parse(localStorage.getItem('cartItems') || '[]');
          storedCart.push({
            id: `bundle-v${selectedVariant.terrariumVariantId}-${uniqueIds.join('-')}`,
            variantId: selectedVariant.terrariumVariantId,
            name: `Bundle phụ kiện cho: ${terrarium?.name || 'Terrarium'}`,
            price: 0, // không tính ở đây
            image: selectedVariant.urlImage || terrarium?.image || '/TerraTechLogo.png',
            quantity: 1,
            selected: false,
            createdAt: new Date().toISOString(),
            meta: {
              accessories: normalized, // [{id, qty}]
            },
          });
          localStorage.setItem('cartItems', JSON.stringify(storedCart));
          toast.success('Đã thêm bundle phụ kiện (local)!');
        }
      } catch (error: any) {
        console.groupCollapsed('%c[MUA LINH KIỆN THEO VARIANT] ERROR', 'color:#ef4444;font-weight:bold;');
        console.error(error);
        if (error?.response) {
          console.log('❌ Status:', error.response.status);
          console.log('❌ Data:', error.response.data);
        }
        console.groupEnd();
        toast.error('Không thể thêm phụ kiện vào giỏ hàng!');
        clearLock(lockKey);
      } finally {
        setBuying(false);
      }
    },
    [selectedVariant, terrarium]
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

      {terrarium && (
        <TerrariumFeedbackList
          terrariumId={terrarium.terrariumId}
          pageSize={5}
        />
      )}
    </div>
  );
};

export default Detail;
