// src/lib/openrouter.ts
const BASE = "https://openrouter.ai/api/v1";

function commonHeaders() {
  return {
    Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    // Hai header này OpenRouter khuyến khích khi gọi từ browser
    "HTTP-Referer": window.location.origin,
    "X-Title": "TerraTechgarden Chat",
  };
}

// Gọi /responses (non-stream) nếu cần
export async function orCreate(body: any) {
  const resp = await fetch(`${BASE}/responses`, {
    method: "POST",
    headers: commonHeaders(),
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`OpenRouter ${resp.status}`);
  return resp.json();
}

// Gọi /responses stream (SSE)
export async function orStream(body: any) {
  const resp = await fetch(`${BASE}/responses`, {
    method: "POST",
    headers: commonHeaders(),
    body: JSON.stringify({ ...body, stream: true }),
  });
  if (!resp.ok || !resp.body) throw new Error(`OpenRouter stream ${resp.status}`);
  return resp.body.getReader(); // trả về ReadableStreamDefaultReader
}
export async function orChatStream(body: any) {
  const resp = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: commonHeaders(),
    body: JSON.stringify({ ...body, stream: true }),
  });
  if (!resp.ok || !resp.body) throw new Error(`OpenRouter stream ${resp.status}`);
  return resp.body.getReader();
}