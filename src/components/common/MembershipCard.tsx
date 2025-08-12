// src/components/common/MembershipCard.tsx
import React from 'react';
import { Button, Tag, Popconfirm, Space, Tooltip } from 'antd';
import { EditOutlined, UserAddOutlined, DeleteOutlined, CalendarOutlined, DollarOutlined } from '@ant-design/icons';
import { MembershipPackage } from '@/types/membership';

interface MembershipCardProps {
  pack: MembershipPackage;
  onEdit?: (pack: MembershipPackage) => void;
  onDelete?: (pack: MembershipPackage) => void;
  onGrant?: (pack: MembershipPackage) => void;
  hideActions?: boolean;
  className?: string;
}

const formatCurrency = (amount: number): string => {
  return (amount ?? 0).toLocaleString('vi-VN');
};

const MembershipCard: React.FC<MembershipCardProps> = ({
  pack,
  onEdit,
  onDelete,
  onGrant,
  hideActions = false,
  className = ''
}) => {
  const isActive = !!pack.isActive;

  return (
    <div
      className={`
        relative group bg-white rounded-2xl shadow-sm hover:shadow-lg 
        border border-gray-100 overflow-hidden transition-all duration-300
        hover:border-blue-200 hover:-translate-y-1
        ${className}
      `}
    >
      {/* Status Badge */}
      <div className="absolute top-4 right-4 z-10">
        {isActive ? (
          <Tag 
            color="success" 
            className="rounded-full px-3 py-1 text-xs font-medium border-0 shadow-sm"
          >
            Đang bán
          </Tag>
        ) : (
          <Tag 
            color="default" 
            className="rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 border-0"
          >
            Ngừng bán
          </Tag>
        )}
      </div>

      {/* Gradient Header */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 px-6 pt-6 pb-4">
        <h3 className="text-xl font-bold text-gray-800 truncate pr-16 mb-2">
          {pack.type}
        </h3>
        
        {pack.description && (
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {pack.description}
          </p>
        )}
      </div>

      {/* Content Body */}
      <div className="px-6 py-5">
        <div className="space-y-4">
          {/* Duration */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <CalendarOutlined className="text-blue-500" />
              <span className="text-sm font-medium text-gray-600">Thời hạn</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {pack.durationDays} ngày
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-center space-x-2">
              <DollarOutlined className="text-green-600" />
              <span className="text-sm font-medium text-gray-600">Giá</span>
            </div>
            <span className="text-lg font-bold text-green-700">
              {formatCurrency(pack.price)} ₫
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        {!hideActions && (onEdit || onGrant || onDelete) && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <Space size="small" className="w-full flex justify-end">
              {onEdit && (
                <Tooltip title="Chỉnh sửa gói">
                  <Button 
                    icon={<EditOutlined />}
                    onClick={() => onEdit(pack)}
                    className="flex items-center hover:border-blue-400 hover:text-blue-600"
                  >
                    Sửa
                  </Button>
                </Tooltip>
              )}

              {onGrant && (
                <Tooltip title="Cấp gói trực tiếp cho người dùng">
                  <Button 
                    type="primary"
                    icon={<UserAddOutlined />}
                    onClick={() => onGrant(pack)}
                    className="flex items-center bg-blue-600 hover:bg-blue-700 border-blue-600"
                  >
                    Cấp cho user
                  </Button>
                </Tooltip>
              )}

              {onDelete && (
                <Popconfirm
                  title="Xoá gói membership này?"
                  description="Hành động này không thể hoàn tác."
                  okText="Xoá"
                  cancelText="Huỷ"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => onDelete(pack)}
                  placement="topRight"
                >
                  <Tooltip title="Xoá gói">
                    <Button 
                      danger 
                      icon={<DeleteOutlined />}
                      className="flex items-center hover:bg-red-50"
                    >
                      Xoá
                    </Button>
                  </Tooltip>
                </Popconfirm>
              )}
            </Space>
          </div>
        )}
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" />
    </div>
  );
};

export default MembershipCard;