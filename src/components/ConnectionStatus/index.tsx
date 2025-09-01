import React from 'react';
import { RefreshCw } from 'lucide-react';

interface ConnectionStatusProps {
  connectionError: string | null;
  onRetry: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  connectionError,
  onRetry,
}) => {
  if (!connectionError) return null;
  
  return (
    <div className="bg-red-600 text-white p-3 flex items-center justify-between">
      <div>
        <strong>Connection Error:</strong> {connectionError}
      </div>
      <button
        onClick={onRetry}
        className="ml-4 bg-red-800 px-3 py-1 rounded hover:bg-red-700 flex items-center"
      >
        <RefreshCw size={16} className="mr-1" />
        Retry
      </button>
    </div>
  );
};