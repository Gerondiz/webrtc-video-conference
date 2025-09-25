// src/components/RoomPage/layouts/GridView.tsx
"use client";
import { useMemo } from "react";
import { useMediaStream } from "@/contexts/MediaStreamContext";
import VideoPlayer from "@/components/RoomPage/VideoPlayer";
import { useRoomStore } from "@/stores/useRoomStore";

interface VideoStream {
  userId: string;
  username: string;
  stream: MediaStream;
}

interface GridViewProps {
  remoteStreams: VideoStream[];
  totalParticipants: number;
}

export default function GridView({
  remoteStreams,
  totalParticipants,
}: GridViewProps) {
  const { stream: localStream } = useMediaStream();
  const users = useRoomStore((state) => state.users);

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

  // --- УЛУЧШЕННАЯ Адаптивная логика для flex-basis ---
  // Определяем класс базовой ширины с адаптивностью
  // Используем min-width и max-width для более точного контроля
  const flexBasisClass = useMemo(() => {
    if (totalParticipants <= 1) return "basis-100% min-w-[200px] max-w-full"; // 1 участник

    // Для 2 участников: 1 колонка на мобильных, 2 на планшетах/десктопах
    if (totalParticipants <= 2) {
      // sm:basis-1/2: На экранах >= 640px, элемент занимает 1/2 ширины
      // basis-full: На меньших экранах - полная ширина
      // min-w-[200px]: Минимальная ширина для предотвращения сжатия
      return "sm:basis-0 sm:grow basis-full max-w-full";
    }

    // Для 3-4 участников: ДВЕ строки
    // Для размещения в две строки с максимальным размером:
    // - При 3 участниках: 2 в первой строке, 1 во второй
    // - При 4 участниках: 2 в первой строке, 2 во второй
    // Используем basis-1/2 для создания 2 колонок в строке
    if (totalParticipants <= 4) {
      // sm:basis-1/2: На экранах >= 640px, элемент занимает 1/2 ширины (2 колонки)
      // basis-full: На меньших экранах - полная ширина (1 колонка)
      // min-w: Минимальная ширина для предотвращения слишком маленьких плиток
      // max-w-full: Предотвращает переполнение
      return "sm:basis-50 sm:grow basis-full min-w-[300px] max-w-full";
    }

    // Для 10-16 участников: 1 колонка на мобильных, 2 на маленьких планшетах, 3 на больших планшетах, 4 на десктопах
    if (totalParticipants <= 16) {
      // xl:basis-1/4: >= 1280px - 4 колонки
      // lg:basis-1/3: >= 1024px - 3 колонки
      // md:basis-1/2: >= 768px - 2 колонки
      // basis-full: < 768px - 1 колонка
      return "xl:basis-1/4 lg:basis-1/3 md:basis-1/2 basis-full min-w-[160px] max-w-full";
    }

    // Для 17+ участников: Адаптивно 1-5 колонок
    return "2xl:basis-1/5 xl:basis-1/4 lg:basis-1/3 md:basis-1/2 basis-full min-w-[150px] max-w-full";
  }, [totalParticipants]);

  // --- Логика выравнивания и центрирования ---
  // 1.  Внешний контейнер (`<div className="w-full h-full flex items-center justify-center ...">`)
  //     - `h-full`: Занимает всю высоту родителя.
  //     - `flex items-center justify-center`: Центрирует дочерний элемент по обеим осям.
  //     - `p-4 overflow-hidden`: Отступы и предотвращение скролла на этом уровне.
  // 2.  Внутренний контейнер (`<div className="flex flex-wrap justify-center ... min-h-0">`)
  //     - `flex flex-wrap`: Flexbox с переносом.
  //     - `justify-center`: Центрирует элементы по горизонтали *внутри каждой строки*.
  //     - `w-full max-w-full gap-4`: Ширина и промежутки.
  //     - `min-h-0`: КРИТИЧНО для вертикального центрирования. Позволяет сжиматься.
  // 3.  Каждая панель (`<div className={`flex flex-col ${flexBasisClass} aspect-video`}>`)
  //     - `${flexBasisClass}`: Адаптивная базовая ширина.
  //     - `aspect-video`: Фиксированное соотношение сторон.
  //     - `flex flex-col`: Для внутреннего содержимого.
  // 4.  `max-w-full` на нескольких уровнях предотвращает горизонтальный скролл.
  // 5.  Используем `mx-auto` на внутреннем контейнере для дополнительного центрирования.

  return (
    // Внешний контейнер для центрирования всей "сетки"
    <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      {/* 
        Внутренний контейнер Flexbox для панелей.
        - `w-full max-w-max`: Ширина по содержимому, но не более ширины родителя.
        - `mx-auto`: Центрирует этот контейнер по горизонтали внутри внешнего.
        - `min-h-0`: КРИТИЧНО для вертикального центрирования.
        - `gap-3 sm:gap-4`: Адаптивные промежутки.
      */}
      <div className="flex flex-row flex-wrap justify-center w-full mx-auto gap-1 sm:gap-1 min-h-0">
        {/* Объединяем локальное и удаленные видео в один массив для рендера */}
        {[
          ...(localStream
            ? [
                {
                  stream: localStream,
                  username: "You",
                  userId: "local",
                  isLocal: true,
                },
              ]
            : []),
          ...activeStreams.map((s) => ({ ...s, isLocal: false })),
        ].map((item) => (
          <div
            key={item.userId}
            // Применяем адаптивные классы ширины
            className={`flex flex-col ${flexBasisClass}`}
          >
            <div className="relative rounded-xl overflow-hidden shadow-lg bg-gray-800 border border-gray-700 w-full h-full">
              <VideoPlayer
                stream={item.stream}
                username={item.username}
                isLocal={item.isLocal}
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full z-10">
                {item.username}
              </div>
            </div>
          </div>
        ))}

        {/* Пустое состояние */}
        {totalParticipants === 0 && (
          <div className="flex items-center justify-center w-full basis-full min-h-[200px]">
            <div className="text-center p-2">
              <div className="text-gray-500 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 sm:h-12 sm:w-12 mx-auto"
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
              </div>
              <p className="text-gray-400 text-base sm:text-lg font-medium">
                No active video streams
              </p>
              <p className="text-gray-500 text-xs sm:text-sm mt-1">
                Waiting for participants...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
