"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Ship, Plane, Truck, Package, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface Inquiry {
    id: string;
    from: string;
    to: string;
    shipmentMode: string;
    cargoType: string;
    createdAt: string;
}

export default function LatestInquiriesSection() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInquiries();
    }, []);

    const fetchInquiries = async () => {
        try {
            const res = await fetch("/api/inquiries/latest");
            if (res.ok) {
                const data = await res.json();
                setInquiries(data);
            }
        } catch (error) {
            console.error("Error fetching latest inquiries:", error);
        } finally {
            setLoading(false);
        }
    };

    const getShipmentIcon = (mode: string) => {
        if (mode === 'AIR') return <Plane className="h-5 w-5" />;
        if (mode === 'SEA') return <Ship className="h-5 w-5" />;
        if (mode === 'LAND') return <Truck className="h-5 w-5" />;
        return <Package className="h-5 w-5" />;
    };

    if (loading || inquiries.length === 0) return null;

    return (
        <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-8 h-[2px] bg-[#004aad]"></span>
                            <span className="text-[#004aad] font-bold uppercase text-sm tracking-widest">Available Opportunities</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Latest Cargo Inquiries</h2>
                    </div>
                    <Link
                        href="/inquiry"
                        className="inline-flex items-center gap-2 bg-[#004aad] hover:bg-[#003882] text-white px-6 py-3 rounded-full font-bold text-sm shadow-md transition-all"
                    >
                        View All Inquiries
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                {/* Inquiry Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {inquiries.map((inquiry) => (
                        <Link
                            key={inquiry.id}
                            href={`/inquiry/${inquiry.id}`}
                            className="group relative bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-gray-200 group-hover:bg-[#004aad] transition-colors"></div>

                            <div className="p-6 flex-grow">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-2 text-gray-400 group-hover:text-[#004aad] transition-colors">
                                        {getShipmentIcon(inquiry.shipmentMode)}
                                        <span className="text-xs font-bold tracking-wider uppercase">{inquiry.shipmentMode}</span>
                                    </div>
                                    <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">
                                        {format(new Date(inquiry.createdAt), 'MMM d, yyyy')}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                            <div className="w-2 h-2 rounded-full bg-[#004aad]"></div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase font-bold">Origin</p>
                                            <p className="font-bold text-gray-800 text-lg leading-tight">{inquiry.from}</p>
                                        </div>
                                    </div>

                                    <div className="ml-1 border-l-2 border-dashed border-gray-200 h-4"></div>

                                    <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                            <div className="w-2 h-2 rounded-full border-2 border-[#004aad] bg-white"></div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase font-bold">Destination</p>
                                            <p className="font-bold text-gray-800 text-lg leading-tight">{inquiry.to}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#f0f9f3] p-4 flex justify-between items-center group-hover:bg-[#004aad] transition-colors duration-300">
                                <span className="text-xs font-bold text-gray-600 uppercase group-hover:text-white transition-colors">
                                    {inquiry.cargoType}
                                </span>
                                <span className="text-xs font-bold text-[#004aad] flex items-center gap-1 group-hover:text-white transition-colors">
                                    View Details <ArrowRight className="h-3 w-3" />
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
