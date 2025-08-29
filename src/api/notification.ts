import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface CreateWebNotificationReq {
  userId: number;
  title: string;
  description: string;
  broadcastToAll?: boolean;
}

export interface CreateWebNotificationRes {
  status: number;
  message: string;
  data?: {
    notificationId: number;
    userId: number;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
  };
}

const authHeader = () => {
  const token = localStorage.getItem("authToken");
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const createWebNotification = async (payload: CreateWebNotificationReq) => {
  const res = await axios.post<CreateWebNotificationRes>(
    `${BASE_URL}/Notification/web/create`,
    {
      userId: payload.userId,
      title: payload.title,
      description: payload.description, // BE field “description”
      broadcastToAll: payload.broadcastToAll ?? false,
    }
  );
  return res.data;
};
 export const getNotificationsByUser = async (userId: number) => {
  const res = await axios.get(`${BASE_URL}/Notification/get-by-user/${userId}`, authHeader());
  return (res.data?.data ?? []) as {
    notificationId: number;
    userId: number;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
  }[];
};