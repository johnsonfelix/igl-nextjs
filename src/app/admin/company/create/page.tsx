'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { X } from 'lucide-react';

export default function AdminCreateCompanyPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // File Upload States
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        memberId: '',
        memberType: '',
        website: '',
        established: '',
        about: '',
        status: 'LIVE',
        address: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
        // New fields
        directors: '',
        participationYears: '', // Comma separated or free text
        scopeOfBusiness: '',
        servicesOffered: '',
        contactPerson: '',
        designation: '', // New field for contact person designation
        email: '', // New field for contact person email (maps to Location.email)
        mobile: '',
        skype: '',
        wechat: '',
    });

    useEffect(() => {
        // Auto-populate Member ID if empty
        if (!formData.memberId) {
            const randomNum = Math.floor(10000 + Math.random() * 90000); // 5 digit number
            setFormData(prev => ({ ...prev, memberId: `IGLA${randomNum}` }));
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // S3 Upload Helper (Reused from sponsors)
    const uploadFileToS3 = async (fileToUpload: File) => {
        const params = new URLSearchParams({
            filename: fileToUpload.name,
            contentType: fileToUpload.type || "application/octet-stream",
            folder: "admin" // or 'company-logos' if backend allows
        });

        // 1) Request presign info
        const presignResp = await fetch(`/api/upload-url?${params.toString()}`);
        if (!presignResp.ok) throw new Error(`Failed to get upload URL: ${presignResp.status}`);
        const data = await presignResp.json();

        // 2) PUT or POST
        if (data.post) {
            const fd = new FormData();
            Object.entries(data.post.fields).forEach(([k, v]) => fd.append(k, v as string));
            fd.append("file", fileToUpload);
            const uploadResp = await fetch(data.post.url, { method: "POST", body: fd });
            if (!uploadResp.ok) throw new Error("S3 POST upload failed");
            return data.publicUrl;
        } else if (data.uploadUrl) {
            await fetch(data.uploadUrl, {
                method: "PUT",
                headers: { "Content-Type": fileToUpload.type },
                body: fileToUpload,
            });
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

    const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setMediaFiles(prev => [...prev, ...files]);
            // Create previews
            const newPreviews = files.map(f => URL.createObjectURL(f));
            setMediaPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeMedia = (index: number) => {
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
        setMediaPreviews(prev => prev.filter((_, i) => i !== index));
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setUploading(true);
        setError(null);

        try {
            // 1. Upload Logo if exists
            let finalLogoUrl = '';
            if (logoFile) {
                finalLogoUrl = await uploadFileToS3(logoFile);
            }

            // 2. Upload Media if exists
            const uploadedMediaUrls: string[] = [];
            if (mediaFiles.length > 0) {
                // Upload in parallel
                const promises = mediaFiles.map(f => uploadFileToS3(f));
                const results = await Promise.all(promises);
                uploadedMediaUrls.push(...results);
            }

            // 3. Submit Data
            const payload = {
                name: formData.name,
                memberId: formData.memberId,
                memberType: formData.memberType,
                website: formData.website,
                logoUrl: finalLogoUrl,
                established: formData.established,
                about: formData.about,
                status: formData.status,
                directors: formData.directors,
                participationYears: formData.participationYears,
                location: {
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    country: formData.country,
                    zipCode: formData.zipCode,
                    contactPerson: formData.contactPerson,
                    designation: formData.designation,
                    email: formData.email,
                    mobile: formData.mobile,
                    skype: formData.skype,
                    wechat: formData.wechat,
                },
                scopeOfBusiness: formData.scopeOfBusiness,
                servicesOffered: formData.servicesOffered,
                media: uploadedMediaUrls // Send array of URLs
            };

            const res = await fetch('/api/admin/companies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to create company');
            }

            router.push('/admin/company');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Add New Company</h1>
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
                                    readOnly
                                    value={formData.memberId}
                                    className="w-full rounded-lg border border-gray-300 bg-gray-100 p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-500 cursor-not-allowed"
                                />
                            </div>
                            {/* Member Type Hidden */}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                                <input
                                    type="url"
                                    name="website"
                                    placeholder="https://example.com"
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
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Directors</label>
                            <input
                                type="text"
                                name="directors"
                                placeholder="e.g. John Doe, Jane Smith"
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
                                placeholder="e.g. 2019, 2023, 2024"
                                value={formData.participationYears}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Section: Scope & Services */}
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
                                {logoPreview && (
                                    <div className="mt-4">
                                        <img src={logoPreview} alt="Logo Preview" className="w-32 h-32 object-contain border rounded-lg bg-gray-50" />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Gallery / Documents</label>
                                <input type="file" multiple accept="image/*,application/pdf" onChange={handleMediaChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                                {mediaPreviews.length > 0 && (
                                    <div className="mt-4 grid grid-cols-3 gap-2">
                                        {mediaPreviews.map((src, idx) => (
                                            <div key={idx} className="relative group">
                                                <img src={src} alt={`Preview ${idx}`} className="w-full h-20 object-cover rounded-md border" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeMedia(idx)}
                                                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Contact & Location */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 mb-4">Contact & Location</h2>

                        {/* Key Contact Person Details */}
                        <div className="mb-6 bg-gray-50 p-4 rounded-lg border">
                            <h3 className="text-md font-semibold text-gray-800 mb-3">Key Contact Person Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                                    <input type="text" name="designation" placeholder="e.g. Managing Director" value={formData.designation} onChange={handleChange} className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone / Mobile</label>
                                    <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>

                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

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
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Skype / Teams</label>
                                <input type="text" name="skype" value={formData.skype} onChange={handleChange} className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">WeChat</label>
                                <input type="text" name="wechat" value={formData.wechat} onChange={handleChange} className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">About / Company Profile</label>
                        <textarea
                            name="about"
                            rows={6}
                            value={formData.about}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div className="flex justify-end pt-6">
                        <button
                            type="submit"
                            disabled={loading || uploading}
                            className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {uploading ? 'Uploading Files & Creating...' : 'Create Company'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
