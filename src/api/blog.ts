import axios from '@/lib/axios/axiosInstance';
import { Blog, BlogCategory } from '../types/blog';

export const getAllBlogs = async (): Promise<Blog[]> => {
  const res = await axios.get('/Blog/get-all');
  return res.data.data || [];
};

export const getBlogById = async (id: number): Promise<Blog> => {
  const res = await axios.get(`/Blog/get-${id}`);
  return res.data.data;
};

export const createBlog = async (payload: Omit<Blog, 'blogId'>) => {
  return axios.post('/Blog/add-blog', payload);
};

export const updateBlog = async (id: number, payload: Blog) => {
  return axios.put(`/Blog/update-blog-${id}`, payload);
};

export const deleteBlog = async (id: number) => {
  return axios.delete(`/Blog/delete-blog-${id}`);
};

export const getAllCategories = async (): Promise<BlogCategory[]> => {
  const res = await axios.get('/BlogCategory/get-all');
  return res.data?.data || [];
};

export const getCategoryById = async (id: number): Promise<BlogCategory> => {
  const res = await axios.get(`/BlogCategory/get-${id}`);
  return res.data?.data;
};

export const createCategory = async (payload: { categoryName: string; description: string }) => {
  return axios.post('/BlogCategory/add-blogCategory', payload);
};

export const updateCategory = async (id: number, payload: { blogCategoryId: number; categoryName: string; description: string }) => {
  return axios.put(`/BlogCategory/update-blogCategory-${id}`, payload);
};

export const deleteCategory = async (id: number) => {
  return axios.delete(`/BlogCategory/delete-blogCategory-${id}`);
};