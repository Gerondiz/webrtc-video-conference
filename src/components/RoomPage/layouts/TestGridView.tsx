import { useState, useEffect, useRef } from "react";
import { useMediaStream } from "@/contexts/MediaStreamContext";
import VideoPlayer from "@/components/RoomPage/VideoPlayer";
import { useRoomStore } from "@/stores/useRoomStore";
import { useVideoLayoutStore } from "@/stores/useVideoLayoutStore";

interface VideoStream {
  userId: string;
  username: string;
  stream: MediaStream;
}

interface TestGridViewProps {
  remoteStreams: VideoStream[];
}

export default function TestGridView({ remoteStreams }: TestGridViewProps) {
  const { stream: localStream } = useMediaStream();
  const users = useRoomStore((state) => state.users);
  const maxTilesPerRow = useVideoLayoutStore((state) => state.maxTilesPerRow);

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const activeRemoteStreams = remoteStreams.filter((remote) => {
    const userExists = users.some(
      (user) => user.id === remote.userId && user.isConnected
    );
    const isStreamActive =
      remote.stream &&
      remote.stream.getTracks().some((track) => track.readyState === "live");
    return userExists && isStreamActive;
  });

  const allStreams = [
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
    ...activeRemoteStreams.map((s) => ({ ...s, isLocal: false })),
  ];

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

  // Вычисляем количество плиток в строке
  const tilesPerRow = calculateTilesPerRow(
    containerSize.width,
    containerSize.height,
    allStreams.length,
    maxTilesPerRow
  );

  // Разбиваем потоки на строки
  const rows = [];
  for (let i = 0; i < allStreams.length; i += tilesPerRow) {
    rows.push(allStreams.slice(i, i + tilesPerRow));
  }

  // Вычисляем размер плитки
  const tileSize = calculateTileSize(
    containerSize.width,
    containerSize.height,
    tilesPerRow,
    rows.length
  );

  return (
    <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden">
      <div
        ref={containerRef}
        className="w-full rounded-xl shadow-lg bg-red-400"
        style={{
          aspectRatio: "16 / 9",
          width: "100%",
          height: "100%",
          minHeight: "250px",
        }}
      >
        {/* Контейнер для строк с отступами */}
        <div
          className="w-full h-full rounded-xl overflow-scroll flex flex-col items-center justify-center p-4"
          style={{ gap: "8px" }}
        >
          {rows.length > 0 ? (
            rows.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="flex justify-center w-full"
                style={{
                  minHeight: `${tileSize.height}px`,
                  maxHeight: `${tileSize.height}px`,
                }}
              >
                {row.map((streamData) => (
                  <div
                    key={streamData.userId}
                    className="rounded-xl overflow-hidden relative"
                    style={{
                      width: `${tileSize.width}px`,
                      height: `${tileSize.height}px`,
                      flex: "0 0 auto",
                      margin: "4px",
                    }}
                  >
                    <VideoPlayer
                      stream={streamData.stream}
                      username={streamData.username}
                      isLocal={streamData.isLocal}
                    />
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full z-10">
                      {streamData.username}
                    </div>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold bg-opacity-50 bg-black">
              No Streams
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Функция вычисления количества плиток в строке
function calculateTilesPerRow(
  containerWidth: number,
  containerHeight: number,
  participantCount: number,
  maxTilesPerRow: number,
  minTileWidth: number = 200,
  // minTileHeight: number = 112.5 // 200 * 9 / 16
): number {
  // Если экран сильно сжат по высоте — выстраиваем в одну строку (все участники в ряд)
  if (containerHeight <= 460) return participantCount;

  // Если экран сильно сжат по ширине — тоже одна колонка
  if (containerWidth < minTileWidth * 2) return 1;

  // Специальные случаи
  if (participantCount === 2) return 2;
  if (participantCount === 3 || participantCount === 4) return 2; // всегда 2 в строке
  if (participantCount >= 5 && containerWidth <= 1200) return 2; // 2 колонки

  // Рассчитываем количество плиток в строке
  const maxPossibleByWidth = Math.floor(containerWidth / minTileWidth);
  const maxPossibleByParticipants = Math.min(participantCount, maxTilesPerRow);

  return Math.min(
    maxPossibleByWidth,
    maxPossibleByParticipants,
    maxTilesPerRow
  );
}

// Функция вычисления размера одной плитки
function calculateTileSize(
  containerWidth: number,
  containerHeight: number,
  cols: number,
  rows: number
): { width: number; height: number } {
  if (
    containerWidth === 0 ||
    containerHeight === 0 ||
    cols === 0 ||
    rows === 0
  ) {
    return { width: 0, height: 0 };
  }

  // Константы
  const gapBetweenRows = 64; // отступ между строками
  const marginBetweenTiles = 32; // отступ между плитками (на одну плитку)
  const totalHorizontalMarginPerRow = (cols + 1) * marginBetweenTiles; // 4px слева + между + справа

  // Вычисляем ширину одной плитки, учитывая отступы
  let tileWidth = (containerWidth - totalHorizontalMarginPerRow) / cols;
  let tileHeight = tileWidth * (9 / 16); // сохраняем 16:9

  // Проверяем, помещаются ли строки по высоте
  const totalVerticalGap = (rows - 1) * gapBetweenRows;
  if (tileHeight * rows + totalVerticalGap > containerHeight) {
    // Если не помещается — вычисляем по высоте
    tileHeight = (containerHeight - totalVerticalGap) / rows;
    tileWidth = tileHeight * (16 / 9);
  }

  return { width: tileWidth, height: tileHeight };
}
