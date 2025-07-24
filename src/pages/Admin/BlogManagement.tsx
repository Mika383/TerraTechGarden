import React, { useEffect, useState } from 'react';
import { getAllBlogs, createBlog, updateBlog, deleteBlog, getAllCategories } from '@/api';
import { Blog, BlogCategory } from '@/types';
import { Table, Button, Space, Modal, Input, Select, Popconfirm, Pagination, Upload, Radio, Switch } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { Editor } from '@tinymce/tinymce-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const PAGE_SIZE = 5;
const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/dsp6pjeey/upload';
const CLOUDINARY_UPLOAD_PRESET = 'TerraTech';

const BlogManagement: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [formState, setFormState] = useState({
    blogCategoryId: 0,
    title: '',
    content: '',
    urlImage: '',
    bodyHTML: '',
    status: 'Active',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [imageInputType, setImageInputType] = useState<'upload' | 'url'>('upload');

  const fetchBlogs = async () => {
  setLoading(true);
  try {
    const data = await getAllBlogs();
    // Map để đổi bodyHtml thành bodyHTML
    const mappedData = data.map((blog: any) => ({
      ...blog,
      bodyHTML: blog.bodyHtml,   // map đúng với type
    }));
    setBlogs(mappedData);
  } catch {
    toast.error('Lỗi khi tải danh sách blog');
  } finally {
    setLoading(false);
  }
};



  const fetchCategories = async () => {
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch {
      toast.error('Lỗi khi tải danh mục blog');
    }
  };

  useEffect(() => {
    fetchBlogs();
    fetchCategories();
  }, []);

  const openModal = (blog: Blog | null = null) => {
  setEditingBlog(blog);
  setFormState(blog ? {
    blogCategoryId: blog.blogCategoryId,
    title: blog.title,
    content: blog.content,
    urlImage: blog.urlImage || '',
    bodyHTML: (blog as any).bodyHtml || blog.bodyHTML || '', // fallback nếu là bodyHtml
    status: blog.status,
  } : {
    blogCategoryId: 0,
    title: '',
    content: '',
    urlImage: '',
    bodyHTML: '',
    status: 'Active',
  });
  setImageInputType('upload');
  setIsModalVisible(true);
};



  const handleUpload = async (file: any) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await axios.post(CLOUDINARY_UPLOAD_URL, formData);
      const imageUrl = res.data.secure_url;
      setFormState(prev => ({ ...prev, urlImage: imageUrl }));
      toast.success('Tải ảnh bìa lên thành công!');
    } catch {
      toast.error('Tải ảnh bìa lên thất bại');
    }
    return false;
  };

  const handleSubmit = async () => {
    console.log('Submitting blog data:', formState);
    try {
      if (editingBlog) {
        await updateBlog(editingBlog.blogId, {
          ...editingBlog,
          ...formState,
          updatedAt: new Date().toISOString(),
        });
        toast.success('Cập nhật blog thành công');
      } else {
        await createBlog({
          ...formState,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        toast.success('Tạo blog thành công');
      }
      fetchBlogs();
    } catch {
      toast.error('Đã xảy ra lỗi khi lưu blog');
    } finally {
      setIsModalVisible(false);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteBlog(id);
    toast.success('Xóa blog thành công');
    fetchBlogs();
  };

  const toggleStatus = async (blog: Blog) => {
    await updateBlog(blog.blogId, {
      ...blog,
      status: blog.status === 'Active' ? 'Inactive' : 'Active',
      updatedAt: new Date().toISOString(),
    });
    toast.success('Đã cập nhật trạng thái');
    fetchBlogs();
  };

  const columns = [
    { title: 'ID', dataIndex: 'blogId', key: 'blogId' },
    {
      title: 'Ảnh bìa',
      dataIndex: 'urlImage',
      key: 'urlImage',
      render: (url: string) => url ? <img src={url} alt="Ảnh bìa" className="h-16" /> : 'Không có',
    },
    { title: 'Tiêu đề', dataIndex: 'title', key: 'title' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status' },
    {
      title: 'Chuyển trạng thái',
      render: (_: any, record: Blog) => (
        <Switch
          checked={record.status === 'Active'}
          onChange={() => toggleStatus(record)}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
        />
      ),
    },
    {
      title: 'Thao tác',
      render: (_: any, record: Blog) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openModal(record)} />
          <Popconfirm title="Xác nhận xoá?" onConfirm={() => handleDelete(record.blogId)}>
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Quản lý Bài viết</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Thêm Bài Viết</Button>
      </div>

      <Table
        rowKey="blogId"
        dataSource={blogs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)}
        columns={columns}
        loading={loading}
        pagination={false}
      />

      <Pagination
        current={currentPage}
        pageSize={PAGE_SIZE}
        total={blogs.length}
        onChange={page => setCurrentPage(page)}
        className="mt-4 text-right"
      />

      <Modal
        title={editingBlog ? 'Chỉnh sửa Bài viết' : 'Tạo Bài viết mới'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        width={800}
      >
        <Select
          value={formState.blogCategoryId}
          onChange={value => setFormState({ ...formState, blogCategoryId: value })}
          className="w-full mb-2"
          placeholder="Chọn danh mục"
        >
          {categories.map(cat => (
            <Select.Option key={cat.blogCategoryId} value={cat.blogCategoryId}>{cat.categoryName}</Select.Option>
          ))}
        </Select>

        <Input
          placeholder="Tiêu đề"
          value={formState.title}
          onChange={e => setFormState({ ...formState, title: e.target.value })}
          className="mb-2"
        />

        <Input
          placeholder="Content"
          value={formState.content}
          onChange={e => setFormState({ ...formState, content: e.target.value })}
          className="mb-2"
        />

        <Radio.Group
          onChange={(e) => setImageInputType(e.target.value)}
          value={imageInputType}
          className="mb-2"
        >
          <Radio value="upload">Upload ảnh</Radio>
          <Radio value="url">Dán URL ảnh</Radio>
        </Radio.Group>

        {imageInputType === 'upload' ? (
          <Upload beforeUpload={handleUpload} showUploadList={false}>
            <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
          </Upload>
        ) : (
          <Input
            placeholder="URL Ảnh bìa"
            value={formState.urlImage}
            onChange={e => setFormState({ ...formState, urlImage: e.target.value })}
            className="mb-2"
          />
        )}

        {formState.urlImage && (
          <img src={formState.urlImage} alt="Preview" className="mb-2 max-h-48 object-contain" />
        )}

        <Editor
            apiKey="lfiqogz55f5k6y6cuza7ih9b59tc7t8h62v0z9lp8661yu2w"
            value={formState.bodyHTML}
            init={{
                height: 500, // kích thước khung mặc định
                resize: true, // cho phép resize khung editor
                images_upload_handler: async (
                    blobInfo: any,
                    success: (url: string) => void,
                    failure: (err: string) => void
                    ) => {
                    const formData = new FormData();
                    formData.append('file', blobInfo.blob());
                    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

                    try {
                        const res = await axios.post(CLOUDINARY_UPLOAD_URL, formData);
                            if (res.data.secure_url) {
                            success(res.data.secure_url);
                            toast.success('Ảnh đã được upload lên Cloudinary');
                            } else {
                            failure('Không lấy được URL từ Cloudinary');
                            }
                    } catch {
                        toast.error('Upload ảnh thất bại');
                        failure('Upload thất bại');
                    }
                    },
                content_style: 'img { max-width: 400px; height: auto; }' 
            }}
            onEditorChange={(content) => setFormState({ ...formState, bodyHTML: content })}
            />

        <Select
          value={formState.status}
          onChange={value => setFormState({ ...formState, status: value })}
          className="w-full mt-2"
        >
          <Select.Option value="Active">Active</Select.Option>
          <Select.Option value="Inactive">Inactive</Select.Option>
        </Select>
      </Modal>
    </div>
  );
};

export default BlogManagement;