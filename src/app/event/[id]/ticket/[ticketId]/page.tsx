"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart, Check, Ticket, Loader2 } from "lucide-react";
import { useCart } from "@/app/event/[id]/CartContext";
import toast from "react-hot-toast";

interface EventTicket {
    id: string;
    name: string;
    logo: string | null;
    price: number;
    sellingPrice?: number | null;
    description: string | null;
    features: string[];
}

export default function TicketDetailsPage({
    params,
}: {
    params: Promise<{ id: string; ticketId: string }>;
}) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { addToCart } = useCart();

    const [ticket, setTicket] = useState<EventTicket | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedQuantity, setSelectedQuantity] = useState(1);

    useEffect(() => {
        const fetchTicket = async () => {
            try {
                // Fetching from the public endpoint
                const res = await fetch(`/api/tickets/${resolvedParams.ticketId}`);
                if (!res.ok) throw new Error("Failed to fetch ticket");
                const data = await res.json();
                setTicket(data);
            } catch (error) {
                console.error("Error fetching ticket:", error);
                toast.error("Failed to load ticket details");
            } finally {
                setLoading(false);
            }
        };

        fetchTicket();
    }, [resolvedParams.ticketId]);

    const handleAddToCart = () => {
        if (!ticket) return;

        for (let i = 0; i < selectedQuantity; i++) {
            addToCart({
                productId: ticket.id,
                productType: "TICKET",
                name: ticket.name,
                price: ticket.sellingPrice ?? ticket.price,
                originalPrice: ticket.price !== (ticket.sellingPrice ?? ticket.price) ? ticket.price : undefined,
                image: ticket.logo || undefined,
            });
        }
        toast.success(`${selectedQuantity} x ${ticket.name} added to cart!`);
        setSelectedQuantity(1);
    };

    const handleBuyNow = () => {
        handleAddToCart();
        router.push(`/event/${resolvedParams.id}/checkout`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-[#004aad]" />
                    <p className="text-gray-500">Loading ticket details...</p>
                </div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Ticket Not Found</h1>
                    <button
                        onClick={() => router.back()}
                        className="mt-4 text-[#004aad] hover:underline flex items-center justify-center gap-2"
                    >
                        <ArrowLeft size={16} /> Go Back
                    </button>
                </div>
            </div>
        );
    }

    const effectivePrice = ticket.sellingPrice ?? ticket.price;
    const hasDiscount = ticket.sellingPrice && ticket.sellingPrice < ticket.price;
    const discountPercentage = hasDiscount
        ? Math.round(((ticket.price - ticket.sellingPrice!) / ticket.price) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="mb-6 flex items-center text-sm font-medium text-gray-500 hover:text-[#004aad] transition-colors"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Event
                </button>

                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transform transition-all hover:shadow-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {/* Image Section */}
                        <div className="relative h-64 md:h-auto bg-gradient-to-br from-gray-50 to-blue-50/30 p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-gray-100">
                            {ticket.logo ? (
                                <img
                                    src={ticket.logo}
                                    alt={ticket.name}
                                    className="max-w-full max-h-full object-contain drop-shadow-xl transform hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center text-gray-400">
                                    <Ticket size={64} strokeWidth={1} />
                                    <span className="text-sm mt-3 font-medium">No Image Available</span>
                                </div>
                            )}
                            {hasDiscount && (
                                <div className="absolute top-4 right-4 bg-rose-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                                    {discountPercentage}% OFF
                                </div>
                            )}
                        </div>

                        {/* Details Section */}
                        <div className="p-8 flex flex-col justify-center">
                            <div className="mb-6">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">{ticket.name}</h1>
                                <div className="flex items-baseline gap-3 mt-4">
                                    <span className="text-5xl font-extrabold text-[#004aad] tracking-tight">
                                        ${effectivePrice.toLocaleString()}
                                    </span>
                                    {hasDiscount && (
                                        <span className="text-xl text-gray-400 line-through">
                                            ${ticket.price.toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {ticket.description && (
                                <div className="mb-8 p-5 bg-blue-50/50 rounded-xl border border-blue-100/50">
                                    <h3 className="text-xs font-bold text-[#004aad] uppercase tracking-widest mb-2">
                                        Description
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm">
                                        {ticket.description}
                                    </p>
                                </div>
                            )}

                            {ticket.features && ticket.features.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-xs font-bold text-[#004aad] uppercase tracking-widest mb-3">
                                        Includes
                                    </h3>
                                    <ul className="space-y-3">
                                        {ticket.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3 group">
                                                <div className="mt-1 min-w-[1.25rem] h-5 w-5 rounded-full bg-[#004aad]/10 group-hover:bg-[#004aad] transition-colors flex items-center justify-center flex-shrink-0">
                                                    <Check className="h-3 w-3 text-[#004aad] group-hover:text-white transition-colors" strokeWidth={3} />
                                                </div>
                                                <span className="text-gray-700 group-hover:text-gray-900 transition-colors">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
