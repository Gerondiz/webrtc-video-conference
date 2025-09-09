// src/components/ToastContainer.tsx
'use client';
import React from 'react';
import ToastComponent from './Toast';
import { useToast } from '@/contexts/ToastContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-0 right-0 z-50 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastComponent toast={toast} onClose={removeToast} />
        </div>
      ))}
    </div>
  );
}