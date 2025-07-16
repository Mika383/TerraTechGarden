import axios from './axios';
import { Blog } from './types/Blog';

export const getAllBlogs = async (): Promise<Blog[]> => {
  const res = await axios.get('/api/Blog/get-all');
  return res.data.data || [];
};

export const getBlogById = async (id: number): Promise<Blog> => {
  const res = await axios.get(`/api/Blog/get-${id}`);
  return res.data.data;
};

export const createBlog = async (payload: Omit<Blog, 'blogId'>) => {
  return axios.post('/api/Blog/add-blog', payload);
};

export const updateBlog = async (id: number, payload: Blog) => {
  return axios.put(`/api/Blog/update-blog-${id}`, payload);
};

export const deleteBlog = async (id: number) => {
  return axios.delete(`/api/Blog/delete-blog-${id}`);
};
