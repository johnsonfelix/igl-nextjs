"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  User,
  Globe,
  Calendar,
  Users,
  Home,
  Info,
  Loader2,
  Building2,
} from "lucide-react";

interface CompanyProfileData {
  name: string;
  website: string;
  established: string; // yyyy-mm-dd
  size: string;
  about: string;
  address: string;
}

export default function CompleteProfileButton({ companyId }: { companyId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState<CompanyProfileData>({
    name: "",
    website: "",
    established: "",
    size: "",
    about: "",
    address: "",
  });

  // focus first field when modal opens
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isModalOpen) return;
    const t = setTimeout(() => firstInputRef.current?.focus(), 50);

    // Close on ESC
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [isModalOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, companyId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "An unknown error occurred.");
      }

      setIsModalOpen(false);
      router.refresh(); // refresh server components
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white/95 px-3.5 py-2.5 pl-10 outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";
  const fieldWrap = "relative";

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600"
      >
        <Building2 className="h-4 w-4" />
        Complete Profile
      </button>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50"
          aria-modal="true"
          role="dialog"
          aria-labelledby="complete-profile-title"
          onClick={(e) => {
            // close when clicking the dim backdrop (but not the card)
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" />

          {/* Modal card */}
          <div className="relative mx-auto flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white/95 shadow-2xl ring-1 ring-black/5 animate-scaleIn">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h3
                    id="complete-profile-title"
                    className="text-xl font-semibold text-slate-900"
                  >
                    Complete Your Company Profile
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Tell us a bit more so your profile looks great to others.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit} className="px-6 py-5">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {/* Name */}
                  <div className={fieldWrap}>
                    <label htmlFor="name" className={labelClass}>
                      Your Name
                    </label>
                    <span className="pointer-events-none absolute left-3 top-[38px] text-slate-400">
                      <User className="h-5 w-5" />
                    </span>
                    <input
                      ref={firstInputRef}
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      required
                      className={inputClass}
                    />
                  </div>

                  {/* Website */}
                  <div className={fieldWrap}>
                    <label htmlFor="website" className={labelClass}>
                      Company Website
                    </label>
                    <span className="pointer-events-none absolute left-3 top-[38px] text-slate-400">
                      <Globe className="h-5 w-5" />
                    </span>
                    <input
                      id="website"
                      name="website"
                      type="url"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="https://yourcompany.com"
                      className={inputClass}
                    />
                  </div>

                  {/* Established */}
                  <div className={fieldWrap}>
                    <label htmlFor="established" className={labelClass}>
                      Date Established
                    </label>
                    <span className="pointer-events-none absolute left-3 top-[38px] text-slate-400">
                      <Calendar className="h-5 w-5" />
                    </span>
                    <input
                      id="established"
                      name="established"
                      type="date"
                      value={formData.established}
                      onChange={handleInputChange}
                      className={inputClass}
                    />
                  </div>

                  {/* Size */}
                  <div className={fieldWrap}>
                    <label htmlFor="size" className={labelClass}>
                      Company Size
                    </label>
                    <span className="pointer-events-none absolute left-3 top-[38px] text-slate-400">
                      <Users className="h-5 w-5" />
                    </span>
                    <input
                      id="size"
                      name="size"
                      type="text"
                      value={formData.size}
                      onChange={handleInputChange}
                      placeholder="e.g., 1–10 employees"
                      className={inputClass}
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Tip: You can use a range like 11–50, 51–200, etc.
                    </p>
                  </div>

                  {/* Address (full width on md via col-span-2) */}
                  <div className={`md:col-span-2 ${fieldWrap}`}>
                    <label htmlFor="address" className={labelClass}>
                      Full Office Address
                    </label>
                    <span className="pointer-events-none absolute left-3 top-[38px] text-slate-400">
                      <Home className="h-5 w-5" />
                    </span>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Street, City, State, ZIP, Country"
                      className={inputClass}
                    />
                  </div>

                  {/* About (full width) */}
                  <div className={`md:col-span-2 ${fieldWrap}`}>
                    <label htmlFor="about" className={labelClass}>
                      About Your Company
                    </label>
                    <span className="pointer-events-none absolute left-3 top-[38px] text-slate-400">
                      <Info className="h-5 w-5" />
                    </span>
                    <textarea
                      id="about"
                      name="about"
                      rows={4}
                      value={formData.about}
                      onChange={handleInputChange}
                      placeholder="What do you do? What makes your company special?"
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                {error && (
                  <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </p>
                )}

                {/* Footer */}
                <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 disabled:opacity-70"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Profile"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* Tailwind small animations (optional)
Add these to your globals.css if you want smoother entry animations:

@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes scaleIn { from { opacity: 0; transform: translateY(8px) scale(.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
.animate-fadeIn { animation: fadeIn .2s ease-out both }
.animate-scaleIn { animation: scaleIn .2s ease-out both }
*/
