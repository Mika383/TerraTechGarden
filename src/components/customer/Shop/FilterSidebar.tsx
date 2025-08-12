import React, { useState } from 'react';
import { Range, getTrackBackground } from 'react-range';

interface FilterSidebarProps {
  selectedType: string | null;
  setSelectedType: (type: string | null) => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ selectedType, setSelectedType }) => {
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000000]);
  const [size, setSize] = useState<string>('');

  const types = ['Nước', 'Cạn', 'Bán Cạn', 'Dụng Cụ', 'Khác'];

  return (
    <aside className="w-full bg-white p-4 rounded-lg shadow-md font-roboto">
      <h2 className="text-lg md:text-xl font-semibold text-green-700 mb-4">Bộ Lọc</h2>

      <h3 className="text-base md:text-lg font-semibold mb-3 text-gray-800">Khoảng Giá</h3>
      <Range
        values={priceRange}
        step={100000}
        min={0}
        max={3000000}
        onChange={(values: number[]) => setPriceRange([values[0], values[1]])}
        renderTrack={({ props, children }) => (
          <div
            {...props}
            style={{
              ...props.style,
              height: '6px',
              width: '100%',
              background: getTrackBackground({
                values: priceRange,
                colors: ['#ccc', '#90EE90', '#ccc'],
                min: 0,
                max: 3000000,
              }),
              borderRadius: '4px',
            }}
          >
            {children}
          </div>
        )}
        renderThumb={({ props, index }) => (
          <div
            {...props}
            key={index}
            style={{
              ...props.style,
              height: '16px',
              width: '16px',
              backgroundColor: '#90EE90',
              borderRadius: '50%',
              outline: 'none',
            }}
          />
        )}
      />
      <div className="flex justify-between mt-2 text-sm md:text-base">
        <span>{priceRange[0].toLocaleString('vi-VN')} VNĐ</span>
        <span>{priceRange[1].toLocaleString('vi-VN')} VNĐ</span>
      </div>

      <h3 className="text-base md:text-lg font-semibold mt-5 mb-3 text-gray-800">Kích Thước</h3>
      <select
        value={size}
        onChange={(e) => setSize(e.target.value)}
        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
      >
        <option value="">Chọn kích thước</option>
        <option value="small">Nhỏ</option>
        <option value="medium">Trung</option>
        <option value="large">Lớn</option>
      </select>

      <h3 className="text-base md:text-lg font-semibold mt-5 mb-3 text-gray-800">Loại</h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedType(null)}
          className={`px-3 py-1.5 rounded-lg text-sm md:text-base ${
            !selectedType ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'
          } hover:bg-green-700 hover:text-white transition-colors`}
        >
          Tất cả
        </button>
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-3 py-1.5 rounded-lg text-sm md:text-base ${
              selectedType === type ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'
            } hover:bg-green-700 hover:text-white transition-colors`}
          >
            {type}
          </button>
        ))}
      </div>

      <h3 className="text-base md:text-lg font-semibold mt-5 mb-3 text-gray-800">Đánh Giá</h3>
      <div className="flex">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <span key={i} className="text-yellow-500 text-lg">★</span>
          ))}
      </div>

      <button className="mt-5 w-full py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-gray-800 text-sm md:text-base transition-colors">
        Xóa Bộ Lọc
      </button>
    </aside>
  );
};

export default FilterSidebar;