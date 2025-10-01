// src/lib/api.ts
import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import { getSignalingUrl } from '@/lib/tunnel-url'; // ✅ Новый импорт

// Типы для API ответов
interface ApiResponse {
  success: boolean;
  message?: string;
  [key: string]: unknown;
}

interface CreateRoomResponse extends ApiResponse {
  roomId: string;
}

interface HealthCheckResponse extends ApiResponse {
  status: string;
  timestamp: number;
  rooms: number;
  maxRooms: number;
  maxUsers: number;
  sessionTimeout: number;
}

interface ApiError extends AxiosError {
  response?: AxiosResponse<ApiResponse>;
}

const createApiClient = async (): Promise<AxiosInstance> => { // ✅ Сделан async
  // ✅ Получаем URL динамически
  const baseURL = await getSignalingUrl(process.env.NEXT_PUBLIC_SIGNALING_SERVER || 'https://backend-mediasoup.onrender.com');
  console.log('🔧 Creating Axios client with baseURL:', baseURL); // ✅ Лог

  const instance = axios.create({
    baseURL: baseURL, // ✅ Используем динамический URL
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Интерцептор для обработки ошибок
  instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => response,
    (error: ApiError) => {
      console.error('API Error:', error);

      // Обработка ошибок от сервера
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.code === 'ECONNABORTED') {
        toast.error('Server connection timeout. Please try again.');
      } else if (!error.response) {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

// ✅ Убираем кэширование, каждый вызов будет получать свежий URL
export const getApiClient = async (): Promise<AxiosInstance> => {
  return await createApiClient(); // <--- Всегда создаём новый клиент
};

export const createRoom = async (username: string): Promise<CreateRoomResponse> => {
  const apiClient = await getApiClient(); // ✅ Используем асинхронный клиент
  try {
    console.log('📤 createRoom: Calling API with baseURL:', apiClient.defaults.baseURL); // ✅ Лог
    const response = await apiClient.post<CreateRoomResponse>('/api/create-room', { username });
    return response.data;
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};

export const joinRoom = async (roomId: string, username: string): Promise<ApiResponse> => {
  const apiClient = await getApiClient(); // ✅
  try {
    console.log('📤 joinRoom: Calling API with baseURL:', apiClient.defaults.baseURL); // ✅ Лог
    const response = await apiClient.post<ApiResponse>('/api/join-room', { roomId, username });
    return response.data;
  } catch (error) {
    console.error('Error joining room:', error);
    throw error;
  }
};

export const checkServerStatus = async (): Promise<HealthCheckResponse> => {
  const apiClient = await getApiClient(); // ✅
  try {
    console.log('📤 checkServerStatus: Calling API with baseURL:', apiClient.defaults.baseURL); // ✅ Лог
    const response = await apiClient.get<HealthCheckResponse>('/api/health');
    return response.data;
  } catch (error) {
    console.error('Server health check failed:', error);
    throw error;
  }
};

// ✅ Объявляем объект как переменную перед экспортом
const api = {
  createRoom,
  joinRoom,
  checkServerStatus,
};

export default api;