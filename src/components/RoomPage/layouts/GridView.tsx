// src/components/RoomPage/layouts/GridView.tsx
'use client';
import { useMemo } from 'react';
import { useMediaStream } from '@/contexts/MediaStreamContext';
import VideoPlayer from '@/components/RoomPage/VideoPlayer';
import { useRoomStore } from '@/stores/useRoomStore';

interface VideoStream {
  userId: string;
  username: string;
  stream: MediaStream;
}

interface GridViewProps {
  remoteStreams: VideoStream[];
  totalParticipants: number;
}

export default function GridView({ remoteStreams, totalParticipants }: GridViewProps) {
  const { stream: localStream } = useMediaStream();
  const users = useRoomStore(state => state.users);

  // Фильтруем активные потоки
  const activeStreams = useMemo(() => {
    return remoteStreams.filter(remote => {
      const userExists = users.some(user =>
        user.id === remote.userId && user.isConnected
      );

      const isStreamActive = remote.stream &&
        remote.stream.getTracks().some(track => track.readyState === 'live');

      return userExists && isStreamActive;
    });
  }, [remoteStreams, users]);

  // Определяем базовый размер для панелей видео в зависимости от количества участников
  // Это поможет адаптивно изменять размеры
  const itemClasses = useMemo(() => {
    if (totalParticipants <= 1) return 'min-w-[300px] md:min-w-[400px] max-w-full';
    if (totalParticipants <= 4) return 'min-w-[250px] md:min-w-[300px] max-w-[calc(50%-1rem)]';
    if (totalParticipants <= 9) return 'min-w-[200px] md:min-w-[250px] max-w-[calc(33.333%-1rem)]';
    if (totalParticipants <= 16) return 'min-w-[150px] md:min-w-[200px] max-w-[calc(25%-1rem)]';
    return 'min-w-[150px] md:min-w-[180px] max-w-[calc(20%-1rem)]';
  }, [totalParticipants]);

  return (
    // Внешний контейнер для центрирования всей "сетки" по вертикали
    // Он занимает всё доступное пространство и центрирует дочерний элемент
    <div className="w-full h-full flex items-center justify-center p-2 md:p-4 overflow-hidden">
      {/* 
        Контейнер Flexbox для панелей видео.
        - flex: Позволяет использовать Flexbox.
        - flex-row: Элементы выстраиваются в строку.
        - flex-wrap: Элементы переносятся на следующую строку, если не помещаются.
        - justify-center: Центрирует элементы по главной оси (горизонтали).
        - gap-4: Добавляет промежутки между элементами.
        - w-full: Занимает всю ширину родителя.
        - max-w-full: Предотвращает переполнение по ширине.
        - overflow-y-auto: Добавляет вертикальный скролл, если содержимое не помещается по высоте.
        - max-h-full: Ограничивает высоту.
      */}
      <div
        className="flex flex-row flex-wrap justify-center gap-4 w-full max-w-full max-h-full overflow-y-auto"
        // style={{ alignContent: 'center' }} // Опционально: центрировать строки по вертикали внутри контейнера
      >
        {/* Локальное видео */}
        {localStream && (
          <div className={`relative rounded-xl overflow-hidden shadow-lg bg-gray-800 border border-gray-700 aspect-video ${itemClasses}`}>
            <VideoPlayer
              stream={localStream}
              username="You"
              isLocal={true}
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full z-10">
              You
            </div>
          </div>
        )}

        {/* Удаленные видео потоки */}
        {activeStreams.map((remote) => (
          <div
            key={remote.userId}
            className={`relative rounded-xl overflow-hidden shadow-lg bg-gray-800 border border-gray-700 aspect-video ${itemClasses}`}
          >
            <VideoPlayer
              stream={remote.stream}
              username={remote.username}
              isLocal={false}
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full z-10">
              {remote.username}
            </div>
          </div>
        ))}

        {/* Пустое состояние */}
        {totalParticipants === 0 && (
          <div className="flex items-center justify-center min-h-[200px] w-full">
            <div className="text-center">
              <div className="text-gray-500 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-400 text-lg font-medium">
                No active video streams
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Waiting for participants...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
