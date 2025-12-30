"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

export default function PopupAd() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Delay slightly for smooth entrance
        const timer = setTimeout(() => setIsVisible(true), 1000);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity duration-300">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <button
                    onClick={handleClose}
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-1.5 z-10 transition-colors"
                    aria-label="Close"
                >
                    <X size={20} />
                </button>
                <div className="relative aspect-[3/4] w-full">
                    {/* Aspect ratio based on likely flyer dims, adjust if needed */}
                    <Image
                        src="/popup-ad.png"
                        alt="Special Offer"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
            </div>
        </div>
    );
}
