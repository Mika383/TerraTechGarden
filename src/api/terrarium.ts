import axios from 'axios';
import {
  Environment,
  TankMethod,
  Terrarium,
  TerrariumImage,
  TerrariumVariant,
} from '@/types/terrarium';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getAllTerrariums = async (
  pageNumber = 1,
  pageSize = 9,
  isPagingEnabled = true,
  includeProperties = 'TerrariumImages' // ✅ Chỉ include TerrariumImages trước
): Promise<Terrarium[]> => {
  const params: any = {
    'Pagination.PageNumber': pageNumber,
    'Pagination.PageSize': pageSize,
    'Pagination.IsPagingEnabled': isPagingEnabled,
  };

  // ✅ Thêm IncludeProperties nếu có
  if (includeProperties) {
    params['IncludeProperties'] = includeProperties;
  }

  const res = await axios.get(`${BASE_URL}/Terrarium/get-all`, {
    params,
  });

  return res.data?.data?.results || [];
};

export const getTerrariumById = async (
  id: number
): Promise<Terrarium | null> => {
  const res = await axios.get(`${BASE_URL}/Terrarium/get-${id}`);
  return res.data?.data || null;
};

export const getTerrariumImagesByTerrariumId = async (
  terrariumId: number
): Promise<TerrariumImage[]> => {
  const res = await axios.get(
    `${BASE_URL}/TerrariumImage/terrariumId/${terrariumId}`
  );
  return res.data?.data || [];
};

export const getAllTerrariumImages = async (): Promise<TerrariumImage[]> => {
  const res = await axios.get(`${BASE_URL}/TerrariumImage/get-all`);
  return res.data?.data || [];
};

export const getTerrariumImageById = async (
  imageId: number
): Promise<TerrariumImage | null> => {
  const res = await axios.get(`${BASE_URL}/TerrariumImage/get-${imageId}`);
  return res.data?.data || null;
};

export const getAllVariants = async (): Promise<TerrariumVariant[]> => {
  const res = await axios.get(
    `${BASE_URL}/TerrariumVariant/get-all-terrariumVariant`
  );
  return res.data?.data || [];
};

export const getVariantById = async (
  variantId: number
): Promise<TerrariumVariant | null> => {
  const res = await axios.get(
    `${BASE_URL}/TerrariumVariant/get-terrariumVariant-${variantId}`
  );
  return res.data?.data || null;
};

export const getVariantsByTerrariumId = async (
  terrariumId: number
): Promise<TerrariumVariant[]> => {
  const res = await axios.get(
    `${BASE_URL}/TerrariumVariant/get-VariantByTerrarium-${terrariumId}`
  );
  return res.data?.data || [];
};

// ✅ Thêm API để lấy Environment
export const getEnvironmentById = async (
  environmentId: number
): Promise<any> => {
  const res = await axios.get(`${BASE_URL}/Environment/${environmentId}`);
  return res.data?.data || null;
};


export const getFeaturedTerrariums = async (
  pageNumber = 1,
  pageSize = 6,
  isPagingEnabled = true,
  includeProperties = 'TerrariumImages' // ✅ Chỉ include TerrariumImages trước
): Promise<Terrarium[]> => {
  const params: any = {
    'Pagination.PageNumber': pageNumber,
    'Pagination.PageSize': pageSize,
    'Pagination.IsPagingEnabled': isPagingEnabled,
  };

  // ✅ Thêm IncludeProperties nếu có
  if (includeProperties) {
    params['IncludeProperties'] = includeProperties;
  }

  const res = await axios.get(`${BASE_URL}/Terrarium/get-all`, {
    params,
  });

  return res.data?.data?.results || [];
};

export const getAllEnvironments = async (): Promise<Environment[]> => {
  const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/Environment`);
  return response.data?.data || [];
};

export const getAllTankMethods = async (): Promise<TankMethod[]> => {
  const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/TankMethod`);
  return response.data?.data || [];
};

export const getTerrariumVariantById = async (
  variantId: number
): Promise<TerrariumVariant | null> => {
  const res = await axios.get(
    `${BASE_URL}/TerrariumVariant/get-terrariumVariant-${variantId}`
  );
  return res.data?.data || null;
};
