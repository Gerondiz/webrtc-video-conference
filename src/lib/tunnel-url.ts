// src/lib/tunnel-url.ts

/**
 * Получает URL для сигнализации (SFU) или WebSocket.
 * Если включён флаг USE_DYNAMIC_TUNNEL_URL и URL доступен через API — использует его.
 * Иначе — возвращает URL из переменной окружения.
 */
export const getSignalingUrl = async (defaultUrl: string): Promise<string> => {
  console.log('🔍 getSignalingUrl called with defaultUrl:', defaultUrl); // ✅ Лог
  if (process.env.NEXT_PUBLIC_USE_DYNAMIC_TUNNEL_URL === 'true') { // Убедимся, что NEXT_PUBLIC_
    console.log('🔄 USE_DYNAMIC_TUNNEL_URL is true, fetching from API...'); // ✅ Лог
    try {
      const response = await fetch('/api/tunnel-url'); // Убедимся, что это относительный путь к API на том же домене
      console.log('📥 Fetched response from /api/tunnel-url, status:', response.status); // ✅ Лог
      if (response.ok) {
        const data = await response.json();
        console.log('📥 Fetched tunnel URL from API:', data.url); // ✅ Лог
        return data.url;
      } else {
        console.warn('⚠️ Failed to fetch tunnel URL from API (not ok status), falling back to env. Status:', response.status); // ✅ Лог
      }
    } catch (error) {
      console.error('❌ Error fetching tunnel URL from API:', error); // ✅ Лог
    }
  } else {
     console.log('🔄 USE_DYNAMIC_TUNNEL_URL is not true, using env default'); // ✅ Лог
  }
  console.log('🔄 Falling back to default URL:', defaultUrl); // ✅ Лог
  return defaultUrl;
};

/**
 * То же самое для WebSocket URL.
 */
export const getWebSocketUrl = async (defaultWsUrl: string): Promise<string> => {
  console.log('🔍 getWebSocketUrl called with defaultWsUrl:', defaultWsUrl); // ✅ Лог
  if (process.env.NEXT_PUBLIC_USE_DYNAMIC_TUNNEL_URL === 'true') { // Убедимся, что NEXT_PUBLIC_
    console.log('🔄 USE_DYNAMIC_TUNNEL_URL is true, fetching tunnel URL for WebSocket...'); // ✅ Лог
    try {
      const response = await fetch('/api/tunnel-url');
      console.log('📥 Fetched response from /api/tunnel-url for WS, status:', response.status); // ✅ Лог
      if (response.ok) {
        const data = await response.json();
        // Заменяем протокол на wss, если URL получен динамически
        const wssUrl = data.url.replace(/^https?:\/\//, 'wss://');
        console.log('📥 Fetched WebSocket URL from API:', wssUrl); // ✅ Лог
        return wssUrl;
      } else {
        console.warn('⚠️ Failed to fetch tunnel URL from API for WebSocket (not ok status), falling back to env. Status:', response.status); // ✅ Лог
      }
    } catch (error) {
      console.error('❌ Error fetching tunnel URL from API for WebSocket:', error); // ✅ Лог
    }
  } else {
     console.log('🔄 USE_DYNAMIC_TUNNEL_URL is not true for WS, using env default'); // ✅ Лог
  }
  console.log('🔄 Falling back to default WebSocket URL:', defaultWsUrl); // ✅ Лог
  return defaultWsUrl;
};