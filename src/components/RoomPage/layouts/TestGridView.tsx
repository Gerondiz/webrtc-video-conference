import { useMediaStream } from "@/contexts/MediaStreamContext";
import VideoPlayer from "@/components/RoomPage/VideoPlayer";
import { useRoomStore } from "@/stores/useRoomStore";

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

  // Жёстко задаём количество плиток в строке
  const tilesPerRow = 2;

  // Разбиваем потоки на строки по 2 элемента
  const rows = [];
  for (let i = 0; i < allStreams.length; i += tilesPerRow) {
    rows.push(allStreams.slice(i, i + tilesPerRow));
  }

  console.log("allStreams:", allStreams);
  console.log("rows:", rows);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 overflow-scroll">
      <div
        className="w-full rounded-xl shadow-lg bg-red-400"
        style={{
          aspectRatio: "16 / 9",
          width: "100%",
          height: "100%",
          minHeight: "250px",
        }}
      >
        {/* Контейнер для строк */}
        <div className="w-full h-full rounded-xl overflow-hidden flex flex-col items-center justify-center">
          {rows.length > 0 ? (
            rows.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className={`flex ${row.length === 1 ? 'justify-center' : ''}`}
                style={{
                  minHeight: "300px", // минимальная высота строки
                  maxHeight: "800px", // максимальная высота строки
                }}
              >
                {row.map((streamData) => (
                  <div
                    key={streamData.userId}
                    className="flex-1 rounded-xl overflow-hidden relative m-1 justify-center" // m-1 — отступы между плитками
                    style={{
                      aspectRatio: "16 / 9",
                      maxWidth: "1000px",
                      flex: row.length === 1 ? "0 0 auto" : "1",
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
