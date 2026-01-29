"use client";

import { useState, useRef, useEffect } from "react";
import { InvoiceTemplate } from "@/app/components/InvoiceTemplate";
import { Plus, Trash2, Download, Save, ArrowLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { SearchableSelect } from "@/app/components/ui/SearchableSelect";

export default function CreateInvoicePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        invoiceNumber: "", // Will be auto-populated
        date: new Date().toISOString().split("T")[0],
        currency: "USD",
        isAutoFilled: false,
        customerDetails: {
            name: "",
            email: "",
            companyName: "",
            designation: "",
            address: "",
            memberId: "",
        },
        items: [
            { name: "", quantity: 1, price: 0, originalPrice: 0, total: 0, isCustom: false },
        ],
    });

    const componentRef = useRef<HTMLDivElement>(null);

    const [companies, setCompanies] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    useEffect(() => {
        // Fetch next invoice number
        fetch('/api/admin/invoices/next')
            .then(res => res.json())
            .then(data => {
                if (data.invoiceNumber) {
                    setFormData(prev => ({ ...prev, invoiceNumber: data.invoiceNumber }));
                }
            })
            .catch(err => console.error("Failed to fetch next invoice ID", err));

        // Fetch companies for dropdown
        fetch('/api/admin/companies')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setCompanies(data);
                }
            })
            .catch(err => console.error("Failed to fetch companies", err));

        // Fetch products (Tickets & Sponsors)
        Promise.all([
            fetch('/api/admin/tickets').then(r => r.json()),
            fetch('/api/admin/sponsor-types').then(r => r.json())
        ]).then(([tickets, sponsors]) => {
            const combined = [
                ...(Array.isArray(tickets) ? tickets.map((t: any) => ({ ...t, type: 'Ticket' })) : []),
                ...(Array.isArray(sponsors) ? sponsors.map((s: any) => ({ ...s, type: 'Sponsor' })) : [])
            ];
            setProducts(combined);
        }).catch(err => console.error("Failed to fetch products", err));

    }, []);

    const handleCompanySelect = (companyId: string) => {
        if (!companyId) return;

        const company = companies.find(c => c.id === companyId);
        if (company) {
            const loc = company.location || {};
            setFormData(prev => ({
                ...prev,
                isAutoFilled: true,
                customerDetails: {
                    ...prev.customerDetails,
                    name: loc.contactPerson || company.directors || "",
                    email: loc.email || "",
                    companyName: company.name,
                    designation: loc.contactPersonDesignation || company.designation || "",
                    memberId: company.memberId,
                    address: [loc.address, loc.city, loc.state, loc.country, loc.zipCode].filter(Boolean).join(", "),
                }
            }));
        }
    };

    const handleClearAutoFill = () => {
        setFormData(prev => ({
            ...prev,
            isAutoFilled: false,
            customerDetails: {
                name: "",
                email: "",
                companyName: "",
                designation: "",
                address: "",
                memberId: "",
            }
        }));
    };

    const handleInvoiceNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }));
    };

    const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            customerDetails: { ...prev.customerDetails, [name]: value },
        }));
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...formData.items];
        // @ts-ignore
        newItems[index][field] = value;

        // Auto calculate total for item
        if (field === "quantity" || field === "price") {
            newItems[index].total = newItems[index].quantity * newItems[index].price;
        }

        setFormData((prev) => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormData((prev) => ({
            ...prev,
            items: [...prev.items, { name: "", quantity: 1, price: 0, originalPrice: 0, total: 0, isCustom: false }],
        }));
    };

    const removeItem = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
        }));
    };

    const calculateGrandTotal = () => {
        return formData.items.reduce((acc, item) => acc + item.total, 0);
    };

    const handleSave = async (redirect = true) => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    totalAmount: calculateGrandTotal()
                })
            });

            if (!res.ok) throw new Error('Failed to save');

            toast.success('Invoice saved successfully');
            if (redirect) {
                router.push('/admin/invoice');
            }
            return true;
        } catch (error) {
            toast.error('Failed to save invoice');
            console.error(error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        // Auto-save before download
        const saved = await handleSave(false);
        if (!saved) return;

        if (!componentRef.current) return;

        try {
            // Dynamic import to avoid SSR issues
            const html2pdf = (await import('html2pdf.js')).default;

            const opt = {
                margin: 0,
                filename: `Invoice-${formData.invoiceNumber}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            // @ts-ignore
            html2pdf().set(opt).from(componentRef.current).save();

            // Redirect after download (optional, but consistent with behavior)
            // router.push('/admin/invoice'); 
        } catch (error) {
            console.error("Download failed", error);
            toast.error("Failed to download PDF");
        }
    };

    const currencies = ["USD", "EUR", "GBP", "AUD", "CAD", "SGD", "INR", "THB"];

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-100px)]">
            {/* --- FORM SECTION --- */}
            <div className="w-full lg:w-1/3 overflow-y-auto pr-4 pb-20">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">New Invoice</h1>
                </div>

                {/* Company Selection */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-gray-700">Auto-fill from Company</label>
                        {formData.isAutoFilled && (
                            <button onClick={handleClearAutoFill} className="text-xs text-red-500 hover:text-red-700 font-semibold">
                                Clear / Unlock
                            </button>
                        )}
                    </div>
                    <SearchableSelect
                        label=""
                        placeholder="Search company by name or ID..."
                        options={companies.map(c => ({
                            id: c.id,
                            label: c.name,
                            subLabel: c.memberId
                        }))}
                        onSelect={handleCompanySelect}
                    />
                    {formData.isAutoFilled && (
                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Details locked from company profile
                        </p>
                    )}
                </div>

                {/* Invoice Meta */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4 space-y-4">
                    <h3 className="font-bold text-gray-700 border-b pb-2">Invoice Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Invoice No</label>
                            <input
                                type="text"
                                value={formData.invoiceNumber}
                                onChange={handleInvoiceNumberChange}
                                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Date</label>
                            <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 mb-1">Currency</label>
                            <select
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Customer Details */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4 space-y-4">
                    <h3 className="font-bold text-gray-700 border-b pb-2">Customer Details</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Full Name</label>
                            <input
                                name="name"
                                value={formData.customerDetails.name}
                                onChange={handleCustomerChange}
                                readOnly={formData.isAutoFilled}
                                className={`w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${formData.isAutoFilled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                                placeholder="John Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Email</label>
                            <input
                                name="email"
                                value={formData.customerDetails.email}
                                onChange={handleCustomerChange}
                                readOnly={formData.isAutoFilled}
                                className={`w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${formData.isAutoFilled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                                placeholder="john@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Company Name</label>
                            <input
                                name="companyName"
                                value={formData.customerDetails.companyName}
                                onChange={handleCustomerChange}
                                readOnly={formData.isAutoFilled}
                                className={`w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${formData.isAutoFilled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                                placeholder="Acme Inc"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Designation</label>
                                <input
                                    name="designation"
                                    value={formData.customerDetails.designation}
                                    onChange={handleCustomerChange}
                                    readOnly={formData.isAutoFilled}
                                    className={`w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${formData.isAutoFilled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                                    placeholder="Director"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Member ID</label>
                                <input
                                    name="memberId"
                                    value={formData.customerDetails.memberId}
                                    onChange={handleCustomerChange}
                                    readOnly={formData.isAutoFilled}
                                    className={`w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${formData.isAutoFilled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                                    placeholder="IGLA-123"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Address</label>
                            <textarea
                                name="address"
                                value={formData.customerDetails.address}
                                onChange={handleCustomerChange}
                                readOnly={formData.isAutoFilled}
                                className={`w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none ${formData.isAutoFilled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                                placeholder="123 Street, City, Country"
                            />
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4">
                    <div className="flex justify-between items-center border-b pb-2 mb-4">
                        <h3 className="font-bold text-gray-700">Items</h3>
                        <button onClick={addItem} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold flex items-center gap-1 hover:bg-blue-100">
                            <Plus className="w-3 h-3" /> Add Item
                        </button>
                    </div>

                    <div className="space-y-4">
                        {formData.items.map((item, index) => (
                            <div key={index} className="flex gap-2 items-start group">
                                <div className="flex-1 space-y-2">
                                    <div className="flex gap-2 items-center">
                                        <div className="flex-1">
                                            {/* @ts-ignore */}
                                            {/* @ts-ignore */}
                                            {item.isCustom ? (
                                                <div className="relative">
                                                    <input
                                                        placeholder="Item Name"
                                                        value={item.name}
                                                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                                        className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none pr-8"
                                                        autoFocus
                                                    />
                                                    <button
                                                        // @ts-ignore
                                                        onClick={() => handleItemChange(index, 'isCustom', false)}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500"
                                                        title="Search Product"
                                                    >
                                                        <Search className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <SearchableSelect
                                                    label=""
                                                    placeholder="Select Product..."
                                                    options={products.map(p => ({
                                                        id: p.id,
                                                        label: p.name,
                                                        subLabel: `${p.type} - $${p.price}`
                                                    }))}
                                                    onSelect={(val) => {
                                                        const p = products.find(prod => prod.id === val);
                                                        if (p) {
                                                            const newItems = [...formData.items];
                                                            // @ts-ignore
                                                            newItems[index].name = p.name;
                                                            // @ts-ignore
                                                            newItems[index].price = p.sellingPrice ?? p.price;
                                                            // @ts-ignore
                                                            newItems[index].originalPrice = p.price;
                                                            // @ts-ignore
                                                            newItems[index].total = newItems[index].quantity * (p.sellingPrice ?? p.price);
                                                            // @ts-ignore
                                                            newItems[index].isCustom = true;
                                                            setFormData(prev => ({ ...prev, items: newItems }));
                                                        }
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="text-[10px] text-gray-400 font-bold uppercase">Actual Price</label>
                                            <input
                                                type="number"
                                                // @ts-ignore
                                                value={item.originalPrice || 0}
                                                onChange={(e) => handleItemChange(index, 'originalPrice', parseFloat(e.target.value) || 0)}
                                                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 text-gray-500"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] text-gray-400 font-bold uppercase">Selling Price</label>
                                            <input
                                                type="number"
                                                value={item.price}
                                                onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                                                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-800"
                                            />
                                        </div>
                                        <div className="w-20">
                                            <label className="text-[10px] text-gray-400 font-bold uppercase">Qty</label>
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="w-24">
                                            <label className="text-[10px] text-gray-400 font-bold uppercase">Total</label>
                                            <div className="w-full bg-gray-50 border rounded-lg p-2 text-sm font-bold text-gray-700 flex items-center h-[38px]">
                                                {/* Display grand total with currency code in edit form */}
                                                {(item.quantity * item.price).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => removeItem(index)} className="mt-8 p-2 text-gray-400 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                        <span className="font-bold text-gray-600">Grand Total</span>
                        <span className="font-bold text-xl text-blue-600">
                            {formData.currency} {calculateGrandTotal().toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            {/* --- PREVIEW SECTION --- */}
            <div className="flex-1 bg-gray-200 rounded-xl overflow-y-auto p-4 md:p-8 flex flex-col items-center">
                <div className="w-full max-w-[220mm] mb-4 flex justify-end gap-3">
                    <button onClick={() => handleSave(true)} disabled={loading} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full font-bold shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50">
                        <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Invoice'}
                    </button>
                    <button onClick={handleDownload} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-bold shadow-lg transition-transform hover:scale-105 active:scale-95">
                        <Download className="w-4 h-4" /> Download Invoice
                    </button>
                </div>

                <div className="shadow-2xl print:shadow-none bg-white">
                    <div ref={componentRef}>
                        <InvoiceTemplate
                            orderId={formData.invoiceNumber}
                            date={formData.date}
                            customerDetails={formData.customerDetails}
                            items={formData.items}
                            totalAmount={calculateGrandTotal()}
                            currency={formData.currency}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
