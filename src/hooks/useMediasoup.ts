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

    // 1. Создание транспорта
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
                    console.log(`✅ Received webRtcTransportCreated for ${message.data.direction}:`, message.data.transportId);
                    if (message.type === 'webRtcTransportCreated' && message.data.direction === direction) {
                        removeMessageHandler('webRtcTransportCreated', handler);

                        const transportOptions = {
                            id: message.data.transportId,
                            iceParameters: message.data.iceParameters,
                            iceCandidates: message.data.iceCandidates,
                            dtlsParameters: message.data.dtlsParameters,
                        };

                        console.log('transportOptions', transportOptions);

                        const transport =
                            direction === 'send'
                                ? deviceRef.current!.createSendTransport(transportOptions)
                                : deviceRef.current!.createRecvTransport(transportOptions);

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

                        // --- ДОБАВИТЬ ЛОГИРОВАНИЕ СОБЫТИЙ ТРАНСПОРТА ---
                        transport.on('connectionstatechange', (state) => {
                            console.log(`🔌 Transport (${direction}) connection state changed to:`, state);
                            if (state === 'failed' || state === 'disconnected') {
                                console.error(`❌ Transport (${direction}) failed or disconnected! State:`, state);
                                // Здесь можно добавить дополнительную диагностику
                            }
                        });

                        transport.on('icecandidateerror', (state) => {
                            console.log(`🧊 Transport (${direction}) icecandidateerror:`, state);
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

                const createMessage: CreateTransportMessage = {
                    type: 'create-transport',
                    data: { direction },
                };
                sendMessage(createMessage);
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
                // ✅ Исправлено: правильный тип сообщения
                const consumeMessage: ConsumeMessage = {
                    type: 'consume',
                    data: {
                        transportId: recvTransportRef.current.id,
                        producerId,
                        rtpCapabilities: deviceRef.current.rtpCapabilities, // ✅ Правильное имя поля
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

                        // ✅ Получаем имя пользователя из маппинга
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

                            // Дополнительно очищаем поток
                            const stream = remoteStreamsRef.current.get(producerUserId);
                            if (stream) {
                                // Останавливаем все треки потока
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

    // 3. Инициализация
    const initializeMediasoup = useCallback(async () => {
        if (!localStream) return;

        try {
            // Получаем rtpCapabilities от сервера через joined-сообщение
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

            sendTransportRef.current = await createTransport('send');
            console.log('✅ Send transport created');
            recvTransportRef.current = await createTransport('recv');
            console.log('✅ Recv transport created');

            for (const track of localStream.getTracks()) {
                const kind = track.kind as 'audio' | 'video';
                const producer = await sendTransportRef.current.produce({ track });
                console.log(`🎤 Created ${kind} producer:`, producer.id);
                producersRef.current.set(producer.id, producer);
            }

            sendMessage({ type: 'get-producers', data: {} } as GetProducersMessage);
            console.log('📤 Sending get-producers request');
        } catch (error) {
            console.error('Error initializing mediasoup:', error);
        }
    }, [localStream, createTransport, sendMessage]);

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

            // Ищем consumer по producerId
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
                consumerToClose.close(); // Это вызовет событие 'close' у consumer.observer
            } else {
                // Consumer уже закрыт или не найден, вызываем onRemoteStreamRemoved напрямую
                console.log(`🔚 [${producerUserId}] No active consumer, cleaning up stream directly`);
                // Очищаем поток напрямую
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
        // Обновляем маппинг имен при изменении списка пользователей
        const updateUserNameMapping = () => {
            const users = useRoomStore.getState().users;
            users.forEach(user => {
                userNamesRef.current.set(user.id, user.username);
            });
        };

        // Вызываем обновление при монтировании
        updateUserNameMapping();

        // Подписываемся на изменения в хранилище комнаты
        // ✅ Исправлено: правильная подписка на Zustand store
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