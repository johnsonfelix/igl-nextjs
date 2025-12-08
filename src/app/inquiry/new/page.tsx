'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import CityAutocompleteField from '@/app/components/CityAutocompleteField';
import {
    AlertTriangle, CheckCircle, Send, Package, Anchor, Plane, Truck, Calendar, User, Mail, Phone, Hash, FileText, Receipt
} from 'lucide-react';

// --- Type Definition for FormInput props ---
type FormInputProps = {
    label: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    icon: React.ElementType;
    required?: boolean;
    [key: string]: any; // To allow other props like 'type', 'placeholder'
};


// --- Reusable Form Input Component ---
const FormInput = ({ label, value, onChange, icon: Icon, required = false, ...props }: FormInputProps) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-[#5da765]">*</span>}
        </label>
        <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Icon className="h-5 w-5 text-gray-400" />
            </div>
            <input value={value} onChange={onChange} className="w-full p-2 pl-10 border border-gray-300 rounded-md" required={required} {...props} />
        </div>
    </div>
);


// --- Main Page Component ---
export default function NewInquiryPage() {
    const router = useRouter();
    const { user } = useAuth();

    // Form state - Expanded to match your API
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [commodity, setCommodity] = useState('');
    const [shipmentMode, setShipmentMode] = useState('AIR');
    const [cargoType, setCargoType] = useState('');
    const [weight, setWeight] = useState('');
    const [volume, setVolume] = useState('');
    const [cargoReadyDate, setCargoReadyDate] = useState('');
    const [freightTerm, setFreightTerm] = useState('');
    const [incoterms, setIncoterms] = useState('');
    const [remark, setRemark] = useState('');
    const [dimensions, setDimensions] = useState('');
    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');

    // Pre-fill contact info from user context if available
    useEffect(() => {
        if (user) {
            setContactName(user.name || '');
            setContactEmail(user.email || '');
        }
    }, [user]);

    // Submission status
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!user?.companyId) {
            setError("Authentication error: Company ID is missing.");
            return;
        }
        if (!from || !to || !commodity || !contactEmail) {
            setError("Please fill in all required fields: From, To, Commodity, and Contact Email.");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        const inquiryData = {
            companyId: user.companyId,
            from,
            to,
            commodity,
            shipmentMode,
            cargoType,
            weight: weight ? parseFloat(weight) : null,
            volume: volume ? parseFloat(volume) : null,
            cargoReadyTime: cargoReadyDate ? new Date(cargoReadyDate).toISOString() : null,
            freightTerm,
            incoterms,
            remark,
            dimensions,
            contactName,
            contactEmail,
            contactPhone,
        };

        try {
            const response = await fetch('/api/company/inquiry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inquiryData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "An unknown error occurred.");
            }

            setSuccess("Inquiry submitted successfully! Redirecting...");
            setTimeout(() => router.push('/inquiry'), 2000);

        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to submit inquiry.");
        } finally {
            setLoading(false);
        }
    };

    const sectionHeader = (title: string) => (
        <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4 border-b pb-2">{title}</h2>
    );

    return (
        <div className="bg-gray-50 min-h-screen">
            <header className="bg-white shadow-sm sticky top-0 z-20">
                <div className="container mx-auto px-4 h-16 flex items-center">
                    <h1 className="text-xl font-bold text-gray-800">Submit a New Inquiry</h1>
                </div>
            </header>
            <main className="container mx-auto p-4 md:p-8">
                <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-xl shadow-md border border-gray-200/80">
                    {sectionHeader("Shipment Details")}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <CityAutocompleteField label="From" value={from} onChange={setFrom} />
                        <CityAutocompleteField label="To" value={to} onChange={setTo} />
                        <FormInput label="Commodity" value={commodity} onChange={(e: ChangeEvent<HTMLInputElement>) => setCommodity(e.target.value)} icon={Package} required />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Shipment Mode</label>
                            <select value={shipmentMode} onChange={(e: ChangeEvent<HTMLSelectElement>) => setShipmentMode(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white">
                                <option value="AIR">AIR</option>
                                <option value="SEA">SEA</option>
                                <option value="LAND">LAND</option>
                            </select>
                        </div>
                        <FormInput label="Cargo Type" value={cargoType} onChange={(e: ChangeEvent<HTMLInputElement>) => setCargoType(e.target.value)} placeholder="e.g., General, Reefer" icon={Package} />
                        <FormInput label="Cargo Ready Date" value={cargoReadyDate} onChange={(e: ChangeEvent<HTMLInputElement>) => setCargoReadyDate(e.target.value)} type="date" icon={Calendar} />
                        <FormInput label="Total Weight (kg)" value={weight} onChange={(e: ChangeEvent<HTMLInputElement>) => setWeight(e.target.value)} type="number" icon={Hash} />
                        <FormInput label="Total Volume (cbm)" value={volume} onChange={(e: ChangeEvent<HTMLInputElement>) => setVolume(e.target.value)} type="number" icon={Hash} />
                    </div>

                    {sectionHeader("Additional Details")}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormInput label="Freight Term" value={freightTerm} onChange={(e: ChangeEvent<HTMLInputElement>) => setFreightTerm(e.target.value)} placeholder="e.g., Prepaid, Collect" icon={Receipt} />
                        <FormInput label="Incoterms" value={incoterms} onChange={(e: ChangeEvent<HTMLInputElement>) => setIncoterms(e.target.value)} placeholder="e.g., FOB, EXW" icon={FileText} />
                        <FormInput label="Dimensions" value={dimensions} onChange={(e: ChangeEvent<HTMLInputElement>) => setDimensions(e.target.value)} placeholder="e.g., 120x80x100 cm" icon={Hash} />
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                            <textarea value={remark} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setRemark(e.target.value)} rows={3} className="w-full p-2 border border-gray-300 rounded-md"></textarea>
                        </div>
                    </div>

                    {sectionHeader("Contact Information")}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormInput label="Contact Name" value={contactName} onChange={(e: ChangeEvent<HTMLInputElement>) => setContactName(e.target.value)} icon={User} />
                        <FormInput label="Contact Email" value={contactEmail} onChange={(e: ChangeEvent<HTMLInputElement>) => setContactEmail(e.target.value)} type="email" icon={Mail} required />
                        <FormInput label="Contact Phone" value={contactPhone} onChange={(e: ChangeEvent<HTMLInputElement>) => setContactPhone(e.target.value)} type="tel" icon={Phone} />
                    </div>

                    <div className="mt-8">
                        {error && <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-center gap-2 mb-4"><AlertTriangle />{error}</div>}
                        {success && <div className="bg-green-50 text-green-700 p-3 rounded-md flex items-center gap-2 mb-4"><CheckCircle />{success}</div>}
                        <button type="submit" disabled={loading || !!success} className="w-full flex justify-center items-center gap-2 bg-[#5da765] text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-[#4a8a52] disabled:bg-gray-400 transition-all">
                            <Send className="h-5 w-5" />
                            {loading ? "Submitting..." : "Submit Inquiry"}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
