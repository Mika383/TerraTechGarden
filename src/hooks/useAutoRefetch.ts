// src/hooks/useAutoRefetch.ts
import { useEffect, useRef } from 'react';

type Opts = {
  /** ms giữa mỗi lần refetch khi tab đang hiển thị */
  interval?: number;            // mặc định 10000
  /** gọi refetch khi cửa sổ/Tab được focus trở lại */
  onFocus?: boolean;            // mặc định true
  /** gọi refetch khi thiết bị back online */
  onReconnect?: boolean;        // mặc định true
  /** hành vi khi tab ẩn: 'pause' (không refetch) | 'keep' (vẫn refetch) */
  whenHidden?: 'pause' | 'keep';// mặc định 'pause'
  /** chống “spam refetch” trong ~500ms */
  debounceMs?: number;          // mặc định 400
};

export default function useAutoRefetch(
  refetch: () => void | Promise<void>,
  {
    interval = 10000,
    onFocus = true,
    onReconnect = true,
    whenHidden = 'pause',
    debounceMs = 400,
  }: Opts = {}
) {
  const timerRef = useRef<number | null>(null);
  const lastCallRef = useRef<number>(0);

  const clear = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const safeCall = () => {
    const now = Date.now();
    if (now - lastCallRef.current < debounceMs) return;
    lastCallRef.current = now;
    Promise.resolve(refetch()).catch(() => {});
  };

  useEffect(() => {
    const start = () => {
      if (timerRef.current) return;
      timerRef.current = window.setInterval(() => {
        if (whenHidden === 'pause' && document.hidden) return;
        safeCall();
      }, interval);
    };
    start();

    const onVisibility = () => {
      if (document.hidden) {
        if (whenHidden === 'pause') clear();
      } else {
        // Tab quay lại: gọi ngay 1 lần + khởi động lại interval
        safeCall();
        start();
      }
    };

    const onFocusHandler = () => onFocus && safeCall();
    const onOnline = () => onReconnect && safeCall();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocusHandler);
    window.addEventListener('online', onOnline);

    return () => {
      clear();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocusHandler);
      window.removeEventListener('online', onOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interval, onFocus, onReconnect, whenHidden, debounceMs]);
}
// Lưu ý: không thêm refetch vào dependency array để tránh lặp vô hạn