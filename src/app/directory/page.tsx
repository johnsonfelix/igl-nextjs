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
  established?: string; // or Date, depending on how it's serialized
  services?: string[];
  specialties?: string[];
  logoUrl?: string;
  media?: Media[];
  membershipPlan?: {
    name: string;
    thumbnail?: string | null;
  };
}

interface MembershipPlan {
  id: string;
  name: string;
  thumbnail: string | null;
}

// --- Helper Components & Functions ---
const getEstablishedYears = (establishedDate?: string) => {
  if (!establishedDate) return 0;
  const d = new Date(establishedDate);
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
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]); // Store plans locally

  // --- Filter States ---
  const [country, setCountry] = useState('All');
  const [city, setCity] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [port, setPort] = useState('');

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [country, city, companyName, memberId, port]);

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
  }, [country, city, companyName, memberId, port, currentPage]);

  // Fetch membership plans for legacy mapping
  useEffect(() => {
    fetch('/api/admin/membership-plans')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMembershipPlans(data);
      })
      .catch(err => console.error("Failed to load plans", err));
  }, []);

  const buildQuery = () => {
    const params: Record<string, string> = {};
    if (country && country !== 'All') params.country = country;
    if (city) params.city = city;
    if (companyName) params.name = companyName;
    if (memberId) params.memberId = memberId;
    if (port) params.port = port;
    // Pagination: calculate offset based on page (1-based)
    const limit = 10;
    const offset = (currentPage - 1) * limit;

    return `/api/companies/search?${new URLSearchParams({
      ...params,
      limit: limit.toString(),
      offset: offset.toString()
    }).toString()}`;
  };

  async function fetchCompanies() {
    setLoading(true);
    setError(null);
    try {
      const url = buildQuery();
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const response = await res.json();
      // Handle response structure { data, total, page, totalPages }
      const data = Array.isArray(response) ? response : (response.data || []);
      const total = response.totalPages || 0;

      setCompanies(data);
      setTotalPages(Math.max(1, total));
    } catch (err) {
      setCompanies([]);
      setTotalPages(1);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Clear all filters when switching tabs to ensure exclusive search mode
    setCountry('All');
    setCity('');
    setCompanyName('');
    setMemberId('');
    setPort('');
    setCurrentPage(1);
  };

  const countryOptions = useMemo(() => ['All', 'India', 'United States', 'China', 'United Kingdom'], []);

  const renderSearchInputs = () => {
    const inputClass = "w-full rounded-lg border-gray-300 p-3 text-sm focus:ring-[#004aad] focus:border-[#004aad] transition shadow-sm";
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
    <div className="min-h-screen bg-[#f8f9fa] font-sans">
      <main className="container mx-auto p-4 md:p-8 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1.5 h-8 bg-[#004aad] rounded-full"></div>
            <h1 className="text-3xl font-bold text-gray-800">Company Directory</h1>
          </div>
          <p className="text-gray-500 ml-6">Discover and connect with verified logistics companies worldwide</p>
        </div>

        {/* Search Section */}
        <div className="mb-8 p-8 rounded-2xl bg-white border border-gray-100 shadow-lg shadow-gray-200/50">
          <div className="flex border-b border-gray-100 mb-6 -mx-2">
            {tabs.map(t => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className={`px-6 py-3 font-bold text-sm transition-all duration-300 relative ${activeTab === t
                  ? 'text-[#004aad]'
                  : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                {t}
                {activeTab === t && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#004aad] rounded-full"></div>
                )}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] items-end gap-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {renderSearchInputs()}
            </div>
            <button
              onClick={fetchCompanies}
              className="group flex h-12 px-6 items-center justify-center gap-2 rounded-xl bg-[#004aad] text-white hover:bg-[#4a8a52] transition-all shadow-lg shadow-green-200 hover:shadow-xl hover:translate-y-[-2px] focus:outline-none focus:ring-4 focus:ring-green-100 font-bold"
            >
              <Search size={20} className="group-hover:rotate-90 transition-transform" />
              <span className="hidden md:inline">Search</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,340px] gap-8">
          <div className="space-y-5">
            {loading && (
              <div className="flex h-64 items-center justify-center bg-white rounded-2xl border border-gray-100">
                <div className="flex flex-col items-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#004aad]"></div>
                  <p className="text-gray-500 font-medium mt-4">Loading companies...</p>
                </div>
              </div>
            )}
            {error && (
              <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 shadow-sm">
                <p className="font-bold mb-1">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            )}
            {!loading && !error && companies.length === 0 && (
              <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <Building size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">No companies found</h3>
                <p className="text-gray-500 text-sm">Try adjusting your search criteria</p>
              </div>
            )}

            {!loading && companies.length > 0 && companies.map(company => {
              const logoUrl = company.logoUrl || company.media?.[0]?.url || null;
              const establishedYears = getEstablishedYears(company.established);
              const displayLocation = [company.location?.city, company.location?.country].filter(Boolean).join(', ');

              return (
                <Link key={company.id} href={`/company/details/${company.id}`} className="group flex flex-col md:flex-row gap-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-xl hover:border-[#004aad]/50 hover:translate-y-[-2px] transition-all duration-300 overflow-hidden relative block text-left">
                  {/* Decorative border on hover */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#004aad] to-[#4a8a52] opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <div className="flex-shrink-0 flex md:flex-col items-center gap-3">
                    <div className="relative h-24 w-24 flex-shrink-0 border-2 border-gray-100 rounded-xl p-2 bg-gradient-to-br from-gray-50 to-white shadow-sm group-hover:border-[#004aad]/30 transition-colors">
                      {logoUrl ? (
                        <Image src={logoUrl} alt={`${company.name} logo`} fill style={{ objectFit: 'contain' }} className="rounded-lg" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-xl bg-gray-50 text-gray-300">
                          <Building size={36} />
                        </div>
                      )}
                    </div>

                  </div>

                  <div className="flex-grow flex flex-col min-w-0">
                    <h2 className="text-lg font-bold text-gray-800 group-hover:text-[#004aad] transition-colors truncate">{company.name}</h2>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-2">
                      <MapPin size={14} className="shrink-0" />
                      <span className="truncate">{displayLocation || 'Location not specified'}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-5">
                      {company.isVerified && <MembershipBadge isVerified={true} />}
                      {(() => {
                        // Priority 1: Relation data
                        if (company.membershipPlan?.thumbnail) {
                          return (
                            <div className="relative h-8 w-24">
                              <Image
                                src={company.membershipPlan.thumbnail}
                                alt={company.membershipPlan.name}
                                fill
                                className="object-contain object-left"
                              />
                            </div>
                          );
                        }
                        // Priority 2: Legacy mapping
                        if (company.purchasedMembership) {
                          const matchedPlan = membershipPlans.find(p => p.name.trim().toLowerCase() === company.purchasedMembership.trim().toLowerCase());
                          if (matchedPlan?.thumbnail) {
                            return (
                              <div className="relative h-8 w-24">
                                <Image
                                  src={matchedPlan.thumbnail}
                                  alt={matchedPlan.name}
                                  fill
                                  className="object-contain object-left"
                                />
                              </div>
                            );
                          }
                        }
                        // Fallback: Badge
                        return <MembershipBadge type={company.purchasedMembership} />;
                      })()}
                      {company.specialties?.slice(0, 2).map(spec => <MembershipBadge key={spec} type={spec} />)}
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex items-center justify-end mt-4 md:mt-0">
                    <div
                      className="group/btn flex items-center gap-2 rounded-xl bg-[#004aad] px-6 py-3 text-sm font-bold text-white shadow-md shadow-green-200 hover:bg-[#4a8a52] hover:shadow-lg hover:translate-y-[-2px] transition-all whitespace-nowrap"
                    >
                      View Profile
                      <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {!loading && companies.length > 0 && (
            <div className="mt-12 flex justify-center items-center gap-2">
              <button
                onClick={() => {
                  setCurrentPage(p => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Previous
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => {
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-all ${currentPage === page
                      ? 'bg-[#004aad] text-white shadow-md shadow-blue-200'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                      }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setCurrentPage(p => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Next
              </button>
            </div>
          )}

          {/* <aside className="hidden lg:block space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gray-800 text-white rounded-xl p-3 shadow-md"><TrendingUp size={20} /></div>
                <h3 className="font-bold text-lg text-gray-800">Global Inquiries</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">Access curated hotlists, market trends, and member inquiries to stay ahead in the industry.</p>
              <button className="w-full mt-5 rounded-xl bg-gray-800 text-white py-3 text-sm font-bold hover:bg-black transition-all shadow-md hover:shadow-lg hover:translate-y-[-2px]">
                View Hotlists
              </button>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-[#004aad] to-[#4a8a52] p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-10">
                <Award size={120} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 shadow-md"><Award size={20} /></div>
                  <h3 className="font-bold text-lg">Become Verified</h3>
                </div>
                <p className="text-sm text-white/95 leading-relaxed">Increase trust and visibility in the network by getting your profile verified today.</p>
                <button className="w-full mt-5 rounded-xl bg-white text-[#004aad] py-3 text-sm font-bold hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl hover:translate-y-[-2px]">
                  Learn More
                </button>
              </div>
            </div>
          </aside> */}
        </div>
      </main>
    </div>
  );
}
