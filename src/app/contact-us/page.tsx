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
                        <div className="lg:w-5/12 sticky top-24 h-fit">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-8 h-[2px] bg-[#2ebb79]"></span>
                                <span className="text-[#2ebb79] font-bold uppercase text-sm tracking-widest">
                                    Get in touch with us
                                </span>
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
                                Your Gateway to Global Logistics Networking Starts Here
                            </h3>
                            <p className="text-gray-600 mb-8 leading-relaxed">
                                At Innovative Global Logistics Allianz (IGLA), we believe that
                                every strong connection begins with a conversation. Whether
                                you’re a freight forwarder exploring global opportunities, an
                                existing member needing support, or a partner looking to
                                collaborate, we’re here to help.
                            </p>
                            <a
                                href="tel:+919940100929"
                                className="inline-flex items-center gap-2 bg-[#2ebb79] hover:bg-[#249d65] text-white px-8 py-3 rounded-full font-medium transition-all shadow-md group"
                            >
                                <div className="bg-white/20 p-1 rounded-full text-white">
                                    <Phone size={18} />
                                </div>
                                <span>Connect With Us</span>
                            </a>
                        </div>

                        {/* Right Column: Regional Contacts */}
                        <div className="lg:w-7/12">
                            <div className="grid md:grid-cols-1 gap-6">
                                {/* Europe */}
                                <div className="bg-white rounded-lg shadow-xl overflow-hidden flex flex-col sm:flex-row h-auto min-h-[200px]">
                                    <div className="sm:w-1/2 relative min-h-[200px]">
                                        <Image
                                            src="/images/europe_map.png"
                                            alt="Europe Map"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="sm:w-1/2 p-8 flex flex-col justify-center">
                                        <span className="block text-xl font-bold text-gray-800 mb-2">
                                            Europe
                                        </span>
                                        <h6 className="text-gray-600 mb-4">Mr.Fabian</h6>
                                        <a
                                            href="mailto:fabian@igla.asia"
                                            className="flex items-center gap-2 text-gray-700 hover:text-[#2ebb79] font-semibold"
                                        >
                                            <Mail size={16} />
                                            fabian@igla.asia
                                        </a>
                                    </div>
                                </div>

                                {/* Americas */}
                                <div className="bg-white rounded-lg shadow-xl overflow-hidden flex flex-col sm:flex-row h-auto min-h-[200px]">
                                    <div className="sm:w-1/2 relative min-h-[200px]">
                                        <Image
                                            src="/images/America_map.png"
                                            alt="Americas Map"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="sm:w-1/2 p-8 flex flex-col justify-center">
                                        <span className="block text-xl font-bold text-gray-800 mb-2">
                                            Americas
                                        </span>
                                        <h6 className="text-gray-600 mb-4">Mr.Marlond</h6>
                                        <a
                                            href="mailto:marlond@igla.asia"
                                            className="flex items-center gap-2 text-gray-700 hover:text-[#2ebb79] font-semibold"
                                        >
                                            <Mail size={16} />
                                            marlond@igla.asia
                                        </a>
                                    </div>
                                </div>

                                {/* Africa/Australia */}
                                <div className="bg-white rounded-lg shadow-xl overflow-hidden flex flex-col sm:flex-row h-auto min-h-[200px]">
                                    <div className="sm:w-1/2 relative min-h-[200px]">
                                        <Image
                                            src="/images/australia_map.png"
                                            alt="Australia Map"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="sm:w-1/2 p-8 flex flex-col justify-center">
                                        <span className="block text-xl font-bold text-gray-800 mb-2">
                                            Africa/Australia
                                        </span>
                                        <h6 className="text-gray-600 mb-4">Mrs.Dovi</h6>
                                        <a
                                            href="mailto:dovi@igla.asia"
                                            className="flex items-center gap-2 text-gray-700 hover:text-[#2ebb79] font-semibold"
                                        >
                                            <Mail size={16} />
                                            dovi@igla.asia
                                        </a>
                                    </div>
                                </div>

                                {/* South East Asia */}
                                <div className="bg-white rounded-lg shadow-xl overflow-hidden flex flex-col sm:flex-row h-auto min-h-[200px]">
                                    <div className="sm:w-1/2 relative min-h-[200px]">
                                        <Image
                                            src="/images/southeast_asia_map.png"
                                            alt="South East Asia Map"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="sm:w-1/2 p-8 flex flex-col justify-center">
                                        <span className="block text-xl font-bold text-gray-800 mb-2">
                                            South East Asia
                                        </span>
                                        <h6 className="text-gray-600 mb-4">Mr.Jonathan</h6>
                                        <a
                                            href="mailto:jon.siva@igla.asia"
                                            className="flex items-center gap-2 text-gray-700 hover:text-[#2ebb79] font-semibold"
                                        >
                                            <Mail size={16} />
                                            jon.siva@igla.asia
                                        </a>
                                    </div>
                                </div>

                                {/* Middle East */}
                                <div className="bg-white rounded-lg shadow-xl overflow-hidden flex flex-col sm:flex-row h-auto min-h-[200px]">
                                    <div className="sm:w-1/2 relative min-h-[200px]">
                                        <Image
                                            src="/images/middle_east_map.png"
                                            alt="Middle East Map"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="sm:w-1/2 p-8 flex flex-col justify-center">
                                        <span className="block text-xl font-bold text-gray-800 mb-2">
                                            Middle East
                                        </span>
                                        <h6 className="text-gray-600 mb-4">Mr.Varadha</h6>
                                        <a
                                            href="mailto:varadha@igla.asia"
                                            className="flex items-center gap-2 text-gray-700 hover:text-[#2ebb79] font-semibold"
                                        >
                                            <Mail size={16} />
                                            varadha@igla.asia
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Form Section */}
            <section className="bg-[#f0f9f3] py-20">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Left: Contact Info */}
                        <div className="lg:w-5/12">
                            <div className="bg-white rounded-lg shadow-lg p-10 transform translate-y-0 lg:-translate-y-12 transition-transform">
                                <span className="block text-[#2ebb79] font-bold uppercase text-sm mb-2">
                                    Let’s Work Together
                                </span>
                                <h4 className="text-3xl font-bold text-gray-900 mb-6">
                                    We’re Ready to Help You Grow!
                                </h4>
                                <p className="text-gray-600 mb-8 leading-relaxed">
                                    Have a question, idea, or need support? We’re here to help and
                                    always ready to listen. Whether you're looking to join IGLA,
                                    collaborate with us, or simply learn more, our team is just a
                                    message away.
                                </p>

                                <div className="grid sm:grid-cols-2 gap-8">
                                    <div>
                                        < p className="text-gray-500 mb-1">Call us directly?</p>
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

                        {/* Right: Form */}
                        <div className="lg:w-6/12 lg:offset-1">
                            <h3 className="text-3xl font-bold text-gray-900 mb-8">
                                Looking for any help?
                            </h3>
                            <form
                                action="email-templates/contact-form.php"
                                method="post"
                                className="space-y-6"
                            >
                                <div>
                                    <label
                                        htmlFor="name"
                                        className="block text-xs uppercase font-bold text-gray-600 mb-2"
                                    >
                                        Enter your name*
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        id="name"
                                        placeholder="What's your good name"
                                        className="w-full bg-transparent border-b border-gray-300 py-3 focus:outline-none focus:border-gray-800 transition-colors"
                                        required
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-xs uppercase font-bold text-gray-600 mb-2"
                                    >
                                        Email address*
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        id="email"
                                        placeholder="Enter your email address"
                                        className="w-full bg-transparent border-b border-gray-300 py-3 focus:outline-none focus:border-gray-800 transition-colors"
                                        required
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="comment"
                                        className="block text-xs uppercase font-bold text-gray-600 mb-2"
                                    >
                                        Your message
                                    </label>
                                    <textarea
                                        name="comment"
                                        id="comment"
                                        rows={4}
                                        placeholder="Describe about your project"
                                        className="w-full bg-transparent border-b border-gray-300 py-3 focus:outline-none focus:border-gray-800 transition-colors resize-none"
                                    ></textarea>
                                </div>

                                <div className="flex items-center justify-between pt-4">
                                    <p className="text-sm text-gray-500">
                                        We will never collect information about you without your
                                        explicit consent.
                                    </p>
                                    <button
                                        type="submit"
                                        className="bg-gray-800 hover:bg-black text-white px-8 py-3 rounded-full font-medium shadow-md transition-all whitespace-nowrap"
                                    >
                                        Send message
                                    </button>
                                </div>
                            </form>
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
