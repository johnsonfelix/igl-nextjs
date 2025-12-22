'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { MessageSquare, DollarSign, Link as LinkIcon, FileText, Send, ChevronLeft, CheckCircle, AlertTriangle, UploadCloud, Loader2, X } from 'lucide-react';

// --- UI COMPONENTS ---

// Replicates the input fields from your Flutter form
const FormInput = ({ id, label, value, onChange, type = 'text', placeholder, icon: Icon, required = false }: any) => (
    <div className="group">
        <label htmlFor={id} className="block text-sm font-bold text-gray-700 mb-2 group-focus-within:text-[#004aad] transition-colors">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Icon className="h-5 w-5 text-gray-400 group-focus-within:text-[#004aad] transition-colors" />
            </div>
            <input
                id={id}
                name={id}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full rounded-xl border-gray-200 bg-gray-50 py-3 pl-12 pr-4 text-gray-800 placeholder:text-gray-400 shadow-sm focus:border-[#004aad] focus:ring-[#004aad] focus:bg-white transition-all text-sm font-medium"
                required={required}
            />
        </div>
    </div>
);

const FormTextarea = ({ id, label, value, onChange, placeholder, icon: Icon, required = false, rows = 4 }: any) => (
    <div className="group">
        <label htmlFor={id} className="block text-sm font-bold text-gray-700 mb-2 group-focus-within:text-[#004aad] transition-colors">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            <div className="pointer-events-none absolute top-4 left-0 flex items-center pl-4">
                <Icon className="h-5 w-5 text-gray-400 group-focus-within:text-[#004aad] transition-colors" />
            </div>
            <textarea
                id={id}
                name={id}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={rows}
                className="w-full rounded-xl border-gray-200 bg-gray-50 py-3 pl-12 pr-4 text-gray-800 placeholder:text-gray-400 shadow-sm focus:border-[#004aad] focus:ring-[#004aad] focus:bg-white transition-all text-sm font-medium resize-none"
                required={required}
            />
        </div>

    </div>
);

const FormFileUpload = ({ id, label, value, onChange, required = false }: any) => {
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadError(null);

        try {
            // 1. Get presigned URL
            const res = await fetch(`/api/upload-url?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}&folder=misc`);
            if (!res.ok) throw new Error('Failed to get upload URL');
            const { post, publicUrl } = await res.json();

            // 2. Upload to S3
            const formData = new FormData();
            Object.entries(post.fields).forEach(([k, v]) => formData.append(k, v as string));
            formData.append('file', file);

            const uploadRes = await fetch(post.url, {
                method: 'POST',
                body: formData,
            });

            if (!uploadRes.ok) throw new Error('Upload failed');

            // 3. Update parent state with public URL
            onChange({ target: { name: id, value: publicUrl } });

        } catch (err) {
            console.error(err);
            setUploadError('Failed to upload file.');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const clearFile = () => {
        onChange({ target: { name: id, value: '' } });
    };

    return (
        <div className="group">
            <label htmlFor={id} className="block text-sm font-bold text-gray-700 mb-2 group-focus-within:text-[#004aad] transition-colors">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                {!value ? (
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                            {uploading ? (
                                <Loader2 className="h-5 w-5 text-[#004aad] animate-spin" />
                            ) : (
                                <UploadCloud className="h-5 w-5 text-gray-400 group-focus-within:text-[#004aad] transition-colors" />
                            )}
                        </div>
                        <input
                            type="file"
                            id={id}
                            onChange={handleFileChange}
                            disabled={uploading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className={`w-full rounded-xl border-gray-200 bg-gray-50 py-3 pl-12 pr-4 text-sm font-medium shadow-sm transition-all flex items-center ${uploadError ? 'text-red-500 border-red-300' : 'text-gray-400 border'}`}>
                            {uploadError ? uploadError : (uploading ? "Uploading..." : "Click to upload file")}
                        </div>
                    </div>
                ) : (
                    <div className="w-full rounded-xl border border-blue-200 bg-blue-50 py-3 pl-4 pr-12 text-gray-800 shadow-sm flex items-center gap-3 relative h-[46px]">
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-[#004aad] shrink-0" />
                            <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-[#004aad] hover:underline truncate">
                                View Attachment
                            </a>
                        </div>
                        <button
                            type="button"
                            onClick={clearFile}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

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
        <div className="bg-[#f8f9fa] min-h-screen font-sans pb-20">
            <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-30 border-b border-gray-100">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-[#004aad] transition-colors py-2 group">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#004aad]/10 group-hover:text-[#004aad] transition-colors">
                                <ChevronLeft className="h-5 w-5" />
                            </div>
                            <span className="font-bold text-sm">Cancel</span>
                        </button>
                        <h1 className="text-lg font-bold text-gray-800">Submit Quote</h1>
                        <div className="w-20"></div> {/* Spacer */}
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-4 md:p-8 max-w-3xl">
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#004aad]">
                        <Send className="h-8 w-8 ml-1" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Send Your Proposal</h2>
                    <p className="text-gray-500 max-w-md mx-auto">Provide detailed information about your service and pricing to stand out to the shipper.</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-10 rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100">
                    <div className="space-y-6">
                        <FormTextarea
                            id="message"
                            label="Message / Offer Details"
                            value={message}
                            onChange={(e: any) => setMessage(e.target.value)}
                            icon={MessageSquare}
                            required
                            placeholder="Describe your service, schedule, and any specific terms..."
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormInput
                                id="offerPrice"
                                label="Offer Price (USD)"
                                type="number"
                                value={offerPrice}
                                onChange={(e: any) => setOfferPrice(e.target.value)}
                                placeholder="0.00"
                                icon={DollarSign}
                            />

                            <FormFileUpload
                                id="attachment"
                                label="Attachment"
                                value={attachment}
                                onChange={(e: any) => setAttachment(e.target.value)}
                            />
                        </div>

                        <FormTextarea
                            id="terms"
                            label="Terms & Conditions"
                            value={terms}
                            onChange={(e: any) => setTerms(e.target.value)}
                            icon={FileText}
                            placeholder="Any specific payment terms or validity periods..."
                            rows={3}
                        />
                    </div>

                    {error && (
                        <div className="mt-6 bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100">
                            <AlertTriangle className="h-5 w-5 shrink-0" />
                            <span className="font-medium text-sm">{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="mt-6 bg-[#004aad]/10 text-[#004aad] p-4 rounded-xl flex items-center gap-3 border border-blue-100">
                            <CheckCircle className="h-5 w-5 shrink-0" />
                            <span className="font-bold text-sm">{success}</span>
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <button
                            type="submit"
                            disabled={loading || !!success}
                            className="w-full flex justify-center items-center gap-2 bg-[#004aad] text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl hover:translate-y-[-2px] focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 transition-all text-lg"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Sending...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="h-5 w-5" />
                                    <span>Submit Proposal</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
