// src/components/ui/InputField.tsx
'use client';

import React from 'react';

interface InputFieldProps {
  id?: string;
  name?: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string; // Добавляем поддержку autoComplete
}

export default function InputField({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  autoComplete, // Принимаем autoComplete как пропс
}: InputFieldProps) {
  return (
    <div className="mb-6">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete} // Передаем autoComplete в <input>
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
}