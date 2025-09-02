//components/RoomPage/RoomHeader
import React from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  PhoneOff,
  // Settings,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useRoomStore } from '../../stores/useRoomStore';

interface RoomHeaderProps {
  roomId: string;
  onLeave: () => void;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  // onShowDeviceSelector: () => void;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  roomId,
  onLeave,
  onToggleMic,
  onToggleCamera,
  // onShowDeviceSelector,
}) => {
  const {
    users,
    wsConnected,  // Используем wsConnected вместо isConnected
    wsConnecting, // Используем wsConnecting вместо isConnecting
    isMicMuted,
    isCameraOff,
    localStream,
  } = useRoomStore();
  
  return (
    <header className="p-4 bg-gray-800 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold">Room: {roomId}</h1>
        <div className="flex items-center space-x-2">
          <Users size={20} />
          <span>{users.length + 1} users</span>
        </div>
        <div className="flex items-center space-x-2">
          {wsConnected  ? (
            <Wifi size={20} className="text-green-400" />
          ) : wsConnecting ? (
            <Wifi size={20} className="text-yellow-400 animate-pulse" />
          ) : (
            <WifiOff size={20} className="text-red-400" />
          )}
          <span>
            {wsConnected
              ? 'Connected'
              : wsConnecting
              ? 'Connecting...'
              : 'Disconnected'}
          </span>
        </div>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={onToggleMic}
          className={`p-2 rounded-full ${
            isMicMuted ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
          disabled={!localStream}
        >
          {isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        <button
          onClick={onToggleCamera}
          className={`p-2 rounded-full ${
            isCameraOff ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
          disabled={!localStream}
        >
          {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
        </button>
        {/* <button
          onClick={onShowDeviceSelector}
          className="p-2 rounded-full bg-gray-700 hover:bg-gray-600"
          title="Device settings"
        >
          <Settings size={20} />
        </button> */}
        <button
          onClick={onLeave}
          className="p-2 rounded-full bg-red-600 hover:bg-red-700"
          title="Leave call"
        >
          <PhoneOff size={20} />
        </button>
      </div>
    </header>
  );
};