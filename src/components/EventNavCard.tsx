"use client";

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Users, Calendar, ArrowRight } from 'lucide-react';
import EventCountdown from './EventCountdown';

export default function EventNavCard() {
    return (
        <Link
            href="/event/cmjn1f6ih0000gad4xa4j7dp3"
            className="block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 group hover:shadow-xl hover:-translate-y-1 w-full"
        >
            <div className="relative h-48 w-full overflow-hidden">
                <Image
                    src="https://elasticbeanstalk-ap-south-1-762703128013.s3.ap-south-1.amazonaws.com/admin/1766989176854-6djke6fjzx-2.png"
                    alt="11th IGLA Global Freight Forwarder Annual Conference"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>

                <div className="absolute top-4 right-4 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-1 bg-[#004aad] text-white">
                    New
                </div>

                <div className="absolute bottom-4 left-4 text-white">
                    <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-lg p-3 text-center min-w-[60px]">
                        <div className="text-xl font-bold leading-none">25-27</div>
                        <div className="text-xs font-medium uppercase mt-1">Mar</div>
                    </div>
                </div>

                <div className="absolute bottom-4 right-4 z-20">
                    <EventCountdown targetDate="2026-03-25T00:00:00.000Z" />
                </div>
            </div>

            <div className="p-6">
                <h3
                    className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 leading-tight group-hover:text-[#004aad] transition-colors"
                    title="11th IGLA Global Freight Forwarder Annual Conference"
                >
                    11th IGLA Global Freight Forwarder Annual Conference
                </h3>

                <div className="space-y-3 text-sm text-gray-600 mb-6">
                    <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-[#004aad]" />
                        <span className="font-medium">Bangkok, Thailand</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-[#004aad]" />
                        <span>Expected attendance: 500</span>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#004aad] uppercase tracking-wider">
                        <Calendar className="h-4 w-4 text-[#004aad]" />
                        Mar 25 - 27, 2026
                    </div>
                    <button className="inline-flex items-center gap-1 bg-[#004aad] text-white font-bold text-sm px-4 py-2 rounded-lg hover:bg-[#00317a] hover:gap-2 transition-all shadow-sm">
                        Register Now <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </Link>
    );
}
