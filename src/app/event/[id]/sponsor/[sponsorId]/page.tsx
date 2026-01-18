"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart, Check, Image as ImageIcon, Loader2 } from "lucide-react";
import { useCart } from "@/app/event/[id]/CartContext";
import toast from "react-hot-toast";

interface SponsorType {
    id: string;
    name: string;
    image: string | null;
    price: number;
    description: string | null;
    features: string[];
}

export default function SponsorDetailsPage({
    params,
}: {
    params: Promise<{ id: string; sponsorId: string }>;
}) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { addToCart } = useCart();

    const [sponsor, setSponsor] = useState<SponsorType | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSponsor = async () => {
            try {
                // Fetching from the public endpoint
                const res = await fetch(`/api/sponsors/${resolvedParams.sponsorId}`);
                if (!res.ok) throw new Error("Failed to fetch sponsor");
                const data = await res.json();
                setSponsor(data);

            } catch (error) {
                console.error("Error fetching sponsor:", error);
                toast.error("Failed to load sponsor details");
            } finally {
                setLoading(false);
            }
        };

        fetchSponsor();
    }, [resolvedParams.sponsorId]);

    const handleAddToCart = () => {
        if (!sponsor) return;

        addToCart({
            productId: sponsor.id,
            productType: "SPONSOR",
            name: sponsor.name,
            price: sponsor.price,
            originalPrice: sponsor.price, // Sponsor discount logic usually handled in cart/context, sending base here
            image: sponsor.image || undefined,
        });

        // Check for free tickets logic (client-side simple check for notification, actual logic in context/backend)
        let freeTicketsMsg = "";
        const sName = sponsor.name.toLowerCase();
        if (sName.includes("title sponsor")) freeTicketsMsg = " (Includes 3 Free Tickets!)";
        else if (sName.includes("gala dinner") || sName.includes("welcome cocktail")) freeTicketsMsg = " (Includes 2 Free Tickets!)";
        else if (sName.includes("t shirts") || sName.includes("t-shirt")) freeTicketsMsg = " (Includes 1 Free Ticket!)";

        toast.success(`${sponsor.name} added to cart!${freeTicketsMsg}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                    <p className="text-gray-500">Loading sponsor details...</p>
                </div>
            </div>
        );
    }

    if (!sponsor) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Sponsor Package Not Found</h1>
                    <button
                        onClick={() => router.back()}
                        className="mt-4 text-emerald-600 hover:underline flex items-center justify-center gap-2"
                    >
                        <ArrowLeft size={16} /> Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="mb-6 flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Event
                </button>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {/* Image Section */}
                        <div className="relative h-64 md:h-auto bg-gray-50 p-8 flex items-center justify-center border-r border-gray-100">
                            {sponsor.image ? (
                                <img
                                    src={sponsor.image}
                                    alt={sponsor.name}
                                    className="max-w-full max-h-full object-contain drop-shadow-sm"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center text-gray-300">
                                    <ImageIcon size={64} strokeWidth={1} />
                                    <span className="text-sm mt-3 font-medium">No Image Available</span>
                                </div>
                            )}
                        </div>

                        {/* Details Section */}
                        <div className="p-8 flex flex-col">
                            <div className="mb-6">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">{sponsor.name}</h1>
                                <div className="flex items-baseline gap-3 mt-4">
                                    <span className="text-4xl font-bold text-emerald-600">
                                        ${sponsor.price.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {sponsor.description && (
                                <div className="mb-8 p-5 bg-gray-50 rounded-xl border border-gray-100">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                                        Package Details
                                    </h3>
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                        {sponsor.description}
                                    </p>
                                </div>
                            )}

                            {sponsor.features && sponsor.features.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                                        Includes
                                    </h3>
                                    <ul className="space-y-3">
                                        {sponsor.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3 text-gray-700">
                                                <div className="mt-0.5 min-w-[1.25rem] h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                                    <Check className="h-3 w-3 text-emerald-600" strokeWidth={3} />
                                                </div>
                                                <span className="text-sm font-medium">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* <div className="mt-auto pt-6 border-t border-gray-100">
                                <button
                                    onClick={handleAddToCart}
                                    className="flex items-center justify-center gap-2 w-full py-4 px-6 bg-[#004aad] text-white font-bold rounded-xl hover:bg-[#00317a] shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
                                >
                                    <ShoppingCart size={20} />
                                    Add Sponsorship to Cart
                                </button>
                            </div> */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
