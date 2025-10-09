// src/components/RoomPage/layouts/OldGridView.tsx
"use client";
import { useMemo } from "react";
import { useMediaStream } from "@/contexts/MediaStreamContext";
import VideoPlayer from "@/components/RoomPage/VideoPlayer";
import { useRoomStore } from "@/stores/useRoomStore";
import { useVideoLayoutStore } from "@/stores/useVideoLayoutStore"; // ← добавлено

interface VideoStream {
  userId: string;
  username: string;
  stream: MediaStream;
}

interface GridViewProps {
  remoteStreams: VideoStream[];
  totalParticipants: number;
  activeSpeakerId: string | null; // ← добавлено
}

export default function OldGridView({
  remoteStreams,
  totalParticipants,
  activeSpeakerId,
}: GridViewProps) {
  const { stream: localStream } = useMediaStream();
  const users = useRoomStore((state) => state.users);
  const isSpeakerHighlightEnabled = useVideoLayoutStore((state) => state.isSpeakerHighlightEnabled); // ← добавлено

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

  const flexBasisClass = useMemo(() => {
    if (totalParticipants <= 1) return "basis-100% min-w-[200px] max-w-full";
    if (totalParticipants <= 2) {
      return "sm:basis-0 sm:grow basis-full max-w-full";
    }
    if (totalParticipants <= 4) {
      return "sm:basis-50 sm:grow basis-full min-w-[300px] max-w-full";
    }
    if (totalParticipants <= 16) {
      return "xl:basis-1/4 lg:basis-1/3 md:basis-1/2 basis-full min-w-[160px] max-w-full";
    }
    return "2xl:basis-1/5 xl:basis-1/4 lg:basis-1/3 md:basis-1/2 basis-full min-w-[150px] max-w-full";
  }, [totalParticipants]);

  return (
    <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="flex flex-row flex-wrap justify-center w-full mx-auto gap-1 sm:gap-1 min-h-0">
        {[
          ...(localStream
            ? [
                {
                  stream: localStream,
                  username: "You",
                  userId: "local",
                  isLocal: true,
                  isMicMuted: false,
                },
              ]
            : []),
          ...activeStreams.map((s) => {
            const user = users.find(u => u.id === s.userId);
            const isMicMuted = user?.isMicMuted ?? false;
            return { ...s, isLocal: false, isMicMuted };
          }),
        ].map((item) => {
          const isSpeaking = isSpeakerHighlightEnabled && activeSpeakerId === item.userId;
          return (
            <div
              key={item.userId}
              className={`flex flex-col ${flexBasisClass} ${isSpeaking ? 'ring-2 ring-green-500' : ''}`}
            >
              <div className="relative rounded-xl overflow-hidden shadow-lg bg-gray-800 border border-gray-700 w-full h-full">
                <VideoPlayer
                  stream={item.stream}
                  username={item.username}
                  isLocal={item.isLocal}
                  isMicMuted={item.isMicMuted}
                />
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full z-10">
                  {item.username}
                </div>
              </div>
            </div>
          );
        })}

        {totalParticipants === 0 && (
          <div className="flex items-center justify-center w-full basis-full min-h-[200px]">
            <div className="text-center p-2">
              <div className="text-gray-500 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
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