// src/pages/admin/MembershipManagement.tsx
// ... giữ nguyên các import ở bản trước của mình
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
  const [editing, setEditing] = useState<MembershipPackage | null>(null);
  const [form] = Form.useForm<CreateMembershipPackageRequest & UpdateMembershipPackageRequest>();

  const [openGrant, setOpenGrant] = useState(false);
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
      } else message.error('Không tải được danh sách gói.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setEditing(null);
    setOpenCU(true);
    form.resetFields();
    form.setFieldsValue({
      type: '1Month',
      durationDays: 30,
      price: 0,
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
      if (editing) {
        await updateMembershipPackage(editing.id, values as UpdateMembershipPackageRequest);
        message.success('Đã cập nhật gói.');
      } else {
        await createMembershipPackage(values as CreateMembershipPackageRequest);
        message.success('Đã tạo gói mới.');
      }
      setOpenCU(false);
      setEditing(null);
      fetchAll();
    } catch (e: any) {
      if (e?.response?.status === 401) {
        message.error('Cần đăng nhập.');
        navigate('/login');
      } else if (!e?.errorFields) {
        message.error('Thao tác thất bại.');
      }
    }
  };

  const onDelete = async (p: MembershipPackage) => {
    try {
      await deleteMembershipPackage(p.id);
      message.success('Đã xoá gói.');
      fetchAll();
    } catch (e: any) {
      if (e?.response?.status === 401) {
        message.error('Cần đăng nhập.');
        navigate('/login');
      } else message.error('Xoá thất bại.');
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
    } catch (e: any) {
      if (e?.response?.status === 401) {
        message.error('Cần đăng nhập.');
        navigate('/login');
      } else if (!e?.errorFields) {
        message.error('Cấp gói thất bại.');
      }
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
              onDelete={onDelete}     // ✅ Xoá nằm trong card, không còn nút thứ 2
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
              <InputNumber min={0} className="w-full" />
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
