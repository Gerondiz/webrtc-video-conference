// src/app/check-turn/page.tsx
"use client";
import { useEffect, useState } from "react";
import {
  checkMediaDevices,
  getMediaDevicesWithPermissions,
  testTURNConnection,
  checkWebRTCSupport,
} from "@/lib/utils";
import { MediaDevicesStatus, MediaDeviceInfo } from "@/types";

const CheckTURNPage = () => {
  const [candidates, setCandidates] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [mediaDevices, setMediaDevices] = useState<MediaDeviceInfo[]>([]);
  const [mediaStatus, setMediaStatus] = useState<MediaDevicesStatus>({
    hasCamera: false,
    hasMicrophone: false,
  });
  const [webrtcSupported, setWebrtcSupported] = useState<boolean>(true);
  const [permissionsGranted, setPermissionsGranted] = useState<boolean>(false);

  // Проверка медиаустройств и поддержки WebRTC при загрузке компонента
  useEffect(() => {
    const initialize = async () => {
      // Проверяем поддержку WebRTC
      const supported = checkWebRTCSupport();
      setWebrtcSupported(supported);

      if (!supported) {
        setError("WebRTC не поддерживается вашим браузером");
        return;
      }

      try {
        // Получаем информацию об устройствах
        const status = await checkMediaDevices();
        setMediaStatus(status);

        // Получаем список устройств
        const devices = await navigator.mediaDevices.enumerateDevices();
        setMediaDevices(devices.filter((device) => device.deviceId !== ""));
      } catch (err) {
        console.error("Ошибка инициализации медиаустройств:", err);
        setError("Ошибка при проверке медиаустройств");
      }
    };

    initialize();
  }, []);

  // Используем переданные constraints или стандартные на основе доступных устройств
  const mediaConstraints = {
    video: false,
    audio: true,
  };

  const requestMediaPermissions = async () => {
    try {
      const stream = await getMediaDevicesWithPermissions(mediaConstraints);
      if (stream) {
        setPermissionsGranted(true);
        // Останавливаем поток, так как нам нужны только разрешения
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());

        // Обновляем список устройств с метками
        const devices = await navigator.mediaDevices.enumerateDevices();
        setMediaDevices(devices.filter((device) => device.deviceId !== ""));
      }
    } catch (err) {
      console.error("Ошибка запроса разрешений:", err);
      setError("Не удалось получить разрешение на использование устройств");
    }
  };

  const testTURN = async () => {
    if (!webrtcSupported) {
      setError("WebRTC не поддерживается вашим браузером");
      return;
    }

    try {
      setCandidates([]);
      setError(null);
      setIsTesting(true);

      // Тестируем подключение к TURN серверу
      const turnCandidates = await testTURNConnection(
        process.env.NEXT_PUBLIC_TURN_SERVER || "turn:20.0.0.107:3478",
        "turnuser",
        "12345678"
      );

      setCandidates(turnCandidates);
    } catch (err) {
      setError(`Ошибка: ${(err as Error).message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Проверка TURN-сервера</h1>

      {/* Информация о поддержке WebRTC */}
      {!webrtcSupported && (
        <div style={{ color: "red", marginBottom: "20px" }}>
          <h3>Внимание: WebRTC не поддерживается вашим браузером</h3>
          <p>Проверка TURN-сервера невозможна</p>
        </div>
      )}

      {/* Информация о медиаустройствах */}
      <section style={{ marginBottom: "20px" }}>
        <h2>Медиаустройства</h2>
        <p>
          Обнаружены: Камера - {mediaStatus.hasCamera ? "✅" : "❌"}, Микрофон -{" "}
          {mediaStatus.hasMicrophone ? "✅" : "❌"}
        </p>
        <p>Разрешения: {permissionsGranted ? "✅" : "❌"}</p>

        {!permissionsGranted &&
          (mediaStatus.hasCamera || mediaStatus.hasMicrophone) && (
            <button
              onClick={requestMediaPermissions}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginBottom: "10px",
              }}
            >
              Запросить разрешения
            </button>
          )}

        <h3>Детали устройств:</h3>
        {mediaDevices.length > 0 ? (
          <ul>
            {mediaDevices.map((device, index) => (
              <li key={index}>
                {device.kind}: {device.label || `Устройство ${index + 1}`} (ID:{" "}
                {device.deviceId.slice(0, 10)}...)
              </li>
            ))}
          </ul>
        ) : (
          <p>Устройства не обнаружены или не доступны</p>
        )}
      </section>

      {/* Кнопка проверки TURN */}
      <button
        onClick={testTURN}
        disabled={isTesting || !webrtcSupported}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: isTesting || !webrtcSupported ? "#ccc" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: isTesting || !webrtcSupported ? "not-allowed" : "pointer",
        }}
      >
        {isTesting ? "Проверка..." : "Начать проверку"}
      </button>

      {/* Отображение ошибок */}
      {error && (
        <div style={{ color: "red", marginTop: "10px" }}>
          <h3>Ошибка:</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Результаты проверки */}
      <section style={{ marginTop: "20px" }}>
        <h2>ICE-кандидаты:</h2>
        {candidates.length > 0 ? (
          <ul>
            {candidates.map((candidate, index) => (
              <li
                key={index}
                style={{
                  color: candidate.includes("relay") ? "green" : "inherit",
                  fontWeight: candidate.includes("relay") ? "bold" : "normal",
                }}
              >
                {candidate}
              </li>
            ))}
          </ul>
        ) : (
          <p>
            Кандидаты не найдены.{" "}
            {isTesting ? "Идет поиск..." : 'Нажмите "Начать проверку"'}
          </p>
        )}
      </section>
    </div>
  );
};

export default CheckTURNPage;
