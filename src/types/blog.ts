// src/types/blog.ts

/** Trạng thái bài viết theo API mới */
export type BlogStatus = 'Active' | 'Inactive';

/** Model Blog theo /api/Blog/get-all, /api/Blog/get/{id} */
export interface Blog {
  blogId: number;
  userId: number;
  blogCategoryId: number;

  urlImage: string | null;
  title: string;
  bodyHTML: string;        // API dùng đúng key 'bodyHTML'
  isFeatured: boolean;     // mặc định false khi tạo mới (server)
  content: string;

  createdAt: string | null; // ISO hoặc null
  updatedAt: string | null; // ISO hoặc null
  status: BlogStatus;       // 'Active' | 'Inactive'
}

/** Danh mục blog */
export interface BlogCategory {
  blogCategoryId: number;
  categoryName: string;
  description: string;
}

/* ================== BLOG PAYLOADS (FE) ================== */
/** Dữ liệu FE trước khi build FormData để CREATE */
export interface CreateBlogPayload {
  blogCategoryId: number;
  title: string;
  content: string;
  bodyHTML: string;

  // optional
  urlImage?: string | null;     // URL ảnh bìa (Cloudinary)
  isFeatured?: boolean;         // nếu không truyền, server = false
  status?: BlogStatus;          // ví dụ 'Active'
  createdAt?: string | null;    // có thể để server set
  updatedAt?: string | null;    // có thể để server set
  imageFile?: File | null;      // nếu gửi file trực tiếp (không bắt buộc)
}

/** Dữ liệu FE trước khi build FormData để UPDATE */
export interface UpdateBlogPayload {
  blogCategoryId?: number;
  title?: string;
  content?: string;
  bodyHTML?: string;

  urlImage?: string | null;     // URL ảnh bìa đã upload sẵn
  isFeatured?: boolean;
  status?: BlogStatus;
  updatedAt?: string | null;
  imageFile?: File | null;
}

/* ================== CATEGORY PAYLOADS ================== */
export interface CreateCategoryRequest {
  categoryName: string;
  description?: string;
}

export interface UpdateCategoryRequest {
  blogCategoryId?: number;  // ✅ cần cho PUT /BlogCategory/update-blogCategory/{id}
  categoryName?: string;
  description?: string;
}

/* Ghi chú mapping khi build FormData (ở API layer):
  Các key thường gặp backend .NET:
  - BlogCategoryId, Title, Content, CreatedAt, UpdatedAt,
  - bodyHTML, IsFeatured, Status, ImageFile,
  - (nếu backend chấp nhận URL ảnh) -> 'UrlImage' hoặc 'urlImage'
  => Ở layer API, nếu có urlImage, hãy formData.append('UrlImage', urlImage)
*/
