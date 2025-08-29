// src/pages/admin/MembershipManagement.tsx
import React, { useEffect, useState } from 'react';
import { Button, Modal, Form, Input, InputNumber, Switch, Row, Col, message, DatePicker } from 'antd';
import dayjs from 'dayjs';
import MembershipCard from '@/components/common/MembershipCard';
import {
  getMembershipPackages,
  createMembershipPackage,
  updateMembershipPackage,
  deleteMembershipPackage,
  grantMembershipToUser,
} from '@/api/membership';
import { CreateMembershipPackageRequest, MembershipPackage, UpdateMembershipPackageRequest } from '@/types/membership';
import { useNavigate } from 'react-router-dom';

const MembershipManagement: React.FC = () => {
  const [list, setList] = useState<MembershipPackage[]>([]);
  const [loading, setLoading] = useState(false);

  const [openCU, setOpenCU] = useState(false);
  const [submittingCU, setSubmittingCU] = useState(false);
  const [editing, setEditing] = useState<MembershipPackage | null>(null);
  const [form] = Form.useForm<CreateMembershipPackageRequest & UpdateMembershipPackageRequest>();

  const [openGrant, setOpenGrant] = useState(false);
  const [grantSubmitting, setGrantSubmitting] = useState(false);
  const [grantForm] = Form.useForm<{ userId: number; startDate: any; price?: number; durationDays: number }>();
  const [grantTarget, setGrantTarget] = useState<MembershipPackage | null>(null);

  const navigate = useNavigate();

  const fetchAll = async () => {
    try {
      setLoading(true);
      const data = await getMembershipPackages();
      setList(data || []);
    } catch (e: any) {
      if (e?.response?.status === 401) {
        message.error('Hết phiên. Vui lòng đăng nhập lại.');
        navigate('/login');
      } else message.error(e?.message || 'Không tải được danh sách gói.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setOpenCU(true);
    form.resetFields();
    form.setFieldsValue({
      type: '1Month',
      durationDays: 30,
      price: 100000, // nên > 0 để tránh 400
      description: '',
      isActive: true,
    });
  };

  const openEdit = (p: MembershipPackage) => {
    setEditing(p);
    setOpenCU(true);
    form.setFieldsValue({
      type: p.type,
      durationDays: p.durationDays,
      price: p.price,
      description: p.description,
      isActive: p.isActive,
    });
  };

  const submitCU = async () => {
    try {
      const values = await form.validateFields();
      // validate nhẹ phía FE để tránh round-trip lỗi nhanh
      if ((values.durationDays ?? 0) < 1) return message.error('Số ngày phải >= 1');
      if ((values.price ?? 0) < 1) return message.error('Giá phải > 0');

      setSubmittingCU(true);

      if (editing) {
        // Optimistic update
        const prev = [...list];
        const idx = prev.findIndex((x) => x.id === editing.id);
        if (idx !== -1) {
          prev[idx] = { ...prev[idx], ...values } as MembershipPackage;
          setList(prev);
        }

        await updateMembershipPackage(editing.id, values as UpdateMembershipPackageRequest);
        message.success('Đã cập nhật gói.');
      } else {
        // Tạo mới
        const created = await createMembershipPackage(values as CreateMembershipPackageRequest);
        message.success('Đã tạo gói mới.');
        // Optimistic insert nếu API trả object; fallback nếu không có id
        if (created && typeof created === 'object') {
          setList((prev) => [created as MembershipPackage, ...prev]);
        } else {
          // nếu BE không trả object mới, vẫn refetch dưới
        }
      }

      // Đóng modal NGAY để phản hồi UI rõ ràng
      setOpenCU(false);
      setEditing(null);
      form.resetFields();

      // Đồng bộ lại list từ server (đợi xong để chắc chắn)
      await fetchAll();
    } catch (e: any) {
      if (e?.response?.status === 401) {
        message.error('Cần đăng nhập.');
        navigate('/login');
      } else if (e?.errorFields) {
        // lỗi form validation antd — antd tự highlight field
      } else {
        message.error(e?.message || 'Thao tác thất bại.');
      }
    } finally {
      setSubmittingCU(false);
    }
  };

  const onDelete = async (p: MembershipPackage) => {
    try {
      await deleteMembershipPackage(p.id);
      message.success('Đã xoá gói.');
      // Optimistic remove
      setList((prev) => prev.filter((x) => x.id !== p.id));
      await fetchAll();
    } catch (e: any) {
      if (e?.response?.status === 401) {
        message.error('Cần đăng nhập.');
        navigate('/login');
      } else message.error(e?.message || 'Xoá thất bại.');
    }
  };

  const openGrantModal = (p: MembershipPackage) => {
    setGrantTarget(p);
    setOpenGrant(true);
    grantForm.resetFields();
    grantForm.setFieldsValue({
      durationDays: p.durationDays,
      price: 0,
      startDate: dayjs(),
    });
  };

  const submitGrant = async () => {
    try {
      const v = await grantForm.validateFields();
      if (!grantTarget) return;
      setGrantSubmitting(true);
      await grantMembershipToUser({
        userId: Number(v.userId),
        packageId: grantTarget.id,
        startDate: (v.startDate as any).toDate().toISOString(),
        price: Number(v.price || 0),
        durationDays: Number(v.durationDays),
        description: 'string',
      });
      message.success('Đã cấp gói cho người dùng.');
      setOpenGrant(false);
      setGrantTarget(null);
      grantForm.resetFields();
      // không bắt buộc refetch list gói khi grant, nhưng vẫn gọi cho chắc
      await fetchAll();
    } catch (e: any) {
      if (e?.response?.status === 401) {
        message.error('Cần đăng nhập.');
        navigate('/login');
      } else if (!e?.errorFields) {
        message.error(e?.message || 'Cấp gói thất bại.');
      }
    } finally {
      setGrantSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Quản lý gói Membership</h1>
        <div className="flex gap-2">
          <Button onClick={fetchAll} loading={loading}>Tải lại</Button>
          <Button type="primary" onClick={openCreate}>Tạo gói</Button>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        {list.map((p) => (
          <Col xs={24} sm={12} md={8} lg={6} key={p.id}>
            <MembershipCard
              pack={p}
              onEdit={openEdit}
              onGrant={openGrantModal}
              onDelete={onDelete}
            />
          </Col>
        ))}
      </Row>

      {/* Modal Tạo/Sửa */}
      <Modal
        open={openCU}
        title={editing ? `Sửa gói #${editing.id}` : 'Tạo gói mới'}
        onOk={submitCU}
        onCancel={() => { setOpenCU(false); setEditing(null); }}
        okText={editing ? 'Lưu thay đổi' : 'Tạo mới'}
        destroyOnClose
        confirmLoading={submittingCU}                 // ✅ loading nút OK
        afterClose={() => form.resetFields()}         // ✅ sạch form sau khi đóng
      >
        <Form form={form} layout="vertical">
          <Form.Item name="type" label="Loại gói" rules={[{ required: true, message: 'Nhập loại gói' }]}>
            <Input placeholder="VD: 1Month, 6Months, 1Year..." />
          </Form.Item>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item name="durationDays" label="Số ngày" rules={[{ required: true }]}>
              <InputNumber min={1} className="w-full" />
            </Form.Item>
            <Form.Item name="price" label="Giá (VND)" rules={[{ required: true }]}>
              <InputNumber min={1} className="w-full" />
            </Form.Item>
          </div>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="isActive" label="Kích hoạt" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Cấp gói cho user */}
      <Modal
        open={openGrant}
        title={grantTarget ? `Cấp gói: ${grantTarget.type}` : 'Cấp gói cho user'}
        onOk={submitGrant}
        onCancel={() => { setOpenGrant(false); setGrantTarget(null); }}
        okText="Cấp gói"
        destroyOnClose
        confirmLoading={grantSubmitting}              // ✅ loading nút OK
        afterClose={() => grantForm.resetFields()}    // ✅ sạch form sau khi đóng
      >
        <Form form={grantForm} layout="vertical">
          <Form.Item name="userId" label="User ID" rules={[{ required: true, message: 'Nhập User ID' }]}>
            <InputNumber min={1} className="w-full" />
          </Form.Item>
          <Form.Item name="startDate" label="Ngày bắt đầu" rules={[{ required: true }]}>
            <DatePicker showTime className="w-full" />
          </Form.Item>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item name="durationDays" label="Số ngày" rules={[{ required: true }]}>
              <InputNumber min={1} className="w-full" />
            </Form.Item>
            <Form.Item name="price" label="Giá cấp (VND)">
              <InputNumber min={0} className="w-full" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default MembershipManagement;
