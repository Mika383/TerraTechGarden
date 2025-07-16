import axiosInstance from './axios';

export const getAllTerrariumVariants = async () => {
  try {
    const response = await axiosInstance.get('/api/TerrariumVariant/get-all-terrariumVariant');
    return response.data.data || [];
  } catch (error) {
    console.error('Lỗi lấy danh sách variants:', error);
    return [];
  }
};

export const getTerrariumVariantById = async (variantId: number) => {
  try {
    const response = await axiosInstance.get(`/api/TerrariumVariant/get-terrariumVariant-${variantId}`);
    return response.data.data || null;
  } catch (error) {
    console.error('Lỗi lấy chi tiết variant:', error);
    return null;
  }
};
