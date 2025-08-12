import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authHeader = () => {
  const token = localStorage.getItem('authToken');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export type FavoriteType = 'accessory' | 'terrarium';

export interface FavoriteItem {
  favoriteId: number;
  type: FavoriteType;
  productId: number;
  name: string;
  price: number;
  thumbnailUrl: string;
  createdAt: string;
}

export const getFavorites = async (): Promise<FavoriteItem[]> => {
  const res = await axios.get(`${BASE_URL}/Favorite`, authHeader());
  return res.data?.data ?? [];
};

export const addFavorite = async (payload: { accessoryId?: number; terrariumId?: number }): Promise<FavoriteItem> => {
  const res = await axios.post(`${BASE_URL}/Favorite`, payload, authHeader());
  return res.data?.data;
};

export const removeFavorite = async (favoriteId: number): Promise<void> => {
  await axios.delete(`${BASE_URL}/Favorite/${favoriteId}`, authHeader());
};

export const findFavoriteId = (
  list: FavoriteItem[],
  target: { type: FavoriteType; id: number }
): number | null => {
  const match = list.find(f => f.type === target.type && f.productId === target.id);
  return match ? match.favoriteId : null;
};
