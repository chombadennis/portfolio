'use client';

import { useState, useEffect, useRef } from 'react';
import { CornerDownLeft, Loader2, X } from 'lucide-react';
import './RetroChatbot.css';
import { logChatInteraction } from '@/lib/firebase/analytics';
import useClickOutside from '@/hooks/useClickOutside';

// Custom hook for the typing effect
const useTypingEffect = (text: string, speed = 30) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (text) {
      setDisplayedText(''); // Reset before starting new text
      let i = 0;
      const intervalId = setInterval(() => {
        if (i < text.length) {
          setDisplayedText((prev) => prev + text.charAt(i));
          i++;
        } else {
          clearInterval(intervalId);
        }
      }, speed);

      return () => clearInterval(intervalId);
    }
  }, [text, speed]);

  return displayedText;
};

const ChatLine = ({ role, text }: { role: string; text: string }) => {
  const displayedText = useTypingEffect(text);
  return (
    <div className={`chat-line ${role}`}>
      <span className="prompt">{role === 'user' ? '>' : ''}</span>
      <p style={{ whiteSpace: 'pre-line' }}>{displayedText}</p>
    </div>
  );
};

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

  // Fetch initial greeting when chat opens
  useEffect(() => {
    if (isOpen && history.length === 0) {
      const fetchGreeting = async () => {
        setIsLoading(true);
        try {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ history: [], message: 'GREETING_REQUEST' }),
          });
          const text = await response.text();
          // The API will send a friendly error message with a 500 status
          // which we can display directly to the user.
          setHistory([{ role: 'model', parts: text }]);
        } catch (error) {
          console.error('Chatbot greeting error:', error);
          setHistory([{
            role: 'model',
            parts: "My connection seems to be down. Please try again in a moment."
          }]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchGreeting();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen, isLoading]);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [history, isLoading]);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

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

      const text = await response.text();
      // The API will send a friendly error message with a 500 status
      // which we can display directly to the user.
      setHistory([...newHistory, { role: 'model', parts: text }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage = 'My connection seems to be down. Please check your network and try again.';
      setHistory([...newHistory, { role: 'model', parts: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setHistory([]);
  };

  return (
    <>
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="retro-chat-button">
          <span className="blink">_</span>Chat
        </button>
      )}

      {isOpen && (
        <div ref={chatWindowRef} className="retro-chatbot-window">
          <div className="retro-chatbot-screen">
            <div className="retro-chatbot-title-bar">
              <div className="title-text" onClick={resetChat} title="Click to reset chat">Neneh v3.1</div>
              <button onClick={() => setIsOpen(false)} className="close-button">
                <X size={18} />
              </button>
            </div>
            <div ref={bodyRef} className="retro-chatbot-body">
              {history.map((item, index) => {
                if (index < history.length - 1 || item.role === 'user') {
                  return (
                    <div key={index} className={`chat-line ${item.role}`}>
                      <span className="prompt">{item.role === 'user' ? '>' : ''}</span>
                      <p style={{ whiteSpace: 'pre-line' }}>{item.parts}</p>
                    </div>
                  );
                }
                return <ChatLine key={index} role={item.role} text={item.parts} />;
              })}
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
