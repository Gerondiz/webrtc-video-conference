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
  autoComplete?: string;
}

export default function InputField({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  autoComplete,
}: InputFieldProps) {
  return (
    <div className="mb-6">
      {/* Метка связана с полем через атрибут htmlFor */}
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        id={id} // Уникальный ID
        name={name} // Имя для формы
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete} // Поддержка автозаполнения
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
}