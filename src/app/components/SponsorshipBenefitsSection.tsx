"use client";

import { Globe, TrendingUp, Users, Award, Megaphone, MapPin } from "lucide-react";
import Link from "next/link";

export default function SponsorshipBenefitsSection() {
    const benefits = [
        {
            icon: Globe,
            title: "Global Digital Reach",
            description: "All sponsors will benefit from our paid Meta (Facebook & Instagram), LinkedIn, and WhatsApp ad campaigns"
        },
        {
            icon: Award,
            title: "Premium On-Ground Exposure",
            description: "Prominent brand placement throughout the conference venue and materials"
        },
        {
            icon: Megaphone,
            title: "Multi-Channel Promotion",
            description: "Featured in sponsor creatives, reels, banners, and event promotions"
        },
        {
            icon: Users,
            title: "Visibility in Networking Zones",
            description: "Direct engagement with logistics professionals in dedicated networking areas"
        }
    ];

    const stats = [
        { value: "250,000+", label: "Ad Impressions" },
        { value: "80,000+", label: "Professionals Reached" },
        { value: "5", label: "Regions Covered" },
        { value: "100%", label: "Brand Visibility" }
    ];

    const regions = ["India", "Asia-Pacific", "Middle East", "Europe", "USA"];

    return (
        <section className="hidden md:block py-20 bg-white">
            <div className="container mx-auto px-4">
                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
                    {/* Left Side - Headline */}
                    <div>
                        <span className="text-sm text-gray-500 uppercase tracking-wider mb-4 block">
                            Partnership Opportunity
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                            Why Sponsor This{" "}
                            <span className="text-[#004aad] relative">
                                Conference
                                <span className="absolute bottom-0 left-0 w-full h-1 bg-[#c6ff00]"></span>
                            </span>
                            ?
                        </h2>

                        {/* Regions Targeted */}
                        <div className="bg-[#f0f9f3] rounded-xl p-6 mb-6">
                            <p className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-[#004aad]" />
                                Targeting Logistics Professionals Across:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {regions.map((region, idx) => (
                                    <span
                                        key={idx}
                                        className="bg-white px-4 py-2 rounded-full text-sm font-semibold text-gray-700 border border-gray-200"
                                    >
                                        {region}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <p className="text-gray-600 text-lg mb-4">
                            <strong>Audience:</strong> Freight forwarders, logistics owners, managers, CXOs, importers & exporters
                        </p>

                        <p className="text-gray-500 italic">
                            Let Your Brand Travel Globally
                        </p>
                    </div>

                    {/* Right Side - Benefits List */}
                    <div className="space-y-4">
                        {benefits.map((benefit, idx) => {
                            const Icon = benefit.icon;
                            return (
                                <div
                                    key={idx}
                                    className="group flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-100 hover:border-[#004aad] hover:shadow-lg transition-all duration-300"
                                >
                                    <div className="w-12 h-12 bg-[#f0f9f3] rounded-full flex items-center justify-center shrink-0 group-hover:bg-[#004aad] transition-colors">
                                        <Icon className="h-6 w-6 text-[#004aad] group-hover:text-white transition-colors" />
                                    </div>
                                    <div className="flex-grow">
                                        <h4 className="font-bold text-gray-900 text-lg mb-1">{benefit.title}</h4>
                                        <p className="text-gray-600 text-sm">{benefit.description}</p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-5 h-5 text-[#004aad]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Statistics Section */}
                <div className="border-t border-gray-200 pt-12">
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            Estimated Digital Reach (Combined)
                        </h3>
                        <p className="text-gray-600">Your brand will be featured in sponsor creatives, reels, banners, and event promotions</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="text-center">
                                <div className="text-4xl md:text-5xl font-bold text-[#004aad] mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-sm uppercase tracking-wider text-gray-600 font-semibold">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA Button */}
                <div className="text-center mt-12">
                    <Link
                        href="/event/cmjn1f6ih0000gad4xa4j7dp3"
                        className="inline-flex items-center gap-2 bg-[#004aad] hover:bg-[#003882] text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg transition-all hover:scale-105"
                    >
                        <Award className="h-5 w-5" />
                        Become a Sponsor
                    </Link>
                </div>
            </div>
        </section>
    );
}
