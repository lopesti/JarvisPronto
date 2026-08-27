import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar token no futuro
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("jarvis_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ========== ENDPOINTS ==========

export const getStats = async () => {
  const { data } = await api.get("/api/stats");
  return data;
};

export const getConversations = async () => {
  const { data } = await api.get("/api/conversations");
  return data;
};

export const getMessages = async (phone: string) => {
  const { data } = await api.get(`/api/messages/${phone}`);
  return data;
};

export const getLeads = async () => {
  const { data } = await api.get("/api/leads");
  return data;
};

export const getPipeline = async () => {
  const { data } = await api.get("/api/pipeline");
  return data;
};

export const sendMessage = async (phone: string, message: string) => {
  const { data } = await api.post("/api/send", { phone, message });
  return data;
};

export const getHealth = async () => {
  const { data } = await api.get("/health");
  return data;
};
