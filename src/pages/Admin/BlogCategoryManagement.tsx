import React, { useEffect, useState } from 'react';
import { getAllCategories, createCategory, updateCategory, deleteCategory } from '../../api/blogCategory';
import { BlogCategory } from '../../api/types/blogCategory';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Modal, Input, Button, Table, Space, Popconfirm, message, Pagination } from 'antd';

const PAGE_SIZE = 5;

const BlogCategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [formState, setFormState] = useState({ categoryName: '', description: '' });
  const [currentPage, setCurrentPage] = useState(1);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch {
      message.error('Lỗi khi tải danh mục blog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openModal = (category: BlogCategory | null = null) => {
    setEditingCategory(category);
    setFormState(category ? { categoryName: category.categoryName, description: category.description } : { categoryName: '', description: '' });
    setIsModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.blogCategoryId, {
          blogCategoryId: editingCategory.blogCategoryId,
          ...formState,
        });
        message.success('Cập nhật danh mục thành công');
      } else {
        await createCategory(formState);
        message.success('Tạo danh mục mới thành công');
      }
      fetchCategories();
    } catch {
      message.error('Đã xảy ra lỗi');
    } finally {
      setIsModalVisible(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCategory(id);
      message.success('Xóa danh mục thành công');
      fetchCategories();
    } catch {
      message.error('Lỗi khi xóa danh mục');
    }
  };

  const paginatedCategories = categories.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const columns = [
    { title: 'ID', dataIndex: 'blogCategoryId', key: 'id' },
    { title: 'Tên danh mục', dataIndex: 'categoryName', key: 'categoryName' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    {
      title: 'Thao tác',
      render: (_: any, record: BlogCategory) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openModal(record)} />
          <Popconfirm title="Xác nhận xoá?" onConfirm={() => handleDelete(record.blogCategoryId)}>
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Quản lý Blog Category</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Thêm danh mục</Button>
      </div>
      <Table
        rowKey="blogCategoryId"
        dataSource={paginatedCategories}
        columns={columns}
        loading={loading}
        pagination={false}
      />
      <Pagination
        current={currentPage}
        pageSize={PAGE_SIZE}
        total={categories.length}
        onChange={page => setCurrentPage(page)}
        className="mt-4 text-right"
      />

      <Modal
        title={editingCategory ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Input
          placeholder="Tên danh mục"
          className="mb-2"
          value={formState.categoryName}
          onChange={(e) => setFormState({ ...formState, categoryName: e.target.value })}
        />
        <Input.TextArea
          placeholder="Mô tả"
          value={formState.description}
          onChange={(e) => setFormState({ ...formState, description: e.target.value })}
        />
      </Modal>
    </div>
  );
};

export default BlogCategoryManagement;
