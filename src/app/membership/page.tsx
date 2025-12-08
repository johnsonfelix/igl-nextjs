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

// 3. Membership Tiers Section - now driven by plans (shows up to 3 plans)
const MembershipTiers = ({ plans }: { plans: ApiPlan[] }) => {
  const top3 = plans?.slice(0, 3) ?? [];

  return (
    <Section className="bg-gray-800 text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">General Membership</h2>
        <div className="grid md:grid-cols-3 gap-8 mt-12">
          {top3.length === 0 ? (
            <>
              <div className="bg-white bg-opacity-10 p-8 rounded-xl border border-white border-opacity-20 backdrop-blur-md">
                <h3 className="text-2xl font-bold text-yellow-400">01 <br /> IGLA Elite +</h3>
                <button className="mt-6 w-full bg-yellow-400 text-black font-bold py-3 rounded-lg">Become a Member</button>
              </div>
              <div className="bg-white bg-opacity-10 p-8 rounded-xl border border-white border-opacity-20 backdrop-blur-md">
                <h3 className="text-2xl font-bold text-[#5da765]">02 <br /> IGLA Premium +</h3>
                <button className="mt-6 w-full bg-[#5da765] text-white font-bold py-3 rounded-lg">Become a Member</button>
              </div>
              <div className="bg-white bg-opacity-10 p-8 rounded-xl border border-white border-opacity-20 backdrop-blur-md">
                <h3 className="text-2xl font-bold text-green-400">IGLA Rising +</h3>
                <p className="text-left mt-4 text-sm text-gray-300">✓ Providing emerging freight forwarding companies...</p>
                <div className="flex gap-4 mt-6">
                  <button className="w-full bg-gray-600 text-white font-bold py-3 rounded-lg">View More</button>
                  <button className="w-full bg-green-500 text-white font-bold py-3 rounded-lg">Become a Member</button>
                </div>
              </div>
            </>
          ) : (
            top3.map((p, idx) => (
              <div key={p.id} className="bg-white bg-opacity-10 p-8 rounded-xl border border-white border-opacity-20 backdrop-blur-md">
                <h3 className={`text-2xl font-bold ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-[#5da765]' : 'text-green-400'}`}>
                  {String(idx + 1).padStart(2, '0')} <br /> {p.name}
                </h3>
                <p className="mt-4 text-sm text-gray-200">{p.features?.slice(0, 2).join(' • ')}</p>
                <div className="mt-6">
                  <Link href={`/membership/purchase/${toUrlSegment(p.slug || p.name)}`} className="w-full inline-block bg-white text-gray-900 font-bold py-3 px-6 rounded-lg">
                    Become a Member
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Section>
  );
};

// 4. Specialty Membership Section - show specific specialties if found in plans
const SpecialtyMembership = ({ plans }: { plans: ApiPlan[] }) => {
  const specialties = ['projects', 'dangerous-goods', 'ecommerce', 'railway'];
  const found = specialties
    .map((s) => {
      const p = plans.find((pl) => toUrlSegment(pl.slug || pl.name).includes(s));
      return p ? { key: s, plan: p } : null;
    })
    .filter(Boolean) as { key: string; plan: ApiPlan }[];

  return (
    <Section className="bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Specialty Membership</h2>
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="md:w-1/3">
            <img src="https://static.vecteezy.com/system/resources/thumbnails/025/335/808/small_2x/specialty-program-concept-blue-gradient-icon-exclusivity-loyalty-customers-program-membership-advantages-abstract-idea-thin-line-illustration-isolated-outline-drawing-vector.jpg" alt="Specialty Membership" className="rounded-xl shadow-lg w-full" />
          </div>

          <div className="md:w-2/3">
            {found.length === 0 ? (
              ['IGLA Projects', 'IGLA Dangerous Goods', 'IGLA eCommerce', 'IGLA Railway'].map((specialty, i) => (
                <div key={specialty} className={`p-6 rounded-lg ${i === 0 ? 'bg-gray-100' : ''}`}>
                  <h3 className="text-xl font-bold flex items-center">{specialty} <span className="text-blue-500 ml-2">+</span></h3>
                  {i === 0 && (
                    <div className="mt-4 text-gray-600">
                      <p className="mb-2">✓ Gathering professional companies with rich experience.</p>
                      <p>✓ Efficient logistics project cooperation among members.</p>
                      <div className="mt-6 flex gap-4">
                        <button className="bg-white border border-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg">View More</button>
                        <button className="bg-[#5da765] text-white font-semibold py-2 px-6 rounded-lg">Become a Member</button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              found.map(({ key, plan }, idx) => (
                <div key={key} className={`p-6 rounded-lg ${idx === 0 ? 'bg-gray-100' : ''}`}>
                  <h3 className="text-xl font-bold flex items-center">{plan.name} <span className="text-blue-500 ml-2">+</span></h3>
                  <div className="mt-4 text-gray-600">
                    <p className="mb-2">✓ {plan.features?.[0] ?? 'Specialty benefit'}</p>
                    <p>✓ {plan.features?.[1] ?? 'Collaboration benefit'}</p>
                    <div className="mt-6 flex gap-4">
                      <Link href={`/membership/purchase/${toUrlSegment(plan.slug || plan.name)}`} className="bg-white border border-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg">View More</Link>
                      <Link href={`/membership/purchase/${toUrlSegment(plan.slug || plan.name)}`} className="bg-[#5da765] text-white font-semibold py-2 px-6 rounded-lg">Become a Member</Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Section>
  );
};

// 5. Success Stories Section (unchanged)
const SuccessStories = () => (
  <Section className="bg-gray-50">
    <div className="container mx-auto px-4">
      <h2 className="text-3xl font-bold text-center mb-12">Success Story</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
            <img src={`/path/to/story-${i}.jpg`} alt={`Success Story ${i}`} className="w-full h-48 object-cover" />
            <div className="p-6">
              <h3 className="font-bold text-lg mb-2">IGLA & Thalis Logistics Co., Ltd Driving global Logistics Network...</h3>
              <div className="flex items-center text-sm text-gray-500">
                <span>Asia</span>
                <span className="mx-2">|</span>
                <span>Business opportunities</span>
                <span className="ml-auto">15-May-2025</span>
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
          <img key={i} src={`/path/to/logo-${i + 1}.png`} alt="Member Logo" className="h-12 w-auto mx-auto" />
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
        // sort by price ascending to keep consistent order (optional)
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
            {/* Uncomment if you want to show stories & logos */}
            {/* <SuccessStories /> */}
            {/* <MembersWall /> */}
          </>
        )}
      </main>
    </div>
  );
};

export default MembershipPage;
