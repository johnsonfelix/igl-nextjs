'use client';

import { useEffect, useRef } from 'react';
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

export default function SiteTracker() {
    const pathname = usePathname();
    const startRef = useRef<number>(Date.now());
    const lastPathRef = useRef<string>(pathname);

    // Send duration for the previous page
    const sendDuration = (page: string) => {
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

    // Track page view
    useEffect(() => {
        // Skip admin pages from tracking
        if (pathname.startsWith('/admin')) return;

        const sid = getSessionId();
        if (!sid) return;

        // Send duration for the previous page if path changed
        if (lastPathRef.current !== pathname) {
            sendDuration(lastPathRef.current);
        }

        // Reset timer
        startRef.current = Date.now();
        lastPathRef.current = pathname;

        // Fire page-view
        fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: sid,
                page: pathname,
                referrer: document.referrer || null,
            }),
        }).catch(() => { });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    // Send duration on page unload
    useEffect(() => {
        const handleUnload = () => {
            sendDuration(lastPathRef.current);
        };
        window.addEventListener('beforeunload', handleUnload);
        return () => window.removeEventListener('beforeunload', handleUnload);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
