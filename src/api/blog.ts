// src/api/blog.ts
import axios from 'axios';
import {
  Blog,
  BlogCategory,
  CreateBlogPayload,
  UpdateBlogPayload,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@/types/blog';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authHeader = () => {
  const token = localStorage.getItem('authToken');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

/* =====================================================
   BLOGS
   ===================================================== */

/** GET ALL BLOGS */
export const getAllBlogs = async (): Promise<Blog[]> => {
  const res = await axios.get<{ status: number; message: string; data: Blog[] }>(
    `${BASE_URL}/Blog/get-all`,
    authHeader()
  );
  return res.data.data;
};

/** GET BLOG BY ID */
export const getBlogById = async (id: number): Promise<Blog> => {
  const res = await axios.get<{ status: number; message: string; data: Blog }>(
    `${BASE_URL}/Blog/get/${id}`,
    authHeader()
  );
  return res.data.data;
};

/** ✅ NEW: GET BLOGS BY CATEGORY ID */
export const getBlogsByCategoryId = async (categoryId: number): Promise<Blog[]> => {
  const res = await axios.get<{ status: number; message: string; data: Blog[] }>(
    `${BASE_URL}/Blog/get-by-categoryId/${categoryId}`,
    authHeader()
  );
  return res.data.data;
};

/** CREATE BLOG (multipart/form-data) */
export const createBlog = async (payload: CreateBlogPayload): Promise<Blog> => {
  const formData = new FormData();
  formData.append('BlogCategoryId', String(payload.blogCategoryId));
  formData.append('Title', payload.title);
  formData.append('Content', payload.content);
  formData.append('bodyHTML', payload.bodyHTML);
  formData.append('IsFeatured', String(payload.isFeatured ?? false));
  formData.append('Status', payload.status ?? 'Active');

  // Nếu có URL ảnh bìa (Cloudinary)
  if (payload.urlImage) {
    // backend .NET của bạn đang nhận 'UrlImage' (U hoa)
    formData.append('UrlImage', payload.urlImage);
  }

  if (payload.createdAt) formData.append('CreatedAt', payload.createdAt);
  if (payload.updatedAt) formData.append('UpdatedAt', payload.updatedAt);
  if (payload.imageFile) formData.append('ImageFile', payload.imageFile);

  const res = await axios.post<{ status: number; message: string; data: Blog }>(
    `${BASE_URL}/Blog/add-blog`,
    formData,
    authHeader()
  );
  return res.data.data;
};

/** UPDATE BLOG (multipart/form-data) */
export const updateBlog = async (id: number, payload: UpdateBlogPayload): Promise<Blog> => {
  const formData = new FormData();
  if (payload.blogCategoryId !== undefined) formData.append('BlogCategoryId', String(payload.blogCategoryId));
  if (payload.title !== undefined) formData.append('Title', payload.title);
  if (payload.content !== undefined) formData.append('Content', payload.content);
  if (payload.bodyHTML !== undefined) formData.append('bodyHTML', payload.bodyHTML);
  if (payload.isFeatured !== undefined) formData.append('IsFeatured', String(payload.isFeatured));
  if (payload.status !== undefined) formData.append('Status', payload.status);
  if (payload.updatedAt) formData.append('UpdatedAt', payload.updatedAt);
  if (payload.imageFile) formData.append('ImageFile', payload.imageFile);

  // Nếu muốn cập nhật URL ảnh
  if (payload.urlImage !== undefined) {
    formData.append('UrlImage', payload.urlImage || '');
  }

  const res = await axios.put<{ status: number; message: string; data: Blog }>(
    `${BASE_URL}/Blog/update-blog/${id}`,
    formData,
    authHeader()
  );
  return res.data.data;
};

/** DELETE BLOG */
export const deleteBlog = async (id: number): Promise<void> => {
  await axios.delete(`${BASE_URL}/Blog/delete-blog/${id}`, authHeader());
};

/* =====================================================
   CATEGORIES
   ===================================================== */

/** GET ALL CATEGORIES */
export const getAllCategories = async (): Promise<BlogCategory[]> => {
  const res = await axios.get<{ status: number; message: string; data: BlogCategory[] }>(
    `${BASE_URL}/BlogCategory/get-all`,
    authHeader()
  );
  return res.data.data;
};

/** (Optional) GET CATEGORY BY ID */
export const getCategoryById = async (id: number): Promise<BlogCategory> => {
  const res = await axios.get<{ status: number; message: string; data: BlogCategory }>(
    `${BASE_URL}/BlogCategory/get/${id}`,
    authHeader()
  );
  return res.data.data;
};

/** CREATE CATEGORY */
export const createCategory = async (payload: CreateCategoryRequest): Promise<BlogCategory> => {
  const res = await axios.post<{ status: number; message: string; data: BlogCategory }>(
    `${BASE_URL}/BlogCategory/add-blogCategory`,
    payload,
    authHeader()
  );
  return res.data.data;
};

/** UPDATE CATEGORY */
export const updateCategory = async (id: number, payload: UpdateCategoryRequest): Promise<BlogCategory> => {
  const res = await axios.put<{ status: number; message: string; data: BlogCategory }>(
    `${BASE_URL}/BlogCategory/update-blogCategory/${id}`,
    payload,
    authHeader()
  );
  return res.data.data;
};

/** DELETE CATEGORY */
export const deleteCategory = async (id: number): Promise<void> => {
  await axios.delete(`${BASE_URL}/BlogCategory/delete-blogCategory/${id}`, authHeader());
};
