import axiosInstance from './axios';
import { Terrarium } from './types/terrarium';

export const getAllTerrariums = async (): Promise<Terrarium[]> => {
  try {
    const response = await axiosInstance.get('/api/Terrarium/get-all');
    return response.data.data || [];
  } catch (error) {
    console.error('Lỗi khi fetch Terrarium:', error);
    return [];
  }
};
export const getTerrariumById = async (id: number): Promise<Terrarium | null> => {
  try {
    const response = await axiosInstance.get(`/api/Terrarium/get-${id}`);
    return response.data.data || null;
  } catch (error) {
    console.error('Lỗi khi fetch chi tiết Terrarium:', error);
    return null;
  }
};
