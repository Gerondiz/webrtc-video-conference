// src/lib/tunnel-url.ts

/**
 * Получает URL для сигнализации (SFU) или WebSocket.
 * Если включён флаг USE_DYNAMIC_TUNNEL_URL и URL доступен через API — использует его.
 * Иначе — возвращает URL из переменной окружения.
 */
export const getSignalingUrl = async (defaultUrl: string): Promise<string> => {
  if (process.env.USE_DYNAMIC_TUNNEL_URL === 'true') {
    try {
      const response = await fetch('/api/tunnel-url');
      if (response.ok) {
        const data = await response.json();
        return data.url;
      } else {
        console.warn('⚠️ Failed to fetch tunnel URL from API, falling back to env.');
      }
    } catch (error) {
      console.error('❌ Error fetching tunnel URL from API:', error);
    }
  }
  return defaultUrl;
};

/**
 * То же самое для WebSocket URL.
 */
export const getWebSocketUrl = async (defaultWsUrl: string): Promise<string> => {
  if (process.env.USE_DYNAMIC_TUNNEL_URL === 'true') {
    try {
      const response = await fetch('/api/tunnel-url');
      if (response.ok) {
        const data = await response.json();
        // Заменяем протокол на wss, если URL получен динамически
        return data.url.replace(/^https?:\/\//, 'wss://');
      } else {
        console.warn('⚠️ Failed to fetch tunnel URL from API for WebSocket, falling back to env.');
      }
    } catch (error) {
      console.error('❌ Error fetching tunnel URL from API for WebSocket:', error);
    }
  }
  return defaultWsUrl;
};