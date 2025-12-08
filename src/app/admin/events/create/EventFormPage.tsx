"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Sheet, SheetContent } from "@/app/components/ui/sheet";
import { Plus, Loader2, ChevronDown, Calendar, Trash2, MapPin, AlignLeft, Image as ImageIcon, Briefcase, Hotel, Ticket, Star, LayoutGrid, X } from "lucide-react";
import { uploadFileToS3 } from "@/app/lib/s3-upload";
import { motion, AnimatePresence } from "framer-motion";

export default function EventFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("id"); // if present, edit mode

  const isEditMode = Boolean(eventId);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);

  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    location: "",
    thumbnail: "",
    eventType: "New",
    expectedAudience: "",
    description: "",
  });

  // Thumbnail upload
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);

  const [booths, setBooths] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [sponsorTypes, setSponsorTypes] = useState<any[]>([]);

  const [selectedBoothIds, setSelectedBoothIds] = useState<string[]>([]);
  const [selectedHotelIds, setSelectedHotelIds] = useState<string[]>([]);
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [selectedSponsorTypeIds, setSelectedSponsorTypeIds] = useState<string[]>([]);

  // quantities
  const [boothQuantities, setBoothQuantities] = useState<Record<string, number>>({});
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({});
  const [sponsorQuantities, setSponsorQuantities] = useState<Record<string, number>>({});

  const [selectedRoomTypeIds, setSelectedRoomTypeIds] = useState<string[]>([]);
  const [roomTypeQuantities, setRoomTypeQuantities] = useState<Record<string, number>>({});

  // UI States
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);

  // Booth subtypes / slots manager
  const [subtypeSheetOpen, setSubtypeSheetOpen] = useState(false);
  const [selectedBoothForSubtype, setSelectedBoothForSubtype] = useState<any | null>(null);
  const [subtypes, setSubtypes] = useState<any[]>([]);
  const [subtypesLoading, setSubtypesLoading] = useState(false);
  const [subtypeForm, setSubtypeForm] = useState({
    name: "",
    price: "",
    description: "",
    type: "BOOTH_NUMBER", // BOOTH_NUMBER | TIME_SLOT | CUSTOM
    slotStart: "",
    slotEnd: "",
  });

  // Fetch attachments (booths, hotels, tickets, sponsor types)
  const fetchAttachments = async () => {
    try {
      const [boothRes, hotelRes, ticketRes, sponsorTypeRes] = await Promise.all([
        fetch("/api/admin/booths"),
        fetch("/api/admin/hotels?includeRooms=true"),
        fetch("/api/admin/tickets"),
        fetch("/api/admin/sponsors"),
      ]);
      setBooths(await boothRes.json());
      setHotels(await hotelRes.json());
      setTickets(await ticketRes.json());
      setSponsorTypes(await sponsorTypeRes.json());
    } catch (error) {
      console.error("Failed to fetch attachments:", error);
    }
  };

  // Fetch event data if editing
  const fetchEvent = async () => {
    try {
      setFetching(true);
      const res = await fetch(`/api/events/${eventId}`);
      if (!res.ok) {
        console.error(await res.json());
        return;
      }
      const event = await res.json();

      setFormData({
        name: event.name,
        startDate: event.startDate?.split("T")[0] ?? "",
        endDate: event.endDate?.split("T")[0] ?? "",
        location: event.location,
        thumbnail: event.thumbnail ?? "",
        eventType: event.eventType ?? "New",
        expectedAudience: event.expectedAudience ?? "",
        description: event.description ?? "",
      });

      setThumbFile(null);
      setThumbPreview(event.thumbnail || null);

      // ---------- BOOTHS + QUANTITY ----------
      if (Array.isArray(event.eventBooths) && event.eventBooths.length > 0) {
        const boothIds = event.eventBooths
          .map((eb: any) => eb.boothId ?? eb.booth?.id)
          .filter((id: string | undefined): id is string => Boolean(id));

        setSelectedBoothIds(boothIds);

        setBoothQuantities(
          event.eventBooths.reduce((acc: any, eb: any) => {
            const boothId = eb.boothId ?? eb.booth?.id;
            if (!boothId) return acc;
            acc[boothId] = eb.quantity ?? 1;
            return acc;
          }, {})
        );
      } else {
        // Legacy shape
        setSelectedBoothIds(event.booths?.map((b: any) => b.id) ?? []);
        setBoothQuantities(
          (event.booths || []).reduce((acc: any, b: any) => {
            acc[b.id] = b.quantity ?? 1;
            return acc;
          }, {})
        );
      }

      // ---------- HOTELS ----------
      setSelectedHotelIds(event.hotels?.map((h: any) => h.id) ?? []);

      // ---------- TICKETS ----------
      setSelectedTicketIds(event.eventTickets?.map((et: any) => et.ticketId) ?? []);
      setTicketQuantities(
        event.eventTickets?.reduce((acc: any, et: any) => {
          acc[et.ticketId] = et.quantity ?? 1;
          return acc;
        }, {}) ?? {}
      );

      // ---------- SPONSOR TYPES ----------
      setSelectedSponsorTypeIds(event.eventSponsorTypes?.map((es: any) => es.sponsorTypeId) ?? []);
      setSponsorQuantities(
        event.eventSponsorTypes?.reduce((acc: any, es: any) => {
          acc[es.sponsorTypeId] = es.quantity ?? 1;
          return acc;
        }, {}) ?? {}
      );

      // ---------- ROOM TYPES ----------
      setSelectedRoomTypeIds(event.eventRoomTypes?.map((ert: any) => ert.roomTypeId) ?? []);
      setRoomTypeQuantities(
        event.eventRoomTypes?.reduce((acc: any, ert: any) => {
          acc[ert.roomTypeId] = ert.quantity ?? 1;
          return acc;
        }, {}) ?? {}
      );
    } catch (error) {
      console.error("Failed to fetch event:", error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchAttachments();
    if (isEditMode) fetchEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // Preview lifecycle for thumbnail
  useEffect(() => {
    if (!thumbFile) {
      setThumbPreview(formData.thumbnail || null);
      return;
    }
    const url = URL.createObjectURL(thumbFile);
    setThumbPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbFile, formData.thumbnail]);

  // Form submit handler
  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Upload thumbnail if a new file is selected
      let thumbnailUrl = formData.thumbnail;
      if (thumbFile) {
        thumbnailUrl = await uploadFileToS3(thumbFile); // returns public S3 URL
      }

      const payload = {
        id: eventId,
        ...formData,
        thumbnail: thumbnailUrl ?? "",
        booths: selectedBoothIds.map((id) => ({
          id,
          quantity: boothQuantities[id] || 1,
        })),
        hotels: selectedHotelIds,
        tickets: selectedTicketIds.map((id) => ({
          id,
          quantity: ticketQuantities[id] || 1,
        })),
        sponsorTypes: selectedSponsorTypeIds.map((id) => ({
          id,
          quantity: sponsorQuantities[id] || 1,
        })),
        roomTypes: selectedRoomTypeIds.map((id) => ({
          id,
          quantity: roomTypeQuantities[id] || 1,
        })),
      };

      const res = await fetch(isEditMode ? `/api/events/${eventId}` : `/api/events`, {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        // Redirect to detail page or list page
        router.push(`/admin/events/${data.id || eventId}`);
      } else {
        console.error(await res.json());
        alert("Failed to save event. See console for details.");
      }
    } catch (error) {
      console.error("Error submitting event:", error);
      alert("Error submitting event. See console.");
    } finally {
      setLoading(false);
    }
  };

  // ---- Booth subtype helpers ----

  const openSubtypeManager = (booth: any) => {
    if (!eventId) {
      alert("Save the event first, then you can configure booth slots for it.");
      return;
    }
    setSelectedBoothForSubtype(booth);
    setSubtypeSheetOpen(true);
    fetchSubtypesForBooth(booth.id);
  };

  const fetchSubtypesForBooth = async (boothId: string) => {
    if (!eventId) return;
    setSubtypesLoading(true);
    try {
      const res = await fetch(
        `/api/admin/booth-subtypes?boothId=${boothId}&eventId=${eventId}`
      );
      const data = await res.json();
      setSubtypes(data);
    } catch (error) {
      console.error("Failed to fetch booth subtypes:", error);
    } finally {
      setSubtypesLoading(false);
    }
  };

  const saveSubtype = async () => {
    if (!eventId || !selectedBoothForSubtype) return;
    if (!subtypeForm.name || !subtypeForm.price) {
      alert("Name and price are required for a subtype.");
      return;
    }

    try {
      await fetch("/api/admin/booth-subtypes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boothId: selectedBoothForSubtype.id,
          eventId,
          ...subtypeForm,
        }),
      });

      setSubtypeForm({
        name: "",
        price: "",
        description: "",
        type: "BOOTH_NUMBER",
        slotStart: "",
        slotEnd: "",
      });

      await fetchSubtypesForBooth(selectedBoothForSubtype.id);
    } catch (error) {
      console.error("Failed to save subtype:", error);
      alert("Failed to save subtype. See console.");
    }
  };

  const deleteSubtype = async (id: string) => {
    if (!confirm("Delete this subtype?")) return;
    try {
      await fetch("/api/admin/booth-subtypes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (selectedBoothForSubtype) {
        await fetchSubtypesForBooth(selectedBoothForSubtype.id);
      }
    } catch (error) {
      console.error("Failed to delete subtype:", error);
      alert("Failed to delete subtype.");
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#f8f9fa]">
        <Loader2 className="animate-spin h-10 w-10 text-[#5da765]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 sm:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              {isEditMode ? "Edit Event" : "Create Event"}
            </h1>
            <p className="text-gray-500 mt-1">
              {isEditMode ? "Update event details and configurations" : "Launch a new event by filling in the details below"}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="h-11 rounded-xl" onClick={() => router.push("/admin/events")}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="h-11 rounded-xl bg-[#5da765] hover:bg-[#4a8a52] text-white font-semibold min-w-[140px] shadow-lg shadow-green-900/10">
              {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
              {isEditMode ? "Save Changes" : "Create Event"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN - MAIN DETAILS */}
          <div className="lg:col-span-2 space-y-8">
            {/* BASIC INFO CARD */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-[#5da765]/10 p-2.5 rounded-xl text-[#5da765]">
                  <LayoutGrid size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Basic Information</h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-gray-700 font-semibold">Event Name <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="e.g. Asia International Logistics Summit 2025"
                    className="h-12 rounded-xl text-lg focus:ring-[#5da765] focus:border-[#5da765]"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold flex items-center gap-2"><MapPin size={14} /> Location <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="City, Country"
                      className="h-11 rounded-xl focus:ring-[#5da765] focus:border-[#5da765]"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold">Event Type</Label>
                    <select
                      className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5da765]/20 focus:border-[#5da765]"
                      value={formData.eventType}
                      onChange={e => setFormData({ ...formData, eventType: e.target.value })}
                    >
                      <option value="New">New Event</option>
                      <option value="Hot">Hot Event</option>
                      <option value="Upcoming">Upcoming</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold flex items-center gap-2"><Calendar size={14} /> Start Date <span className="text-red-500">*</span></Label>
                    <Input type="date" className="h-11 rounded-xl focus:ring-[#5da765] focus:border-[#5da765]" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold flex items-center gap-2"><Calendar size={14} /> End Date <span className="text-red-500">*</span></Label>
                    <Input type="date" className="h-11 rounded-xl focus:ring-[#5da765] focus:border-[#5da765]" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 font-semibold flex items-center gap-2"><AlignLeft size={14} /> Description</Label>
                  <Textarea
                    rows={5}
                    placeholder="Detailed description of the event..."
                    className="rounded-xl focus:ring-[#5da765] focus:border-[#5da765]"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
            </motion.div>

            {/* ATTACHMENTS CARD */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-[#5da765]/10 p-2.5 rounded-xl text-[#5da765]">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Configurations</h2>
                    <p className="text-xs text-gray-400">Manage linked resources</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="rounded-xl border-dashed border-gray-300 hover:border-[#5da765] hover:text-[#5da765]"
                  onClick={() => setIsAttachmentsModalOpen(true)}
                >
                  <Plus size={16} className="mr-2" /> Manage Items
                </Button>
              </div>

              {/* SELECTED ITEMS SUMMARY GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold text-gray-800">{selectedBoothIds.length}</span>
                  <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Booths</span>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold text-gray-800">{selectedHotelIds.length}</span>
                  <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Hotels</span>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold text-gray-800">{selectedTicketIds.length}</span>
                  <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Tickets</span>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold text-gray-800">{selectedSponsorTypeIds.length}</span>
                  <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Pkgs</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN - MEDIA & PREVIEW */}
          <div className="space-y-8">
            {/* THUMBNAIL UPLOAD */}
            <motion.div
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-[#5da765]/10 p-2.5 rounded-xl text-[#5da765]">
                  <ImageIcon size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Media</h2>
              </div>

              <div className="space-y-4">
                <Label className="text-gray-700 font-semibold">Event Thumbnail</Label>
                <div
                  className="relative rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-white hover:border-[#5da765]/50 transition-all p-8 flex flex-col items-center justify-center text-center cursor-pointer group overflow-hidden"
                  onClick={() => document.getElementById('thumb-upload')?.click()}
                >
                  {thumbPreview ? (
                    <img src={thumbPreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <>
                      <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <Plus size={24} className="text-gray-400 group-hover:text-[#5da765]" />
                      </div>
                      <p className="text-sm text-gray-500 font-medium group-hover:text-gray-700">Click to upload image</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                    </>
                  )}
                  <input
                    id="thumb-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setThumbFile(f);
                    }}
                  />
                </div>
                {thumbPreview && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setThumbFile(null);
                      setThumbPreview(null);
                      setFormData({ ...formData, thumbnail: '' });
                    }}
                  >
                    Remove Image
                  </Button>
                )}
              </div>
            </motion.div>

            {/* AUDIENCE INFO */}
            <motion.div
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100"
            >
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800">Additional Details</h3>
                <div className="space-y-2">
                  <Label className="text-gray-700 font-semibold">Expected Audience</Label>
                  <Input
                    placeholder="e.g. 5,000+ Attendees"
                    className="h-11 rounded-xl focus:ring-[#5da765] focus:border-[#5da765]"
                    value={formData.expectedAudience}
                    onChange={e => setFormData({ ...formData, expectedAudience: e.target.value })}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ATTACHMENTS MODAL (REPLACES PREVIOUS SHEET) */}
      <AnimatePresence>
        {isAttachmentsModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Manage Resources</h3>
                  <p className="text-sm text-gray-500">Select items to attach to this event</p>
                </div>
                <button
                  onClick={() => setIsAttachmentsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-8 flex-1">
                {/* BOOTHS SELECTOR */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2"><Briefcase size={16} className="text-[#5da765]" /> Booths</h3>
                  <div className="space-y-2">
                    {booths.map(booth => (
                      <div key={booth.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                        <Checkbox
                          id={`booth-${booth.id}`}
                          checked={selectedBoothIds.includes(booth.id)}
                          onCheckedChange={(c) => {
                            const checked = c === true;
                            setSelectedBoothIds(prev => checked ? [...prev, booth.id] : prev.filter(id => id !== booth.id));
                            if (checked) setBoothQuantities(prev => ({ ...prev, [booth.id]: prev[booth.id] || 1 }));
                            else setBoothQuantities(prev => { const copy = { ...prev }; delete copy[booth.id]; return copy; });
                          }}
                          className="mt-1 data-[state=checked]:bg-[#5da765] data-[state=checked]:border-[#5da765] data-[state=checked]:text-white"
                        />
                        <div className="flex-1">
                          <Label htmlFor={`booth-${booth.id}`} className="font-bold text-gray-700 cursor-pointer">{booth.name}</Label>
                          <p className="text-xs text-gray-500 mt-1">{booth.description}</p>
                          {selectedBoothIds.includes(booth.id) && (
                            <div className="mt-3 flex items-center gap-3">
                              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1">
                                <span className="text-xs text-gray-400 font-medium uppercase">Qty</span>
                                <Input
                                  type="number" min={1}
                                  className="w-16 h-7 text-sm border-none shadow-none focus-visible:ring-0 p-0 text-right font-bold text-[#5da765]"
                                  value={boothQuantities[booth.id] || 1}
                                  onChange={(e) => setBoothQuantities({ ...boothQuantities, [booth.id]: parseInt(e.target.value) || 1 })}
                                />
                              </div>
                              <Button type="button" size="sm" variant="ghost" className="h-7 text-xs text-[#5da765] hover:bg-green-50" onClick={() => openSubtypeManager(booth)} disabled={!eventId}>
                                Configure Slots
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* HOTELS SELECTOR */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2"><Hotel size={16} className="text-[#5da765]" /> Hotels</h3>
                  <div className="space-y-2">
                    {hotels.map(hotel => (
                      <div key={hotel.id} className="border border-gray-100 rounded-xl overflow-hidden">
                        <div className="p-3 bg-gray-50/50 flex items-center gap-3">
                          <Checkbox
                            checked={selectedHotelIds.includes(hotel.id)}
                            onCheckedChange={(c) => {
                              const checked = c === true;
                              setSelectedHotelIds(prev => checked ? [...prev, hotel.id] : prev.filter(id => id !== hotel.id));
                              if (!checked) {
                                // Deselect all rooms for this hotel
                                setSelectedRoomTypeIds(prev => prev.filter(rtId => !hotel.roomTypes.find((r: any) => r.id === rtId)));
                              }
                            }}
                            className="data-[state=checked]:bg-[#5da765] data-[state=checked]:border-[#5da765] data-[state=checked]:text-white"
                          />
                          <span className="font-bold text-gray-700">{hotel.hotelName}</span>
                        </div>
                        {selectedHotelIds.includes(hotel.id) && hotel.roomTypes && (
                          <div className="p-3 bg-white space-y-2">
                            {hotel.roomTypes.map((rt: any) => (
                              <div key={rt.id} className="flex items-center gap-3 pl-6">
                                <Checkbox
                                  checked={selectedRoomTypeIds.includes(rt.id)}
                                  onCheckedChange={(c) => {
                                    const checked = c === true;
                                    setSelectedRoomTypeIds(prev => checked ? [...prev, rt.id] : prev.filter(id => id !== rt.id));
                                    if (checked) setRoomTypeQuantities(prev => ({ ...prev, [rt.id]: prev[rt.id] || 1 }));
                                    else setRoomTypeQuantities(prev => { const copy = { ...prev }; delete copy[rt.id]; return copy; });
                                  }}
                                  className="h-4 w-4 data-[state=checked]:bg-gray-700 data-[state=checked]:border-gray-700 data-[state=checked]:text-white"
                                />
                                <div className="flex-1 flex justify-between items-center">
                                  <span className="text-sm text-gray-600">{rt.roomType} <span className="text-[#5da765] font-bold text-xs ml-1">${rt.price}</span></span>
                                  {selectedRoomTypeIds.includes(rt.id) && (
                                    <Input
                                      type="number" min={1}
                                      className="w-16 h-7 text-xs border-gray-200"
                                      value={roomTypeQuantities[rt.id] || 1}
                                      onChange={(e) => setRoomTypeQuantities({ ...roomTypeQuantities, [rt.id]: parseInt(e.target.value) || 1 })}
                                    />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* TICKETS & SPONSORS grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><Ticket size={16} className="text-[#5da765]" /> Tickets</h3>
                    <div className="space-y-2">
                      {tickets.map(ticket => (
                        <div key={ticket.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
                          <Checkbox
                            checked={selectedTicketIds.includes(ticket.id)}
                            onCheckedChange={(c) => {
                              const checked = c === true;
                              setSelectedTicketIds(prev => checked ? [...prev, ticket.id] : prev.filter(id => id !== ticket.id));
                              if (checked) setTicketQuantities(prev => ({ ...prev, [ticket.id]: prev[ticket.id] || 1 }));
                              else setTicketQuantities(prev => { const copy = { ...prev }; delete copy[ticket.id]; return copy; });
                            }}
                            className="data-[state=checked]:bg-[#5da765] data-[state=checked]:border-[#5da765] data-[state=checked]:text-white"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between font-medium text-gray-700 text-sm">
                              <span>{ticket.name}</span>
                              <span className="text-[#5da765] font-bold">${ticket.price}</span>
                            </div>
                          </div>
                          {selectedTicketIds.includes(ticket.id) && (
                            <Input
                              type="number" min={1}
                              className="w-16 h-8 text-sm"
                              value={ticketQuantities[ticket.id] || 1}
                              onChange={(e) => setTicketQuantities({ ...ticketQuantities, [ticket.id]: parseInt(e.target.value) || 1 })}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><Star size={16} className="text-[#5da765]" /> Sponsor Packages</h3>
                    <div className="space-y-2">
                      {sponsorTypes.map(st => (
                        <div key={st.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
                          <Checkbox
                            checked={selectedSponsorTypeIds.includes(st.id)}
                            onCheckedChange={(c) => {
                              const checked = c === true;
                              setSelectedSponsorTypeIds(prev => checked ? [...prev, st.id] : prev.filter(id => id !== st.id));
                              if (checked) setSponsorQuantities(prev => ({ ...prev, [st.id]: prev[st.id] || 1 }));
                              else setSponsorQuantities(prev => { const copy = { ...prev }; delete copy[st.id]; return copy; });
                            }}
                            className="data-[state=checked]:bg-[#5da765] data-[state=checked]:border-[#5da765] data-[state=checked]:text-white"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-700 text-sm">{st.name}</div>
                          </div>
                          {selectedSponsorTypeIds.includes(st.id) && (
                            <Input
                              type="number" min={1}
                              className="w-16 h-8 text-sm"
                              value={sponsorQuantities[st.id] || 1}
                              onChange={(e) => setSponsorQuantities({ ...sponsorQuantities, [st.id]: parseInt(e.target.value) || 1 })}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <Button variant="outline" className="rounded-xl h-11" onClick={() => setIsAttachmentsModalOpen(false)}>Cancel</Button>
                <Button onClick={() => setIsAttachmentsModalOpen(false)} className="rounded-xl h-11 bg-[#5da765] hover:bg-[#4a8a52] text-white min-w-[100px]">Done</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BOOTH SUBTYPE SHEET (Hidden Logic UI) */}
      <Sheet open={subtypeSheetOpen} onOpenChange={setSubtypeSheetOpen}>
        <SheetContent side="right" className="w-full sm:w-[480px] bg-white overflow-auto p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Manage Slots for <span className="text-[#5da765]">{selectedBoothForSubtype?.name}</span></h2>

          {/* LIST */}
          <div className="space-y-3 mb-8">
            {subtypesLoading ? (
              <div className="text-center py-8 text-gray-400"><Loader2 className="animate-spin h-6 w-6 mx-auto mb-2" />Loading...</div>
            ) : subtypes.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500 text-sm">No slots configured yet.</div>
            ) : (
              subtypes.map(st => (
                <div key={st.id} className="bg-white border border-gray-100 rounded-xl p-3 flex justify-between items-center shadow-sm">
                  <div>
                    <div className="font-bold text-gray-800">{st.name}</div>
                    <div className="text-xs text-gray-500 font-medium mt-1">
                      {st.type === 'TIME_SLOT' && st.slotStart && st.slotEnd ? (
                        <span className="bg-blue-50 px-2 py-1 rounded-md text-blue-700 font-semibold border border-blue-100">
                          {new Date(st.slotStart).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} - {new Date(st.slotEnd).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{st.type.replace('_', ' ')}</span>
                      )}
                      <span className="ml-2 text-[#5da765] font-bold text-sm">${st.price}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => deleteSubtype(st.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* ADD FORM */}
          <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
            <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-2 mb-2">Add New Slot</h3>

            <div className="space-y-3">
              <div>
                <Label className="text-xs uppercase font-bold text-gray-500">Name</Label>
                <Input
                  placeholder="e.g. Booth A-101"
                  className="bg-white border-gray-200"
                  value={subtypeForm.name}
                  onChange={e => setSubtypeForm({ ...subtypeForm, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase font-bold text-gray-500">Price</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="bg-white border-gray-200"
                    value={subtypeForm.price}
                    onChange={e => setSubtypeForm({ ...subtypeForm, price: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase font-bold text-gray-500">Type</Label>
                  <select
                    className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5da765]/20"
                    value={subtypeForm.type}
                    onChange={e => setSubtypeForm({ ...subtypeForm, type: e.target.value })}
                  >
                    <option value="BOOTH_NUMBER">Booth #</option>
                    <option value="TIME_SLOT">Time Slot</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>
              </div>

              {subtypeForm.type === 'TIME_SLOT' && (
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label className="text-xs uppercase font-bold text-gray-500">Start</Label>
                    <Input
                      type="datetime-local"
                      className="bg-white"
                      value={subtypeForm.slotStart}
                      onChange={e => setSubtypeForm({ ...subtypeForm, slotStart: e.target.value })}
                      onClick={(e) => e.currentTarget.showPicker()}
                    />
                  </div>
                  <div>
                    <Label className="text-xs uppercase font-bold text-gray-500">End</Label>
                    <Input
                      type="datetime-local"
                      className="bg-white"
                      value={subtypeForm.slotEnd}
                      onChange={e => setSubtypeForm({ ...subtypeForm, slotEnd: e.target.value })}
                      onClick={(e) => e.currentTarget.showPicker()}
                    />
                  </div>
                </div>
              )}

              <Button onClick={saveSubtype} className="w-full bg-[#5da765] hover:bg-[#4a8a52] text-white font-bold rounded-xl mt-2">
                Add Slot
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
}
