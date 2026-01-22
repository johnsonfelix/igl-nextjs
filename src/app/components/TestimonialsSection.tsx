"use client";

import { MessageCircle, Star, Quote } from "lucide-react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

const TESTIMONIALS = [
    {
        id: "1",
        name: "FABIAN VAN DONK",
        role: "GFM",
        description: "We joined Thailand 2017 & Malaysia 2018. 2017 was our first annual meeting and we had meet good agents & people. For GFM 2018 was more that we want to establish a stable agency network and we want to use IGLA partners and that they will use us GFM. We found good partners in the network.",
        image: "/images/testimonial-1.jpg"
    },
    {
        id: "2",
        name: "BINISH",
        role: "Trelog",
        description: "As a person fortunate enough to attend many large global conferences viz FIATA, WCA etc every year I can say IGLA is one of the best interactive, well organized & well focused freight forwarding Network conferences. As a comparatively small group, participants can interact very closely & able to build up good personal and biz relationship among IGLA colleagues",
        image: "/images/testimonial-2.jpg"
    },
    {
        id: "3",
        name: "MARLOND ANTUNEZ",
        role: "CNW America Representations",
        description: "I participated in IGLA annual conference on 2017 and it was a marvelous experience!! Meet people from far away with the same targets and objectives generates a synergy of business and cooperativeness that enhance the excellence of this great conference.",
        image: "/images/testimonial-3.jpg"
    },
    {
        id: "4",
        name: "FRANCISCO GARCIA",
        role: "Total Freight Worldwide",
        description: "I have participated in the last two conferences and the truth is that they have been very fruitful, first because I have known agents with important potential with whom I am currently working.",
        image: "/images/testimonial-4.jpg"
    }
];

export default function TestimonialsSection() {
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
                            global partners.
                        </h2>
                    </div>

                    {/* Right Side - Testimonial Slider */}
                    <div className="relative">
                        <Swiper
                            modules={[Autoplay, Navigation, Pagination, EffectFade]}
                            spaceBetween={30}
                            slidesPerView={1}
                            effect="fade"
                            fadeEffect={{ crossFade: true }}
                            loop={true}
                            autoplay={{
                                delay: 5000,
                                disableOnInteraction: false,
                            }}
                            pagination={{
                                clickable: true,
                                bulletClass: 'swiper-pagination-bullet !bg-white !opacity-50',
                                bulletActiveClass: 'swiper-pagination-bullet-active !opacity-100 !bg-[#c6ff00]'
                            }}
                            className="!overflow-visible"
                        >
                            {TESTIMONIALS.map((testimonial) => (
                                <SwiperSlide key={testimonial.id}>
                                    <div className="h-[400px] relative w-full flex items-center justify-center transition-transform hover:scale-105 duration-300">
                                        <Image
                                            src={testimonial.image}
                                            alt={testimonial.name}
                                            fill
                                            className="object-contain drop-shadow-2xl rounded-2xl"
                                            sizes="(max-width: 640px) 100vw, 50vw"
                                        />
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                </div>
            </div>
        </section>
    );
}
