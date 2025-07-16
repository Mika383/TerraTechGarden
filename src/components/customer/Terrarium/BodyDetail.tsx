import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

interface BodyDetailProps {
  id: string;
  name: string;
  type: string;
  image: string;
  bodyHTML: string;
  images: { url: string }[];
}

const BodyDetail: React.FC<BodyDetailProps> = ({ id, name, type, image, bodyHTML, images = [] }) => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false,
        },
      },
    ],
  };

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
        <div className="w-full">
          <h4 className="text-xl font-medium text-gray-700 mb-2">Hình ảnh bổ sung</h4>
          {images?.length > 0 ? (
            <Slider {...settings}>
              {images.map((img, index) => (
                <div key={index} className="p-2">
                  <img
                    src={img.url}
                    alt={`Ảnh ${index + 1}`}
                    className="w-full h-64 object-cover rounded-lg shadow-md"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/400x300';
                    }}
                  />
                </div>
              ))}
            </Slider>
          ) : (
            <p className="text-gray-500">Không có hình ảnh bổ sung.</p>
          )}
        </div>

        <div className="w-full">
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

      <div className="prose max-w-none">
        <h4 className="text-xl font-medium text-gray-700 mb-2">Mô Tả Chi Tiết</h4>
        <div dangerouslySetInnerHTML={{ __html: bodyHTML }} />
      </div>
    </div>
  );
};

export default BodyDetail;
