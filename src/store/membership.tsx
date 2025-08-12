import React, { createContext, useContext, useEffect, useState } from 'react';
import { getUserMembership } from '@/api/membership';

type MembershipContextType = {
  hasMembership: boolean | null;   // null = chưa biết, true/false = đã biết
  loading: boolean;
  refreshMembership: (userId?: number) => Promise<boolean>;
  clear: () => void;
};

const MembershipContext = createContext<MembershipContextType>({
  hasMembership: null,
  loading: false,
  refreshMembership: async () => false,
  clear: () => {},
});

const getUserIdFromToken = (): number | null => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    const payload = JSON.parse(
      atob((token.split('.')[1] || '').replace(/-/g, '+').replace(/_/g, '/'))
    );
    const raw =
      payload?.nameid ?? payload?.userId ?? payload?.UserId ?? payload?.id ?? payload?.sub;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
};

export const MembershipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasMembership, setHasMembership] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshMembership = async (userId?: number) => {
    const uid = userId ?? getUserIdFromToken();
    if (!uid) {
      setHasMembership(false);
      localStorage.removeItem('hasMembership');
      return false;
    }
    setLoading(true);
    try {
      const list = await getUserMembership(uid); // chuẩn hoá: mảng active
      const ok = Array.isArray(list) && list.length > 0;
      setHasMembership(ok);
      localStorage.setItem('hasMembership', ok ? '1' : '0');
      return ok;
    } catch {
      setHasMembership(false);
      localStorage.setItem('hasMembership', '0');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Bootstrap khi app load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setHasMembership(false);
      localStorage.removeItem('hasMembership');
      return;
    }
    const cached = localStorage.getItem('hasMembership');
    if (cached === '1' || cached === '0') {
      setHasMembership(cached === '1');
    } else {
      refreshMembership();
    }
  }, []);

  const clear = () => {
    setHasMembership(false);
    localStorage.removeItem('hasMembership');
  };

  return (
    <MembershipContext.Provider value={{ hasMembership, loading, refreshMembership, clear }}>
      {children}
    </MembershipContext.Provider>
  );
};

export const useMembership = () => useContext(MembershipContext);
