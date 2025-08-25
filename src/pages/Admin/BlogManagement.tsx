import React, { useEffect, useRef, useState } from 'react';
import {
  Table, Button, Space, Modal, Input, Select, Popconfirm, Pagination,
  Upload, Radio, Switch, Tag, Tooltip, Badge
} from 'antd';
import {
  EditOutlined, DeleteOutlined, PlusOutlined, UploadOutlined,
  EyeOutlined, StarOutlined, StarFilled, LinkOutlined, CopyOutlined, PictureOutlined
} from '@ant-design/icons';

import {
  getAllBlogs, getBlogById, createBlog, updateBlog, deleteBlog, getAllCategories
} from '@/api';
import {
  Blog, BlogCategory, BlogStatus, CreateBlogPayload, UpdateBlogPayload
} from '@/types';

import { toast } from 'react-toastify';
import axios from 'axios';
import { Editor } from '@tinymce/tinymce-react';

const PAGE_SIZE = 5;

// Cloudinary config (bìa & modal chèn ảnh đều dùng)
const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/dsp6pjeey/upload';
const CLOUDINARY_UPLOAD_PRESET = 'TerraTech';

type BlogFormState = {
  blogCategoryId: number;
  title: string;
  content: string;
  urlImage: string;
  bodyHTML: string;
  status: BlogStatus;
  isFeatured: boolean;
};

const BlogManagement: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [imageInputType, setImageInputType] = useState<'upload' | 'url'>('upload');

  // Modal upload ảnh để chèn vào editor
  const [imgModalOpen, setImgModalOpen] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string>('');

  const [formState, setFormState] = useState<BlogFormState>({
    blogCategoryId: 0,
    title: '',
    content: '',
    urlImage: '',
    bodyHTML: '',
    status: 'Active',
    isFeatured: false
  });

  const editorRef = useRef<any>(null);

  /* ========= Data ========= */
  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const data = await getAllBlogs();
      setBlogs((data || []).map((b: any) => ({ ...b, bodyHTML: b.bodyHTML ?? b.bodyHtml ?? '' })) as Blog[]);
    } catch {
      toast.error('Lỗi khi tải danh sách blog');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getAllCategories();
      setCategories(data || []);
    } catch {
      toast.error('Lỗi khi tải danh mục blog');
    }
  };

  useEffect(() => {
    fetchBlogs();
    fetchCategories();
  }, []);

  /* ========= Modal Tạo / Sửa ========= */
  const openModal = async (row: Blog | null = null) => {
    setEditingBlog(row);
    setIsModalVisible(true);

    if (!row) {
      // tạo mới
      setFormState({
        blogCategoryId: 0,
        title: '',
        content: '',
        urlImage: '',
        bodyHTML: '',
        status: 'Active',
        isFeatured: false
      });
      return;
    }

    // sửa: lấy chi tiết để có bodyHTML chuẩn
    try {
      const full = await getBlogById(row.blogId);
      setFormState({
        blogCategoryId: full.blogCategoryId,
        title: full.title,
        content: full.content,
        urlImage: full.urlImage || '',
        bodyHTML: full.bodyHTML ?? '',
        status: full.status as BlogStatus,
        isFeatured: !!full.isFeatured
      });
    } catch {
      toast.error('Không tải được chi tiết bài viết');
    }
  };

  /* ========= Upload ảnh bìa ngoài editor ========= */
  const handleUploadCover = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    try {
      const res = await axios.post(CLOUDINARY_UPLOAD_URL, fd);
      setFormState(prev => ({ ...prev, urlImage: res.data.secure_url }));
      toast.success('Tải ảnh bìa lên thành công!');
    } catch {
      toast.error('Tải ảnh bìa lên thất bại');
    }
    return false;
  };

  /* ========= Submit ========= */
  const handleSubmit = async () => {
    try {
      if (editingBlog) {
        const payload: UpdateBlogPayload = {
          blogCategoryId: formState.blogCategoryId,
          title: formState.title,
          content: formState.content,
          bodyHTML: formState.bodyHTML,
          status: formState.status,
          isFeatured: formState.isFeatured,
          urlImage: formState.urlImage || null,
          updatedAt: new Date().toISOString()
        };
        await updateBlog(editingBlog.blogId, payload);
        toast.success('Cập nhật blog thành công');
      } else {
        const payload: CreateBlogPayload = {
          blogCategoryId: formState.blogCategoryId,
          title: formState.title,
          content: formState.content,
          bodyHTML: formState.bodyHTML,
          status: formState.status,
          isFeatured: formState.isFeatured,
          urlImage: formState.urlImage || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await createBlog(payload);
        toast.success('Tạo blog thành công');
      }
      fetchBlogs();
      setIsModalVisible(false);
    } catch {
      toast.error('Đã xảy ra lỗi khi lưu blog');
    }
  };

  /* ========= Actions ========= */
  const handleDelete = async (id: number) => {
    await deleteBlog(id);
    toast.success('Xóa blog thành công');
    fetchBlogs();
  };

  const toggleStatus = async (blog: Blog) => {
    await updateBlog(blog.blogId, {
      status: (blog.status === 'Active' ? 'Inactive' : 'Active') as BlogStatus,
      updatedAt: new Date().toISOString()
    });
    toast.success('Đã cập nhật trạng thái');
    fetchBlogs();
  };

  const toggleFeatured = async (blog: Blog) => {
    await updateBlog(blog.blogId, {
      isFeatured: !blog.isFeatured,
      updatedAt: new Date().toISOString()
    });
    toast.success(!blog.isFeatured ? 'Đã gắn Nổi bật' : 'Đã bỏ Nổi bật');
    fetchBlogs();
  };

  /* ========= Cloudinary modal (chèn vào TinyMCE) ========= */
  const openImageModal = () => {
    setUploadedUrl('');
    setImgModalOpen(true);
  };

  const customUploadToCloudinary = async (options: any) => {
    const { file, onSuccess, onError } = options;
    setImgUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    try {
      const res = await axios.post(CLOUDINARY_UPLOAD_URL, fd);
      const url = res.data.secure_url as string;
      setUploadedUrl(url);
      onSuccess?.(res.data);
      setImgUploading(false);
      toast.success('Upload thành công, đã có URL!');
    } catch (err) {
      onError?.(err);
      setImgUploading(false);
      toast.error('Upload thất bại');
    }
  };

  const copyUrl = async () => {
    if (!uploadedUrl) return;
    await navigator.clipboard.writeText(uploadedUrl);
    toast.success('Đã copy URL ảnh');
  };

  const insertToEditor = () => {
    if (!uploadedUrl || !editorRef.current) return;
    editorRef.current.insertContent(`<img src="${uploadedUrl}" alt="" />`);
    // đồng bộ state với nội dung mới
    const latest = editorRef.current.getContent();
    setFormState(prev => ({ ...prev, bodyHTML: latest }));
    setImgModalOpen(false);
  };

  /* ========= Columns ========= */
  const columns = [
    {
      title: 'ID',
      dataIndex: 'blogId',
      key: 'blogId',
      width: 64,
      render: (id: number) => <Badge count={id} style={{ backgroundColor: '#52c41a' }} />
    },
    {
      title: 'Ảnh bìa',
      dataIndex: 'urlImage',
      key: 'urlImage',
      width: 120,
      render: (url: string) =>
        url ? (
          <img src={url} alt="Ảnh bìa" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8 }} />
        ) : (
          <div style={{ width: 80, height: 60, background: '#f0f0f0', borderRadius: 8 }} />
        )
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (t: string) => (
        <Tooltip title={t}>
          <div style={{ maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t}</div>
        </Tooltip>
      )
    },
    {
      title: 'Danh mục',
      dataIndex: 'blogCategoryId',
      key: 'category',
      render: (id: number) => {
        const c = categories.find(v => v.blogCategoryId === id);
        return <Tag color="green">{c?.categoryName ?? 'N/A'}</Tag>;
      }
    },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (s: BlogStatus) => <Tag color={s === 'Active' ? 'green' : 'red'}>{s}</Tag> },
    {
      title: 'Nổi bật',
      dataIndex: 'isFeatured',
      key: 'isFeatured',
      render: (v: boolean, record: Blog) => (
        <Tooltip title="Bài viết nổi bật">
          <Button type="text" icon={v ? <StarFilled /> : <StarOutlined />} onClick={() => toggleFeatured(record)} style={{ color: v ? '#faad14' : '#bfbfbf' }} />
        </Tooltip>
      )
    },
    {
      title: 'Chuyển trạng thái',
      render: (_: any, record: Blog) => (
        <Switch checked={record.status === 'Active'} onChange={() => toggleStatus(record)} checkedChildren="ON" unCheckedChildren="OFF" />
      )
    },
    {
      title: 'Thao tác',
      render: (_: any, record: Blog) => (
        <Space>
          <Tooltip title="Xem trước">
            <Button icon={<EyeOutlined />} size="small" />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button icon={<EditOutlined />} onClick={() => openModal(record)} size="small" />
          </Tooltip>
          <Popconfirm title="Xác nhận xoá?" onConfirm={() => handleDelete(record.blogId)}>
            <Tooltip title="Xóa">
              <Button icon={<DeleteOutlined />} size="small" danger />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="blog-admin" style={{ background: '#f5f7fa', minHeight: '100vh', padding: 20 }}>
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Quản lý Bài viết</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()} size="large">
            Thêm Bài Viết
          </Button>
        </div>

        <Table
          rowKey="blogId"
          dataSource={blogs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)}
          columns={columns}
          loading={loading}
          pagination={false}
        />

        <div className="flex justify-end mt-4">
          <Pagination current={currentPage} pageSize={PAGE_SIZE} total={blogs.length} onChange={setCurrentPage} showSizeChanger={false} />
        </div>
      </div>

      {/* ===== Modal Create / Update ===== */}
      <Modal
        title={editingBlog ? 'Chỉnh sửa Bài viết' : 'Tạo Bài viết mới'}
        open={isModalVisible}
        destroyOnClose
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        width={980}
        okText={editingBlog ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
      >
        {/* Danh mục */}
        <div className="mb-3">
          <div className="mb-1 font-medium">Danh mục</div>
          <Select
            value={formState.blogCategoryId}
            onChange={(v: number) => setFormState({ ...formState, blogCategoryId: v })}
            className="w-full"
            placeholder="Chọn danh mục"
            size="large"
          >
            {categories.map((c) => (
              <Select.Option key={c.blogCategoryId} value={c.blogCategoryId}>
                {c.categoryName}
              </Select.Option>
            ))}
          </Select>
        </div>

        {/* Tiêu đề */}
        <div className="mb-3">
          <div className="mb-1 font-medium">Tiêu đề</div>
          <Input value={formState.title} onChange={(e) => setFormState({ ...formState, title: e.target.value })} size="large" />
        </div>

        {/* Tóm tắt */}
        <div className="mb-3">
          <div className="mb-1 font-medium">Tóm tắt nội dung</div>
          <Input.TextArea rows={3} value={formState.content} onChange={(e) => setFormState({ ...formState, content: e.target.value })} />
        </div>

        {/* Ảnh bìa */}
        <div className="mb-3">
          <div className="mb-1 font-medium">Ảnh bìa</div>
          <Radio.Group value={imageInputType} onChange={(e) => setImageInputType(e.target.value)} className="mb-2">
            <Radio value="upload">Upload ảnh</Radio>
            <Radio value="url">Dán URL ảnh</Radio>
          </Radio.Group>
          {imageInputType === 'upload' ? (
            <Upload beforeUpload={handleUploadCover} showUploadList={false} accept="image/*">
              <Button icon={<UploadOutlined />}>Chọn ảnh từ máy</Button>
            </Upload>
          ) : (
            <Input placeholder="Dán URL ảnh bìa..." value={formState.urlImage} onChange={(e) => setFormState({ ...formState, urlImage: e.target.value })} />
          )}
          {formState.urlImage && <img src={formState.urlImage} alt="preview" style={{ marginTop: 12, maxWidth: 220, borderRadius: 8 }} />}
        </div>

        {/* BODY HTML – TinyMCE (controlled) */}
        <div className="mb-2 flex items-center justify-between">
          <div className="font-medium">Nội dung bài viết</div>
          <Button size="small" icon={<PictureOutlined />} onClick={openImageModal}>
            Upload ảnh (Cloudinary)
          </Button>
        </div>
        <Editor
          apiKey="lfiqogz55f5k6y6cuza7ih9b59tc7t8h62v0z9lp8661yu2w"
          value={formState.bodyHTML} // controlled → không nhảy con trỏ
          onInit={(_, editor) => {
            editorRef.current = editor;
          }}
          onEditorChange={(content) =>
            setFormState(prev => ({ ...prev, bodyHTML: content }))
          }
          init={{
            height: 500,
            menubar: false,
            plugins: 'lists link image code table',
            toolbar:
              'undo redo | blocks | bold italic underline | alignleft aligncenter alignright | bullist numlist | link image | removeformat | code',
            automatic_uploads: false,
            paste_data_images: false,
            content_style:
              'body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; font-size:14px } img{max-width:100%;height:auto;}'
          }}
        />

        {/* Trạng thái & Nổi bật */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select value={formState.status} onChange={(v: BlogStatus) => setFormState({ ...formState, status: v })} size="large">
            <Select.Option value="Active">Active</Select.Option>
            <Select.Option value="Inactive">Inactive</Select.Option>
          </Select>
          <div className="flex items-center gap-2">
            <span>Đánh dấu Nổi bật</span>
            <Switch checked={formState.isFeatured} onChange={(checked) => setFormState({ ...formState, isFeatured: checked })} />
          </div>
        </div>
      </Modal>

      {/* ===== Modal upload ảnh để lấy URL & chèn vào TinyMCE ===== */}
      <Modal
        title="Upload ảnh (Cloudinary) – Lấy URL"
        open={imgModalOpen}
        onCancel={() => setImgModalOpen(false)}
        footer={null}
        width={520}
      >
        <Upload.Dragger
          name="file"
          multiple={false}
          accept="image/*"
          customRequest={customUploadToCloudinary}
          showUploadList={false}
          disabled={imgUploading}
          style={{ padding: 12 }}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">Kéo & thả ảnh vào đây hoặc bấm để chọn</p>
          <p className="ant-upload-hint">Ảnh sẽ được upload lên Cloudinary</p>
        </Upload.Dragger>

        <div style={{ marginTop: 16 }}>
          <Input
            prefix={<LinkOutlined />}
            placeholder="URL ảnh sau khi upload"
            value={uploadedUrl}
            readOnly
            addonAfter={
              <Space>
                <Button icon={<CopyOutlined />} onClick={copyUrl} disabled={!uploadedUrl} />
                <Button type="primary" onClick={insertToEditor} disabled={!uploadedUrl}>
                  Chèn vào nội dung
                </Button>
              </Space>
            }
          />
        </div>
      </Modal>

      <style>{`
        .blog-admin .ant-table-thead > tr > th { background: #f6ffed; color:#3f8600; font-weight:600; }
      `}</style>
    </div>
  );
};

export default BlogManagement;
