// app/company/details/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Briefcase,
  Calendar,
  MapPin,
  Users,
  Globe,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";

// Accept promise-typed params to satisfy Next 15 PageProps, but don't use it in client
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
  };
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

        const formattedData: CompanyDetails = {
          ...data,
          established: data.established ? new Date(data.established).getFullYear().toString() : "",
          memberSince: data.memberSince ? new Date(data.memberSince).getFullYear().toString() : "",
          services:
            data.about
              ?.split(" - ")
              .slice(1)
              .map((s: string) => s.split("\n")[0].trim()) || [],
          about: data.about?.split("Regular Services")[0].trim() || data.about || "",
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
        <div className="rounded-lg bg-red-50 p-8 text-center shadow-md">
          <h2 className="text-2xl font-bold text-red-700">Error</h2>
          <p className="mt-2 text-red-600">{error}</p>
          <Link
            href="/company/details"
            className="mt-6 inline-block rounded-md bg-red-600 px-6 py-2 text-white hover:bg-red-700"
          >
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-xl text-gray-500">Company not found.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <div className="container mx-auto p-4 md:p-8">
        <div className="mb-6">
          <Link
            href="/directory"
            className="flex items-center text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Search
          </Link>
        </div>

        <header className="bg-white rounded-lg shadow-md p-6 mb-8 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="w-20 h-20 bg-indigo-600 text-white flex items-center justify-center rounded-full mr-6 text-3xl font-bold">
              {companyData.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-extrabold text-gray-800">{companyData.name}</h1>
                {companyData.isVerified && <CheckCircle className="h-7 w-7 text-green-500" />}
              </div>
              <span className="text-indigo-500 font-semibold text-lg">
                {companyData.memberType} Member
              </span>
            </div>
          </div>
          <div className="text-right">
            <a
              href={withProtocol(companyData.website)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg"
            >
              <Globe className="mr-2 h-5 w-5" />
              Visit Website
            </a>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 border-indigo-200 pb-3">
                About Us
              </h2>
              <p className="text-gray-600 leading-relaxed text-lg">{companyData.about}</p>
            </div>

            {companyData.services && companyData.services.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 border-indigo-200 pb-3">
                  Our Services
                </h2>
                <ul className="space-y-3 list-disc list-inside text-gray-600">
                  {companyData.services.map((service, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-indigo-500 mr-3 mt-1">&#10003;</span>
                      <span>{service}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {companyData.media?.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 border-indigo-200 pb-3">
                  Gallery
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {companyData.media.map((item) => (
                    <div key={item.id} className="overflow-hidden rounded-lg shadow-lg">
                      <Image
                        src={item.url}
                        alt={item.altText || "Company image"}
                        width={600}
                        height={400}
                        className="w-full h-auto object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-8">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-indigo-200 pb-3">
                Company Details
              </h3>
              <ul className="space-y-5 text-gray-600">
                <li className="flex items-center">
                  <Briefcase className="w-6 h-6 mr-4 text-indigo-500" />
                  <div>
                    <span className="font-semibold">Member Since:</span> {companyData.memberSince}
                  </div>
                </li>
                <li className="flex items-center">
                  <Calendar className="w-6 h-6 mr-4 text-indigo-500" />
                  <div>
                    <span className="font-semibold">Established:</span> {companyData.established}
                  </div>
                </li>
                <li className="flex items-center">
                  <Users className="w-6 h-6 mr-4 text-indigo-500" />
                  <div>
                    <span className="font-semibold">Company Size:</span> {companyData.size}
                  </div>
                </li>
                <li className="flex items-center">
                  <Globe className="w-6 h-6 mr-4 text-indigo-500" />
                  <div>
                    <span className="font-semibold">Website:</span>{" "}
                    <a
                      href={withProtocol(companyData.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline break-all"
                    >
                      {companyData.website}
                    </a>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-indigo-200 pb-3">
                Location
              </h3>
              <address className="not-italic text-gray-600 space-y-4">
                <div className="flex items-start">
                  <MapPin className="w-6 h-6 mr-4 text-indigo-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold">{companyData.location.address}</p>
                    <p>
                      {companyData.location.city}, {companyData.location.state}{" "}
                      {companyData.location.zipCode}
                    </p>
                    <p>{companyData.location.country}</p>
                  </div>
                </div>
              </address>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
