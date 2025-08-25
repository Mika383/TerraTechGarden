// src/hooks/useTaggoAIWidget.ts
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { loadTaggoAI, Taggo } from "@/lib/taggoai";

type Identify = { userId?: string | number; name?: string; email?: string; phone?: string };

// ------- route helpers (chỉ tập trung phần ẩn theo trang) -------

// Chuẩn hóa path: về lowercase, bỏ slash thừa & slash cuối (trừ "/")
function normPath(p: string): string {
  const s = (p || "/").toLowerCase().replace(/\/+/g, "/");
  return s !== "/" ? s.replace(/\/$/, "") : "/";
}

/**
 * So khớp path với pattern:
 * - "exact": "/login" sẽ match "/login" và cả các nhánh con "/login/...".
 * - "prefix": "/staff/*" sẽ match "/staff" và mọi nhánh con.
 * - Hỗ trợ dấu "*" ở cuối hoặc bất kỳ vị trí (dùng regex an toàn).
 */
function matches(pathname: string, patterns: string[]): boolean {
  const path = normPath(pathname);
  return patterns.some((raw) => {
    let pat = normPath(raw);

    // "/abc/*" -> prefix check
    if (pat.endsWith("/*")) {
      const base = normPath(pat.slice(0, -2) || "/");
      return path === base || path.startsWith(base + "/");
    }

    // Không có "*" -> coi như exact + nhánh con ("/login" match cả "/login/xyz")
    if (!pat.includes("*")) {
      return path === pat || path.startsWith(pat + "/");
    }

    // Có "*" ở giữa -> fallback regex
    const escaped = pat.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\\\*/g, ".*");
    const re = new RegExp(`^${escaped}$`, "i");
    return re.test(path);
  });
}

function hasValidToken(): boolean {
  try {
    const t = localStorage.getItem("authToken");
    return !!t && t.split(".").length === 3;
  } catch {
    return false;
  }
}

// CSS force-hide để ẩn cả icon khi không được phép
let hideStyleEl: HTMLStyleElement | null = null;
function forceHide(flag: boolean) {
  if (flag) {
    if (!hideStyleEl) {
      hideStyleEl = document.createElement("style");
      hideStyleEl.id = "taggo-force-hide";
      hideStyleEl.textContent = `
        #taggoai-root, #taggoai-launcher, .taggo-launcher, .taggo-widget, .taggoai-container,
        [data-taggo-widget], iframe[src*="taggo"], .tg-widget, .tg-launcher,
        .chat-launcher, .chat-button, .widget-launcher {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `;
      document.head.appendChild(hideStyleEl);
    }
  } else if (hideStyleEl) {
    hideStyleEl.parentNode?.removeChild(hideStyleEl);
    hideStyleEl = null;
  }
}

/**
 * Hiển thị TaggoAI khi và chỉ khi:
 * - env bật (VITE_TAGGOAI_ENABLED === "true")
 * - có BOT_ID & SCRIPT
 * - enabled === true (membership ok + có userId từ ChatFab)
 * - KHÔNG nằm trong hideOnPaths (route bị chặn)
 * - CÓ token hợp lệ
 */
export function useTaggoAI(opts: { hideOnPaths: string[]; identify?: Identify; enabled?: boolean }) {
  const { hideOnPaths, identify, enabled = true } = opts;
  const loc = useLocation();

  const featureOn = import.meta.env.VITE_TAGGOAI_ENABLED === "true";
  const botId = import.meta.env.VITE_TAGGOAI_BOT_ID as string | undefined;
  const script = import.meta.env.VITE_TAGGOAI_SCRIPT as string | undefined;

  const allowed = featureOn && !!botId && !!script;
  const routeHidden = matches(loc.pathname, hideOnPaths);
  const shouldShow = allowed && enabled && !routeHidden && hasValidToken();

  // Ẩn/hiện ngay theo route (ưu tiên ẩn khi routeHidden)
  useEffect(() => {
    if (!allowed) return;
    if (shouldShow) {
      forceHide(false);
      try { Taggo.show?.(); } catch {}
    } else {
      forceHide(true);
      try { Taggo.hide?.(); (Taggo as any).close?.(); (Taggo as any).identify?.({}); } catch {}
    }
  }, [allowed, shouldShow, loc.pathname]);

  // Chỉ load SDK khi cần hiển thị
  useEffect(() => {
    if (!shouldShow) return;
    let cancelled = false;
    loadTaggoAI(botId!, script!)
      .then(() => {
        if (cancelled) return;
        try {
          if (identify) Taggo.identify(identify);
          Taggo.show?.();
        } catch {}
      })
      .catch((e) => console.error("[TaggoAI] load/init error", e));
    return () => { cancelled = true; };
  }, [shouldShow, botId, script, identify?.userId, identify?.email, identify?.phone, identify?.name]);

  // Cleanup
  useEffect(() => {
    return () => {
      try { Taggo.hide?.(); (Taggo as any).close?.(); } catch {}
      forceHide(false);
    };
  }, []);

  return Taggo;
}
