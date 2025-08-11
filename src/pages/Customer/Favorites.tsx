// src/pages/Customer/EditProfile.tsx
import React, { useEffect, useState } from 'react';
import { getProfileMe, updateProfileMe } from '@/api/profile';
import { ProfileMe, UpdateProfileRequest } from '@/types/profile';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const EditProfile: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | string>('other');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(''); // yyyy-MM-dd
  const [email, setEmail] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getProfileMe();
        const data: ProfileMe = res.data;
        setFullName(data.fullName ?? '');
        setGender((data.gender as any) ?? 'other');
        setPhoneNumber(data.phoneNumber ?? '');
        setEmail(data.email ?? '');
        // convert ISO -> yyyy-MM-dd
        if (data.dateOfBirth) {
          const d = new Date(data.dateOfBirth);
          setDateOfBirth(d.toISOString().split('T')[0]);
        }
      } catch (e) {
        console.error(e);
        toast.error('Không tải được hồ sơ.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload: UpdateProfileRequest = {
        fullName: fullName.trim(),
        gender,
        phoneNumber: phoneNumber.trim(),
        dateOfBirth: dateOfBirth ? `${dateOfBirth}T00:00:00` : new Date().toISOString(),
        email: email.trim(),
      };
      await updateProfileMe(payload);
      toast.success('Cập nhật hồ sơ thành công');
      navigate('/customer-dashboard');
    } catch (e) {
      console.error(e);
      toast.error('Cập nhật thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-1/3 bg-gray-200 rounded" />
          <div className="h-10 w-full bg-gray-200 rounded" />
          <div className="h-10 w-full bg-gray-200 rounded" />
          <div className="h-10 w-full bg-gray-200 rounded" />
          <div className="h-10 w-full bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Chỉnh sửa hồ sơ</h1>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Họ và tên</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Giới tính</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
            <option value="other">Khác</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Số điện thoại</label>
          <input
            type="tel"
            className="w-full border rounded px-3 py-2"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Ví dụ: 0987654321"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Ngày sinh</label>
          <input
            type="date"
            className="w-full border rounded px-3 py-2"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            className="w-full border rounded px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
          <button
            type="button"
            className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded"
            onClick={() => navigate(-1)}
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;
