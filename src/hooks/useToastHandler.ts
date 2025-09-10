// src/hooks/useToastHandler.ts
'use client';

import { toast, ToastOptions } from 'react-toastify';

type ToastType = 'success' | 'error' | 'warning' | 'info';

export const useToastHandler = () => {
  const defaultOptions: ToastOptions = {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    pauseOnFocusLoss: true,
    theme: "colored",
  };

  const showToast = (message: string, type: ToastType, options?: ToastOptions) => {
    const toastOptions: ToastOptions = {
      ...defaultOptions,
      ...options
    };

    switch (type) {
      case 'success':
        toast.success(message, toastOptions);
        break;
      case 'error':
        toast.error(message, toastOptions);
        break;
      case 'warning':
        toast.warn(message, toastOptions);
        break;
      case 'info':
        toast.info(message, toastOptions);
        break;
      default:
        toast(message, toastOptions);
    }
  };

  const showError = (message: string, options?: ToastOptions) => {
    showToast(message, 'error', { autoClose: 6000, ...options });
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