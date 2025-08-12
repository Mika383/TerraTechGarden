// src/main.tsx
import './index.css';
import 'react-toastify/dist/ReactToastify.css';
import 'antd/dist/reset.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { MembershipProvider } from '@/store/membership'; // ⬅️ THÊM

if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <MembershipProvider>
        <App />
      </MembershipProvider>
    </BrowserRouter>
  </StrictMode>
);
