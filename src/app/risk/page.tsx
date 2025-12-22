'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  memberType: string;
  memberSince: string;
  services?: string[];
  specialties?: string[];
  media?: Media[];
  status?: 'LIVE' | 'SUSPENDED' | 'BLOCKLISTED' | string; // add status
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

// --- Status Seal Component ---
const StatusSeal = ({ status }: { status?: string }) => {
  if (!status) return null;

  const isBlocked = status.toUpperCase() === 'BLOCKLISTED';
  const isSuspended = status.toUpperCase() === 'SUSPENDED';
  if (!isBlocked && !isSuspended) return null;

  // Colors and text for the big watermark and the small pill
  const watermarkBg = isBlocked ? 'bg-red-800/10' : 'bg-amber-700/10';
  const watermarkTextColor = isBlocked ? 'text-red-800' : 'text-amber-700';
  const pillBg = isBlocked ? 'bg-red-600 text-white' : 'bg-amber-500 text-white';

  return (
    <>
      {/* large diagonal watermark */}
      <div
        aria-hidden
        className={`absolute inset-0 pointer-events-none flex items-center justify-center ${watermarkBg}`}
      >
        <div className={`transform -rotate-12 select-none pointer-events-none opacity-90`}>
          <span
            className={`uppercase tracking-widest ${watermarkTextColor} text-[3.2rem] md:text-[4.2rem] lg:text-[5rem] font-black`}
            style={{ WebkitTextStroke: isBlocked ? '1px rgba(0,0,0,0.05)' : '1px rgba(0,0,0,0.02)' }}
          >
            {status}
          </span>
        </div>
      </div>

      {/* small pill top-right */}
      <div className={`absolute top-3 right-3 z-20 ${pillBg} px-3 py-1 rounded-full text-xs font-semibold shadow-md`}>
        {status}
      </div>
    </>
  );
};

// --- Main Page Component ---
function CompaniesListContent() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Filter States ---
  const [country, setCountry] = useState('All');
  const [city, setCity] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [port, setPort] = useState('');

  // --- Report Modal State ---
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [reportCompanies, setReportCompanies] = useState<{ id: string; name: string }[]>([]);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // --- UI State ---
  const tabs = ['Location', 'Company Name', 'Member ID'];
  const [activeTab, setActiveTab] = useState<string>('Location');

  // --- Data Fetching ---
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('action') === 'report') {
      setIsReportModalOpen(true);
    }
  }, [searchParams]);

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
    // you're calling your flagged endpoint — keep that unless you want to reuse /api/companies with a status param
    return `/api/companies/flagged/search?${new URLSearchParams(params).toString()}`;
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

      // Fetch simplified company list for report dropdown if not already fetched
      if (reportCompanies.length === 0) {
        fetch('/api/companies/list')
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) setReportCompanies(data);
          })
          .catch(err => console.error("Failed to load companies for report", err));
      }
    } catch (err) {
      setCompanies([]);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

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
            <div className="w-1.5 h-8 bg-red-600 rounded-full"></div>
            <h1 className="text-3xl font-bold text-gray-800">Risk Management</h1>
          </div>
          <p className="text-gray-500 ml-6">Review flagged, suspended, and blocklisted companies for risk assessment</p>
        </div>

        {/* Search Section */}
        <div className="mb-8 p-8 rounded-2xl bg-white border border-gray-100 shadow-lg shadow-gray-200/50">
          <div className="flex border-b border-gray-100 mb-6 -mx-2">
            {tabs.map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-6 py-3 font-bold text-sm transition-all duration-300 relative ${activeTab === t
                  ? 'text-red-600'
                  : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                {t}
                {activeTab === t && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full"></div>
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
              className="group flex h-12 px-6 items-center justify-center gap-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all shadow-lg shadow-red-200 hover:shadow-xl hover:translate-y-[-2px] focus:outline-none focus:ring-4 focus:ring-red-100 font-bold"
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
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-red-600"></div>
                  <p className="text-gray-500 font-medium mt-4">Loading flagged companies...</p>
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
                <h3 className="text-lg font-bold text-gray-800 mb-1">No flagged companies found</h3>
                <p className="text-gray-500 text-sm">Try adjusting your search criteria</p>
              </div>
            )}


            {!loading && companies.length > 0 && companies.map(company => {
              const logoUrl = company.media?.[0]?.url || null;
              const memberYears = getMembershipYears(company.memberSince);
              const displayLocation = `${company.location?.city || ''}${company.location?.country ? `, ${company.location.country}` : ''}`;

              return (
                <div key={company.id} className="group relative flex flex-col md:flex-row gap-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-xl hover:border-red-200 hover:translate-y-[-2px] transition-all duration-300 overflow-hidden">
                  {/* Status Seal (big watermark + small pill) */}
                  <StatusSeal status={company.status} />

                  {/* Decorative border on hover */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <div className="flex-shrink-0 flex md:flex-col items-center gap-3">
                    <div className="relative h-24 w-24 flex-shrink-0 border-2 border-gray-100 rounded-xl p-2 bg-gradient-to-br from-gray-50 to-white shadow-sm group-hover:border-red-200 transition-colors">
                      {logoUrl ? (
                        <Image src={logoUrl} alt={`${company.name} logo`} fill style={{ objectFit: 'contain' }} className="rounded-lg" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-xl bg-gray-50 text-gray-300">
                          <Building size={36} />
                        </div>
                      )}
                    </div>
                    {memberYears > 0 && (
                      <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-100 to-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 shadow-sm border border-amber-200/50">
                        <Star size={12} className="text-amber-500 fill-amber-500" />
                        {memberYears}Y
                      </div>
                    )}
                  </div>

                  <div className="flex-grow flex flex-col min-w-0">
                    <Link href={`/company/details/${company.id}`}>
                      <h2 className="text-xl font-bold text-gray-800 group-hover:text-red-600 transition-colors truncate">{company.name}</h2>
                    </Link>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-2">
                      <MapPin size={14} className="shrink-0" />
                      <span className="truncate">{displayLocation || 'Location not specified'}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-5">
                      {company.isVerified && <MembershipBadge isVerified={true} />}
                      <MembershipBadge type={company.memberType} />
                      {company.specialties?.slice(0, 2).map(spec => <MembershipBadge key={spec} type={spec} />)}
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex items-center justify-end mt-4 md:mt-0">
                    <Link
                      href={`/company/details/${company.id}`}
                      className="group/btn flex items-center gap-2 rounded-xl bg-gray-800 px-6 py-3 text-sm font-bold text-white shadow-md shadow-gray-300 hover:bg-black hover:shadow-lg hover:translate-y-[-2px] transition-all focus:outline-none focus:ring-4 focus:ring-gray-200 whitespace-nowrap"
                    >
                      View Profile
                      <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="hidden lg:block space-y-6">
            {/* <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-600 text-white rounded-xl p-3 shadow-md"><TrendingUp size={20} /></div>
                <h3 className="font-bold text-lg text-gray-800">Risk Alerts</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">Monitor flagged companies and receive alerts about potential risks in your network.</p>
              <button className="w-full mt-5 rounded-xl bg-red-600 text-white py-3 text-sm font-bold hover:bg-red-700 transition-all shadow-md hover:shadow-lg hover:translate-y-[-2px]">
                View Alerts
              </button>
            </div> */}
            <div className="rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-10">
                <Award size={120} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 shadow-md"><Award size={20} /></div>
                  <h3 className="font-bold text-lg">Report an Issue</h3>
                </div>
                <p className="text-sm text-white/95 leading-relaxed">Help maintain network integrity by reporting suspicious companies or activities.</p>
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="w-full mt-5 rounded-xl bg-white text-gray-800 py-3 text-sm font-bold hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl hover:translate-y-[-2px]"
                >
                  Submit Report
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Submit a Report</h3>
              <button onClick={() => setIsReportModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!selectedCompanyId || !reportReason) return;

              setIsSubmittingReport(true);
              try {
                const res = await fetch('/api/reports', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ companyId: selectedCompanyId, reason: reportReason })
                });

                if (res.ok) {
                  alert('Report submitted successfully. Thank you for helping keep the network safe.');
                  setIsReportModalOpen(false);
                  setReportReason('');
                  setSelectedCompanyId('');
                } else {
                  alert('Failed to submit report. Please try again.');
                }
              } catch (error) {
                console.error(error);
                alert('An error occurred. Please try again.');
              } finally {
                setIsSubmittingReport(false);
              }
            }} className="p-6 space-y-4">

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Company Name</label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="w-full rounded-xl border-gray-300 p-3 text-sm focus:ring-[#004aad] focus:border-[#004aad] transition shadow-sm"
                  required
                >
                  <option value="">Select a company</option>
                  {reportCompanies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Reason for Report</label>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-xl border-gray-300 p-3 text-sm focus:ring-[#004aad] focus:border-[#004aad] transition shadow-sm min-h-[120px]"
                  placeholder="Describe the suspicious activity or reason for reporting..."
                  required
                ></textarea>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="w-full rounded-xl bg-red-600 text-white py-3 text-sm font-bold hover:bg-red-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompaniesListPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CompaniesListContent />
    </React.Suspense>
  );
}
