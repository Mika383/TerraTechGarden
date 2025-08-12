import React from "react";
import { MessageOutlined } from "@ant-design/icons";
import { Button, Tooltip, Badge } from "antd";
import { useLocation } from "react-router-dom";
import { useTaggoAI } from "../../hooks/useTaggoAIWidget";

type UserLite = { id: string | number; fullName?: string; email?: string } | null;

export default function ChatFab({ user }: { user: UserLite }) {
  const Taggo = useTaggoAI({
    hideOnPaths: ["/checkout", "/login", "/register", "/auth/*"],
    identify: user ? { userId: user.id, name: user.fullName, email: user.email } : undefined,
  });

  const loc = useLocation();
  // Nếu đang ở trang ẩn -> không render UI
  if (["/checkout", "/login", "/register"].includes(loc.pathname) || loc.pathname.startsWith("/auth/")) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <Tooltip title="Hỏi AI">
        <Badge count={0} offset={[-3, 3]}>
          <Button
            type="primary"
            shape="round"
            size="large"
            icon={<MessageOutlined />}
            className="bg-emerald-600 hover:!bg-emerald-700 shadow-lg"
            onClick={() => Taggo.open()}
          >
            Chat
          </Button>
        </Badge>
      </Tooltip>
    </div>
  );
}
