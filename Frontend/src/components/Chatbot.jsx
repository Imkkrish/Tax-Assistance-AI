import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';
import { MessageSquare, X, Send, Sparkles, User, Trash2, Loader2, Minimize2, ChevronDown } from 'lucide-react';
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
            currentList.push(<li key={`li-${index}`} className="ml-5 list-disc mb-1 marker:text-slate-400">{content}</li>);
        } else {
            // If we have a list accumulated, push it first
            if (currentList.length > 0) {
                formattedElements.push(<ul key={`ul-${index}`} className="mb-3 pl-2">{[...currentList]}</ul>);
                currentList = [];
            }

            // Check for bold text (**text**)
            const parts = line.split(/(\*\*.*?\*\*)/g);
            const lineContent = parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} className="font-semibold text-slate-800">{part.slice(2, -2)}</strong>;
                }
                return part;
            });

            if (trimmed) {
                formattedElements.push(<p key={`p-${index}`} className="mb-3 last:mb-0 leading-relaxed">{lineContent}</p>);
            }
        }
    });

    // Flush remaining list
    if (currentList.length > 0) {
        formattedElements.push(<ul key="ul-end" className="mb-3 pl-2">{[...currentList]}</ul>);
    }

    return <div className="text-sm text-slate-600">{formattedElements}</div>;
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
            // Fallback to data.answer if data.reply isn't present
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

        // Session is client-side only for this stateless backend
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
        <div className="fixed bottom-6 right-6 z-50 font-sans isolate">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="mb-4 w-[400px] max-w-[calc(100vw-2rem)] h-[650px] max-h-[85vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 ring-4 ring-black/5"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center border border-primary-100">
                                    <Sparkles size={20} className="text-primary-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm">Tax Genius</h3>
                                    <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        Online
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleEndSession}
                                    title="Reset Session"
                                    className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-red-500"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {!isLoggedIn ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8 bg-slate-50/50">
                                <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center mb-4 ring-8 ring-white/50">
                                    <Sparkles size={48} className="text-primary-600" />
                                </div>
                                <div className="max-w-[260px]">
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">Unlock AI Assistance</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">
                                        Sign in to get personalized tax advice and save your chat history securely.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-3 w-full max-w-[280px]">
                                    <button
                                        onClick={() => {
                                            setIsOpen(false);
                                            navigate('/login');
                                        }}
                                        className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-primary-600/20 active:scale-95"
                                    >
                                        Login to Chat
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsOpen(false);
                                            navigate('/register');
                                        }}
                                        className="w-full px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-sm transition-all active:scale-95"
                                    >
                                        Create Account
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 scroll-smooth">
                                    {messages.map((msg, idx) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={msg.id}
                                            className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                        >
                                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-primary-600 border border-slate-100'}`}>
                                                {msg.sender === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                                            </div>

                                            <div className={`max-w-[75%] space-y-1 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                                <div className={`px-5 py-3.5 text-sm shadow-sm ${msg.sender === 'user'
                                                    ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm'
                                                    : msg.isError
                                                        ? 'bg-red-50 text-red-600 border border-red-100 rounded-2xl rounded-tl-sm'
                                                        : 'bg-white text-slate-700 border border-slate-100 rounded-2xl rounded-tl-sm'
                                                    }`}>
                                                    {msg.sender === 'user' ? (
                                                        msg.text
                                                    ) : (
                                                        <FormatMessage text={msg.text} />
                                                    )}
                                                </div>
                                                {/* Timestamp or status could go here */}
                                            </div>
                                        </motion.div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-sm">
                                                <Sparkles size={14} className="text-primary-600" />
                                            </div>
                                            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100 flex items-center gap-2">
                                                <Loader2 size={16} className="animate-spin text-primary-600" />
                                                <span className="text-xs font-medium text-slate-400">Analyzing tax laws...</span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="relative flex items-center gap-2 bg-white p-2 border-t border-slate-100">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Ask a question about taxes..."
                                        className="flex-1 bg-slate-50 text-slate-900 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 border border-slate-200 focus:border-primary-500 transition-all placeholder:text-slate-500"
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!input.trim() || isLoading}
                                        className="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:bg-slate-100 disabled:text-slate-400"
                                    >
                                        <Send size={18} />
                                    </button>
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
                    className="group relative h-16 w-16 bg-gradient-to-tr from-primary-600 to-indigo-600 text-white rounded-2xl shadow-xl shadow-primary-600/30 flex items-center justify-center transition-all hover:shadow-2xl hover:shadow-primary-600/40"
                >
                    <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <MessageSquare size={32} className="fill-current" />
                    {/* Notification Dot */}
                    <span className="absolute top-[-4px] right-[-4px] w-4 h-4 bg-red-500 border-2 border-white rounded-full"></span>
                </motion.button>
            )}
        </div>
    );
};

export default Chatbot;
