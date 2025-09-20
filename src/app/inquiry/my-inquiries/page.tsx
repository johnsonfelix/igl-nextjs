'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { format } from 'date-fns';
import { Calendar, ChevronRight, Inbox, Plane, Ship, Truck } from 'lucide-react';

// --- TYPE DEFINITION (Matching your API) ---
type MyInquiry = {
    id: string;
    from: string;
    to: string;
    commodity: string;
    cargoType: string;
    shipmentMode: string;
    createdAt: string;
    // Removed _count as it's not in your API response
};

// --- UI COMPONENTS ---

const InquiryCard = ({ inquiry }: { inquiry: MyInquiry }) => {
    const getShipmentIcon = (mode: string) => {
        if (mode === 'AIR') return <Plane className="h-4 w-4 text-gray-500" />;
        if (mode === 'SEA') return <Ship className="h-4 w-4 text-gray-500" />;
        return <Truck className="h-4 w-4 text-gray-500" />;
    };

    return (
         <Link href={`/inquiry/my-inquiries/${inquiry.id}`} className="block">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-orange-300 transition-all duration-300">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold text-base text-gray-800">
                            {inquiry.from} to {inquiry.to}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{inquiry.commodity} ({inquiry.cargoType})</p>
                    </div>
                    <div className="flex items-center text-orange-600">
                        <span className="font-semibold text-sm">View</span>
                        <ChevronRight className="h-5 w-5" />
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center text-sm text-gray-500 gap-3">
                   <div className="flex items-center gap-1">
                       {getShipmentIcon(inquiry.shipmentMode)}
                       <span>{inquiry.shipmentMode}</span>
                   </div>
                    <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(inquiry.createdAt), 'd MMM yyyy')}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

const NoInquiriesWidget = () => (
    <div className="text-center py-12 px-6 bg-gray-100/70 rounded-lg border-2 border-dashed mt-8">
        <Inbox className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold text-gray-700">You haven't posted any inquiries yet.</h3>
        <Link href="/inquiries/new" className="mt-4 inline-block bg-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-orange-600">
            Post an Inquiry
        </Link>
    </div>
);


// --- MAIN PAGE COMPONENT ---
export default function MyInquiriesPage() {
    const { user } = useAuth();
    const [inquiries, setInquiries] = useState<MyInquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user?.companyId) {
            const fetchMyInquiries = async () => {
                setLoading(true);
                setError(null);
                try {
                    // Fetch from your specified endpoint
                    const response = await fetch(`/api/company/my-inquiry?companyId=${user.companyId}`);
                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error || "Failed to fetch your inquiries.");
                    }
                    
                    setInquiries(data);

                } catch (err) {
                    setError(err instanceof Error ? err.message : 'An unknown error occurred.');
                } finally {
                    setLoading(false);
                }
            };

            fetchMyInquiries();
        } else if (user === null) {
            setLoading(false);
        }
    }, [user]);

    const renderContent = () => {
        if (loading) {
            return <p className="text-center mt-8">Loading your inquiries...</p>;
        }
        if (error) {
            return <p className="text-center mt-8 text-red-500">Error: {error}</p>;
        }
        if (!user) {
             return <p className="text-center mt-8 text-gray-600">Please log in to see your inquiries.</p>;
        }
        if (inquiries.length === 0) {
            return <NoInquiriesWidget />;
        }
        return (
            <div className="space-y-4">
                {inquiries.map(inquiry => (
                    <InquiryCard key={inquiry.id} inquiry={inquiry} />
                ))}
            </div>
        );
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-800">My Inquiries</h1>
                    <Link href="/inquiry/my-responses" className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-orange-600">
                        My Responses
                    </Link>
                </div>
            </header>
            <main className="container mx-auto p-4 md:p-6">
                {renderContent()}
            </main>
        </div>
    );
}
