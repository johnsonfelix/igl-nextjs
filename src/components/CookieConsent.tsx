'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'cookie_consent';

export default function CookieConsent() {
    const [visible, setVisible] = useState(false);
    const [animateOut, setAnimateOut] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (!consent) {
            // Small delay so the banner slides in after page load
            const timer = setTimeout(() => setVisible(true), 800);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleChoice = (choice: 'accepted' | 'declined') => {
        localStorage.setItem(COOKIE_CONSENT_KEY, choice);
        // Dispatch custom event so SiteTracker can react immediately
        window.dispatchEvent(new CustomEvent('cookie-consent-change', { detail: choice }));
        // Animate out then hide
        setAnimateOut(true);
        setTimeout(() => setVisible(false), 400);
    };

    if (!visible) return null;

    return (
        <div
            className={`cookie-consent-banner ${animateOut ? 'cookie-consent-out' : 'cookie-consent-in'}`}
        >
            <div className="cookie-consent-inner">
                <div className="cookie-consent-icon">
                    <Cookie size={28} />
                </div>

                <div className="cookie-consent-content">
                    <p className="cookie-consent-title">We value your privacy</p>
                    <p className="cookie-consent-text">
                        We use cookies and analytics to improve your experience, understand site usage,
                        and deliver relevant content.{' '}
                        <Link href="/cookies-policy" className="cookie-consent-link">
                            Learn more
                        </Link>
                    </p>
                </div>

                <div className="cookie-consent-actions">
                    <button
                        onClick={() => handleChoice('declined')}
                        className="cookie-consent-btn cookie-consent-btn-decline"
                    >
                        Decline
                    </button>
                    <button
                        onClick={() => handleChoice('accepted')}
                        className="cookie-consent-btn cookie-consent-btn-accept"
                    >
                        Accept All
                    </button>
                </div>

                <button
                    onClick={() => handleChoice('declined')}
                    className="cookie-consent-close"
                    aria-label="Close cookie consent"
                >
                    <X size={18} />
                </button>
            </div>

            <style jsx>{`
                .cookie-consent-banner {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    z-index: 9999;
                    padding: 0 16px 16px;
                    pointer-events: none;
                }

                .cookie-consent-in {
                    animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                .cookie-consent-out {
                    animation: slideDown 0.4s cubic-bezier(0.7, 0, 0.84, 0) forwards;
                }

                @keyframes slideUp {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                @keyframes slideDown {
                    from {
                        transform: translateY(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                }

                .cookie-consent-inner {
                    max-width: 960px;
                    margin: 0 auto;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    background: linear-gradient(135deg, #0a1628 0%, #1a2744 100%);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    padding: 20px 24px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35),
                                0 0 0 1px rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(20px);
                    pointer-events: auto;
                    position: relative;
                }

                .cookie-consent-icon {
                    flex-shrink: 0;
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #004aad, #0066ff);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 4px 15px rgba(0, 74, 173, 0.4);
                }

                .cookie-consent-content {
                    flex: 1;
                    min-width: 0;
                }

                .cookie-consent-title {
                    font-size: 15px;
                    font-weight: 700;
                    color: #ffffff;
                    margin: 0 0 4px;
                    letter-spacing: -0.01em;
                }

                .cookie-consent-text {
                    font-size: 13px;
                    color: rgba(255, 255, 255, 0.6);
                    margin: 0;
                    line-height: 1.5;
                }

                .cookie-consent-link {
                    color: #5b9dff;
                    text-decoration: none;
                    font-weight: 500;
                    transition: color 0.2s;
                }

                .cookie-consent-link:hover {
                    color: #89bbff;
                    text-decoration: underline;
                }

                .cookie-consent-actions {
                    display: flex;
                    gap: 8px;
                    flex-shrink: 0;
                }

                .cookie-consent-btn {
                    padding: 10px 20px;
                    border-radius: 10px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                    white-space: nowrap;
                }

                .cookie-consent-btn-decline {
                    background: rgba(255, 255, 255, 0.08);
                    color: rgba(255, 255, 255, 0.7);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .cookie-consent-btn-decline:hover {
                    background: rgba(255, 255, 255, 0.14);
                    color: #ffffff;
                }

                .cookie-consent-btn-accept {
                    background: linear-gradient(135deg, #004aad, #0066ff);
                    color: #ffffff;
                    box-shadow: 0 4px 15px rgba(0, 74, 173, 0.4);
                }

                .cookie-consent-btn-accept:hover {
                    background: linear-gradient(135deg, #0055cc, #1a7aff);
                    box-shadow: 0 6px 20px rgba(0, 74, 173, 0.5);
                    transform: translateY(-1px);
                }

                .cookie-consent-close {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    width: 28px;
                    height: 28px;
                    border-radius: 8px;
                    border: none;
                    background: transparent;
                    color: rgba(255, 255, 255, 0.3);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .cookie-consent-close:hover {
                    background: rgba(255, 255, 255, 0.08);
                    color: rgba(255, 255, 255, 0.7);
                }

                /* Mobile responsive */
                @media (max-width: 640px) {
                    .cookie-consent-banner {
                        padding: 0 8px 8px;
                    }

                    .cookie-consent-inner {
                        flex-direction: column;
                        align-items: flex-start;
                        padding: 20px 16px;
                        gap: 12px;
                    }

                    .cookie-consent-icon {
                        width: 40px;
                        height: 40px;
                        border-radius: 10px;
                    }

                    .cookie-consent-actions {
                        width: 100%;
                    }

                    .cookie-consent-btn {
                        flex: 1;
                        text-align: center;
                        padding: 12px 16px;
                    }

                    .cookie-consent-close {
                        top: 6px;
                        right: 6px;
                    }
                }
            `}</style>
        </div>
    );
}
