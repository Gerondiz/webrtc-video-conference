// src/hooks/useMediasoup.ts
import { useEffect, useRef, useCallback } from 'react';
import { useMediaStream } from '@/contexts/MediaStreamContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import * as mediasoupClient from 'mediasoup-client';

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
    ErrorMessage
} from '@/types';

// ✅ Правильный импорт типов из mediasoup-client
type Transport = mediasoupClient.types.Transport;
type Producer = mediasoupClient.types.Producer;
type Consumer = mediasoupClient.types.Consumer;
type RtpCapabilities = mediasoupClient.types.RtpCapabilities;

interface MediasoupOptions {
    roomId: string;
    userId: string;
    onRemoteStreamAdded: (stream: MediaStream, userId: string, username: string) => void;
    onRemoteStreamRemoved: (userId: string) => void;
}

export const useMediasoup = ({
    roomId,
    userId,
    onRemoteStreamAdded,
    onRemoteStreamRemoved,
}: MediasoupOptions) => {
    const { stream: localStream } = useMediaStream();
    const { sendMessage, addMessageHandler, removeMessageHandler } = useWebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000');

    const deviceRef = useRef<mediasoupClient.Device | null>(null);
    const sendTransportRef = useRef<Transport | null>(null);
    const recvTransportRef = useRef<Transport | null>(null);
    const producersRef = useRef<Map<string, Producer>>(new Map());
    const consumersRef = useRef<Map<string, Consumer>>(new Map());
    const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());

    // 1. Создание транспорта
    const createTransport = useCallback(
        async (direction: 'send' | 'recv'): Promise<Transport> => {
            console.log(`🚀 Creating ${direction} transport...`);

            console.log('✅ Using userId:', userId);

            if (!userId || userId === 'unknown') {
                console.warn('⚠️ User ID not set, cannot create transport');
                return Promise.reject(new Error('User ID not set'));
            }            

            return new Promise<Transport>((resolve, reject) => {

                const handler = (message: WebRtcTransportCreatedMessage) => {
                    console.log(`✅ Received webRtcTransportCreated for ${message.data.direction}:`, message.data.transportId);
                    if (message.type === 'webRtcTransportCreated' && message.data.direction === direction) {
                        removeMessageHandler('webRtcTransportCreated', handler);

                        // ✅ Правильная структура: добавляем id
                        const transportOptions = {
                            id: message.data.transportId,
                            iceParameters: message.data.iceParameters,
                            iceCandidates: message.data.iceCandidates,
                            dtlsParameters: message.data.dtlsParameters,
                        };

                        const transport =
                            direction === 'send'
                                ? deviceRef.current!.createSendTransport(transportOptions)
                                : deviceRef.current!.createRecvTransport(transportOptions);

                        transport.on('connect', ({ dtlsParameters }, callback, errback) => {
                            console.log('🔗 Connecting transport:', message.data.transportId);
                            console.log('sendMessage: connect-transport');
                            const connectMessage: ConnectTransportMessage = {
                                type: 'connect-transport',
                                data: { transportId: message.data.transportId, dtlsParameters },
                            };
                            sendMessage(connectMessage);
                            callback();
                        });

                        if (direction === 'send') {
                            transport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
                                try {
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
                                } catch (error) {
                                    errback(error);
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
                const consumeMessage: ConsumeMessage = {
                    type: 'consume',
                    data: {
                        transportId: recvTransportRef.current.id,
                        producerId,
                        rtpCapabilities: deviceRef.current.rtpCapabilities,
                    },
                };

                sendMessage(consumeMessage);

                const handler = async (message: ConsumedMessage) => { // ✅ async
                    console.log('✅ Received consumed message:', message.data);
                    if (message.type === 'consumed' && message.data.producerId === producerId) {
                        removeMessageHandler('consumed', handler);

                        const { consumerId, rtpParameters, kind } = message.data;

                        // ✅ AWAIT — consume() возвращает Promise<Consumer>
                        const consumer = await recvTransportRef.current!.consume({
                            id: consumerId,
                            producerId,
                            kind: kind as 'audio' | 'video',
                            rtpParameters,
                        });

                        consumersRef.current.set(consumerId, consumer);

                        const track = consumer.track;
                        if (!track) return;

                        let remoteStream = remoteStreamsRef.current.get(producerUserId);
                        if (!remoteStream) {
                            remoteStream = new MediaStream();
                            remoteStreamsRef.current.set(producerUserId, remoteStream);
                            onRemoteStreamAdded(remoteStream, producerUserId, 'Unknown');
                        }

                        remoteStream.addTrack(track);

                        console.log(`🎬 Added ${track.kind} track to remote stream for user ${producerUserId}`);

                        consumer.observer.on('close', () => {
                            consumersRef.current.delete(consumerId);
                            onRemoteStreamRemoved(producerUserId);
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
            // ✅ Получаем rtpCapabilities от сервера через joined-сообщение
            // Пока используем заглушку — в продакшене получай из useRoomConnection
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

            const { producerId, userId } = message.data;
            const consumer = Array.from(consumersRef.current.values()).find((c) => c.producerId === producerId);
            if (consumer) {
                consumer.close();
                consumersRef.current.delete(consumer.id);
                onRemoteStreamRemoved(userId);
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

    // 5. Очистка
    const cleanup = useCallback(() => {
        producersRef.current.forEach((producer) => producer.close());
        consumersRef.current.forEach((consumer) => consumer.close());
        sendTransportRef.current?.close();
        recvTransportRef.current?.close();
        deviceRef.current = null;
    }, []);

    // 6. Оюработка ошибок
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