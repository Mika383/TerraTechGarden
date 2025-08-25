import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Input, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { BlogCategory, CreateCategoryRequest, UpdateCategoryRequest } from '@/types/blog';
import { getAllCategories, createCategory, updateCategory, deleteCategory } from '@/api/blog';

interface FormState {
  categoryName: string;
  description: string;
}

const initialFormState: FormState = {
  categoryName: '',
  description: ''
};

const BlogCategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  // Fetch categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Load categories error:', error);
      message.error('Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Form validation
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formState.categoryName.trim()) {
      errors.categoryName = 'Vui lòng nhập tên danh mục';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle modal
  const openModal = (category: BlogCategory | null = null) => {
    if (category) {
      setFormState({
        categoryName: category.categoryName,
        description: category.description
      });
      setEditingCategory(category);
    } else {
      setFormState(initialFormState);
      setEditingCategory(null);
    }
    setIsModalVisible(true);
    setFormErrors({});
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) {
      message.error('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    setSubmitLoading(true);
    try {
      if (editingCategory) {
        const updatePayload: UpdateCategoryRequest = {
          blogCategoryId: editingCategory.blogCategoryId, // 👈 thêm id vào body
          categoryName: formState.categoryName,
          description: formState.description,
        };
        await updateCategory(editingCategory.blogCategoryId, updatePayload);
        message.success('Cập nhật danh mục thành công');
      } else {
        const createPayload: CreateCategoryRequest = {
          categoryName: formState.categoryName,
          description: formState.description
        };
        await createCategory(createPayload);
        message.success('Thêm danh mục thành công');
      }
      setIsModalVisible(false);
      fetchCategories();
    } catch (error) {
      console.error('Submit error:', error);
      message.error('Đã xảy ra lỗi khi lưu danh mục');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    try {
      await deleteCategory(id);
      message.success('Xóa danh mục thành công');
      fetchCategories();
    } catch (error) {
      console.error('Delete error:', error);
      message.error('Xóa danh mục thất bại');
    }
  };

  // Table columns
  const columns = [
    {
      title: 'ID',
      dataIndex: 'blogCategoryId',
      key: 'blogCategoryId',
      width: 80
    },
    {
      title: 'Tên danh mục',
      dataIndex: 'categoryName',
      key: 'categoryName'
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (_: any, record: BlogCategory) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          />
          <Popconfirm
            title="Xác nhận xoá?"
            description="Bạn có chắc chắn muốn xóa danh mục này?"
            onConfirm={() => handleDelete(record.blogCategoryId)}
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Quản lý Danh mục Blog</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => openModal()}
        >
          Thêm Danh mục
        </Button>
      </div>

      <Table
        rowKey="blogCategoryId"
        dataSource={categories}
        columns={columns}
        loading={loading}
      />

      <Modal
        title={editingCategory ? 'Chỉnh sửa Danh mục' : 'Thêm Danh mục mới'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={submitLoading}
      >
        <div className="space-y-4">
          <div>
            <Input
              placeholder="Tên danh mục"
              value={formState.categoryName}
              onChange={e => 
                setFormState(prev => ({ ...prev, categoryName: e.target.value }))
              }
              status={formErrors.categoryName ? 'error' : undefined}
            />
            {formErrors.categoryName && (
              <p className="text-red-500 text-sm mt-1">{formErrors.categoryName}</p>
            )}
          </div>

          <div>
            <Input.TextArea
              placeholder="Mô tả"
              value={formState.description}
              onChange={e => 
                setFormState(prev => ({ ...prev, description: e.target.value }))
              }
              rows={4}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BlogCategoryManagement;
