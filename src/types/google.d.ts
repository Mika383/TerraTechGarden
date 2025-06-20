// src/types/google.d.ts
interface GoogleAccounts {
  id: {
    initialize: (config: {
      client_id: string;
      callback: (response: { credential: string; select_by?: string }) => void;
      auto_select?: boolean;
    }) => void;
    prompt: () => void;
  };
}

interface Google {
  accounts: GoogleAccounts;
}

declare global {
  interface Window {
    google?: Google;
  }
}