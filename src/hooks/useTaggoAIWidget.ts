import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { loadTaggoAI, Taggo } from "@/lib/taggoai";

type Identify = { userId?: string | number; name?: string; email?: string; phone?: string };

function matchPath(pathname: string, patterns: string[]) {
  return patterns.some((p) => (p.endsWith("*") ? pathname.startsWith(p.slice(0, -1)) : pathname === p));
}

export function useTaggoAI(opts: { hideOnPaths: string[]; identify?: Identify; enabled?: boolean }) {
  const { hideOnPaths, identify, enabled = true } = opts;
  const loc = useLocation();

  const featureOn = import.meta.env.VITE_TAGGOAI_ENABLED === "true";
  const botId = import.meta.env.VITE_TAGGOAI_BOT_ID as string | undefined;
  const script = import.meta.env.VITE_TAGGOAI_SCRIPT as string | undefined;

  // 1) Load SDK + identify khi enabled=true, nếu false thì ẩn luôn
  useEffect(() => {
    if (!featureOn || !botId || !script) return;

    if (!enabled) {
      try { Taggo.hide?.(); (Taggo as any).identify?.({}); } catch {}
      return;
    }

    loadTaggoAI(botId, script)
      .then(() => { if (identify) Taggo.identify(identify); })
      .catch((e) => console.error("[TaggoAI] load/init error", e));
  }, [featureOn, botId, script, enabled, identify?.userId, identify?.email, identify?.phone, identify?.name]);

  // 2) Ẩn/hiện theo route + enabled
  useEffect(() => {
    if (!featureOn) return;
    const shouldHide = matchPath(loc.pathname, hideOnPaths);
    try {
      if (!enabled || shouldHide) Taggo.hide(); else Taggo.show();
    } catch {}
  }, [featureOn, enabled, loc.pathname, hideOnPaths]);

  // 3) Cleanup: đảm bảo ẩn khi unmount/disable
  useEffect(() => () => { try { Taggo.hide?.(); } catch {} }, []);

  return Taggo; // {open, close, show, hide, identify}
}
