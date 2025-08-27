// src/app/room/[id]/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import VideoPlayer from '@/components/VideoPlayer';
import Chat from '@/components/Chat';
import DeviceSelector from '@/components/DeviceSelector';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useWebRTC } from '@/hooks/useWebRTC';
import { Mic, MicOff, Video, VideoOff, Users, PhoneOff, Settings, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface RemoteStream {
  userId: string;
  username: string;
  stream: MediaStream;
}

interface ChatMessage {
  id: string;
  from: string;
  text: string;
  timestamp: Date;
}

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.id as string;
  const username = searchParams.get('username') || 'User';
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const { 
    isConnected, 
    isConnecting, 
    sendMessage, 
    addMessageHandler, 
    removeMessageHandler, 
    disconnect: disconnectWebSocket,
    reconnect: reconnectWebSocket
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
    cleanup
  } = useWebRTC({
    onRemoteStream: (stream, userId) => {
      setRemoteStreams(prev => {
        const existing = prev.find(rs => rs.userId === userId);
        if (existing) {
          return prev.map(rs => 
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
          setChatMessages(prev => [...prev, {
            id: Date.now().toString(),
            from: userId,
            text: parsedMessage.text,
            timestamp: new Date()
          }]);
        }
      } catch (error) {
        console.error('Error parsing data channel message:', error, message);
      }
    }
  });

  // Обработчики сообщений WebSocket
  useEffect(() => {
    const handleUserJoined = (data: { user: string }) => {
      console.log('User joined:', data.user);
      setUsers(prev => {
        if (prev.includes(data.user)) return prev;
        return [...prev, data.user];
      });
      
      // Когда новый пользователь присоединяется, создаем offer
      if (data.user !== username) {
        console.log('Creating offer for user:', data.user);
        createOffer(data.user).then(offer => {
          const success = sendMessage({
            type: 'webrtc-offer',
            data: {
              target: data.user,
              payload: offer
            }
          });
          
          if (!success) {
            console.error('Failed to send offer message');
            setConnectionError('Failed to establish connection with peer');
          }
        }).catch(error => {
          console.error('Error creating offer:', error);
          setConnectionError('Failed to create WebRTC offer');
        });
      }
    };

    const handleUserLeft = (data: { user: string }) => {
      console.log('User left:', data.user);
      setUsers(prev => prev.filter(user => user !== data.user));
      setRemoteStreams(prev => prev.filter(rs => rs.username !== data.user));
    };

    const handleWebRTCOffer = (data: { from: string; payload: RTCSessionDescriptionInit }) => {
      console.log('Received offer from:', data.from);
      handleOffer(data.from, data.payload).then(answer => {
        const success = sendMessage({
          type: 'webrtc-answer',
          data: {
            target: data.from,
            payload: answer
          }
        });
        
        if (!success) {
          console.error('Failed to send answer message');
          setConnectionError('Failed to establish connection with peer');
        }
      }).catch(error => {
        console.error('Error handling offer:', error);
        setConnectionError('Failed to handle WebRTC offer');
      });
    };

    const handleWebRTCAnswer = (data: { from: string; payload: RTCSessionDescriptionInit }) => {
      console.log('Received answer from:', data.from);
      handleAnswer(data.from, data.payload).catch(error => {
        console.error('Error handling answer:', error);
        setConnectionError('Failed to handle WebRTC answer');
      });
    };

    const handleWebRTCIceCandidate = (data: { from: string; payload: RTCIceCandidateInit }) => {
      console.log('Received ICE candidate from:', data.from);
      handleIceCandidate(data.from, data.payload).catch(error => {
        console.error('Error handling ICE candidate:', error);
        setConnectionError('Failed to handle ICE candidate');
      });
    };

    const handleChatMessage = (data: { from: string; text: string }) => {
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        from: data.from,
        text: data.text,
        timestamp: new Date()
      }]);
    };

    const handleError = (data: { message: string }) => {
      console.error('Server error:', data.message);
      setConnectionError(data.message);
    };

    // Добавляем обработчики
    addMessageHandler('user-joined', handleUserJoined);
    addMessageHandler('user-left', handleUserLeft);
    addMessageHandler('webrtc-offer', handleWebRTCOffer);
    addMessageHandler('webrtc-answer', handleWebRTCAnswer);
    addMessageHandler('webrtc-ice-candidate', handleWebRTCIceCandidate);
    addMessageHandler('chat-message', handleChatMessage);
    addMessageHandler('error', handleError);

    return () => {
      // Удаляем обработчики при размонтировании
      removeMessageHandler('user-joined');
      removeMessageHandler('user-left');
      removeMessageHandler('webrtc-offer');
      removeMessageHandler('webrtc-answer');
      removeMessageHandler('webrtc-ice-candidate');
      removeMessageHandler('chat-message');
      removeMessageHandler('error');
    };
  }, [username, sendMessage, addMessageHandler, removeMessageHandler, createOffer, handleOffer, handleAnswer, handleIceCandidate]);

  // Инициализация медиа и подключение к комнате
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsInitializing(true);
        setConnectionStatus('initializing-media');
        setConnectionError(null);
        
        // Попробуем получить устройства сначала без разрешения
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasDevices = devices.some(device => 
          (device.kind === 'audioinput' || device.kind === 'videoinput') && device.deviceId !== ''
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
        
        // Ждем установления WebSocket соединения
        setConnectionStatus('waiting-websocket');
        let attempts = 0;
        const maxAttempts = 30; // 30 попыток по 100мс = 3 секунды
        
        while (!isConnected && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!isConnected) {
          throw new Error('WebSocket connection failed');
        }
        
        setConnectionStatus('joining-room');
        // Подключаемся к комнате через WebSocket
        const success = sendMessage({
          type: 'join-room',
          data: {
            roomId,
            username
          }
        });
        
        if (success) {
          setConnectionStatus('connected');
        } else {
          throw new Error('Failed to send join message');
        }
      } catch (error) {
        console.error('Error initializing:', error);
        setConnectionStatus('error');
        setConnectionError(error.message);
        
        if (error.name === 'NotAllowedError') {
          setShowDeviceSelector(true);
        }
      } finally {
        setIsInitializing(false);
      }
    };

    // Запускаем инициализацию только когда WebSocket подключен или подключение в процессе
    if (isConnected || isConnecting) {
      initialize();
    }

    return () => {
      cleanup();
      disconnectWebSocket();
    };
  }, [roomId, username, initMedia, isConnected, isConnecting, sendMessage, cleanup, disconnectWebSocket]);

  const handleSendChatMessage = useCallback((text: string) => {
    // Отправляем через WebRTC data channel, если доступно
    if (users.length > 0) {
      users.forEach(user => {
        if (user !== username) {
          sendDataMessage(user, JSON.stringify({ type: 'chat', text }));
        }
      });
    }
    
    // Также отправляем через WebSocket для гарантии доставки
    sendMessage({
      type: 'chat-message',
      data: { text }
    });
    
    // Добавляем сообщение в локальный чат
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      from: username,
      text,
      timestamp: new Date()
    }]);
  }, [users, username, sendDataMessage, sendMessage]);

  const handleDevicesSelected = useCallback(async (deviceIds: { video: string; audio: string }) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceIds.video ? { deviceId: deviceIds.video } : true,
        audio: deviceIds.audio ? { deviceId: deviceIds.audio } : true
      });
      
      // Заменяем старый поток
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      setLocalStream(stream);
      setShowDeviceSelector(false);
      setConnectionStatus('connected');
      
    } catch (error) {
      console.error('Error accessing devices:', error);
      setConnectionError('Failed to access selected devices');
    }
  }, [localStream]);

  const handleDeviceSelectorCancel = useCallback(() => {
    setShowDeviceSelector(false);
    // Если у нас нет локального потока, перенаправляем на главную страницу
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
    reconnectWebSocket();
  }, [reconnectWebSocket]);

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
              {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={toggleMic}
            className={`p-2 rounded-full ${isMicMuted ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'}`}
            title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
            disabled={!localStream}
          >
            {isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          
          <button
            onClick={toggleCamera}
            className={`p-2 rounded-full ${isCameraOff ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'}`}
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
            {remoteStreams.map(remote => (
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
            <DeviceSelector 
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
              {connectionStatus === 'initializing-media' && 'Checking media devices...'}
              {connectionStatus === 'requesting-permission' && 'Requesting camera/microphone permission...'}
              {connectionStatus === 'waiting-websocket' && 'Waiting for server connection...'}
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