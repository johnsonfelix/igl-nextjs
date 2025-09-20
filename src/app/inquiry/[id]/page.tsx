'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
    Send,
    Building,
    User,
    Mail,
    Phone
} from 'lucide-react';

// --- TYPE DEFINITIONS (Matching your API's include structure) ---

type Company = {
    id: string;
    name: string;
    contactPerson: string | null;
    contactEmail: string;
    contactPhone: string | null;
};

type InquiryResponse = {
    id: string;
    responder: Company;
    // Add other response fields like 'rate', 'notes', etc., as needed
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
    company: Company; // The company that posted the inquiry
    responses: InquiryResponse[]; // List of responses
};

// --- UI COMPONENTS ---

const RouteSection = ({ from, to }: { from: string; to: string }) => (
    <div className="flex items-start p-6">
        <div className="flex flex-col items-center mr-4">
            <MapPin className="text-orange-500 h-6 w-6" />
            <div className="w-px h-12 my-2 border-l-2 border-dotted border-gray-300"></div>
            <MapPin className="text-blue-500 h-6 w-6" />
        </div>
        <div className="flex flex-col justify-between pt-1">
            <div>
                <p className="text-sm text-gray-500">From</p>
                <p className="text-lg font-bold text-gray-800">{from}</p>
            </div>
            <div className="mt-4">
                <p className="text-sm text-gray-500">To</p>
                <p className="text-lg font-bold text-gray-800">{to}</p>
            </div>
        </div>
    </div>
);

const DetailRow = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | null }) => {
    if (!value) return null;
    return (
        <div className="flex items-start py-3">
            <Icon className="h-5 w-5 text-gray-400 mt-1 mr-4" />
            <div className="flex-grow">
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <p className="text-base text-gray-800">{value}</p>
            </div>
        </div>
    );
};

// NEW: Component to display the inquiring company's details
const InquiringCompanyCard = ({ company }: { company: Company }) => (
    <div className="mt-6">
        <h2 className="text-xl font-bold text-gray-800 mb-3">Posted By</h2>
        <div className="bg-white p-5 rounded-lg border border-gray-200">
            <div className="flex items-center mb-4">
                <Building className="h-6 w-6 text-orange-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
            </div>
            <div className="space-y-3 text-sm">
                {company.contactPerson && <div className="flex items-center text-gray-600"><User className="h-4 w-4 mr-2" /> {company.contactPerson}</div>}
                <div className="flex items-center text-gray-600"><Mail className="h-4 w-4 mr-2" /> {company.contactEmail}</div>
                {company.contactPhone && <div className="flex items-center text-gray-600"><Phone className="h-4 w-4 mr-2" /> {company.contactPhone}</div>}
            </div>
        </div>
    </div>
);

// NEW: Component to display the list of responses
const ResponseList = ({ responses }: { responses: InquiryResponse[] }) => {
    if (responses.length === 0) {
        return (
            <div className="text-center py-8 px-4 bg-gray-100 rounded-lg mt-6">
                <p className="text-gray-600">No responses have been submitted yet.</p>
            </div>
        );
    }

    return (
        <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-800 mb-3">Responses ({responses.length})</h2>
            <div className="space-y-4">
                {responses.map(response => (
                    <div key={response.id} className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-gray-800">{response.responder.name}</p>
                            <p className="text-sm text-gray-500">{response.responder.contactEmail}</p>
                        </div>
                        {/* You can add a button to view the full response details */}
                        <button className="text-orange-600 font-semibold text-sm hover:underline">
                            View Quote
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- HELPER FUNCTIONS ---
const getShipmentIcon = (mode: string) => {
    if (mode === 'AIR') return Plane;
    if (mode === 'SEA') return Ship;
    if (mode === 'LAND') return Truck;
    return Ship;
};

// --- MAIN PAGE COMPONENT ---
export default function InquiryDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth(); // Assuming useAuth() provides { companyId: string, ... }
    const [inquiry, setInquiry] = useState<InquiryDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const id = params.id as string;

    useEffect(() => {
        if (id) {
            const fetchInquiryDetails = async () => {
                setLoading(true);
                try {
                    // Fetch from your existing API endpoint
                    const response = await fetch(`/api/company/inquiry/${id}`);
                    if (!response.ok) {
                        const errData = await response.json();
                        throw new Error(errData.error || 'Failed to fetch inquiry details.');
                    }
                    // ADJUSTMENT: The API returns the inquiry object directly
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

    // Memoized values to control UI logic for responding
    const isOwner = useMemo(() => user?.companyId === inquiry?.company.id, [user, inquiry]);
    const hasResponded = useMemo(() => 
        inquiry?.responses.some(res => res.responder.id === user?.companyId), 
        [user, inquiry]
    );

    if (loading) {
        return <div className="text-center p-10">Loading inquiry details...</div>;
    }

    if (error) {
        return <div className="text-center p-10 text-red-500">Error: {error}</div>;
    }

    if (!inquiry) {
        return <div className="text-center p-10">Inquiry not found.</div>;
    }

    const ShipmentIcon = getShipmentIcon(inquiry.shipmentMode);

    return (
        <div className="bg-gray-50 min-h-screen pb-24">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                         <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
                            <ChevronLeft className="h-5 w-5" />
                            <span className="font-semibold">Back</span>
                        </button>
                        <h1 className="text-lg font-bold text-gray-800 truncate px-2">Inquiry Details</h1>
                        <div className="w-20"></div> {/* Spacer */}
                    </div>
                </div>
            </header>
            
            <main className="container mx-auto p-4 md:p-6 max-w-4xl">
                <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200/80">
                    <RouteSection from={inquiry.from} to={inquiry.to} />
                    <hr className="mx-6" />
                    <div className="p-6">
                        <DetailRow icon={ShipmentIcon} label="Shipment Mode" value={inquiry.shipmentMode} />
                        <DetailRow icon={ShoppingBag} label="Cargo Type" value={inquiry.cargoType} />
                        <DetailRow icon={ShoppingBag} label="Commodity" value={inquiry.commodity} />
                        <DetailRow icon={FileText} label="Remark" value={inquiry.remark} />
                        <DetailRow icon={Calendar} label="Date Created" value={format(new Date(inquiry.createdAt), 'd-MMM-yyyy')} />
                    </div>
                </div>

                {/* Show the company that posted if the user is NOT the owner */}
                {!isOwner && <InquiringCompanyCard company={inquiry.company} />}

                {/* Show responses ONLY if the user IS the owner */}
                {isOwner && <ResponseList responses={inquiry.responses} />}
            </main>

            {/* Smart Floating Action Button */}
            {user && !isOwner && !hasResponded && (
                <Link 
                    href={`/inquiry/${inquiry.id}/respond`} 
                    className="fixed bottom-8 right-8 bg-orange-500 text-white rounded-full shadow-lg p-4 hover:bg-orange-600 transition-transform hover:scale-105 flex items-center gap-2 z-20"
                >
                    <Send className="h-5 w-5" />
                    <span className="font-semibold hidden sm:inline">Respond</span>
                </Link>
            )}
        </div>
    );
}
