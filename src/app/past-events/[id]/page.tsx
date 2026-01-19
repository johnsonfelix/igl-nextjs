"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Calendar, MapPin, Users, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface PastEvent {
    id: string;
    title: string;
    place: string;
    date: string;
    membersAttended: number;
    description: string;
    mainImage: string;
    carouselImages: string[];
}

export default function PastEventDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [event, setEvent] = useState<PastEvent | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchEvent();
        }
    }, [id]);

    const fetchEvent = async () => {
        try {
            const res = await fetch(`/api/admin/past-events/${id}`);
            if (res.ok) {
                const data = await res.json();
                setEvent(data);
            } else {
                console.error("Failed to fetch event");
                // router.push("/404"); // Optional: Redirect to 404
            }
        } catch (error) {
            console.error("Error fetching event:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Event Not Found</h1>
                <Link href="/" className="text-blue-600 hover:underline">
                    Return to Homepage
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Header / Hero Section */}
            <div className="relative h-[60vh] w-full bg-gray-900">
                <Image
                    src={event.mainImage}
                    alt={event.title}
                    fill
                    className="object-cover opacity-60"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />

                <div className="absolute inset-0 flex flex-col justify-end container mx-auto px-4 pb-16">
                    <Link
                        href="/"
                        className="absolute top-8 left-4 md:left-8 text-white/80 hover:text-white flex items-center gap-2 bg-black/20 hover:bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>

                    <div className="max-w-4xl animate-fade-in-up">
                        <div className="flex flex-wrap gap-4 mb-4 text-sm font-bold text-white/90 uppercase tracking-wider">
                            <span className="bg-blue-600 px-3 py-1 rounded-md">{event.date}</span>
                            <span className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1 rounded-md">
                                <MapPin className="w-4 h-4" /> {event.place}
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                            {event.title}
                        </h1>
                        <div className="flex items-center gap-3 text-xl text-gray-200">
                            <Users className="w-6 h-6 text-blue-400" />
                            <span className="font-medium">{event.membersAttended}+ Attendees</span>
                        </div>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 py-16">
                <div className="grid lg:grid-cols-3 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* Description */}
                        <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <span className="w-1 h-8 bg-blue-600 rounded-full"></span>
                                About the Event
                            </h2>
                            <div className="prose prose-lg text-gray-600 leading-relaxed whitespace-pre-line">
                                {event.description}
                            </div>
                        </section>

                        {/* Gallery */}
                        {event.carouselImages && event.carouselImages.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                                    <span className="w-1 h-8 bg-purple-600 rounded-full"></span>
                                    Event Gallery
                                    <span className="text-sm font-normal text-gray-500 ml-auto flex items-center gap-1">
                                        <ImageIcon className="w-4 h-4" /> {event.carouselImages.length} Photos
                                    </span>
                                </h2>

                                <Swiper
                                    modules={[Navigation, Pagination, Autoplay]}
                                    spaceBetween={20}
                                    slidesPerView={1}
                                    navigation
                                    pagination={{ clickable: true }}
                                    autoplay={{ delay: 5000 }}
                                    breakpoints={{
                                        640: { slidesPerView: 2 },
                                    }}
                                    className="rounded-2xl shadow-lg"
                                >
                                    {event.carouselImages.map((img, idx) => (
                                        <SwiperSlide key={idx} className="relative aspect-[4/3] cursor-pointer group">
                                            <div className="relative w-full h-full overflow-hidden rounded-xl">
                                                <Image
                                                    src={img}
                                                    alt={`Gallery ${idx + 1}`}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            </div>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>

                                {/* Grid View for detailed look */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                                    {event.carouselImages.slice(0, 6).map((img, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                                            <Image
                                                src={img}
                                                alt={`Thumb ${idx}`}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    ))}
                                    {event.carouselImages.length > 6 && (
                                        <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center text-gray-500 font-medium">
                                            +{event.carouselImages.length - 6} more
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        {/* Event Quick Facts */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Event Highlights</h3>

                            <ul className="space-y-6">
                                <li className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <span className="block text-sm text-gray-500 mb-1">Date</span>
                                        <span className="font-semibold text-gray-900">{event.date}</span>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <span className="block text-sm text-gray-500 mb-1">Location</span>
                                        <span className="font-semibold text-gray-900">{event.place}</span>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <span className="block text-sm text-gray-500 mb-1">Participation</span>
                                        <span className="font-semibold text-gray-900">{event.membersAttended} Members</span>
                                    </div>
                                </li>
                            </ul>

                            <div className="mt-8 pt-8 border-t border-gray-100">
                                <h4 className="font-semibold text-gray-900 mb-4">Want to join our next event?</h4>
                                <Link
                                    href="/link-up"
                                    className="block w-full bg-[#004aad] text-white text-center font-bold py-3 rounded-xl hover:bg-[#003882] transition-colors"
                                >
                                    View Upcoming Events
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
