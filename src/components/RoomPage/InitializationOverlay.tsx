//components/RoomPage/InitializationOverlay
import React from 'react';

interface InitializationOverlayProps {
  isInitializing: boolean;
  connectionStatus: string;
  onRetry: () => void;
  // onShowDeviceSelector: () => void;
}

export const InitializationOverlay: React.FC<InitializationOverlayProps> = ({
  isInitializing,
  connectionStatus,
  // onRetry,
  // onShowDeviceSelector,
}) => {
  if (!isInitializing) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 text-center text-black">
        <h2 className="text-xl font-semibold mb-4">Initializing...</h2>
        <p className="text-gray-600 mb-4">
          {connectionStatus === 'initializing-media' &&
            'Checking media devices...'}
          {connectionStatus === 'requesting-permission' &&
            'Requesting camera/microphone permission...'}
          {connectionStatus === 'waiting-websocket' &&
            'Waiting for server connection...'}
          {connectionStatus === 'joining-room' && 'Joining room...'}
          {connectionStatus === 'connected' && 'Connected successfully!'}
          {connectionStatus === 'error' && 'Connection failed'}
          {connectionStatus === 'need-devices' && 'No media devices found'}
        </p>

      </div>
    </div>
  );
};