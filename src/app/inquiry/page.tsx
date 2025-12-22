'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Clock, MapPin, Ship, Plane, Truck, ArrowRight, Package } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/app/context/AuthContext';

// --- TYPE DEFINITION ---
type Inquiry = {
    id: string;
    from: string;
    to: string;
    shipmentMode: string;
    cargoType: string;
    createdAt: string;
};

// --- UI COMPONENTS ---

const InquiryFilters = ({ filters, onFilterChange }: { filters: any, onFilterChange: (name: string, value: string) => void }) => {
    return (
        <div className="bg-white rounded-xl shadow-xl p-6 -mt-10 relative z-20 mx-4 lg:mx-0 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-5">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Search</label>
                    <div className="relative">
                        <input
                            type="text"
                            name="query"
                            placeholder="Origin, Destination, or Cargo..."
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-[#004aad] focus:bg-white transition-all text-sm font-medium"
                            value={filters.query}
                            onChange={(e) => onFilterChange(e.target.name, e.target.value)}
                        />
                        <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                    </div>
                </div>
                <div className="md:col-span-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Mode</label>
                    <select
                        name="mode"
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-[#004aad] focus:bg-white transition-all text-sm font-medium appearance-none"
                        value={filters.mode}
                        onChange={(e) => onFilterChange(e.target.name, e.target.value)}
                    >
                        <option value="">All Modes</option>
                        <option value="AIR">Air Freight</option>
                        <option value="SEA">Sea Freight</option>
                        <option value="LAND">Land Freight</option>
                    </select>
                </div>

                <div className="md:col-span-3 h-full flex items-end">
                    <button className="w-full bg-[#004aad] text-white py-3 rounded-lg font-bold shadow-lg hover:bg-[#4a8a52] transition-colors flex items-center justify-center gap-2">
                        <Search className="h-4 w-4" />
                        Find Cargo
                    </button>
                </div>
            </div>
        </div>
    );
};

const InquiryCard = ({ inquiry }: { inquiry: Inquiry }) => {
    const getShipmentIcon = (mode: string) => {
        if (mode === 'AIR') return <Plane className="h-5 w-5" />;
        if (mode === 'SEA') return <Ship className="h-5 w-5" />;
        if (mode === 'LAND') return <Truck className="h-5 w-5" />;
        return <Package className="h-5 w-5" />;
    };

    return (
        <Link
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
    );
};

const InquiryGridSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse h-80">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
                <div className="space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
            </div>
        ))}
    </div>
);


// --- MAIN PAGE COMPONENT ---
export default function InquiryBoardPage() {
    const [allInquiries, setAllInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ query: '', mode: '' });
    const { user } = useAuth();

    useEffect(() => {
        const fetchInquiries = async () => {
            const companyId = user?.companyId;
            const params = new URLSearchParams();
            if (companyId) {
                params.set('excludeCompanyId', companyId);
            }

            const response = await fetch(`/api/company/inquiry?excludeCompanyId=${companyId}`);
            if (response.ok) {
                const data = await response.json();
                setAllInquiries(data.inquiries || []);
            }
            setLoading(false);
        };

        if (user !== undefined) {
            fetchInquiries();
        }
    }, [user]);

    const filteredInquiries = useMemo(() => {
        return allInquiries.filter(inquiry => {
            const queryMatch = filters.query.toLowerCase()
                ? inquiry.from.toLowerCase().includes(filters.query.toLowerCase()) ||
                inquiry.to.toLowerCase().includes(filters.query.toLowerCase()) ||
                inquiry.cargoType.toLowerCase().includes(filters.query.toLowerCase())
                : true;

            const modeMatch = filters.mode ? inquiry.shipmentMode === filters.mode : true;

            return queryMatch && modeMatch;
        });
    }, [allInquiries, filters]);

    const handleFilterChange = (name: string, value: string) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value,
        }));
    };

    return (
        <div className="bg-white min-h-screen">
            {/* Hero Section */}
            <header className="relative h-[300px] lg:h-[400px] flex items-center justify-center text-center overflow-hidden">
                <div className="absolute inset-0">
                    <Image
                        src="/images/bg-4.jpg"
                        alt="Inquiry Background"
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-[#004aad]/80 mix-blend-multiply"></div>
                </div>
                <div className="relative z-10 px-4">
                    <span className="text-white/80 font-bold tracking-widest uppercase text-sm mb-4 block">Opportunity Awaits</span>
                    <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">Global Inquiry Board</h1>
                    <p className="text-white/90 text-lg max-w-2xl mx-auto">Browse available cargo opportunities and expand your business. Connect with partners worldwide.</p>
                </div>
            </header>

            <main className="container mx-auto px-4 pb-20">
                {/* Search Filters - Overlapping the Hero */}
                <InquiryFilters filters={filters} onFilterChange={handleFilterChange} />

                <div className="mt-16">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 relative gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-8 h-[2px] bg-[#004aad]"></span>
                                <span className="text-[#004aad] font-bold uppercase text-sm tracking-widest">Available Opportunities</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4">
                                <h2 className="text-3xl font-bold text-gray-800">Latest Inquiries</h2>
                                <Link href="/inquiry/new" className="inline-flex items-center gap-2 bg-[#004aad] hover:bg-[#4a8a52] text-white px-5 py-2 rounded-full font-bold text-sm shadow-md transition-all">
                                    <span>+</span> Post New Inquiry
                                </Link>
                            </div>
                        </div>
                        <div className="hidden md:block text-sm text-gray-500">
                            Showing {filteredInquiries.length} results
                        </div>
                    </div>

                    {loading ? (
                        <InquiryGridSkeleton />
                    ) : filteredInquiries.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-600 mb-2">No Inquiries Found</h3>
                            <p className="text-gray-500">Try adjusting your filters to see more results.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredInquiries.map(inquiry => (
                                <InquiryCard key={inquiry.id} inquiry={inquiry} />
                            ))}
                        </div>
                    )}
                </div>
            </main>


        </div>
    );
}
