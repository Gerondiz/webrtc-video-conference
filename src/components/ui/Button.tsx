// src/components/ui/Button.tsx
'use client';

import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  href?: string; // Для обработки ссылок
  className?: string;
  disabled?: boolean;
}

export default function Button({ children, onClick, title, href, className, disabled }: ButtonProps) {
  const baseStyles = `inline-flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
    disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-80'
  }`;

  if (href) {
    return (
      <a
        title={title}
        href={href}
        className={`${baseStyles} ${className}`}
        onClick={(e) => {
          if (disabled) e.preventDefault();
        }}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${className}`}
    >
      {children}
    </button>
  );
}