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
  const [page, setPage] = useState<number>(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPage(1); // Reset về trang 1 khi đổi category
  }, [selectedCategory]);

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
    <div className="min-h-screen bg-gray-50 flex flex-col font-roboto">
      <div className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-bold text-green-700 mb-6 md:mb-8">Cửa Hàng</h1>

        {/* Tab chọn category */}
        <div className="flex flex-wrap gap-3 md:gap-4 mb-6">
          <button
            onClick={() => setSelectedCategory('Terrarium')}
            className={`flex items-center px-3 md:px-4 py-2 rounded-lg font-semibold transition-all duration-200 text-sm md:text-base ${
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
            className={`flex items-center px-3 md:px-4 py-2 rounded-lg font-semibold transition-all duration-200 text-sm md:text-base ${
              selectedCategory === 'Accessory'
                ? 'bg-green-600 text-white shadow'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            <ToolOutlined className="mr-2" />
            Phụ kiện
          </button>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden px-3 py-2 bg-gray-200 rounded-lg text-gray-800 hover:bg-gray-300 font-semibold text-sm"
          >
            Bộ lọc
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6" ref={contentRef}>
          <div
            className={`${
              isSidebarOpen ? 'block' : 'hidden'
            } md:block lg:w-64 bg-white p-4 shadow-md rounded-lg mb-6 lg:mb-0 transition-all duration-300`}
          >
            <FilterSidebar selectedType={selectedType} setSelectedType={setSelectedType} />
          </div>
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