import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';
import { MessageCircle, X, Send, Bot, User, Trash2, Loader2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


// Helper to format text with basic bullet points
const FormatMessage = ({ text }) => {
    if (!text) return null;

    // Split by newlines
    const lines = text.split('\n');
    const formattedElements = [];

    let currentList = [];

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        // Check for bullet points (* or -)
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || /^\d+\./.test(trimmed)) {
            // Remove the bullet char
            const content = trimmed.replace(/^(\* | - |\d+\. )/, '');
            currentList.push(<li key={`li-${index}`} className="ml-4 list-disc mb-1">{content}</li>);
        } else {
            // If we have a list accumulated, push it first
            if (currentList.length > 0) {
                formattedElements.push(<ul key={`ul-${index}`} className="mb-2 list-outside ml-4">{[...currentList]}</ul>);
                currentList = [];
            }

            // Check for bold text (**text**)
            const parts = line.split(/(\*\*.*?\*\*)/g);
            const lineContent = parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i}>{part.slice(2, -2)}</strong>;
                }
                return part;
            });

            if (trimmed) {
                formattedElements.push(<p key={`p-${index}`} className="mb-2 last:mb-0">{lineContent}</p>);
            }
        }
    });

    // Flush remaining list
    if (currentList.length > 0) {
        formattedElements.push(<ul key="ul-end" className="mb-2 list-outside ml-4">{[...currentList]}</ul>);
    }

    return <div className="text-sm leading-relaxed">{formattedElements}</div>;
};

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState('');
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    // Initialize Session ID
    useEffect(() => {
        let storedSession = sessionStorage.getItem('chatSessionId');
        if (!storedSession) {
            storedSession = crypto.randomUUID();
            sessionStorage.setItem('chatSessionId', storedSession);
        }
        setSessionId(storedSession);

        // Initial Greeting
        if (messages.length === 0) {
            setMessages([
                {
                    id: 1,
                    text: "Hello! I am your AI Tax Assistant. I can help you with the Income Tax Act 1961. For your privacy, this chat will be deleted automatically when the session ends.",
                    sender: 'bot'
                }
            ]);
        }
    }, []);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { id: Date.now(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Use Backend Proxy for Chat
            const token = localStorage.getItem('authToken');
            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Calls Backend which proxies to AI
            const response = await fetch(`${config.backendUrl}/api/ai/chat`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ message: userMessage.text, context: sessionId })
            });

            if (!response.ok) throw new Error('Failed to fetch response');

            const data = await response.json();
            // Fallback to data.answer if data.reply isn't present, but our backend uses 'reply'
            const botMessage = { id: Date.now() + 1, text: data.reply || data.answer, sender: 'bot' };
            setMessages(prev => [...prev, botMessage]);

        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage = { id: Date.now() + 1, text: "Sorry, I'm having trouble connecting right now. Please try again later.", sender: 'bot', isError: true };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEndSession = async () => {
        if (!window.confirm("Are you sure you want to end this session? Chat history will be permanently deleted.")) return;

        // Session is client-side only for this stateless backend, so we just reset local state.

        // Reset local state
        setMessages([
            {
                id: Date.now(),
                text: "Session ended. Chat history has been cleared.",
                sender: 'bot'
            },
            {
                id: Date.now() + 1,
                text: "Hello! I am your AI Tax Assistant. I can help you with the Income Tax Act 1961. For your privacy, this chat will be deleted automatically when the session ends.",
                sender: 'bot'
            }
        ]);
        const newSession = crypto.randomUUID();
        sessionStorage.setItem('chatSessionId', newSession);
        setSessionId(newSession);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    // Check auth status
    const isLoggedIn = !!localStorage.getItem('authToken');

    return (
        <div className="fixed bottom-6 right-6 z-50 font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="mb-4 w-[380px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[80vh] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 bg-indigo-600 flex items-center justify-between text-white shadow-md">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white/20 rounded-full">
                                    <Bot size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm">Tax Assistant AI</h3>
                                    <p className="text-xs text-indigo-100 opacity-90">Always here to help</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleEndSession}
                                    title="Clear Chat & End Session"
                                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-indigo-100"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-indigo-100"
                                >
                                    <Minimize2 size={18} />
                                </button>
                            </div>
                        </div>

                        {!isLoggedIn ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-2">
                                    <Bot size={40} className="text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Login Required</h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                                        Please login to chat with our AI Tax Assistant and get personalized help.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-3 w-full">
                                    <button
                                        onClick={() => {
                                            setIsOpen(false);
                                            navigate('/login');
                                        }}
                                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
                                    >
                                        Login
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsOpen(false);
                                            navigate('/register');
                                        }}
                                        className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition-all"
                                    >
                                        Create Account
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                                    {messages.map((msg) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={msg.id}
                                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.sender === 'user'
                                                ? 'bg-indigo-600 text-white rounded-br-none'
                                                : msg.isError
                                                    ? 'bg-red-50 text-red-600 border border-red-200 rounded-bl-none'
                                                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                                                }`}>
                                                {msg.sender === 'user' ? (
                                                    msg.text
                                                ) : (
                                                    <FormatMessage text={msg.text} />
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                                                <Loader2 size={16} className="animate-spin text-indigo-600" />
                                                <span className="text-xs text-slate-500">Thinking...</span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Ask about Income Tax..."
                                            className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-500 transition-all placeholder:text-slate-400"
                                        />
                                        <button
                                            onClick={handleSend}
                                            disabled={!input.trim() || isLoading}
                                            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl transition-all shadow-sm active:scale-95"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                    <div className="text-[10px] text-center mt-2 text-slate-400">
                                        AI responses can be inaccurate. verify strictly important info.
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Toggle Button */}
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(true)}
                    className="h-14 w-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-600/30 flex items-center justify-center transition-all"
                >
                    <MessageCircle size={28} />
                </motion.button>
            )}
        </div>
    );
};

export default Chatbot;
