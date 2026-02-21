'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const hydrated = useRef(false);

    // Restore state from sessionStorage after mount (avoids hydration mismatch)
    useEffect(() => {
        try {
            const savedMessages = sessionStorage.getItem('chat_messages');
            if (savedMessages) setMessages(JSON.parse(savedMessages));
            const savedOpen = sessionStorage.getItem('chat_open');
            if (savedOpen === 'true') setIsOpen(true);
        } catch { }
        hydrated.current = true;
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Persist messages to sessionStorage
    useEffect(() => {
        if (hydrated.current) {
            sessionStorage.setItem('chat_messages', JSON.stringify(messages));
        }
    }, [messages]);

    // Persist open/closed state to sessionStorage
    useEffect(() => {
        if (hydrated.current) {
            sessionStorage.setItem('chat_open', String(isOpen));
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const sendMessage = async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        const userMessage: Message = { role: 'user', content: trimmed };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: updatedMessages }),
            });

            if (!res.ok) {
                throw new Error('Failed to get response');
            }

            const data = await res.json();
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: data.reply },
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'Sorry, something went wrong. Please try again or contact sales@igla.asia.',
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* Chat Panel */}
            <div
                style={{
                    position: 'fixed',
                    bottom: isOpen ? '24px' : '-600px',
                    right: '24px',
                    width: '400px',
                    maxWidth: 'calc(100vw - 32px)',
                    height: '550px',
                    maxHeight: 'calc(100vh - 100px)',
                    zIndex: 9999,
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#ffffff',
                    transition: 'bottom 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    opacity: isOpen ? 1 : 0,
                }}
            >
                {/* Header */}
                <div
                    style={{
                        background: 'linear-gradient(135deg, #004aad 0%, #2ebb79 100%)',
                        padding: '18px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexShrink: 0,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '12px',
                                background: 'rgba(255,255,255,0.2)',
                                backdropFilter: 'blur(10px)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Bot size={22} color="#fff" />
                        </div>
                        <div>
                            <div
                                style={{
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: '16px',
                                    lineHeight: '1.2',
                                }}
                            >
                                IGLA Ai Assistant
                            </div>
                            <div
                                style={{
                                    color: 'rgba(255,255,255,0.8)',
                                    fontSize: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                }}
                            >
                                <span
                                    style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        background: '#6ffc6f',
                                        display: 'inline-block',
                                    }}
                                />
                                Online
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        style={{
                            background: 'rgba(255,255,255,0.15)',
                            border: 'none',
                            borderRadius: '10px',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) =>
                            (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')
                        }
                        onMouseLeave={(e) =>
                            (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')
                        }
                    >
                        <X size={18} color="#fff" />
                    </button>
                </div>

                {/* Messages Area */}
                <div
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        background: '#f8f9fb',
                    }}
                >
                    {/* Welcome message */}
                    {messages.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                            <div
                                style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '20px',
                                    background: 'linear-gradient(135deg, #004aad 0%, #2ebb79 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 16px',
                                }}
                            >
                                <Bot size={32} color="#fff" />
                            </div>
                            <h3
                                style={{
                                    fontSize: '18px',
                                    fontWeight: 700,
                                    color: '#1a1a2e',
                                    marginBottom: '8px',
                                }}
                            >
                                Welcome to IGLA! 👋
                            </h3>
                            <p
                                style={{
                                    fontSize: '14px',
                                    color: '#6b7280',
                                    lineHeight: '1.5',
                                    maxWidth: '280px',
                                    margin: '0 auto',
                                }}
                            >
                                I&apos;m your logistics assistant. Ask me about membership, events, services, or anything about IGLA!
                            </p>
                            {/* Quick action chips */}
                            <div
                                style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '8px',
                                    justifyContent: 'center',
                                    marginTop: '20px',
                                }}
                            >
                                {['What is IGLA?', 'Membership benefits', 'Upcoming events'].map(
                                    (q) => (
                                        <button
                                            key={q}
                                            onClick={() => {
                                                setInput(q);
                                                setTimeout(() => {
                                                    const fakeMsg: Message = { role: 'user', content: q };
                                                    const updated = [...messages, fakeMsg];
                                                    setMessages(updated);
                                                    setIsLoading(true);
                                                    fetch('/api/chat', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ messages: updated }),
                                                    })
                                                        .then((res) => res.json())
                                                        .then((data) => {
                                                            setMessages((prev) => [
                                                                ...prev,
                                                                { role: 'assistant', content: data.reply },
                                                            ]);
                                                        })
                                                        .catch(() => {
                                                            setMessages((prev) => [
                                                                ...prev,
                                                                {
                                                                    role: 'assistant',
                                                                    content: 'Sorry, something went wrong.',
                                                                },
                                                            ]);
                                                        })
                                                        .finally(() => setIsLoading(false));
                                                    setInput('');
                                                }, 0);
                                            }}
                                            style={{
                                                padding: '8px 14px',
                                                borderRadius: '20px',
                                                border: '1px solid #e5e7eb',
                                                background: '#fff',
                                                color: '#004aad',
                                                fontSize: '13px',
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#004aad';
                                                e.currentTarget.style.color = '#fff';
                                                e.currentTarget.style.borderColor = '#004aad';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = '#fff';
                                                e.currentTarget.style.color = '#004aad';
                                                e.currentTarget.style.borderColor = '#e5e7eb';
                                            }}
                                        >
                                            {q}
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    )}

                    {/* Chat messages */}
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            style={{
                                display: 'flex',
                                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                gap: '8px',
                                alignItems: 'flex-end',
                            }}
                        >
                            {msg.role === 'assistant' && (
                                <div
                                    style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '10px',
                                        background: 'linear-gradient(135deg, #004aad, #2ebb79)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <Bot size={14} color="#fff" />
                                </div>
                            )}
                            <div
                                className={msg.role === 'assistant' ? 'chat-bubble-assistant' : undefined}
                                style={{
                                    maxWidth: '80%',
                                    padding: msg.role === 'assistant' ? '12px 16px' : '10px 14px',
                                    borderRadius:
                                        msg.role === 'user'
                                            ? '18px 18px 4px 18px'
                                            : '18px 18px 18px 4px',
                                    background:
                                        msg.role === 'user'
                                            ? 'linear-gradient(135deg, #004aad, #2563eb)'
                                            : '#ffffff',
                                    color: msg.role === 'user' ? '#fff' : '#1f2937',
                                    fontSize: '14px',
                                    lineHeight: '1.6',
                                    boxShadow:
                                        msg.role === 'assistant'
                                            ? '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)'
                                            : '0 1px 2px rgba(0,74,173,0.15)',
                                    whiteSpace: msg.role === 'user' ? 'pre-wrap' : undefined,
                                    wordBreak: 'break-word',
                                    animation: 'chatFadeIn 0.3s ease-out',
                                }}
                            >
                                {msg.role === 'assistant' ? (
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                ) : (
                                    msg.content
                                )}
                            </div>
                            {msg.role === 'user' && (
                                <div
                                    style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '10px',
                                        background: '#e5e7eb',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <User size={14} color="#6b7280" />
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Loading indicator */}
                    {isLoading && (
                        <div
                            style={{
                                display: 'flex',
                                gap: '8px',
                                alignItems: 'flex-end',
                            }}
                        >
                            <div
                                style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #004aad, #2ebb79)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <Bot size={14} color="#fff" />
                            </div>
                            <div
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: '16px 16px 16px 4px',
                                    background: '#fff',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                }}
                            >
                                <Loader2
                                    size={16}
                                    color="#004aad"
                                    style={{ animation: 'spin 1s linear infinite' }}
                                />
                                <span style={{ fontSize: '13px', color: '#6b7280' }}>Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div
                    style={{
                        padding: '12px 16px',
                        borderTop: '1px solid #f0f0f0',
                        background: '#fff',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                        flexShrink: 0,
                    }}
                >
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask me anything..."
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            borderRadius: '14px',
                            border: '1px solid #e5e7eb',
                            outline: 'none',
                            fontSize: '14px',
                            background: '#f8f9fb',
                            transition: 'border-color 0.2s, box-shadow 0.2s',
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#004aad';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,74,173,0.1)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={isLoading || !input.trim()}
                        style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '14px',
                            border: 'none',
                            background:
                                isLoading || !input.trim()
                                    ? '#e5e7eb'
                                    : 'linear-gradient(135deg, #004aad, #2ebb79)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                            transition: 'transform 0.2s, opacity 0.2s',
                            flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                            if (!isLoading && input.trim())
                                e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        <Send
                            size={18}
                            color={isLoading || !input.trim() ? '#9ca3af' : '#fff'}
                        />
                    </button>
                </div>
            </div>

            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '20px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #004aad 0%, #2ebb79 100%)',
                    boxShadow: '0 8px 30px rgba(0, 74, 173, 0.4)',
                    display: isOpen ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 9998,
                    transition: 'transform 0.3s, box-shadow 0.3s',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 74, 173, 0.5)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 74, 173, 0.4)';
                }}
                aria-label="Open chat"
            >
                <MessageCircle size={26} color="#fff" />
            </button>

            {/* Keyframe animation for spinner */}
            <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes chatFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ---- Markdown styling inside assistant bubbles ---- */
        .chat-bubble-assistant p {
          margin: 0 0 8px 0;
          line-height: 1.6;
        }
        .chat-bubble-assistant p:last-child {
          margin-bottom: 0;
        }

        .chat-bubble-assistant ul,
        .chat-bubble-assistant ol {
          margin: 6px 0 10px 0;
          padding-left: 20px;
        }
        .chat-bubble-assistant ul {
          list-style: none;
          padding-left: 16px;
        }
        .chat-bubble-assistant ul li {
          position: relative;
          padding-left: 6px;
          margin-bottom: 6px;
          line-height: 1.55;
        }
        .chat-bubble-assistant ul li::before {
          content: '';
          position: absolute;
          left: -12px;
          top: 8px;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: linear-gradient(135deg, #004aad, #2ebb79);
        }
        .chat-bubble-assistant ol li {
          margin-bottom: 6px;
          line-height: 1.55;
          padding-left: 2px;
        }

        .chat-bubble-assistant strong {
          font-weight: 650;
          color: #111827;
        }
        .chat-bubble-assistant em {
          font-style: italic;
          color: #374151;
        }

        .chat-bubble-assistant a {
          color: #2ebb79;
          font-weight: 600;
          text-decoration: none;
          border-bottom: 1.5px solid transparent;
          transition: border-color 0.2s, color 0.2s;
          cursor: pointer;
        }
        .chat-bubble-assistant a:hover {
          color: #004aad;
          border-bottom-color: #004aad;
        }

        .chat-bubble-assistant h1,
        .chat-bubble-assistant h2,
        .chat-bubble-assistant h3,
        .chat-bubble-assistant h4 {
          margin: 10px 0 6px 0;
          font-weight: 700;
          color: #111827;
          line-height: 1.3;
        }
        .chat-bubble-assistant h1 { font-size: 16px; }
        .chat-bubble-assistant h2 { font-size: 15px; }
        .chat-bubble-assistant h3 { font-size: 14px; }
        .chat-bubble-assistant h4 { font-size: 13px; }
        .chat-bubble-assistant h1:first-child,
        .chat-bubble-assistant h2:first-child,
        .chat-bubble-assistant h3:first-child {
          margin-top: 0;
        }

        .chat-bubble-assistant code {
          background: #f3f4f6;
          padding: 1px 5px;
          border-radius: 4px;
          font-size: 13px;
          font-family: 'Menlo', 'Consolas', monospace;
          color: #004aad;
        }

        .chat-bubble-assistant blockquote {
          border-left: 3px solid #2ebb79;
          margin: 8px 0;
          padding: 4px 12px;
          color: #4b5563;
          background: #f9fafb;
          border-radius: 0 6px 6px 0;
        }

        .chat-bubble-assistant hr {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 10px 0;
        }
      `}</style>
        </>
    );
}
