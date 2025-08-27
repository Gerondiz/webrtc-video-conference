"use client"

import React, { useState } from "react";

const MicrophoneTest = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      setIsRecording(true);
      console.log("Микрофон включен:", stream);
    } catch (error) {
      console.error("Ошибка при доступе к микрофону:", error);
    }
  };

  const stopRecording = () => {
    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      setAudioStream(null);
      console.log("Запись остановлена");
    }
  };

  return (
    <div>
      <button onClick={startRecording} disabled={isRecording}>
        Начать запись
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        Остановить запись
      </button>
      {isRecording ? <p>Микрофон включен...</p> : <p>Микрофон отключен.</p>}
    </div>
  );
};

export default MicrophoneTest;