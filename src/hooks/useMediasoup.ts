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
type IceParameters = mediasoupClient.types.IceParameters;

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

        const ICEtestin = true;

        if (ICEtestin) {
            return [
                { urls: "turn:global.relay.metered.ca:80?transport=tcp", username: "62ebcffbcf6c87c9ed6ce75c", credential: "6QxuV6wxCX5bEgL6" }
            ];
        } else {
            try {
                // Используем NEXT_PUBLIC_SIGNALING_SERVER, так как он уже содержит базовый HTTPS URL
                const sfuBaseUrl = (process.env.NEXT_PUBLIC_SIGNALING_SERVER || 'https://backend-mediasoup.onrender.com').trim();
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
                // Возвращаем резервный TURN сервер Metered для TCP
                return [
                    { urls: "turn:global.relay.metered.ca:80?transport=tcp", username: "62ebcffbcf6c87c9ed6ce75c", credential: "6QxuV6wxCX5bEgL6" }
                ];
            }
        }
    }, []);
    // ---


    // 1. Создание транспорта
    const createTransport = useCallback(
        async (direction: 'send' | 'recv'): Promise<Transport> => {
            console.log(`🚀 Creating ${direction} transport...`);
            console.log('✅ Using userId:', userId);

            if (!userId || userId === 'unknown') {
                console.warn('⚠️ User ID not set, cannot create transport');
                return Promise.reject(new Error('User ID not set'));
            }

            return new Promise<Transport>((resolve, reject) => { // Добавлен reject
                const handler = (message: WebRtcTransportCreatedMessage) => {
                    console.log(`✅ Received webRtcTransportCreated for ${message.data.direction}:`, message.data.transportId);
                    if (message.type === 'webRtcTransportCreated' && message.data.direction === direction) {
                        removeMessageHandler('webRtcTransportCreated', handler);

                        // --- Обновлено: Подготовка опций транспорта с iceServers ---
                        const transportOptions: mediasoupClient.types.TransportOptions = {
                            id: message.data.transportId,
                            iceParameters: message.data.iceParameters as IceParameters,
                            iceCandidates: message.data.iceCandidates as IceCandidate[],
                            dtlsParameters: message.data.dtlsParameters as DtlsParameters,
                            iceServers: iceServersRef.current, // Передаем iceServers
                        };

                        console.log('🔧 Creating transport with options (including iceServers):', transportOptions);

                        let transport: Transport;
                        try {
                            transport =
                                direction === 'send'
                                    ? deviceRef.current!.createSendTransport(transportOptions)
                                    : deviceRef.current!.createRecvTransport(transportOptions);
                        } catch (creationError: unknown) {
                            console.error(`❌ Error creating ${direction} transport:`, creationError);
                            const errorMessage = creationError instanceof Error ? creationError.message : String(creationError);
                            sendMessage({
                                type: 'error',
                                data: { message: `Transport creation failed: ${errorMessage}` }
                            } as ErrorMessage);
                            reject(new Error(`Transport creation failed: ${errorMessage}`)); // Reject promise
                            return;
                        }

                        transport.on('connect', ({ dtlsParameters }, callback) => {
                            console.log('🔗 Connecting transport:', message.data.transportId);
                            console.log('sendMessage: connect-transport');
                            const connectMessage: ConnectTransportMessage = {
                                type: 'connect-transport',
                                data: { transportId: message.data.transportId, dtlsParameters },
                            };
                            sendMessage(connectMessage);
                            callback();
                        });

                        transport.on('connectionstatechange', (state) => {
                            console.log(`🔌 Transport (${direction}) connection state changed to:`, state);
                            if (state === 'failed' || state === 'disconnected') {
                                console.error(`❌ Transport (${direction}) failed or disconnected! State:`, state);
                            }
                        });

                        // Добавляем обработчики для диагностики ICE
                        transport.on('icecandidateerror', (event) => {
                            console.warn(`🧊 ICE Candidate Error for transport (${direction}):`, event);
                        });

                        if (direction === 'send') {
                            transport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
                                try {
                                    console.log('📤 Sending produce message with rtpParameters:', rtpParameters);

                                    const produceMessage: ProduceMessage = {
                                        type: 'produce',
                                        data: {
                                            transportId: message.data.transportId,
                                            kind,
                                            rtpParameters,
                                        },
                                    };
                                    sendMessage(produceMessage);

                                    const producedHandler = (msg: ProducedMessage) => {
                                        if (msg.type === 'produced') {
                                            removeMessageHandler('produced', producedHandler);
                                            callback({ id: msg.data.producerId });
                                        }
                                    };
                                    addMessageHandler('produced', producedHandler);
                                } catch (error: unknown) {
                                    const err = error instanceof Error ? error : new Error('Unknown error');
                                    errback(err);
                                }
                            });
                        }

                        resolve(transport);
                    }
                };

                addMessageHandler('webRtcTransportCreated', handler);

                // --- КРИТИЧЕСКОЕ ИЗМЕНЕНИЕ: Отправка сообщения на сервер ---
                const createMessage: CreateTransportMessage = {
                    type: 'create-transport',
                    data: { direction },
                };
                sendMessage(createMessage);
                // --- КОНЕЦ КРИТИЧЕСКОГО ИЗМЕНЕНИЯ ---
            });
        },
        [sendMessage, addMessageHandler, removeMessageHandler, userId]
    );

    // 2. Подписка на поток
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
                                stream.getTracks().forEach(track => track.stop());
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

    // 3. Инициализация
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

            // Захардкоженные rtpCapabilities (как в вашем коде)
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

            // --- КРИТИЧЕСКОЕ ИЗМЕНЕНИЕ: Добавлен await ---
            sendTransportRef.current = await createTransport('send');
            console.log('✅ Send transport created');
            recvTransportRef.current = await createTransport('recv');
            console.log('✅ Recv transport created');
            // --- КОНЕЦ КРИТИЧЕСКОГО ИЗМЕНЕНИЯ ---

            for (const track of localStream.getTracks()) {
                const kind = track.kind as 'audio' | 'video';
                if (sendTransportRef.current) {
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
    }, [localStream, createTransport, sendMessage, fetchIceServers]); // Обновлены зависимости

    // 4. Обработчики сообщений
    useEffect(() => {
        const handleNewProducer = (message: NewProducerMessage) => {
            const { producerId, userId: producerUserId } = message.data;
            if (producerUserId !== userId) {
                consume(producerId, producerUserId);
            }
        };

        const handleProducerClosed = (message: ProducerClosedMessage) => {
            const { producerId, userId: producerUserId } = message.data;
            console.log(`🔚 [${producerUserId}] Producer closed notification: ${producerId}`);

            let consumerToClose: Consumer | undefined;
            let consumerId: string | undefined;

            consumersRef.current.forEach((consumer, id) => {
                if (consumer.producerId === producerId) {
                    consumerToClose = consumer;
                    consumerId = id;
                }
            });

            if (consumerToClose && consumerId) {
                console.log(`🔚 [${producerUserId}] Closing consumer ${consumerId} for producer ${producerId}`);
                consumerToClose.close();
            } else {
                console.log(`🔚 [${producerUserId}] No active consumer, cleaning up stream directly`);
                const stream = remoteStreamsRef.current.get(producerUserId);
                if (stream) {
                    console.log(`🔚 [${producerUserId}] Stopping ${stream.getTracks().length} tracks`);
                    stream.getTracks().forEach(track => {
                        console.log(`⏹️ [${producerUserId}] Stopping track: ${track.kind}`);
                        track.stop();
                    });
                    remoteStreamsRef.current.delete(producerUserId);
                }
                onRemoteStreamRemoved(producerUserId);
            }
        };

        const handleProducersList = (message: ProducersListMessage) => {
            console.log('📋 Received producers list:', message.data.producers);
            message.data.producers.forEach((p) => {
                if (p.userId !== userId) {
                    consume(p.producerId, p.userId);
                }
            });
        };

        addMessageHandler('new-producer', handleNewProducer);
        addMessageHandler('producer-closed', handleProducerClosed);
        addMessageHandler('producers-list', handleProducersList);

        return () => {
            removeMessageHandler('new-producer', handleNewProducer);
            removeMessageHandler('producer-closed', handleProducerClosed);
            removeMessageHandler('producers-list', handleProducersList);
        };
    }, [addMessageHandler, removeMessageHandler, consume, onRemoteStreamRemoved, userId]);

    // ✅ Добавляем обработчик для обновления имен пользователей
    useEffect(() => {
        const updateUserNameMapping = () => {
            const users = useRoomStore.getState().users;
            users.forEach(user => {
                userNamesRef.current.set(user.id, user.username);
            });
        };

        updateUserNameMapping();
        const unsubscribe = useRoomStore.subscribe(updateUserNameMapping);

        return () => {
            unsubscribe();
        };
    }, []);

    // 5. Очистка
    const cleanup = useCallback(() => {
        producersRef.current.forEach((producer) => producer.close());
        consumersRef.current.forEach((consumer) => consumer.close());
        sendTransportRef.current?.close();
        recvTransportRef.current?.close();
        deviceRef.current = null;
        userNamesRef.current.clear();
        iceServersRef.current = []; // Очищаем ref с iceServers
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