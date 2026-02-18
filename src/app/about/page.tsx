'use client';

import React from 'react';
import { Globe, Users, Award, Target, Mail, Phone, MapPin, CheckCircle, TrendingUp, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

export default function AboutPage() {
    const conferenceHighlights = [
        { year: "2013", location: "Shanghai", description: "The foundation of trusted global connections was laid here." },
        { year: "2014", location: "Vietnam", description: "New partnerships began as members expanded their reach together." },
        { year: "2015", location: "Bangkok", description: "Stronger collaboration led to smarter logistics solutions worldwide." },
        { year: "2016", location: "Guangzhou", description: "Diverse minds united under one roof to spark new opportunities." },
        { year: "2017", location: "Thailand", description: "Celebrating mutual growth through meaningful business relationships." },
        { year: "2018", location: "Malaysia", description: "A global exchange of ideas, deals, and long-term partnerships." },
        { year: "2019", location: "Malaysia", description: "Creating value through trust, teamwork, and global cooperation." },
        { year: "2023", location: "Bangkok", description: "Members came together to expand borders and build futures." },
        { year: "2024", location: "Vietnam", description: "Driving progress in logistics through strategic collaboration." },
        { year: "2025", location: "Bangkok", description: "Marking a decade of excellence, unity, and global success." },
    ];

    return (
        <div className="min-h-screen bg-[#f8f9fa] font-sans">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-[#004aad] to-[#4a8a52] text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                </div>

                <div className="container mx-auto px-4 py-20 md:py-32 relative z-10 max-w-6xl">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6">About IGLA</h1>
                        <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                            Trusted Global Logistics Alliance Since 2012
                        </p>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 py-16 max-w-7xl">
                {/* Who We Are Section */}
                <section className="mb-20">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-1.5 h-10 bg-[#004aad] rounded-full"></div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Who We Are</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                            <div className="w-16 h-16 bg-[#004aad]/10 rounded-full flex items-center justify-center mb-6 text-[#004aad]">
                                <Globe size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-4">Global Network</h3>
                            <p className="text-gray-600 leading-relaxed text-lg">
                                IGLA (Innovative Global Logistics Allianz) is a premier network of independent freight forwarders and logistics companies worldwide.
                                Established in 2012, we connect trusted partners across continents to provide seamless international shipping solutions.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-blue-600">
                                <Users size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-4">Trusted Members</h3>
                            <p className="text-gray-600 leading-relaxed text-lg">
                                Our members are carefully selected, verified freight forwarders and logistics providers who share our commitment
                                to excellence, reliability, and professional service across all corners of the globe.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Our Mission Section */}
                <section className="mb-20">
                    <div className="bg-gradient-to-r from-[#004aad] to-[#4a8a52] p-12 rounded-2xl shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 opacity-10">
                            <Target size={200} />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                    <Target size={24} className="text-white" />
                                </div>
                                <h2 className="text-3xl md:text-4xl font-bold text-white">Our Mission</h2>
                            </div>

                            <p className="text-white/95 text-lg md:text-xl leading-relaxed max-w-4xl">
                                To empower independent logistics companies by providing a collaborative platform that enhances global reach,
                                fosters trusted partnerships, and delivers exceptional value to customers through reliable and efficient
                                international freight forwarding services.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Conference Highlights Section */}
                <section className="mb-20 overflow-hidden relative">
                    <div className="flex flex-wrap items-center mb-8 md:mb-12 text-center lg:text-left">
                        <div className="w-full lg:w-5/12 mb-8 md:mb-0">
                            <div>
                                <span className="text-base text-[#004aad] font-semibold uppercase tracking-wider mb-2 block">Conference Highlights</span>
                                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 tracking-tight">Where Global Partnerships Begin</h2>
                            </div>
                        </div>
                        <div className="w-full lg:w-5/12 mb-8 md:mb-0">
                            {/* Optional: Description can go here if needed later */}
                        </div>
                        <div className="w-full lg:w-2/12 flex justify-center lg:justify-end gap-4">
                            {/* Swiper Custom Navigation */}
                            <div className="highlight-prev w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center cursor-pointer hover:bg-black hover:text-white hover:border-black transition-all">
                                <ChevronLeft className="w-6 h-6" />
                            </div>
                            <div className="highlight-next w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center cursor-pointer hover:bg-black hover:text-white hover:border-black transition-all">
                                <ChevronRight className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="w-full">
                            <Swiper
                                modules={[Autoplay, Navigation]}
                                spaceBetween={30}
                                slidesPerView={1}
                                loop={true}
                                navigation={{
                                    nextEl: ".highlight-next",
                                    prevEl: ".highlight-prev",
                                }}
                                autoplay={{
                                    delay: 3000,
                                    disableOnInteraction: false,
                                }}
                                breakpoints={{
                                    640: { slidesPerView: 2 },
                                    1024: { slidesPerView: 3 },
                                    1280: { slidesPerView: 4 },
                                }}
                                className="pb-12"
                            >
                                {conferenceHighlights.map((item, index) => (
                                    <SwiperSlide key={index}>
                                        <div className="text-center group p-4 hover:translate-y-[-5px] transition-transform duration-300">
                                            <h4 className="text-gray-800 text-2xl font-bold mb-0 tracking-tight">{item.year}</h4>

                                            <div className="relative mt-6 mb-6">
                                                <span className="absolute top-1/2 left-0 w-full h-[1px] bg-gray-300 -translate-y-1/2"></span>
                                                <div className="relative z-10 w-8 h-8 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#77a1d3] via-[#79cbca] to-[#77a1d3]"></span>
                                                </div>
                                            </div>

                                            <span className="inline-block font-semibold text-gray-800 text-lg mb-3">{item.location}</span>
                                            <p className="text-gray-500 text-sm leading-relaxed max-w-[85%] mx-auto">
                                                {item.description}
                                            </p>
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>
                    </div>
                </section>

                {/* Core Values Section */}
                <section className="mb-20">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-1.5 h-10 bg-[#004aad] rounded-full"></div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Core Values</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 hover:shadow-xl hover:border-[#004aad]/30 hover:translate-y-[-4px] transition-all group">
                            <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mb-5 group-hover:bg-[#004aad] transition-colors">
                                <CheckCircle size={28} className="text-[#004aad] group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Trust & Integrity</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Building lasting relationships through transparency, honesty, and ethical business practices.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 hover:shadow-xl hover:border-[#004aad]/30 hover:translate-y-[-4px] transition-all group">
                            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-5 group-hover:bg-blue-600 transition-colors">
                                <TrendingUp size={28} className="text-blue-600 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Excellence</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Delivering superior service quality and continuously improving our processes and partnerships.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 hover:shadow-xl hover:border-[#004aad]/30 hover:translate-y-[-4px] transition-all group">
                            <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center mb-5 group-hover:bg-purple-600 transition-colors">
                                <Shield size={28} className="text-purple-600 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Reliability</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Ensuring consistent, dependable service that our members and customers can count on.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Why Choose IGLA Section */}
                <section className="mb-20">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-1.5 h-10 bg-[#004aad] rounded-full"></div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Why Choose IGLA</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            { title: "Verified Network", desc: "All members are carefully vetted and verified to ensure quality and reliability" },
                            { title: "Global Coverage", desc: "Access to logistics partners in major ports and cities worldwide" },
                            { title: "Competitive Rates", desc: "Benefit from collective negotiating power and volume discounts" },
                            { title: "24/7 Support", desc: "Round-the-clock assistance for urgent shipments and inquiries" },
                            { title: "Technology Platform", desc: "Modern digital tools for communication, and collaboration" },
                            { title: "Risk Management", desc: "Comprehensive vetting and monitoring to minimize business risks" }
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-start gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#004aad]/20 transition-all">
                                <div className="w-8 h-8 bg-[#004aad] rounded-full flex items-center justify-center shrink-0 mt-1">
                                    <CheckCircle size={18} className="text-white" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 text-lg mb-2">{item.title}</h4>
                                    <p className="text-gray-600">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Contact Section */}
                <section className="mb-8">
                    <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-1.5 h-10 bg-[#004aad] rounded-full"></div>
                            <h2 className="text-3xl font-bold text-gray-800">Get in Touch</h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-[#004aad]/10 rounded-xl flex items-center justify-center shrink-0">
                                    <Mail size={24} className="text-[#004aad]" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 mb-2">Email</h4>
                                    <a href="mailto:sales@igla.asia" className="text-[#004aad] hover:underline">sales@igla.asia</a>
                                </div>
                            </div>

                            {/* <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                                    <Phone size={24} className="text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 mb-2">Phone</h4>
                                    <a href="tel:+1234567890" className="text-gray-600 hover:text-[#004aad]">+91 93630 27279</a>
                                </div>
                            </div> */}

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                                    <MapPin size={24} className="text-purple-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 mb-2">Headquarters</h4>
                                    <p className="text-gray-600">Amber 16 F 2, Olympia Opaline 33,
                                        Rajiv Gandhi Road, Navalur - 600 130</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
