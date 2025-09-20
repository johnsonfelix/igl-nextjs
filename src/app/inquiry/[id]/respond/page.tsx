'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { MessageSquare, DollarSign, Link as LinkIcon, FileText, Send, ChevronLeft, CheckCircle, AlertTriangle } from 'lucide-react';

// --- UI COMPONENTS ---

// Replicates the input fields from your Flutter form
const FormInput = ({ id, label, value, onChange, type = 'text', placeholder, icon: Icon, required = false }: any) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Icon className="h-5 w-5 text-gray-400" />
            </div>
            <input
                id={id}
                name={id}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full rounded-md border-gray-300 py-2 pl-10 pr-3 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                required={required}
            />
        </div>
    </div>
);

const FormTextarea = ({ id, label, value, onChange, placeholder, icon: Icon, required = false, rows = 3 }: any) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
             <div className="pointer-events-none absolute top-3 left-0 flex items-center pl-3">
                <Icon className="h-5 w-5 text-gray-400" />
            </div>
            <textarea
                id={id}
                name={id}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={rows}
                className="w-full rounded-md border-gray-300 py-2 pl-10 pr-3 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                required={required}
            />
        </div>
    </div>
);

// --- MAIN PAGE COMPONENT ---
export default function InquiryResponsePage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();

    const [message, setMessage] = useState('');
    const [offerPrice, setOfferPrice] = useState('');
    const [attachment, setAttachment] = useState('');
    const [terms, setTerms] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message) {
            setError('The message/offer details field is required.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        const inquiryId = params.id as string;
        const responderId = user?.companyId;

        if (!responderId) {
            setError('You must be logged in to respond.');
            setLoading(false);
            return;
        }

        const body = {
            inquiryId,
            responderId,
            message,
            offerPrice: offerPrice ? parseFloat(offerPrice) : null,
            attachment: attachment || null,
            terms: terms || null,
        };

        try {
            const response = await fetch('/api/company/inquiry/response', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit response.');
            }

            setSuccess('Your response has been sent successfully!');
            // Clear form
            setMessage('');
            setOfferPrice('');
            setAttachment('');
            setTerms('');
            
            // Redirect back to the inquiry list after a delay
            setTimeout(() => {
                router.push('/inquiry'); 
            }, 2000);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
             <header className="bg-white shadow-sm">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                         <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
                            <ChevronLeft className="h-5 w-5" />
                            <span className="font-semibold">Back</span>
                        </button>
                        <h1 className="text-lg font-bold text-gray-800">Respond to Inquiry</h1>
                        <div className="w-20"></div> {/* Spacer */}
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-4 md:p-6 max-w-2xl">
                <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-xl shadow-md border border-gray-200/80 space-y-6">
                    <h2 className="text-xl font-bold text-gray-800">Your Offer</h2>
                    
                    <FormTextarea
                        id="message"
                        label="Message / Offer Details"
                        value={message}
                        onChange={(e:any) => setMessage(e.target.value)}
                        icon={MessageSquare}
                        required
                    />

                    <FormInput
                        id="offerPrice"
                        label="Offer Price (Optional)"
                        type="number"
                        value={offerPrice}
                        onChange={(e:any) => setOfferPrice(e.target.value)}
                        placeholder="e.g., 1500.00"
                        icon={DollarSign}
                    />

                    <FormInput
                        id="attachment"
                        label="Attachment URL (Optional)"
                        type="url"
                        value={attachment}
                        onChange={(e:any) => setAttachment(e.target.value)}
                        placeholder="https://..."
                        icon={LinkIcon}
                    />
                    
                    <FormTextarea
                        id="terms"
                        label="Terms & Other Details (Optional)"
                        value={terms}
                        onChange={(e:any) => setTerms(e.target.value)}
                        icon={FileText}
                    />
                    
                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-center gap-2">
                           <AlertTriangle className="h-5 w-5" /> {error}
                        </div>
                    )}
                    {success && (
                         <div className="bg-green-50 text-green-700 p-3 rounded-md flex items-center gap-2">
                           <CheckCircle className="h-5 w-5" /> {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !!success}
                        className="w-full flex justify-center items-center gap-2 bg-orange-500 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                    >
                        <Send className="h-5 w-5" />
                        {loading ? 'Submitting...' : 'Send Response'}
                    </button>
                </form>
            </main>
        </div>
    );
}
