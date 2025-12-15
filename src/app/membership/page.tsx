'use client';

import type { NextPage } from 'next';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ShieldCheck, ArrowRight, ChevronsRight } from 'lucide-react';

// small type for the API plan shape
type ApiPlan = {
  id: string;
  name: string;
  slug: string;
  price: number;
  description?: string;
  thumbnail?: string;
  paymentProtection?: string;
  discountPercentage?: number;
  features: string[];
  createdAt?: string;
  updatedAt?: string;
};

// Helper: normalize slug/name into a URL segment (kebab-case)
const toUrlSegment = (s?: string) =>
  (s || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // remove punctuation
    .replace(/\s+/g, '-') // spaces to dashes
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

// Helper component for consistent section layout
const Section = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return <section className={`py-16 md:py-24 ${className}`}>{children}</section>;
};

// --- Sub-Components for the Membership Page ---
// They'll receive `plans` as props when needed

// 1. Hero Section Component (Updated with Links)
const HeroSection = ({ plans }: { plans: ApiPlan[] }) => {
  // build membership items from plans; fall back to some common labels if empty
  const membershipItems =
    plans && plans.length > 0
      ? plans.map((p) => ({ name: p.name, path: `/membership/purchase/${toUrlSegment(p.slug || p.name)}` }))
      : [
        { name: 'IGLA Elite', path: '/membership/purchase/elite' },
        { name: 'IGLA Premium', path: '/membership/purchase/premium' },
        { name: 'IGLA Rising', path: '/membership/purchase/rising' },
        { name: 'IGLA Projects', path: '/membership/purchase/projects' },
        { name: 'IGLA Dangerous Goods', path: '/membership/purchase/dangerous-goods' },
        { name: 'IGLA eCommerce', path: '/membership/purchase/ecommerce' },
      ];

  return (
    <div className="relative text-white bg-gray-900 bg-opacity-80 py-20 md:py-32 text-center overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/bg-4.jpg')", opacity: 0.28 }} />
      <div className="container mx-auto px-4 relative z-10">
        <h1 className="text-4xl md:text-6xl font-bold mb-8">IGLA Membership</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
          {membershipItems.map((item) => (
            <Link
              key={item.name}
              href={item.path}
              className="bg-opacity-10 border border-white border-opacity-20 rounded-lg p-3 text-sm font-semibold hover:bg-opacity-20 transition-all duration-300 backdrop-blur-sm flex items-center justify-center"
            >
              {item.name} <ChevronsRight className="ml-2 h-4 w-4" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

// 2. "Why Choose Us" Section Component (unchanged content)
const WhyChooseSection = () => {
  const reasons = [
    {
      num: '01',
      title: 'Promote your business globally',
      description: `We are one of the world's leading logistics community networks. Join IGLA and promote your business to over 11,000 active members.`,
      img: 'https://www.ringcentral.com/us/en/blog/wp-content/uploads/2020/07/international-business1.jpg',
    },
    {
      num: '02',
      title: 'Build partnerships with quality agents',
      description: 'Here you can find high-quality freight forwarders, engaged in sea, air, and railway, as well as agents proficient in the transportation of various special goods.',
      img: 'https://www.benchmarkone.com/wp-content/uploads/2022/10/AgencyPartners-scaled-e1665066349327.webp',
    },
    {
      num: '03',
      title: 'Strict access review standards',
      description: 'We have strict access review standards. Member collaboration includes risk protection of up to $150,000.',
      img: 'https://images.drata.com/x3hoqyjm3c27/4p20XYl43W7D5TKkGtYTdl/92fa55cf7e0a5162f5c65b087af126cd/access-review-hero.webp',
    },
    {
      num: '04',
      title: 'Free payment and tool services',
      description: 'IGLAPay enables fee-free, instant payments between members—saving thousands annually.',
      img: 'https://www.searchenginejournal.com/wp-content/uploads/2020/03/the-top-10-most-popular-online-payment-solutions-5e9978d564973-1280x720.png',
    },
  ];

  return (
    <Section className="bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Choose IGLA Membership</h2>
        <div className="space-y-8">
          {reasons.map((reason, index) => (
            <div key={index} className="flex flex-col md:flex-row items-center bg-white p-8 rounded-xl shadow-md overflow-hidden">
              <div className={`md:w-1/2 ${index % 2 !== 0 ? 'md:order-2' : ''}`}>
                <div className="text-orange-500 font-bold text-5xl mb-2">{reason.num}</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">{reason.title}</h3>
                <p className="text-gray-600 mb-6">{reason.description}</p>
                <button className="bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg flex items-center hover:bg-gray-700 transition-colors">
                  Become a Member <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </div>
              <div className={`md:w-1/2 mt-8 md:mt-0 ${index % 2 !== 0 ? 'md:order-1' : ''}`}>
                <img src={reason.img} alt={reason.title} className="w-full h-auto object-contain max-h-64" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};

// 3. Membership Tiers Section - now driven by plans
const MembershipTiers = ({ plans }: { plans: ApiPlan[] }) => {
  // Show all plans
  const displayPlans = plans || [];

  return (
    <Section className="bg-gray-800 text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">Membership Plans</h2>
        <p className="text-gray-400 mb-12 max-w-2xl mx-auto">
          Choose the plan that best fits your business needs. Upgrade anytime to unlock more features and benefits.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mt-8">
          {displayPlans.length === 0 ? (
            <div className="col-span-full text-center text-gray-400">Loading plans...</div>
          ) : (
            displayPlans.map((p, idx) => {
              // Determine card styling based on plan name
              let borderColor = "border-white border-opacity-20";
              let textColor = "text-white";
              let btnColor = "bg-white text-gray-900";

              const name = p.name.toLowerCase();
              if (name.includes('gold')) {
                borderColor = "border-yellow-500/50";
                textColor = "text-yellow-400";
                btnColor = "bg-yellow-500 text-black hover:bg-yellow-400";
              } else if (name.includes('platinum')) {
                borderColor = "border-slate-300/50";
                textColor = "text-slate-200";
                btnColor = "bg-slate-200 text-slate-900 hover:bg-white";
              } else if (name.includes('diamond')) {
                borderColor = "border-cyan-400/50";
                textColor = "text-cyan-400";
                btnColor = "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90";
              } else if (name.includes('silver')) {
                borderColor = "border-gray-400/50";
                textColor = "text-gray-300";
                btnColor = "bg-gray-300 text-gray-900 hover:bg-gray-200";
              } else if (name.includes('free')) {
                borderColor = "border-emerald-500/30";
                textColor = "text-emerald-400";
                btnColor = "bg-emerald-600 text-white hover:bg-emerald-500";
              }

              return (
                <div key={p.id} className={`flex flex-col h-full bg-white bg-opacity-5 p-6 rounded-xl border ${borderColor} backdrop-blur-md transition-transform hover:-translate-y-1`}>
                  <h3 className={`text-xl font-bold ${textColor} mb-2`}>
                    {p.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-white">${p.price.toLocaleString()}</span>
                    <span className="text-xs text-gray-400 block mt-1">
                      {p.price === 0 ? "Forever Free" : name.includes('diamond') ? "One-Time Fee" : "/ Year"}
                    </span>
                  </div>

                  {p.paymentProtection && (
                    <div className="mb-4 text-sm font-semibold text-blue-300 bg-blue-900/30 px-3 py-1.5 rounded-lg inline-block">
                      🛡️ {p.paymentProtection}
                    </div>
                  )}

                  {p.discountPercentage !== undefined && p.discountPercentage > 0 && (
                    <div className="mb-4 ml-2 text-sm font-semibold text-purple-300 bg-purple-900/30 px-3 py-1.5 rounded-lg inline-block">
                      🏷️ {p.discountPercentage}% Discount
                    </div>
                  )}

                  <ul className="text-sm text-gray-300 space-y-2 mb-6 text-left flex-1">
                    {p.features?.slice(0, 5).map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span className="opacity-90">{f}</span>
                      </li>
                    ))}
                    {(p.features?.length || 0) > 5 && (
                      <li className="text-xs text-gray-500 italic">...and more</li>
                    )}
                  </ul>

                  <div className="mt-auto pt-4">
                    <Link href={`/membership/purchase/${toUrlSegment(p.slug || p.name)}`} className={`w-full inline-flex items-center justify-center font-bold py-3 px-4 rounded-lg transition-colors ${btnColor}`}>
                      {p.price === 0 ? "Join Free" : "Choose Plan"}
                    </Link>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </Section>
  );
};

// 4. Specialty Membership Section - Removed as per new requirement focusing on 5 specific tiers.
// kept as null component or removed.
const SpecialtyMembership = ({ plans }: { plans: ApiPlan[] }) => {
  return null;
};

// 5. Success Stories Section (unchanged)
const SuccessStories = () => (
  <Section className="bg-gray-50">
    <div className="container mx-auto px-4">
      <h2 className="text-3xl font-bold text-center mb-12">Success Story</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-48 bg-gray-200 w-full flex items-center justify-center text-gray-400">
              {/* Placeholder for image */}
              [Story Image {i}]
            </div>
            {/* <img src={`/path/to/story-${i}.jpg`} alt={`Success Story ${i}`} className="w-full h-48 object-cover" /> */}
            <div className="p-6">
              <h3 className="font-bold text-lg mb-2">IGLA & Partner Success Story...</h3>
              <div className="flex items-center text-sm text-gray-500">
                <span>Global</span>
                <span className="mx-2">|</span>
                <span>Growth</span>
                <span className="ml-auto">2025</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </Section>
);

// 6. Members Logo Wall (unchanged)
const MembersWall = () => (
  <Section>
    <div className="container mx-auto px-4">
      <h2 className="text-3xl font-bold text-center mb-12">Our Members</h2>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">Logo {i + 1}</div>
          // <img key={i} src={`/path/to/logo-${i + 1}.png`} alt="Member Logo" className="h-12 w-auto mx-auto" />
        ))}
      </div>
    </div>
  </Section>
);

// --- Main Page Component ---
const MembershipPage: NextPage = () => {
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadPlans = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/admin/membership-plans');
        if (!res.ok) throw new Error(`Failed to load plans (${res.status})`);
        const data: ApiPlan[] = await res.json();
        if (!mounted) return;
        // sort by price ascending
        data.sort((a, b) => (a.price || 0) - (b.price || 0));
        setPlans(data);
      } catch (err) {
        console.error('Failed fetching membership plans', err);
        if (!mounted) return;
        setError((err as Error).message || 'Failed to load membership plans');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadPlans();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="bg-white">
      <main>
        {/* Loading / Error UI */}
        {loading ? (
          <div className="py-32 text-center">
            <div className="mx-auto max-w-xl animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4" />
              <div className="h-6 bg-gray-200 rounded mb-2" />
              <div className="h-6 bg-gray-200 rounded" />
            </div>
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-semibold mb-2">Failed to load membership plans</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex justify-center">
                <a href="/contact" className="inline-block bg-[#5da765] text-white px-6 py-3 rounded">Contact Support</a>
              </div>
            </div>
          </div>
        ) : (
          <>
            <HeroSection plans={plans} />
            <WhyChooseSection />
            <MembershipTiers plans={plans} />
            <SpecialtyMembership plans={plans} />
            {/* <SuccessStories /> */}
            {/* <MembersWall /> */}
          </>
        )}
      </main>
    </div>
  );
};

export default MembershipPage;
