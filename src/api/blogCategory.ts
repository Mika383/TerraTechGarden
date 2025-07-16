import axios from './axios';
import { BlogCategory } from './types/blogCategory';

export const getAllCategories = async (): Promise<BlogCategory[]> => {
  const res = await axios.get('/api/BlogCategory/get-all');
  return res.data?.data || [];
};

export const getCategoryById = async (id: number): Promise<BlogCategory> => {
  const res = await axios.get(`/api/BlogCategory/get-${id}`);
  return res.data?.data;
};

export const createCategory = async (payload: { categoryName: string; description: string }) => {
  return axios.post('/api/BlogCategory/add-blogCategory', payload);
};

export const updateCategory = async (id: number, payload: { blogCategoryId: number; categoryName: string; description: string }) => {
  return axios.put(`/api/BlogCategory/update-blogCategory-${id}`, payload);
};

export const deleteCategory = async (id: number) => {
  return axios.delete(`/api/BlogCategory/delete-blogCategory-${id}`);
};
