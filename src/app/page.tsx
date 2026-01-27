"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import {
  ArrowRight,
  Shield,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ThumbsUp,
  Box,
  CheckCircle,
  Users,
  MapPin,
} from "lucide-react";
import EventCountdown from "@/components/EventCountdown";
import TestimonialsSection from "./components/TestimonialsSection";
import LatestInquiriesSection from "./components/LatestInquiriesSection";
import SponsorshipBenefitsSection from "./components/SponsorshipBenefitsSection";
import PastEventsSection from "./components/PastEventsSection";
import ScrollingTextSection from "./components/ScrollingTextSection";
import PopupAd from "./components/PopupAd";
import { useAuth } from "@/app/context/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const [openAccordion, setOpenAccordion] = useState<string | null>("item1");

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const bannerSlides = [
    {
      id: 1,
      bgImage: "/images/bg-4.jpg",
      leftImage: "/images/left-carousel-igla.jpg",
      welcome: "Welcome to IGLA",
      title1: "11th ANNUAL",
      title2: "Link Up",
      title3: "CONFERENCE 2026",
      desc: "",
      separator: true,
      link: "/event/cmjn1f6ih0000gad4xa4j7dp3"
    },
    {
      id: 2,
      bgImage: "/images/bg-2.jpg",
      leftImage: "/images/demo-green-energy-slider-left-01.jpg",
      welcome: "Welcome to IGLA",
      title1: "EARLY BIRD OFFER",
      title2: "Connect.",
      title3: "UPTO 50% OFF",
      desc: "",
      separator: true,
      link: "/event/cmjn1f6ih0000gad4xa4j7dp3"
    },
    // {
    //   id: 3,
    //   bgImage: "/images/bg-1.jpg",
    //   leftImage: "/images/demo-green-energy-slider-left-01.jpg", // Reusing potentially same bg for left side based on HTML
    //   welcome: "Welcome to IGLA",
    //   title1: "Sponsorship",
    //   title2: "Forwarders",
    //   title3: "Opportunity",
    //   desc: "",
    //   separator: true,
    //   link: "/membership/become-member"
    // }
  ];

  const teamMembers = [
    { id: 2, img: '/images/Member2.png' },
    { id: 3, img: '/images/Member3.jpg' },
    { id: 4, img: '/images/Member4.jpg' },
    { id: 5, img: '/images/Member5.jpg' },
    { id: 6, img: '/images/Member6.png' },
    { id: 7, img: '/images/Member7.png' },
    // Duplicate 1
    { id: 22, img: '/images/Member2.png' },
    { id: 33, img: '/images/Member3.jpg' },
    { id: 44, img: '/images/Member4.jpg' },
    { id: 55, img: '/images/Member5.jpg' },
    { id: 66, img: '/images/Member6.png' },
    { id: 77, img: '/images/Member7.png' },
    // Duplicate 2
    { id: 222, img: '/images/Member2.png' },
    { id: 333, img: '/images/Member3.jpg' },
    { id: 444, img: '/images/Member4.jpg' },
    { id: 555, img: '/images/Member5.jpg' },
    { id: 666, img: '/images/Member6.png' },
    { id: 777, img: '/images/Member7.png' },
  ];

  const conferenceHighlights = [
    { year: "2013", location: "Shanghai", description: "The foundation of trusted global connections was laid here." },
    { year: "2014", location: "Vietnam", description: "New partnerships began as members expanded their reach together." },
    { year: "2015", location: "Bangkok", description: "Stronger collaboration led to smarter logistics solutions worldwide." },
    { year: "2016", location: "Guangzhou", description: "Diverse minds united under one roof to spark new opportunities." },
    { year: "2017", location: "Thailand", description: "Celebrating mutual growth through meaningful business relationships." },
    { year: "2018", location: "Malaysia", description: "A global exchange of ideas, deals, and long-term partnerships." },
    { year: "2019", location: "Malaysia", description: "Creating value through trust, teamwork, and global cooperation." },
    { year: "2023", location: "Bangkok", description: "Members came together to expand borders and build futures." },
    { year: "2024", location: "Vietnam", description: "Driving progress in logistics through strategic collaboration." },
    { year: "2025", location: "Bangkok", description: "Marking a decade of excellence, unity, and global success." },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      <PopupAd />
      <main>
        {/* Banner Section with Swiper */}
        <section className="relative overflow-hidden bg-gray-100">
          <Swiper
            modules={[Autoplay, Navigation, Pagination, EffectFade]}
            effect="slide"
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            loop={true}
            pagination={{ clickable: true }}
            navigation={{
              nextEl: ".swiper-button-next-custom",
              prevEl: ".swiper-button-prev-custom",
            }}
            className="h-auto lg:h-[calc(100vh-120px)] min-h-auto md:min-h-[100vh] lg:min-h-[600px] w-full group"
          >
            {bannerSlides.map((slide) => (
              <SwiperSlide key={slide.id}>
                <div className="h-full w-full flex flex-col-reverse lg:flex-row">
                  {/* Left Side (Text) - Bottom on mobile */}
                  <div className="w-full lg:w-5/12 relative flex-1 bg-white lg:bg-transparent -mt-8 lg:mt-0 z-10 rounded-t-3xl lg:rounded-none">
                    <div className="absolute inset-0 hidden lg:block">
                      <Image
                        src={slide.leftImage}
                        alt="Banner Background"
                        fill
                        className="object-cover"
                      />

                    </div>
                    <div className="relative z-10 h-full flex flex-col justify-center px-6 py-12 lg:px-16 text-gray-900 lg:text-white">
                      <span className="text-sm tracking-widest uppercase border-b-2 border-white/30 inline-block mb-6 pb-1 w-fit">
                        {slide.welcome}
                      </span>
                      <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold leading-tight mb-6 lg:mb-8">
                        {slide.title1}<br />
                        {/* <span className="relative">
                          {slide.title2}
                          {slide.separator && (
                            <Image
                              src="/images/demo-green-energy-highlight-separator.svg"
                              alt=""
                              width={200}
                              height={20}
                              className="absolute -bottom-2 left-0 w-full -z-10"
                            />
                          )}
                        </span><br /> */}
                        {slide.title3}
                      </h1>
                      <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                        <Link href={slide.link || "/membership/become-member"} className="bg-[#004aad] lg:bg-white text-white lg:text-black px-6 py-3 lg:px-8 lg:py-4 rounded-full font-bold shadow-lg hover:bg-[#003882] lg:hover:bg-gray-50 flex items-center justify-center gap-2 transition-transform hover:scale-105">
                          <ThumbsUp className="w-5 h-5" />
                          Register Now
                        </Link>
                        {/* <Link href="/event/list" className="text-[#004aad] lg:text-white border border-[#004aad]/30 lg:border-white/50 px-6 py-3 lg:px-8 lg:py-4 rounded-full font-bold hover:bg-[#004aad]/5 lg:hover:bg-white/10 flex items-center justify-center gap-2 transition-transform hover:scale-105">
                          View services
                          <Box className="w-5 h-5" />
                        </Link> */}
                      </div>
                    </div>
                  </div>

                  {/* Right Side (Image) - Top on mobile */}
                  <div className="w-full lg:w-7/12 relative h-[50vh] lg:h-full">
                    <Image
                      src={slide.bgImage}
                      alt="Banner Image"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Custom Navigation Buttons */}
          <div className="swiper-button-prev-custom absolute left-4 top-1/2 z-10 -translate-y-1/2 cursor-pointer text-white/70 hover:text-white transition-all hidden md:flex items-center justify-center hover:scale-125">
            <ChevronLeft className="w-10 h-10" />
          </div>
          <div className="swiper-button-next-custom absolute right-4 top-1/2 z-10 -translate-y-1/2 cursor-pointer text-white/70 hover:text-white transition-all hidden md:flex items-center justify-center hover:scale-125">
            <ChevronRight className="w-10 h-10" />
          </div>

          {/* Next Event Countdown Section - Moved inside Hero for absolute positioning */}
          <div className="hidden lg:block lg:absolute lg:bottom-10 lg:right-10 z-20 w-full lg:w-auto px-4 lg:px-0 mt-4 lg:mt-0 lg:max-w-xs 2xl:max-w-2xl">
            <div className="bg-[#004aad] rounded-xl p-4 lg:p-3 2xl:p-8 text-white shadow-lg relative overflow-hidden animate-fadeIn">
              {/* Background Pattern */}
              <div className="absolute right-0 bottom-0 h-full w-1/3 opacity-10 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                </svg>
              </div>

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-3 lg:gap-3 2xl:gap-8 text-center md:text-left">
                <div>
                  <span className="inline-block py-0.5 px-2 lg:px-2 rounded bg-white/20 text-[9px] lg:text-[9px] 2xl:text-xs font-bold uppercase tracking-widest mb-2 2xl:mb-3 backdrop-blur-sm border border-white/10">
                    Next Event
                  </span>
                  <h3 className="text-lg lg:text-base 2xl:text-3xl font-bold mb-2">
                    The 20th Global Freight<br />Forwarders Conference
                  </h3>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-white/80 text-[10px] lg:text-[10px] 2xl:text-sm">
                    <MapPin className="w-3 h-3 2xl:w-4 2xl:h-4" /> Shanghai, China
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2 2xl:gap-4">
                  <div className="text-[9px] lg:text-[9px] 2xl:text-sm uppercase tracking-widest font-bold opacity-80">Event Starts In</div>
                  <EventCountdown targetDate="2026-03-25T00:00:00.000Z" size="compact" />
                  <Link
                    href="/event/cmjn1f6ih0000gad4xa4j7dp3"
                    className="mt-2 text-xs lg:text-[10px] 2xl:text-base lg:mt-2 2xl:mt-4 bg-white text-[#004aad] px-4 py-1.5 lg:px-4 lg:py-1.5 2xl:px-8 2xl:py-3 rounded-full font-bold shadow-lg hover:bg-gray-100 transition-colors whitespace-nowrap"
                  >
                    Register Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sign In Banner */}

        {/* Sponsorship Benefits Section */}
        <SponsorshipBenefitsSection />

        {/* About Us Section Hidden */}

        {/* Why Choose Us Section Hidden */}



        <ScrollingTextSection />



        {/* Past Events Section */}
        <PastEventsSection />



        {/* Testimonials Section */}
        <TestimonialsSection />

        {/* Latest Inquiries Section */}
        <LatestInquiriesSection />



        {/* Why Choose IGLA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-10 bg-[#004aad] rounded-full"></div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Why Choose IGLA</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: "Verified Network", desc: "All members are carefully vetted and verified to ensure quality and reliability" },
                { title: "Global Coverage", desc: "Access to logistics partners in major ports and cities worldwide" },
                { title: "Competitive Rates", desc: "Benefit from collective negotiating power and volume discounts" },
                { title: "24/7 Support", desc: "Round-the-clock assistance for urgent shipments and inquiries" },
                { title: "Technology Platform", desc: "Modern digital tools for communication, and collaboration" },
                { title: "Risk Management", desc: "Comprehensive vetting and monitoring to minimize business risks" }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#004aad]/20 transition-all">
                  <div className="w-8 h-8 bg-[#004aad] rounded-full flex items-center justify-center shrink-0 mt-1">
                    <CheckCircle size={18} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg mb-2">{item.title}</h4>
                    <p className="text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Financial Protection Section */}
        <section className="py-20 bg-[#f9f9f9]">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 mb-12">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-8 h-[2px] bg-primary"></span>
                  <span className="text-primary font-bold uppercase text-sm tracking-widest">Financial Protection</span>
                </div>
                <h3 className="text-3xl font-bold">Up to $20,000 Annual Financial Protection</h3>
              </div>
              <div>
                <p className="text-gray-600">IGLA provides up to USD 20,000 coverage per year, with a maximum claim of USD 5,000 per Gold Member, helping safeguard your business from losses due to unpaid invoices.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                { title: "Smart Risk Prevention", desc: "IGLA reduces risk with strict member screening, required signed agreements, and a valid protection policy window." },
                { title: "Dedicated Dispute Support", desc: "Get timely help with our 1-on-1 dispute support team. We respond within 24 hours." },
                { title: "Reliable Financial Coverage", desc: "Our Payment Protection Plan (PPP) covers unpaid invoices caused by bankruptcy or insolvency." },
                { title: "Transparent Claim Guidelines", desc: "IGLA offers a clear and fair claim process with defined rules for documentation and timelines." }
              ].map((item, i) => (
                <div key={i} className="bg-[#f0f9f3] p-8 rounded-lg group hover:shadow-lg transition-all duration-300">
                  <h4 className="font-bold text-lg mb-3">{item.title}</h4>
                  <p className="text-gray-600 text-sm mb-6 leading-relaxed">{item.desc}</p>
                  <Link href="/membership/become-member" className="inline-flex items-center bg-primary text-white px-6 py-3 rounded-full font-bold uppercase text-xs shadow-md hover:bg-green-700 transition-colors">
                    <Shield className="w-4 h-4 mr-2" /> Become a Member
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Members Section */}
        <section className="py-20 bg-white" style={{ backgroundImage: "url('/images/demo-it-business-testimonial-bg.png')", backgroundRepeat: 'no-repeat', backgroundPosition: 'center top' }}>
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-medium mb-12">Our Team <span className="font-bold border-b-4 border-primary">Members</span></h2>
            <Swiper
              modules={[Autoplay]}
              spaceBetween={30}
              slidesPerView={2}
              loop={true}
              autoplay={{
                delay: 2500,
                disableOnInteraction: false,
              }}
              breakpoints={{
                640: {
                  slidesPerView: 3,
                },
                768: {
                  slidesPerView: 4,
                },
                1024: {
                  slidesPerView: 6,
                },
              }}
              className="w-full py-8"
            >
              {teamMembers.map((member) => (
                <SwiperSlide key={member.id}>
                  <div className="p-4 flex items-center justify-center h-32 transition-transform duration-300 hover:scale-110 grayscale hover:grayscale-0">
                    <Image
                      src={member.img}
                      alt={`Member ${member.id}`}
                      width={120}
                      height={120}
                      className="max-h-full w-auto object-contain"
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>

      </main>
    </div>
  );
}
