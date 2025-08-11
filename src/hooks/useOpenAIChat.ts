import { useRef, useState } from "react";
import { allowTerrariumOnly } from "@/lib/scopeGate";
import { orChatStream } from "@/lib/openrouter";

type Role = "user" | "assistant";
export type ChatType = "support" | "info" | "layout" | "analysis";

const SCOPE_POLICY = `
Bạn chỉ hỗ trợ các câu hỏi LIÊN QUAN đến Terrarium (thiết kế, bố cục, cây, nền, đèn, chăm sóc, lỗi, vật liệu, sản phẩm TerraTechgarden, CSKH liên quan đơn hàng Terrarium).
Nếu câu hỏi KHÔNG liên quan, hãy từ chối lịch sự bằng tiếng Việt...
`;

const SYSTEM_BY_TYPE: Record<ChatType, string> = {
  support: `Bạn là CSKH TerraTech. ${SCOPE_POLICY}`,
  info:    `Bạn là AI Terrarium Info. ${SCOPE_POLICY}`,
  layout:  `Bạn là AI Layout Creator. ${SCOPE_POLICY} Trả lời theo từng bước rõ ràng.`,
  analysis:`Bạn là AI Terrarium Analyzer. ${SCOPE_POLICY} Phân tích ảnh ngắn gọn, gợi ý cải thiện thực tế.`,
};

const MODEL = "openai/gpt-4o-mini"; // model free trên OpenRouter

export function useOpenAIChat(chatType: ChatType) {
  const [messages, setMessages] = useState<{ role: Role; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // --- helpers ---
  function toChatMessages(ms: { role: Role; content: string }[]) {
    return ms.map(m => ({ role: m.role, content: m.content }));
  }
  function parseSSEChunk(chunk: string, onDelta: (txt: string) => void) {
    // OpenRouter /chat/completions stream -> lines "data: {...}"
    const lines = chunk.split("\n").map(s => s.trim()).filter(Boolean);
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const evt = JSON.parse(data);
        const delta = evt?.choices?.[0]?.delta?.content ?? "";
        if (delta) onDelta(delta);
      } catch { /* ignore parse errors */ }
    }
  }

  async function sendText(text: string) {
    const gate = await allowTerrariumOnly(text);
    if (!gate.allowed) {
      const msg = gate.reason === "embedding-error"
        ? "Hệ thống đang quá tải. Hãy thử lại, hoặc thêm từ khóa 'terrarium'."
        : "Xin lỗi, mình chỉ hỗ trợ chủ đề Terrarium. Bạn có thể hỏi về bố cục, cây, nền, đèn, chăm sóc… nhé.";
      setMessages(m => [...m, { role: "assistant", content: msg }]);
      return;
    }

    setMessages(m => [...m, { role: "user", content: text }]);
    setLoading(true);

    const body = {
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_BY_TYPE[chatType] },
        ...toChatMessages(messages),
        { role: "user", content: text }
      ],
      temperature: 0.7,
    };

    try {
      abortRef.current = new AbortController();
      const reader = await orChatStream(body);
      const decoder = new TextDecoder();
      let acc = "";
      setMessages(m => [...m, { role: "assistant", content: "" }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        parseSSEChunk(decoder.decode(value, { stream: true }), (delta) => {
          acc += delta;
          setMessages(m => {
            const copy = m.slice();
            copy[copy.length - 1] = { role: "assistant", content: acc };
            return copy;
          });
        });
      }
    } catch (e) {
      setMessages(m => [...m, { role: "assistant", content: "Không nhận được phản hồi từ máy chủ AI. Thử lại sau nhé." }]);
    } finally {
      setLoading(false);
    }
  }

  async function sendImage(file: File, caption?: string) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(file);
    });

    setMessages(m => [...m, { role: "user", content: (caption ?? "Ảnh tải lên") + "\n(đính kèm ảnh)" }]);
    setLoading(true);

    // Chat Completions: vision => content là mảng parts
    const body = {
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_BY_TYPE["analysis"] },
        ...toChatMessages(messages),
        {
          role: "user",
          content: [
            { type: "text", text: caption ?? "Phân tích bể terrarium trong ảnh này." },
            { type: "image_url", image_url: dataUrl }
          ]
        } as any
      ],
      temperature: 0.7,
    };

    try {
      abortRef.current = new AbortController();
      const reader = await orChatStream(body);
      const decoder = new TextDecoder();
      let acc = "";
      setMessages(m => [...m, { role: "assistant", content: "" }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        parseSSEChunk(decoder.decode(value, { stream: true }), (delta) => {
          acc += delta;
          setMessages(m => {
            const copy = m.slice();
            copy[copy.length - 1] = { role: "assistant", content: acc };
            return copy;
          });
        });
      }
    } catch (e) {
      setMessages(m => [...m, { role: "assistant", content: "Không nhận được phản hồi từ máy chủ AI (vision). Thử lại sau nhé." }]);
    } finally {
      setLoading(false);
    }
  }

  function stop() { abortRef.current?.abort(); setLoading(false); }

  return { messages, sendText, sendImage, stop, loading };
}
