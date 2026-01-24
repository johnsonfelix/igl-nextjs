"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
    Search, Filter, ChevronDown, CheckCircle, AlertCircle, XCircle,
    Clock, Eye, Download, FileText, ShoppingBag, Truck, CreditCard,
    Calendar, User, Mail, Phone, MapPin, Info, Trash2, Printer
} from "lucide-react";
import { InvoiceTemplate } from "@/app/components/InvoiceTemplate";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import {
    Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose
} from "@/app/components/ui/sheet";
import { Separator } from "@/app/components/ui/separator";

// Define strict types based on the Prisma schema structure we expect
interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    productType: string;
}

interface Order {
    id: string;
    totalAmount: number;
    status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
    createdAt: Date | string;
    company: {
        name: string;
        email?: string; // Derived or direct
        logoUrl?: string; // Optional
        memberId?: string;
        designation?: string;
        address?: string;
    };
    event?: {
        name: string;
    } | null;
    items: OrderItem[];
    // Billing info directly from PO model
    billingAddressLine1?: string | null;
    billingCity?: string | null;
    billingCountry?: string | null;
    offlinePayment?: boolean;
}

interface DashboardClientProps {
    orders: Order[];
    stats: {
        totalRevenue: number;
        totalOrders: number;
        pendingOrders: number;
        avgOrderValue: number;
    };
}

export default function DashboardClient({ orders = [], stats }: DashboardClientProps) {
    const [ordersList, setOrdersList] = useState<Order[]>(orders);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [detailsOrder, setDetailsOrder] = useState<any | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [viewInvoiceOrder, setViewInvoiceOrder] = useState<Order | null>(null);

    const fetchOrderDetails = async (orderId: string) => {
        setLoadingDetails(true);
        try {
            const res = await fetch(`/api/admin/orders/${orderId}`);
            if (res.ok) {
                const data = await res.json();
                setDetailsOrder(data);
                setShowDetailsModal(true);
            } else {
                alert("Failed to fetch order details");
            }
        } catch (error) {
            console.error("Error fetching order details:", error);
            alert("Error loading order details");
        } finally {
            setLoadingDetails(false);
        }
    };

    const deleteOrder = async (orderId: string) => {
        if (!confirm("Are you sure you want to delete this order? This action cannot be undone.")) return;

        try {
            const res = await fetch(`/api/admin/orders/${orderId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                // Optimistic update
                setOrdersList(prev => prev.filter(o => o.id !== orderId));
                toast.success("Order deleted successfully!");
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || "Failed to delete order");
            }
        } catch (error) {
            console.error("Error deleting order:", error);
            toast.error("Error deleting order");
        }
    };


    const filteredOrders = ordersList.filter(order =>
        order.company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case "COMPLETED": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "PENDING": return "bg-amber-100 text-amber-700 border-amber-200";
            case "FAILED": return "bg-red-100 text-red-700 border-red-200";
            case "REFUNDED": return "bg-gray-100 text-gray-700 border-gray-200";
            default: return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "COMPLETED": return <CheckCircle size={14} className="mr-1" />;
            case "PENDING": return <Clock size={14} className="mr-1" />;
            case "FAILED": return <XCircle size={14} className="mr-1" />;
            default: return <AlertCircle size={14} className="mr-1" />;
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 min-h-screen bg-gray-50/50">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Orders Dashboard</h1>
                    <p className="text-gray-500 mt-2">Manage and track all purchase orders efficiently.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="bg-white">
                        <Download size={16} className="mr-2" /> Export
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        Create Order
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Orders", value: stats.totalOrders, icon: ShoppingBag, color: "text-purple-600", bg: "bg-purple-50" },
                    { label: "Pending Processing", value: stats.pendingOrders, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                ].map((stat, i) => (
                    <Card key={i} className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
                            </div>
                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon size={22} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Orders Table Section */}
            <Card className="border-gray-100 shadow-sm overflow-hidden bg-white">
                <CardHeader className="border-b border-gray-50 px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Recent Orders</CardTitle>
                        <CardDescription>View and manage supplier purchase orders.</CardDescription>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <Input
                                placeholder="Search orders..."
                                className="pl-9 bg-gray-50 border-gray-200"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="icon">
                            <Filter size={16} />
                        </Button>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">Order ID</th>
                                <th className="px-6 py-4">Payment Status</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Event / Details</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-gray-500">
                                        No orders found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <motion.tr
                                        key={order.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="group hover:bg-gray-50/80 transition-colors"
                                    >
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            #{order.id.slice(-6).toUpperCase()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className={`${getStatusColor(order.status)} border rounded-md px-2 py-0.5`}>
                                                {getStatusIcon(order.status)}
                                                {order.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-800">{order.company.name}</span>
                                                {order.company.email && <span className="text-xs text-gray-400">{order.company.email}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {order.event?.name || order.items[0]?.name || "N/A"}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                                day: 'numeric', month: 'short', year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-right font-semibold text-gray-900">
                                            ${order.totalAmount.toLocaleString("en-US")}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                                    onClick={() => fetchOrderDetails(order.id)}
                                                    disabled={loadingDetails}
                                                >
                                                    <Info size={14} className="mr-1" />
                                                    Details
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => deleteOrder(order.id)}>
                                                    <Trash2 size={14} className="mr-1" />
                                                    Delete
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                                                    onClick={() => setViewInvoiceOrder(order)}>
                                                    <Printer size={14} className="mr-1" />
                                                    Invoice
                                                </Button>
                                                <Sheet>
                                                    <SheetTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            onClick={() => setSelectedOrder(order)}>
                                                            <Eye size={14} className="mr-1" />
                                                            View
                                                        </Button>
                                                    </SheetTrigger>
                                                    <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
                                                        <SheetHeader className="mb-6">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <Badge variant="outline" className={`${getStatusColor(order.status)} px-3 py-1 text-sm`}>
                                                                    {order.status}
                                                                </Badge>
                                                                <span className="text-sm text-gray-500 block">
                                                                    {new Date(order.createdAt).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <SheetTitle className="text-2xl">Order #{order.id.slice(-6).toUpperCase()}</SheetTitle>
                                                            <SheetDescription>
                                                                Detailed summary of the purchase order.
                                                            </SheetDescription>
                                                        </SheetHeader>

                                                        <div className="space-y-8">
                                                            {/* Customer Info */}
                                                            <div>
                                                                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                                    <User size={16} /> Customer Details
                                                                </h4>
                                                                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-500 text-sm">Company</span>
                                                                        <span className="font-medium text-gray-900">{order.company.name}</span>
                                                                    </div>
                                                                    {/* Assuming we might have user details later, currently using company as primary */}
                                                                    <Separator className="bg-gray-200" />
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-500 text-sm">Billing City</span>
                                                                        <span className="font-medium text-gray-900">{order.billingCity || "—"}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Order Items */}
                                                            <div>
                                                                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                                    <ShoppingBag size={16} /> Order Items
                                                                </h4>
                                                                <div className="border border-gray-100 rounded-xl overflow-hidden">
                                                                    <table className="w-full text-sm">
                                                                        <thead className="bg-gray-50 text-gray-500">
                                                                            <tr>
                                                                                <th className="px-4 py-3 text-left font-medium">Item</th>
                                                                                <th className="px-4 py-3 text-center font-medium">Qty</th>
                                                                                <th className="px-4 py-3 text-right font-medium">Price</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-gray-100">
                                                                            {order.items.map((item) => (
                                                                                <tr key={item.id}>
                                                                                    <td className="px-4 py-3 text-gray-900">
                                                                                        <div>
                                                                                            <p className="font-medium">{item.name}</p>
                                                                                            <p className="text-xs text-gray-500 capitalize">{item.productType.toLowerCase()}</p>
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                                                                                    <td className="px-4 py-3 text-right text-gray-900">${item.price.toLocaleString("en-US")}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                        <tfoot className="bg-gray-50">
                                                                            <tr>
                                                                                <td colSpan={2} className="px-4 py-3 text-right font-semibold text-gray-900">Total</td>
                                                                                <td className="px-4 py-3 text-right font-bold text-gray-900">${order.totalAmount.toLocaleString("en-US")}</td>
                                                                            </tr>
                                                                        </tfoot>
                                                                    </table>
                                                                </div>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="flex flex-col gap-3">
                                                                {order.status === "PENDING" ? (
                                                                    <Button
                                                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                                                        onClick={async () => {
                                                                            await import("./actions").then(mod => mod.markOrderAsPaid(order.id));
                                                                            // Optimistic update or wait for revalidate
                                                                            // Since we are inside a client component without useTransition for this simple call, 
                                                                            // we might want to close sheet or just wait. 
                                                                            // A reload or state update would be better but let's stick to simple first.
                                                                            window.location.reload(); // Simple refresh to fetch new server data
                                                                        }}
                                                                    >
                                                                        <CheckCircle size={16} className="mr-2" /> Approve Payment
                                                                    </Button>
                                                                ) : (
                                                                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between">
                                                                        <span className="text-sm text-gray-500 font-medium">Payment Status</span>
                                                                        <Badge variant="outline" className={`${getStatusColor(order.status)}`}>
                                                                            {order.status}
                                                                        </Badge>
                                                                        {order.offlinePayment && (
                                                                            <Badge variant="secondary" className="ml-2 bg-gray-200 text-white">
                                                                                Offline
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </SheetContent>
                                                </Sheet>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Order Details Modal */}
            <AnimatePresence>
                {showDetailsModal && detailsOrder && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={() => setShowDetailsModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                                    <p className="text-gray-500 text-sm mt-1">#{detailsOrder.id?.slice(-8).toUpperCase()}</p>
                                </div>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <XCircle size={24} className="text-gray-400" />
                                </button>
                            </div>

                            <div className="p-6 space-y-8">
                                {/* Order Info */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Order Information</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-xs text-gray-500 mb-1">Order ID</p>
                                            <p className="font-semibold text-gray-900">#{detailsOrder.id?.slice(-8).toUpperCase()}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-xs text-gray-500 mb-1">Date</p>
                                            <p className="font-semibold text-gray-900">{new Date(detailsOrder.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-xs text-gray-500 mb-1">Status</p>
                                            <Badge variant="outline" className={getStatusColor(detailsOrder.status)}>
                                                {detailsOrder.status}
                                            </Badge>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                                            <p className="font-bold text-gray-900">${detailsOrder.totalAmount?.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Company Info */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Company Information</h3>
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Company Name</span>
                                            <span className="font-semibold">{detailsOrder.account?.companyName || "N/A"}</span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Contact Person</span>
                                            <span className="font-semibold">{detailsOrder.account?.name || "N/A"}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Attendee Details */}
                                {detailsOrder.additionalDetails?.attendees && detailsOrder.additionalDetails.attendees.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Attendee Details</h3>
                                        <div className="space-y-3">
                                            {detailsOrder.additionalDetails.attendees.map((attendee: any, idx: number) => (
                                                <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-semibold text-gray-900">{attendee.label || `Attendee ${idx + 1}`}</h4>
                                                        {attendee.tshirtSize && (
                                                            <Badge variant="secondary" className="bg-indigo-100 text-white">
                                                                T-Shirt: {attendee.tshirtSize}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                        <div>
                                                            <span className="text-gray-600">Name:</span>
                                                            <span className="ml-2 font-medium">{attendee.name || "N/A"}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">Designation:</span>
                                                            <span className="ml-2 font-medium">{attendee.designation || "N/A"}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">Email:</span>
                                                            <span className="ml-2 font-medium">{attendee.email || "N/A"}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">Mobile:</span>
                                                            <span className="ml-2 font-medium">{attendee.mobile || "N/A"}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Cart Items */}
                                {detailsOrder.items && detailsOrder.items.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Cart Items</h3>
                                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50 border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Item</th>
                                                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Quantity</th>
                                                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Price</th>
                                                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {detailsOrder.items.map((item: any, idx: number) => (
                                                        <tr key={idx}>
                                                            <td className="px-4 py-3">
                                                                <div>
                                                                    <p className="font-medium text-gray-900">{item.name}</p>
                                                                    <p className="text-xs text-gray-500 capitalize">{item.productType?.toLowerCase()}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-center text-gray-700">{item.quantity}</td>
                                                            <td className="px-4 py-3 text-right text-gray-700">${item.price?.toLocaleString()}</td>
                                                            <td className="px-4 py-3 text-right font-semibold text-gray-900">${(item.price * item.quantity)?.toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                                                    <tr>
                                                        <td colSpan={3} className="px-4 py-3 text-right font-bold text-gray-900">Total</td>
                                                        <td className="px-4 py-3 text-right font-bold text-gray-900 text-lg">${detailsOrder.totalAmount?.toLocaleString()}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Billing & Shipping */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Billing Address</h3>
                                        <div className="bg-gray-50 p-4 rounded-lg space-y-1 text-sm">
                                            <p className="font-medium text-gray-900">{detailsOrder.billingAddress?.line1 || "N/A"}</p>
                                            {detailsOrder.billingAddress?.line2 && <p className="text-gray-700">{detailsOrder.billingAddress.line2}</p>}
                                            <p className="text-gray-700">
                                                {[detailsOrder.billingAddress?.city, detailsOrder.billingAddress?.state, detailsOrder.billingAddress?.zip]
                                                    .filter(Boolean)
                                                    .join(", ") || "N/A"}
                                            </p>
                                            <p className="text-gray-700">{detailsOrder.billingAddress?.country || "N/A"}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Additional Info</h3>
                                        <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Referral Source</span>
                                                <span className="font-medium">{detailsOrder.additionalDetails?.referralSource || "N/A"}</span>
                                            </div>
                                            <Separator />
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Payment Method</span>
                                                <span className="font-medium capitalize">{detailsOrder.paymentMethod || "N/A"}</span>
                                            </div>
                                            {detailsOrder.paymentProof && (
                                                <>
                                                    <Separator />
                                                    <div>
                                                        <span className="text-gray-600 block mb-2">Payment Proof</span>
                                                        <a
                                                            href={detailsOrder.paymentProof}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block"
                                                        >
                                                            <img
                                                                src={detailsOrder.paymentProof}
                                                                alt="Payment Proof"
                                                                className="w-full rounded-lg border hover:opacity-90 transition-opacity"
                                                            />
                                                        </a>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Invoice Viewer Modal */}
            {viewInvoiceOrder && (
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
                                            filename: `Invoice_${viewInvoiceOrder.id.slice(-8)}.pdf`,
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
                                    onClick={() => setViewInvoiceOrder(null)}
                                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-8 print:p-0 printable-area">
                            <InvoiceTemplate
                                orderId={viewInvoiceOrder.id.slice(-8).toUpperCase()} // Or use proper invoice number if available
                                date={viewInvoiceOrder.createdAt}
                                customerDetails={{
                                    name: viewInvoiceOrder.company.name,
                                    email: viewInvoiceOrder.company.email || "",
                                    address: viewInvoiceOrder.company.address || "",
                                    companyName: viewInvoiceOrder.company.name,
                                    designation: viewInvoiceOrder.company.designation || "",
                                    memberId: viewInvoiceOrder.company.memberId || ""
                                }}
                                items={viewInvoiceOrder.items.map(item => ({
                                    name: item.name,
                                    quantity: item.quantity,
                                    price: item.price,
                                    total: Number((item.price * item.quantity).toFixed(2))
                                }))}
                                totalAmount={viewInvoiceOrder.totalAmount}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function TrendingUp({ size, className }: { size?: number, className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
        </svg>
    )
}
