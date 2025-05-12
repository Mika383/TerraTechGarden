import React, { useState } from 'react';
import TerrariumCard from '../../components/TerrariumCard';
import forestImg from '../../assets/image/1.jpg';
import desertImg from '../../assets/image/2.jpg';
import tropicalImg from '../../assets/image/3.jpg';
import succulentImg from '../../assets/image/4.jpg';
import mossyImg from '../../assets/image/5.jpg';
import fairyImg from '../../assets/image/6.jpg';

const products = [
  {
    id: '1',
    name: 'Forest Terrarium',
    description: 'Hệ sinh thái rừng thu nhỏ với cây xanh tươi mát.',
    type: 'Cạn',
    price: 1475000, 
    rating: 4.5,
    purchases: 120,
    image: forestImg,
    category: 'Terrarium',
  },
  {
    id: '2',
    name: 'Desert Oasis Terrarium',
    description: 'Bể sa mạc với xương rồng và cát trắng tinh tế.',
    type: 'Cạn',
    price: 1975000, 
    rating: 4.0,
    purchases: 85,
    image: desertImg,
    category: 'Terrarium',
  },
  {
    id: '3',
    name: 'Tropical Paradise Terrarium',
    description: 'Không gian nhiệt đới với cây cối rực rỡ.',
    type: 'Bán Cạn',
    price: 2475000, 
    rating: 4.8,
    purchases: 150,
    image: tropicalImg,
    category: 'Terrarium',
  },
  {
    id: '4',
    name: 'Succulent Garden Terrarium',
    description: 'Vườn cây mọng nước dễ chăm sóc.',
    type: 'Cạn',
    price: 1225000,
    rating: 4.2,
    purchases: 90,
    image: succulentImg,
    category: 'Terrarium',
  },
  {
    id: '5',
    name: 'Mossy World Terrarium',
    description: 'Thế giới rêu xanh mát, đầy thư giãn.',
    type: 'Bán Cạn',
    price: 1725000, 
    rating: 4.3,
    purchases: 110,
    image: mossyImg,
    category: 'Terrarium',
  },
  {
    id: '6',
    name: 'Fairy Garden Terrarium',
    description: 'Vườn cổ tích với ánh sáng lung linh.',
    type: 'Cạn',
    price: 2225000, 
    rating: 4.7,
    purchases: 130,
    image: fairyImg,
    category: 'Terrarium',
  },
  {
    id: '7',
    name: 'Tảo Rêu Cao Cấp',
    description: 'Tảo rêu cao cấp để trang trí bể.',
    type: 'Nước',
    price: 375000, 
    rating: 4.1,
    purchases: 200,
    image: mossyImg,
    category: 'Phụ kiện',
  },
  {
    id: '8',
    name: 'Kéo Chăm Sóc Cây',
    description: 'Kéo chuyên dụng để chăm sóc cây và bể.',
    type: 'Dụng Cụ',
    price: 625000, 
    rating: 4.6,
    purchases: 180,
    image: forestImg,
    category: 'Phụ kiện',
  },
];

const Shop: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [sortCriteria, setSortCriteria] = useState<string>('rating');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

 
  const types = ['Nước', 'Cạn', 'Bán Cạn', 'Dụng Cụ', 'Khác'];
  
  
  const filteredProducts = products
    .filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((product) =>
      selectedType ? product.type === selectedType : true
    );

 
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let comparison = 0;
    if (sortCriteria === 'rating') {
      comparison = a.rating - b.rating;
    } else if (sortCriteria === 'purchases') {
      comparison = a.purchases - b.purchases;
    } else if (sortCriteria === 'price') {
      comparison = a.price - b.price;
    }
    return sortOrder === 'ASC' ? comparison : -comparison;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 container mx-auto py-12">
        <h1 className="text-3xl font-bold mb-8">Cửa Hàng</h1>

        
        <div className="mb-6">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        
        <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedType(null)}
              className={`px-4 py-2 rounded-lg ${
                !selectedType ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
              } hover:bg-blue-600 hover:text-white transition-colors`}
            >
              Tất cả
            </button>
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-lg ${
                  selectedType === type ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                } hover:bg-blue-600 hover:text-white transition-colors`}
              >
                {type}
              </button>
            ))}
          </div>

          
          <div className="flex gap-2">
            <select
              value={sortCriteria}
              onChange={(e) => setSortCriteria(e.target.value)}
              className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="rating">Đánh giá</option>
              <option value="purchases">Lượt mua</option>
              <option value="price">Giá</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'ASC' | 'DESC')}
              className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="DESC">Cao đến thấp</option>
              <option value="ASC">Thấp đến cao</option>
            </select>
          </div>
        </div>

        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProducts.map((product) => (
            <TerrariumCard
              key={product.id}
              id={product.id}
              name={product.name}
              description={product.description}
              type={product.type}
              price={product.price}
              rating={product.rating}
              purchases={product.purchases}
              image={product.image}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Shop;