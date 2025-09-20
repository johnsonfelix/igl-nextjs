'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { format } from 'date-fns';
import { MapPin, Calendar, Inbox, Ship, Plane, Truck, ShoppingBag, MessageSquare, DollarSign } from 'lucide-react';
import Link from 'next/link';

// --- TYPE DEFINITIONS ---
type InquiryStub = {
    id: string;
    from: string;
    to: string;
    commodity: string;
    shipmentMode: string;
    createdAt: string;
};

type MyResponse = {
    id: string;
    message: string | null;
    offerPrice: number | null;
    inquiry: InquiryStub;
};

// --- UI COMPONENTS ---

const InfoChip = ({ icon: Icon, label }: { icon: React.ElementType, label: string }) => (
    <div className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-medium">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
    </div>
);

const ResponseCard = ({ response }: { response: MyResponse }) => {
    const { inquiry } = response;
    const ShipmentIcon = inquiry.shipmentMode === 'AIR' ? Plane : inquiry.shipmentMode === 'LAND' ? Truck : Ship;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Original Inquiry Section */}
            <div className="p-4">
                <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                    <span>ORIGINAL INQUIRY</span>
                    <span>{format(new Date(inquiry.createdAt), 'd MMM yyyy')}</span>
                </div>
                <Link href={`/inquiry/${inquiry.id}`} className="block hover:text-orange-600">
                    <p className="font-bold text-lg text-gray-800">
                        {inquiry.from} to {inquiry.to}
                    </p>
                </Link>
                <div className="flex flex-wrap gap-2 mt-3">
                    <InfoChip icon={ShoppingBag} label={inquiry.commodity} />
                    <InfoChip icon={ShipmentIcon} label={inquiry.shipmentMode} />
                </div>
            </div>

            {/* Your Response Section */}
            <div className="bg-orange-50/50 p-4 border-t border-orange-200">
                <p className="text-sm font-bold text-orange-700 mb-2">YOUR RESPONSE</p>
                <div className="space-y-3">
                    {response.offerPrice && (
                        <div className="flex items-center gap-2 text-gray-800">
                            <DollarSign className="h-5 w-5 text-gray-500" />
                            <span className="font-semibold text-lg">
                                ${new Intl.NumberFormat('en-US').format(response.offerPrice)}
                            </span>
                        </div>
                    )}
                    {response.message && (
                        <div className="flex items-start gap-2 text-gray-700">
                            <MessageSquare className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm">{response.message}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---
export default function MyResponsesPage() {
    const { user } = useAuth();
    const [responses, setResponses] = useState<MyResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user?.companyId) {
            const fetchMyResponses = async () => {
                setLoading(true);
                setError(null);
                try {
                    const response = await fetch(`/api/inquiries/responded-by/${user.companyId}`);
                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error || "Failed to fetch your responses.");
                    }
                    
                    setResponses(data.responses);

                } catch (err) {
                    setError(err instanceof Error ? err.message : 'An unknown error occurred.');
                } finally {
                    setLoading(false);
                }
            };

            fetchMyResponses();
        } else if (user === null) {
            setLoading(false);
        }
    }, [user]);

    const renderContent = () => {
        if (loading) {
            return <p className="text-center mt-8">Loading your responses...</p>;
        }
        if (error) {
            return <p className="text-center mt-8 text-red-500">Error: {error}</p>;
        }
        if (!user) {
             return <p className="text-center mt-8 text-gray-600">Please log in to see your responses.</p>;
        }
        if (responses.length === 0) {
            return (
                 <div className="text-center py-12 px-6 bg-gray-100/70 rounded-lg border-2 border-dashed mt-8">
                    <Inbox className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-semibold text-gray-700">You haven't responded to any inquiries.</h3>
                    <Link href="/inquiry-board" className="mt-4 inline-block bg-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-orange-600">
                        Find Inquiries to Quote
                    </Link>
                </div>
            );
        }
        return (
            <div className="space-y-4">
                {responses.map(response => (
                    <ResponseCard key={response.id} response={response} />
                ))}
            </div>
        );
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-800">My Responses</h1>
                </div>
            </header>
            <main className="container mx-auto p-4 md:p-6">
                {renderContent()}
            </main>
        </div>
    );
}
