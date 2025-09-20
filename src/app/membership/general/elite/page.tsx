'use client'; // This directive is needed for components that use hooks like useState

import type { NextPage } from 'next';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronsDown, BarChart3, Star, BookUser } from 'lucide-react';

// Helper component for consistent section layout
const Section = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return <section className={`py-12 md:py-20 ${className}`}>{children}</section>;
};

// --- Sub-Components for the IGLA Elite Page ---

// 1. Hero Section for IGLA Elite
const HeroSection = () => (
  <div className="relative h-[60vh] md:h-[80vh] flex items-center justify-center text-white text-center overflow-hidden">
    <div 
      className="absolute inset-0 bg-cover bg-center" 
      style={{ backgroundImage: "url('/path/to/elite-hero-bg.jpg')" }}
    >
        <div className="absolute inset-0 bg-black opacity-50"></div>
    </div>
    
    <div className="relative z-10 p-4">
      <h1 className="text-5xl md:text-7xl font-bold flex items-center justify-center">
        IGLA Elite <span className="text-yellow-400 text-6xl ml-2">+</span>
      </h1>
      <div className="mt-8 max-w-2xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-semibold mb-4">Why IGLA Elite?</h2>
        <p className="text-md md:text-lg text-gray-200">
          Gathering renowned freight forwarding companies globally, IGLA Elite establishes a cooperation circle with outstanding qualifications, large scale, exceptional strength, and influence, all achieved through stringent auditing standards within the industry.
        </p>
      </div>
      <div className="mt-8 flex justify-center gap-4">
        <Link href="/register" className="bg-white text-black font-bold py-3 px-8 rounded-lg flex items-center hover:bg-gray-200 transition-colors">
          Become a Member <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
        <Link href="/members" className="bg-transparent border border-white text-white font-bold py-3 px-8 rounded-lg flex items-center hover:bg-white hover:text-black transition-colors">
          Member List <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </div>
    </div>
    <ChevronsDown className="absolute bottom-8 text-white h-8 w-8 animate-bounce" />
  </div>
);

// 2. Member Benefits Section with Tabs
const MemberBenefits = () => {
  const [activeTab, setActiveTab] = useState('Business');
  
  const tabs = [
    { name: 'Business Opportunity Matching', id: 'Business' },
    { name: 'Cooperation Risk Protection', id: 'Cooperation' },
    { name: 'Marketing and Promotion', id: 'Marketing' },
    { name: 'Reduce Costs and Boost Efficiency', id: 'Efficiency' },
  ];

  return (
    <Section className="bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Member Benefits</h2>
        
        {/* Tab Buttons */}
        <div className="flex justify-center flex-wrap gap-4 mb-8">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-full font-semibold transition-colors ${
                activeTab === tab.id 
                ? 'bg-gray-800 text-white shadow-lg' 
                : 'bg-white text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl flex flex-col md:flex-row gap-8">
          <div className="md:w-1/4">
            {/* Sidebar for Sub-categories */}
            <div className="space-y-2">
                {['Company Directory', 'Shop', 'Inquiry Board', 'Customer Success'].map(item => (
                    <button key={item} className="w-full text-left font-semibold p-3 rounded-lg bg-yellow-100 text-yellow-800">
                        {item}
                    </button>
                ))}
            </div>
          </div>
          <div className="md:w-3/4">
            <h3 className="text-2xl font-bold mb-4 flex items-center"><BookUser className="mr-3 text-yellow-500" /> Company Directory</h3>
            <div className="space-y-4 text-gray-600">
                <p className="flex items-start"><Star className="w-5 h-5 text-yellow-500 mr-2 mt-1 flex-shrink-0" /> Join the IGLA Global Freight Forwarding Network and access our company directory with over 11,000 freight forwarding members across 179 countries.</p>
                <p className="flex items-start"><Star className="w-5 h-5 text-yellow-500 mr-2 mt-1 flex-shrink-0" /> As an Elite member, your company will receive priority display in the company directory.</p>
            </div>
            <div className="mt-8 flex justify-between items-center">
                 <Link href="/register" className="bg-yellow-500 text-white font-bold py-3 px-6 rounded-lg flex items-center hover:bg-yellow-600 transition-colors">
                    Become a Member <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <span className="font-bold text-yellow-500 border-2 border-yellow-500 px-3 py-1 rounded-md">+ IGLA Elite</span>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};


// 3. Welcome to IGLA Elite Section
const WelcomeSection = () => (
  <Section className="bg-white">
    <div className="container mx-auto px-4">
      <h2 className="text-3xl font-bold text-center mb-12">Welcome to IGLA Elite</h2>
      <div className="flex flex-col md:flex-row gap-8 items-stretch">
        {/* Company Profile */}
        <div className="md:w-1/2 bg-stone-800 text-white p-8 rounded-3xl relative">
            <span className="absolute top-8 left-8 text-8xl font-serif text-stone-700 opacity-80">“</span>
            <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-4">Company Profile</h3>
                <p className="text-gray-300">
                    Leaders in Ocean and Air shipment to or from Mexico to world. At 100 Logistics Corp., we provide all the necessary services to assist you and help you solve your most complex transportation needs. Our network of capable, reliable, and secure carriers throughout the USA will carry your load safely to its destination. With more than 20 years of experience it's important for us to provide the best customer service from loading, to...
                </p>
            </div>
        </div>
        {/* Featured Member */}
        <div className="md:w-1/2 flex flex-col gap-4">
            <div className="bg-white p-6 rounded-3xl shadow-lg flex-grow flex items-center">
                <img src="/path/to/one-hundred-logo.png" alt="One Hundred Logistics" className="w-48"/>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-lg">
                <h4 className="font-bold text-xl">ONE HUNDRED LOGISTICS</h4>
                <p className="text-gray-500 mb-4">Mexico, Nuevo Laredo</p>
                <div className="flex gap-2 mb-4">
                    {['FCL', 'LCL', 'Air Freight'].map(tag => (
                        <span key={tag} className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">{tag}</span>
                    ))}
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-3xl font-bold text-yellow-500">01<span className="text-gray-300">/10</span></span>
                    <button className="bg-gray-200 h-10 w-10 rounded-full flex items-center justify-center hover:bg-gray-300"><ArrowRight/></button>
                </div>
            </div>
        </div>
      </div>
    </div>
  </Section>
);

// 4. Apply Banner Section
const ApplyBanner = () => (
    <div className="bg-yellow-500 text-black py-4 whitespace-nowrap overflow-hidden">
        <div className="animate-marquee flex items-center">
            {[...Array(6)].map((_, i) => (
                <span key={i} className="text-2xl font-bold mx-8 flex items-center">
                    Apply for IGLA Elite Membership <Star className="w-6 h-6 mx-2" />
                </span>
            ))}
        </div>
    </div>
);


// --- Main Page Component ---
const IGLAElitePage: NextPage = () => {
  return (
    <div className="bg-white">
      {/* A global Header would be in your layout.tsx file */}
      {/* <Header /> */}
      
      <main>
        <HeroSection />
        <MemberBenefits />
        <WelcomeSection />
        <ApplyBanner />
      </main>

      {/* A global Footer would be in your layout.tsx file */}
      {/* <Footer /> */}
    </div>
  );
};

export default IGLAElitePage;

