"use client";

import React from "react";
import Image from "next/image";
import { Phone, Mail, MapPin } from "lucide-react";
import Link from "next/link";

export default function ContactUs() {
    return (
        <div className="bg-white text-gray-800 font-sans">
            {/* Page Title Section */}
            <section className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
                <div className="absolute inset-0 flex">
                    <div className="w-1/2 relative h-full">
                        <Image
                            src="/images/left-carousel-igla.jpg"
                            alt="Contact Background Left"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex flex-col justify-center items-center md:items-start pl-10 md:pl-20 text-white">
                            <h1 className="text-4xl md:text-6xl font-bold mb-2">Contact</h1>
                            <h2 className="text-lg md:text-2xl font-light opacity-90">
                                Connect Globally. Grow Securely.
                            </h2>
                        </div>
                    </div>
                    <div className="w-1/2 relative h-full">
                        <Image
                            src="/images/contact-us-bg-1.png"
                            alt="Contact Background Right"
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>
            </section>

            {/* Main Content Section */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Left Column: Intro */}
                        <div className="lg:w-5/12">
                            <div className="bg-white rounded-lg shadow-lg p-10 transform translate-y-0 lg:-translate-y-12 transition-transform">
                                <span className="block text-[#2ebb79] font-bold uppercase text-sm mb-2">
                                    Let's Work Together
                                </span>
                                <h4 className="text-3xl font-bold text-gray-900 mb-6">
                                    We're Ready to Help You Grow!
                                </h4>
                                <p className="text-gray-600 mb-8 leading-relaxed">
                                    Have a question, idea, or need support? We're here to help and
                                    always ready to listen. Whether you're looking to join IGLA,
                                    collaborate with us, or simply learn more, our team is just a
                                    message away.
                                </p>

                                <div className="grid sm:grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-gray-500 mb-1">Call us directly?</p>
                                        <a
                                            href="tel:9940100929"
                                            className="text-gray-800 font-bold hover:text-[#2ebb79]"
                                        >
                                            +91 99401 00929
                                        </a>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 mb-1">Need live support?</p>
                                        <a
                                            href="mailto:sales@igla.asia"
                                            className="text-gray-800 font-bold hover:text-[#2ebb79]"
                                        >
                                            sales@igla.asia
                                        </a>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 mb-1">We Chat</p>
                                        <a href="#" className="text-gray-800 font-bold hover:text-[#2ebb79]">
                                            eric2710
                                        </a>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 mb-1">Visit headquarters</p>
                                        <a
                                            href="#"
                                            target="_blank"
                                            className="text-gray-800 font-bold hover:text-[#2ebb79] block leading-snug"
                                        >
                                            # Amber 16 F 2, Olympia Opaline 33, Rajiv Gandhi Road,
                                            Navalur - 600 130
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Regional Contacts */}
                        <div className="lg:w-7/12 max-w-xl">
                            <div className="grid md:grid-cols-1 gap-6">
                                {/* Europe */}
                                <div className=" rounded-2xl overflow-hidden flex flex-col sm:flex-row h-auto shadow-md hover:shadow-lg transition-shadow">
                                    <div className="sm:w-[35%] relative min-h-[160px] sm:min-h-[180px]">
                                        <Image
                                            src="/images/europe_map.png"
                                            alt="Europe Map"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="sm:w-[65%] bg-gray-50 p-8 xl:p-6 flex flex-col justify-center">
                                        <p className="text-sm font-semibold text-gray-600 mb-1">
                                            Europe
                                        </p>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Mr.Fabian</h3>
                                        <div className="flex items-center gap-2 text-gray-800">
                                            <Mail size={18} className="text-gray-600" />
                                            <a
                                                href="mailto:fabian@igla.asia"
                                                className="text-gray-900 hover:text-[#2ebb79] font-medium"
                                            >
                                                fabian@igla.asia
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {/* Americas */}
                                <div className="bg-gray-50 rounded-2xl overflow-hidden flex flex-col sm:flex-row h-auto shadow-md hover:shadow-lg transition-shadow">
                                    <div className="sm:w-[35%] relative min-h-[160px] sm:min-h-[180px]">
                                        <Image
                                            src="/images/America_map.png"
                                            alt="Americas Map"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="sm:w-[65%] bg-gray-50 p-8 xl:p-6 flex flex-col justify-center">
                                        <p className="text-sm font-semibold text-gray-600 mb-1">
                                            Americas
                                        </p>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Mr.Marlond</h3>
                                        <div className="flex items-center gap-2 text-gray-800">
                                            <Mail size={18} className="text-gray-600" />
                                            <a
                                                href="mailto:marlond@igla.asia"
                                                className="text-gray-900 hover:text-[#2ebb79] font-medium"
                                            >
                                                marlond@igla.asia
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {/* Africa/Australia */}
                                <div className="bg-gray-50 rounded-2xl overflow-hidden flex flex-col sm:flex-row h-auto shadow-md hover:shadow-lg transition-shadow">
                                    <div className="sm:w-[35%] relative min-h-[160px] sm:min-h-[180px]">
                                        <Image
                                            src="/images/australia_map.png"
                                            alt="Australia Map"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="sm:w-[65%] bg-gray-50 p-8 xl:p-6 flex flex-col justify-center">
                                        <p className="text-sm font-semibold text-gray-600 mb-1">
                                            Africa/Australia
                                        </p>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Mrs.Dovi</h3>
                                        <div className="flex items-center gap-2 text-gray-800">
                                            <Mail size={18} className="text-gray-600" />
                                            <a
                                                href="mailto:dovi@igla.asia"
                                                className="text-gray-900 hover:text-[#2ebb79] font-medium"
                                            >
                                                dovi@igla.asia
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {/* South East Asia */}
                                <div className="bg-gray-50 rounded-2xl overflow-hidden flex flex-col sm:flex-row h-auto shadow-md hover:shadow-lg transition-shadow">
                                    <div className="sm:w-[35%] relative min-h-[160px] sm:min-h-[180px]">
                                        <Image
                                            src="/images/southeast_asia_map.png"
                                            alt="South East Asia Map"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="sm:w-[65%] bg-gray-50 p-8 xl:p-6 flex flex-col justify-center">
                                        <p className="text-sm font-semibold text-gray-600 mb-1">
                                            South East Asia
                                        </p>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Mr.Jonathan</h3>
                                        <div className="flex items-center gap-2 text-gray-800">
                                            <Mail size={18} className="text-gray-600" />
                                            <a
                                                href="mailto:jon.siva@igla.asia"
                                                className="text-gray-900 hover:text-[#2ebb79] font-medium"
                                            >
                                                jon.siva@igla.asia
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {/* Middle East */}
                                <div className="bg-gray-50 rounded-2xl overflow-hidden flex flex-col sm:flex-row h-auto shadow-md hover:shadow-lg transition-shadow">
                                    <div className="sm:w-[35%] relative min-h-[160px] sm:min-h-[180px]">
                                        <Image
                                            src="/images/middle_east_map.png"
                                            alt="Middle East Map"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="sm:w-[65%] bg-gray-50 p-8 xl:p-6 flex flex-col justify-center">
                                        <p className="text-sm font-semibold text-gray-600 mb-1">
                                            Middle East
                                        </p>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Mr.Varadha</h3>
                                        <div className="flex items-center gap-2 text-gray-800">
                                            <Mail size={18} className="text-gray-600" />
                                            <a
                                                href="mailto:varadha@igla.asia"
                                                className="text-gray-900 hover:text-[#2ebb79] font-medium"
                                            >
                                                varadha@igla.asia
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Social Icons */}
                    <div className="mt-16 pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-center gap-6">
                        <h6 className="font-bold text-gray-800">Connect with social media</h6>
                        <span className="hidden md:block w-12 h-[1px] bg-gray-300"></span>
                        <div className="flex gap-4">
                            <a
                                href="https://www.facebook.com/profile.php?id=61577474642854"
                                target="_blank"
                                className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:scale-110 transition-transform"
                            >
                                <span className="font-bold">f</span>
                            </a>
                            <a
                                href="https://www.instagram.com/igla.asia?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                                target="_blank"
                                className="w-10 h-10 rounded-full bg-[#E4405F] text-white flex items-center justify-center hover:scale-110 transition-transform"
                            >
                                <span className="font-bold">in</span>
                            </a>
                            <a
                                href="https://www.linkedin.com/company/igla-innovative-global-logistics-allianz"
                                target="_blank"
                                className="w-10 h-10 rounded-full bg-[#0077B5] text-white flex items-center justify-center hover:scale-110 transition-transform"
                            >
                                <span className="font-bold">in</span>
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
