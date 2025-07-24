import React, { useState, useEffect, useRef } from 'react';
import FilterSidebar from '../../components/customer/Shop/FilterSidebar';
import ProductGrid from '../../components/customer/Shop/ProductGrid';
import FilterControls from '../../components/customer/Shop/FilterControls';
import SearchBar from '../../components/customer/Shop/SearchBar';
import AccessoryGrid from '../../components/customer/Shop/AccessoryGrid';
import { AppstoreOutlined, ToolOutlined } from '@ant-design/icons';

import { gsap } from 'gsap';

const Shop: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [sortCriteria, setSortCriteria] = useState<string>('rating');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [selectedCategory, setSelectedCategory] = useState<'Terrarium' | 'Accessory'>('Terrarium');
  const [page, setPage] = useState<number>(1); // ✅ trạng thái page

  const contentRef = useRef<HTMLDivElement>(null);

  // ✅ Scroll + page recovery
  useEffect(() => {
    const savedPage = sessionStorage.getItem('shopPage');
    const savedScroll = sessionStorage.getItem('scrollPosition');

    if (savedPage) setPage(parseInt(savedPage));
    if (savedScroll) {
      setTimeout(() => {
        window.scrollTo({ top: parseInt(savedScroll), behavior: 'smooth' });
      }, 300);
    }

    sessionStorage.removeItem('shopPage');
    sessionStorage.removeItem('scrollPosition');
  }, []);

  // ✅ GSAP animation khi đổi tab
  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
        }
      );
    }
  }, [selectedCategory]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 container mx-auto py-12">
        <h1 className="text-3xl font-bold mb-8">Cửa Hàng</h1>

        {/* Tab chọn category */}
        <div className="flex gap-4 mb-6">
        <button
          onClick={() => setSelectedCategory('Terrarium')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center ${
            selectedCategory === 'Terrarium'
              ? 'bg-green-600 text-white shadow'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          <AppstoreOutlined className="mr-2" />
          Terrarium
        </button>

        <button
          onClick={() => setSelectedCategory('Accessory')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center ${
            selectedCategory === 'Accessory'
              ? 'bg-green-600 text-white shadow'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          <ToolOutlined className="mr-2" />
          Phụ kiện
        </button>
      </div>


        <div className="flex flex-col lg:flex-row gap-6" ref={contentRef}>
          <FilterSidebar selectedType={selectedType} setSelectedType={setSelectedType} />
          <div className="flex-1">
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            <FilterControls
              sortCriteria={sortCriteria}
              setSortCriteria={setSortCriteria}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
            />

            {selectedCategory === 'Terrarium' && (
              <ProductGrid
                searchQuery={searchQuery}
                selectedType={selectedType}
                sortCriteria={sortCriteria}
                sortOrder={sortOrder}
                page={page}
                setPage={setPage}
              />
            )}

            {selectedCategory === 'Accessory' && (
              <AccessoryGrid
                searchQuery={searchQuery}
                selectedType={selectedType}
                sortCriteria={sortCriteria}
                sortOrder={sortOrder}
                page={page}
                setPage={setPage}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
