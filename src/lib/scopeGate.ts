import { embed, cosine } from "./embeddings";
import { getTerrariumVector } from "./domainVectors";

const KEYWORDS = [
  "terrarium","bể kính","layout","rêu","fittonia","substrate","hardscape",
  "đèn terrarium","nấm mốc","độ ẩm","phun sương","đất","đá","lũa","trồng cây",
  "TerraTechgarden","đơn hàng terrarium","chăm sóc terrarium"
];

export type GateResult = { allowed: boolean; reason?: string; score?: number };

function keywordHit(q: string) {
  const qLower = q.toLowerCase();
  return KEYWORDS.some(k => qLower.includes(k));
}

// Cache kết quả cho cùng một câu hỏi (tránh embed lặp)
const memo = new Map<string, GateResult>();

// Giới hạn tốc độ: tối thiểu ~1.2s giữa các lần gọi embeddings
let lastCall = 0;
const MIN_INTERVAL_MS = 1200;
async function rateLimit() {
  const now = Date.now();
  const wait = MIN_INTERVAL_MS - (now - lastCall);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastCall = Date.now();
}

export async function allowTerrariumOnly(q: string): Promise<GateResult> {
  if (!q.trim()) return { allowed: false, reason: "empty" };

  // 1) Keyword-first: nếu trúng → cho qua, không gọi embeddings
  if (keywordHit(q)) return { allowed: true, reason: "keyword-pass", score: 1 };

  // 2) Trả về từ cache nếu có
  const hit = memo.get(q);
  if (hit) return hit;

  try {
    // 3) Rate-limit rồi mới gọi embeddings
    await rateLimit();

    const [qVec, scopeVec] = await Promise.all([embed(q), getTerrariumVector()]);
    const score = cosine(qVec, scopeVec);
    const allowed = score >= 0.75; // chỉnh 0.70–0.80 tùy độ nhạy

    const res: GateResult = { allowed, reason: allowed ? "embedding-pass" : "embedding-fail", score };
    memo.set(q, res);
    return res;
  } catch (e) {
    // 4) Fallback: không crash app; từ chối lịch sự
    const res: GateResult = { allowed: false, reason: "embedding-error" };
    memo.set(q, res);
    return res;
  }
}
