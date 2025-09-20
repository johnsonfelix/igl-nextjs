'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { format } from 'date-fns';
import {
    MapPin,
    Ship,
    Plane,
    Truck,
    ShoppingBag,
    FileText,
    Calendar,
    ChevronLeft,
    Building,
    Inbox,
    MessageSquare,
    DollarSign
} from 'lucide-react';

// --- TYPE DEFINITIONS ---

type Company = {
    id: string;
    name: string;
    contactEmail: string;
};

type InquiryResponse = {
    id: string;
    message: string | null;
    offerPrice: number | null;
    createdAt: string;
    responder: Company;
};

type InquiryDetails = {
    id: string;
    from: string;
    to: string;
    shipmentMode: string;
    cargoType: string;
    commodity: string | null;
    remark: string | null;
    createdAt: string;
    responses: InquiryResponse[];
};

// --- UI COMPONENTS ---

const DetailRow = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | null }) => {
    if (!value) return null;
    return (
        <div className="flex items-start py-3 px-6">
            <Icon className="h-5 w-5 text-orange-500 mt-1 mr-4 flex-shrink-0" />
            <div className="flex-grow">
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <p className="text-base text-gray-800">{value}</p>
            </div>
        </div>
    );
};

const ResponseCard = ({ response }: { response: InquiryResponse }) => (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <span className="text-orange-600 font-bold text-lg">
                    {response.responder.name.charAt(0).toUpperCase()}
                </span>
            </div>
            <div>
                <p className="font-semibold text-gray-900">{response.responder.name}</p>
                <p className="text-sm text-gray-500">{response.responder.contactEmail}</p>
            </div>
        </div>
        <div className="p-4 space-y-4">
            {response.offerPrice && (
                 <div className="bg-orange-50 text-center rounded-lg p-3">
                    <p className="text-xs font-bold text-orange-600">OFFER PRICE</p>
                    <p className="text-3xl font-bold text-gray-800">
                        ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(response.offerPrice)}
                    </p>
                </div>
            )}
             {response.message && (
                <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Message:</p>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md">{response.message}</p>
                </div>
            )}
        </div>
        <div className="bg-gray-50 px-4 py-2 text-right">
             <p className="text-xs text-gray-500">
                Responded on: {format(new Date(response.createdAt), 'd-MMM-yyyy, HH:mm')}
            </p>
        </div>
    </div>
);

const NoResponsesWidget = () => (
    <div className="text-center py-12 px-6 bg-gray-100/70 rounded-lg border-2 border-dashed">
        <Inbox className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold text-gray-700">No Responses Yet</h3>
        <p className="mt-1 text-sm text-gray-500">Check back later for offers from interested companies.</p>
    </div>
);


// --- MAIN PAGE COMPONENT ---
export default function MyInquiryDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const [inquiry, setInquiry] = useState<InquiryDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const id = params.id as string;

    useEffect(() => {
        if (id) {
            const fetchInquiryDetails = async () => {
                setLoading(true);
                try {
                    const response = await fetch(`/api/company/inquiry/${id}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch inquiry details.');
                    }
                    const data = await response.json();
                    setInquiry(data);
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'An unknown error occurred.');
                } finally {
                    setLoading(false);
                }
            };
            fetchInquiryDetails();
        }
    }, [id]);

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><p>Loading details...</p></div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen"><p className="text-red-500">Error: {error}</p></div>;
    }

    if (!inquiry) {
        return <div className="flex justify-center items-center h-screen"><p>Inquiry not found.</p></div>;
    }

    const ShipmentIcon = inquiry.shipmentMode === 'AIR' ? Plane : inquiry.shipmentMode === 'LAND' ? Truck : Ship;

    return (
        <div className="bg-gray-50 min-h-screen">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                     <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
                        <ChevronLeft className="h-5 w-5" />
                        <span className="font-semibold">Back</span>
                    </button>
                    <h1 className="text-lg font-bold text-gray-800">My Inquiry Details</h1>
                    <div className="w-20"></div> {/* Spacer */}
                </div>
            </header>

            <main className="container mx-auto p-4 md:p-6 max-w-4xl">
                <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200/80 mb-8">
                     <h2 className="text-lg font-bold text-gray-800 p-4 border-b">Inquiry Details</h2>
                     <div className="py-4">
                        <DetailRow icon={MapPin} label="From" value={inquiry.from} />
                        <DetailRow icon={MapPin} label="To" value={inquiry.to} />
                        <DetailRow icon={ShipmentIcon} label="Shipment Mode" value={inquiry.shipmentMode} />
                        <DetailRow icon={ShoppingBag} label="Cargo Type" value={inquiry.cargoType} />
                        <DetailRow icon={ShoppingBag} label="Commodity" value={inquiry.commodity} />
                        <DetailRow icon={FileText} label="Remark" value={inquiry.remark} />
                        <DetailRow icon={Calendar} label="Date Created" value={format(new Date(inquiry.createdAt), 'd-MMM-yyyy')} />
                     </div>
                </div>

                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                        Responses ({inquiry.responses.length})
                    </h2>
                    {inquiry.responses.length === 0 ? (
                        <NoResponsesWidget />
                    ) : (
                        <div className="space-y-4">
                            {inquiry.responses.map(response => (
                                <ResponseCard key={response.id} response={response} />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
