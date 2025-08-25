import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTaggoAI } from "@/hooks/useTaggoAIWidget";
import { getUserMembership } from "@/api/membership";
import { Taggo } from "@/lib/taggoai";

// helpers
const getUserIdFromToken = (): number | null => {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) return null;
    const payload = JSON.parse(atob((token.split(".")[1] || "").replace(/-/g, "+").replace(/_/g, "/")));
    const raw = payload?.nameid ?? payload?.userId ?? payload?.UserId ?? payload?.id ?? payload?.sub;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch { return null; }
};

// Ẩn trên các trang đặc biệt
const HIDE_PATHS = [
  "/checkout", "/login", "/register", "/forgot-password", "/reset-password",
  "/staff/*", "/manager/*", "/admin/*", "/auth/*", "/customer-dashboard/*",
];

export default function ChatFab() {
  const loc = useLocation();

  const [userId, setUserId] = useState<number | null>(() => getUserIdFromToken());
  const [hasMembership, setHasMembership] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);

  // Re-check membership khi có userId
  const refreshMembership = async (uid: number | null) => {
    if (!uid) { setHasMembership(false); return; }
    try {
      setChecking(true);
      const list = await getUserMembership(uid); // đã chuẩn hoá trả mảng active
      setHasMembership(Array.isArray(list) && list.length > 0);
    } catch {
      setHasMembership(false);
    } finally {
      setChecking(false);
    }
  };

  // Lắng nghe các sự kiện đổi token/membership ở cùng tab
  useEffect(() => {
    const onAuthChange = () => {
      const uid = getUserIdFromToken();
      setUserId(uid);
      refreshMembership(uid);
      if (!uid) { try { Taggo.hide?.(); (Taggo as any).identify?.({}); } catch {} }
    };
    window.addEventListener("tokenRefreshed", onAuthChange);
    window.addEventListener("membershipChanged", onAuthChange);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") onAuthChange();
    });

    // storage event cho các TAB khác
    const onStorage = (e: StorageEvent) => {
      if (e.key === "authToken" || e.key === "userId") onAuthChange();
    };
    window.addEventListener("storage", onStorage);

    // mount lần đầu
    onAuthChange();

    return () => {
      window.removeEventListener("tokenRefreshed", onAuthChange);
      window.removeEventListener("membershipChanged", onAuthChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Tự ẩn ngay khi chuyển sang guest (không cần đợi hook)
  useEffect(() => {
    if (!userId) {
      try { Taggo.hide?.(); (Taggo as any).identify?.({}); } catch {}
    }
  }, [userId]);

 // Điều kiện bật widget
  const enabled = useMemo(() => !!userId && hasMembership && !checking, [userId, hasMembership, checking]);

  // ✅ Tạo identify chỉ khi có userId, và chuyển về string để chắc type
  const identify = useMemo(() => {
    return enabled && userId ? { userId: String(userId) } : undefined;
  }, [enabled, userId]);

  // Hook loader + show/hide theo route + enabled
  useTaggoAI({
    hideOnPaths: HIDE_PATHS,
    enabled,
    identify, // ← dùng biến đã chuẩn hoá type
  });

  return null;
}