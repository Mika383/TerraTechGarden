import api from './axios';
import { Account } from './types';

export const getAccounts = async () => {
  const response = await api.get('/api/Accounts');
  return response.data.data || [];
};

export const getAccountsByRole = async (role: string, page = 1, pageSize = 20) => {
  const response = await api.get(`/api/Accounts/role/${role}`, {
    params: { page, pageSize },
  });
  return response.data.data || [];
};

export const getAccountById = async (id: number) => {
  const response = await api.get(`/api/Accounts/${id}`);
  return response.data;
};

export const createAccount = async (payload: any) => {
  const response = await api.post('/api/Accounts', payload);
  return response.data;
};

export const deleteAccountById = async (id: number) => {
  const response = await api.delete(`/api/Accounts/${id}`);
  return response.data;
};

export const updateAccount = async (id: number, payload: Account) => {
  const response = await api.put(`/api/Accounts/${id}`, payload);
  return response.data;
};

export const updateAccountStatus = async (userId: number, status: string) => {
  const response = await api.put(`/api/Accounts/status/${userId}`, status, {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};
