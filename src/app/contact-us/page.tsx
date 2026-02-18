"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Phone, Mail, MapPin, Search, Globe, Instagram, Linkedin, Facebook } from "lucide-react";
import Link from "next/link";

export default function ContactUs() {
    return (
        <div className="bg-white text-gray-800 font-sans min-h-screen">
            {/* 1. HERO SECTION */}
            <section className="relative h-[400px] w-full overflow-hidden flex items-center justify-center">
                {/* Background Image/Overlay */}
                <div className="absolute inset-0">
                    <Image
                        src="/images/left-carousel-igla.jpg"
                        alt="Contact Hero"
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-[#004aad]/80 mix-blend-multiply"></div>
                    <div className="absolute inset-0 bg-black/40"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto text-white animate-fadeIn">
                    <span className="block text-emerald-300 font-bold tracking-wider uppercase text-sm mb-4">
                        Get in touch
                    </span>
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-6 leading-tight">
                        Connect Globally. <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">Grow Securely.</span>
                    </h1>
                    <p className="text-sm md:text-xl text-white/80 max-w-2xl mx-auto font-light">
                        Whether you're looking to join IGLA, collaborate with us, or simply learn more, our global team is here to help.
                    </p>
                </div>
            </section>

            {/* 2. MAIN CONTACT CARDS (Overlapping Hero) */}
            <section className="relative z-20 -mt-16 px-4 pb-16">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Card 1: Direct Contact */}
                        <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 text-center hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-14 h-14 bg-blue-50 text-[#004aad] rounded-full flex items-center justify-center mx-auto mb-6">
                                <Phone className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Talk to Us</h3>
                            <p className="text-gray-500 text-sm mb-6">Support available during business hours</p>
                            <div className="space-y-3">
                                <a href="tel:9363027279" className="block text-lg font-bold text-[#004aad] hover:underline">
                                    +91 93630 27279
                                </a>
                                <a href="mailto:sales@igla.asia" className="block text-gray-700 font-medium hover:text-[#004aad]">
                                    sales@igla.asia
                                </a>
                            </div>
                        </div>

                        {/* Card 2: HQ Location */}
                        <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 text-center hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <MapPin className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Our Headquarters</h3>
                            <p className="text-gray-500 text-sm mb-6">Visit our main office</p>
                            <p className="text-gray-700 leading-relaxed font-medium">
                                Europe | Americas | Africa / Australia | South East Asia | Middle East
                                | India
                            </p>
                        </div>

                        {/* Card 3: Social & WeChat */}
                        <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 text-center hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Globe className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Connect Online</h3>
                            <p className="text-gray-500 text-sm mb-6">Follow us on social media</p>

                            <div className="flex items-center justify-center gap-4 mb-6">
                                <a href="https://www.facebook.com/profile.php?id=61577474642854" target="_blank" className="p-2 bg-gray-50 hover:bg-[#1877F2] hover:text-white rounded-lg transition-colors text-gray-600"><Facebook size={20} /></a>
                                <a href="https://www.instagram.com/igla.asia?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" className="p-2 bg-gray-50 hover:bg-[#E4405F] hover:text-white rounded-lg transition-colors text-gray-600"><Instagram size={20} /></a>
                                <a href="https://www.linkedin.com/company/igla-innovative-global-logistics-allianz" target="_blank" className="p-2 bg-gray-50 hover:bg-[#0077B5] hover:text-white rounded-lg transition-colors text-gray-600"><Linkedin size={20} /></a>
                            </div>

                            <WeChatBadge />
                        </div>

                    </div>
                </div>
            </section>

            {/* 3. REGIONAL TEAM GRID */}
            <section className="py-16 bg-gray-50/50">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="text-center mb-16">
                        <span className="text-[#004aad] font-bold tracking-wider uppercase text-xs mb-2 block">Global Network</span>
                        <h2 className="text-3xl font-extrabold text-gray-900">Meet Our Regional Team</h2>
                        <div className="w-20 h-1.5 bg-emerald-400 mx-auto mt-4 rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Regional Card Component */}
                        <RegionalCard
                            region="Europe"
                            name="Mr. Fabian"
                            email="fabian@igla.asia"
                            mapImage="/images/europe_map.png"
                        />
                        <RegionalCard
                            region="Americas"
                            name="Mr. Marlond"
                            email="marlond@igla.asia"
                            mapImage="/images/America_map.png"
                        />
                        <RegionalCard
                            region="Africa / Australia"
                            name="Mrs. Dovi"
                            email="dovi@igla.asia"
                            mapImage="/images/australia_map.png"
                        />
                        <RegionalCard
                            region="South East Asia"
                            name="Mr. Jonathan"
                            email="jon.siva@igla.asia"
                            mapImage="/images/southeast_asia_map.png"
                        />
                        <RegionalCard
                            region="Middle East"
                            name="Mr. Varadha"
                            email="varadha@igla.asia"
                            mapImage="/images/middle_east_map.png"
                        />
                        <RegionalCard
                            region="India"
                            name="IGLA India"
                            email="info@igla.asia"
                            mapImage="/images/india.png"
                        />
                    </div>
                </div>
            </section>

        </div>
    );
}
// Interactive WeChat Badge with click-to-reveal animation
function WeChatBadge() {
    const [revealed, setRevealed] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleReveal = () => {
        if (!revealed) setRevealed(true);
    };

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText("eric2710");
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { }
    };

    return (
        <button
            onClick={handleReveal}
            className={`
                relative overflow-hidden rounded-xl border transition-all duration-500 ease-out
                ${revealed
                    ? "bg-gradient-to-r from-[#07C160]/10 to-[#07C160]/5 border-[#07C160]/30 px-5 py-3 cursor-default"
                    : "bg-gray-50 border-gray-200 px-5 py-2.5 cursor-pointer hover:border-[#07C160] hover:bg-[#07C160]/5 hover:shadow-md active:scale-95"
                }
                inline-flex items-center gap-2.5 group
            `}
        >
            {/* WeChat icon */}
            <svg viewBox="0 0 24 24" className={`transition-all duration-500 ${revealed ? "w-5 h-5 text-[#07C160]" : "w-4 h-4 text-gray-400 group-hover:text-[#07C160]"}`} fill="currentColor">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05a6.127 6.127 0 01-.253-1.736c0-3.64 3.45-6.592 7.7-6.592.268 0 .527.018.789.04C17.105 4.773 13.265 2.188 8.691 2.188zm-2.79 4.39a1.09 1.09 0 110-2.18 1.09 1.09 0 010 2.18zm5.618 0a1.09 1.09 0 110-2.18 1.09 1.09 0 010 2.18z" />
                <path d="M23.058 14.907c0-3.26-3.26-5.905-7.281-5.905-4.022 0-7.282 2.645-7.282 5.905s3.26 5.905 7.282 5.905c.87 0 1.71-.124 2.487-.35a.69.69 0 01.575.079l1.527.893a.26.26 0 00.134.043.236.236 0 00.233-.236c0-.058-.023-.115-.039-.17l-.313-1.188a.472.472 0 01.171-.533c1.472-1.083 2.406-2.685 2.406-4.443zm-9.585-1.09a.876.876 0 110-1.752.876.876 0 010 1.751zm4.608 0a.876.876 0 110-1.752.876.876 0 010 1.751z" />
            </svg>

            {/* Label */}
            <span className={`font-bold uppercase tracking-wider transition-all duration-300 ${revealed ? "text-[11px] text-[#07C160]" : "text-xs text-gray-500 group-hover:text-gray-700"}`}>
                WeChat
            </span>

            {/* Reveal hint arrow (before click) */}
            {!revealed && (
                <svg className="w-3 h-3 text-gray-400 group-hover:text-[#07C160] group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
            )}

            {/* Divider (after click) */}
            <span className={`inline-block w-px h-5 bg-[#07C160]/30 transition-all duration-500 ${revealed ? "opacity-100 scale-100" : "opacity-0 scale-0 w-0"}`} />

            {/* Revealed ID */}
            <span
                onClick={revealed ? handleCopy : undefined}
                className={`
                    font-bold text-[#004aad] transition-all duration-500 ease-out whitespace-nowrap
                    ${revealed
                        ? "opacity-100 translate-x-0 max-w-[120px] cursor-pointer hover:text-[#07C160]"
                        : "opacity-0 -translate-x-4 max-w-0 pointer-events-none"
                    }
                `}
                title={revealed ? "Click to copy" : ""}
            >
                {copied ? "✓ Copied!" : "eric2710"}
            </span>
        </button>
    );
}


function RegionalCard({ region, name, email, mapImage }: { region: string, name: string, email: string, mapImage: string }) {
    return (
        <div className="group bg-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col">
            {/* Map Header */}
            <div className="h-40 relative bg-gray-50 overflow-hidden">
                <Image
                    src={mapImage}
                    alt={`${region} Map`}
                    fill
                    className="object-contain p-4 opacity-80 group-hover:scale-110 transition-transform duration-500"
                />
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col flex-1 items-center text-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{region}</span>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">{name}</h3>

                <a
                    href={`mailto:${email}`}
                    className="mt-auto inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-50 text-gray-700 font-bold hover:bg-[#004aad] hover:text-white transition-all group-hover:shadow-md"
                >
                    <Mail size={18} />
                    {email}
                </a>
            </div>
        </div>
    )
}
