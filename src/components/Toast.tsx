// src/components/Toast.tsx
'use client';
import React, { useEffect, useRef } from 'react';
import { Toast as ToastType } from '@/types';

interface ToastProps {
  toast: ToastType;
  onClose: (id: string) => void;
}

export default function Toast({ toast, onClose }: ToastProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (toast.duration) {
      timeoutRef.current = setTimeout(() => {
        onClose(toast.id);
      }, toast.duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [toast.id, toast.duration, onClose]);

  const getToastClasses = () => {
    const baseClasses = "fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white max-w-md transform transition-all duration-300 ease-in-out";
    
    switch (toast.type) {
      case 'success':
        return `${baseClasses} bg-green-500`;
      case 'error':
        return `${baseClasses} bg-red-500`;
      case 'warning':
        return `${baseClasses} bg-yellow-500`;
      case 'info':
        return `${baseClasses} bg-blue-500`;
      default:
        return `${baseClasses} bg-gray-500`;
    }
  };

  return (
    <div className={getToastClasses()}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-sm">{toast.message}</p>
        </div>
        <button
          onClick={() => onClose(toast.id)}
          className="ml-4 text-white hover:text-gray-200 focus:outline-none"
          aria-label="Close notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}