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

// --- UI COMPONENTS ---

const RouteSection = ({ from, to }: { from: string; to: string }) => (
    <div className="flex items-center p-8 bg-gradient-to-r from-gray-50 to-white rounded-xl mb-6 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#5da765]"></div>
        <div className="flex flex-col items-center mr-8 z-10">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-[#5da765] shadow-sm mb-1">
                <MapPin className="h-5 w-5" />
            </div>
            <div className="w-0.5 h-12 my-1 bg-gray-200 dashed-line"></div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm mt-1">
                <MapPin className="h-5 w-5" />
            </div>
        </div>
        <div className="flex flex-col h-full justify-between py-1 z-10 w-full">
            <div className="mb-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Origin</p>
                <p className="text-2xl font-bold text-gray-800 break-words">{from}</p>
            </div>
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Destination</p>
                <p className="text-2xl font-bold text-gray-800 break-words">{to}</p>
            </div>
        </div>

        {/* Decorative background element */}
        <div className="absolute right-[-20px] top-[-20px] text-gray-100 opacity-50">
            <MapPin className="h-64 w-64 rotate-12" />
        </div>
    </div>
);

const DetailRow = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | null }) => {
    if (!value) return null;
    return (
        <div className="flex items-center py-4 border-b border-gray-50 last:border-0 group hover:bg-gray-50/50 transition-colors px-4 -mx-4 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-[#5da765] group-hover:bg-green-50 transition-colors mr-4 shrink-0">
                <Icon className="h-5 w-5" />
            </div>
            <div className="flex-grow">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                <p className="text-base font-medium text-gray-800">{value}</p>
            </div>
        </div>
    );
};

// NEW: Component to display the inquiring company's details
const InquiringCompanyCard = ({ company }: { company: Company }) => (
    <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-[#5da765] rounded-full"></span>
            Posted By
        </h2>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 mr-4">
                    <Building className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">{company.name}</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Company Details</p>
                </div>
            </div>
            <div className="space-y-4">
                {company.contactPerson && (
                    <div className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-lg">
                        <User className="h-5 w-5 mr-3 text-gray-400" />
                        <span className="font-medium">{company.contactPerson}</span>
                    </div>
                )}
                <div className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-lg">
                    <Mail className="h-5 w-5 mr-3 text-gray-400" />
                    <span className="font-medium break-all">{company.contactEmail}</span>
                </div>
                {company.contactPhone && (
                    <div className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-lg">
                        <Phone className="h-5 w-5 mr-3 text-gray-400" />
                        <span className="font-medium">{company.contactPhone}</span>
                    </div>
                )}
            </div>
        </div>
    </div>
);

// NEW: Component to display the list of responses
const ResponseList = ({ responses }: { responses: InquiryResponse[] }) => {
    if (responses.length === 0) {
        return (
            <div className="text-center py-12 px-6 bg-white rounded-xl border border-dashed border-gray-200 mt-8">
                <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <Mail className="h-8 w-8 opacity-50" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">No responses yet</h3>
                <p className="text-gray-500 text-sm">Waiting for companies to submit their quotes.</p>
            </div>
        );
    }

    return (
        <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#5da765] rounded-full"></span>
                Responses <span className="text-gray-400 font-normal text-lg">({responses.length})</span>
            </h2>
            <div className="space-y-4">
                {responses.map(response => (
                    <div key={response.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#5da765]/10 flex items-center justify-center text-[#5da765] shrink-0 mt-1">
                                <Building className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 text-lg group-hover:text-[#5da765] transition-colors">{response.responder.name}</p>
                                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                    <Mail className="h-3 w-3" /> {response.responder.contactEmail}
                                </p>
                            </div>
                        </div>
                        <button className="text-[#5da765] font-bold text-sm bg-green-50 px-4 py-2 rounded-lg hover:bg-[#5da765] hover:text-white transition-all flex items-center gap-2 w-fit">
                            View Quote <ChevronLeft className="h-4 w-4 rotate-180" />
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
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-[#5da765] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading inquiry details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border-t-4 border-red-500">
                    <p className="text-red-500 font-bold text-lg mb-2">Error</p>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button onClick={() => router.back()} className="text-sm font-bold text-gray-500 hover:text-gray-800 underline">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!inquiry) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-300">Inquiry not found</h2>
                    <button onClick={() => router.back()} className="mt-4 text-[#5da765] font-bold hover:underline">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const ShipmentIcon = getShipmentIcon(inquiry.shipmentMode);

    return (
        <div className="bg-[#f8f9fa] min-h-screen pb-24 font-sans">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-30 border-b border-gray-100">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-[#5da765] transition-colors py-2 group">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#5da765]/10 group-hover:text-[#5da765] transition-colors">
                                <ChevronLeft className="h-5 w-5" />
                            </div>
                            <span className="font-bold text-sm">Back</span>
                        </button>
                        <h1 className="text-lg font-bold text-gray-800 truncate px-2 hidden md:block">Inquiry Details</h1>
                        <div className="w-20"></div> {/* Spacer */}
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-4 md:p-8 max-w-5xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Info */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                            <div className="h-2 bg-[#5da765]"></div>
                            <div className="p-6 md:p-8">
                                <RouteSection from={inquiry.from} to={inquiry.to} />

                                <div className="mt-8">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Shipment Specifications</h3>
                                    <div className="grid grid-cols-1 gap-y-2">
                                        <DetailRow icon={ShipmentIcon} label="Shipment Mode" value={inquiry.shipmentMode} />
                                        <DetailRow icon={ShoppingBag} label="Cargo Type" value={inquiry.cargoType} />
                                        <DetailRow icon={ShoppingBag} label="Commodity" value={inquiry.commodity} />
                                        <DetailRow icon={FileText} label="Remark" value={inquiry.remark} />
                                        <DetailRow icon={Calendar} label="Date Created" value={format(new Date(inquiry.createdAt), 'MMMM d, yyyy')} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Responses Section (Owner Only) */}
                        {isOwner && <ResponseList responses={inquiry.responses} />}
                    </div>

                    {/* Sidebar / Company Info */}
                    <div className="lg:col-span-1">
                        {/* Status Card or Actions could go here */}
                        <div className="bg-[#5da765] text-white p-6 rounded-2xl shadow-lg mb-6 relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-green-100 text-sm font-medium mb-1">Status</p>
                                <p className="text-2xl font-bold flex items-center gap-2">
                                    {hasResponded ? 'Responded' : 'Active Inquiry'}
                                </p>
                                <p className="text-green-100 text-xs mt-2 opacity-80">
                                    ID: {inquiry.id.substring(0, 8)}...
                                </p>
                            </div>
                            <div className="absolute right-[-20px] bottom-[-40px] opacity-20">
                                <Ship className="w-32 h-32" />
                            </div>
                        </div>

                        {/* Show the company that posted if the user is NOT the owner */}
                        {!isOwner && <InquiringCompanyCard company={inquiry.company} />}

                        {isOwner && (
                            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                <h3 className="font-bold text-gray-800 mb-2">Manage Inquiry</h3>
                                <p className="text-sm text-gray-500 mb-4">You can manage this inquiry or close it if you have found a provider.</p>
                                <button className="w-full border-2 border-gray-200 text-gray-600 font-bold py-2 rounded-lg hover:border-red-500 hover:text-red-500 transition-colors">
                                    Close Inquiry
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Action Button */}
                {user && !isOwner && !hasResponded && (
                    <div className="mt-8 flex justify-end">
                        <Link
                            href={`/inquiry/${inquiry.id}/respond`}
                            className="bg-[#5da765] hover:bg-[#4a8a52] text-white text-lg px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-3"
                        >
                            <span>Send Quote Now</span>
                            <Send className="h-5 w-5" />
                        </Link>
                    </div>
                )}
            </main>


        </div>
    );
}
