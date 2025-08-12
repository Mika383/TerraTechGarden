import axios from 'axios';
import { Accessory, AccessoryCategory, AccessoryImage} from '@/types/accessory';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getAllAccessories = async (
  pageNumber = 1,
  pageSize = 9,
  isPagingEnabled = true
): Promise<Accessory[]> => {
  const res = await axios.get(`${BASE_URL}/Accessory/get-all`, {
    params: {
      'Pagination.PageNumber': pageNumber,
      'Pagination.PageSize': pageSize,
      'Pagination.IsPagingEnabled': isPagingEnabled,
    },
  });

  return res.data?.data?.results || [];
};

export const getAccessoryById = async (
  id: number
): Promise<Accessory | null> => {
  const res = await axios.get(`${BASE_URL}/Accessory/get/${id}`);
  return res.data?.data || null;
};

export const getAllAccessoryImages = async (): Promise<AccessoryImage[]> => {
  const res = await axios.get(`${BASE_URL}/AccessoryImage/get-all`);
  return res.data?.data || [];
};

export const getAccessoryImageById = async (
  imageId: number
): Promise<AccessoryImage | null> => {
  const res = await axios.get(`${BASE_URL}/AccessoryImage/get-by/${imageId}`);
  return res.data?.data || null;
};

export const getAccessoryImagesByAccessoryId = async (
  accessoryId: number
): Promise<AccessoryImage[]> => {
  const res = await axios.get(
    `${BASE_URL}/AccessoryImage/get-accessoryId/${accessoryId}`
  );
  return res.data?.data || [];
};

export const getAllAccessoryCategories = async (): Promise<AccessoryCategory[]> => {
  const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/Category/get-all`);
  return response.data?.data || [];
}