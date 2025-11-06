'use client'; 

import { Suspense, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Clock, MapPin, Ship, Plane, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/app/context/AuthContext'; 

// --- TYPE DEFINITION (Matching your API's select statement) ---
type Inquiry = {
    id: string;
    from: string;
    to: string;
    shipmentMode: string;
    cargoType: string;
    createdAt: string;
};

// --- UI COMPONENTS ---

// Filters are now "dumb" components that report changes up to the parent
const InquiryFilters = ({ filters, onFilterChange }: { filters: any, onFilterChange: (name: string, value: string) => void }) => {
    return (
        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg mt-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                <input
                    type="text"
                    name="query"
                    placeholder="Search From/To/Cargo..."
                    className="w-full p-3 bg-white text-gray-800 border-gray-300 border rounded-md focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    value={filters.query}
                    onChange={(e) => onFilterChange(e.target.name, e.target.value)}
                />
                <select
                    name="mode"
                    className="w-full p-3 bg-white text-gray-800 border-gray-300 border rounded-md appearance-none"
                    value={filters.mode}
                    onChange={(e) => onFilterChange(e.target.name, e.target.value)}
                >
                    <option value="">All Shipment Modes</option>
                    <option value="AIR">Air Freight</option>
                    <option value="SEA">Sea Freight</option>
                    <option value="LAND">Land Freight</option>
                </select>
            
                <button className="bg-gray-800 text-white p-3 rounded-md flex items-center justify-center hover:bg-gray-900 h-full">
                    <Search className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
};

const InquiryCard = ({ inquiry }: { inquiry: Inquiry }) => {
    const getShipmentIcon = (mode: string) => {
        if (mode === 'AIR') return <Plane className="h-5 w-5 text-gray-500" />;
        if (mode === 'SEA') return <Ship className="h-5 w-5 text-gray-500" />;
        if (mode === 'LAND') return <Truck className="h-5 w-5 text-gray-500" />;
        return null;
    };

    // Wrap the whole card with Link so the entire card is clickable.
    // We've removed the nested Link that used to live in the header.
    return (
        <Link
            href={`/inquiry/${inquiry.id}`}
            className="block bg-white border rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col no-underline text-inherit"
        >
            <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">Find Agent at</p>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        {/* replaced inner Link with a styled badge to avoid nested links */}
                        <span className="text-xs font-semibold text-background bg-secondary px-2 py-1 rounded-full">
                            Detailed Inquiry
                        </span>
                    </div>
                </div>
                <div className="mt-2">
                    <span className="inline-block bg-gray-100 text-gray-800 text-sm font-semibold px-3 py-1 rounded-md">
                       Worldwide
                    </span>
                </div>
            </div>
            <div className="p-4 flex-grow">
                <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                    <div className="flex-grow">
                        <p className="font-semibold text-gray-800">{inquiry.from}</p>
                        <div className="h-4 border-l-2 border-dotted border-gray-300 ml-2 my-1"></div>
                        <p className="font-semibold text-gray-800">{inquiry.to}</p>
                    </div>
                </div>
            </div>
            <div className="p-4 bg-gray-50 border-t flex justify-between items-center text-sm text-gray-600 rounded-b-lg">
                <div className="flex items-center gap-2">
                    {getShipmentIcon(inquiry.shipmentMode)}
                    <span>{inquiry.shipmentMode} - {inquiry.cargoType}</span>
                </div>
                <span>
                    {format(new Date(inquiry.createdAt), 'd-MMM-yyyy')}
                </span>
            </div>
        </Link>
    );
};

const InquiryGridSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border rounded-lg shadow-sm animate-pulse">
                <div className="p-4 border-b h-24 bg-gray-200 rounded-t-lg"></div>
                <div className="p-4 h-28 bg-gray-200"></div>
                <div className="p-4 bg-gray-100 h-16 rounded-b-lg"></div>
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

    // 1. Fetch all data once
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

        // Only fetch when user object is available
        if (user !== undefined) {
             fetchInquiries();
        }
    }, [user]);

    // 2. Filter data on the client side whenever filters change
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

    // 3. Handle filter changes
    const handleFilterChange = (name: string, value: string) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value,
        }));
    };

    const renderContent = () => {
        if (loading) {
            return <InquiryGridSkeleton />;
        }
        if (filteredInquiries.length === 0) {
            return <p className="text-center text-gray-500 mt-8 col-span-full">No inquiries match the current filters.</p>;
        }
        return (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredInquiries.map(inquiry => (
                    <InquiryCard key={inquiry.id} inquiry={inquiry} />
                ))}
            </div>
        );
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <header className="bg-gray-800 text-white p-6 shadow-lg bg-cover bg-center" style={{ backgroundImage: "url('/container-ship-bg.jpg')" }}>
                <div className="container mx-auto">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h1 className="text-3xl font-bold">Inquiry Board</h1>
                            {/* <p className="text-gray-300">Sign in to start quoting, <Link href="/login" className="text-orange-400 font-semibold hover:underline">Sign in now</Link></p> */}
                        </div>
                        <Link href= "inquiry/my-inquiries" className="border border-white/50 rounded-md px-4 py-2 text-sm flex items-center gap-2 hover:bg-white/10 transition-colors">
                            <Clock className="h-4 w-4" />
                            My History
                        </Link>
                    </div>
                    {/* Pass filters and handler down */}
                    <InquiryFilters filters={filters} onFilterChange={handleFilterChange} />
                </div>
            </header>

            <main className="container mx-auto py-10 px-4">
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Inquiries</h2>
                        {/* <Link href="/inquiries/all" className="text-orange-600 font-semibold hover:underline">
                            View More &gt;
                        </Link> */}
                    </div>
                    {renderContent()}
                </section>
            </main>

            <Link href="/inquiry/new" className="fixed bottom-10 right-10 bg-primary text-white rounded-full shadow-lg p-4 hover:bg-orange-600 transition-colors flex items-center gap-2">
                Post Inquiry
            </Link>
        </div>
    );
}
