"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";

// Accept promise-typed params to satisfy Next 15 PageProps at build time.
// Do not use it directly in a client component; use useParams instead.
type PageProps = { params: Promise<{ id: string }> };

type LocationPayload = {
  id?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zipCode?: string | null;
  phone?: string | null;
  fax?: string | null;
  email?: string | null;
};

type CompanyPayload = {
  id?: string;
  name: string;
  website?: string | null;
  established?: string | null;
  size?: string | null;
  about?: string | null;
  memberId?: string | null;
  memberType?: string | null;
  memberSince?: string | null;
  location?: LocationPayload | null;
};

const CompanyEditPage: React.FC<PageProps> = (_props) => {
  const router = useRouter();
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const companyId = params.id;

  const [company, setCompany] = useState<CompanyPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;

    const fetchCompany = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/companies/${companyId}`, { cache: "no-store" });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`Failed to load: ${res.status} ${txt}`);
        }
        const data = await res.json();
        if (cancelled) return;

        setCompany({
          id: data.id,
          name: data.name ?? "",
          website: data.website ?? "",
          established: data.established ?? "",
          size: data.size ?? "",
          about: data.about ?? "",
          memberId: data.memberId ?? null,
          memberType: data.memberType ?? null,
          memberSince: data.memberSince ?? null,
          location: data.location ?? {
            id: null,
            address: "",
            city: "",
            state: "",
            country: "",
            zipCode: "",
            phone: "",
            fax: "",
            email: "",
          },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!company) return <div className="p-6 text-red-600">Unable to load company.</div>;

  const handleChange = (k: keyof CompanyPayload, v: any) => {
    setCompany((p) => (p ? { ...p, [k]: v } : p));
  };

  const handleLocationChange = (k: keyof LocationPayload, v: any) => {
    setCompany((p) =>
      p
        ? {
            ...p,
            location: {
              ...(p.location || {}),
              [k]: v,
            },
          }
        : p
    );
  };

  const validate = (): string | null => {
    if (!company.name || company.name.trim().length < 2) return "Company name is required.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: company.name,
        website: company.website || null,
        established: company.established || null,
        size: company.size || null,
        about: company.about || null,
        location: company.location || null,
      };
      const res = await fetch(`/api/companies/${companyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Save failed: ${res.status} ${txt}`);
      }
      router.push(`/account`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-3xl bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-semibold mb-4">Edit Company</h2>

        {error && <div className="mb-4 text-red-600">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Company Name</label>
            <input
              value={company.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="mt-1 block w-full border rounded p-2"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Website</label>
              <input
                value={company.website ?? ""}
                onChange={(e) => handleChange("website", e.target.value)}
                className="mt-1 block w-full border rounded p-2"
                placeholder="example.com or https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Established (YYYY-MM-DD)</label>
              <input
                value={company.established ?? ""}
                onChange={(e) => handleChange("established", e.target.value)}
                className="mt-1 block w-full border rounded p-2"
                placeholder="2020-01-01"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Company Size</label>
            <input
              value={company.size ?? ""}
              onChange={(e) => handleChange("size", e.target.value)}
              className="mt-1 block w-full border rounded p-2"
              placeholder="e.g. 10-50 employees"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">About</label>
            <textarea
              value={company.about ?? ""}
              onChange={(e) => handleChange("about", e.target.value)}
              className="mt-1 block w-full border rounded p-2"
              rows={6}
            />
          </div>

          <hr />

          <h3 className="text-lg font-medium">Location</h3>

          <div>
            <label className="block text-sm font-medium">Address</label>
            <input
              value={company.location?.address ?? ""}
              onChange={(e) => handleLocationChange("address", e.target.value)}
              className="mt-1 block w-full border rounded p-2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium">City</label>
              <input
                value={company.location?.city ?? ""}
                onChange={(e) => handleLocationChange("city", e.target.value)}
                className="mt-1 block w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">State</label>
              <input
                value={company.location?.state ?? ""}
                onChange={(e) => handleLocationChange("state", e.target.value)}
                className="mt-1 block w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Zip / Postal</label>
              <input
                value={company.location?.zipCode ?? ""}
                onChange={(e) => handleLocationChange("zipCode", e.target.value)}
                className="mt-1 block w-full border rounded p-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Country</label>
              <input
                value={company.location?.country ?? ""}
                onChange={(e) => handleLocationChange("country", e.target.value)}
                className="mt-1 block w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Phone</label>
              <input
                value={company.location?.phone ?? ""}
                onChange={(e) => handleLocationChange("phone", e.target.value)}
                className="mt-1 block w-full border rounded p-2"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={() => router.push(`/company/${companyId}`)}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyEditPage;
