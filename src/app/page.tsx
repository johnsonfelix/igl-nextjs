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
import { ChevronDown, ChevronRight, ThumbsUp, Box, ArrowRight, Shield, Phone, Mail, Facebook, Linkedin, Instagram } from "lucide-react";

export default function Home() {
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
      title1: "Level Up",
      title2: "Link Up",
      title3: "Lead Forward",
      desc: "",
      separator: true
    },
    {
      id: 2,
      bgImage: "/images/bg-2.jpg",
      leftImage: "/images/demo-green-energy-slider-left-01.jpg",
      welcome: "Welcome to IGLA",
      title1: "Innovate.",
      title2: "Connect.",
      title3: "Grow.",
      desc: "",
      separator: true
    },
    {
      id: 3,
      bgImage: "/images/bg-1.jpg",
      leftImage: "/images/demo-green-energy-slider-left-01.jpg", // Reusing potentially same bg for left side based on HTML
      welcome: "Welcome to IGLA",
      title1: "Empowering",
      title2: "Forwarders",
      title3: "growth.",
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
  ];

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      <main>
        {/* Banner Section with Swiper */}
        <section className="relative overflow-hidden bg-gray-100">
          <Swiper
            modules={[Autoplay, Navigation, Pagination, EffectFade]}
            effect="slide"
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            loop={true}
            pagination={{ clickable: true }}
            className="h-[600px] lg:h-[750px] w-full"
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
                      <div className="absolute inset-0 bg-[#5da765]/80 mix-blend-multiply"></div>
                    </div>
                    <div className="relative z-10 h-full flex flex-col justify-center px-8 lg:px-16 text-white">
                      <span className="text-sm tracking-widest uppercase border-b-2 border-white/30 inline-block mb-6 pb-1 w-fit">
                        {slide.welcome}
                      </span>
                      <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-8">
                        {slide.title1}<br />
                        <span className="relative">
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
                        </span><br />
                        {slide.title3}
                      </h1>
                      <div className="flex flex-wrap gap-4">
                        <Link href="/event/list" className="bg-white text-black px-8 py-4 rounded-full font-bold shadow-lg hover:bg-gray-50 flex items-center gap-2 transition-transform hover:scale-105">
                          <ThumbsUp className="w-5 h-5" />
                          Discover more
                        </Link>
                        <Link href="/membership/become-member" className="text-white border border-white/50 px-8 py-4 rounded-full font-bold hover:bg-white/10 flex items-center gap-2 transition-transform hover:scale-105">
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

          {/* Floating Popup Box */}
          <div className="hidden md:flex absolute bottom-0 right-0 lg:right-16 z-20 max-w-2xl bg-white rounded-t-xl shadow-2xl overflow-hidden animate-fade-in-up">
            {/* <div className="w-[200px] relative bg-gray-200 min-h-[150px]">
              <div className="absolute inset-0 flex items-center justify-center bg-gray-300 text-gray-500">
                Video Placeholder
              </div>
            </div> */}
            <div className="flex-1 p-6 flex flex-col justify-center">
              <h3 className="text-xl font-bold mb-2">Connecting You to Partners <span className="text-gray-900">Across the World.</span></h3>
              <div className="relative w-full">
                <input type="email" placeholder="Enter your email" className="w-full border rounded-full px-4 py-2 pr-12 text-sm focus:outline-none focus:border-[#5da765]" />
                <button className="absolute right-1 top-1 bg-[#5da765] text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#4a8a52]">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">*Your Global Logistics Partner Awaits.</p>
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="lg:w-10/12">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-8 h-[2px] bg-[#5da765]"></span>
                  <span className="text-[#5da765] font-bold uppercase text-sm tracking-widest">About Us</span>
                </div>
                <h2 className="text-4xl text-gray-900 font-bold mb-6 tracking-tight">Innovative Global Logistics Allianz</h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Founded in 2012, IGLA has rapidly evolved into one of the most sought-after logistics networks worldwide. We bring together freight forwarders and transportation experts who are committed to excellence, collaboration, and growth.
                </p>
              </div>
              <div className="bg-[#f0f9f3] rounded-lg overflow-hidden p-8 text-center relative">
                <div className="mb-8 p-6 bg-white/50 rounded-lg">
                  <p className="text-xl font-semibold text-gray-800">Established in 2012, Innovative Global Logistics Allianz (IGLA).</p>
                </div>
                <div className="bg-[#5da765] p-8 rounded-lg flex items-center justify-center gap-6 text-white shadow-xl">
                  <div className="w-16">
                    <Image src="/images/handshake.png" alt="Handshake" width={64} height={64} className="brightness-0 invert" />
                  </div>
                  <div className="text-left">
                    <div className="text-4xl font-bold">7,000+</div>
                    <div className="text-lg opacity-90">Logistics Companies</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 mb-16 items-end">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-8 h-[2px] bg-[#5da765]"></span>
                  <span className="text-[#5da765] font-bold uppercase text-sm tracking-widest">Why Choose Us</span>
                </div>
                <h3 className="text-3xl font-bold text-black">Your Global Partner in Secure</h3>
              </div>
              <div>
                <p className="text-gray-600 leading-relaxed">
                  At Innovative Global Logistics Allianz (IGLA), we don’t just connect freight forwarders, we build a community based on trust, performance, and opportunity.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-t border-b border-gray-200 divide-y md:divide-y-0 md:divide-x divide-gray-200 bg-white shadow-sm">
              {/* Feature 1 */}
              <div className="p-8 text-center group hover:bg-[#f0f9f3] transition-colors duration-300">
                <div className="w-24 h-24 mx-auto mb-6 relative">
                  <span className="absolute inset-0 bg-[#5da765] rounded-full opacity-10"></span>
                  <Image src="/images/growth.png" alt="Growth" width={60} height={60} className="relative z-10 mx-auto top-4" />
                </div>
                <h4 className="font-bold text-lg mb-3">Grow Your Business</h4>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">Connect with pre-qualified partners who offer real opportunities, helping you build lasting relationships.</p>
                <Link href="/membership/become-member" className="inline-flex items-center text-[#5da765] font-bold uppercase text-sm group-hover:translate-x-1 transition-transform">
                  Know More <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              {/* Feature 2 */}
              <div className="p-8 text-center group hover:bg-[#f0f9f3] transition-colors duration-300">
                <div className="w-24 h-24 mx-auto mb-6 relative">
                  <span className="absolute inset-0 bg-[#5da765] rounded-full opacity-10"></span>
                  <Image src="/images/ai.png" alt="AI" width={60} height={60} className="relative z-10 mx-auto top-4" />
                </div>
                <h4 className="font-bold text-lg mb-3">AI-Driven Matching</h4>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">Our intelligent system matches you with ideal global partners based on trade lanes and goal.</p>
                <Link href="/membership/become-member" className="inline-flex items-center text-[#5da765] font-bold uppercase text-sm group-hover:translate-x-1 transition-transform">
                  Know More <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              {/* Feature 3 */}
              <div className="p-8 text-center group hover:bg-[#f0f9f3] transition-colors duration-300">
                <div className="w-24 h-24 mx-auto mb-6 relative">
                  <span className="absolute inset-0 bg-[#5da765] rounded-full opacity-10"></span>
                  <Image src="/images/global.png" alt="Global" width={60} height={60} className="relative z-10 mx-auto top-4" />
                </div>
                <h4 className="font-bold text-lg mb-3">Global Footprint</h4>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">IGLA's global network spans five continents, offering diverse connections to expand your reach.</p>
                <Link href="/membership/become-member" className="inline-flex items-center text-[#5da765] font-bold uppercase text-sm group-hover:translate-x-1 transition-transform">
                  Know More <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              {/* Feature 4 */}
              <div className="p-8 text-center group hover:bg-[#f0f9f3] transition-colors duration-300">
                <div className="w-24 h-24 mx-auto mb-6 relative">
                  <span className="absolute inset-0 bg-[#5da765] rounded-full opacity-10"></span>
                  <Image src="/images/marketing.png" alt="Marketing" width={60} height={60} className="relative z-10 mx-auto top-4" />
                </div>
                <h4 className="font-bold text-lg mb-3">Marketing & Promotion</h4>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">Boost your visibility through targeted social media, newsletters, and a dedicated company page.</p>
                <Link href="/membership/become-member" className="inline-flex items-center text-[#5da765] font-bold uppercase text-sm group-hover:translate-x-1 transition-transform">
                  Know More <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Why Partner with IGLA (Accordion) */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <Image src="/images/why-partner-with-us.jpg" alt="Why Partner" width={600} height={500} className="rounded-lg shadow-lg w-full" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-8 h-[2px] bg-[#5da765]"></span>
                  <span className="text-[#5da765] font-bold uppercase text-sm tracking-widest">Why Partner with IGLA?</span>
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

        {/* Financial Protection Section */}
        <section className="py-20 bg-[#f9f9f9]">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 mb-12">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-8 h-[2px] bg-[#5da765]"></span>
                  <span className="text-[#5da765] font-bold uppercase text-sm tracking-widest">Financial Protection</span>
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
                  <Link href="/membership/become-member" className="inline-flex items-center bg-[#5da765] text-white px-6 py-3 rounded-full font-bold uppercase text-xs shadow-md hover:bg-[#4a8a52] transition-colors">
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
            <h2 className="text-3xl font-medium mb-12">Our Team <span className="font-bold border-b-4 border-[#5da765]">Members</span></h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {teamMembers.map(member => (
                <div key={member.id} className="p-4 flex items-center justify-center h-32 hover:scale-110 transition-transform duration-300">
                  <Image src={member.img} alt={`Member ${member.id}`} width={120} height={120} className="max-h-full w-auto object-contain" />
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* Footer from Page Content (restored manually since layout is ignored per request intent) */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Image src="/images/logo.png" alt="IGLA" width={150} height={60} className="mb-6 bg-white p-2 rounded" />
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">Connecting Freight Forwarders Across World</p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#5da765] transition-colors"><Facebook className="w-4 h-4" /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#5da765] transition-colors"><Linkedin className="w-4 h-4" /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#5da765] transition-colors"><Instagram className="w-4 h-4" /></a>
            </div>
          </div>
          <div className="lg:col-start-2">
            <h4 className="font-bold text-lg mb-6">Company</h4>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/membership/become-member" className="hover:text-white transition-colors">Membership</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-6">Get in touch</h4>
            <p className="text-gray-400 mb-4 text-sm">Amber 16 F 2, Olympia Opaline 33, Rajiv Gandhi Road, Navalur - 600 130</p>
            <p className="text-gray-400 mb-2 flex items-center gap-2"><Phone className="w-4 h-4" /> +91 99401 00929</p>
            <p className="text-gray-400 flex items-center gap-2"><Mail className="w-4 h-4" /> sales@igla.asia</p>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-6">Stay Connected</h4>
            <div className="flex gap-2 mb-6">
              <Image src="/images/apple_store.png" alt="App Store" width={100} height={30} className="w-24 h-auto" />
              <Image src="/images/play_store.png" alt="Play Store" width={100} height={30} className="w-24 h-auto" />
            </div>
            <Link href="/membership/become-member" className="bg-[#5da765] text-white px-6 py-3 rounded-full font-bold w-full text-center block hover:bg-[#4a8a52] transition-colors shadow-lg">Become a Member</Link>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-16 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>&copy; 2025 Innovative Global Logistics Allianz (IGLA). All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
