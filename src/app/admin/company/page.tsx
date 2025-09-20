'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  MapPin,
  Building,
  Star,
  CheckCircle,
  Trash2,
  Edit3,
  UserCheck,
  UserX,
} from 'lucide-react';

// -------------------- Types --------------------
interface Media { id: string; url: string; }
interface Location {
  id?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  port?: string;
}

type CompanyStatus = 'LIVE' | 'BLOCKLISTED' | 'SUSPENDED';

interface Company {
  id: string;
  memberId: string;
  memberType?: string | null;
  purchasedMembership?: string | null;
  sector?: string | null;
  name: string;
  website?: string | null;
  established?: string | null;
  size?: string | null;
  about?: string | null;
  memberSince?: string | null;
  location?: Location | null;
  logoUrl?: string | null;
  isVerified: boolean;
  isActive: boolean;
  status?: CompanyStatus; // <-- NEW
  services?: string[];      // adapt to your real types if needed
  partners?: string[];
  certificates?: string[];
  media?: Media[];
  activities?: string[];
}

// -------------------- Helpers / Subcomponents --------------------
const getMembershipYears = (memberSince?: string | null) => {
  if (!memberSince) return 0;
  const d = new Date(memberSince);
  if (isNaN(d.getTime())) return 0;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 3600 * 24 * 365));
};

const MembershipBadge = ({ type, isVerified }: { type?: string | null, isVerified?: boolean }) => {
  const baseStyle = 'rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1.5';
  if (isVerified) {
    return (
      <span className={`${baseStyle} bg-green-100 text-green-800`}>
        <CheckCircle size={14} /> Verified Member
      </span>
    );
  }
  if (!type) return null;
  const styleMap: Record<string, string> = {
    'IGLA Elite': 'bg-blue-100 text-blue-800',
    'IGLA Premium': 'bg-yellow-100 text-yellow-800',
    'IGLA Projects': 'bg-purple-100 text-purple-800',
    'IGLA Dangerous Goods': 'bg-red-100 text-red-800',
  };
  const style = styleMap[type] ?? 'bg-cyan-100 text-cyan-800';
  return <span className={`${baseStyle} ${style}`}>{type}</span>;
};

const StatusBadge = ({ status }: { status?: CompanyStatus }) => {
  const s = status ?? 'LIVE';
  const base = 'rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1.5';
  if (s === 'LIVE') {
    return <span className={`${base} bg-green-100 text-green-800`}>Live</span>;
  } else if (s === 'BLOCKLISTED') {
    return <span className={`${base} bg-red-100 text-red-800`}>Blocklisted</span>;
  } else {
    return <span className={`${base} bg-yellow-100 text-yellow-800`}>Suspended</span>;
  }
};

// -------------------- Main Component --------------------
export default function AdminCompaniesListPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // action loading keyed by company id (string)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Filters & UI state
  const [country, setCountry] = useState('All');
  const [city, setCity] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [port, setPort] = useState('');
  const tabs = ['Location', 'Company Name', 'Member ID'];
  const [activeTab, setActiveTab] = useState<string>('Location');

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCompanies();
    }, 400); // debounce
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
    const qs = new URLSearchParams(params).toString();
    return `/api/companies/search${qs ? `?${qs}` : ''}`;
  };

  async function fetchCompanies() {
    setLoading(true);
    setError(null);
    try {
      const url = buildQuery();
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setCompanies(Array.isArray(data) ? data : []);
    } catch (err) {
      setCompanies([]);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const countryOptions = useMemo(() => ['All', 'India', 'United States', 'China', 'United Kingdom'], []);

  const setCompanyActionLoading = (companyId: string, val: boolean) => {
    setActionLoading(prev => ({ ...prev, [companyId]: val }));
  };

  // -------------------- Actions --------------------

  // Toggle verify: merge response to preserve nested fields if backend returns partial object
  async function handleToggleVerify(company: Company) {
    const companyId = company.id;
    setCompanyActionLoading(companyId, true);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: !company.isVerified }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => `Verify toggle failed: ${res.status}`);
        throw new Error(txt);
      }
      const updatedPartial: Partial<Company> = await res.json();
      setCompanies(prev =>
        prev.map(c => {
          if (c.id !== companyId) return c;
          return {
            ...c,
            ...updatedPartial,
            location: (updatedPartial as any).location ?? c.location,
            media: (updatedPartial as any).media ?? c.media,
          } as Company;
        })
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setCompanyActionLoading(companyId, false);
    }
  }

  // Toggle active/disabled (soft-disable)
  async function handleToggleActive(company: Company) {
    const companyId = company.id;
    // optional confirmation
    const confirmMsg = company.isActive ? 'Disable this company? It will remain in the system but become inactive.' : 'Enable this company?';
    if (!confirm(confirmMsg)) return;

    setCompanyActionLoading(companyId, true);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/toggle-active`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !company.isActive }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => `Toggle active failed: ${res.status}`);
        throw new Error(txt);
      }
      const updatedPartial: Partial<Company> = await res.json();
      setCompanies(prev =>
        prev.map(c => {
          if (c.id !== companyId) return c;
          return {
            ...c,
            ...updatedPartial,
            location: (updatedPartial as any).location ?? c.location,
            media: (updatedPartial as any).media ?? c.media,
          } as Company;
        })
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setCompanyActionLoading(companyId, false);
    }
  }

  // Update member type (merges response)
  async function handleUpdateMemberType(company: Company) {
    const newType = prompt('Enter new member type (leave blank to cancel):', company.purchasedMembership ?? '');
    if (newType === null) return; // canceled
    if (newType.trim() === '') return;

    const companyId = company.id;
    setCompanyActionLoading(companyId, true);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchasedMembership: newType.trim() }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => `Update failed: ${res.status}`);
        throw new Error(txt);
      }
      const updatedPartial: Partial<Company> = await res.json();
      setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, ...updatedPartial, location: (updatedPartial as any).location ?? c.location, media: (updatedPartial as any).media ?? c.media } as Company : c));
      alert('Member type updated.');
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setCompanyActionLoading(companyId, false);
    }
  }

  // Change company status (LIVE | BLOCKLISTED | SUSPENDED)
  async function handleChangeStatus(company: Company, newStatus: CompanyStatus) {
    const companyId = company.id;
    setCompanyActionLoading(companyId, true);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => `Status update failed: ${res.status}`);
        throw new Error(txt);
      }
      const updatedPartial: Partial<Company> = await res.json();
      setCompanies(prev =>
        prev.map(c => {
          if (c.id !== companyId) return c;
          return {
            ...c,
            ...updatedPartial,
            location: (updatedPartial as any).location ?? c.location,
            media: (updatedPartial as any).media ?? c.media,
          } as Company;
        })
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setCompanyActionLoading(companyId, false);
    }
  }

  // -------------------- UI rendering helpers --------------------
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

  // -------------------- Render --------------------
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
              const logoUrl = company.media?.[0]?.url || company.logoUrl || null;
              const memberYears = getMembershipYears(company.memberSince ?? undefined);
              const displayLocation = `${company.location?.city || ''}${company.location?.country ? `, ${company.location.country}` : ''}`.trim();
              const isActionLoading = !!actionLoading[company.id];

              return (
                <div key={company.id} className="group flex flex-col md:flex-row gap-5 rounded-xl border bg-white p-5 shadow-sm hover:shadow-xl hover:border-teal-200 transition-all duration-300 overflow-hidden">
                  <div className="flex-shrink-0 flex md:flex-col items-center gap-4">
                    <div className="relative h-24 w-24 flex-shrink-0 border-2 border-gray-100 rounded-lg p-1.5 bg-white shadow-inner">
                      {logoUrl ? (
                        <Image src={logoUrl} alt={`${company.name} logo`} fill style={{ objectFit: 'contain' }} className="rounded-md" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-lg bg-gray-50 text-gray-400">
                          <Building size={40} />
                        </div>
                      )}
                    </div>
                    {memberYears > 0 && (
                      <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                        <Star size={14} className="text-amber-500" />
                        {memberYears} Year{memberYears > 1 ? 's' : ''} Member
                      </div>
                    )}
                  </div>

                  <div className="flex-grow flex flex-col">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link href={`/company/details/${company.id}`}>
                          <h2 className="text-lg font-bold text-gray-800 group-hover:text-teal-600 transition-colors">{company.name}</h2>
                        </Link>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                          <MapPin size={14} />
                          {displayLocation || '—'}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-4">
                          <StatusBadge status={company.status} />
                          {company.isVerified && <MembershipBadge isVerified={true} />}
                          <MembershipBadge type={company.purchasedMembership ?? undefined} />
                          {company.services?.slice(0, 2).map(spec => <MembershipBadge key={spec} type={spec} />)}
                        </div>
                      </div>

                      {/* Admin action buttons */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/company/${company.id}`} className="inline-flex items-center gap-2 rounded-lg bg-white border px-3 py-2 text-sm font-medium hover:bg-gray-50 focus:outline-none">
                            <Edit3 size={16} /> Edit
                          </Link>

                          <button
                            onClick={() => handleToggleVerify(company)}
                            disabled={isActionLoading}
                            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none border ${company.isVerified ? 'bg-white hover:bg-gray-50' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
                            title={company.isVerified ? 'Unverify company' : 'Verify company'}
                          >
                            {company.isVerified ? <UserX size={16} /> : <UserCheck size={16} />}
                            {company.isVerified ? 'Unverify' : 'Verify'}
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateMemberType(company)}
                            disabled={isActionLoading}
                            className="inline-flex items-center gap-2 rounded-lg bg-white border px-3 py-2 text-sm font-medium hover:bg-gray-50 focus:outline-none"
                          >
                            Update Type
                          </button>

                          <button
                            onClick={() => handleToggleActive(company)}
                            disabled={isActionLoading}
                            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none border ${company.isActive ? 'bg-white hover:bg-gray-50' : 'bg-yellow-600 text-white hover:bg-yellow-700'}`}
                          >
                            {company.isActive ? 'Disable' : 'Enable'}
                          </button>
                        </div>

                        {/* Status selector */}
                        <div className="flex items-center gap-2 mt-1">
                          <select
                            value={company.status ?? 'LIVE'}
                            onChange={(e) => {
                              const newStatus = e.target.value as CompanyStatus;
                              if (!confirm(`Change status of "${company.name}" to ${newStatus}?`)) {
                                // revert visually by re-fetching (cheap)
                                fetchCompanies();
                                return;
                              }
                              handleChangeStatus(company, newStatus);
                            }}
                            disabled={isActionLoading}
                            className="rounded-lg border px-3 py-2 text-sm bg-white"
                            title="Change company status"
                          >
                            <option value="LIVE">Live</option>
                            <option value="BLOCKLISTED">Blocklisted</option>
                            <option value="SUSPENDED">Suspended</option>
                          </select>
                        </div>

                        {isActionLoading && <div className="text-xs text-gray-500 mt-1">Working...</div>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right column placeholder - you can add filters/stats here */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-lg bg-white p-4 border shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
                <p className="text-xs text-gray-500 mt-2">Use the search controls above to filter companies.</p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
