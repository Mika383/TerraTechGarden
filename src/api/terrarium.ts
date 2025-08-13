// src/api/terrarium.ts
import axios from 'axios';
import {
  Environment,
  TankMethod,
  Terrarium,
  TerrariumImage,
  TerrariumVariant,
} from '@/types/terrarium';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helpers chuẩn hoá dữ liệu từ BE
const pickArray = <T,>(res: any): T[] => res?.data?.data ?? [];
const pickObject = <T,>(res: any): T | null => (res?.data?.data ?? null);

/** ========== CÁC API CŨ (GIỮ NGUYÊN) ========== */

export const getAllTerrariums = async (
  pageNumber = 1,
  pageSize = 9,
  isPagingEnabled = true,
  includeProperties = 'TerrariumImages'
): Promise<Terrarium[]> => {
  const params: any = {
    'Pagination.PageNumber': pageNumber,
    'Pagination.PageSize': pageSize,
    'Pagination.IsPagingEnabled': isPagingEnabled,
  };
  if (includeProperties) params['IncludeProperties'] = includeProperties;

  const res = await axios.get(`${BASE_URL}/Terrarium/get-all`, { params });
  // API này trả { data: { results: [...] } }
  return res?.data?.data?.results ?? [];
};

export const getTerrariumById = async (id: number): Promise<Terrarium | null> => {
  const res = await axios.get(`${BASE_URL}/Terrarium/get/${id}`);
  return pickObject<Terrarium>(res);
};

export const getTerrariumImagesByTerrariumId = async (terrariumId: number): Promise<TerrariumImage[]> => {
  const res = await axios.get(`${BASE_URL}/TerrariumImage/get-by-terrariumId/${terrariumId}`);
  return pickArray<TerrariumImage>(res);
};

export const getAllTerrariumImages = async (): Promise<TerrariumImage[]> => {
  const res = await axios.get(`${BASE_URL}/TerrariumImage/get-all`);
  return pickArray<TerrariumImage>(res);
};

export const getTerrariumImageById = async (imageId: number): Promise<TerrariumImage | null> => {
  const res = await axios.get(`${BASE_URL}/TerrariumImage/get/${imageId}`);
  return pickObject<TerrariumImage>(res);
};

export const getAllVariants = async (): Promise<TerrariumVariant[]> => {
  const res = await axios.get(`${BASE_URL}/TerrariumVariant/get-all-terrariumVariant`);
  return pickArray<TerrariumVariant>(res);
};

export const getVariantById = async (variantId: number): Promise<TerrariumVariant | null> => {
  const res = await axios.get(`${BASE_URL}/TerrariumVariant/get-terrariumVariant/${variantId}`);
  return pickObject<TerrariumVariant>(res);
};

export const getVariantsByTerrariumId = async (terrariumId: number): Promise<TerrariumVariant[]> => {
  const res = await axios.get(`${BASE_URL}/TerrariumVariant/get-VariantByTerrarium/${terrariumId}`);
  return pickArray<TerrariumVariant>(res);
};

export const getEnvironmentById = async (environmentId: number): Promise<Environment | null> => {
  const res = await axios.get(`${BASE_URL}/Environment/${environmentId}`);
  return pickObject<Environment>(res);
};

export const getAllEnvironments = async (): Promise<Environment[]> => {
  const res = await axios.get(`${BASE_URL}/Environment/get-all`);
  return pickArray<Environment>(res);
};

export const getAllTankMethods = async (): Promise<TankMethod[]> => {
  const res = await axios.get(`${BASE_URL}/TankMethod/get-all`);
  return pickArray<TankMethod>(res);
};

export const getTerrariumVariantById = async (variantId: number): Promise<TerrariumVariant | null> => {
  const res = await axios.get(`${BASE_URL}/TerrariumVariant/get-terrariumVariant/${variantId}`);
  return pickObject<TerrariumVariant>(res);
};

/** ========== CÁC API MỚI (CHO HOME SECTIONS) ========== */
/**
 * LƯU Ý:
 * Các endpoint mới trả về dạng:
 * { status, message, data: [...] }
 * -> dùng pickArray để lấy đúng mảng trong data.
 */

export const getFeaturedTerrariums = async (top = 3): Promise<Partial<Terrarium>[]> => {
  const res = await axios.get(`${BASE_URL}/Terrarium/featured`, { params: { top } });
  return pickArray<Partial<Terrarium>>(res);
};

export const getBestSellers = async (days = 7, top = 3): Promise<Partial<Terrarium>[]> => {
  const res = await axios.get(`${BASE_URL}/Terrarium/best-sellers`, { params: { days, top } });
  return pickArray<Partial<Terrarium>>(res);
};

export const getTopRatedTerrariums = async (top = 3): Promise<Partial<Terrarium>[]> => {
  const res = await axios.get(`${BASE_URL}/Terrarium/top-rated`, { params: { top } });
  return pickArray<Partial<Terrarium>>(res);
};

export const getNewestTerrariums = async (top = 12): Promise<Partial<Terrarium>[]> => {
  const res = await axios.get(`${BASE_URL}/Terrarium/newest`, { params: { top } });
  return pickArray<Partial<Terrarium>>(res);
};
