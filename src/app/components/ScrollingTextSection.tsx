"use client";

import React from "react";

const SCROLL_ITEMS = [
    "CONNECTING GLOBAL LOGISTICS PARTNERS",
    "SECURE AND TRUSTED NETWORK",
    "EXPAND YOUR BUSINESS HORIZONS",
    "50% OFFER ON SPONSORSHIP",
    "ANNUAL CONFERENCES & NETWORKING",
    "VERIFIED MEMBERS WORLDWIDE",
    "GLOBAL FREIGHT FORWARDING SOLUTIONS",
    "TRUSTED BY INDUSTRY LEADERS"
];

export default function ScrollingTextSection() {
    return (
        <section className="bg-gray-900 overflow-hidden py-6 border-y border-gray-800">
            <div className="flex whitespace-nowrap overflow-hidden select-none">
                <div className="animate-marquee flex items-center shrink-0 min-w-full justify-around">
                    {[...SCROLL_ITEMS, ...SCROLL_ITEMS].map((item, index) => (
                        <div key={index} className="flex items-center mx-4 md:mx-8">
                            <span className="text-white font-bold text-lg md:text-2xl tracking-widest uppercase font-alt">
                                {item}
                            </span>
                            <span className="w-2 md:w-3 h-2 md:h-3 rounded-full border-2 border-[#2ebb79] ml-8 md:ml-16 inline-block"></span>
                        </div>
                    ))}
                </div>
                <div className="animate-marquee flex items-center shrink-0 min-w-full justify-around" aria-hidden="true">
                    {[...SCROLL_ITEMS, ...SCROLL_ITEMS].map((item, index) => (
                        <div key={`dup-${index}`} className="flex items-center mx-4 md:mx-8">
                            <span className="text-white font-bold text-lg md:text-2xl tracking-widest uppercase font-alt">
                                {item}
                            </span>
                            <span className="w-2 md:w-3 h-2 md:h-3 rounded-full border-2 border-[#2ebb79] ml-8 md:ml-16 inline-block"></span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
