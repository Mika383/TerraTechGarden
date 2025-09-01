// src/api/terrarium.ts
import axios from 'axios';
import {
  Environment,
  TankMethod,
  Shape,
  Terrarium,
  TerrariumImage,
  TerrariumVariant,
  // === Types bổ sung cho AI & Layout ===
  AutoGenerateRequest,
  GeneratedTerrarium,
  AddTerrariumByAIRequest,
  CreatedTerrarium,
  CreateLayoutRequest,
  CreatedLayout,
} from '@/types/terrarium';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helpers chuẩn hoá dữ liệu từ BE
const pickArray = <T,>(res: any): T[] => res?.data?.data ?? [];
const pickObject = <T,>(res: any): T | null => (res?.data?.data ?? null);
// Cho các API có thể trả {status, data} hoặc trả thẳng object
const pickData = <T = any>(res: any): T => (res?.data?.data ?? res?.data ?? res) as T;

const authHeader = () => {
  const token = localStorage.getItem('authToken');
  return { headers: { Authorization: `Bearer ${token || ''}` } };
};

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
  const res = await axios.get(`${BASE_URL}/Environment/get/${environmentId}`);
  return res?.data?.data ?? null;
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

/** ========== BỔ SUNG CHO HIỂN THỊ THEO TÊN (KHÔNG CHỈ ID) ========== */
/** Shape */
export const getShapeById = async (shapeId: number): Promise<Shape | null> => {
  const res = await axios.get(`${BASE_URL}/Shape/get/${shapeId}`);
  return pickObject<Shape>(res);
};

export const getAllShapes = async (): Promise<Shape[]> => {
  const res = await axios.get(`${BASE_URL}/Shape/get-all`);
  return pickArray<Shape>(res);
};

/** TankMethod (lấy 1 item theo id) */
export const getTankMethodById = async (tankMethodId: number): Promise<TankMethod | null> => {
  const res = await axios.get(`${BASE_URL}/TankMethod/get/${tankMethodId}`);
  return pickObject<TankMethod>(res);
};

/**
 * Convenience API: lấy 1 Terrarium và "enrich" bằng tên
 * - environment: Environment
 * - shape: Shape
 * - tankMethod: TankMethod
 * Ghi chú: KHÔNG thay đổi getTerrariumById — đây là hàm mới.
 */
export const getTerrariumEnrichedById = async (id: number): Promise<Terrarium | null> => {
  const base = await getTerrariumById(id);
  if (!base) return null;

  const [env, shape, tank] = await Promise.all([
    getEnvironmentById(base.environmentId),
    getShapeById(base.shapeId),
    getTankMethodById(base.tankMethodId),
  ]);

  return {
    ...base,
    environment: env ?? undefined,
    shape: shape ?? undefined,
    tankMethod: tank ?? undefined,
  };
};

/** ========== AI & LAYOUT (BỔ SUNG THEO YÊU CẦU) ========== */

/** Gọi AI sinh mẫu Terrarium */
export const autoGenerateTerrarium = async (
  payload: AutoGenerateRequest
): Promise<GeneratedTerrarium> => {
  const res = await axios.post(`${BASE_URL}/AI/auto-generate`, payload, authHeader());
  return pickData<GeneratedTerrarium>(res);
};

/** Tạo Terrarium bằng AI — THEO SCHEMA BẠN ĐƯA (không gửi accessoryNames) */
export const addTerrariumByAI = async (
  payload: AddTerrariumByAIRequest
): Promise<CreatedTerrarium> => {
  const res = await axios.post(`${BASE_URL}/Terrarium/add-terrariumbyai`, payload, authHeader());
  const data = pickData<any>(res);

  // Chuẩn hoá các biến thể response khác nhau
  if (data?.terrariumId) return { terrariumId: Number(data.terrariumId), terrariumName: data?.terrariumName };
  if (data?.data?.terrariumId) return { terrariumId: Number(data.data.terrariumId), terrariumName: data.data?.terrariumName };
  if (typeof data === 'object' && 'id' in data) return { terrariumId: Number((data as any).id) };

  throw new Error('Không lấy được terrariumId từ phản hồi BE.');
};

/** Tạo Layout từ Terrarium đã tạo */
export const createTerrariumLayout = async (
  payload: CreateLayoutRequest
): Promise<CreatedLayout> => {
  const res = await axios.post(`${BASE_URL}/TerrariumLayout/create`, payload, authHeader());
  const data = pickData<any>(res);

  if (data?.layoutId) return { layoutId: Number(data.layoutId) };
  if (data?.data?.layoutId) return { layoutId: Number(data.data.layoutId) };

  throw new Error('Không lấy được layoutId từ phản hồi BE.');
};

/** Helper phát hiện lỗi auth để FE điều hướng login */
export const isAuthError = (e: unknown) =>
  !!(axios.isAxiosError(e) && (e.response?.status === 401 || e.response?.status === 403));
