// src/app/page.tsx
'use client';

import { useRouter } from 'next/navigation';

export default function StartPage() {
  const router = useRouter();

  // Обработчик нажатия кнопки
  const handleNavigateToLogin = () => {
    router.push('/login'); // Переход на страницу Login
  };

  return (
    <div>
      {/* Поле ввода */}
      <input type="text" placeholder="Enter something..." />

      {/* Кнопка для перехода */}
      <button onClick={handleNavigateToLogin}>Go to Login</button>
    </div>
  );
}