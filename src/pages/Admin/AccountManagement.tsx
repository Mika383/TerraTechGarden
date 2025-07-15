import React, { useEffect, useState } from 'react';
import { getAccounts, getAccountsByRole, deleteAccountById, createAccount, updateAccount, updateAccountStatus } from '../../api/accounts';
import { Account } from '../../api/types';
import { EditOutlined, DeleteOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons';
import { Switch } from 'antd';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion, AnimatePresence } from 'framer-motion';

const roles = ['Tất cả', 'User', 'Staff', 'Manager', 'Admin', 'Shipper'];
const PAGE_SIZE = 5;

const roleMap: Record<string, number> = {
  'User': 1,
  'Staff': 2,
  'Manager': 3,
  'Admin': 4,
  'Shipper': 5,
};

const AccountManagement: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Tất cả');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [newAccount, setNewAccount] = useState({ username: '', email: '', roleId: 1 });
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const selected = selectedRole !== 'Tất cả' ? selectedRole : null;
      const data = selected ? await getAccountsByRole(selected) : await getAccounts();
      setAccounts(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Lỗi tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    setCurrentPage(1);
  }, [selectedRole]);
  useEffect(() => {
  const handleTokenRefresh = () => {
    fetchAccounts();
  };

  window.addEventListener('tokenRefreshed', handleTokenRefresh);
  return () => window.removeEventListener('tokenRefreshed', handleTokenRefresh);
}, []);

  const handleCreate = async () => {
    const payload = {
      ...newAccount,
      password: '1',
      fullName: newAccount.username,
      phoneNumber: '',
      dateOfBirth: new Date().toISOString(),
      gender: 'Nam',
    };
    await createAccount(payload);
    toast.success('Tạo tài khoản thành công!');
    setShowCreateForm(false);
    fetchAccounts();
  };

  const handleEdit = async () => {
    if (!editingAccount) return;
    await updateAccount(editingAccount.userId, editingAccount);
    toast.success('Cập nhật tài khoản thành công!');
    setShowEditForm(false);
    fetchAccounts();
  };

  const handleUpdateStatus = async (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    await updateAccountStatus(userId, newStatus);
    toast.success(`Đã cập nhật trạng thái thành ${newStatus}`);
    fetchAccounts();
  };

  const handleDelete = async (id: number) => {
    await deleteAccountById(id);
    toast.success('Xóa tài khoản thành công!');
    fetchAccounts();
  };

  const filteredAccounts = accounts.filter(acc =>
    acc.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredAccounts.length / PAGE_SIZE);
  const paginatedAccounts = filteredAccounts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const roleNameFromId = (roleId: number) => {
    return Object.keys(roleMap).find(key => roleMap[key] === roleId) || 'Unknown';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center space-x-2">
          <UserOutlined /> <span>Quản lý Tài Khoản</span>
        </h2>
        <div className="flex space-x-2">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="border rounded-lg py-1 px-3"
          >
            {roles.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Tìm kiếm theo tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded-lg py-1 px-3"
          />
          <button onClick={() => setShowCreateForm(true)} className="bg-blue-500 text-white px-3 py-1 rounded">
            <PlusOutlined /> Thêm Tài Khoản
          </button>
        </div>
      </div>
            <div className="border rounded-lg p-4 relative" style={{ minHeight: '400px' }}>
            <table className="w-full text-left border-collapse">
                <thead>
                <tr>
                    <th className="border p-2">ID</th>
                    <th className="border p-2">Tên</th>
                    <th className="border p-2">Email</th>
                    <th className="border p-2">Vai trò</th>
                    <th className="border p-2">Trạng thái</th>
                    <th className="border p-2">Thao tác</th>
                </tr>
                </thead>
                <tbody>
                {paginatedAccounts.map(acc => (
                    <tr key={acc.userId}>
                    <td className="border p-2">{acc.userId}</td>
                    <td className="border p-2">{acc.fullName}</td>
                    <td className="border p-2">{acc.email}</td>
                    <td className="border p-2">{roleNameFromId(acc.roleId)}</td>
                    <td className="border p-2">
                        <Switch
                        checked={acc.status === 'Active'}
                        onChange={() => handleUpdateStatus(acc.userId, acc.status)}
                        />
                    </td>
                    <td className="border p-2 space-x-2">
                        <button onClick={() => {setEditingAccount(acc); setShowEditForm(true);}} className="text-blue-500"><EditOutlined /></button>
                        <button onClick={() => handleDelete(acc.userId)} className="text-red-500"><DeleteOutlined /></button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>

            <div className="absolute bottom-4 right-4 flex space-x-2">
                {Array.from({ length: totalPages }, (_, i) => (
                <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 border rounded ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                >
                    {i + 1}
                </button>
                ))}
            </div>
            </div>
      <AnimatePresence>
        {showCreateForm && (
          <motion.div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white p-6 rounded shadow-lg w-96"
              initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
              <h3 className="text-lg font-semibold mb-4">Tạo tài khoản mới</h3>
              <input placeholder="Username" onChange={e => setNewAccount({...newAccount, username: e.target.value})} className="border p-2 mb-2 w-full" />
              <input placeholder="Email" onChange={e => setNewAccount({...newAccount, email: e.target.value})} className="border p-2 mb-2 w-full" />
              <select value={newAccount.roleId} onChange={e => setNewAccount({...newAccount, roleId: Number(e.target.value)})} className="border p-2 mb-4 w-full">
                {Object.entries(roleMap).map(([name, id]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
              <div className="flex justify-end space-x-2">
                <button onClick={handleCreate} className="bg-green-500 text-white px-4 py-2 rounded">Tạo</button>
                <button onClick={() => setShowCreateForm(false)} className="bg-gray-300 px-4 py-2 rounded">Hủy</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showEditForm && editingAccount && (
          <motion.div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white p-6 rounded shadow-lg w-96"
              initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
              <h3 className="text-lg font-semibold mb-4">Chỉnh sửa tài khoản</h3>
              <input value={editingAccount.fullName} onChange={e => setEditingAccount({...editingAccount, fullName: e.target.value})} className="border p-2 mb-2 w-full" />
              <input value={editingAccount.email} onChange={e => setEditingAccount({...editingAccount, email: e.target.value})} className="border p-2 mb-2 w-full" />
              <select value={editingAccount.roleId} onChange={e => setEditingAccount({...editingAccount, roleId: Number(e.target.value)})} className="border p-2 mb-2 w-full">
                {Object.entries(roleMap).map(([name, id]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
              <div className="flex justify-end space-x-2">
                <button onClick={handleEdit} className="bg-green-500 text-white px-4 py-2 rounded">Lưu</button>
                <button onClick={() => setShowEditForm(false)} className="bg-gray-300 px-4 py-2 rounded">Hủy</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccountManagement;
