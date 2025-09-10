// src/components/RoomPage/ChatPanel.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send } from "lucide-react";
import { useChatStore } from '@/stores/useChatStore';

interface ChatPanelProps {
  roomId: string;
  sendMessage?: (text: string) => void;
}

export default function ChatPanel({ sendMessage }: ChatPanelProps) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messages = useChatStore(state => state.messages);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    if (sendMessage) {
      sendMessage(newMessage);
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
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col shadow-xl">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
          <MessageCircle className="text-blue-500 mr-2" size={20} />
          Chat
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 dark:bg-gray-900/50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <div className="bg-gray-100 dark:bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="text-gray-400" size={32} />
            </div>
            <p className="font-medium">No messages yet</p>
            <p className="text-sm mt-1">Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              // Определяем, наше ли это сообщение по "You"
              const isOwnMessage = message.from === 'You';
              
              return (
                <div 
                  key={message.id} 
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                    <div className="flex items-baseline mb-1">
                      {!isOwnMessage && (
                        <span className="font-medium text-sm text-blue-600 dark:text-blue-400 mr-2">
                          {message.from}
                        </span>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <div className={`text-sm p-3 rounded-2xl ${
                      isOwnMessage
                        ? 'bg-blue-500 text-white rounded-br-none shadow-md'
                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm border border-gray-200 dark:border-gray-600'
                    }`}>
                      <p>{message.text}</p>
                    </div>
                  </div>
                  
                  {isOwnMessage && (
                    <div className="w-6 order-1"></div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white shadow-sm"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}