'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, MapPin, Building, Award, Star, TrendingUp, CheckCircle } from 'lucide-react';

// --- Type Definitions ---
interface Media { id: number; url: string; }
interface Location { id: number; address?: string; city?: string; state?: string; country?: string; zipCode?: string; port?: string; }
interface Company {
  id: number;
  name: string;
  location: Location;
  isVerified: boolean;
  purchasedMembership: string;
  memberSince: string;
  services?: string[];
  specialties?: string[];
  media?: Media[];
}

// --- Helper Components & Functions ---
const getMembershipYears = (memberSince: string) => {
  const d = new Date(memberSince);
  if (isNaN(d.getTime())) return 0;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 3600 * 24 * 365));
};

const MembershipBadge = ({ type, isVerified }: { type?: string, isVerified?: boolean }) => {
    const baseStyle = 'rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1.5';
    let style = 'bg-gray-100 text-gray-800';

    if (isVerified) {
        style = 'bg-green-100 text-green-800';
        return (
            <span className={`${baseStyle} ${style}`}>
                <CheckCircle size={14} /> Verified Member
            </span>
        );
    }
    
    const styleMap: Record<string, string> = {
        'IGLA Elite': 'bg-blue-100 text-blue-800',
        'IGLA Premium': 'bg-yellow-100 text-yellow-800',
        'IGLA Projects': 'bg-purple-100 text-purple-800',
        'IGLA Dangerous Goods': 'bg-red-100 text-red-800',
    };

    if (type && styleMap[type]) {
        style = styleMap[type];
    } else if (type) {
        // Default style for other specialities
        style = 'bg-cyan-100 text-cyan-800';
    } else {
        return null; // Don't render a badge if no type is provided
    }

    return <span className={`${baseStyle} ${style}`}>{type}</span>;
};


// --- Main Page Component ---
export default function CompaniesListPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Filter States ---
  const [country, setCountry] = useState('All');
  const [city, setCity] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [port, setPort] = useState('');
  
  // --- UI State ---
  const tabs = ['Location', 'Company Name', 'Member ID'];
  const [activeTab, setActiveTab] = useState<string>('Location');

  // --- Data Fetching ---
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCompanies();
    }, 400); // Debounce API calls
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, city, companyName, memberId, port]);

  const buildQuery = () => {
    const params: Record<string, string> = {};
    if (country && country !== 'All') params.country = country;
    if (city) params.city = city;
    if (companyName) params.name = companyName;
    if (memberId) params.memberId = memberId;
    if (port) params.port = port;
    return `/api/companies/search?${new URLSearchParams(params).toString()}`;
  };

  async function fetchCompanies() {
    setLoading(true);
    setError(null);
    try {
      const url = buildQuery();
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setCompanies(data || []);
    } catch (err) {
      setCompanies([]);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const countryOptions = useMemo(() => ['All', 'India', 'United States', 'China', 'United Kingdom'], []);

  const renderSearchInputs = () => {
    const inputClass = "w-full rounded-lg border-gray-300 p-3 text-sm focus:ring-teal-500 focus:border-teal-500 transition shadow-sm";
    switch (activeTab) {
      case 'Location':
        return (
          <>
            <select name="country" value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass}>
              {countryOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="text" name="city" placeholder="City (e.g., Chennai)" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
          </>
        );
      case 'Company Name':
        return <input type="text" name="companyName" placeholder="Enter Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={`${inputClass} lg:col-span-2`} />;
      case 'Member ID':
        return <input type="text" name="memberId" placeholder="Enter Member ID" value={memberId} onChange={(e) => setMemberId(e.target.value)} className={`${inputClass} lg:col-span-2`} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto p-4 md:p-8">
        
        {/* Search Section */}
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-teal-50 via-cyan-50 to-light-blue-50 border border-gray-200 shadow-sm">
          <div className="flex border-b border-gray-200 mb-4">
            {tabs.map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-4 py-2 font-semibold text-sm transition-colors duration-300 ${
                    activeTab === t
                    ? 'border-b-2 border-teal-500 text-teal-600'
                    : 'text-gray-500 hover:text-teal-500'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] items-center gap-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
              {renderSearchInputs()}
            </div>
            <button onClick={fetchCompanies} className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
              <Search size={22} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,340px] gap-8">
          <div className="space-y-5">
            {loading && (
              <div className="flex h-64 items-center justify-center">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-t-4 border-gray-200 border-t-teal-500"></div>
              </div>
            )}
            {error && <div className="text-red-600 p-4 bg-red-50 rounded-lg border border-red-200">{error}</div>}
            {!loading && !error && companies.length === 0 && (
              <div className="text-gray-500 p-8 bg-white rounded-lg border text-center">No companies found. Try adjusting your search criteria.</div>
            )}
            
            {!loading && companies.length > 0 && companies.map(company => {
              const logoUrl = company.media?.[0]?.url || null;
              const memberYears = getMembershipYears(company.memberSince);
              const displayLocation = `${company.location?.city || ''}${company.location?.country ? `, ${company.location.country}` : ''}`;
              
              return (
                <div key={company.id} className="group flex flex-col md:flex-row gap-5 rounded-xl border bg-white p-5 shadow-sm hover:shadow-xl hover:border-teal-200 transition-all duration-300 overflow-hidden">
                    <div className="flex-shrink-0 flex md:flex-col items-center gap-4">
                        <div className="relative h-24 w-24 flex-shrink-0 border-2 border-gray-100 rounded-lg p-1.5 bg-white shadow-inner">
                          {logoUrl ? (
                            <Image src={logoUrl} alt={`${company.name} logo`} fill style={{objectFit:'contain'}} className="rounded-md" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-lg bg-gray-50 text-gray-400">
                              <Building size={40} />
                            </div>
                          )}
                        </div>
                        {memberYears > 0 && (
                            <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                                <Star size={14} className="text-amber-500" />
                                {memberYears} Year Member
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-grow flex flex-col">
                        <Link href={`/company/details/${company.id}`}>
                            <h2 className="text-lg font-bold text-gray-800 group-hover:text-teal-600 transition-colors">{company.name}</h2>
                        </Link>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                            <MapPin size={14} />
                            {displayLocation}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-4">
                            {company.isVerified && <MembershipBadge isVerified={true} />}
                            <MembershipBadge type={company.purchasedMembership} />
                            {company.specialties?.slice(0, 2).map(spec => <MembershipBadge key={spec} type={spec} />)}
                        </div>
                    </div>
                    
                    <div className="flex-shrink-0 flex items-center mt-4 md:mt-0">
                      <Link href={`/company/details/${company.id}`} className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
                        View Profile
                      </Link>
                    </div>
                </div>
              );
            })}
          </div>
          
          <aside className="hidden lg:block space-y-8">
            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="bg-gray-800 text-white rounded-lg p-2"><TrendingUp /></div>
                    <h3 className="font-bold text-lg text-gray-800">Global Inquiries</h3>
                </div>
                <p className="text-sm text-gray-500 mt-3">Access curated hotlists, market trends, and member inquiries to stay ahead.</p>
                <button className="w-full mt-5 rounded-lg bg-gray-800 text-white py-2.5 text-sm font-semibold hover:bg-black transition-colors">
                View Hotlists
                </button>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 p-6 text-white shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 rounded-lg p-2"><Award /></div>
                    <h3 className="font-bold text-lg">Become Verified</h3>
                </div>
                <p className="text-sm text-white/90 mt-3">Increase trust and visibility in the network by getting your profile verified.</p>
                <button className="w-full mt-5 rounded-lg bg-white text-teal-600 py-2.5 text-sm font-semibold hover:bg-gray-100 transition-colors">
                Learn More
                </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
