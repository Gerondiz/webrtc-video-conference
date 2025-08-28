// src/app/page.tsx
'use client';

import React from 'react';
import Login from '@/components/LoginSimple';

export default function HomePage() {
  // const handleLogin = () => {
  //   console.log('User logged in successfully');
  // };

  return (
    <div>
      {/* <Login onLogin={handleLogin} /> */}
      <Login/>
    </div>
  );
}