// utils/jwt.ts
import { jwtDecode } from 'jwt-decode'; // Sử dụng named import

interface DecodedToken {
  [key: string]: any;
  exp?: number;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string;
}

export const getRoleFromToken = (): string | null => {
  const token = localStorage.getItem('authToken');
  if (!token) return null;

  try {
    const decoded: DecodedToken = jwtDecode(token);
    return decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || null;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

export const getUserIdFromToken = (): number | null => {
  const token = localStorage.getItem('authToken');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Number(payload.sub);
  } catch {
    return null;
  }
};

