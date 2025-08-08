import api from '@/lib/axios/axiosInstance';
import { Account } from '../types/accounts';

export const getAccounts = async () => {
  const response = await api.get('/Accounts/get-all');
  return response.data.data || [];
};

export const getAccountsByRole = async (role: string, page = 1, pageSize = 20) => {
  const response = await api.get(`/Accounts/role/${role}`, {
    params: { page, pageSize },
  });
  return response.data.data || [];
};

export const getAccountById = async (id: number) => {
  const response = await api.get(`/Accounts/${id}`);
  return response.data;
};

export const createAccount = async (payload: Partial<Account>) => {
  const response = await api.post('/Accounts', payload);
  return response.data;
};

export const deleteAccountById = async (id: number) => {
  const response = await api.delete(`/Accounts/${id}`);
  return response.data;
};

export const updateAccount = async (id: number, payload: Account) => {
  const response = await api.put(`/Accounts/${id}`, payload);
  return response.data;
};

export const updateAccountStatus = async (userId: number, status: string) => {
  const response = await api.put(`/Accounts/status/${userId}`, status, {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};
