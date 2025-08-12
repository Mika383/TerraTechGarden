import React, { useEffect, useState } from 'react';
import TerrariumCard from '../Terrarium/TerrariumCard';
import { getAllTerrariums, getAllEnvironments, getAllTankMethods } from '@/api/terrarium';
import { Terrarium, Environment, TankMethod } from '@/types/terrarium';

interface ProductGridProps {
  searchQuery: string;
  selectedType: string | null;
  sortCriteria: string;
  sortOrder: 'ASC' | 'DESC';
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  searchQuery,
  selectedType,
  sortCriteria,
  sortOrder,
  page,
  setPage,
}) => {
  const [terrariums, setTerrariums] = useState<Terrarium[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [tankMethods, setTankMethods] = useState<TankMethod[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [terrariumRes, envRes, tankRes] = await Promise.all([
          getAllTerrariums(page),
          getAllEnvironments(),
          getAllTankMethods(),
        ]);

        setTerrariums(terrariumRes || []);
        setEnvironments(envRes || []);
        setTankMethods(tankRes || []);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
      }
    };

    fetchData();
  }, [page]);

  const getEnvironmentName = (environmentId: number): string =>
    environments.find((e) => e.environmentId === environmentId)?.environmentName || 'Không rõ';

  const getTankMethodType = (tankMethodId: number): string =>
    tankMethods.find((t) => t.tankMethodId === tankMethodId)?.tankMethodType || 'Không rõ';

  const filteredProducts = terrariums
    .filter((product) =>
      product.terrariumName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((product) =>
      selectedType ? product.status?.toLowerCase() === selectedType.toLowerCase() : true
    );

  const sortedProducts = [...filteredProducts]
    .sort((a, b) => {
      let comparison = 0;
      if (sortCriteria === 'rating') comparison = 0;
      else if (sortCriteria === 'purchases') comparison = 0;
      else if (sortCriteria === 'price') comparison = (a.minPrice ?? 0) - (b.minPrice ?? 0);
      return sortOrder === 'ASC' ? comparison : -comparison;
    })
    .slice(0, 9); // Giới hạn tối đa 9 sản phẩm

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {sortedProducts.map((product) => (
          <TerrariumCard
            key={product.terrariumId}
            id={product.terrariumId.toString()}
            name={product.terrariumName}
            description={product.description}
            type={getTankMethodType(product.tankMethodId)}
            price={product.minPrice ?? 0}
            rating={0}
            purchases={0}
            image={product.terrariumImages?.[0]?.imageUrl || '/src/assets/image/1.jpg'}
            environmentName={getEnvironmentName(product.environmentId)}
            page={page}
          />
        ))}
      </div>

      <div className="flex justify-center mt-6 space-x-3 md:space-x-4">
        <button
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={page === 1}
          className="px-3 md:px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 text-sm md:text-base font-roboto"
        >
          Trang trước
        </button>
        <span className="px-3 md:px-4 py-2 text-sm md:text-base font-roboto">Trang {page}</span>
        <button
          onClick={() => setPage((prev) => prev + 1)}
          disabled={sortedProducts.length < 9}
          className="px-3 md:px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 text-sm md:text-base font-roboto"
        >
          Trang tiếp
        </button>
      </div>
    </>
  );
};

export default ProductGrid;