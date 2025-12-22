"use client";

import { motion } from "framer-motion";
import {
    TrendingUp, Users, DollarSign, Calendar, ArrowUpRight,
    Activity, CreditCard, ShoppingBag, Clock, MoreVertical,
    Building2,
    Ticket
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";

const stats = [
    {
        title: "Total Revenue",
        value: "₹24,50,000",
        change: "+12.5%",
        trend: "up",
        icon: DollarSign,
        color: "text-blue-600",
        bg: "bg-blue-50",
    },
    {
        title: "Total Registrations",
        value: "1,240",
        change: "+8.2%",
        trend: "up",
        icon: Users,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
    },
    {
        title: "Active Booths",
        value: "45",
        change: "+2 new",
        trend: "neutral",
        icon: ShoppingBag,
        color: "text-purple-600",
        bg: "bg-purple-50",
    },
    {
        title: "Pending Tickets",
        value: "12",
        change: "-4.5%",
        trend: "down",
        icon: Ticket,
        color: "text-amber-600",
        bg: "bg-amber-50",
    },
];

const activity = [
    {
        user: "Sarah Johnson",
        action: "purchased a VIP Ticket",
        time: "2 mins ago",
        amount: "₹5,000",
        avatar: "SJ",
        color: "bg-blue-100 text-blue-600"
    },
    {
        user: "TechCorp Ltd.",
        action: "registered as a new Sponsor",
        time: "1 hour ago",
        amount: "₹50,000",
        avatar: "TC",
        color: "bg-emerald-100 text-emerald-600"
    },
    {
        user: "Michael Chen",
        action: "updated booth details",
        time: "3 hours ago",
        amount: null,
        avatar: "MC",
        color: "bg-purple-100 text-purple-600"
    },
    {
        user: "Logistics Pro",
        action: "booked 3 Deluxe Rooms",
        time: "5 hours ago",
        amount: "₹45,000",
        avatar: "LP",
        color: "bg-amber-100 text-amber-600"
    },
];

const overviewData = [
    { month: "Jan", value: 40 },
    { month: "Feb", value: 65 },
    { month: "Mar", value: 45 },
    { month: "Apr", value: 80 },
    { month: "May", value: 55 },
    { month: "Jun", value: 90 },
];

export default function DashboardPage() {
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
            {/* Hero Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard</h1>
                    <p className="text-gray-500 mt-1">Welcome back, Admin. Here's what's happening today.</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                        <Calendar size={20} />
                    </div>
                    <div className="pr-4">
                        <p className="text-xs text-gray-400 font-medium uppercase">Today's Date</p>
                        <p className="text-sm font-semibold text-gray-700">Dec 08, 2025</p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {stats.map((stat, i) => (
                    <motion.div key={i} variants={itemVariants}>
                        <Card className="border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                        <stat.icon size={22} />
                                    </div>
                                    <Badge variant={stat.trend === "up" ? "default" : "secondary"} className={
                                        stat.trend === "up" ? "bg-blue-100 text-white hover:bg-blue-200" :
                                            stat.trend === "down" ? "bg-red-50 text-white hover:bg-red-100" :
                                                "bg-gray-100 text-white"
                                    }>
                                        {stat.change} <ArrowUpRight size={12} className="ml-1" />
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart Section (Simulated) */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-gray-100 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg font-bold text-gray-800">Revenue Overview</CardTitle>
                            <Button variant="outline" size="sm" className="h-8 text-xs">Download Report</Button>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full flex items-end justify-between px-4 pt-10 pb-2 gap-4">
                                {overviewData.map((d, i) => (
                                    <div key={i} className="flex flex-col items-center gap-2 flex-1 group cursor-pointer">
                                        <div className="relative w-full bg-gray-100 rounded-t-lg overflow-hidden h-full flex items-end hover:bg-blue-50 transition-colors">
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${d.value}%` }}
                                                transition={{ duration: 0.8, delay: i * 0.1, type: "spring" }}
                                                className="w-full bg-blue-500 opacity-80 group-hover:opacity-100 transition-opacity rounded-t-lg relative"
                                            >
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                    {d.value}%
                                                </div>
                                            </motion.div>
                                        </div>
                                        <span className="text-xs text-gray-500 font-medium">{d.month}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-gray-100 shadow-sm bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
                            <CardContent className="p-6 flex flex-col justify-between h-full">
                                <div>
                                    <div className="bg-white/20 w-fit p-2 rounded-lg mb-4">
                                        <Building2 size={20} className="text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-1">Company Profiles</h3>
                                    <p className="text-indigo-100 text-sm">Manage pending verifications and approvals.</p>
                                </div>
                                <div className="mt-8 flex items-center justify-between">
                                    <div>
                                        <p className="text-3xl font-extrabold">28</p>
                                        <p className="text-xs text-indigo-200">Pending Review</p>
                                    </div>
                                    <Button size="sm" className="bg-white text-indigo-600 hover:bg-indigo-50 border-0">
                                        Review Now
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-gray-100 shadow-sm bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                            <CardContent className="p-6 flex flex-col justify-between h-full">
                                <div>
                                    <div className="bg-white/20 w-fit p-2 rounded-lg mb-4">
                                        <CreditCard size={20} className="text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-1">Recent Transactions</h3>
                                    <p className="text-blue-100 text-sm">Monitor incoming payments and refunds.</p>
                                </div>
                                <div className="mt-8 flex items-center justify-between">
                                    <div>
                                        <p className="text-3xl font-extrabold">₹1.2M</p>
                                        <p className="text-xs text-blue-200">Processing</p>
                                    </div>
                                    <Button size="sm" className="bg-white text-blue-600 hover:bg-blue-50 border-0">
                                        View All
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Recent Activity Sidebar */}
                <div className="space-y-6">
                    <Card className="border-gray-100 shadow-sm h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Activity size={18} className="text-blue-500" />
                                Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {activity.map((item, i) => (
                                    <div key={i} className="flex gap-4 items-start">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${item.color}`}>
                                            {item.avatar}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900">
                                                <span className="font-bold">{item.user}</span> {item.action}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Clock size={12} className="text-gray-400" />
                                                <span className="text-xs text-gray-400">{item.time}</span>
                                            </div>
                                        </div>
                                        {item.amount && (
                                            <span className="text-sm font-semibold text-blue-600 whitespace-nowrap">
                                                {item.amount}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <Button variant="ghost" className="w-full mt-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                View All Activity
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
