// src/components/RoomPage/ChatPanel.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send } from "lucide-react";

interface ChatMessage {
  id: string;
  from: string;
  text: string;
  timestamp: Date;
}

interface ChatPanelProps {
  roomId: string;
  sendMessage?: (message: {
    type: string;
    roomId: string;
    text: string;
  }) => void;
}

export default function ChatPanel({ roomId, sendMessage }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      from: "You",
      text: newMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, message]);

    // Отправка сообщения через WebSocket, если функция предоставлена
    if (sendMessage) {
      sendMessage({
        type: "chat-message",
        roomId,
        text: newMessage,
      });
    }

    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          Chat
        </h2>
        <MessageCircle className="text-gray-500" size={20} />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div key={message.id} className="flex flex-col">
                <div className="flex justify-between items-baseline">
                  <span className="font-medium text-sm text-blue-600 dark:text-blue-400">
                    {message.from}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                  {message.text}
                </p>
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
