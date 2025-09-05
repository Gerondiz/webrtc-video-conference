## WebRTC Video Conference - Протокол взаимодействия
Обзор
Этот документ описывает протокол взаимодействия между фронтенд-приложением и сигнальным сервером для WebRTC видеоконференций.


Клиент отправляет:

'join-room': присоединиться к комнате (комната создается, если не существует)

'create-transport': создать транспорт для отправки или приема

'connect-transport': подключить транспорт с DTLS параметрами

'produce': начать производить медиапоток

'consume': потреблять медиапоток другого пользователя

'leave-room': покинуть комнату

Сервер отправляет:

'joined': подтверждение присоединения к комнате

'user-joined': уведомление о новом пользователе

'user-left': уведомление о выходе пользователя

'webRtcTransportCreated': создан транспорт (возвращает id, iceParameters, iceCandidates, dtlsParameters)

'produced': подтверждение создания производителя

'new-producer': уведомление о новом производителе (чтобы другие могли подписаться)

'consumed': подтверждение создания потребителя (возвращает id потребителя, параметры и т.д.)


## Базовый формат сообщений

Все сообщения передаются в формате JSON с следующей структурой:

typescript
{
  type: string;    // Тип сообщения
  data: any;       // Данные сообщения
}

Типы сообщений

# От клиента к серверу

1. join-room
Присоединение к комнате.

Формат:

typescript
{
  type: "join-room",
  data: {
    roomId: string;    // ID комнаты
    username: string;  // Имя пользователя
  }
}

2. leave-room
Выход из комнаты.

Формат:

typescript
{
  type: "leave-room",
  data: {
    roomId: string;    // ID комнаты
    username: string;  // Имя пользователя
  }
}

3. chat-message
Отправка сообщения в чат.

Формат:

typescript
{
  type: "chat-message",
  data: {
    from: string;      // Отправитель
    text: string;      // Текст сообщения
    timestamp: string; // Временная метка (ISO format)
  }
}

4. webrtc-offer
WebRTC offer для установления соединения.

Формат:

typescript
{
  type: "webrtc-offer",
  data: {
    target: string;                 // ID целевого пользователя
    payload: RTCSessionDescription; // WebRTC offer
  }
}

5. webrtc-answer
WebRTC answer в ответ на offer.

Формат:

typescript
{
  type: "webrtc-answer",
  data: {
    target: string;                 // ID целевого пользователя
    payload: RTCSessionDescription; // WebRTC answer
  }
}

6. webrtc-ice-candidate
WebRTC ICE candidate для установления соединения.

Формат:

typescript
{
  type: "webrtc-ice-candidate",
  data: {
    target: string;            // ID целевого пользователя
    payload: RTCIceCandidate;  // ICE candidate
  }
}

## От сервера к клиенту

1. user-joined
Уведомление о новом пользователе.

Формат:

typescript
{
  type: "user-joined",
  data: {
    user: string;  // Имя пользователя
  }
}

2. user-left
Уведомление о выходе пользователя.

Формат:

typescript
{
  type: "user-left",
  data: {
    user: string;  // Имя пользователя
  }
}

3. joined
Подтверждение присоединения к комнате.

Формат:

typescript
{
  type: "joined",
  data: {
    roomId: string;    // ID комнаты
    users: string[];   // Список пользователей в комнате
  }
}

4. error
Сообщение об ошибке.

Формат:

typescript
{
  type: "error",
  data: {
    message: string;  // Текст ошибки
  }
}

## Последовательность взаимодействия

# Присоединение к комнате
Клиент подключается к WebSocket серверу

Клиент отправляет join-room сообщение

Сервер отвечает joined сообщением со списком пользователей

Сервер рассылает user-joined сообщение всем участникам комнаты

# Обмен сообщениями чата
Клиент отправляет chat-message сообщение

Сервер рассылает сообщение всем участникам комнаты

# Установление WebRTC соединения
Клиент A создает WebRTC offer и отправляет webrtc-offer сообщение

Сервер пересылает offer целевому клиенту B

Клиент B создает answer и отправляет webrtc-answer сообщение

Сервер пересылает answer клиенту A

Оба клиента обмениваются ICE candidates через webrtc-ice-candidate сообщения

# Выход из комнаты
Клиент отправляет leave-room сообщение

Сервер рассылает user-left сообщение всем участникам комнаты


This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
