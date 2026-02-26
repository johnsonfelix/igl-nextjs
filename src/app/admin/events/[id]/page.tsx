'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Loader2,
  Plus,
  User,
  MapPin,
  Calendar,
  Ticket,
  Hotel,
  Boxes,
  Landmark,
  Star,
  Edit2,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/app/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/app/components/ui/sheet';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import BoothSubTypeManager from '@/app/components/BoothSubTypeManager';
import SponsorAssignmentManager from '@/app/components/SponsorAssignmentManager';
import { uploadFileToS3 } from '@/app/lib/s3-upload';

// Helpers
const formatDate = (date?: string) =>
  date
    ? new Date(date).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    : '';
const formatTime = (date?: string) =>
  date ? new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

export default function EventViewPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  // State
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isVenueSheetOpen, setIsVenueSheetOpen] = useState(false);
  const [isBoothSheetOpen, setIsBoothSheetOpen] = useState(false);

  // Assignment sheet state
  const [isAssignmentSheetOpen, setIsAssignmentSheetOpen] = useState(false);
  const [selectedSponsorType, setSelectedSponsorType] = useState<any>(null); // For assignment

  // Agenda sheet state
  const [isAgendaSheetOpen, setIsAgendaSheetOpen] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState<any>(null);

  // Forms
  const [venueForm, setVenueForm] = useState({
    name: '',
    description: '',
    location: '', // <-- ADDED
    imageUrls: '',
    closestAirport: '',
    publicTransport: '',
    nearbyPlaces: '',
  });
  const [savingVenue, setSavingVenue] = useState(false);
  const [venueFile, setVenueFile] = useState<File | null>(null);
  const [venuePreviewUrl, setVenuePreviewUrl] = useState<string | null>(null);

  // Agenda form/logic
  const [agendaForm, setAgendaForm] = useState({
    date: '',
    startTime: '',
    endTime: '',
    title: '',
    description: '',
  });
  const [creatingAgenda, setCreatingAgenda] = useState(false);

  // Fetch event
  const fetchEvent = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`);
      const data = await res.json();
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  // Venue dialog opens: update venueForm from data
  useEffect(() => {
    if (event?.venue && isVenueSheetOpen) {
      setVenueForm({
        name: event.venue.name || '',
        description: event.venue.description || '',
        location: event.venue.location || '', // <-- ADDED
        imageUrls: (event.venue.imageUrls ?? []).join(', '),
        closestAirport: event.venue.closestAirport || '',
        publicTransport: event.venue.publicTransport || '',
        nearbyPlaces: event.venue.nearbyPlaces || '',
      });
      setVenueFile(null);
    }
  }, [isVenueSheetOpen, event?.venue]);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  useEffect(() => {
    if (!venueFile) {
      const existing = venueForm.imageUrls ? venueForm.imageUrls.split(',')[0].trim() : null;
      setVenuePreviewUrl(existing || null);
      return;
    }
    const url = URL.createObjectURL(venueFile);
    setVenuePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [venueFile, venueForm.imageUrls]);

  // Save Venue
  const handleSaveVenue = async () => {
    setSavingVenue(true);
    try {
      let imageUrlsStr = venueForm.imageUrls;
      if (venueFile) {
        const uploadedUrl = await uploadFileToS3(venueFile);
        imageUrlsStr = uploadedUrl;
      }

      const payload = {
        ...venueForm,
        imageUrls: imageUrlsStr.split(',').map((url) => url.trim()).filter(Boolean),
      };
      const method = event?.venue ? 'PUT' : 'POST';
      const res = await fetch(`/api/events/${eventId}/venue`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchEvent();
        setIsVenueSheetOpen(false);
      } else {
        // Handle error
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSavingVenue(false);
    }
  };

  // Agenda: open new
  const openNewAgenda = () => {
    setEditingAgenda(null);
    setAgendaForm({ date: '', startTime: '', endTime: '', title: '', description: '' });
    setIsAgendaSheetOpen(true);
  };

  // convert ISO / Date-like value to "YYYY-MM-DD" for <input type="date">
  function toDateInputValue(value?: string | Date | null) {
    if (!value) return '';
    // if already in YYYY-MM-DD, return it
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // convert ISO / Date-like value to "HH:MM" for <input type="time">
  function toTimeInputValue(value?: string | Date | null) {
    if (!value) return '';
    // if already in HH:MM or HH:MM:SS -> extract HH:MM
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(String(value))) {
      const parts = String(value).split(':');
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  // Agenda: open edit
  const openEditAgenda = (item: any) => {
    setEditingAgenda(item);
    const dateForInput = toDateInputValue(item.date ?? item.startTime ?? item.start);
    const startForInput = toTimeInputValue(item.startTime ?? item.start ?? null);
    const endForInput = toTimeInputValue(item.endTime ?? item.end ?? null);
    setAgendaForm({
      date: dateForInput,
      startTime: startForInput,
      endTime: endForInput,
      title: item.title || '',
      description: item.description || '',
    });
    setIsAgendaSheetOpen(true);
  };

  // Agenda: save (create or update)
  const handleSaveAgenda = async () => {
    setCreatingAgenda(true);
    try {
      // Calculate full ISO strings based on local browser time
      const dateStr = agendaForm.date;
      const startStr = agendaForm.startTime;
      const endStr = agendaForm.endTime;

      let fullStartTime = '';
      let fullEndTime = '';

      if (dateStr && startStr && endStr) {
        const sDate = new Date(`${dateStr}T${startStr}:00`);
        const eDate = new Date(`${dateStr}T${endStr}:00`);

        // If end time is earlier than start time, assume it rolls over to next day
        if (eDate < sDate) {
          eDate.setDate(eDate.getDate() + 1);
        }

        if (!isNaN(sDate.getTime()) && !isNaN(eDate.getTime())) {
          fullStartTime = sDate.toISOString();
          fullEndTime = eDate.toISOString();
        }
      }

      const payload = {
        ...agendaForm,
        fullStartTime,
        fullEndTime,
      };
      const method = editingAgenda ? 'PUT' : 'POST';
      const url = editingAgenda
        ? `/api/events/${eventId}/agenda/${editingAgenda.id}`
        : `/api/events/${eventId}/agenda`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchEvent();
        setIsAgendaSheetOpen(false);
      } else {
        // handle error (toast)
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCreatingAgenda(false);
    }
  };

  // Agenda: delete
  const handleDeleteAgenda = async (id: string) => {
    if (!confirm('Delete this agenda item?')) return;
    try {
      const res = await fetch(`/api/events/${eventId}/agenda/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchEvent();
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );

  if (!event) return <div className="py-32 text-center text-slate-500">Event not found</div>;

  const {
    name,
    startDate,
    endDate,
    location,
    thumbnail,
    eventType,
    expectedAudience,
    description,
    booths = [],
    hotels = [],
    agendaItems = [],
    eventTickets = [],
    eventSponsorTypes = [],
    venue,
    purchaseOrders = [],
  } = event;

  // Count assigned sponsors per sponsor type from completed purchase orders
  const assignedCountByType: Record<string, number> = {};
  purchaseOrders.forEach((po: any) => {
    if (po.status === 'COMPLETED' && Array.isArray(po.items)) {
      po.items.forEach((item: any) => {
        if (item.productType === 'SPONSOR') {
          assignedCountByType[item.productId] = (assignedCountByType[item.productId] || 0) + 1;
        }
      });
    }
  });

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HERO */}
        <section className="relative rounded-3xl overflow-hidden shadow-xl bg-white border border-gray-100 group">
          <div className="relative w-full h-80">
            {thumbnail ? (
              <img src={thumbnail} alt={name} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                <Boxes size={64} className="text-gray-300" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

            <div className="absolute left-0 bottom-0 right-0 p-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6 z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-4xl"
              >
                <div className="flex gap-2 mb-3">
                  {eventType && <span className="px-3 py-1 rounded-lg bg-[#5da765] text-white text-xs font-bold uppercase tracking-wider">{eventType}</span>}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">{name}</h1>
                <div className="flex flex-wrap gap-4 items-center text-sm font-medium text-gray-200">
                  <span className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
                    <MapPin size={16} className="text-[#5da765]" /> {location}
                  </span>
                  <span className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
                    <Calendar size={16} className="text-[#5da765]" /> {formatDate(startDate)} — {formatDate(endDate)}
                  </span>
                  {expectedAudience && (
                    <span className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
                      <User size={16} className="text-[#5da765]" /> {expectedAudience}
                    </span>
                  )}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex gap-3">
                <Button
                  onClick={() => router.push(`/admin/events/create?id=${eventId}`)}
                  className="bg-[#5da765] hover:bg-[#4a8a52] text-white shadow-lg shadow-green-900/20 rounded-xl px-6 h-12 font-bold"
                >
                  <Plus size={18} className="mr-2" /> Manage Actions
                </Button>
              </motion.div>
            </div>
          </div>
          <div className="p-8 bg-white border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</h3>
            <p className="text-gray-600 leading-relaxed text-lg max-w-5xl">{description || 'No description provided for this event.'}</p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-8">
            {/* BOOTHS */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100"
            >
              <HeaderWithAction
                title="Exhibitor Booths"
                buttonLabel="Manage Booths"
                icon={<Boxes size={24} className="text-[#5da765]" />}
                onAction={() => setIsBoothSheetOpen(true)}
              />

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {booths.length === 0 ? (
                  <div className="col-span-full py-12 text-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50">
                    <Boxes size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">No booths configured yet</p>
                  </div>
                ) : (
                  booths.map((booth: any) => (
                    <motion.div
                      key={booth.id}
                      whileHover={{ y: -4 }}
                      className="group rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="relative h-48 w-full overflow-hidden">
                        <img src={booth.image} alt={booth.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur rounded-lg px-3 py-1.5 text-sm font-bold text-gray-800 shadow-sm">
                          ${booth.price}
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-lg text-gray-800 mb-2">{booth.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-4">{booth.description}</p>

                        {booth.subTypes && booth.subTypes.length > 0 && (
                          <div className="pt-4 border-t border-gray-50 flex flex-wrap gap-2">
                            {booth.subTypes.map((sub: any) => (
                              <span
                                key={sub.id}
                                className="px-2.5 py-1 rounded-md bg-gray-50 text-gray-600 text-xs font-semibold border border-gray-100"
                              >
                                {sub.name} <span className="text-[#5da765]">${sub.price}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              <Sheet open={isBoothSheetOpen} onOpenChange={setIsBoothSheetOpen}>
                <SheetContent side="right" className="w-full sm:w-[680px] max-w-[95vw] p-6">
                  <SheetTitle className="sr-only">Manage Booth Sub-types</SheetTitle>
                  <BoothSubTypeManager eventId={eventId} eventBooths={booths} refreshEvent={fetchEvent} />
                </SheetContent>
              </Sheet>
            </motion.section>

            {/* AGENDA */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-6">
                <HeaderWithIcon title="Event Agenda" icon={<Calendar size={24} className="text-[#5da765]" />} />
                <Button size="sm" onClick={openNewAgenda} className="bg-gray-900 text-white hover:bg-black rounded-lg px-4 h-10 font-medium">
                  <Plus size={16} className="mr-2" /> Add Item
                </Button>
              </div>

              <div className="space-y-4">
                {agendaItems.length === 0 ? (
                  <div className="py-12 text-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50">
                    <Calendar size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">No agenda items added</p>
                  </div>
                ) : (
                  agendaItems.map((item: any) => (
                    <div key={item.id} className="group flex gap-5 items-start bg-white hover:bg-gray-50 rounded-2xl p-5 border border-gray-100 transition-colors">
                      <div className="flex-none w-16 h-16 rounded-2xl bg-[#5da765]/10 flex flex-col items-center justify-center text-[#5da765] border border-[#5da765]/20">
                        <span className="text-xs font-bold uppercase">{new Date(item.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                        <span className="text-xl font-bold">{new Date(item.date).getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-bold text-lg text-gray-800 mb-1">{item.title}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#5da765]" />
                              {formatTime(item.startTime)} — {formatTime(item.endTime)}
                            </div>
                          </div>

                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditAgenda(item)}
                              className="h-8 w-8 text-gray-400 hover:text-[#5da765] hover:bg-green-50 rounded-lg"
                            >
                              <Edit2 size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteAgenda(item.id)}
                              className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                        <p className="text-gray-600 mt-3 text-sm leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Sheet open={isAgendaSheetOpen} onOpenChange={setIsAgendaSheetOpen}>
                <SheetContent side="right" className="w-full sm:w-[420px] max-w-[95vw] p-6">
                  <SheetTitle className="sr-only">Manage Agenda Item</SheetTitle>
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">{editingAgenda ? 'Edit Item' : 'Add Item'}</h2>
                  <form
                    className="space-y-5"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveAgenda();
                    }}
                  >
                    <div>
                      <Label className="text-gray-700 font-semibold mb-1.5 block">Date</Label>
                      <Input
                        type="date"
                        className="rounded-xl border-gray-200 focus:ring-[#5da765] focus:border-[#5da765]"
                        value={agendaForm.date}
                        onChange={(e) => setAgendaForm({ ...agendaForm, date: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-700 font-semibold mb-1.5 block">Start Time</Label>
                        <Input
                          type="time"
                          className="rounded-xl border-gray-200 focus:ring-[#5da765] focus:border-[#5da765]"
                          value={agendaForm.startTime}
                          onChange={(e) => setAgendaForm({ ...agendaForm, startTime: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label className="text-gray-700 font-semibold mb-1.5 block">End Time</Label>
                        <Input
                          type="time"
                          className="rounded-xl border-gray-200 focus:ring-[#5da765] focus:border-[#5da765]"
                          value={agendaForm.endTime}
                          onChange={(e) => setAgendaForm({ ...agendaForm, endTime: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-700 font-semibold mb-1.5 block">Title</Label>
                      <Input
                        className="rounded-xl border-gray-200 focus:ring-[#5da765] focus:border-[#5da765]"
                        value={agendaForm.title}
                        onChange={(e) => setAgendaForm({ ...agendaForm, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700 font-semibold mb-1.5 block">Description</Label>
                      <Textarea
                        rows={4}
                        className="rounded-xl border-gray-200 focus:ring-[#5da765] focus:border-[#5da765]"
                        value={agendaForm.description}
                        onChange={(e) => setAgendaForm({ ...agendaForm, description: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="outline"
                        type="button"
                        className="flex-1 rounded-xl h-12 font-semibold"
                        onClick={() => {
                          setIsAgendaSheetOpen(false);
                          setEditingAgenda(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button className="flex-1 bg-[#5da765] hover:bg-[#4a8a52] text-white rounded-xl h-12 font-semibold" disabled={creatingAgenda}>
                        {editingAgenda ? 'Update Item' : 'Create Item'}
                      </Button>
                    </div>
                  </form>
                </SheetContent>
              </Sheet>
            </motion.section>

            {/* SPONSORS */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.11 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100"
            >
              <HeaderWithIcon title="Sponsorship Packages" icon={<Star size={24} className="text-[#5da765]" />} />
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {eventSponsorTypes.length === 0 ? (
                  <div className="col-span-full py-8 text-center rounded-xl bg-gray-50 border border-dashed border-gray-200 text-gray-500 text-sm">
                    No sponsor packages defined
                  </div>
                ) : (
                  eventSponsorTypes.map((es: any) => (
                    <div
                      key={es.sponsorTypeId}
                      className="flex items-start gap-4 bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md transition-all"
                    >
                      <img
                        src={es.sponsorType.image}
                        alt={es.sponsorType.name}
                        className="h-14 w-14 object-cover rounded-xl bg-gray-50"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800">{es.sponsorType.name}</span>
                            <span className="text-sm text-[#5da765] font-bold">${es.sponsorType.price}</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => {
                              // Store the sponsorType along with the quantity (limit)
                              setSelectedSponsorType({ ...es.sponsorType, maxSlots: es.quantity });
                              setIsAssignmentSheetOpen(true);
                            }}
                          >
                            Manage Assignments
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{es.sponsorType.description}</p>
                        {(() => {
                          const assigned = assignedCountByType[es.sponsorType.id] || 0;
                          const slotsLeft = Math.max(0, es.quantity - assigned);
                          return (
                            <div className={`mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${slotsLeft === 0 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                              {slotsLeft === 0 ? 'Fully Assigned' : `${slotsLeft} slot${slotsLeft !== 1 ? 's' : ''} left`}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Sheet open={isAssignmentSheetOpen} onOpenChange={setIsAssignmentSheetOpen}>
                <SheetContent side="right" className="w-full sm:w-[540px] max-w-[95vw] p-6 text-base overflow-y-auto">
                  <SheetTitle className="sr-only">Manage Sponsorship Assignments</SheetTitle>
                  {selectedSponsorType && (
                    <SponsorAssignmentManager
                      eventId={eventId}
                      sponsorTypeId={selectedSponsorType.id}
                      sponsorTypeName={selectedSponsorType.name}
                      // If selectedSponsorType refers to the 'sponsorType' inside 'eventSponsorType' object from map,
                      // we need to pass the quantity from the parent object.
                      // I will update the logic above to set the whole object or pass quantity correctly.
                      // Wait, I planned to change the selection logic.
                      // Let's assume I fix the onClick handler in this same file to store the whole 'es' object instead of 'es.sponsorType'.
                      maxSlots={selectedSponsorType.maxSlots || 999}
                    />
                  )}
                </SheetContent>
              </Sheet>
            </motion.section>
          </div>

          {/* Right column */}
          <div className="space-y-8">
            {/* TICKETS */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
            >
              <HeaderWithIcon title="Tickets" icon={<Ticket size={20} className="text-[#5da765]" />} />
              <div className="mt-6 flex flex-col gap-3">
                {eventTickets.length === 0 ? (
                  <div className="py-6 text-center text-gray-400 text-sm">No tickets available</div>
                ) : (
                  eventTickets.map((et: any) => (
                    <div
                      key={et.ticketId}
                      className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-white hover:shadow-sm transition-all"
                    >
                      <div className="h-12 w-12 rounded-lg bg-white border border-gray-100 p-1">
                        <img src={et.ticket.logo} alt={et.ticket.name} className="h-full w-full object-contain" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-800 text-sm">{et.ticket.name}</div>
                        <div className="text-xs font-medium text-gray-500 mt-0.5">{et.quantity} available</div>
                      </div>
                      <div className="text-[#5da765] font-bold">${et.ticket.price}</div>
                    </div>
                  ))
                )}
              </div>
            </motion.section>

            {/* HOTELS */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
            >
              <HeaderWithIcon title="Hotels" icon={<Hotel size={20} className="text-[#5da765]" />} />
              <div className="mt-6 grid grid-cols-1 gap-4">
                {hotels.length === 0 ? (
                  <div className="py-6 text-center text-gray-400 text-sm">No hotels linked</div>
                ) : (
                  hotels.map((hotel: any) => (
                    <div
                      key={hotel.id}
                      className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-all"
                    >
                      <div className="h-32 w-full bg-gray-100">
                        <img
                          src={hotel.image}
                          alt={hotel.hotelName}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold text-gray-800 mb-1">{hotel.hotelName}</h4>
                        <p className="text-xs text-gray-500 mb-4 flex items-center gap-1"><MapPin size={10} /> {hotel.address}</p>

                        {hotel.roomTypes && (
                          <div className="space-y-2">
                            {hotel.roomTypes.map((rt: any) => {
                              const eventRoomType = event.eventRoomTypes?.find((ert: any) => ert.roomTypeId === rt.id);
                              const available = eventRoomType ? eventRoomType.quantity : 0;
                              return (
                                <div
                                  key={rt.id}
                                  className="flex justify-between items-center text-xs p-2 rounded bg-gray-50"
                                >
                                  <span className="font-medium text-gray-700">{rt.roomType}</span>
                                  <div className="text-right">
                                    <div className="font-bold text-[#5da765]">${rt.price}</div>
                                    <div className="text-[10px] text-gray-400">{available} left</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.section>

            {/* VENUE */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.11 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
            >
              <HeaderWithAction
                title="Venue Details"
                buttonLabel={venue ? 'Edit' : 'Add'}
                icon={<Landmark size={20} className="text-[#5da765]" />}
                onAction={() => setIsVenueSheetOpen(true)}
              />

              <div className="mt-6">
                {venue ? (
                  <div className="rounded-2xl overflow-hidden border border-gray-100 bg-gray-50/50">
                    <div className="w-full h-40 bg-gray-200">
                      {venue.imageUrls?.[0] && (
                        <img src={venue.imageUrls[0]} alt={venue.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-gray-800">{venue.name}</h3>
                      {venue.location && (
                        <p className="text-xs font-bold text-[#5da765] mt-1 flex items-center gap-1.5 uppercase tracking-wide">
                          <MapPin size={12} /> {venue.location}
                        </p>
                      )}

                      <div className="mt-4 space-y-3">
                        <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100">
                          <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600"><MapPin size={14} /></div>
                          <div>
                            <div className="text-xs font-bold text-gray-400 uppercase">Closest Airport</div>
                            <div className="text-sm font-medium text-gray-800">{venue.closestAirport || 'N/A'}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100">
                          <div className="bg-purple-50 p-1.5 rounded-lg text-purple-600"><Boxes size={14} /></div>
                          <div>
                            <div className="text-xs font-bold text-gray-400 uppercase">Transport</div>
                            <div className="text-sm font-medium text-gray-800">{venue.publicTransport || 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center rounded-xl border border-dashed border-gray-200 bg-gray-50">
                    <Landmark size={24} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-400 text-sm">No venue assigned</p>
                  </div>
                )}
              </div>

              <Sheet open={isVenueSheetOpen} onOpenChange={setIsVenueSheetOpen}>
                <SheetContent side="right" className="w-full sm:w-[420px] max-w-[95vw] p-6">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">{venue ? 'Edit Venue' : 'Add Venue'}</h2>
                  <form
                    className="space-y-5"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveVenue();
                    }}
                  >
                    {[
                      { label: 'Venue Name', name: 'name' },
                      { label: 'Location', name: 'location' },
                      { label: 'Description', name: 'description', textarea: true },
                    ].map((field) => (
                      <div key={field.name}>
                        <Label className="text-gray-700 font-semibold mb-1.5 block">{field.label}</Label>
                        {field.textarea ? (
                          <Textarea
                            rows={3}
                            className="rounded-xl border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                            value={(venueForm as any)[field.name]}
                            onChange={(e) => setVenueForm({ ...venueForm, [field.name]: e.target.value })}
                          />
                        ) : (
                          <Input
                            className="rounded-xl border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                            value={(venueForm as any)[field.name]}
                            onChange={(e) => setVenueForm({ ...venueForm, [field.name]: e.target.value })}
                          />
                        )}
                      </div>
                    ))}

                    {/* Image Upload UI */}
                    <div className="space-y-2">
                      <Label className="text-gray-700 font-semibold mb-1.5 block">Venue Image</Label>
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:bg-emerald-50/50 hover:border-emerald-200 transition-all text-center relative group">
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          onChange={(e) => {
                            const f = e.target.files?.[0] ?? null;
                            setVenueFile(f);
                          }}
                        />
                        {venuePreviewUrl ? (
                          <div className="relative h-48 w-full rounded-lg overflow-hidden shadow-sm">
                            <img src={venuePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-white font-medium">Click to change</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-4">
                            <div className="bg-emerald-100 p-3 rounded-full mb-3 text-emerald-600">
                              <ImageIcon size={24} />
                            </div>
                            <p className="text-sm font-medium text-gray-700">Click or drag image here</p>
                            <p className="text-xs text-gray-500 mt-1">Supports JPG, PNG (Max 5MB)</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {[
                      { label: 'Closest Airport', name: 'closestAirport' },
                      { label: 'Public Transport', name: 'publicTransport' },
                      { label: 'Nearby Places', name: 'nearbyPlaces' },
                    ].map((field) => (
                      <div key={field.name}>
                        <Label className="text-gray-700 font-semibold mb-1.5 block">{field.label}</Label>
                        <Input
                          className="rounded-xl border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                          value={(venueForm as any)[field.name]}
                          onChange={(e) => setVenueForm({ ...venueForm, [field.name]: e.target.value })}
                        />
                      </div>
                    ))}
                    <Button disabled={savingVenue} className="w-full bg-[#5da765] hover:bg-[#4a8a52] text-white rounded-xl h-12 font-bold mt-4">
                      {savingVenue ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                      {venue ? 'Update Venue' : 'Add Venue'}
                    </Button>
                  </form>
                </SheetContent>
              </Sheet>
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeaderWithAction({ title, buttonLabel, icon, onAction }: any) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-3 text-xl font-bold text-gray-800">
        <div className="p-2 bg-[#5da765]/10 rounded-lg text-[#5da765]">
          {icon}
        </div>
        <span>{title}</span>
      </div>
      <Button variant="outline" size="sm" className="gap-2 rounded-lg border-gray-200 text-gray-600 hover:text-[#5da765] hover:border-[#5da765] hover:bg-green-50" onClick={onAction}>
        {buttonLabel}
      </Button>
    </div>
  );
}

function HeaderWithIcon({ title, icon }: any) {
  return (
    <h2 className="flex items-center gap-3 text-xl font-bold text-gray-800">
      <div className="p-2 bg-[#5da765]/10 rounded-lg text-[#5da765]">
        {icon}
      </div>
      <span>{title}</span>
    </h2>
  );
}
