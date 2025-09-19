import React from 'react';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, setSearchQuery }) => {
  return (
    <div className="mb-4 md:mb-6">
      <input
        type="text"
        placeholder="Tìm theo tên sản phẩm…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base font-roboto"
      />
    </div>
  );
};

export default SearchBar;
