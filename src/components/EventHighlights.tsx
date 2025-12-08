"use client";

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import Image from "next/image";
import Link from "next/link";

import "swiper/css";
import "swiper/css/navigation";

const events = [
    {
        image: "/images/h-Bangkok.jpg",
        title: "10th Innovative Global Logistics Allianz Annual conference",
        date: "Feb 2025",
        link: "#",
    },
    {
        image: "/images/h-vietnam.jpg",
        title: "9th Innovative Global Logistics Allianz Annual conference",
        date: "May 2024",
        link: "#",
    },
    {
        image: "/images/h-Bangkok1.jpg",
        title: "8th Innovative Global Logistics Allianz Annual conference",
        date: "Feb 2023",
        link: "#",
    },
    {
        image: "/images/h-malaysia.jpg",
        title: "7th Innovative Global Logistics Allianz Annual conference",
        date: "Apr 2019",
        link: "#",
    },
    {
        image: "/images/h-malaysia1.jpg",
        title: "6th Innovative Global Logistics Allianz Annual conference",
        date: "Apr 2018",
        link: "#",
    },
    {
        image: "/images/h-tailand.jpg",
        title: "5th Innovative Global Logistics Allianz Annual conference",
        date: "May 2017",
        link: "#",
    },
    {
        image: "/images/h-guangzhou.jpg",
        title: "4th Innovative Global Logistics Allianz Annual conference",
        date: "Sep 2016",
        link: "#",
    },
    {
        image: "/images/h-Bangkok2.jpg",
        title: "3rd Innovative Global Logistics Allianz Annual conference",
        date: "May 2015",
        link: "#",
    }
];

export default function EventHighlights() {
    return (
        <section className="py-20 bg-white overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="flex flex-col lg:flex-row items-center mb-12 text-center lg:text-left gap-8">
                    <div className="lg:w-5/12">
                        <span className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                            <span className="w-8 h-0.5 bg-[#5da765]"></span>
                            <span className="text-[#5da765] font-bold uppercase text-sm tracking-wider">Event Highlights</span>
                        </span>
                        <h3 className="text-3xl font-bold text-gray-900 leading-tight">
                            Real Partnerships. Real Results.
                        </h3>
                    </div>
                    <div className="lg:w-5/12">
                        <p className="text-gray-600">
                            At IGLA, we don't just connect freight forwarders we help them grow. Our members have formed lasting partnerships.
                        </p>
                    </div>
                    <div className="lg:w-2/12 flex justify-center lg:justify-end gap-2">
                        <div className="swiper-button-prev-custom w-10 h-10 border border-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 text-gray-800">
                            &lt;
                        </div>
                        <div className="swiper-button-next-custom w-10 h-10 border border-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 text-gray-800">
                            &gt;
                        </div>
                    </div>
                </div>

                <div className="">
                    <Swiper
                        modules={[Navigation, Autoplay]}
                        spaceBetween={30}
                        slidesPerView={1}
                        loop={true}
                        autoplay={{
                            delay: 4000,
                            disableOnInteraction: false,
                        }}
                        navigation={{
                            nextEl: '.swiper-button-next-custom',
                            prevEl: '.swiper-button-prev-custom',
                        }}
                        breakpoints={{
                            640: {
                                slidesPerView: 2,
                            },
                            768: {
                                slidesPerView: 3,
                            },
                            1024: {
                                slidesPerView: 4,
                            },
                        }}
                        className="mySwiper"
                    >
                        {events.map((event, index) => (
                            <SwiperSlide key={index}>
                                <div className="relative rounded-lg overflow-hidden group h-[400px]">
                                    <Image
                                        src={event.image}
                                        alt={event.title}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80"></div>
                                    <div className="absolute inset-0 p-6 flex flex-col justify-end text-white z-10">
                                        <h4 className="font-bold text-lg mb-1 leading-tight">{event.title}</h4>
                                        <p className="text-sm font-medium uppercase tracking-wider mb-2 text-gray-300">{event.date}</p>
                                        <Link href={event.link} className="text-sm font-bold uppercase border-b border-white/50 inline-block self-start hover:text-[#5da765] hover:border-[#5da765] transition-colors">
                                            Know More
                                        </Link>
                                    </div>
                                    <Link href={event.link} className="absolute inset-0 z-20"></Link>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>
        </section>
    );
}
