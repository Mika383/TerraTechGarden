import React, { useEffect, useRef } from 'react';
import BodyDetail from './BodyDetail';
import { Terrarium, TerrariumVariant } from '@/types/terrarium';
import { ChevronDown, ChevronUp } from 'lucide-react';
import gsap from 'gsap';
import FavoriteButton from '@/components/common/FavoriteButton';

interface Props {
  terrarium: Terrarium | null;
  variants: TerrariumVariant[];
  selectedVariant: TerrariumVariant | null;
  onSelectVariant: (variant: TerrariumVariant) => void;
  onAddToCart: () => void;
  onBuyAccessories: (selected: number[]) => void;
}

const TerrariumDetail: React.FC<Props> = ({
  terrarium,
  variants,
  selectedVariant,
  onSelectVariant,
  onAddToCart,
  onBuyAccessories,
}) => {
  const [showAccessories, setShowAccessories] = React.useState(false);
  const [selectedAccessories, setSelectedAccessories] = React.useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const accessoriesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.fade-in-section', {
        opacity: 0,
        y: 30,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.1,
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (showAccessories && accessoriesRef.current) {
      gsap.fromTo(
        accessoriesRef.current.children,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.1,
          ease: 'power2.out',
        }
      );
    }
  }, [showAccessories]);

  useEffect(() => {
    if (terrarium?.accessories) {
      setSelectedAccessories(terrarium.accessories.map((a) => a.accessoryId));
    }
  }, [terrarium]);

  if (!terrarium) return <p className="text-center py-10">Không tìm thấy thông tin bể.</p>;

  const fallbackImage =
    terrarium.terrariumImages?.[0]?.imageUrl ||
    'https://res.cloudinary.com/dia8sg8u7/image/upload/v1753283976/placeholder/placeholder_400x300.jpg';

  const mainImage = selectedVariant?.urlImage || fallbackImage;

  const formattedImages = Array.isArray(terrarium.terrariumImages)
    ? terrarium.terrariumImages.map((img) => ({ url: img.imageUrl }))
    : [];

  const toggleAccessory = (id: number) => {
    setSelectedAccessories((prev) =>
      prev.includes(id) ? prev.filter((aid) => aid !== id) : [...prev, id]
    );
  };

  const totalSelectedPrice = (terrarium?.accessories || [])
    .filter((acc) => selectedAccessories.includes(acc.accessoryId))
    .reduce((sum, acc) => sum + acc.price, 0);

  return (
    <div
      ref={containerRef}
      className="p-6 bg-white rounded-xl shadow-md font-roboto fade-in-section min-h-screen overflow-visible"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 fade-in-section">
        <div>
          <img
            src={mainImage}
            alt={terrarium.terrariumName}
            className="w-full h-80 object-cover rounded-xl border"
          />
        </div>

        <div className="space-y-4">
          {/* Tiêu đề + ❤️ Favorite */}
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-3xl font-bold text-green-700">{terrarium.terrariumName}</h2>
            <FavoriteButton
              type="terrarium"
              productId={terrarium.terrariumId}
              size="middle"
            />
          </div>

          <p className="text-gray-600">{terrarium.description}</p>
          <p className="text-gray-800 font-semibold">
            Giá{' '}
            {selectedVariant
              ? selectedVariant.price.toLocaleString('vi-VN')
              : terrarium.minPrice.toLocaleString('vi-VN')}{' '}
            VND
          </p>

          <div className="space-y-2">
            <label className="font-medium">Phân loại (Variant):</label>
            <div className="flex flex-wrap gap-3 flex-row items-center">
              {variants.map((variant) => {
                const isSelected =
                  selectedVariant?.terrariumVariantId === variant.terrariumVariantId;
                const variantImage = variant.urlImage || fallbackImage;

                return (
                  <button
                    key={variant.terrariumVariantId}
                    onClick={() => onSelectVariant(variant)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition
                      ${
                        isSelected
                          ? 'bg-green-100 border-green-600 text-green-800 font-semibold shadow'
                          : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                      }`}
                  >
                    <img
                      src={variantImage}
                      alt={variant.variantName}
                      className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-md object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          'https://res.cloudinary.com/dia8sg8u7/image/upload/v1753283976/placeholder/placeholder_100x100.jpg';
                      }}
                    />
                    <span className="text-sm whitespace-nowrap">{variant.variantName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
            disabled={!selectedVariant}
            onClick={onAddToCart}
          >
            {selectedVariant ? 'Thêm vào giỏ hàng' : 'Chọn phân loại trước'}
          </button>
        </div>
      </div>

      {Array.isArray(terrarium?.accessories) && terrarium.accessories.length > 0 && (
        <div className="mt-10 border-t pt-6 fade-in-section">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-semibold text-gray-800">
              Phụ kiện cấu thành Terrarium
            </h3>
            <button
              onClick={() => setShowAccessories(!showAccessories)}
              className="text-sm text-gray-700 hover:underline flex items-center"
            >
              {showAccessories ? (
                <>
                  <ChevronUp className="w-5 h-5 mr-1" /> Thu gọn
                </>
              ) : (
                <>
                  <ChevronDown className="w-5 h-5 mr-1" /> Hiển thị
                </>
              )}
            </button>
          </div>

          <div className="text-right mb-2">
            <p className="text-sm text-gray-700 mb-1">
              Tổng:{' '}
              <span className="font-semibold text-green-700">
                {totalSelectedPrice.toLocaleString('vi-VN')} VND
              </span>
            </p>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
              onClick={() => onBuyAccessories(selectedAccessories)}
            >
              Mua dưới dạng linh kiện
            </button>
          </div>

          {showAccessories && (
            <div
              ref={accessoriesRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4"
            >
              {terrarium.accessories.map((acc) => {
                const accImage =
                  Array.isArray((acc as any).accessoryImages) &&
                  (acc as any).accessoryImages.length > 0
                    ? (acc as any).accessoryImages[0].imageUrl
                    : null;

                const isChecked = selectedAccessories.includes(acc.accessoryId);

                return (
                  <label
                    key={acc.accessoryId}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg shadow-sm border cursor-pointer fade-in-section"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleAccessory(acc.accessoryId)}
                      className="accent-green-600 w-5 h-5"
                    />
                    {accImage && (
                      <img
                        src={accImage}
                        alt={acc.name}
                        className="w-14 h-14 object-cover rounded-md"
                        onError={(e) => {
                          e.currentTarget.src = fallbackImage;
                        }}
                      />
                    )}
                    <div>
                      <h4 className="font-semibold text-green-700">{acc.name}</h4>
                      <p className="text-sm text-gray-600">{acc.description}</p>
                      <p className="font-medium text-gray-800">
                        {acc.price.toLocaleString('vi-VN')} VND
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="mt-10 fade-in-section">
        <BodyDetail
          id={terrarium.terrariumId.toString()}
          name={terrarium.terrariumName}
          type={`#${terrarium.environmentId}`}
          image={mainImage}
          bodyHTML={terrarium.bodyHTML || ''}
          images={formattedImages}
        />
      </div>
    </div>
  );
};

export default TerrariumDetail;
