'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { X, Trash2 } from 'lucide-react';

export default function AdminEditCompanyPage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // File Upload & Media States
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const [newMediaFiles, setNewMediaFiles] = useState<File[]>([]);
    const [newMediaPreviews, setNewMediaPreviews] = useState<string[]>([]);

    const [existingMedia, setExistingMedia] = useState<{ id: string; url: string }[]>([]);
    const [deletedMediaIds, setDeletedMediaIds] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        memberId: '',
        memberType: '',
        website: '',
        logoUrl: '',
        established: '',
        about: '',
        status: 'LIVE',
        isActive: true, // boolean
        isVerified: false, // boolean
        address: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
        directors: '',
        participationYears: '',
        scopeOfBusiness: '',
        servicesOffered: '',
        contactPerson: '',
        mobile: '',
        skype: '',
        wechat: '',
    });

    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/admin/companies/${id}`);
                if (!res.ok) throw new Error('Failed to fetch company');
                const data = await res.json();

                // Format existing date for input[type="date"] (yyyy-MM-dd)
                let formattedEstablished = '';
                if (data.established) {
                    formattedEstablished = new Date(data.established).toISOString().split('T')[0];
                }

                setFormData({
                    name: data.name || '',
                    memberId: data.memberId || '',
                    memberType: data.memberType || '',
                    website: data.website || '',
                    logoUrl: data.logoUrl || '',
                    established: formattedEstablished,
                    about: data.about || '',
                    status: data.status || 'LIVE',
                    isActive: data.isActive ?? true,
                    isVerified: data.isVerified ?? false,
                    address: data.location?.address || '',
                    city: data.location?.city || '',
                    state: data.location?.state || '',
                    country: data.location?.country || '',
                    zipCode: data.location?.zipCode || '',
                    directors: data.directors || '',
                    participationYears: data.participationYears || '',
                    scopeOfBusiness: data.scopeOfBusiness || '',
                    servicesOffered: data.servicesOffered || '',
                    contactPerson: data.location?.contactPerson || '',
                    mobile: data.location?.mobile || '',
                    skype: data.location?.skype || '',
                    wechat: data.location?.wechat || '',
                });

                if (data.media) {
                    setExistingMedia(data.media);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // S3 Upload Helper
    const uploadFileToS3 = async (fileToUpload: File) => {
        const params = new URLSearchParams({
            filename: fileToUpload.name,
            contentType: fileToUpload.type || "application/octet-stream",
            folder: "admin"
        });
        const presignResp = await fetch(`/api/upload-url?${params.toString()}`);
        if (!presignResp.ok) throw new Error(`Failed to get upload URL: ${presignResp.status}`);
        const data = await presignResp.json();
        if (data.post) {
            const fd = new FormData();
            Object.entries(data.post.fields).forEach(([k, v]) => fd.append(k, v as string));
            fd.append("file", fileToUpload);
            await fetch(data.post.url, { method: "POST", body: fd });
            return data.publicUrl;
        } else if (data.uploadUrl) {
            await fetch(data.uploadUrl, { method: "PUT", headers: { "Content-Type": fileToUpload.type }, body: fileToUpload });
            return data.publicUrl;
        }
        throw new Error("Invalid presign response");
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) {
            setLogoFile(f);
            setLogoPreview(URL.createObjectURL(f));
        }
    };

    const handleNewMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setNewMediaFiles(prev => [...prev, ...files]);
            setNewMediaPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
        }
    };

    const removeNewMedia = (index: number) => {
        setNewMediaFiles(prev => prev.filter((_, i) => i !== index));
        setNewMediaPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const markMediaForDeletion = (mediaId: string) => {
        setDeletedMediaIds(prev => [...prev, mediaId]);
        setExistingMedia(prev => prev.filter(m => m.id !== mediaId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            // 1. Upload new Logo if present
            let finalLogoUrl = formData.logoUrl;
            if (logoFile) {
                finalLogoUrl = await uploadFileToS3(logoFile);
            }

            // 2. Upload new Media if present
            const newMediaUrls: string[] = [];
            if (newMediaFiles.length > 0) {
                const promises = newMediaFiles.map(f => uploadFileToS3(f));
                const results = await Promise.all(promises);
                newMediaUrls.push(...results);
            }

            const payload = {
                ...formData,
                logoUrl: finalLogoUrl,
                location: {
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    country: formData.country,
                    zipCode: formData.zipCode,
                    contactPerson: formData.contactPerson,
                    mobile: formData.mobile,
                    skype: formData.skype,
                    wechat: formData.wechat,
                },
                newMedia: newMediaUrls,
                deleteMediaIds: deletedMediaIds
            };

            const res = await fetch(`/api/admin/companies/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error('Failed to update company');
            }

            router.push('/admin/company');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (error && !formData.name) return <div className="p-10 text-red-600">Error: {error}</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Edit Company: {formData.name}</h1>
                    <Link href="/admin/company" className="text-indigo-600 hover:underline">Cancel</Link>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Section 1: Basic Info */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 mb-4">Basic Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Member ID *</label>
                                <input
                                    type="text"
                                    name="memberId"
                                    required
                                    value={formData.memberId}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            {/* Member Type field hidden */}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                                <input
                                    type="url"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Established Date</label>
                                <input
                                    type="date"
                                    name="established"
                                    value={formData.established}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="LIVE">Live</option>
                                    <option value="BLOCKLISTED">Blocklisted</option>
                                    <option value="SUSPENDED">Suspended</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-6 pt-6">
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 text-indigo-600" />
                                    <span className="text-sm font-medium text-gray-700">Active</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" name="isVerified" checked={formData.isVerified} onChange={handleChange} className="h-4 w-4 text-indigo-600" />
                                    <span className="text-sm font-medium text-gray-700">Verified</span>
                                </label>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Directors</label>
                            <input
                                type="text"
                                name="directors"
                                value={formData.directors}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">IGLA Participation Years</label>
                            <input
                                type="text"
                                name="participationYears"
                                value={formData.participationYears}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Section: Scope & Services (NEW) */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 mb-4">Business Scope & Services</h2>
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Scope of Business & Certifications</label>
                                <textarea
                                    name="scopeOfBusiness"
                                    rows={4}
                                    placeholder="e.g. International Freighting (LCL/FCL/AIR), Warehouse, Marine Insurance..."
                                    value={formData.scopeOfBusiness}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Services Offered</label>
                                <textarea
                                    name="servicesOffered"
                                    rows={3}
                                    placeholder="List the services offered..."
                                    value={formData.servicesOffered}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Logo & Media */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 mb-4">Media</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                                <input type="file" accept="image/*" onChange={handleLogoChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                                <div className="mt-4">
                                    {(logoPreview || formData.logoUrl) && (
                                        <img src={logoPreview || formData.logoUrl} alt="Logo Preview" className="w-32 h-32 object-contain border rounded-lg bg-gray-50" />
                                    )}
                                    {!logoPreview && !formData.logoUrl && <div className="text-gray-400 italic">No logo</div>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Gallery / Documents</label>
                                <input type="file" multiple accept="image/*,application/pdf" onChange={handleNewMediaChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />

                                {/* Existing Media */}
                                {existingMedia.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Existing Media</h4>
                                        <div className="grid grid-cols-3 gap-2">
                                            {existingMedia.map((m) => (
                                                <div key={m.id} className="relative group">
                                                    <img src={m.url} alt="Existing" className="w-full h-20 object-cover rounded-md border" />
                                                    <button
                                                        type="button"
                                                        onClick={() => markMediaForDeletion(m.id)}
                                                        className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* New Uploads Preview */}
                                {newMediaPreviews.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">New Uploads</h4>
                                        <div className="grid grid-cols-3 gap-2">
                                            {newMediaPreviews.map((src, idx) => (
                                                <div key={idx} className="relative group">
                                                    <img src={src} alt={`Preview ${idx}`} className="w-full h-20 object-cover rounded-md border" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeNewMedia(idx)}
                                                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Contact & Location */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 mb-4">Contact & Location</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                                <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile / WhatsApp</label>
                                <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Skype / Teams</label>
                                <input type="text" name="skype" value={formData.skype} onChange={handleChange} className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">WeChat</label>
                                <input type="text" name="wechat" value={formData.wechat} onChange={handleChange} className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                <input
                                    type="text"
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                                <input
                                    type="text"
                                    name="zipCode"
                                    value={formData.zipCode}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">About</label>
                        <textarea
                            name="about"
                            rows={4}
                            value={formData.about}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div className="flex justify-end pt-6">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {submitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
