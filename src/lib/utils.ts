// src/lib/utils.ts
import { MediaDevicesStatus } from '@/types';

export const generateUsername = (): string => {
  const adjectives = ['Happy', 'Sunny', 'Clever', 'Brave', 'Calm', 'Swift', 'Gentle', 'Wise', 'Bright', 'Free'];
  const nouns = ['Tiger', 'Eagle', 'Dolphin', 'Panda', 'Fox', 'Wolf', 'Hawk', 'Lion', 'Owl', 'Bear'];
  const randomNum = Math.floor(Math.random() * 1000);

  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]
    }${randomNum}`;
};

export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export async function checkMediaDevices(): Promise<MediaDevicesStatus> {
  try {
    // Запрашиваем разрешение на доступ к устройствам, чтобы получить полную информацию
    await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

    // Получаем список всех доступных устройств
    const devices = await navigator.mediaDevices.enumerateDevices();

    // Проверяем наличие камер и микрофонов
    const hasCamera = devices.some(device => device.kind === 'videoinput' && device.deviceId !== '');
    const hasMicrophone = devices.some(device => device.kind === 'audioinput' && device.deviceId !== '');

    // Выводим результаты проверки
    if (hasCamera && hasMicrophone) {
      console.log('Подключены и камера, и микрофон.');
    } else if (hasCamera) {
      console.log('Подключена только камера.');
    } else if (hasMicrophone) {
      console.log('Подключен только микрофон.');
    } else {
      console.log('Ни одно устройство не подключено.');
    }

    return { hasCamera, hasMicrophone };
  } catch (error) {
    console.error('Ошибка при проверке устройств:', error);

    // Если пользователь отказал в доступе, все равно пытаемся определить устройства
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some(device => device.kind === 'videoinput');
      const hasMicrophone = devices.some(device => device.kind === 'audioinput');

      return { hasCamera, hasMicrophone };
    } catch (err) {
      console.error('Не удалось получить список устройств:', err);
      return { hasCamera: false, hasMicrophone: false };
    }
  }
}

export async function getMediaDevicesWithPermissions(constraints: MediaStreamConstraints): Promise<MediaStream> {
  try {
    console.log('Запрашиваем доступ с constraints:', constraints);

    // Запрашиваем доступ к медиаустройствам
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log('Доступ к медиапотоку получен:', stream);

    return stream;
  } catch (error) {
    console.error('Ошибка при получении доступа к медиаустройствам:', error);
    throw new Error('Не удалось получить доступ к медиаустройствам');
  }
}

/**
 * Проверяет, поддерживается ли WebRTC в браузере
 */
export const checkWebRTCSupport = (): boolean => {
  return !!(
    navigator.mediaDevices &&
    'getUserMedia' in navigator.mediaDevices &&
    'RTCPeerConnection' in window
  );
};

/**
 * Создает тестовое WebRTC соединение для проверки TURN сервера
 */
export const testTURNConnection = async (
  turnServer: string,
  username: string,
  credential: string
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const candidates: string[] = [];

    try {
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          {
            urls: "stun:stun.l.google.com:19302",
          },
          {
            urls: "turn:sfu.ddns.net:80",
            username: "turnuser",
            credential: "12345678",
          },
          {
            urls: "turn:sfu.ddns.net?transport=tcp",
            username: "turnuser",
            credential: "12345678",
          },
        ],

        iceCandidatePoolSize: 3,
      });

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          const candidateString = `${event.candidate.type} - ${event.candidate.protocol} - ${event.candidate.address}:${event.candidate.port}`;
          candidates.push(candidateString);
        } else {
          // Все кандидаты собраны
          resolve(candidates);
        }
      };

      peerConnection.oniceconnectionstatechange = () => {
        if (peerConnection.iceConnectionState === 'failed') {
          reject(new Error('ICE соединение не удалось'));
        }
      };

      // Создаем data channel для инициации ICE-кандидатов
      peerConnection.createDataChannel('test');

      // Создание SDP-offer
      peerConnection.createOffer()
        .then(offer => peerConnection.setLocalDescription(offer))
        .catch(reject);

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Получает список всех доступных медиаустройств
 */
export const getAvailableDevices = async (): Promise<{
  videoDevices: MediaDeviceInfo[];
  audioDevices: MediaDeviceInfo[];
}> => {
  try {
    // Сначала запрашиваем разрешение, чтобы получить полную информацию об устройствах
    await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

    const devices = await navigator.mediaDevices.enumerateDevices();

    const videoDevices = devices.filter(device =>
      device.kind === 'videoinput' && device.deviceId !== ''
    );

    const audioDevices = devices.filter(device =>
      device.kind === 'audioinput' && device.deviceId !== ''
    );

    return { videoDevices, audioDevices };
  } catch (error) {
    console.error('Ошибка при получении списка устройств:', error);
    throw error;
  }
};