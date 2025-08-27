// src/app/room/[id]/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import VideoPlayer from '@/components/VideoPlayer';
import Chat from '@/components/Chat';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useWebRTC } from '@/hooks/useWebRTC';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  PhoneOff,
  Settings,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
  import {
    RemoteStream,
    ChatMessage,
    MediaDeviceInfo,
    UserJoinedMessage,
    UserLeftMessage,
    WebRTCOfferMessage,
    WebRTCAnswerMessage,
    WebRTCIceCandidateMessage,
    ChatMessageData,
    ErrorMessage,
    // WebSocketMessage,
  } from '@/types';

export default function RoomPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const roomId = params.id;
  const username = searchParams.get('username') || 'User';

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'initializing-media' | 'requesting-permission' | 'waiting-websocket' | 'joining-room' | 'connected' | 'error' | 'need-devices'
  >('connecting');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const initializedRef = useRef(false);

  const {
    isConnected,
    isConnecting,
    sendMessage,
    addMessageHandler,
    removeMessageHandler,
    disconnect: disconnectWebSocket,
  } = useWebSocket(`ws://localhost:8000/ws`);

  const {
    initMedia,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    sendDataMessage,
    toggleMic,
    toggleCamera,
    isMicMuted,
    isCameraOff,
    cleanup,
  } = useWebRTC({
    onRemoteStream: (stream, userId) => {
      setRemoteStreams((prev) => {
        const existing = prev.find((rs) => rs.userId === userId);
        if (existing) {
          return prev.map((rs) =>
            rs.userId === userId ? { ...rs, stream } : rs
          );
        }
        return [...prev, { userId, username: userId, stream }];
      });
    },
    onDataChannelMessage: (message, userId) => {
      try {
        const parsedMessage = JSON.parse(message);
        if (parsedMessage.type === 'chat') {
          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              from: userId,
              text: parsedMessage.text,
              timestamp: new Date(),
            },
          ]);
        }
      } catch (error) {
        console.error('Error parsing data channel message:', error);
      }
    },
  });

  // Обработчики сообщений WebSocket
  useEffect(() => {
    const handleUserJoined = ({ user }: UserJoinedMessage) => {
      console.log('User joined:', user);
      setUsers((prev) => {
        if (prev.includes(user)) return prev;
        return [...prev, user];
      });

      if (user !== username) {
        createOffer(user).then((offer) => {
          sendMessage({
            type: 'webrtc-offer',
            data: {
              target: user,
              payload: offer,
            },
          });
        }).catch((error) => {
          console.error('Error creating offer:', error);
          setConnectionError('Failed to create WebRTC offer');
        });
      }
    };

    const handleUserLeft = ({ user }: UserLeftMessage) => {
      console.log('User left:', user);
      setUsers((prev) => prev.filter((u) => u !== user));
      setRemoteStreams((prev) => prev.filter((rs) => rs.userId !== user));
    };

    const handleWebRTCOffer = ({
      from,
      payload,
    }: WebRTCOfferMessage) => {
      console.log('Received offer from:', from);
      handleOffer(from, payload)
        .then((answer) => {
          sendMessage({
            type: 'webrtc-answer',
            data: {
              target: from,
              payload: answer,
            },
          });
        })
        .catch((error) => {
          console.error('Error handling offer:', error);
          setConnectionError('Failed to handle WebRTC offer');
        });
    };

    const handleWebRTCAnswer = ({
      from,
      payload,
    }: WebRTCAnswerMessage) => {
      console.log('Received answer from:', from);
      handleAnswer(from, payload).catch((error) => {
        console.error('Error handling answer:', error);
        setConnectionError('Failed to handle WebRTC answer');
      });
    };

    const handleWebRTCIceCandidate = ({
      from,
      payload,
    }: WebRTCIceCandidateMessage) => {
      console.log('Received ICE candidate from:', from);
      handleIceCandidate(from, payload).catch((error) => {
        console.error('Error handling ICE candidate:', error);
        setConnectionError('Failed to handle ICE candidate');
      });
    };

    const handleChatMessage = ({ from, text }: ChatMessageData) => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          from,
          text,
          timestamp: new Date(),
        },
      ]);
    };

    const handleError = ({ message }: ErrorMessage) => {
      console.error('Server error:', message);
      setConnectionError(message);
    };

    addMessageHandler<UserJoinedMessage>('user-joined', handleUserJoined);
    addMessageHandler<UserLeftMessage>('user-left', handleUserLeft);
    addMessageHandler<WebRTCOfferMessage>('webrtc-offer', handleWebRTCOffer);
    addMessageHandler<WebRTCAnswerMessage>('webrtc-answer', handleWebRTCAnswer);
    addMessageHandler<WebRTCIceCandidateMessage>('webrtc-ice-candidate', handleWebRTCIceCandidate);
    addMessageHandler<ChatMessageData>('chat-message', handleChatMessage);
    addMessageHandler<ErrorMessage>('error', handleError);

    return () => {
      removeMessageHandler('user-joined');
      removeMessageHandler('user-left');
      removeMessageHandler('webrtc-offer');
      removeMessageHandler('webrtc-answer');
      removeMessageHandler('webrtc-ice-candidate');
      removeMessageHandler('chat-message');
      removeMessageHandler('error');
    };
  }, [
    username,
    sendMessage,
    addMessageHandler,
    removeMessageHandler,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
  ]);

  // Инициализация медиа и подключение к комнате
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initialize = async () => {
      try {
        setIsInitializing(true);
        setConnectionStatus('initializing-media');
        setConnectionError(null);

        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasDevices = devices.some(
          (device) =>
            (device.kind === 'audioinput' || device.kind === 'videoinput') &&
            device.deviceId !== ''
        );

        if (!hasDevices) {
          setShowDeviceSelector(true);
          setConnectionStatus('need-devices');
          setIsInitializing(false);
          return;
        }

        setConnectionStatus('requesting-permission');
        const stream = await initMedia();
        setLocalStream(stream);

        setConnectionStatus('waiting-websocket');

        if (isConnected) {
          setConnectionStatus('joining-room');
          sendMessage({
            type: 'join-room',
            data: {
              roomId,
              username,
            },
          });
          setConnectionStatus('connected');
        }
      } catch (error: unknown) {
        console.error('Error initializing:', error);
        setConnectionStatus('error');
        const typedError = error as { code: number; message: string; name: string };
        setConnectionError(typedError.message);

        if (typedError.name === 'NotAllowedError') {
          setShowDeviceSelector(true);
        }
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();

    return () => {
      cleanup();
      disconnectWebSocket();
    };
  }, [roomId, username, initMedia, isConnected, sendMessage, cleanup, disconnectWebSocket]);

  // Отслеживаем изменения состояния WebSocket соединения
  useEffect(() => {
    if (isConnected && localStream && !isInitializing) {
      setConnectionStatus('joining-room');
      sendMessage({
        type: 'join-room',
        data: {
          roomId,
          username,
        },
      });
      setConnectionStatus('connected');
    }
  }, [isConnected, localStream, isInitializing, roomId, username, sendMessage]);

  const handleSendChatMessage = useCallback(
    (text: string) => {
      users.forEach((user) => {
        if (user !== username) {
          sendDataMessage(user, JSON.stringify({ type: 'chat', text }));
        }
      });

      sendMessage({
        type: 'chat-message',
        data: { text },
      });

      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          from: username,
          text,
          timestamp: new Date(),
        },
      ]);
    },
    [users, username, sendDataMessage, sendMessage]
  );

  const handleDevicesSelected = useCallback(
    async ({ video, audio }: { video: string; audio: string }) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: video ? { deviceId: { exact: video } } : true,
          audio: audio ? { deviceId: { exact: audio } } : true,
        });

        if (localStream) {
          localStream.getTracks().forEach((track) => track.stop());
        }

        setLocalStream(stream);
        setShowDeviceSelector(false);
        setConnectionStatus('connected');

        if (isConnected) {
          sendMessage({
            type: 'join-room',
            data: {
              roomId,
              username,
            },
          });
        }
      } catch (error: unknown) {
        console.error('Error accessing devices:', error);
        setConnectionError('Failed to access selected devices');
      }
    },
    [localStream, isConnected, roomId, username, sendMessage]
  );

  const handleDeviceSelectorCancel = useCallback(() => {
    setShowDeviceSelector(false);
    if (!localStream) {
      window.location.href = '/';
    }
  }, [localStream]);

  const leaveRoom = useCallback(() => {
    cleanup();
    disconnectWebSocket();
    window.location.href = '/';
  }, [cleanup, disconnectWebSocket]);

  const retryConnection = useCallback(() => {
    setConnectionError(null);
    setConnectionStatus('connecting');
  }, []);

  const DeviceSelectorFallback = ({
    onDevicesSelected,
    onCancel,
  }: {
    onDevicesSelected: (devices: { video: string; audio: string }) => void;
    onCancel: () => void;
  }) => {
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedVideo, setSelectedVideo] = useState('');
    const [selectedAudio, setSelectedAudio] = useState('');

    useEffect(() => {
      const getDevices = async () => {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          setVideoDevices(devices.filter((d) => d.kind === 'videoinput'));
          setAudioDevices(devices.filter((d) => d.kind === 'audioinput'));

          if (devices.length > 0) {
            setSelectedVideo(devices.find((d) => d.kind === 'videoinput')?.deviceId || '');
            setSelectedAudio(devices.find((d) => d.kind === 'audioinput')?.deviceId || '');
          }
        } catch (error) {
          console.error('Error enumerating devices:', error);
        }
      };

      getDevices();
    }, []);

    const handleConfirm = () => {
      onDevicesSelected({
        video: selectedVideo,
        audio: selectedAudio,
      });
    };

    return (
      <div className="text-white">
        <h3 className="text-lg font-semibold mb-4">Select Devices</h3>
        <div className="mb-4">
          <label className="block mb-2">Camera:</label>
          <select
            value={selectedVideo}
            onChange={(e) => setSelectedVideo(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded"
          >
            {videoDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${videoDevices.indexOf(device) + 1}`}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-6">
          <label className="block mb-2">Microphone:</label>
          <select
            value={selectedAudio}
            onChange={(e) => setSelectedAudio(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded"
          >
            {audioDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${audioDevices.indexOf(device) + 1}`}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
          >
            Confirm
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="p-4 bg-gray-800 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">Room: {roomId}</h1>
          <div className="flex items-center space-x-2">
            <Users size={20} />
            <span>{users.length + 1} users</span>
          </div>
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi size={20} className="text-green-400" />
            ) : isConnecting ? (
              <Wifi size={20} className="text-yellow-400 animate-pulse" />
            ) : (
              <WifiOff size={20} className="text-red-400" />
            )}
            <span>
              {isConnected
                ? 'Connected'
                : isConnecting
                ? 'Connecting...'
                : 'Disconnected'}
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={toggleMic}
            className={`p-2 rounded-full ${
              isMicMuted ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
            disabled={!localStream}
          >
            {isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <button
            onClick={toggleCamera}
            className={`p-2 rounded-full ${
              isCameraOff ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
            disabled={!localStream}
          >
            {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>
          <button
            onClick={() => setShowDeviceSelector(true)}
            className="p-2 rounded-full bg-gray-700 hover:bg-gray-600"
            title="Device settings"
          >
            <Settings size={20} />
          </button>
          <button
            onClick={leaveRoom}
            className="p-2 rounded-full bg-red-600 hover:bg-red-700"
            title="Leave call"
          >
            <PhoneOff size={20} />
          </button>
        </div>
      </header>
      {/* Connection error banner */}
      {connectionError && (
        <div className="bg-red-600 text-white p-3 flex items-center justify-between">
          <div>
            <strong>Connection Error:</strong> {connectionError}
          </div>
          <button
            onClick={retryConnection}
            className="ml-4 bg-red-800 px-3 py-1 rounded hover:bg-red-700 flex items-center"
          >
            <RefreshCw size={16} className="mr-1" />
            Retry
          </button>
        </div>
      )}
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video grid */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
            {/* Local video */}
            {localStream && (
              <div className="bg-gray-800 rounded-lg overflow-hidden aspect-video">
                <VideoPlayer stream={localStream} isLocal username={username} />
              </div>
            )}
            {/* Remote videos */}
            {remoteStreams.map((remote) => (
              <div key={remote.userId} className="bg-gray-800 rounded-lg overflow-hidden aspect-video">
                <VideoPlayer stream={remote.stream} username={remote.username} />
              </div>
            ))}
            {/* Placeholder for empty slots */}
            {remoteStreams.length === 0 && (
              <div className="bg-gray-800 rounded-lg aspect-video flex items-center justify-center">
                <div className="text-center">
                  <Users size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="opacity-50">Waiting for others to join...</p>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Chat sidebar */}
        <div className="w-80 border-l border-gray-700 flex flex-col">
          <Chat
            messages={chatMessages}
            onSendMessage={handleSendChatMessage}
            currentUser={username}
          />
        </div>
      </div>
      {/* Device selector modal */}
      {showDeviceSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <DeviceSelectorFallback
              onDevicesSelected={handleDevicesSelected}
              onCancel={handleDeviceSelectorCancel}
            />
          </div>
        </div>
      )}
      {/* Initialization overlay */}
      {isInitializing && (
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
            {connectionStatus === 'need-devices' && (
              <button
                onClick={() => setShowDeviceSelector(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Select Devices
              </button>
            )}
            {connectionStatus === 'error' && (
              <button
                onClick={retryConnection}
                className="bg-blue-500 text-white px-4 py-2 rounded flex items-center mx-auto"
              >
                <RefreshCw size={16} className="mr-2" />
                Try Again
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}