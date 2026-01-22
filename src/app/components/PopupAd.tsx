"use client";

import React, { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export default function PopupAd() {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldShow, setShouldShow] = useState(false);
    const router = useRouter();
    const EVENT_ID = "cmjn1f6ih0000gad4xa4j7dp3";

    useEffect(() => {
        // Fetch event status
        const checkEventStatus = async () => {
            try {
                const res = await fetch(`/api/events/${EVENT_ID}`);
                if (res.ok) {
                    const event = await res.json();
                    if (event.earlyBird) {
                        setShouldShow(true);
                        setIsVisible(true);
                    }
                }
            } catch (error) {
                console.error("Failed to check popup status", error);
            }
        };
        checkEventStatus();
    }, []);

    useEffect(() => {
        if (!shouldShow) return;

        // Show every 5 minutes (300,000 ms)
        const timer = setInterval(() => {
            setIsVisible(true);
        }, 300000);

        return () => clearInterval(timer);
    }, [shouldShow]);

    const handleClose = () => {
        setIsVisible(false);
    };

    const handleAdClick = () => {
        setIsVisible(false);
        router.push(`/event/${EVENT_ID}`);
    };

    if (!isVisible) return null;

    return (
        <div
            onClick={handleClose}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity duration-300"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-300"
            >
                <button
                    onClick={handleClose}
                    className="absolute top-3 right-3 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 z-10 transition-colors shadow-sm"
                    aria-label="Close"
                >
                    <X size={22} />
                </button>
                <div onClick={handleAdClick} className="cursor-pointer">
                    <img
                        src="/images/popup.jpg"
                        alt="Special Offer"
                        className="max-w-[80vw] max-h-[75vh] w-auto h-auto object-contain rounded-2xl"
                    />
                </div>
            </div>
        </div>
    );
}
