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
      title1: "11th",
      title2: "Link Up",
      title3: "ANNUAL CONFERENCE 2026",
      desc: "",
      separator: true
    },
    {
      id: 2,
      bgImage: "/images/bg-2.jpg",
      leftImage: "/images/demo-green-energy-slider-left-01.jpg",
      welcome: "Welcome to IGLA",
      title1: "Early Bird",
      title2: "Connect.",
      title3: "Offer",
      desc: "",
      separator: true
    },
    {
      id: 3,
      bgImage: "/images/bg-1.jpg",
      leftImage: "/images/demo-green-energy-slider-left-01.jpg", // Reusing potentially same bg for left side based on HTML
      welcome: "Welcome to IGLA",
      title1: "Sponsorship",
      title2: "Forwarders",
      title3: "Opportunity",
      desc: "",
      separator: true
    }
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
            className="h-[calc(100vh-120px)] min-h-[600px] w-full group"
          >
            {bannerSlides.map((slide) => (
              <SwiperSlide key={slide.id}>
                <div className="h-full w-full flex flex-col lg:flex-row">
                  {/* Left Side (Text) */}
                  <div className="lg:w-5/12 relative h-[500px] lg:h-full">
                    <div className="absolute inset-0">
                      <Image
                        src={slide.leftImage}
                        alt="Banner Background"
                        fill
                        className="object-cover"
                      />

                    </div>
                    <div className="relative z-10 h-full flex flex-col justify-center px-8 lg:px-16 text-white">
                      <span className="text-sm tracking-widest uppercase border-b-2 border-white/30 inline-block mb-6 pb-1 w-fit">
                        {slide.welcome}
                      </span>
                      <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-8">
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
                      <div className="flex flex-wrap gap-4">
                        <Link href="/membership/become-member" className="bg-white text-black px-8 py-4 rounded-full font-bold shadow-lg hover:bg-gray-50 flex items-center gap-2 transition-transform hover:scale-105">
                          <ThumbsUp className="w-5 h-5" />
                          Discover more
                        </Link>
                        <Link href="/event/list" className="text-white border border-white/50 px-8 py-4 rounded-full font-bold hover:bg-white/10 flex items-center gap-2 transition-transform hover:scale-105">
                          View services
                          <Box className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Right Side (Image) */}
                  <div className="lg:w-7/12 relative h-[300px] lg:h-full">
                    <Image
                      src={slide.bgImage}
                      alt="Banner Image"
                      fill
                      className="object-cover"
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

          {/* Floating Popup Box */}
          <div className="hidden md:flex absolute bottom-0 right-4 lg:right-16 z-20 w-[380px] bg-white rounded-t-3xl shadow-2xl animate-fade-in-up">
            <div className="w-full p-8 flex flex-col justify-center text-center">
              <h3 className="text-2xl font-normal leading-tight text-gray-900 mb-6">
                Connecting You to <br />
                Partners <span className="font-bold">Across the World.</span>
              </h3>
              <div className="w-full">
                <Link
                  href="/event/cmjn1f6ih0000gad4xa4j7dp3"
                  className="block w-full bg-[#004aad] hover:bg-[#003882] text-white font-bold py-3 rounded-full text-center transition-colors shadow-md"
                >
                  Register Now
                </Link>
              </div>
              <p className="text-[11px] text-gray-500 mt-3">*Your Global Logistics Partner Awaits.</p>
            </div>
          </div>
        </section>

        {/* Sign In Banner */}
        {!user && (
          <div className="container mx-auto px-4 my-8">
            <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden animate-fadeIn">
              <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                <div>
                  <h3 className="text-2xl font-bold mb-2 flex items-center justify-center md:justify-start gap-2">
                    <span>💎</span> Sign in to get 50% OFF Sponsorships
                  </h3>
                  <p className="text-white/90">
                    Exclusive offer for members. Log in now to unlock special pricing and benefits.
                  </p>
                </div>
                <Link href="/company/login">
                  <button className="bg-white text-teal-700 hover:bg-gray-50 px-8 py-3 rounded-lg font-bold shadow-md transition-all transform hover:scale-105 hover:shadow-xl whitespace-nowrap">
                    Sign In Now
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* About Us Section Hidden */}

        {/* Why Choose Us Section Hidden */}

        {/* Why Partner with IGLA (Accordion) */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <Image src="/images/why-partner-with-us.jpg" alt="Why Partner" width={600} height={500} className="rounded-lg shadow-lg w-[64%] mx-auto block" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-8 h-[2px] bg-primary"></span>
                  <span className="text-primary font-bold uppercase text-sm tracking-widest">Why Partner with IGLA?</span>
                </div>
                <h3 className="text-3xl font-bold mb-8">Unlock Global Business Potential</h3>

                <div className="space-y-4">
                  {/* Accordion Item 1 */}
                  <div className={`border rounded-lg overflow-hidden transition-all ${openAccordion === 'item1' ? 'shadow-md' : ''}`}>
                    <button
                      onClick={() => toggleAccordion('item1')}
                      className={`w-full flex justify-between items-center p-4 font-bold text-left text-lg ${openAccordion === 'item1' ? 'bg-white text-gray-900' : 'bg-gray-50 text-gray-600'}`}
                    >
                      Find Trusted Logistics Experts Worldwide
                      {openAccordion === 'item1' ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    {openAccordion === 'item1' && (
                      <div className="p-4 bg-white text-gray-600 text-sm leading-relaxed border-t">
                        Access a carefully vetted community of professionals across five continents no more searching blindly or risking unreliable partnerships.
                      </div>
                    )}
                  </div>

                  {/* Accordion Item 2 */}
                  <div className={`border rounded-lg overflow-hidden transition-all ${openAccordion === 'item2' ? 'shadow-md' : ''}`}>
                    <button
                      onClick={() => toggleAccordion('item2')}
                      className={`w-full flex justify-between items-center p-4 font-bold text-left text-lg ${openAccordion === 'item2' ? 'bg-white text-gray-900' : 'bg-gray-50 text-gray-600'}`}
                    >
                      Tailored Expertise for Every Logistics Need
                      {openAccordion === 'item2' ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    {openAccordion === 'item2' && (
                      <div className="p-4 bg-white text-gray-600 text-sm leading-relaxed border-t">
                        From air and sea freight to specialized cargo, our members offer niche services to handle complex and diverse requirements.
                      </div>
                    )}
                  </div>

                  {/* Accordion Item 3 */}
                  <div className={`border rounded-lg overflow-hidden transition-all ${openAccordion === 'item3' ? 'shadow-md' : ''}`}>
                    <button
                      onClick={() => toggleAccordion('item3')}
                      className={`w-full flex justify-between items-center p-4 font-bold text-left text-lg ${openAccordion === 'item3' ? 'bg-white text-gray-900' : 'bg-gray-50 text-gray-600'}`}
                    >
                      Partner with Confidence, Every Time
                      {openAccordion === 'item3' ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    {openAccordion === 'item3' && (
                      <div className="p-4 bg-white text-gray-600 text-sm leading-relaxed border-t">
                        With IGLA’s Payment Protection Fund and strict member screening, every deal comes with built in trust and peace of mind.
                      </div>
                    )}
                  </div>

                  {/* Accordion Item 4 */}
                  <div className={`border rounded-lg overflow-hidden transition-all ${openAccordion === 'item4' ? 'shadow-md' : ''}`}>
                    <button
                      onClick={() => toggleAccordion('item4')}
                      className={`w-full flex justify-between items-center p-4 font-bold text-left text-lg ${openAccordion === 'item4' ? 'bg-white text-gray-900' : 'bg-gray-50 text-gray-600'}`}
                    >
                      Grow with Trusted Global Partners
                      {openAccordion === 'item4' ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    {openAccordion === 'item4' && (
                      <div className="p-4 bg-white text-gray-600 text-sm leading-relaxed border-t">
                        Join a network where every member is verified, every connection is meaningful, and every opportunity is built on trust.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <ScrollingTextSection />

        {/* Conference Highlights Section */}
        <section className="py-20 overflow-hidden relative">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center mb-8 md:mb-12 text-center lg:text-left">
              <div className="w-full lg:w-5/12 mb-8 md:mb-0">
                <div>
                  <span className="text-base text-[#004aad] font-semibold uppercase tracking-wider mb-2 block">Conference Highlights</span>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-800 tracking-tight">Where Global Partnerships Begin</h2>
                </div>
              </div>
              <div className="w-full lg:w-5/12 mb-8 md:mb-0">
                {/* Optional: Description can go here if needed later */}
              </div>
              <div className="w-full lg:w-2/12 flex justify-center lg:justify-end gap-4">
                {/* Swiper Custom Navigation */}
                <div className="highlight-prev w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center cursor-pointer hover:bg-black hover:text-white hover:border-black transition-all">
                  <ChevronLeft className="w-6 h-6" />
                </div>
                <div className="highlight-next w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center cursor-pointer hover:bg-black hover:text-white hover:border-black transition-all">
                  <ChevronRight className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="w-full">
                <Swiper
                  modules={[Autoplay, Navigation]}
                  spaceBetween={30}
                  slidesPerView={1}
                  loop={true}
                  navigation={{
                    nextEl: ".highlight-next",
                    prevEl: ".highlight-prev",
                  }}
                  autoplay={{
                    delay: 3000,
                    disableOnInteraction: false,
                  }}
                  breakpoints={{
                    640: { slidesPerView: 2 },
                    1024: { slidesPerView: 3 },
                    1280: { slidesPerView: 4 },
                  }}
                  className="pb-12"
                >
                  {conferenceHighlights.map((item, index) => (
                    <SwiperSlide key={index}>
                      <div className="text-center group p-4 hover:translate-y-[-5px] transition-transform duration-300">
                        <h4 className="text-gray-800 text-2xl font-bold mb-0 tracking-tight">{item.year}</h4>

                        <div className="relative mt-6 mb-6">
                          <span className="absolute top-1/2 left-0 w-full h-[1px] bg-gray-300 -translate-y-1/2"></span>
                          <div className="relative z-10 w-8 h-8 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#77a1d3] via-[#79cbca] to-[#77a1d3]"></span>
                          </div>
                        </div>

                        <span className="inline-block font-semibold text-gray-800 text-lg mb-3">{item.location}</span>
                        <p className="text-gray-500 text-sm leading-relaxed max-w-[85%] mx-auto">
                          {item.description}
                        </p>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>
          </div>
        </section>

        {/* Past Events Section */}
        <PastEventsSection />



        {/* Testimonials Section */}
        <TestimonialsSection />

        {/* Latest Inquiries Section */}
        <LatestInquiriesSection />

        {/* Sponsorship Benefits Section */}
        <SponsorshipBenefitsSection />

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
                { title: "Technology Platform", desc: "Modern digital tools for tracking, communication, and collaboration" },
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
