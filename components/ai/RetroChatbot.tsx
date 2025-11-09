'use client';

import { useState, useEffect, useRef } from 'react';
import { CornerDownLeft, Loader2, X } from 'lucide-react';
import './RetroChatbot.css';
import { logChatInteraction } from '@/lib/firebase/analytics';
import useClickOutside from '@/hooks/useClickOutside';

const RetroChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<Array<{ role: string; parts: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  useClickOutside(chatWindowRef, () => {
    if (isOpen) {
      setIsOpen(false);
    }
  });

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [history]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    logChatInteraction(message);
    const newHistory = [...history, { role: 'user', parts: message }];
    setHistory(newHistory);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: newHistory.slice(0, -1), message }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const text = await response.text();
      setHistory([...newHistory, { role: 'model', parts: text }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage = 'SYSTEM ERROR: UNABLE TO COMPUTE. PLEASE CHECK THE CONSOLE LOGS, HUMAN.';
      setHistory([...newHistory, { role: 'model', parts: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="retro-chat-button">
          <span className="blink">_</span>AI Chat
        </button>
      )}

      {isOpen && (
        <div ref={chatWindowRef} className="retro-chatbot-window">
          <div className="retro-chatbot-screen">
            <div className="retro-chatbot-title-bar">
              <div className="title-text">AI ASSISTANT v2.1</div>
              <button onClick={() => setIsOpen(false)} className="close-button">
                <X size={18} />
              </button>
            </div>
            <div ref={bodyRef} className="retro-chatbot-body">
              {history.map((item, index) => (
                <div key={index} className={`chat-line ${item.role}`}>
                  <span className="prompt">{item.role === 'user' ? '>' : ''}</span>
                  <p>{item.parts}</p>
                </div>
              ))}
              {isLoading && (
                <div className="chat-line model">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
            </div>
            <div className="retro-chatbot-input-bar">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="retro-input"
                placeholder="TYPE YOUR COMMAND..."
                disabled={isLoading}
              />
              <button onClick={handleSendMessage} className="send-button" disabled={isLoading}>
                <CornerDownLeft size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RetroChatbot;
