// src/lib/embeddings.ts
const BASE = "https://openrouter.ai/api/v1";

function headers() {
  return {
    Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": window.location.origin,
    "X-Title": "TerraTechgarden Chat",
  };
}

export async function embed(text: string) {
  const resp = await fetch(`${BASE}/embeddings`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      model: "openai/text-embedding-3-small",
      input: text,
    }),
  });
  if (!resp.ok) throw new Error(`Embeddings ${resp.status}`);
  const data = await resp.json();
  return data.data[0].embedding as number[];
}

export function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
