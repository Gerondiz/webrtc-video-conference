// src/hooks/useMediasoup.ts
import { useEffect, useRef, useCallback } from 'react';
import { useMediaStream } from '@/contexts/MediaStreamContext';
import * as mediasoupClient from 'mediasoup-client';
import { UseWebSocketReturn } from '@/hooks/useWebSocket';
import { useRoomStore } from '@/stores/useRoomStore';

// ✅ Правильный импорт типов из mediasoup-client
type RtpCapabilities = mediasoupClient.types.RtpCapabilities;
type Transport = mediasoupClient.types.Transport;
type Producer = mediasoupClient.types.Producer;
type Consumer = mediasoupClient.types.Consumer;
type IceCandidate = mediasoupClient.types.IceCandidate;
type DtlsParameters = mediasoupClient.types.DtlsParameters;
type IceParameters = mediasoupClient.types.IceParameters; // Добавлено

// Импорты типов сообщений
import {
    WebRtcTransportCreatedMessage,
    ConnectTransportMessage,
    ProduceMessage,
    ProducedMessage,
    CreateTransportMessage,
    ConsumedMessage,
    ConsumeMessage,
    GetProducersMessage,
    NewProducerMessage,
    ProducerClosedMessage,
    ProducersListMessage,
    ErrorMessage,
    // Добавлено
    IceParameters as IceParametersMessage,
} from '@/types';

interface MediasoupOptions {
    roomId: string;
    userId: string;
    webSocket: UseWebSocketReturn;
    onRemoteStreamAdded: (stream: MediaStream, userId: string, username: string) => void;
    onRemoteStreamRemoved: (userId: string) => void;
}

export const useMediasoup = ({
    userId,
    onRemoteStreamAdded,
    onRemoteStreamRemoved,
    webSocket,
}: MediasoupOptions) => {
    const { stream: localStream } = useMediaStream();
    const { sendMessage, addMessageHandler, removeMessageHandler } = webSocket;

    const deviceRef = useRef<mediasoupClient.Device | null>(null);
    const sendTransportRef = useRef<Transport | null>(null);
    const recvTransportRef = useRef<Transport | null>(null);
    const producersRef = useRef<Map<string, Producer>>(new Map());
    const consumersRef = useRef<Map<string, Consumer>>(new Map());
    const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());

    // ✅ Храним маппинг userId -> username
    const userNamesRef = useRef<Map<string, string>>(new Map());

    // --- Добавлено: Ref для хранения iceServers ---
    const iceServersRef = useRef<RTCIceServer[]>([]);
    // ---


    // --- Добавлено: Функция для получения ICE серверов от SFU ---
    const fetchIceServers = useCallback(async (): Promise<RTCIceServer[]> => {
        try {
            // Используем NEXT_PUBLIC_SIGNALING_SERVER, так как он уже содержит базовый HTTPS URL
            const sfuBaseUrl = process.env.NEXT_PUBLIC_SIGNALING_SERVER || 'https://backend-mediasoup.onrender.com';
            const iceServersUrl = `${sfuBaseUrl}/ice-servers`;

            console.log(`🔧 Fetching ICE servers from: ${iceServersUrl}`);
            const response = await fetch(iceServersUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const iceServers: RTCIceServer[] = await response.json();
            console.log('🔧 Fetched ICE servers for browser:', iceServers);
            return iceServers;
        } catch (error) {
            console.error('❌ Failed to fetch ICE servers from SFU:', error);
            // Можно вернуть пустой массив или резервные сервера
            // Например, только Metered TURN для TCP, который может работать в корпоративной сети
            // return [
            //   { urls: "turn:global.relay.metered.ca:80?transport=tcp", username: "62ebcffbcf6c87c9ed6ce75c", credential: "6QxuV6wxCX5bEgL6" }
            // ];
            return [];
        }
    }, []);
    // ---


    // 1. Создание транспорта (обновлено)
    const createTransport = useCallback(
        async (direction: 'send' | 'recv'): Promise<Transport> => {
            console.log(`🚀 Creating ${direction} transport...`);
            console.log('✅ Using userId:', userId);

            if (!userId || userId === 'unknown') {
                console.warn('⚠️ User ID not set, cannot create transport');
                return Promise.reject(new Error('User ID not set'));
            }

            return new Promise<Transport>((resolve) => {
                const handler = (message: WebRtcTransportCreatedMessage) => {
                    // ... логика обработки message ...

                    if (message.type === 'webRtcTransportCreated' && message.data.direction === direction) {
                        removeMessageHandler('webRtcTransportCreated', handler);

                        // Подготовка опций транспорта
                        const transportOptions: mediasoupClient.types.TransportOptions = {
                            id: message.data.transportId,
                            iceParameters: message.data.iceParameters as IceParameters,
                            iceCandidates: message.data.iceCandidates as IceCandidate[],
                            dtlsParameters: message.data.dtlsParameters as DtlsParameters,
                            iceServers: iceServersRef.current,
                        };

                        console.log('🔧 Creating transport with options (including iceServers):', transportOptions);

                        let transport: Transport;
                        try {
                            transport =
                                direction === 'send'
                                    ? deviceRef.current!.createSendTransport(transportOptions)
                                    : deviceRef.current!.createRecvTransport(transportOptions);
                        } catch (creationError: unknown) { // Указываем тип unknown
                            console.error(`❌ Error creating ${direction} transport:`, creationError);
                            // Проверяем, является ли ошибка объектом Error перед доступом к .message
                            const errorMessage = creationError instanceof Error ? creationError.message : String(creationError);
                            sendMessage({
                                type: 'error',
                                data: { message: `Transport creation failed: ${errorMessage}` }
                            } as ErrorMessage);
                            return; // Выходим из обработчика
                        }

                        // --- Исправленные обработчики событий ---
                        // Для событий, которые поддерживаются mediasoup-client, используем их напрямую
                        transport.on('connect', ({ dtlsParameters }, callback) => {
                            // ... логика connect ...
                        });

                        transport.on('connectionstatechange', (state) => {
                            console.log(`🔌 Transport (${direction}) connection state changed to:`, state);
                            if (state === 'failed' || state === 'disconnected') {
                                console.error(`❌ Transport (${direction}) failed or disconnected! State:`, state);
                            }
                        });

                        // Для событий WebRTC, которые могут не быть напрямую доступны через mediasoup-client,
                        // но доступны через underlying peerconnection, можно использовать getAppData
                        // или обернуть в any. Однако, часто они работают.
                        // Попробуем сначала напрямую, если TypeScript ругается, обернем в any или используем getAppData.

                        // Вариант 1: Попробовать напрямую (может вызвать ошибку TS)
                        // transport.on('iceconnectionstatechange', (state) => {
                        //     console.log(`🧊 Transport (${direction}) ICE connection state changed to:`, state);
                        //     if (state === 'failed') {
                        //         console.error(`🧊 Transport (${direction}) ICE connection failed! State:`, state);
                        //     }
                        // });

                        // Вариант 2: Использовать getAppData для доступа к underlying peerconnection
                        // Это более сложный и менее надежный способ, но иногда единственный.

                        // Вариант 3: Приведение к any (работает, но теряем проверку типов)
                        // (transport as any).on('iceconnectionstatechange', (state: string) => {
                        //     console.log(`🧊 Transport (${direction}) ICE connection state changed to:`, state);
                        //     if (state === 'failed') {
                        //         console.error(`🧊 Transport (${direction}) ICE connection failed! State:`, state);
                        //     }
                        // });

                        // (transport as any).on('icestatechange', (state: string) => {
                        //     console.log(`🧊🧊 Transport (${direction}) ICE gathering state changed to:`, state);
                        // });

                        // (transport as any).on('icecandidate', (candidate: RTCIceCandidate) => {
                        //     console.log(`🧊 Candidate gathered for transport (${direction}):`, candidate);
                        // });

                        transport.on('icecandidateerror', (event) => {
                            // event может быть кастомным для mediasoup или стандартным
                            console.warn(`🧊 ICE Candidate Error for transport (${direction}):`, event);
                        });

                        if (direction === 'send') {
                            transport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
                                // ... логика produce ...
                            });
                        }
                        // --- Конец исправленных обработчиков ---

                        resolve(transport);
                    }
                };

                addMessageHandler('webRtcTransportCreated', handler);
                // ... остальная логика ...
            });
        },
        [sendMessage, addMessageHandler, removeMessageHandler, userId]
    );

    // 2. Подписка на поток (без изменений)
    const consume = useCallback(
        async (producerId: string, producerUserId: string): Promise<void> => {
            console.log(`🎧 Attempting to consume producer ${producerId} from user ${producerUserId}...`);
            if (!recvTransportRef.current || !deviceRef.current) return;

            try {
                const consumeMessage: ConsumeMessage = {
                    type: 'consume',
                    data: {
                        transportId: recvTransportRef.current.id,
                        producerId,
                        rtpCapabilities: deviceRef.current.rtpCapabilities,
                    },
                };

                sendMessage(consumeMessage);

                const handler = async (message: ConsumedMessage) => {
                    console.log('✅ Received consumed message:', message.data);
                    if (message.type === 'consumed' && message.data.producerId === producerId) {
                        removeMessageHandler('consumed', handler);

                        const { consumerId, rtpParameters, kind } = message.data;

                        const consumer = await recvTransportRef.current!.consume({
                            id: consumerId,
                            producerId,
                            kind: kind as 'audio' | 'video',
                            rtpParameters,
                        });

                        consumersRef.current.set(consumerId, consumer);

                        const track = consumer.track;
                        if (!track) return;

                        const username = userNamesRef.current.get(producerUserId) || 'Unknown';

                        let remoteStream = remoteStreamsRef.current.get(producerUserId);
                        if (!remoteStream) {
                            remoteStream = new MediaStream();
                            remoteStreamsRef.current.set(producerUserId, remoteStream);
                            onRemoteStreamAdded(remoteStream, producerUserId, username);
                        }

                        remoteStream.addTrack(track);

                        console.log(`🎬 Added ${track.kind} track to remote stream for user ${producerUserId} (${username})`);

                        consumer.observer.on('close', () => {
                            consumersRef.current.delete(consumerId);
                            onRemoteStreamRemoved(producerUserId);

                            const stream = remoteStreamsRef.current.get(producerUserId);
                            if (stream) {
                                stream.getTracks().forEach(track => {
                                    track.stop();
                                });
                                remoteStreamsRef.current.delete(producerUserId);
                            }
                        });
                    }
                };

                addMessageHandler('consumed', handler);
            } catch (error) {
                console.error('Error consuming:', error);
            }
        },
        [sendMessage, addMessageHandler, removeMessageHandler, onRemoteStreamAdded, onRemoteStreamRemoved]
    );


    // 3. Инициализация (обновлена)
    const initializeMediasoup = useCallback(async () => {
        if (!localStream) {
            console.warn('⚠️ Cannot initialize mediasoup: localStream is null');
            return;
        }

        try {
            // --- НОВОЕ: Получаем ICE сервера перед инициализацией ---
            if (iceServersRef.current.length === 0) {
                console.log('🔍 Fetching ICE servers before device initialization...');
                iceServersRef.current = await fetchIceServers();
                if (iceServersRef.current.length === 0) {
                    console.warn('⚠️ No ICE servers fetched. WebRTC connection might fail behind NAT/Firewall.');
                }
            }
            // ---

            // Получаем rtpCapabilities (обычно от сервера, но тут захардкожено как в вашем коде)
            // В реальном приложении их следует получить через WebSocket после 'join-room'
            const rtpCapabilities: RtpCapabilities = {
                codecs: [
                    {
                        kind: 'audio',
                        mimeType: 'audio/opus',
                        preferredPayloadType: 100,
                        clockRate: 48000,
                        channels: 2,
                        parameters: {
                            useinbandfec: 1,
                        },
                        rtcpFeedback: [],
                    },
                    {
                        kind: 'video',
                        mimeType: 'video/VP8',
                        preferredPayloadType: 101,
                        clockRate: 90000,
                        parameters: {},
                        rtcpFeedback: [
                            { type: 'nack' },
                            { type: 'nack', parameter: 'pli' },
                            { type: 'goog-remb' },
                        ],
                    },
                ],
                headerExtensions: [],
            };

            deviceRef.current = new mediasoupClient.Device();
            await deviceRef.current.load({ routerRtpCapabilities: rtpCapabilities });
            console.log('✅ Mediasoup Device loaded');

            sendTransportRef.current = await createTransport('send');
            console.log('✅ Send transport created');
            recvTransportRef.current = await createTransport('recv');
            console.log('✅ Recv transport created');

            for (const track of localStream.getTracks()) {
                const kind = track.kind as 'audio' | 'video';
                if (sendTransportRef.current) { // Проверка на null
                    const producer = await sendTransportRef.current.produce({ track });
                    console.log(`🎤 Created ${kind} producer:`, producer.id);
                    producersRef.current.set(producer.id, producer);
                } else {
                    console.error('❌ Send transport is not available for producing');
                }
            }

            sendMessage({ type: 'get-producers', data: {} } as GetProducersMessage);
            console.log('📤 Sending get-producers request');
        } catch (error) {
            console.error('Error initializing mediasoup:', error);
        }
    }, [localStream, createTransport, sendMessage, fetchIceServers]); // Добавлены зависимости

    // 5. Очистка
    const cleanup = useCallback(() => {
        producersRef.current.forEach((producer) => producer.close());
        consumersRef.current.forEach((consumer) => consumer.close());
        sendTransportRef.current?.close();
        recvTransportRef.current?.close();
        deviceRef.current = null;
        userNamesRef.current.clear(); // ✅ Очищаем маппинг при очистке
    }, []);

    // 6. Обработка ошибок
    useEffect(() => {
        const handleError = (message: ErrorMessage) => {
            console.error('❌ SFU Error:', message.data.message);
        };

        addMessageHandler('error', handleError);

        return () => {
            removeMessageHandler('error', handleError);
        };
    }, [addMessageHandler, removeMessageHandler]);

    return {
        initializeMediasoup,
        cleanup,
    };
};