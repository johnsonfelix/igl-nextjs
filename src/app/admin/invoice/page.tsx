"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FileText, Search, Loader, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function InvoiceListPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchInvoices = () => {
        setLoading(true);
        fetch('/api/admin/invoices')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setInvoices(data);
                }
            })
            .catch(err => console.error("Failed to fetch invoices", err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this invoice?")) return;

        try {
            const res = await fetch(`/api/admin/invoices/${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete');

            toast.success('Invoice deleted successfully');
            fetchInvoices();
        } catch (error) {
            toast.error('Failed to delete invoice');
            console.error(error);
        }
    };

    return (
        <div className="space-y-6">
            {/* ... header ... */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
                    <p className="text-gray-500 text-sm">Manage manual invoices</p>
                </div>
                <Link
                    href="/admin/invoice/create"
                    className="flex items-center justify-center gap-2 bg-[#004aad] hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                    <Plus className="w-5 h-5" /> Create Invoice
                </Link>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                ) : invoices.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <div className="bg-blue-50 p-4 rounded-full mb-4">
                            <FileText className="w-8 h-8 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-1">No invoices found</h3>
                        <p className="text-gray-500 text-sm mb-6">Create your first manual invoice to see it here.</p>
                        <Link
                            href="/admin/invoice/create"
                            className="text-blue-600 font-bold hover:underline"
                        >
                            Create New Invoice
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4">Invoice No</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Company</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {invoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-800">{inv.invoiceNumber}</td>
                                        <td className="px-6 py-4 text-gray-600">{format(new Date(inv.date), 'MMM d, yyyy')}</td>
                                        <td className="px-6 py-4 font-medium text-gray-800">
                                            {/* @ts-ignore */}
                                            {inv.customerDetails?.name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {/* @ts-ignore */}
                                            {inv.customerDetails?.companyName || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-800">
                                            {inv.currency || 'USD'} {inv.totalAmount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/admin/invoice/${inv.id}`} className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg font-bold text-xs transition-colors">
                                                    View / Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(inv.id)}
                                                    className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                                    title="Delete Invoice"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
