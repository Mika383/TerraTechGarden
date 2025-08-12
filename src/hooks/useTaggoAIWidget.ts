import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { loadTaggoAI, Taggo } from "@/lib/taggoai";

type Identify = { userId?: string | number; name?: string; email?: string; phone?: string };

function matchPath(pathname: string, patterns: string[]) {
  return patterns.some((p) => p.endsWith("*") ? pathname.startsWith(p.slice(0, -1)) : pathname === p);
}

export function useTaggoAI(opts: { hideOnPaths: string[]; identify?: Identify }) {
  const { hideOnPaths, identify } = opts;
  const loc = useLocation();
  const enabled = import.meta.env.VITE_TAGGOAI_ENABLED === "true";
  const botId = import.meta.env.VITE_TAGGOAI_BOT_ID as string | undefined;
  const script = import.meta.env.VITE_TAGGOAI_SCRIPT as string | undefined;

  // load once
  useEffect(() => {
    if (!enabled || !botId || !script) return;
    loadTaggoAI(botId, script).then(() => {
      if (identify) Taggo.identify(identify);
    }).catch((e) => console.error("[TaggoAI] load/init error", e));
  }, [enabled, botId, script, identify?.userId, identify?.email]);

  // hide/show by route
  useEffect(() => {
    if (!enabled) return;
    const shouldHide = matchPath(loc.pathname, hideOnPaths);
    if (shouldHide) Taggo.hide(); else Taggo.show();
  }, [enabled, loc.pathname, hideOnPaths]);

  return Taggo; // { open, close, show, hide, identify }
}
