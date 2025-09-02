// src/components/RoomPage/ConnectionStatus.tsx
import { RefreshCw } from 'lucide-react';

interface ConnectionStatusProps {
  status: 'connecting' | 'initializing-media' | 'requesting-permission' | 'waiting-websocket' | 'joining-room' | 'connected' | 'error' | 'need-devices';
  onRetry: () => void;
  onSelectDevices: () => void;
}

export default function ConnectionStatus({ status, onRetry, onSelectDevices }: ConnectionStatusProps) {
  if (status === 'connected') return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 text-center text-black w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {status === 'error' ? 'Connection Error' : 'Initializing...'}
        </h2>
        <p className="text-gray-600 mb-4">
          {status === 'initializing-media' && 'Checking media devices...'}
          {status === 'requesting-permission' && 'Requesting camera/microphone permission...'}
          {status === 'waiting-websocket' && 'Waiting for server connection...'}
          {status === 'joining-room' && 'Joining room...'}
          {/* {status === 'connected' && 'Connected successfully!'} */}
          {status === 'error' && 'Connection failed. Please try again.'}
          {status === 'need-devices' && 'No media devices found. Please select devices to continue.'}
        </p>
        
        {status === 'need-devices' && (
          <button
            onClick={onSelectDevices}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Select Devices
          </button>
        )}
        
        {status === 'error' && (
          <button
            onClick={onRetry}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center mx-auto"
          >
            <RefreshCw size={16} className="mr-2" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}