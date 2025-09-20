'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Plus, User, MapPin, Calendar, Ticket, Hotel, Boxes, Landmark, Star, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/app/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/app/components/ui/sheet';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import BoothSubTypeManager from '@/app/components/BoothSubTypeManager';

// Helpers
const formatDate = (date?: string) =>
  date ? new Date(date).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
const formatTime = (date?: string) =>
  date ? new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

export default function EventViewPage() {
  const params = useParams();
  const eventId = params.id as string;

  // State
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isVenueSheetOpen, setIsVenueSheetOpen] = useState(false);
  const [isBoothSheetOpen, setIsBoothSheetOpen] = useState(false);

  // Agenda sheet state
  const [isAgendaSheetOpen, setIsAgendaSheetOpen] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState<any>(null);

  // Forms
  const [venueForm, setVenueForm] = useState({
    name: '',
    description: '',
    imageUrls: '',
    closestAirport: '',
    publicTransport: '',
    nearbyPlaces: '',
  });
  const [savingVenue, setSavingVenue] = useState(false);

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
        imageUrls: (event.venue.imageUrls ?? []).join(', '),
        closestAirport: event.venue.closestAirport || '',
        publicTransport: event.venue.publicTransport || '',
        nearbyPlaces: event.venue.nearbyPlaces || '',
      });
    }
  }, [isVenueSheetOpen, event?.venue]);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  // Save Venue
  const handleSaveVenue = async () => {
    setSavingVenue(true);
    try {
      const payload = {
        ...venueForm,
        imageUrls: venueForm.imageUrls.split(',').map((url) => url.trim()),
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
      const payload = { ...agendaForm };
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
  } = event;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-12">
      {/* HERO */}
      <section className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-tr from-primary to-secondary text-white">
        <div className="relative w-full h-72 sm:h-96">
          {thumbnail ? (
            <img src={thumbnail} alt={name} className="absolute inset-0 w-full h-full object-cover opacity-30" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-secondary/30" />
          )}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

          <div className="absolute left-6 bottom-6 right-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl"
            >
              <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight drop-shadow-lg">{name}</h1>
              <div className="mt-3 flex flex-wrap gap-3 items-center text-sm font-medium">
                <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                  <MapPin size={16} /> {location}
                </span>
                <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                  <Calendar size={16} /> {formatDate(startDate)} — {formatDate(endDate)}
                </span>
                {eventType && <span className="px-3 py-1 rounded-full bg-white text-secondary font-semibold">{eventType}</span>}
                {expectedAudience && (
                  <span className="inline-flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full backdrop-blur-sm">
                    <User size={14} /> {expectedAudience}
                  </span>
                )}
              </div>
              <p className="mt-4 text-lg text-white/90">{description}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex gap-3">
              <Button className="bg-white text-primary hover:bg-white/90 flex items-center gap-2">
                <Plus /> Manage
              </Button>
              <Button variant="ghost" className="hover:bg-white/10 flex items-center gap-2">
                Share
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* BOOTHS */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl p-6 shadow-md">
            <HeaderWithAction
              title="Booth Types"
              buttonLabel="Manage Booths"
              icon={<Boxes size={18} className="text-primary" />}
              onAction={() => setIsBoothSheetOpen(true)}
            />

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {booths.length === 0 ? (
                <div className="col-span-full text-center text-slate-500 italic py-6">No booths linked yet.</div>
              ) : booths.map((booth: any) => (
                <motion.div key={booth.id} whileHover={{ y: -4 }} className="rounded-2xl overflow-hidden border bg-gradient-to-b from-white to-slate-50 shadow-sm transition-transform duration-200">
                  <div className="relative h-40 w-full">
                    <img src={booth.image} alt={booth.name} className="object-cover w-full h-full" />
                    <div className="absolute right-3 top-3 bg-white/95 text-primary font-bold px-3 py-1 rounded-lg shadow">${booth.price}</div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-slate-800">{booth.name}</h3>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{booth.description}</p>
                    {booth.subTypes && booth.subTypes.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {booth.subTypes.map((sub: any) => (
                          <span key={sub.id} className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">{sub.name} — ${sub.price}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <Sheet open={isBoothSheetOpen} onOpenChange={setIsBoothSheetOpen}>
              <SheetContent side="right" className="w-full sm:w-[680px] max-w-[95vw] p-6">
                <BoothSubTypeManager eventId={eventId} eventBooths={booths} refreshEvent={fetchEvent} />
              </SheetContent>
            </Sheet>
          </motion.section>

          {/* AGENDA */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="bg-white rounded-2xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <HeaderWithIcon title="Agenda" icon={<Calendar size={18} className="text-primary" />} />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={openNewAgenda} className="flex items-center gap-2"><Plus /> Add Agenda</Button>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {agendaItems.length === 0 ? (
                <div className="text-slate-500 italic text-center py-4">No agenda items yet.</div>
              ) : agendaItems.map((item: any) => (
                <div key={item.id} className="flex gap-4 items-start bg-slate-50/70 rounded-xl p-4 border border-slate-100">
                  <div className="flex-none w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center font-bold text-primary text-lg">
                    {formatDate(item.date).split(' ')[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="font-semibold text-lg text-slate-800">{item.title}</h4>
                      <span className="text-xs text-slate-500 font-medium">{formatTime(item.startTime)} — {formatTime(item.endTime)}</span>
                    </div>
                    <p className="text-slate-700 mt-1">{item.description}</p>
                    <div className="mt-3 flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditAgenda(item)} className="flex items-center gap-2 text-slate-600 hover:text-primary"><Edit2 size={14} /> Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteAgenda(item.id)} className="flex items-center gap-2 text-slate-600 hover:text-red-500"><Trash2 size={14} /> Delete</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Sheet open={isAgendaSheetOpen} onOpenChange={setIsAgendaSheetOpen}>
              <SheetContent side="right" className="w-full sm:w-[420px] max-w-[95vw] p-6">
                <h2 className="text-xl font-bold mb-4">{editingAgenda ? 'Edit Agenda' : 'Add Agenda'}</h2>
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSaveAgenda(); }}>
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={agendaForm.date} onChange={(e) => setAgendaForm({ ...agendaForm, date: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Start Time</Label>
                      <Input type="time" value={agendaForm.startTime} onChange={(e) => setAgendaForm({ ...agendaForm, startTime: e.target.value })} />
                    </div>
                    <div>
                      <Label>End Time</Label>
                      <Input type="time" value={agendaForm.endTime} onChange={(e) => setAgendaForm({ ...agendaForm, endTime: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input value={agendaForm.title} onChange={(e) => setAgendaForm({ ...agendaForm, title: e.target.value })} />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={agendaForm.description} onChange={(e) => setAgendaForm({ ...agendaForm, description: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" disabled={creatingAgenda}>{editingAgenda ? 'Update' : 'Create'}</Button>
                    <Button variant="outline" type="button" onClick={() => { setIsAgendaSheetOpen(false); setEditingAgenda(null); }}>Cancel</Button>
                  </div>
                </form>
              </SheetContent>
            </Sheet>
          </motion.section>

          {/* SPONSORS */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }} className="bg-white rounded-2xl p-6 shadow-md">
            <HeaderWithIcon title="Sponsors" icon={<Star size={18} className="text-primary" />} />
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {eventSponsorTypes.length === 0 ? (
                <div className="text-slate-500 italic text-center py-4">No sponsor packages defined.</div>
              ) : eventSponsorTypes.map((es: any) => (
                <div key={es.sponsorTypeId} className="flex items-start gap-4 bg-slate-50/70 rounded-lg p-4 border border-slate-100">
                  <img src={es.sponsorType.image} alt={es.sponsorType.name} className="h-12 w-12 object-cover rounded-lg border" />
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-800">{es.sponsorType.name}</span>
                      <span className="text-sm text-primary font-bold">${es.sponsorType.price}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{es.sponsorType.description}</p>
                    <div className="text-xs font-medium text-slate-500 mt-2">{es.quantity} slots available</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* TICKETS */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl p-6 shadow-md">
            <HeaderWithIcon title="Tickets" icon={<Ticket size={18} className="text-primary" />} />
            <div className="mt-4 flex flex-col gap-3">
              {eventTickets.length === 0 ? (
                <div className="text-slate-500 italic text-center py-4">No tickets defined.</div>
              ) : eventTickets.map((et: any) => (
                <div key={et.ticketId} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50/70 border border-slate-100">
                  <img src={et.ticket.logo} alt={et.ticket.name} className="h-14 w-14 object-cover rounded-lg border" />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800">{et.ticket.name}</div>
                    <div className="text-sm text-primary font-bold">Price: ${et.ticket.price}</div>
                    <div className="text-xs text-slate-500 font-medium">{et.quantity} available</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* HOTELS */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="bg-white rounded-2xl p-6 shadow-md">
            <HeaderWithIcon title="Hotels" icon={<Hotel size={18} className="text-primary" />} />
            <div className="mt-4 grid grid-cols-1 gap-4">
              {hotels.length === 0 ? (
                <div className="text-slate-500 italic text-center py-4">No hotels linked.</div>
              ) : hotels.map((hotel: any) => (
                <div key={hotel.id} className="flex items-start gap-3 bg-slate-50/70 rounded-xl p-3 border border-slate-100">
                  <img src={hotel.image} alt={hotel.hotelName} className="h-20 w-28 object-cover rounded-lg border" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800">{hotel.hotelName}</div>
                        <div className="text-xs text-slate-600">{hotel.address}</div>
                      </div>
                    </div>

                    {hotel.roomTypes && (
                      <ul className="mt-2 text-xs text-slate-700">
                        {hotel.roomTypes.map((rt: any) => {
                          const eventRoomType = event.eventRoomTypes?.find((ert: any) => ert.roomTypeId === rt.id);
                          const available = eventRoomType ? eventRoomType.quantity : 0;
                          return (
                            <li key={rt.id} className="flex justify-between py-1 border-t border-slate-200/60 first:border-t-0">
                              <div>{rt.roomType} — <span className="font-semibold text-primary">${rt.price}</span></div>
                              <div className="text-slate-600 font-medium">{available} available</div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* VENUE */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }} className="bg-white rounded-2xl p-6 shadow-md">
            <HeaderWithAction
              title="Venue"
              buttonLabel={venue ? 'Edit Venue' : 'Add Venue'}
              icon={<Landmark size={18} className="text-primary" />}
              onAction={() => setIsVenueSheetOpen(true)}
            />

            <div className="mt-4">
              {venue ? (
                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <div className="grid grid-cols-1 gap-0">
                    <div className="w-full h-36 bg-slate-100">
                      {venue.imageUrls?.[0] && <img src={venue.imageUrls[0]} alt={venue.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="p-4 bg-white">
                      <h3 className="text-lg font-bold text-slate-800">{venue.name}</h3>
                      <p className="text-sm text-slate-700 mt-1">{venue.description}</p>
                      <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2"><strong>Airport:</strong> {venue.closestAirport || 'N/A'}</div>
                        <div className="flex items-center gap-2"><strong>Transport:</strong> {venue.publicTransport || 'N/A'}</div>
                        <div className="flex items-center gap-2"><strong>Nearby:</strong> {venue.nearbyPlaces || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 italic text-center py-4">No venue linked.</div>
              )}
            </div>

            <Sheet open={isVenueSheetOpen} onOpenChange={setIsVenueSheetOpen}>
              <SheetContent side="right" className="w-full sm:w-[420px] max-w-[95vw] p-6">
                <h2 className="text-xl font-bold mb-4">{venue ? 'Edit Venue' : 'Add Venue'}</h2>
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSaveVenue(); }}>
                  {[
                    { label: 'Venue Name', name: 'name' },
                    { label: 'Description', name: 'description', textarea: true },
                    { label: 'Image URLs (comma separated)', name: 'imageUrls', textarea: true },
                    { label: 'Closest Airport', name: 'closestAirport' },
                    { label: 'Public Transport', name: 'publicTransport' },
                    { label: 'Nearby Places', name: 'nearbyPlaces' },
                  ].map((field) => (
                    <div key={field.name}>
                      <Label>{field.label}</Label>
                      {field.textarea ? (
                        <Textarea value={(venueForm as any)[field.name]} onChange={(e) => setVenueForm({ ...venueForm, [field.name]: e.target.value })} />
                      ) : (
                        <Input value={(venueForm as any)[field.name]} onChange={(e) => setVenueForm({ ...venueForm, [field.name]: e.target.value })} />
                      )}
                    </div>
                  ))}
                  <Button disabled={savingVenue} className="w-full">
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
  );
}

// HEADER helpers
function HeaderWithAction({ title, buttonLabel, icon, onAction }: any) {
  return (
    <div className="flex justify-between items-center mb-2">
      <div className="flex items-center gap-3 text-xl font-bold text-slate-800">{icon}<span>{title}</span></div>
      <Button variant="outline" size="sm" className="gap-2" onClick={onAction}>{buttonLabel}</Button>
    </div>
  );
}

function HeaderWithIcon({ title, icon }: any) {
  return <h2 className="flex items-center gap-3 text-xl font-bold text-slate-800 mb-2">{icon}<span>{title}</span></h2>;
}
