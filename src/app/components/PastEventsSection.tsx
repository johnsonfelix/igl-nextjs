"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, MapPin, Users } from "lucide-react";
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

export default function PastEventsSection() {
    const [events, setEvents] = useState<PastEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await fetch("/api/past-events");
            if (res.ok) {
                const data = await res.json();
                setEvents(data);
            }
        } catch (error) {
            console.error("Error fetching past events:", error);
        } finally {
            setLoading(false);
        }
    };

    if (events.length === 0 && !loading) return null;

    return (
        <section className="py-5 bg-gray-50 relative overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="flex flex-wrap items-center mb-12 text-center lg:text-left justify-between">
                    <div>
                        <span className="text-base text-[#004aad] font-semibold uppercase tracking-wider mb-2 block">Our Legacy</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 tracking-tight">Past Events & Conferences</h2>
                    </div>

                    <div className="hidden lg:flex gap-4">
                        <div className="past-prev w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center cursor-pointer hover:bg-[#004aad] hover:text-white hover:border-[#004aad] transition-all">
                            <ArrowRight className="w-5 h-5 rotate-180" />
                        </div>
                        <div className="past-next w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center cursor-pointer hover:bg-[#004aad] hover:text-white hover:border-[#004aad] transition-all">
                            <ArrowRight className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                <div className="relative group">
                    {/* Mobile Navigation Arrows */}
                    <div className="past-prev absolute top-[120px] left-4 z-20 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center cursor-pointer shadow-lg text-[#004aad] hover:bg-[#004aad] hover:text-white transition-all lg:hidden">
                        <ArrowRight className="w-5 h-5 rotate-180" />
                    </div>
                    <div className="past-next absolute top-[120px] right-4 z-20 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center cursor-pointer shadow-lg text-[#004aad] hover:bg-[#004aad] hover:text-white transition-all lg:hidden">
                        <ArrowRight className="w-5 h-5" />
                    </div>
                    <Swiper
                        modules={[Autoplay, Navigation, Pagination]}
                        spaceBetween={30}
                        slidesPerView={1}
                        loop={true}
                        navigation={{
                            nextEl: ".past-next",
                            prevEl: ".past-prev",
                        }}
                        autoplay={{
                            delay: 4000,
                            disableOnInteraction: false,
                        }}
                        breakpoints={{
                            640: { slidesPerView: 2 },
                            1024: { slidesPerView: 3 },
                        }}
                        className="pb-12"
                    >
                        {events.map((event) => (
                            <SwiperSlide key={event.id}>
                                <Link href={`/past-events/${event.id}`} className="group block h-full">
                                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col border border-gray-100">
                                        <div className="relative h-60 overflow-hidden">
                                            <Image
                                                src={event.mainImage}
                                                alt={event.title}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                                <span className="text-white font-semibold flex items-center gap-2">
                                                    View Details <ArrowRight className="w-4 h-4" />
                                                </span>
                                            </div>
                                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-[#004aad] shadow-sm">
                                                {event.date}
                                            </div>
                                        </div>

                                        <div className="p-6 flex flex-col flex-1">
                                            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#004aad] transition-colors line-clamp-2">
                                                {event.title}
                                            </h3>

                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <MapPin className="w-4 h-4 mr-2 text-[#004aad]" />
                                                    {event.place}
                                                </div>
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Users className="w-4 h-4 mr-2 text-[#004aad]" />
                                                    {event.membersAttended} Members Attended
                                                </div>
                                            </div>

                                            <p className="text-gray-600 text-sm line-clamp-2 mb-4 flex-1">
                                                {event.description}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>
        </section>
    );
}
