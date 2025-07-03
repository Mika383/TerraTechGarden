import React from 'react';
import { useState } from 'react';
import { Range, getTrackBackground } from 'react-range';

interface FilterSidebarProps {
  selectedType: string | null;
  setSelectedType: (type: string | null) => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ selectedType, setSelectedType }) => {
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000000]);
  const [size, setSize] = useState<string>('');

  const categories = ['Terrarium', 'Phụ kiện'];
  const types = ['Nước', 'Cạn', 'Bán Cạn', 'Dụng Cụ', 'Khác'];

  return (
    <aside className="w-full lg:w-64 bg-white p-4 shadow-md rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Categories</h2>
      {categories.map((category) => (
        <div key={category} className="mb-2">
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            {category}
          </label>
        </div>
      ))}
      <h2 className="text-lg font-semibold mt-6 mb-4">Price Range</h2>
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
        renderThumb={({ props }) => {
          const { key, ...otherProps } = props; // Destructure key
          return (
            <div
              key={key}
              {...otherProps}
              style={{
                ...otherProps.style,
                height: '16px',
                width: '16px',
                backgroundColor: '#90EE90',
                borderRadius: '50%',
                outline: 'none',
              }}
            />
          );
        }}
      />
      <div className="flex justify-between mt-2">
        <span>{priceRange[0].toLocaleString()} VNĐ</span>
        <span>{priceRange[1].toLocaleString()} VNĐ</span>
      </div>
      <h2 className="text-lg font-semibold mt-6 mb-4">Size</h2>
      <select
        value={size}
        onChange={(e) => setSize(e.target.value)}
        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select size</option>
        <option value="small">Small</option>
        <option value="medium">Medium</option>
        <option value="large">Large</option>
      </select>
      <h2 className="text-lg font-semibold mt-6 mb-4">Type</h2>
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
      <h2 className="text-lg font-semibold mt-6 mb-4">Rating</h2>
      <div className="flex">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <span key={i} className="text-yellow-400">★</span>
          ))}
      </div>
      <button className="mt-6 w-full py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
        Clear Filters
      </button>
    </aside>
  );
};

export default FilterSidebar;