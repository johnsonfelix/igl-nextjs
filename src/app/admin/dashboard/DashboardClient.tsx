"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, Filter, ChevronDown, CheckCircle, AlertCircle, XCircle,
    Clock, Eye, Download, FileText, ShoppingBag, Truck, CreditCard,
    Calendar, User, Mail, Phone, MapPin
} from "lucide-react";
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
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredOrders = orders.filter(order =>
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
                    { label: "Total Revenue", value: `$${stats.totalRevenue.toLocaleString("en-US")}`, icon: CreditCard, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Total Orders", value: stats.totalOrders, icon: ShoppingBag, color: "text-purple-600", bg: "bg-purple-50" },
                    { label: "Pending Processing", value: stats.pendingOrders, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Avg. Order Value", value: `$${Math.round(stats.avgOrderValue).toLocaleString("en-US")}`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
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
                                            <Sheet>
                                                <SheetTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        onClick={() => setSelectedOrder(order)}>
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
                                                                        <Badge variant="secondary" className="ml-2 bg-gray-200 text-gray-700">
                                                                            Offline
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </SheetContent>
                                            </Sheet>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card >
        </div >
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
