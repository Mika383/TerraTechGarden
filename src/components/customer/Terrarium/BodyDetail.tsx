import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { EffectFade, Navigation, Pagination, Autoplay } from 'swiper/modules';

interface BodyDetailProps {
  id: string;
  name: string;
  type: string;
  image: string;
  bodyHTML: string;
  images: { url: string }[];
}

const BodyDetail: React.FC<BodyDetailProps> = ({
  id,
  name,
  type,
  image,
  bodyHTML,
  images = [],
}) => {
  const specs = [
    { label: 'Loại bể', value: type },
    { label: 'Kích thước', value: '30cm x 20cm x 25cm' },
    { label: 'Vật liệu', value: 'Kính cường lực, đất trồng' },
    { label: 'Cách chăm sóc', value: 'Tưới nước 1 lần/tuần, ánh sáng gián tiếp' },
    { label: 'Khả năng tùy chỉnh', value: 'Có thể thêm cây hoặc phụ kiện' },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
      <h3 className="text-2xl font-semibold text-gray-800 mb-4">Chi tiết sản phẩm</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Hình ảnh bổ sung */}
        <div>
          <h4 className="text-xl font-medium text-gray-700 mb-2">Hình ảnh bổ sung</h4>
          {images.length > 0 ? (
            <Swiper
              modules={[EffectFade, Navigation, Pagination, Autoplay]}
              effect="fade"
              slidesPerView={1}
              spaceBetween={30}
              navigation
              pagination={{ clickable: true }}
              autoplay={{ delay: 4000 }}
              className="rounded-xl"
            >
              {images.map((img, index) => (
                <SwiperSlide key={index}>
                  <img
                    src={img.url}
                    alt={`Ảnh ${index + 1}`}
                    className="w-full h-72 object-cover rounded-xl shadow-md transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        '/TerraTechLogo.png';
                    }}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <p className="text-gray-500">Không có hình ảnh bổ sung.</p>
          )}
        </div>

        {/* Thông số kỹ thuật */}
        <div>
          <h4 className="text-xl font-medium text-gray-700 mb-2">Thông số kỹ thuật</h4>
          <table className="w-full text-left border-collapse">
            <tbody>
              {specs.map((spec, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-2 px-4 text-gray-600 font-medium">{spec.label}</td>
                  <td className="py-2 px-4 text-gray-800">{spec.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mô tả chi tiết */}
      <div>
        <h4 className="text-xl font-medium text-gray-700 mb-2">Mô Tả Chi Tiết</h4>
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: bodyHTML }}
        />
      </div>
    </div>
  );
};

export default BodyDetail;
