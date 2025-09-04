// src/lib/axios/axiosInstance.ts
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';

/** Augment để tránh TS error khi dùng _retry */
declare module 'axios' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface InternalAxiosRequestConfig<D = any> {
    _retry?: boolean;
  }
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

/** Tạo instance dùng chung cho toàn app */
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
});

/** ===== Refresh Queue chống đua tranh ===== */
let isRefreshing = false;
type QueueItem = {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
};
let failedQueue: QueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error || !token) p.reject(error);
    else p.resolve(token);
  });
  failedQueue = [];
};

/** ===== Helpers ===== */
function getAuthToken(): string | null {
  try {
    return localStorage.getItem('authToken');
  } catch {
    return null;
  }
}
function getRefreshToken(): string | null {
  try {
    return localStorage.getItem('refreshToken');
  } catch {
    return null;
  }
}

function broadcastTokenRefreshed() {
  try {
    window.dispatchEvent(new Event('tokenRefreshed'));
  } catch {}
}

function broadcastMembership(has: boolean) {
  try {
    localStorage.setItem('hasMembership', has ? '1' : '0');
    window.dispatchEvent(
      new CustomEvent('membershipChanged', { detail: { hasMembership: has } }),
    );
  } catch {}
}

/** Khi không thể refresh -> đăng xuất + điều hướng login */
function logoutAndRedirect() {
  try {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    // đồng bộ Gate/ChatFab ẩn ngay
    broadcastMembership(false);
    broadcastTokenRefreshed();
  } catch {}

  // Không toast ở tầng infra để tránh lệ thuộc UI; nếu cần, toast ở màn hình gọi
  window.location.href = '/login';
}

/** ===== Interceptors ===== */

// Gắn Bearer cho mọi request
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Bắt 401 -> refresh token -> replay request
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config as InternalAxiosRequestConfig | undefined;

    // Không có config hoặc không phải 401 -> trả lỗi
    if (!originalRequest || status !== 401) {
      return Promise.reject(error);
    }

    // Tránh lặp vô hạn
    if (originalRequest._retry) {
      // Nếu đã retry mà vẫn 401 -> fail hẳn
      logoutAndRedirect();
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    // Nếu đang refresh -> đưa request này vào hàng đợi
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            try {
              originalRequest.headers = originalRequest.headers ?? {};
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            } catch (e) {
              reject(e);
            }
          },
          reject,
        });
      });
    }

    // Bắt đầu refresh
    isRefreshing = true;

    const rft = getRefreshToken();
    if (!rft) {
      // Không có refreshToken -> đăng xuất
      isRefreshing = false;
      logoutAndRedirect();
      return Promise.reject(error);
    }

    try {
      // Dùng axios gốc để tránh interceptor lồng nhau
      const resp = await axios.post(
        `${BASE_URL}/Users/refresh-token`,
        { refreshToken: rft },
        { headers: { 'Content-Type': 'application/json' } },
      );

      const newToken: string | undefined = (resp.data as any)?.token;
      const newRefresh: string | undefined = (resp.data as any)?.refreshToken;

      if (!newToken) {
        throw new Error('No token returned from refresh-token endpoint');
      }

      // Lưu token/refreshToken mới
      localStorage.setItem('authToken', newToken);
      if (newRefresh) localStorage.setItem('refreshToken', newRefresh);

      // Cập nhật header mặc định
      api.defaults.headers.common.Authorization = `Bearer ${newToken}`;

      // Phát sự kiện để toàn app đồng bộ (Gate/ChatFab đang lắng nghe)
      broadcastTokenRefreshed();

      // Xử lý lại hàng đợi
      processQueue(null, newToken);

      // Gắn token mới cho request gốc rồi replay
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (err) {
      // Refresh thất bại -> fail hết hàng đợi + đăng xuất
      processQueue(err, null);
      logoutAndRedirect();
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
