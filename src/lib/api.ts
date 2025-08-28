// src/lib/api.ts
import axios, { AxiosInstance } from 'axios';

const createApiClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_SIGNALING_SERVER,
    timeout: 10000, // 10 seconds
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Перехватчики запросов
  instance.interceptors.request.use(
    (config) => {
      console.log('Request:', config);
      return config;
    },
    (error) => {
      console.error('Request error:', error);
      return Promise.reject(error);
    }
  );

  // Перехватчики ответов
  instance.interceptors.response.use(
    (response) => {
      console.log('Response:', response);
      return response;
    },
    (error) => {
      console.error('Response error:', error);
      return Promise.reject(error);
    }
  );

  return instance;
};

export const apiClient = createApiClient();

// Методы для работы с сигнальным сервером
export const createRoom = async (username: string) => {
  try {
    const response = await apiClient.post('/api/create-room', { username });
    return response.data;
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};

export const joinRoom = async (roomId: string, username: string) => {
  try {
    const response = await apiClient.post('/api/join-room', { roomId, username });
    return response.data;
  } catch (error) {
    console.error('Error joining room:', error);
    throw error;
  }
};