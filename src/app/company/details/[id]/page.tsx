// app/company/details/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { Lock } from "lucide-react";
import {
  Briefcase,
  Calendar,
  MapPin,
  Users,
  Globe,
  CheckCircle,
  ArrowLeft,
  Phone,
  Mail,
  MessageCircle, // WeChat usually
  MessageSquare, // Skype usually
  Award,
  User,
  Quote,
} from "lucide-react";

// Accept promise-typed params for Next 15
type PageProps = { params: Promise<{ id: string }> };

interface CompanyDetails {
  id: string;
  name: string;
  memberType: string;
  website: string;
  established: string;
  size: string;
  about: string;
  services?: string[];
  memberSince: string;
  logoUrl?: string | null;
  isVerified?: boolean;
  media: { id: string; url: string; altText?: string | null }[];
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    mobile?: string | null;
    email?: string | null;
    skype?: string | null;
    wechat?: string | null;
    contactPerson?: string | null;
    contactPersonDesignation?: string | null;
  };
  directors?: string | null;
  participationYears?: string | null;
  scopeOfBusiness?: string | null;
  servicesOffered?: string | null;
}

function withProtocol(url?: string | null) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

export default function CompanyProfilePage(_props: PageProps) {
  const { id: companyId } = useParams<{ id: string }>();
  const [companyData, setCompanyData] = useState<CompanyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [canViewContact, setCanViewContact] = useState(false);

  useEffect(() => {
    // Check if user is logged in and has a paid membership
    const checkAccess = async () => {
      if (!user?.companyId) {
        setCanViewContact(false);
        return;
      }

      try {
        // Fetch current user's company details to check membership
        const res = await fetch(`/api/companies/${user.companyId}`);
        if (res.ok) {
          const data = await res.json();
          // Logic: Paid plan if membershipPlan exists and name is NOT 'Free' (or whatever logic defines free)
          // Adjust based on your actual plan naming. Assuming "Free" is the free plan name.
          // Or check if discountPercentage > 0, or check plan slug.
          const planName = data.membershipPlan?.name?.toLowerCase() || "";
          const isPaid = planName && !planName.includes("free");
          setCanViewContact(!!isPaid);
        }
      } catch (e) {
        console.error("Failed to check membership status", e);
        setCanViewContact(false);
      }
    };
    checkAccess();
  }, [user]);

  useEffect(() => {
    if (!companyId) return;

    let cancelled = false;

    const fetchCompanyData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/companies/${companyId}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to fetch company data. Status: ${res.status}`);
        const data = await res.json();

        if (cancelled) return;

        // Parse Services: Prioritize 'servicesOffered', then 'services' array, then 'about' parsing legacy
        let parsedServices: string[] = [];
        if (data.servicesOffered) {
          // If it's a raw string in servicesOffered, we might split by newlines for list display if desired, 
          // or just keep it as text in the new UI.
          // For now, let's keep the legacy `services` array map if it exists too.
        }

        const legacyServices = data.services?.map((s: any) => s.type) || [];

        const formattedData: CompanyDetails = {
          ...data,
          established: data.established ? new Date(data.established).getFullYear().toString() : "",
          memberSince: data.memberSince ? new Date(data.memberSince).getFullYear().toString() : "",
          services: legacyServices.length > 0 ? legacyServices : [],
          about: data.about || "",
        };

        setCompanyData(formattedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-red-600 text-xl font-bold">!</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unavailable</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/directory" className="inline-block bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition">
            Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  if (!companyData) return null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-12">
      {/* --- HERO SECTION --- */}
      <div className="relative bg-gradient-to-r from-slate-900 to-indigo-900 h-64 md:h-80">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url(/pattern-grid.svg)' }}></div>
        <div className="container mx-auto px-4 h-full relative">
          <Link href="/directory" className="absolute top-6 left-4 md:left-8 text-white/80 hover:text-white flex items-center transition">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-24 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-10 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            {/* Logo */}
            <div className="relative w-32 h-32 md:w-40 md:h-40 bg-white rounded-xl shadow-md border border-gray-100 p-2 flex-shrink-0 -mt-16 md:-mt-20 overflow-hidden">
              {companyData.logoUrl ? (
                <Image src={companyData.logoUrl} alt={companyData.name} fill className="object-contain p-2" />
              ) : (
                <div className="w-full h-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-4xl font-bold rounded-lg">
                  {companyData.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Title & Badge */}
            <div className="flex-grow pt-2">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">{companyData.name}</h1>
                {companyData.isVerified && (
                  <div className="bg-green-100 text-green-700 p-1 rounded-full" title="Verified Member">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-gray-600 font-medium">
                <span className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  {companyData.memberType} Member
                </span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {companyData.location.country}
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex-shrink-0 w-full md:w-auto mt-4 md:mt-0">
              <a href={withProtocol(companyData.website)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full md:w-auto gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5">
                <Globe className="w-5 h-5" />
                Visit Website
              </a>
            </div>
          </div>
        </div>

        {/* --- MAIN GRID CONTENT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN (Main Info) */}
          <div className="lg:col-span-2 space-y-8">

            {/* About Section */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Quote className="w-6 h-6 text-indigo-500 mr-3 opacity-50" />
                About Company
              </h2>
              <div className="prose prose-indigo max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
                {companyData.about}
              </div>
            </section>

            {/* Services & Scope */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 px-2 border-l-4 border-indigo-500">
                Capabilities & Services
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Services List */}
                {/* Services List */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 bg-gray-50 inline-block px-3 py-1 rounded-md">Services Offered</h3>
                  {(() => {
                    // Combine and parse services
                    const items: string[] = [];
                    if (companyData.servicesOffered) {
                      items.push(...companyData.servicesOffered.split(/[,;\n]+/).map(s => s.trim()).filter(s => s.length > 0));
                    }
                    const legacyServices = companyData.services || [];
                    const allServices = [...new Set([...items, ...legacyServices])];

                    if (allServices.length > 0) {
                      return (
                        <div className="flex flex-wrap gap-2">
                          {allServices.map((svc, i) => (
                            <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-colors shadow-sm">
                              <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                              {svc}
                            </span>
                          ))}
                        </div>
                      );
                    }

                    return <p className="text-gray-400 italic">No specific services listed.</p>;
                  })()}
                </div>

                {/* Scope of Business */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 bg-gray-50 inline-block px-3 py-1 rounded-md">Scope of Business</h3>
                  {(() => {
                    const items: string[] = [];
                    if (companyData.scopeOfBusiness) {
                      // Heuristic: if it contains newlines or commas, treat as list. 
                      // If just a long text without commas, maybe keep as text?
                      // Given the example "sdfdsf,asdf,asdfd", it is a list.
                      if (companyData.scopeOfBusiness.includes(',') || companyData.scopeOfBusiness.includes('\n')) {
                        items.push(...companyData.scopeOfBusiness.split(/[,;\n]+/).map(s => s.trim()).filter(s => s.length > 0));
                      } else {
                        // Determine if it's likely a sentence or a single item tag
                        // For now let's just make it a chip if it's short (< 50 chars)? 
                        // Or just default to chip if requested "like chip like ui".
                        // Let's treat as single item if short, or paragraph if long?
                        if (companyData.scopeOfBusiness.length < 50) {
                          items.push(companyData.scopeOfBusiness.trim());
                        } else {
                          return <p className="text-gray-600 whitespace-pre-line leading-relaxed">{companyData.scopeOfBusiness}</p>;
                        }
                      }
                    }

                    if (items.length > 0) {
                      return (
                        <div className="flex flex-wrap gap-2">
                          {items.map((scope, i) => (
                            <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition-colors shadow-sm">
                              <Briefcase className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                              {scope}
                            </span>
                          ))}
                        </div>
                      );
                    }

                    if (!companyData.scopeOfBusiness) {
                      return <p className="text-gray-400 italic">Scope of business details not added.</p>;
                    }
                    return null; // Should be handled by else block above
                  })()}
                </div>
              </div>
            </section>

            {/* Media Gallery */}
            {companyData.media && companyData.media.length > 0 && (
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {companyData.media.map((item) => (
                    <div key={item.id} className="group relative aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-zoom-in">
                      <Image src={item.url} alt={item.altText || "Gallery Image"} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT COLUMN (Sidebar Stats & Contact) */}
          <div className="space-y-6 relative">

            {/* Key Contact Card */}
            <div className={`bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden ${!canViewContact ? 'blur-sm select-none' : ''}`}>
              <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
                <User className="w-32 h-32" />
              </div>

              <h3 className="text-indigo-100 font-semibold uppercase tracking-wider text-xs mb-4">Key Contact Person</h3>

              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl font-bold border-2 border-white/30">
                  {companyData.location.contactPerson ? companyData.location.contactPerson.charAt(0) : <User />}
                </div>
                <div>
                  <div className="text-xl font-bold">{companyData.location.contactPerson || "N/A"}</div>
                  <div className="text-indigo-200 text-sm">{companyData.location.contactPersonDesignation || "Designation N/A"}</div>
                </div>
              </div>

              <div className="space-y-3 relative z-10 text-sm">
                {companyData.location.mobile && (
                  <div className="flex items-center gap-3 bg-white/10 p-2 rounded-lg">
                    <Phone className="w-4 h-4 text-indigo-200" />
                    <span>{companyData.location.mobile}</span>
                  </div>
                )}
                {companyData.location.email && (
                  <div className="flex items-center gap-3 bg-white/10 p-2 rounded-lg break-all">
                    <Mail className="w-4 h-4 text-indigo-200" />
                    <a href={`mailto:${companyData.location.email}`} className="hover:text-white hover:underline">{companyData.location.email}</a>
                  </div>
                )}
              </div>
            </div>

            {/* UPGRADE OVERLAY FOR CONTACT CARD */}
            {!canViewContact && (
              <div className="absolute top-0 left-0 w-full h-[300px] flex items-center justify-center z-20">
                <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-indigo-100 text-center max-w-xs mx-auto">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Member Exclusive</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Please upgrade to a paid membership plan to view contact details.
                  </p>
                  {!user ? (
                    <Link href="/company/login" className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-sm">
                      Login now
                    </Link>
                  ) : (
                    <Link href="/membership/become-member" className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-sm">
                      Upgrade Membership
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Wrapper for right column relative positioning */}
          </div>

          {/* Actual sidebar container adjustment needed? No, removing the outer div wrapper I just assumed might break layout. 
               Wait, the original code had  <div className="space-y-6"> as the right column wrapper. 
               I need to be careful with the overlay positioning. 
               Let's attach the overlay to the "Key Contact Card" specifically, or replace the card content if restricted?
               The user requirement: "hide the contact and place a info that show buy a membership".
               
               Better approach: 
               If !canViewContact, render a "Locked Contact Card" component INSTEAD of the real one (or obscure it).
            */}

          {/* Location & Quick Stats */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative">
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Company Overview</h3>

            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin className="w-5 h-5 text-indigo-500 mt-0.5 mr-3" />
                <div className="text-sm text-gray-600">
                  <strong className="block text-gray-900 mb-1">Headquarters</strong>
                  {companyData.location.address}<br />
                  {companyData.location.city}, {companyData.location.state} {companyData.location.zipCode}<br />
                  {companyData.location.country}
                </div>
              </li>

              <li className="flex items-center">
                <Calendar className="w-5 h-5 text-indigo-500 mr-3" />
                <div className="text-sm text-gray-600">
                  <strong className="text-gray-900">Established:</strong> {companyData.established}
                </div>
              </li>

              <li className="flex items-center">
                <Users className="w-5 h-5 text-indigo-500 mr-3" />
                <div className="text-sm text-gray-600">
                  <strong className="text-gray-900">Size:</strong> {companyData.size}
                </div>
              </li>

              <li className="pt-2 relative">
                {/* CONNECT SECTION LOCK */}
                <h4 className="text-xs uppercase text-gray-400 font-bold mb-2">Connect</h4>
                {!canViewContact ? (
                  <div className="bg-gray-100 rounded-lg p-3 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span>Contacts hidden</span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {companyData.location.skype && (
                      <div className="bg-sky-50 text-sky-600 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" /> {companyData.location.skype}
                      </div>
                    )}
                    {companyData.location.wechat && (
                      <div className="bg-green-50 text-green-600 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5" /> {companyData.location.wechat}
                      </div>
                    )}
                  </div>
                )}
              </li>
            </ul>
          </div>

          {/* Directors & IGLA */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Leadership</h3>
            {companyData.directors ? (
              <div className="text-gray-600 text-sm leading-relaxed mb-6">
                {companyData.directors}
              </div>
            ) : (
              <div className="text-gray-400 text-sm italic mb-6">Not listed</div>
            )}

            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">IGLA Network</h3>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="bg-indigo-50 p-2 rounded-lg">
                <Award className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <div className="font-bold">Participation</div>
                <div className="text-gray-500">{companyData.participationYears || "New Member"}</div>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
