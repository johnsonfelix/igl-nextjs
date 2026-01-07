"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Eye, Printer, X, Download } from "lucide-react";
import { InvoiceTemplate } from "@/app/components/InvoiceTemplate";

interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
}

interface Order {
    id: string;
    totalAmount: number;
    status: string;
    createdAt: Date;
    items: OrderItem[];
    event?: {
        name: string;
    } | null;
    billingCity?: string | null;
    billingCountry?: string | null;
    invoiceNumber?: number;
}

interface OrdersTableProps {
    orders: Order[];
    companyName: string;
    companyEmail: string;
    companyAddress: string;
}

export default function OrdersTable({ orders, companyName, companyEmail, companyAddress }: OrdersTableProps) {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    if (orders.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border p-8 min-h-[300px] flex flex-col items-center justify-center text-center text-gray-400">
                <div className="bg-gray-50 p-4 rounded-full mb-4">
                    <Printer className="w-8 h-8 opacity-50" />
                </div>
                <p>No orders found.</p>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                    <h3 className="text-xl font-bold text-gray-900">Order History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Order ID</th>
                                <th className="px-6 py-4">Event / Description</th>
                                <th className="px-6 py-4">Total</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-gray-500">
                                        {format(new Date(order.createdAt), "MMM d, yyyy")}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-gray-600 text-xs">
                                        {order.invoiceNumber
                                            ? `IGLA${10000 + order.invoiceNumber}`
                                            : order.id.slice(-8).toUpperCase()}
                                    </td>
                                    <td className="px-6 py-4 text-gray-900 font-medium">
                                        {order.event?.name || order.items[0]?.name || "Order"}
                                        {order.items.length > 1 && <span className="text-xs text-gray-400 ml-1">(+{order.items.length - 1} more)</span>}
                                    </td>
                                    <td className="px-6 py-4 text-gray-900 font-bold">
                                        ${order.totalAmount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${order.status === "COMPLETED"
                                                ? "bg-green-100 text-green-700"
                                                : order.status === "PENDING"
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : "bg-red-100 text-red-700"
                                                }`}
                                        >
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="text-[#004aad] hover:text-[#00317a] font-medium inline-flex items-center gap-1 transition-colors"
                                        >
                                            <Eye className="w-4 h-4" /> View Invoice
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invoice Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:p-0 print:bg-white print:static">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto print:shadow-none print:max-w-none print:max-h-none print:w-full">

                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10 print:hidden">
                            <h3 className="text-lg font-bold text-gray-900">Invoice Details</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={async () => {
                                        const element = document.getElementById('invoice-component');
                                        if (!element) return;

                                        // Dynamic import
                                        const html2pdf = (await import('html2pdf.js')).default;

                                        const opt = {
                                            margin: 0,
                                            filename: `Invoice_${selectedOrder.invoiceNumber ? `IGLA${10000 + selectedOrder.invoiceNumber}` : selectedOrder.id}.pdf`,
                                            image: { type: 'jpeg', quality: 0.98 } as any,
                                            html2canvas: { scale: 2, useCORS: true },
                                            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                                        } as any;

                                        html2pdf().set(opt).from(element).save();
                                    }}
                                    className="flex items-center gap-2 bg-[#004aad] text-white px-4 py-2 rounded-md font-medium hover:bg-[#00317a] transition-all"
                                >
                                    <Download className="w-4 h-4" /> Download PDF
                                </button>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-8 print:p-0 printable-area">
                            <InvoiceTemplate
                                orderId={selectedOrder.invoiceNumber ? `IGLA${10000 + selectedOrder.invoiceNumber}` : selectedOrder.id}
                                date={selectedOrder.createdAt}
                                customerDetails={{
                                    name: companyName,
                                    email: companyEmail,
                                    address: companyAddress
                                }}
                                items={selectedOrder.items.map(item => ({
                                    name: item.name,
                                    quantity: item.quantity,
                                    price: item.price,
                                    total: Number((item.price * item.quantity).toFixed(2))
                                }))}
                                totalAmount={selectedOrder.totalAmount}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
