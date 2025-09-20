"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

// Define the types for the company data
interface Media {
  id: string;
  type: "IMAGE" | "VIDEO";
  url: string;
  altText: string | null;
}

interface Location {
  id: string;
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
  memberType: string;
  name: string;
  website?: string | null;
  established?: string | null;
  size?: string | null;
  about?: string | null;
  memberSince?: string | null;
  logoUrl?: string | null;
  media?: Media[];
  location?: Location | null;
}

const CompanyProfilePage = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // only fetch when we have a companyId
    const companyId = user?.companyId;
    if (!companyId) {
      // If auth is still loading, keep "loading" true so UI can wait.
      setLoading(true);
      return;
    }

    const controller = new AbortController();
    const fetchCompanyData = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(`/api/companies/${companyId}`, {
          method: "GET",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!resp.ok) {
          // give a useful message for non-2xx
          const text = await resp.text().catch(() => "");
          throw new Error(
            `Failed to fetch company data (status ${resp.status}). ${text}`
          );
        }

        const data = (await resp.json()) as Company;

        // Basic validation/normalization to avoid runtime crashes
        setCompany({
          id: data.id,
          memberId: data.memberId ?? "",
          memberType: data.memberType ?? "",
          name: data.name ?? "Unnamed Company",
          website: data.website ?? null,
          established: data.established ?? null,
          size: data.size ?? null,
          about: data.about ?? null,
          memberSince: data.memberSince ?? null,
          logoUrl: data.logoUrl ?? null,
          media: Array.isArray(data.media) ? data.media : [],
          location: data.location ?? null,
        });
      } catch (err) {
        if ((err as any).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
    return () => controller.abort();
    // only re-run when companyId changes
  }, [user?.companyId]);

  if (loading) {
    return <div className="text-center mt-10">Loading profile...</div>;
  }

  if (error) {
    return (
      <div className="text-center mt-10 text-red-500">Error: {error}</div>
    );
  }

  if (!company) {
    return (
      <div className="text-center mt-10">
        Could not load company profile data.
      </div>
    );
  }

  // The user is viewing their own profile, so they can always edit.
  const canEdit = true;

  // helper safe formatting
  const getYear = (dateStr?: string | null) => {
    try {
      if (!dateStr) return "—";
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return "—";
      return d.getFullYear();
    } catch {
      return "—";
    }
  };

  const formatDate = (dateStr?: string | null) => {
    try {
      if (!dateStr) return "—";
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return "—";
      return d.toLocaleDateString();
    } catch {
      return "—";
    }
  };

  // normalize website link (add protocol if missing)
  const normalizedWebsite =
    company.website && /^https?:\/\//i.test(company.website)
      ? company.website
      : company.website
      ? `https://${company.website}`
      : null;

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-3xl font-bold text-gray-800">{company.name}</h1>
          {canEdit && (
            <button
              onClick={() => router.push(`/company/${company.id}/edit`)}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
            >
              Edit Profile
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Company Details
            </h2>
            <div className="space-y-3">
              <p>
                <strong>Member ID:</strong> {company.memberId || "—"}
              </p>
              <p>
                <strong>Member Type:</strong>{" "}
                <span className="text-green-600 font-medium">
                  {company.memberType || "—"}
                </span>
              </p>
              <p>
                <strong>Established:</strong> {getYear(company.established)}
              </p>
              <p>
                <strong>Company Size:</strong> {company.size || "—"}
              </p>
              <p>
                <strong>Member Since:</strong>{" "}
                {formatDate(company.memberSince)}
              </p>
              <p>
                <strong>Website:</strong>{" "}
                {normalizedWebsite ? (
                  <a
                    href={normalizedWebsite}
                    className="text-blue-500 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {company.website}
                  </a>
                ) : (
                  "—"
                )}
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Location
            </h2>
            <div className="space-y-3">
              <p>{company.location?.address || "—"}</p>
              <p>
                {company.location?.city || "—"}
                {company.location?.city ? ", " : ""}{" "}
                {company.location?.state || "—"}{" "}
                {company.location?.zipCode ? `- ${company.location.zipCode}` : ""}
              </p>
              <p>{company.location?.country || "—"}</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">About Us</h2>
          <p className="text-gray-600 leading-relaxed whitespace-pre-line">
            {company.about || "No description provided."}
          </p>
        </div>

        {company.media && company.media.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Media</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {company.media.map((mediaItem) => (
                <div
                  key={mediaItem.id}
                  className="overflow-hidden rounded-lg shadow-sm"
                >
                  {mediaItem.type === "IMAGE" && (
                    <img
                      src={mediaItem.url}
                      alt={mediaItem.altText || "Company media"}
                      className="w-full h-auto object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyProfilePage;
