import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button, Input, Tooltip, Avatar, Badge } from "antd";
import type { TextAreaRef } from "antd/es/input/TextArea";
import {
  MessageOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  CustomerServiceOutlined,
  AppstoreAddOutlined,
  PictureOutlined,
  SendOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Hook chat (giữ đường dẫn bạn đang dùng)
import { useOpenAIChat } from "../../../hook/useOpenAIChat";
import type { ChatType } from "../../../hook/useOpenAIChat";

gsap.registerPlugin(ScrollTrigger);

const TABS: { key: ChatType; label: string; icon: React.ReactNode }[] = [
  { key: "support", label: "CSKH", icon: <CustomerServiceOutlined /> },
  { key: "info", label: "Thông tin", icon: <InfoCircleOutlined /> },
  { key: "layout", label: "Layout", icon: <AppstoreAddOutlined /> },
  { key: "analysis", label: "Phân tích", icon: <PictureOutlined /> },
];

const FloatingChat: React.FC = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<ChatType>("info");

  // AntD TextArea ref (sửa TS2749)
  const inputRef = useRef<TextAreaRef>(null);

  const chatRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // 4 sessions cho 4 tab
  const support = useOpenAIChat("support");
  const info = useOpenAIChat("info");
  const layout = useOpenAIChat("layout");
  const analysis = useOpenAIChat("analysis");

  const current = useMemo(() => {
    switch (active) {
      case "support":
        return support;
      case "info":
        return info;
      case "layout":
        return layout;
      case "analysis":
        return analysis;
    }
  }, [active, support, info, layout, analysis]);

  const [text, setText] = useState("");

  useEffect(() => {
    if (!open || !chatRef.current || !headerRef.current) return;
    const tl = gsap.timeline();
    tl.fromTo(
      chatRef.current,
      { opacity: 0, y: 24, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: "power2.out" }
    );
    tl.fromTo(
      headerRef.current,
      { opacity: 0, y: -8 },
      { opacity: 1, y: 0, duration: 0.18, ease: "power2.out" },
      "-=0.08"
    );
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  // Ẩn ở trang checkout
  if (location.pathname === "/checkout") return null;

  const onSend = async () => {
    const v = text.trim();
    if (!v || !current) return;
    await current.sendText(v);
    setText("");
  };

  const onUpload: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await analysis.sendImage(
      file,
      "Hãy phân tích bố cục, cây, nền, ánh sáng và đề xuất cải thiện."
    );
    e.currentTarget.value = "";
  };

  return (
    <>
      {/* Nút mở chat (FAB) */}
      {!open && (
        <div className="fixed bottom-6 right-6 z-50">
          <Tooltip title="Hỏi AI về Terrarium">
            <Badge count={0} offset={[-3, 3]}>
              <Button
                type="primary"
                shape="round"
                size="large"
                icon={<MessageOutlined />}
                className="bg-emerald-600 hover:!bg-emerald-700 shadow-lg"
                onClick={() => setOpen(true)}
              >
                Chat
              </Button>
            </Badge>
          </Tooltip>
        </div>
      )}

      {/* Cửa sổ chat */}
      {open && (
        <div
          ref={chatRef}
          className="fixed bottom-6 right-6 z-50
                     w-[460px] max-w-[96vw]      /* rộng hơn */
                     h-[640px]                   /* cao hơn */
                     md:w-[480px] md:h-[680px]   /* màn lớn */
                     bg-white rounded-2xl shadow-2xl ring-1 ring-black/5
                     flex flex-col overflow-hidden font-roboto"
        >
          {/* Header (1 hàng, không xuống dòng) */}
          <div
            ref={headerRef}
            className="px-4 py-3 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600
                       text-white rounded-t-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
                <MessageOutlined />
              </div>
              <div className="leading-tight md:whitespace-nowrap">
                <div className="font-semibold truncate max-w-[320px] md:max-w-[360px]">
                  {active === "support" && "Chat CSKH • TerraTechgarden"}
                  {active === "info" && "Hỏi thông tin Terrarium"}
                  {active === "layout" && "Tạo layout Terrarium"}
                  {active === "analysis" && "Phân tích bể Terrarium (AI Vision)"}
                </div>
                <div className="text-xs text-white/80">
                  Trả lời tiếng Việt • Streaming
                </div>
              </div>
            </div>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => setOpen(false)}
              className="text-white hover:!text-yellow-300"
            />
          </div>

          {/* Tabs (một hàng; tràn thì scroll ngang) */}
          <div className="px-4 pt-2 pb-2 bg-white/70 backdrop-blur sticky top-0">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {TABS.map((t) => {
                const isActive = active === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setActive(t.key)}
                    className={`group inline-flex items-center justify-center gap-1 rounded-full border px-3 py-1.5 text-sm transition
                      whitespace-nowrap select-none
                      ${
                        isActive
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
                      }`}
                  >
                    <span className="text-base">{t.icon}</span>
                    <span className="font-medium">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-8 bg-gradient-to-b from-white to-slate-50">
            {current?.messages.map((m, i) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={i}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <Avatar
                      size={32}
                      style={{
                        background: "linear-gradient(145deg,#10b981,#059669)",
                      }}
                    >
                      AI
                    </Avatar>
                  )}
                  <div
                    className={`mx-2 max-w-[78%] rounded-2xl px-3 py-2 shadow-sm ring-1 ${
                      isUser
                        ? "bg-emerald-50 ring-emerald-100"
                        : "bg-white ring-slate-100"
                    }`}
                    style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                  >
                    <div
                      className={`text-[13px] ${
                        isUser ? "text-emerald-900" : "text-slate-800"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                  {isUser && (
                    <Avatar
                      size={32}
                      style={{ backgroundColor: "#e2e8f0", color: "#0f172a" }}
                    >
                      Bạn
                    </Avatar>
                  )}
                </div>
              );
            })}

            {current?.loading && (
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <LoadingOutlined /> AI đang soạn…
              </div>
            )}

            {/* Gợi ý ban đầu */}
            {!current?.messages.length && !current?.loading && (
              <div className="text-sm text-slate-500 space-y-2">
                <div>Gợi ý:</div>
                {active === "info" && (
                  <ul className="list-disc ml-5">
                    <li>“Cách chăm sóc terrarium mini 10×10?”</li>
                    <li>“Chọn cây nào bền cho người mới?”</li>
                    <li>“Xử lý mốc trắng trên rêu thế nào?”</li>
                  </ul>
                )}
                {active === "layout" && (
                  <ul className="list-disc ml-5">
                    <li>“Gợi ý layout rockscape tối giản, tông lạnh.”</li>
                    <li>“Danh sách vật liệu + kích thước bể 20×20.”</li>
                  </ul>
                )}
                {active === "analysis" && (
                  <div>Tải ảnh bể để AI phân tích chi tiết nha.</div>
                )}
              </div>
            )}
          </div>

          {/* Footer (1 hàng, không wrap) */}
          <div className="p-3 border-t bg-white rounded-b-2xl">
            <div className="flex items-end gap-2">
              {active === "analysis" && (
                <Tooltip title="Tải ảnh terrarium để AI phân tích">
                  <label className="inline-flex items-center justify-center h-9 w-9 rounded-lg border bg-white text-slate-600 hover:text-emerald-600 hover:border-emerald-300 cursor-pointer shrink-0">
                    <PictureOutlined />
                    <input type="file" accept="image/*" onChange={onUpload} hidden />
                  </label>
                </Tooltip>
              )}

              <Input.TextArea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    onSend();
                  }
                }}
                autoSize={{ minRows: 1, maxRows: 4 }}
                placeholder="Nhập tin nhắn… (Shift+Enter xuống dòng)"
                className="flex-1 rounded-xl border-slate-200 focus:!border-emerald-300 focus:!ring-emerald-200/60"
              />

              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={onSend}
                loading={current?.loading}
                className="bg-emerald-600 hover:!bg-emerald-700 h-9 px-4 rounded-xl shrink-0 whitespace-nowrap"
              >
                Gửi
              </Button>
            </div>
          </div>

          {/* fonts + helpers */}
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
            .font-roboto { font-family: 'Roboto', sans-serif; }
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
        </div>
      )}
    </>
  );
};

export default FloatingChat;
