"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { useMediaStream } from "@/contexts/MediaStreamContext";
import VideoPlayer from "@/components/RoomPage/VideoPlayer";
import { useRoomStore } from "@/stores/useRoomStore";

interface VideoStream {
  userId: string;
  username: string;
  stream: MediaStream;
}

interface SpotlightViewProps {
  remoteStreams: VideoStream[];
}

interface SpotlightStream {
  stream: MediaStream;
  username: string;
  isLocal: boolean;
}

export default function SpotlightView({ remoteStreams }: SpotlightViewProps) {
  const { stream: localStream } = useMediaStream();
  const users = useRoomStore((state) => state.users);
  const [spotlightUserId, setSpotlightUserId] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Фильтруем активные потоки
  const activeStreams = useMemo(() => {
    return remoteStreams.filter((remote) => {
      const userExists = users.some(
        (user) => user.id === remote.userId && user.isConnected
      );

      const isStreamActive =
        remote.stream &&
        remote.stream.getTracks().some((track) => track.readyState === "live");

      return userExists && isStreamActive;
    });
  }, [remoteStreams, users]);

  // Обработка клика по участнику для spotlight
  const handleParticipantClick = (userId: string) => {
    if (spotlightUserId === userId) {
      setSpotlightUserId(null);
    } else {
      setSpotlightUserId(userId);
    }
  };

  // Получаем spotlight поток
  const spotlightStream = useMemo((): SpotlightStream | null => {
    if (spotlightUserId === "local") {
      return localStream
        ? { stream: localStream, username: "You (Spotlight)", isLocal: true }
        : null;
    }
    const stream = activeStreams.find(
      (stream) => stream.userId === spotlightUserId
    );
    return stream
      ? {
          stream: stream.stream,
          username: `${stream.username} (Spotlight)`,
          isLocal: false,
        }
      : null;
  }, [spotlightUserId, localStream, activeStreams]);

  // Вычисляем размеры основного видео и высоту ленты
  const { spotlightSize, thumbnailHeight } = useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) {
      return { spotlightSize: { width: 0, height: 0 }, thumbnailHeight: 0 };
    }

    // Высота ленты — 8% от высоты контейнера (можно настроить)
    const thumbHeightPercent = 12;
    const availableHeight = containerSize.height;
    const thumbHeight = (availableHeight * thumbHeightPercent) / 100;
    const mainHeight = availableHeight - thumbHeight;

    // Вычисляем размер основного видео с aspectRatio 16/9
    const aspectRatio = 16 / 9;
    let width = mainHeight * aspectRatio;
    let height = mainHeight;

    if (width > containerSize.width) {
      width = containerSize.width;
      height = width / aspectRatio;
    }

    return { spotlightSize: { width, height }, thumbnailHeight: thumbHeight };
  }, [containerSize]);

  // Отслеживаем размеры контейнера
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });

    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col bg-gray-900 overflow-hidden"
    >
      {/* Основное видео (spotlight) */}
      <div className="flex-1 flex items-center justify-center p-2">
        {spotlightStream ? (
          <div
            className="rounded-xl overflow-hidden shadow-lg bg-gray-800 relative"
            style={{
              width: `${spotlightSize.width}px`,
              height: `${spotlightSize.height}px`,
            }}
          >
            <VideoPlayer
              stream={spotlightStream.stream}
              username={spotlightStream.username}
              isLocal={spotlightStream.isLocal}
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full z-10">
              {spotlightStream.username}
            </div>
          </div>
        ) : (
          // ✅ Заглушка с фиксированными пропорциями
          <div
            className="rounded-xl overflow-hidden shadow-lg bg-gray-800 flex items-center justify-center"
            style={{
              width: `${spotlightSize.width}px`,
              height: `${spotlightSize.height}px`,
            }}
          >
            <div className="text-center text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <p className="text-lg">Click on a participant to spotlight</p>
            </div>
          </div>
        )}
      </div>

      {/* Миниатюры участников (лента внизу) */}
      <div
        className="p-2 border-t border-gray-700 bg-gray-900 flex-shrink-0"
        style={{ height: `${thumbnailHeight}px` }} // ✅ Высота в процентах от родителя
      >
        <div className="flex space-x-2 overflow-x-auto pb-2 h-full">
          {localStream && (
            <div
              className={`flex-shrink-0 w-24 h-16 rounded-lg cursor-pointer ${
                spotlightUserId === "local"
                  ? "ring-2 ring-blue-500"
                  : "ring-1 ring-gray-600"
              }`}
              style={{
                width: `${(thumbnailHeight * (16 / 9)-19)}px`, // 16/9 от высоты ленты
                height: `${thumbnailHeight - 26}px`, // отступы (16px) сверху/снизу
              }}
              onClick={() => handleParticipantClick("local")}
            >
              <VideoPlayer stream={localStream} username="You" isLocal={true} />
              <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                You
              </div>
            </div>
          )}

          {activeStreams.map((stream) => (
            <div
              key={stream.userId}
              className={`flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden cursor-pointer ${
                spotlightUserId === stream.userId
                  ? "ring-2 ring-blue-500"
                  : "ring-1 ring-gray-600"
              }`}
              style={{
                width: `${(thumbnailHeight  * (16 / 9))-19}px`, // 16/9 от высоты ленты
                height: `${thumbnailHeight - 26}px`, // отступы (16px) сверху/снизу
              }}
              onClick={() => handleParticipantClick(stream.userId)}
            >
              <VideoPlayer
                stream={stream.stream}
                username={stream.username}
                isLocal={false}
              />
              <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                {stream.username}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
