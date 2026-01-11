"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, Facebook, Linkedin, Instagram, Download } from "lucide-react";
import toast from "react-hot-toast";

export default function Footer() {
    const handleDownloadClick = () => {
        toast("Mobile App Coming Soon!", {
            icon: "📱",
            style: {
                borderRadius: "10px",
                background: "#333",
                color: "#fff",
            },
        });
    };

    return (
        <footer className="bg-primary text-white py-16">
            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div>
                    <Image src="/images/logo.png" alt="IGLA" width={150} height={60} className="mb-6 bg-white p-2 rounded" />
                    <p className="text-white/80 mb-6 text-sm leading-relaxed">Connecting Freight Forwarders Across World</p>
                    <div className="flex flex-col space-y-2 mb-6 text-sm text-white/80">
                        <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/cookies-policy" className="hover:text-white transition-colors">Cookies Policy</Link>
                    </div>
                    <div className="flex gap-4">
                        <a href="https://www.facebook.com/people/IGLA-Innovative-Global-Logistics-Allianz/61577474642854/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-[#004aad] transition-colors"><Facebook className="w-4 h-4" /></a>
                        <a href="https://www.linkedin.com/company/igla-innovative-global-logistics-allianz/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-[#004aad] transition-colors"><Linkedin className="w-4 h-4" /></a>
                        <a href="https://www.instagram.com/igla.asia/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-[#004aad] transition-colors"><Instagram className="w-4 h-4" /></a>
                    </div>
                </div>
                <div className="lg:col-start-2">
                    <h4 className="font-bold text-lg mb-6">Useful Links</h4>
                    <ul className="space-y-3 text-white/80 text-sm">
                        <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                        <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                        <li><Link href="/membership/become-member" className="hover:text-white transition-colors">Membership</Link></li>
                        <li><Link href="/contact-us" className="hover:text-white transition-colors">Contact Us</Link></li>
                        <li><Link href="/risk?action=report" className="hover:text-white transition-colors">Report Issue</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-lg mb-6">Get in touch</h4>
                    <p className="text-white/80 mb-4 text-sm">Amber 16 F 2, Olympia Opaline 33,<br /> Rajiv Gandhi Road, Navalur - 600 130</p>
                    <p className="text-white/80 mb-2 flex items-center gap-2"><Phone className="w-4 h-4" /> +91 99401 00929</p>
                    <p className="text-white/80 mb-6 flex items-center gap-2"><Mail className="w-4 h-4" /> sales@igla.asia</p>
                    <Link href="/membership/become-member" className="bg-white text-[#004aad] px-6 py-3 rounded-full font-bold inline-block hover:bg-gray-100 transition-colors shadow-lg">Become a Member</Link>
                </div>
                <div>
                    <h4 className="font-bold text-lg mb-6">Stay Connected</h4>
                    <div className="flex gap-2 mb-6">
                        <Image src="/images/apple_store.png" alt="App Store" width={100} height={30} className="w-24 h-auto" />
                        <Image src="/images/play_store.png" alt="Play Store" width={100} height={30} className="w-24 h-auto" />
                    </div>
                    <button onClick={handleDownloadClick} className="bg-gradient-to-r from-[#77a1d3] via-[#79cbca] to-[#77a1d3] bg-[length:200%_auto] hover:bg-right transition-all duration-500 text-white px-6 py-2 rounded-full font-medium text-[16px] shadow-lg flex items-center gap-2">
                        <Download className="w-4 h-4" /> Download App
                    </button>
                </div>
            </div>
            <div className="container mx-auto px-4 mt-16 pt-8 border-t border-white/20 text-center text-white/60 text-sm flex flex-col items-center gap-1">
                <p>&copy; 2025 Innovative Global Logistics Allianz (IGLA). All rights reserved. <span className="mx-2">|</span> Developed by Cerchilo</p>
            </div>
        </footer>
    );
}
