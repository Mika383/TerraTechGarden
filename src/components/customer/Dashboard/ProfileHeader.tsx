// src/components/customer/Dashboard/ProfileHeader.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, message } from 'antd';
import { getProfileMe } from '@/api/profile';
import type { ProfileMe } from '@/types/profile';

const ProfileHeader: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileMe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getProfileMe();
        setProfile(res.data);
      } catch (err: any) {
        message.error(err?.message || 'Không thể tải thông tin hồ sơ');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spin size="large" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center text-gray-500 py-8">
        Không có thông tin hồ sơ
      </div>
    );
  }

  return (
    <div className="relative bg-gray-200 rounded-lg shadow mb-8">
      {/* Background */}
      <div
        className="h-48 bg-cover bg-center rounded-t-lg"
        style={{
          backgroundImage: `url(${profile.backgroundUrl || '/default-bg.jpg'})`,
        }}
      />
      <div className="p-6">
        <div className="flex items-center mb-4">
          {/* Avatar */}
          <div className="relative -mt-16">
            <img
              src={profile.avatarUrl || '/default-avatar.png'}
              alt="Avatar"
              className="w-32 h-32 rounded-full border-4 border-white object-cover"
            />
          </div>

          {/* Thông tin */}
          <div className="ml-6">
            <h1 className="text-3xl font-bold">{profile.fullName}</h1>
            <p className="text-gray-600">{profile.email}</p>
            <p className="text-gray-600">{profile.phoneNumber}</p>
          </div>

          {/* Nút chỉnh sửa */}
          <div className="ml-auto">
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={() => navigate('/customer-dashboard/edit-profile')}
            >
              Chỉnh sửa hồ sơ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
