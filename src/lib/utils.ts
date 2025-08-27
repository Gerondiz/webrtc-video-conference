// src/lib/utils.ts
import { MediaDevicesStatus } from '@/types';

export async function checkMediaDevices(): Promise<MediaDevicesStatus> {
  try {
    // Получаем список всех доступных устройств
    const devices = await navigator.mediaDevices.enumerateDevices();

    // Проверяем наличие камер и микрофонов
    const hasCamera = devices.some(device => device.kind === 'videoinput');
    const hasMicrophone = devices.some(device => device.kind === 'audioinput');

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
    throw error;
  }
}

export async function getMediaDevicesWithPermissions(devicesStatus: MediaDevicesStatus): Promise<MediaStream | null> {
  try {
    console.log('Статус устройств:', devicesStatus);

    // Если нужно запросить доступ к медиаустройствам
    const constraints: MediaStreamConstraints = {
      audio: devicesStatus.hasMicrophone,
      video: devicesStatus.hasCamera,
    };

    if (devicesStatus.hasCamera || devicesStatus.hasMicrophone) {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Доступ к медиапотоку получен:', stream);
      return stream;
    } else {
      console.log('Нет доступных устройств для захвата медиа.');
      return null;
    }
  } catch (error) {
    console.error('Ошибка:', error);
    return null;
  }
}

/**
 * Проверяет, поддерживается ли WebRTC в браузере
 */
export const checkWebRTCSupport = (): boolean => {
  return !!(navigator.mediaDevices && 
            'getUserMedia' in navigator.mediaDevices && 
            'RTCPeerConnection' in window);
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
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: turnServer, username, credential },
        ],
        iceCandidatePoolSize: 10,
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