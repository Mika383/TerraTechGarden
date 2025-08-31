import React from 'react';
import { ToastContainer, Slide, toast, ToastOptions, Id } from 'react-toastify';
import AppRoutes from './route/routes';
import { GoogleOAuthProvider } from '@react-oauth/google';
import 'react-toastify/dist/ReactToastify.css';
import ChatFab from '@/components/common/ChatFab';

// TODO: thay bằng context/store auth thật
function getCurrentUser() {
  try {
    const raw = localStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// Quản lý toast IDs
class ToastManager {
  static toastIds: Id[] = [];
  static maxToasts: number = 2;

  static addToast(toastId: Id): void {
    this.toastIds.push(toastId);
    
    // Nếu vượt quá giới hạn, xóa toast cũ nhất
    if (this.toastIds.length > this.maxToasts) {
      const oldestToastId = this.toastIds.shift();
      if (oldestToastId) {
        toast.dismiss(oldestToastId);
      }
    }
  }

  static removeToast(toastId: Id): void {
    this.toastIds = this.toastIds.filter(id => id !== toastId);
  }
}

// Custom toast function
export const customToast = {
  success: (message: string, options: ToastOptions = {}): Id => {
    const toastId = toast.success(message, {
      ...options,
      onClose: () => ToastManager.removeToast(toastId)
    });
    ToastManager.addToast(toastId);
    return toastId;
  },
  error: (message: string, options: ToastOptions = {}): Id => {
    const toastId = toast.error(message, {
      ...options,
      onClose: () => ToastManager.removeToast(toastId)
    });
    ToastManager.addToast(toastId);
    return toastId;
  },
  info: (message: string, options: ToastOptions = {}): Id => {
    const toastId = toast.info(message, {
      ...options,
      onClose: () => ToastManager.removeToast(toastId)
    });
    ToastManager.addToast(toastId);
    return toastId;
  },
  warning: (message: string, options: ToastOptions = {}): Id => {
    const toastId = toast.warning(message, {
      ...options,
      onClose: () => ToastManager.removeToast(toastId)
    });
    ToastManager.addToast(toastId);
    return toastId;
  },
  default: (message: string, options: ToastOptions = {}): Id => {
    const toastId = toast(message, {
      ...options,
      onClose: () => ToastManager.removeToast(toastId)
    });
    ToastManager.addToast(toastId);
    return toastId;
  }
};

const App: React.FC = () => {
  const user = getCurrentUser();

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <>
        <AppRoutes />
        <ChatFab />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          pauseOnHover
          draggable
          theme="light"
          transition={Slide}
          className="mt-12"
          toastClassName="rounded-xl shadow-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 font-semibold"
          progressClassName="bg-white opacity-80"
          // Không dùng limit prop
        />
      </>
    </GoogleOAuthProvider>
  );
};

export default App;