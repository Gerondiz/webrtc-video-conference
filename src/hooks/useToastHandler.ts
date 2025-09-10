// src/hooks/useToastHandler.ts
'use client';

import { toast, ToastOptions } from 'react-toastify';

type ToastType = 'success' | 'error' | 'warning' | 'info';

export const useToastHandler = () => {
  const showToast = (message: string, type: ToastType, options?: ToastOptions) => {
    const defaultOptions: ToastOptions = {
      position: "top-right",
      autoClose: type === 'error' ? 5000 : 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    };

    switch (type) {
      case 'success':
        toast.success(message, defaultOptions);
        break;
      case 'error':
        toast.error(message, defaultOptions);
        break;
      case 'warning':
        toast.warn(message, defaultOptions);
        break;
      case 'info':
        toast.info(message, defaultOptions);
        break;
      default:
        toast(message, defaultOptions);
    }
  };

  const showError = (message: string, options?: ToastOptions) => {
    showToast(message, 'error', options);
  };

  const showSuccess = (message: string, options?: ToastOptions) => {
    showToast(message, 'success', options);
  };

  const showWarning = (message: string, options?: ToastOptions) => {
    showToast(message, 'warning', options);
  };

  const showInfo = (message: string, options?: ToastOptions) => {
    showToast(message, 'info', options);
  };

  return { showError, showSuccess, showWarning, showInfo, showToast };
};