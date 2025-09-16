'use client';
import { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';
import { FiSend } from 'react-icons/fi';
import Button from '../ui/Button';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

const ChatInterface = ({ noteId }: { noteId: string }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { refreshUser } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data } = await api.post('/doubt-solver/ask', { noteId, question: input });
      const aiMessage: Message = { sender: 'ai', text: data.answer };
      setMessages(prev => [...prev, aiMessage]);
      await refreshUser(); // Refresh user data to update credits
    } catch (error: any) {
      const errorMessage: Message = { sender: 'ai', text: error.response?.data?.message || "Sorry, I couldn't process that. Please try again." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-3xl shadow-2xl h-[70vh] flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
      
      <div className="relative z-10 flex-1 p-6 space-y-4 overflow-y-auto">
        {messages.length === 0 && (
            <div className="text-center h-full flex flex-col justify-center items-center">
                <div className="w-20 h-20 glass-card rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                  <span className="text-3xl">🤖</span>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">AI Doubt Solver</h3>
                <p className="text-gray-600 dark:text-gray-400">Ask any question based on the content of this note.</p>
            </div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md p-4 rounded-2xl shadow-lg relative overflow-hidden ${
              msg.sender === 'user' 
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' 
                : 'glass-card text-gray-900 dark:text-gray-100'
            }`}>
              {msg.sender === 'ai' && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-400"></div>
              )}
              <p className="leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
         {isLoading && (
            <div className="flex justify-start">
                <div className="max-w-xs md:max-w-md p-4 rounded-2xl shadow-lg glass-card relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-cyan-400"></div>
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse"></div>
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse [animation-delay:0.2s]"></div>
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse [animation-delay:0.4s]"></div>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="relative z-10 p-6 border-t border-white/20 dark:border-gray-700/50 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your notes..."
          className="flex-grow glass-card px-4 py-3 rounded-2xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          isLoading={isLoading} 
          disabled={!input.trim()}
          className="modern-button bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-2xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <FiSend className="w-5 h-5" />
        </Button>
      </form>
    </div>
  );
};

export default ChatInterface;