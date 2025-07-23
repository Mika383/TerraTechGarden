
export interface Blog {
  blogId: number;
  blogCategoryId: number;
  title: string;
  content: string;
  urlImage: string; 
  bodyHTML: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  image?: string; // Dự phòng ảnh bìa
}
export interface BlogCategory {
  blogCategoryId: number;
  categoryName: string;
  description: string;
  blogs: any[]; 
}
