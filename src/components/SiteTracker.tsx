'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

function getSessionId(): string {
    if (typeof window === 'undefined') return '';
    let sid = sessionStorage.getItem('_st_sid');
    if (!sid) {
        sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem('_st_sid', sid);
    }
    return sid;
}

function hasConsent(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('cookie_consent') === 'accepted';
}

export default function SiteTracker() {
    const pathname = usePathname();
    const startRef = useRef<number>(Date.now());
    const lastPathRef = useRef<string>(pathname);
    const [consentGiven, setConsentGiven] = useState(false);

    
    useEffect(() => {
        setConsentGiven(hasConsent());

        const handleConsentChange = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            setConsentGiven(detail === 'accepted');
        };
        window.addEventListener('cookie-consent-change', handleConsentChange);
        return () => window.removeEventListener('cookie-consent-change', handleConsentChange);
    }, []);

    
    const sendDuration = (page: string) => {
        if (!hasConsent()) return;
        const duration = Math.round((Date.now() - startRef.current) / 1000);
        if (duration < 1) return;
        const sid = getSessionId();
        if (!sid) return;
        const payload = JSON.stringify({ sessionId: sid, page, duration });
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/analytics/track', new Blob([payload], { type: 'application/json' }));
        } else {
            fetch('/api/analytics/track', { method: 'POST', body: payload, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => { });
        }
    };

    
    useEffect(() => {
        
        if (!consentGiven) return;
        if (pathname.startsWith('/admin')) return;

        const sid = getSessionId();
        if (!sid) return;

        
        if (lastPathRef.current !== pathname) {
            sendDuration(lastPathRef.current);
        }

        
        startRef.current = Date.now();
        lastPathRef.current = pathname;

        
        fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: sid,
                page: pathname,
                referrer: document.referrer || null,
            }),
        }).catch(() => { });

        
    }, [pathname, consentGiven]);

    
    useEffect(() => {
        const handleUnload = () => {
            sendDuration(lastPathRef.current);
        };
        window.addEventListener('beforeunload', handleUnload);
        return () => window.removeEventListener('beforeunload', handleUnload);
        
    }, []);

    return null;
}
