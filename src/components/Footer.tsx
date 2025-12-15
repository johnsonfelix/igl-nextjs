import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, Facebook, Linkedin, Instagram } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-white py-16">
            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div>
                    <Image src="/images/logo.png" alt="IGLA" width={150} height={60} className="mb-6 bg-white p-2 rounded" />
                    <p className="text-gray-400 mb-6 text-sm leading-relaxed">Connecting Freight Forwarders Across World</p>
                    <div className="flex gap-4">
                        <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#5da765] transition-colors"><Facebook className="w-4 h-4" /></a>
                        <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#5da765] transition-colors"><Linkedin className="w-4 h-4" /></a>
                        <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#5da765] transition-colors"><Instagram className="w-4 h-4" /></a>
                    </div>
                </div>
                <div className="lg:col-start-2">
                    <h4 className="font-bold text-lg mb-6">Company</h4>
                    <ul className="space-y-3 text-gray-400 text-sm">
                        <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                        <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                        <li><Link href="/membership/become-member" className="hover:text-white transition-colors">Membership</Link></li>
                        <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-lg mb-6">Get in touch</h4>
                    <p className="text-gray-400 mb-4 text-sm">Amber 16 F 2, Olympia Opaline 33, Rajiv Gandhi Road, Navalur - 600 130</p>
                    <p className="text-gray-400 mb-2 flex items-center gap-2"><Phone className="w-4 h-4" /> +91 99401 00929</p>
                    <p className="text-gray-400 flex items-center gap-2"><Mail className="w-4 h-4" /> sales@igla.asia</p>
                </div>
                <div>
                    <h4 className="font-bold text-lg mb-6">Stay Connected</h4>
                    <div className="flex gap-2 mb-6">
                        <Image src="/images/apple_store.png" alt="App Store" width={100} height={30} className="w-24 h-auto" />
                        <Image src="/images/play_store.png" alt="Play Store" width={100} height={30} className="w-24 h-auto" />
                    </div>
                    <Link href="/membership/become-member" className="bg-[#5da765] text-white px-6 py-3 rounded-full font-bold w-full text-center block hover:bg-[#4a8a52] transition-colors shadow-lg">Become a Member</Link>
                </div>
            </div>
            <div className="container mx-auto px-4 mt-16 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
                <p>&copy; 2025 Innovative Global Logistics Allianz (IGLA). All rights reserved.</p>
            </div>
        </footer>
    );
}
