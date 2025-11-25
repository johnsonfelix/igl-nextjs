"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, X, Tag, Percent, Gift, Calendar, Check, AlertCircle, Ticket, Building, Users, Briefcase } from "lucide-react";

// UPDATED: Added "BOOTHS" to OfferScope
type OfferScope = "ALL" | "HOTELS" | "TICKETS" | "SPONSORS" | "BOOTHS" | "CUSTOM";

interface Coupon {
  id: string;
  code: string;
  discountType: "FIXED" | "PERCENTAGE";
  discountValue: number;
}

interface Offer {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  percentage: number;
  scope: OfferScope;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive: boolean;
  hotelIds?: string[];
  ticketIds?: string[];
  sponsorTypeIds?: string[];
  boothIds?: string[];
}

interface SimpleItem {
  id: string;
  name: string;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const text = await res.text();
  if (res.headers.get("content-type")?.includes("application/json")) {
    try {
      const data = JSON.parse(text);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${JSON.stringify(data)}`);
      return data;
    } catch (err: any) {
      throw new Error(`Invalid JSON from ${url}: ${err.message}`);
    }
  }
  if (!res.ok) throw new Error(`Request to ${url} failed ${res.status} ${res.statusText}`);
  throw new Error(`Expected JSON from ${url} but received non-JSON response`);
}

export default function CouponsPage() {
  const [activeTab, setActiveTab] = useState<"coupons" | "offers">("coupons");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [hotels, setHotels] = useState<SimpleItem[]>([]);
  const [tickets, setTickets] = useState<SimpleItem[]>([]);
  const [sponsorTypes, setSponsorTypes] = useState<SimpleItem[]>([]);
  const [booths, setBooths] = useState<SimpleItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [loadingMasterLists, setLoadingMasterLists] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [masterListError, setMasterListError] = useState<string | null>(null);

  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({ code: "", discountType: "FIXED", discountValue: "" });
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);

  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerForm, setOfferForm] = useState({
    name: "", code: "", description: "", percentage: "10", scope: "ALL" as OfferScope,
    startsAt: "", endsAt: "", isActive: true,
    hotelIds: [] as string[], ticketIds: [] as string[], sponsorTypeIds: [] as string[], boothIds: [] as string[],
  });
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);

  const fetchCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const data = await fetchJson<Coupon[]>("/api/admin/coupons");
      setCoupons(data || []);
    } catch (err: any) {
      console.error("fetchCoupons:", err);
      setErrorMessage(`Unable to load coupons: ${err.message}`);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const fetchOffers = async () => {
    setLoadingOffers(true);
    try {
      const data = await fetchJson<Offer[]>("/api/admin/offers");
      setOffers(data || []);
    } catch (err: any) {
      console.error("fetchOffers:", err);
      setErrorMessage(`Unable to load offers: ${err.message}`);
    } finally {
      setLoadingOffers(false);
    }
  };

  const fetchMasterLists = async () => {
    setLoadingMasterLists(true);
    setMasterListError(null);
    try {
      const endpoints = [
        { url: "/api/admin/hotels", setter: (d: any) => setHotels((d || []).map((h: any) => ({ id: h.id, name: h.hotelName || h.name || h.title }))) },
        { url: "/api/admin/tickets", setter: (d: any) => setTickets((d || []).map((t: any) => ({ id: t.id, name: t.name || t.title }))) },
        { url: "/api/admin/sponsor-types", setter: (d: any) => setSponsorTypes((d || []).map((s: any) => ({ id: s.id, name: s.name }))) },
        { url: "/api/admin/booths", setter: (d: any) => setBooths((d || []).map((b: any) => ({ id: b.id, name: b.name || b.boothName || b.title || `Booth ${b.id}` }))) },
      ];
      await Promise.all(endpoints.map(async (ep) => {
        try {
          const data = await fetchJson<any[]>(ep.url);
          ep.setter(data);
        } catch (err: any) {
          console.error("fetchMasterLists error for", ep.url, err);
          throw new Error(`${ep.url} -> ${err.message}`);
        }
      }));
    } catch (err: any) {
      console.error("Master list fetch failed:", err);
      setMasterListError(`Master list load failed: ${err.message}`);
      setHotels([]); setTickets([]); setSponsorTypes([]); setBooths([]);
    } finally {
      setLoadingMasterLists(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchCoupons(), fetchOffers(), fetchMasterLists()])
      .catch((e) => { console.error("Initial load error:", e); setErrorMessage(String(e?.message || e)); })
      .finally(() => setLoading(false));
  }, []);

  const resetCouponForm = () => { setCouponForm({ code: "", discountType: "FIXED", discountValue: "" }); setEditingCouponId(null); setCouponModalOpen(false); };

  const handleCouponSubmit = async () => {
    if (!couponForm.code || !couponForm.discountValue) { alert("Please fill out all coupon fields."); return; }
    const payload = { ...couponForm, discountValue: parseFloat(couponForm.discountValue) };
    try {
      const method = editingCouponId ? "PUT" : "POST";
      const url = editingCouponId ? `/api/admin/coupons/${editingCouponId}` : "/api/admin/coupons";
      await fetchJson(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      await fetchCoupons();
      resetCouponForm();
    } catch (err: any) { alert("Failed to save coupon: " + err.message); }
  };

  const handleCouponDelete = async (id: string) => {
    if (!confirm("Delete coupon?")) return;
    try { await fetchJson(`/api/admin/coupons/${id}`, { method: "DELETE" }); await fetchCoupons(); }
    catch (err: any) { alert("Delete failed: " + err.message); }
  };

  const resetOfferForm = () => {
    setOfferForm({ name: "", code: "", description: "", percentage: "10", scope: "ALL", startsAt: "", endsAt: "", isActive: true, hotelIds: [], ticketIds: [], sponsorTypeIds: [], boothIds: [] });
    setEditingOfferId(null); setOfferModalOpen(false);
  };

  const handleOfferSubmit = async () => {
    if (!offerForm.name || !offerForm.percentage) { alert("Please provide offer name & percentage."); return; }
    const pct = parseFloat(offerForm.percentage);
    if (isNaN(pct) || pct <= 0 || pct > 100) { alert("Percentage must be between 1 and 100."); return; }
    const payload: any = {
      name: offerForm.name, code: offerForm.code || null, description: offerForm.description || null,
      percentage: pct, scope: offerForm.scope,
      startsAt: offerForm.startsAt ? new Date(offerForm.startsAt).toISOString() : null,
      endsAt: offerForm.endsAt ? new Date(offerForm.endsAt).toISOString() : null,
      isActive: offerForm.isActive,
    };
    if (offerForm.scope === "CUSTOM") {
      payload.hotelIds = offerForm.hotelIds;
      payload.ticketIds = offerForm.ticketIds;
      payload.sponsorTypeIds = offerForm.sponsorTypeIds;
      payload.boothIds = offerForm.boothIds;
    }
    try {
      const url = editingOfferId ? `/api/admin/offers/${editingOfferId}` : "/api/admin/offers";
      const method = editingOfferId ? "PUT" : "POST";
      await fetchJson(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      await fetchOffers();
      resetOfferForm();
    } catch (err: any) { alert("Failed to save offer: " + err.message); }
  };

  const handleOfferDelete = async (id: string) => {
    if (!confirm("Delete offer?")) return;
    try { await fetchJson(`/api/admin/offers/${id}`, { method: "DELETE" }); await fetchOffers(); }
    catch (err: any) { alert("Failed to delete offer: " + err.message); }
  };

  const toggleSelection = (key: "hotelIds" | "ticketIds" | "sponsorTypeIds" | "boothIds", id: string) => {
    setOfferForm((prev) => {
      const set = new Set(prev[key]);
      if (set.has(id)) set.delete(id); else set.add(id);
      return { ...prev, [key]: Array.from(set) };
    });
  };

  const formatDiscount = (coupon: Coupon) => coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}%` : `$${coupon.discountValue.toFixed(2)}`;

  // UPDATED: Added BOOTHS icon
  const getScopeIcon = (scope: OfferScope) => {
    const icons: Record<OfferScope, any> = { ALL: Gift, HOTELS: Building, TICKETS: Ticket, SPONSORS: Users, BOOTHS: Briefcase, CUSTOM: Tag };
    return icons[scope] || Gift;
  };

  // UPDATED: Added BOOTHS color
  const getScopeColor = (scope: OfferScope) => {
    const colors: Record<OfferScope, string> = {
      ALL: "bg-purple-100 text-purple-700 border-purple-200",
      HOTELS: "bg-blue-100 text-blue-700 border-blue-200",
      TICKETS: "bg-green-100 text-green-700 border-green-200",
      SPONSORS: "bg-amber-100 text-amber-700 border-amber-200",
      BOOTHS: "bg-cyan-100 text-cyan-700 border-cyan-200",
      CUSTOM: "bg-pink-100 text-pink-700 border-pink-200",
    };
    return colors[scope];
  };

  const Skeleton = ({ className }: { className?: string }) => (<div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Coupons & Offers</h1>
            <p className="text-slate-500 mt-1">Manage discounts and promotional campaigns</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setActiveTab("coupons"); setCouponModalOpen(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
              <Plus size={18} /> Add Coupon
            </button>
            <button onClick={() => { setActiveTab("offers"); setOfferModalOpen(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-200">
              <Plus size={18} /> Add Offer
            </button>
          </div>
        </div>

        {/* Errors */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
            <AlertCircle size={20} /><span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="ml-auto p-1 hover:bg-red-100 rounded"><X size={16} /></button>
          </div>
        )}
        {masterListError && (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl flex items-center gap-3">
            <AlertCircle size={20} /><span>{masterListError}</span>
            <button onClick={() => setMasterListError(null)} className="ml-auto p-1 hover:bg-amber-100 rounded"><X size={16} /></button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          {(["coupons", "offers"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2.5 rounded-lg font-medium transition-all capitalize ${activeTab === tab ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Coupons Tab */}
        {activeTab === "coupons" && (
          <section>
            {loadingCoupons || loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36" />)}
              </div>
            ) : coupons.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                <Tag className="mx-auto text-slate-300 mb-3" size={48} />
                <p className="text-slate-500 font-medium">No coupons yet</p>
                <p className="text-slate-400 text-sm">Create your first coupon to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {coupons.map((c) => (
                  <div key={c.id} className="group relative bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:border-slate-300 transition-all">
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button onClick={() => { setEditingCouponId(c.id); setCouponForm({ code: c.code, discountType: c.discountType, discountValue: c.discountValue.toString() }); setCouponModalOpen(true); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"><Edit size={16} /></button>
                      <button onClick={() => handleCouponDelete(c.id)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${c.discountType === "PERCENTAGE" ? "bg-emerald-100" : "bg-blue-100"}`}>
                        {c.discountType === "PERCENTAGE" ? <Percent size={24} className="text-emerald-600" /> : <Tag size={24} className="text-blue-600" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 tracking-wide">{c.code}</h3>
                        <p className="text-sm text-slate-500 capitalize">{c.discountType.toLowerCase()} discount</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <span className={`text-2xl font-bold ${c.discountType === "PERCENTAGE" ? "text-emerald-600" : "text-blue-600"}`}>{formatDiscount(c)}</span>
                      <span className="text-slate-400 text-sm ml-1">off</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Offers Tab */}
        {activeTab === "offers" && (
          <section>
            {loadingOffers || loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48" />)}
              </div>
            ) : offers.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                <Gift className="mx-auto text-slate-300 mb-3" size={48} />
                <p className="text-slate-500 font-medium">No offers yet</p>
                <p className="text-slate-400 text-sm">Create promotional offers to boost sales</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {offers.map((o) => {
                  const ScopeIcon = getScopeIcon(o.scope);
                  return (
                    <div key={o.id} className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all">
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                        <button onClick={() => { setEditingOfferId(o.id); setOfferForm({ name: o.name, code: o.code || "", description: o.description || "", percentage: o.percentage.toString(), scope: o.scope, startsAt: o.startsAt || "", endsAt: o.endsAt || "", isActive: o.isActive, hotelIds: o.hotelIds || [], ticketIds: o.ticketIds || [], sponsorTypeIds: o.sponsorTypeIds || [], boothIds: o.boothIds || [] }); setOfferModalOpen(true); }} className="p-2 rounded-lg bg-white/80 hover:bg-white text-slate-400 hover:text-slate-600 shadow-sm"><Edit size={16} /></button>
                        <button onClick={() => handleOfferDelete(o.id)} className="p-2 rounded-lg bg-white/80 hover:bg-white text-slate-400 hover:text-red-500 shadow-sm"><Trash2 size={16} /></button>
                      </div>
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${getScopeColor(o.scope)}`}>
                            <ScopeIcon size={14} />{o.scope}
                          </div>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${o.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                            {o.isActive ? <Check size={12} /> : <AlertCircle size={12} />}{o.isActive ? "Active" : "Inactive"}
                          </div>
                        </div>
                        <h3 className="font-bold text-lg text-slate-800 mb-1">{o.name}</h3>
                        {o.code && (<div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-md text-xs font-mono text-slate-600 mb-2"><Tag size={12} />{o.code}</div>)}
                        <p className="text-slate-500 text-sm line-clamp-2">{o.description || "No description"}</p>
                        {o.scope === "CUSTOM" && (
                          <div className="mt-3 flex flex-wrap gap-2 text-xs">
                            {o.hotelIds && o.hotelIds.length > 0 && <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full">Hotels: {o.hotelIds.length}</span>}
                            {o.ticketIds && o.ticketIds.length > 0 && <span className="px-2 py-1 bg-green-50 text-green-600 rounded-full">Tickets: {o.ticketIds.length}</span>}
                            {o.sponsorTypeIds && o.sponsorTypeIds.length > 0 && <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-full">Sponsors: {o.sponsorTypeIds.length}</span>}
                            {o.boothIds && o.boothIds.length > 0 && <span className="px-2 py-1 bg-cyan-50 text-cyan-600 rounded-full">Booths: {o.boothIds.length}</span>}
                          </div>
                        )}
                      </div>
                      <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-500 text-sm"><Calendar size={16} />{o.startsAt || o.endsAt ? "Limited time" : "Always active"}</div>
                        <span className="text-2xl font-bold text-indigo-600">{o.percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Coupon Modal */}
        {couponModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-800">{editingCouponId ? "Edit Coupon" : "Create Coupon"}</h3>
                <button onClick={resetCouponForm} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={20} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Coupon Code</label>
                  <input value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} placeholder="e.g., SUMMER25" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono uppercase" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Discount Type</label>
                    <select value={couponForm.discountType} onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white">
                      <option value="FIXED">Fixed ($)</option>
                      <option value="PERCENTAGE">Percentage (%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Value</label>
                    <input type="number" value={couponForm.discountValue} onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })} placeholder="25" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-5 bg-slate-50 border-t border-slate-100">
                <button onClick={resetCouponForm} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-white transition-all">Cancel</button>
                <button onClick={handleCouponSubmit} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-violet-700 transition-all">{editingCouponId ? "Update" : "Create"}</button>
              </div>
            </div>
          </div>
        )}

        {/* Offer Modal */}
        {offerModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-800">{editingOfferId ? "Edit Offer" : "Create Offer"}</h3>
                <button onClick={resetOfferForm} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={20} /></button>
              </div>
              <div className="p-5 space-y-4 overflow-auto flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Offer Name</label>
                    <input value={offerForm.name} onChange={(e) => setOfferForm({ ...offerForm, name: e.target.value })} placeholder="e.g., Summer Sale" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Promo Code (Optional)</label>
                    <input value={offerForm.code} onChange={(e) => setOfferForm({ ...offerForm, code: e.target.value.toUpperCase() })} placeholder="PROMO2024" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono uppercase" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Discount %</label>
                    <input type="number" value={offerForm.percentage} onChange={(e) => setOfferForm({ ...offerForm, percentage: e.target.value })} placeholder="10" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                    <input value={offerForm.description} onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })} placeholder="Describe your offer..." className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Scope</label>
                    <select value={offerForm.scope} onChange={(e) => setOfferForm({ ...offerForm, scope: e.target.value as OfferScope })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white">
                      <option value="ALL">All Products</option>
                      <option value="HOTELS">Hotels Only</option>
                      <option value="TICKETS">Tickets Only</option>
                      <option value="SPONSORS">Sponsors Only</option>
                      <option value="BOOTHS">Booths Only</option>
                      <option value="CUSTOM">Custom Selection</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={offerForm.isActive} onChange={(e) => setOfferForm({ ...offerForm, isActive: e.target.checked })} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      <span className="ml-3 text-sm font-medium text-slate-700">Active</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Starts At</label>
                    <input type="datetime-local" value={offerForm.startsAt} onChange={(e) => setOfferForm({ ...offerForm, startsAt: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Ends At</label>
                    <input type="datetime-local" value={offerForm.endsAt} onChange={(e) => setOfferForm({ ...offerForm, endsAt: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
                  </div>
                </div>

                {/* Custom scope selection */}
                {offerForm.scope === "CUSTOM" && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-sm font-medium text-slate-700 mb-3">Select specific items for this offer</p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {/* Hotels */}
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2 text-slate-700 font-medium text-sm"><Building size={16} />Hotels</div>
                        {loadingMasterLists ? <Skeleton className="h-24" /> : hotels.length === 0 ? <p className="text-xs text-slate-400">No hotels available</p> : (
                          <div className="space-y-1.5 max-h-32 overflow-auto">
                            {hotels.map((h) => (
                              <label key={h.id} className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={offerForm.hotelIds.includes(h.id)} onChange={() => toggleSelection("hotelIds", h.id)} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                                <span className="text-sm text-slate-600">{h.name}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Tickets */}
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2 text-slate-700 font-medium text-sm"><Ticket size={16} />Tickets</div>
                        {loadingMasterLists ? <Skeleton className="h-24" /> : tickets.length === 0 ? <p className="text-xs text-slate-400">No tickets available</p> : (
                          <div className="space-y-1.5 max-h-32 overflow-auto">
                            {tickets.map((t) => (
                              <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={offerForm.ticketIds.includes(t.id)} onChange={() => toggleSelection("ticketIds", t.id)} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                                <span className="text-sm text-slate-600">{t.name}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Sponsors */}
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2 text-slate-700 font-medium text-sm"><Users size={16} />Sponsors</div>
                        {loadingMasterLists ? <Skeleton className="h-24" /> : sponsorTypes.length === 0 ? <p className="text-xs text-slate-400">No sponsors available</p> : (
                          <div className="space-y-1.5 max-h-32 overflow-auto">
                            {sponsorTypes.map((s) => (
                              <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={offerForm.sponsorTypeIds.includes(s.id)} onChange={() => toggleSelection("sponsorTypeIds", s.id)} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                                <span className="text-sm text-slate-600">{s.name}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Booths */}
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2 text-slate-700 font-medium text-sm"><Briefcase size={16} />Booths</div>
                        {loadingMasterLists ? <Skeleton className="h-24" /> : booths.length === 0 ? <p className="text-xs text-slate-400">No booths available</p> : (
                          <div className="space-y-1.5 max-h-32 overflow-auto">
                            {booths.map((b) => (
                              <label key={b.id} className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={offerForm.boothIds.includes(b.id)} onChange={() => toggleSelection("boothIds", b.id)} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                                <span className="text-sm text-slate-600">{b.name}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 p-5 bg-slate-50 border-t border-slate-100">
                <button onClick={resetOfferForm} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-white transition-all">Cancel</button>
                <button onClick={handleOfferSubmit} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-violet-700 transition-all">{editingOfferId ? "Update Offer" : "Create Offer"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}