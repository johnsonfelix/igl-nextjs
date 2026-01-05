'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ThumbsUp, Mail, Smartphone, Smile, FileText, MessageSquare, User, Send } from 'lucide-react';

export default function SecurePayPage() {
    return (
        <div className="min-h-screen bg-white font-sans">

            {/* Page Title / Hero Section */}
            <section className="bg-[#f7f7f7] p-0 overflow-hidden">
                <div className="container-fluid p-0">
                    <div className="flex flex-col md:flex-row min-h-[400px]">
                        {/* Left Content with Background */}
                        <div className="w-full md:w-1/2 relative flex flex-col justify-center px-8 py-16 md:px-20 text-center md:text-left text-white">
                            <div
                                className="absolute inset-0 bg-cover bg-center z-0"
                                style={{ backgroundImage: "url('/images/left-carousel-igla.jpg')" }}
                            >
                                {/* Overlay if needed to match design dark overlay? HTML implies it's just the img. 
                    Checking HTML: class="cover-background text-white". 
                    Likely the image itself is dark or has overlay in CSS. 
                    I'll add a slight overlay just in case text is hard to read. 
                */}
                                <div className="absolute inset-0 bg-black/30"></div>
                            </div>
                            <div className="relative z-10 animate-fade-in-up">
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight leading-tight">
                                    Payment Protection Plan
                                </h1>
                                <h2 className="text-lg md:text-xl font-light opacity-90">
                                    Protecting Your Business. Securing Your Trust.
                                </h2>
                            </div>
                        </div>

                        {/* Right Image */}
                        <div className="w-full md:w-1/2 relative min-h-[300px] md:min-h-full">
                            <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: "url('/images/ppp_bg.jpg')" }}
                            ></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Financial Protection Section */}
            <section className="py-20 md:py-28">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="flex flex-col lg:flex-row items-center gap-12 md:gap-20">
                        {/* Left Image */}
                        <div className="w-full lg:w-5/12">
                            <div className="relative rounded-lg overflow-hidden shadow-lg">
                                <Image
                                    src="/images/ppp_imag1.png"
                                    alt="Financial Protection"
                                    width={600}
                                    height={400}
                                    className="w-full h-auto"
                                />
                            </div>
                        </div>

                        {/* Right Content */}
                        <div className="w-full lg:w-6/12 animate-fade-in-up">
                            <div className="mb-4 flex items-center">
                                <span className="h-[2px] w-[30px] bg-[#2ebb79] inline-block mr-3"></span>
                                <span className="text-[#2ebb79] font-bold uppercase tracking-wider text-sm">Financial Protection Policy</span>
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 tracking-tight leading-tight">
                                Your Safety Net for Global Trade
                            </h3>
                            <p className="text-gray-500 mb-8 leading-relaxed text-lg">
                                IGLA is committed to building a safe and trustworthy network. Our Payment Protection Plan (PPP) offers members financial security in case of non-payment, ensuring peace of mind when doing business with fellow members.
                            </p>

                            <ul className="space-y-4 mb-10">
                                <li className="flex items-start border-b border-gray-100 pb-3">
                                    <span className="text-gray-700 font-medium">Up to USD 20,000 per year per member</span>
                                </li>
                                <li className="flex items-start border-b border-gray-100 pb-3">
                                    <span className="text-gray-700 font-medium">Gold Members can claim up to USD 5,000 per case</span>
                                </li>
                                <li className="flex items-start border-b border-gray-100 pb-3">
                                    <span className="text-gray-700 font-medium">Multiple claims allowed within the yearly limit, subject to approval</span>
                                </li>
                            </ul>

                            <Link
                                href="/membership/become-member"
                                className="inline-flex items-center gap-3 bg-gradient-to-r from-[#2ebb79] to-[#12ade8] text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                            >
                                <ThumbsUp className="w-5 h-5" />
                                <span>Explore Membership</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Support / Contact Section */}
            <section className="py-20 bg-gray-50">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="flex flex-col lg:flex-row gap-12">

                        {/* Introductory Text */}
                        <div className="w-full lg:w-4/12 flex flex-col justify-center">
                            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 tracking-tight">
                                We're Here to Support Your Global Growth
                            </h3>
                            <p className="text-gray-500 text-lg mb-8">
                                Have questions about membership, partnerships, or upcoming events?
                            </p>
                        </div>

                        {/* Contact Form */}
                        <div className="w-full lg:w-7/12 lg:ml-auto">
                            <form className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

                                    {/* Name */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Enter your name*</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Smile className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="What's your good name?"
                                                className="w-full pl-10 pr-4 py-3 border-b border-gray-300 focus:border-[#004aad] outline-none transition-colors bg-transparent placeholder-gray-400"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Phone number</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Smartphone className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="tel"
                                                placeholder="Enter your phone number"
                                                className="w-full pl-10 pr-4 py-3 border-b border-gray-300 focus:border-[#004aad] outline-none transition-colors bg-transparent placeholder-gray-400"
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Email address*</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Mail className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="email"
                                                placeholder="Enter your email address"
                                                className="w-full pl-10 pr-4 py-3 border-b border-gray-300 focus:border-[#004aad] outline-none transition-colors bg-transparent placeholder-gray-400"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Subject */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Subject</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FileText className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="How can we help you?"
                                                className="w-full pl-10 pr-4 py-3 border-b border-gray-300 focus:border-[#004aad] outline-none transition-colors bg-transparent placeholder-gray-400"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Message */}
                                <div className="mb-8">
                                    <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Your message</label>
                                    <div className="relative">
                                        <div className="absolute top-3 left-3 pointer-events-none">
                                            <MessageSquare className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <textarea
                                            placeholder="Describe about your project"
                                            rows={3}
                                            className="w-full pl-10 pr-4 py-3 border-b border-gray-300 focus:border-[#004aad] outline-none transition-colors bg-transparent placeholder-gray-400 resize-none"
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                    <p className="text-sm text-gray-500 text-center md:text-left">
                                        simply fill out the contact form and we’ll get back to you shortly!
                                    </p>
                                    <button
                                        type="submit"
                                        className="bg-gray-800 text-white px-8 py-3 rounded-full font-medium hover:bg-black transition-colors shadow-lg flex items-center gap-2"
                                    >
                                        <Mail className="w-4 h-4" />
                                        Submit request
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
}
