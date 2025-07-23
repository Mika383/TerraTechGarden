import axiosInstance from '@/lib/axios/axiosInstance';
import { Terrarium } from '../types/terrarium';

export const getAllTerrariums = async (): Promise<Terrarium[]> => {
  try {
    const response = await axiosInstance.get('/Terrarium/get-all');
    return response.data.data || [];
  } catch (error) {
    console.error('Lỗi khi fetch Terrarium:', error);
    return [];
  }
};
export const getTerrariumById = async (id: number): Promise<Terrarium | null> => {
  try {
    const response = await axiosInstance.get(`/Terrarium/get-${id}`);
    return response.data.data || null;
  } catch (error) {
    console.error('Lỗi khi fetch chi tiết Terrarium:', error);
    return null;
  }
};

export const getAllTerrariumVariants = async () => {
  try {
    const response = await axiosInstance.get('/TerrariumVariant/get-all-terrariumVariant');
    return response.data.data || [];
  } catch (error) {
    console.error('Lỗi lấy danh sách variants:', error);
    return [];
  }
};

export const getTerrariumVariantById = async (variantId: number) => {
  try {
    const response = await axiosInstance.get(`/TerrariumVariant/get-terrariumVariant-${variantId}`);
    return response.data.data || null;
  } catch (error) {
    console.error('Lỗi lấy chi tiết variant:', error);
    return null;
  }
};

