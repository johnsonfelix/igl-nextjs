'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';

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

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
                                IGLA Assistant
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
                                style={{
                                    maxWidth: '75%',
                                    padding: '10px 14px',
                                    borderRadius:
                                        msg.role === 'user'
                                            ? '16px 16px 4px 16px'
                                            : '16px 16px 16px 4px',
                                    background:
                                        msg.role === 'user'
                                            ? 'linear-gradient(135deg, #004aad, #2563eb)'
                                            : '#ffffff',
                                    color: msg.role === 'user' ? '#fff' : '#1a1a2e',
                                    fontSize: '14px',
                                    lineHeight: '1.5',
                                    boxShadow:
                                        msg.role === 'assistant'
                                            ? '0 1px 3px rgba(0,0,0,0.08)'
                                            : 'none',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                }}
                            >
                                {msg.content}
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
      `}</style>
        </>
    );
}
