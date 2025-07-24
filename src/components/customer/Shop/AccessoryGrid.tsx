import React, { useEffect, useState } from 'react';
import AccessoryCard from './AccessoryCard';
import {
  getAllAccessories,
  getAccessoryImagesByAccessoryId,
  getAllAccessoryCategories,
} from '@/api/accessory';
import { Accessory, AccessoryCategory } from '@/types/accessory';

interface AccessoryGridProps {
  searchQuery: string;
  selectedType: string | null;
  sortCriteria: string;
  sortOrder: 'ASC' | 'DESC';
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}

const AccessoryGrid: React.FC<AccessoryGridProps> = ({
  searchQuery,
  selectedType,
  sortCriteria,
  sortOrder,
  page,
  setPage,
}) => {
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [categories, setCategories] = useState<AccessoryCategory[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accessoryRes, categoryRes] = await Promise.all([
          getAllAccessories(page),
          getAllAccessoryCategories(),
        ]);

        const enriched = await Promise.all(
          (accessoryRes || []).map(async (item) => {
            if (item.accessoryImages?.length > 0) return item;
            const images = await getAccessoryImagesByAccessoryId(item.accessoryId);
            return {
              ...item,
              accessoryImages: images || [],
            };
          })
        );

        setAccessories(enriched);
        setCategories(categoryRes || []);
      } catch (err) {
        console.error('Error fetching accessories or categories:', err);
      }
    };

    fetchData();
  }, [page]);

  const filtered = accessories
    .filter((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((a) => (selectedType ? a.status?.toLowerCase() === selectedType.toLowerCase() : true));

  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortCriteria === 'rating') comparison = 0;
    else if (sortCriteria === 'purchases') comparison = 0;
    else if (sortCriteria === 'price') comparison = a.price - b.price;
    return sortOrder === 'ASC' ? comparison : -comparison;
  });

  const getCategoryName = (categoryId: number): string => {
    return categories.find((cat) => cat.categoryId === categoryId)?.categoryName || 'Không rõ';
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sorted.map((item) => (
          <AccessoryCard
            key={item.accessoryId}
            id={item.accessoryId.toString()}
            name={item.name}
            description={item.description}
            categoryName={getCategoryName(item.categoryId)}
            price={item.price}
            image={item.accessoryImages?.[0]?.imageUrl || '/src/assets/image/1.jpg'}
            page={page}
          />
        ))}
      </div>

      <div className="flex justify-center mt-6 space-x-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          Trang trước
        </button>
        <span className="px-4 py-2">Trang {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Trang tiếp
        </button>
      </div>
    </>
  );
};

export default AccessoryGrid;
