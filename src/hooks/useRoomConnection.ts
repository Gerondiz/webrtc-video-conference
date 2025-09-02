// hooks/useRoomConnection.ts
import { useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useRoomStore } from '@/stores/useRoomStore';
import {
    UserJoinedMessage,
    UserLeftMessage,
    WebRTCOfferMessage,
    WebRTCAnswerMessage,
    WebRTCIceCandidateMessage,
    ChatMessageData,
    ErrorMessage,
} from '@/types';

export const useRoomConnection = () => {
    const params = useParams<{ id: string }>();
    const searchParams = useSearchParams();
    const roomId = params.id;
    const username = searchParams.get('username') || 'User';
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
        cleanup: cleanupWebRTC,
    } = useWebRTC({
        onRemoteStream: (stream, userId) => {
            useRoomStore.getState().addRemoteStream({
                userId,
                username: userId,
                stream
            });
        },
        onDataChannelMessage: (message, userId) => {
            try {
                const parsedMessage = JSON.parse(message);
                if (parsedMessage.type === 'chat') {
                    useRoomStore.getState().addChatMessage({
                        id: Date.now().toString(),
                        from: userId,
                        text: parsedMessage.text,
                        timestamp: new Date(),
                    });
                }
            } catch (error) {
                console.error('Error parsing data channel message:', error);
            }
        },
    });
    const {
        setConnectionStatus,
        setConnectionError,
        setLocalStream,
        addUser,
        removeUser,
        addChatMessage,
        setIsInitializing,
        setWsConnected,
        setWsConnecting,
        users,
    } = useRoomStore();

    useEffect(() => {
        setWsConnected(isConnected);
    }, [isConnected, setWsConnected]);

    useEffect(() => {
        setWsConnecting(isConnecting);
    }, [isConnecting, setWsConnecting]);

    // Обработчики сообщений WebSocket
    useEffect(() => {
        const handleUserJoined = ({ user }: UserJoinedMessage) => {
            console.log('User joined:', user);
            addUser(user);
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
            removeUser(user);
            useRoomStore.getState().removeRemoteStream(user);
        };

        const handleWebRTCOffer = ({ from, payload }: WebRTCOfferMessage) => {
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

        const handleWebRTCAnswer = ({ from, payload }: WebRTCAnswerMessage) => {
            console.log('Received answer from:', from);
            handleAnswer(from, payload).catch((error) => {
                console.error('Error handling answer:', error);
                setConnectionError('Failed to handle WebRTC answer');
            });
        };

        const handleWebRTCIceCandidate = ({ from, payload }: WebRTCIceCandidateMessage) => {
            console.log('Received ICE candidate from:', from);
            handleIceCandidate(from, payload).catch((error) => {
                console.error('Error handling ICE candidate:', error);
                setConnectionError('Failed to handle ICE candidate');
            });
        };

        const handleChatMessage = ({ from, text }: ChatMessageData) => {
            addChatMessage({
                id: Date.now().toString(),
                from,
                text,
                timestamp: new Date(),
            });
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
        addUser,
        removeUser,
        addChatMessage,
        setConnectionError,
    ]);

    // Инициализация медиа и подключение к комнате
    const initializeRoom = useCallback(async () => {
        try {
            setIsInitializing(true);
            setConnectionStatus('checking-media');
            setConnectionError(null);

            // Получаем медиапоток из store (уже инициализирован на стартовой странице)
            const state = useRoomStore.getState();
            const localStream = state.localStream;

            // Если медиапоток готов
            if (localStream) {
                setLocalStream(localStream);
                setConnectionStatus('waiting-websocket');
            }
            // Если медиапотока нет (не получилось инициализировать на стартовой странице)
            else {
                setConnectionStatus('need-devices');
                // Перенаправляем на главную страницу
                setConnectionError('Media stream not available. Please go back and allow camera/microphone access.');
                return;
            }
        } catch (error: unknown) {
            console.error('Error initializing:', error);
            setConnectionStatus('error');
            const typedError = error as { code: number; message: string; name: string };
            setConnectionError(typedError.message);
            // Перенаправляем на главную страницу при ошибке
            // window.location.href = '/';
        } finally {
            setIsInitializing(false);
        }
    }, [
        setConnectionStatus,
        setConnectionError,
        setLocalStream,
        setIsInitializing,
    ]);

    // Очистка при размонтировании
    useEffect(() => {
        return () => {
            cleanupWebRTC();
            disconnectWebSocket();
            useRoomStore.getState().reset();
        };
    }, []);

    // Отслеживаем изменения состояния WebSocket соединения
    useEffect(() => {
        const state = useRoomStore.getState();
        // Проверяем, что:
        // 1. WebSocket подключен
        // 2. Медиапоток готов
        // 3. Пользователь еще не присоединился к комнате
        if (isConnected &&
            state.localStream &&
            !state.users.includes(username) &&
            !['connected', 'joining-room', 'connecting', 'error'].includes(state.connectionStatus)) {

            console.log('WebSocket connected and media ready, joining room...');
            setConnectionStatus('joining-room');

            sendMessage({
                type: 'join-room',
                data: {
                    roomId,
                    username,
                },
            });
        }
    }, [isConnected, roomId, username, sendMessage, setConnectionStatus]);

    // Добавляем обработчик подтверждения присоединения к комнате
    useEffect(() => {
        const handleRoomJoined = () => {
            console.log('Successfully joined room');
            setConnectionStatus('connected');
        };

        addMessageHandler('room-joined', handleRoomJoined);

        return () => {
            removeMessageHandler('room-joined');
        };
    }, [addMessageHandler, removeMessageHandler, setConnectionStatus]);

    useEffect(() => {
        const handleRoomJoined = () => {
            console.log('Successfully joined room');
            setConnectionStatus('connected');
        };

        addMessageHandler('room-joined', handleRoomJoined);

        return () => {
            removeMessageHandler('room-joined');
        };
    }, [addMessageHandler, removeMessageHandler, setConnectionStatus]);

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
            addChatMessage({
                id: Date.now().toString(),
                from: username,
                text,
                timestamp: new Date(),
            });
        },
        [users, username, sendDataMessage, sendMessage, addChatMessage]
    );


    const leaveRoom = useCallback(() => {
        cleanupWebRTC();
        disconnectWebSocket();
        // ПЕРЕНАПРАВЛЯЕМ НА ГЛАВНУЮ СТРАНИЦУ БЕЗ ОСТАНОВКИ МЕДИАПОТОКА
        window.location.href = '/';
    }, [cleanupWebRTC, disconnectWebSocket]);

    const retryConnection = useCallback(() => {
        setConnectionError(null);
        setConnectionStatus('connecting');
        initializeRoom();
    }, [setConnectionError, setConnectionStatus, initializeRoom]);

    return {
        roomId,
        username,
        initializeRoom,
        handleSendChatMessage,
        leaveRoom,
        retryConnection,
    };
};