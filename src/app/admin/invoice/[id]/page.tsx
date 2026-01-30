"use client";

import { useState, useRef, useEffect, use } from "react";
import { InvoiceTemplate } from "@/app/components/InvoiceTemplate";
import { Plus, Trash2, Download, Save, ArrowLeft, Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [formData, setFormData] = useState({
        invoiceNumber: "",
        date: "",
        customerDetails: {
            name: "",
            email: "",
            companyName: "",
            designation: "",
            address: "",
            memberId: "",
            phoneNumber: "",
            taxNumber: "",
            postalCode: "",
        },
        items: [
            { name: "Conference Ticket", quantity: 1, price: 0, originalPrice: 0, total: 0 },
        ],
    });



    useEffect(() => {
        fetch(`/api/admin/invoices/${id}`)
            .then(res => {
                if (!res.ok) throw new Error("Invoice not found");
                return res.json();
            })
            .then(data => {
                setFormData({
                    invoiceNumber: data.invoiceNumber,
                    date: new Date(data.date).toISOString().split("T")[0],
                    customerDetails: data.customerDetails || {
                        name: "",
                        email: "",
                        companyName: "",
                        designation: "",
                        address: "",
                        memberId: "",
                        phoneNumber: "",
                        taxNumber: "",
                        postalCode: "",
                    },
                    items: data.items || [],
                });
            })
            .catch(err => {
                console.error(err);
                toast.error("Failed to load invoice");
                router.push('/admin/invoice');
            })
            .finally(() => setFetching(false));
    }, [id, router]);

    const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        let { name, value } = e.target;

        // Restrict to numbers only for Phone Number and Postal Code
        if (name === 'phoneNumber' || name === 'postalCode') {
            value = value.replace(/\D/g, '');
        }

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
            items: [...prev.items, { name: "", quantity: 1, price: 0, originalPrice: 0, total: 0 }],
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

    const handleUpdate = async (redirect = true) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/invoices/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    totalAmount: calculateGrandTotal()
                })
            });

            if (!res.ok) throw new Error('Failed to update');

            toast.success('Invoice updated successfully');
            if (redirect) {
                router.push('/admin/invoice');
            }
            return true;
        } catch (error) {
            toast.error('Failed to update invoice');
            console.error(error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this invoice?")) return;

        try {
            setLoading(true);
            const res = await fetch(`/api/admin/invoices/${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete');

            toast.success('Invoice deleted successfully');
            router.push('/admin/invoice');
        } catch (error) {
            toast.error('Failed to delete invoice');
            console.error(error);
            setLoading(false);
        }
    }

    const handleDownload = async () => {
        // Auto-save before download
        const saved = await handleUpdate(false);
        if (!saved) return;

        const element = document.getElementById('invoice-component');
        if (!element) return;

        try {
            // Dynamic import to avoid SSR issues
            const html2pdf = (await import('html2pdf.js')).default;

            const opt = {
                margin: 0,
                filename: `Invoice-${formData.invoiceNumber}.pdf`,
                image: { type: 'jpeg', quality: 0.98 } as any,
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            } as any;

            html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error("Download failed", error);
            toast.error("Failed to download PDF");
        }
    };

    if (fetching) return <div className="flex h-full items-center justify-center"><Loader className="w-8 h-8 animate-spin text-blue-600" /></div>;

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-100px)]">
            {/* --- FORM SECTION --- */}
            <div className="w-full lg:w-1/2 overflow-y-auto pr-4 pb-20">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">Edit Invoice</h1>
                </div>

                {/* Invoice Meta */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4 space-y-4">
                    <h3 className="font-bold text-gray-700 border-b pb-2">Invoice Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Invoice No</label>
                            <input type="text" value={formData.invoiceNumber} readOnly className="w-full border rounded-lg p-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Date</label>
                            <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>
                </div>

                {/* Customer Details */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4 space-y-4">
                    <h3 className="font-bold text-gray-700 border-b pb-2">Customer Details</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Full Name</label>
                            <input name="name" value={formData.customerDetails.name} onChange={handleCustomerChange} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="John Doe" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Email</label>
                            <input name="email" value={formData.customerDetails.email} onChange={handleCustomerChange} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="john@example.com" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Company Name</label>
                            <input name="companyName" value={formData.customerDetails.companyName} onChange={handleCustomerChange} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Acme Inc" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Designation</label>
                                <input name="designation" value={formData.customerDetails.designation} onChange={handleCustomerChange} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Director" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Member ID</label>
                                <input name="memberId" value={formData.customerDetails.memberId} onChange={handleCustomerChange} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="IGLA-123" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <textarea name="address" value={formData.customerDetails.address} onChange={handleCustomerChange} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none" placeholder="123 Street, City, Country" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Phone Number</label>
                                <input name="phoneNumber" value={(formData.customerDetails as any).phoneNumber || ''} onChange={handleCustomerChange} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Postal Code</label>
                                <input name="postalCode" value={(formData.customerDetails as any).postalCode || ''} onChange={handleCustomerChange} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Tax Number</label>
                            <input name="taxNumber" value={(formData.customerDetails as any).taxNumber || ''} onChange={handleCustomerChange} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
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
                                    <input
                                        placeholder="Item Name"
                                        value={item.name}
                                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                        className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
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
                        <span className="font-bold text-xl text-blue-600">${calculateGrandTotal().toFixed(2)}</span>
                    </div>
                </div>

                <div className="mt-8">
                    <button onClick={handleDelete} type="button" className="w-full p-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-bold transition-all">
                        Delete Invoice
                    </button>
                </div>
            </div>

            {/* --- PREVIEW SECTION --- */}
            <div className="flex-1 bg-gray-200 rounded-xl overflow-y-auto p-4 md:p-8 flex flex-col items-center">
                <div className="w-full max-w-[220mm] mb-4 flex justify-end gap-3">
                    <button onClick={() => handleUpdate(true)} disabled={loading} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full font-bold shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50">
                        <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Update Invoice'}
                    </button>
                    <button onClick={handleDownload} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-bold shadow-lg transition-transform hover:scale-105 active:scale-95">
                        <Download className="w-4 h-4" /> Download Invoice
                    </button>
                </div>

                <div className="shadow-2xl print:shadow-none bg-white">
                    <div>
                        <InvoiceTemplate
                            orderId={formData.invoiceNumber}
                            date={formData.date}
                            customerDetails={formData.customerDetails}
                            items={formData.items}
                            totalAmount={calculateGrandTotal()}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
