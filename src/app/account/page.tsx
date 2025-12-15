'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Building2, MapPin, Globe, Calendar, Edit3, CheckCircle } from 'lucide-react';

interface Media {
  id: string;
  type: 'IMAGE' | 'VIDEO' | string;
  url: string;
  altText?: string | null;
}

interface Location {
  id?: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zipCode?: string | null;
  phone?: string | null;
  fax?: string | null;
  email?: string | null;
  companyId?: string | null;
}

interface Company {
  id: string;
  memberId: string;
  memberType?: string | null;
  name: string;
  website?: string | null;
  established?: string | null;
  size?: string | null;
  about?: string | null;
  memberSince?: string | null;
  logoUrl?: string | null;
  media?: Media[];
  location?: Location | null;
  isVerified?: boolean;
  status?: 'LIVE' | 'BLOCKLISTED' | 'SUSPENDED' | string;
  membershipPlan?: {
    name: string;
    paymentProtection?: string | null;
    discountPercentage?: number | null;
  } | null;
}

export default function CompanyProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const companyId = user?.companyId;

    if (!companyId) {
      if (isMounted) {
        setCompany(null);
        setLoading(false);
      }
      return () => { isMounted = false; };
    }

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(`/api/companies/${companyId}`, { headers: { 'Content-Type': 'application/json' } });
        if (!resp.ok) throw new Error(`Failed to fetch company (status ${resp.status})`);
        const data = (await resp.json()) as Company;
        if (!isMounted) return;
        setCompany({
          id: data.id,
          memberId: data.memberId ?? '',
          memberType: data.memberType ?? '',
          name: data.name ?? 'Untitled Company',
          website: data.website ?? null,
          established: data.established ?? null,
          size: data.size ?? null,
          about: data.about ?? null,
          memberSince: data.memberSince ?? null,
          logoUrl: data.logoUrl ?? null,
          media: Array.isArray(data.media) ? data.media : [],
          location: data.location ?? null,
          isVerified: (data as any).isVerified ?? false,
          status: data.status ?? 'LIVE',
          membershipPlan: data.membershipPlan ?? null,
        });
      } catch (err: any) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    run();
    return () => { isMounted = false; };
  }, [user?.companyId]);



  // Small helpers
  const getYear = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';
    return String(d.getFullYear());
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString();
  };

  const membershipYears = (memberSince?: string | null) => {
    if (!memberSince) return 0;
    const diff = Date.now() - new Date(memberSince).getTime();
    return Math.floor(diff / (1000 * 3600 * 24 * 365));
  };

  const normalizedWebsite = (w?: string | null) =>
    w ? (/^https?:\/\//i.test(w) ? w : `https://${w}`) : null;

  // UI: Loading skeleton
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-40 rounded-lg bg-gray-200 mb-6" />
          <div className="h-6 w-1/3 bg-gray-200 rounded mb-4" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          <strong>Error loading profile:</strong>
          <div className="mt-2">{error}</div>
        </div>
      </div>
    );
  }

  // No profile (user not associated with company)
  if (!company) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center">
          <Building2 className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No company profile</h2>
          <p className="text-slate-600 mb-4">You don't have a company linked to your account yet.</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => router.push('/company/register')} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Create Company</button>
            <button onClick={() => router.push('/dashboard')} className="px-4 py-2 border rounded">Go to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  // Main profile UI
  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header: cover + logo */}
        <div className="relative h-40 bg-gradient-to-r from-indigo-700 to-cyan-600">
          {/* Logo */}
          <div className="absolute left-6 bottom-[-36px]">
            <div className="h-28 w-28 rounded-xl bg-white p-2 shadow-lg flex items-center justify-center overflow-hidden">
              {company.logoUrl ? (
                // using <img> avoids next.config change — swap to next/image if desired
                <img src={company.logoUrl} alt={`${company.name} logo`} className="object-contain h-full w-full" />
              ) : (
                <Building2 className="h-12 w-12 text-indigo-600" />
              )}
            </div>
          </div>

          <div className="absolute right-6 top-4 flex items-center gap-3">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white rounded-full px-3 py-1">
              <span className="text-sm">Status:</span>
              <span className={`text-xs font-semibold px-2 py-1 rounded ${company.status === 'BLOCKLISTED' ? 'bg-red-700' : company.status === 'SUSPENDED' ? 'bg-yellow-600' : 'bg-green-600'}`}>
                {company.status ?? 'LIVE'}
              </span>
            </div>

            {company.isVerified && (
              <div className="inline-flex items-center gap-1 bg-white/20 text-white px-3 py-1 rounded-full">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Verified</span>
              </div>
            )}

            <button
              onClick={() => router.push(`/company/${company.id}/edit`)}
              className="inline-flex items-center gap-2 rounded-md bg-white/90 px-3 py-1.5 text-sm font-medium shadow hover:bg-white"
            >
              <Edit3 className="h-4 w-4 text-slate-700" /> Edit Profile
            </button>
          </div>
        </div>

        <div className="px-6 pt-16 pb-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Left: title + meta */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>{company.location?.city ?? '—'}</span>
                  {company.location?.country && <span>• {company.location.country}</span>}
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>Established: {getYear(company.established)}</span>
                </div>

                {company.memberSince && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">{membershipYears(company.memberSince)} years member</span>
                  </div>
                )}
              </div>

              <div className="mt-6 text-slate-700">
                <h3 className="text-sm font-semibold text-slate-800 mb-2">About</h3>
                <p className="text-sm leading-relaxed whitespace-pre-line">
                  {company.about ?? 'No description provided.'}
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-md border p-4 bg-white">
                  <h4 className="text-xs font-semibold text-slate-500">Website</h4>
                  <div className="mt-2">
                    {company.website ? (
                      <a target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-sm">
                        {company.website}
                      </a>
                    ) : (
                      <span className="text-sm text-slate-500">—</span>
                    )}
                  </div>
                </div>

                <div className="rounded-md border p-4 bg-white">
                  <h4 className="text-xs font-semibold text-slate-500">Company Size</h4>
                  <div className="mt-2 text-sm text-slate-700">{company.size ?? '—'}</div>
                </div>
              </div>

              {/* Membership Details */}
              <div className="mt-6 rounded-md border p-4 bg-indigo-50 border-indigo-100">
                <h4 className="text-sm font-bold text-indigo-900 mb-2">Membership Status</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-indigo-700">
                      {company.membershipPlan?.name || "Free Member"}
                    </div>
                    <div className="text-xs text-indigo-600 mt-1">
                      Member since {getYear(company.memberSince)}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    {company.membershipPlan?.paymentProtection && (
                      <div className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded inline-block">
                        🛡️ {company.membershipPlan.paymentProtection}
                      </div>
                    )}
                    {(company.membershipPlan?.discountPercentage ?? 0) > 0 && (
                      <div className="block mt-1 text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded">
                        🏷️ {company.membershipPlan?.discountPercentage}% Off
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Right column: contact / location card */}
            <aside className="w-full md:w-72">
              <div className="rounded-md border p-4 bg-white sticky top-6">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Location & Contact</h4>
                <div className="text-sm text-slate-600 space-y-2">
                  <div>{company.location?.address ?? '—'}</div>
                  <div>{[company.location?.city, company.location?.state, company.location?.zipCode].filter(Boolean).join(', ') || '—'}</div>
                  <div>{company.location?.country ?? '—'}</div>
                  {company.location?.phone && <div>Phone: <span className="text-slate-800">{company.location.phone}</span></div>}
                  {company.location?.email && <div>Email: <span className="text-slate-800">{company.location.email}</span></div>}
                </div>

                <div className="mt-4 flex gap-2">
                  <button onClick={() => router.push(`/company/${company.id}/edit`)} className="flex-1 rounded-md bg-indigo-600 text-white py-2 text-sm">Edit</button>
                  <button onClick={() => router.push('/dashboard')} className="flex-1 rounded-md border py-2 text-sm">Dashboard</button>
                </div>
              </div>
            </aside>
          </div>

          {/* Media gallery */}
          {company.media && company.media.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Media</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {company.media.map((m) => (
                  <div key={m.id} className="rounded-lg overflow-hidden border bg-white/80 shadow-sm">
                    {m.type === 'IMAGE' ? (
                      <img src={m.url} alt={m.altText ?? company.name} className="w-full h-48 object-cover" />
                    ) : (
                      <div className="h-48 flex items-center justify-center bg-slate-100 text-slate-500">
                        {/* video placeholder */}
                        <span>Media: {m.type}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
