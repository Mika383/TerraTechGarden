type Identify = { userId?: string | number; name?: string; email?: string; phone?: string };

declare global {
  interface Window {
    TaggoAI?: {
      init: (opts: { botId: string }) => void;
      open?: () => void; close?: () => void;
      show?: () => void; hide?: () => void;
      identify?: (payload: Identify) => void;
    };
  }
}

const SCRIPT_ID = "taggoai-script";

export function loadTaggoAI(botId: string, src: string) {
  return new Promise<void>((resolve, reject) => {
    // nếu đã có script với data-taggo-botid thì bỏ qua
    if (document.querySelector('script[data-taggo-botid]')) { resolve(); return; }

    const s = document.createElement('script');
    s.id = 'taggoai-script';
    s.type = 'text/javascript';

    // 👉 ĐẶT ATTRIBUTE TRƯỚC
    s.setAttribute('data-taggo-botid', String(botId));

    s.async = true;
    s.src = src; // https://chat.taggoai.com/v2.js

    s.onload = () => { resolve(); };
    s.onerror = () => reject(new Error('Failed to load TaggoAI script'));

    // nên gắn vào <head> để chắc chắn currentScript nhận đúng
    document.head.appendChild(s);
  });
}



export const Taggo = {
  open: () => window.TaggoAI?.open?.(),
  close: () => window.TaggoAI?.close?.(),
  show: () => window.TaggoAI?.show?.(),
  hide: () => window.TaggoAI?.hide?.(),
  identify: (p: Identify) => window.TaggoAI?.identify?.(p),
};
