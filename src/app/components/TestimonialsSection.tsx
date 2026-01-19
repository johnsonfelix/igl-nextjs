"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, MessageCircle, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Testimonial {
    id: string;
    name: string;
    role: string;
    description: string;
    rating: number;
    image: string | null;
}

export default function TestimonialsSection() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTestimonials();
    }, []);

    // Auto-slide every 5 seconds
    useEffect(() => {
        if (testimonials.length === 0) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % testimonials.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [testimonials.length]);

    const fetchTestimonials = async () => {
        try {
            const res = await fetch("/api/testimonials");
            if (res.ok) {
                const data = await res.json();
                setTestimonials(data);
            }
        } catch (error) {
            console.error("Error fetching testimonials:", error);
        } finally {
            setLoading(false);
        }
    };

    const goToPrevious = () => {
        setCurrentIndex((prev) =>
            prev === 0 ? testimonials.length - 1 : prev - 1
        );
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    };

    if (loading || testimonials.length === 0) return null;

    const currentTestimonial = testimonials[currentIndex];

    return (
        <section className="py-20 bg-gradient-to-br from-[#2d5a4a] via-[#1e3d32] to-[#2d5a4a] relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            </div>

            <div className="container mx-auto px-4 md:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
                    {/* Left Side - Text */}
                    <div>
                        <div className="inline-flex items-center gap-2 bg-[#c6ff00] rounded-full px-4 py-2 mb-6">
                            <MessageCircle className="text-gray-800" size={18} />
                            <span className="text-gray-800 font-medium text-sm">feedback</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                            Trusted by
                            <br />
                            genius people.
                        </h2>
                        {/* <p className="text-gray-300 text-base max-w-md">
                            Lorem ipsum dolor sit amet consectetur adipiscing elit venenatis dictum nec.
                        </p> */}
                    </div>

                    {/* Right Side - Testimonial Card with Navigation */}
                    <div className="relative">
                        {/* Navigation Arrows */}
                        <button
                            onClick={goToPrevious}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 md:-translate-x-16 z-20 bg-white rounded-full p-3 shadow-lg hover:scale-110 transition-transform"
                            aria-label="Previous testimonial"
                        >
                            <ChevronLeft size={20} className="text-gray-800" />
                        </button>

                        <button
                            onClick={goToNext}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 md:translate-x-16 z-20 bg-white rounded-full p-3 shadow-lg hover:scale-110 transition-transform"
                            aria-label="Next testimonial"
                        >
                            <ChevronRight size={20} className="text-gray-800" />
                        </button>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentTestimonial.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.4 }}
                                className="bg-white rounded-2xl overflow-hidden shadow-2xl"
                            >
                                <div className="grid sm:grid-cols-[45%_55%] min-h-[350px]">
                                    {/* Person Image */}
                                    {currentTestimonial.image && (
                                        <div className="relative bg-gradient-to-br from-gray-100 to-gray-50">
                                            <img
                                                src={currentTestimonial.image}
                                                alt={currentTestimonial.name}
                                                className="w-full h-full object-cover object-center"
                                            />
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="p-8 flex flex-col justify-center">
                                        {/* Star Rating Badge */}
                                        <div className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full px-4 py-2 w-fit mb-6">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={14}
                                                    className="fill-white text-white"
                                                />
                                            ))}
                                        </div>

                                        {/* Testimonial Text */}
                                        <p className="text-gray-600 text-sm leading-relaxed mb-6">
                                            {currentTestimonial.description}
                                        </p>

                                        {/* Author Info */}
                                        <div>
                                            <h4 className="text-gray-900 font-bold text-base">
                                                {currentTestimonial.name}
                                            </h4>
                                            <p className="text-gray-500 text-sm mt-1">
                                                {currentTestimonial.role}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
}
