import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import { getBlogById, getAllCategories } from '@/api/blog';
import type { Blog, BlogCategory } from '@/types/blog';

const FALLBACK_IMG = '/TerrTechLogo.png';

const BlogDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [blog, setBlog] = useState<Blog | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [b, c] = await Promise.all([getBlogById(Number(id)), getAllCategories()]);
        setBlog({
          ...b,
          urlImage: b.urlImage && b.urlImage.trim() !== '' ? b.urlImage : FALLBACK_IMG,
          bodyHTML: (b as any).bodyHTML ?? (b as any).bodyHtml ?? '',
        });
        setCategories(c || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const categoryNameById = useMemo(() => {
    const map = new Map<number, string>();
    categories.forEach((c) => map.set(c.blogCategoryId, c.categoryName));
    return map;
  }, [categories]);

  if (loading) {
    return (
      <div className="container mx-auto py-16 flex justify-center">
        <Spin />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Không tìm thấy bài viết</h2>
        <button
          className="mt-2 bg-emerald-500 text-white px-4 py-2 rounded hover:bg-emerald-600"
          onClick={() => navigate('/blog')}
        >
          Quay lại Blog
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-emerald-50">
      <div className="flex-1 container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <button
          className="mb-6 bg-white border border-emerald-200 text-emerald-700 px-4 py-2 rounded hover:bg-emerald-50"
          onClick={() => navigate('/blog')}
        >
          ← Quay lại
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10">
          <img
            src={blog.urlImage || FALLBACK_IMG}
            alt={blog.title}
            className="w-full h-64 md:h-96 object-cover rounded-lg mb-6"
            onError={(e) => ((e.currentTarget.src = FALLBACK_IMG))}
          />

          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-medium text-white bg-emerald-500">
              {categoryNameById.get(blog.blogCategoryId) || 'Danh mục'}
            </span>
            <span className="text-gray-500 text-sm">
              {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('vi-VN') : ''}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">{blog.title}</h1>

          {blog.bodyHTML ? (
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: blog.bodyHTML }} />
          ) : (
            <p className="text-gray-700 leading-relaxed">{blog.content}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogDetails;
