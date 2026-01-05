"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export default function PopupAd() {
    const [isVisible, setIsVisible] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Show every 5 minutes (300,000 ms)
        const timer = setInterval(() => {
            setIsVisible(true);
        }, 300000);

        return () => clearInterval(timer);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
    };

    const handleAdClick = () => {
        setIsVisible(false);
        router.push("/event/list");
    };

    if (!isVisible) return null;

    return (
        <div
            onClick={handleClose}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity duration-300"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300"
            >
                <button
                    onClick={handleClose}
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-1.5 z-10 transition-colors"
                    aria-label="Close"
                >
                    <X size={20} />
                </button>
                <div onClick={handleAdClick} className="relative block aspect-[3/4] w-full cursor-pointer">
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
