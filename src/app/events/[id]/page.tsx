'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Plus, User, MapPin, Calendar, Ticket, Hotel, Boxes, Landmark, Star } from 'lucide-react';

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

  // Dummy agenda form/logic – adapt as desired!
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
      //
    } finally {
      setSavingVenue(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );

  if (!event) return <div className="py-32 text-center text-gray-500">Event not found</div>;

  // Split data
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
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-12">

      {/* HERO */}
      <section className="relative rounded-2xl shadow-xl mb-6 overflow-hidden bg-white">
        {thumbnail && <img src={thumbnail} alt={name} className="w-full h-64 object-cover opacity-90" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute left-0 bottom-0 p-8 text-white w-full z-10">
          <h1 className="text-4xl font-extrabold drop-shadow-lg">{name}</h1>
          <div className="flex flex-wrap gap-4 mt-3 text-white/90 items-center text-base font-medium">
            <span><MapPin size={18} className="inline mr-1" />{location}</span>
            <span><Calendar size={18} className="inline mr-1" />{formatDate(startDate)} — {formatDate(endDate)}</span>
            {eventType && (
              <span className="bg-yellow-500/90 px-2 rounded text-sm uppercase tracking-widest font-bold ml-3">
                {eventType}
              </span>
            )}
            {expectedAudience && <span className="flex items-center gap-1 ml-3"><User size={16} /> {expectedAudience}</span>}
          </div>
          <p className="mt-3 text-lg font-normal drop-shadow">{description}</p>
        </div>
      </section>

      {/* BOOTHS */}
      <section>
        <HeaderWithAction
          title="Booth Types"
          buttonLabel="Manage Booths"
          icon={<Boxes size={18} />}
          onAction={() => setIsBoothSheetOpen(true)}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-3">
          {booths.length === 0 ? (
            <p className="text-gray-500 italic text-center col-span-full">No booths linked yet.</p>
          ) : booths.map((booth:any) => (
            <div key={booth.id} className="rounded-xl shadow bg-white p-4 flex flex-col gap-3">
              <div className="relative">
                <img src={booth.image} alt={booth.name} className="rounded w-full h-[120px] object-cover border mb-2" />
                <div className="absolute right-1 top-1 bg-primary px-2 py-1 rounded text-xs text-white font-bold">
                  ${booth.price}
                </div>
              </div>
              <div>
                <h3 className="font-bold text-xl mb-1">{booth.name}</h3>
                {booth.subTypes && booth.subTypes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {booth.subTypes.map((sub: any) => (
                      <span key={sub.id} className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold text-xs">
                        {sub.name} (${sub.price})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Booth Sheet */}
        <Sheet open={isBoothSheetOpen} onOpenChange={setIsBoothSheetOpen}>
          <SheetContent side="right" className="w-full sm:w-[600px] max-w-[90vw] p-6">
            <BoothSubTypeManager
              eventId={eventId}
              eventBooths={booths}
              refreshEvent={fetchEvent}
            />
          </SheetContent>
        </Sheet>
      </section>

      {/* HOTELS */}
      <section>
        <HeaderWithIcon title="Hotels" icon={<Hotel size={18} />} />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-3">
          {hotels.length === 0 ? (
  <p className="text-gray-500 italic text-center col-span-full">No hotels linked.</p>
) : hotels.map((hotel: any) => (
  <div key={hotel.id} className="rounded-xl border bg-white shadow-sm p-3 flex flex-col gap-2">
    {/* Hotel Name */}
    <div className="flex items-center gap-2 mb-1">
      <span className="font-bold text-lg">{hotel.hotelName}</span>
    </div>
    <div className="relative">
      <img src={hotel.image} alt={hotel.hotelName} className="w-full h-28 rounded object-cover border" />
    </div>
    {/* Room Types */}
    {hotel.roomTypes && hotel.roomTypes.length > 0 && (
      <div>
        <div className="text-xs text-gray-700 font-medium mb-1">Room Types:</div>
        <ul className="pl-2">
          {hotel.roomTypes.map((rt: any) => {
            const eventRoomType = event.eventRoomTypes?.find(
              (ert: any) => ert.roomTypeId === rt.id
            );
            const available = eventRoomType ? eventRoomType.quantity : 0;
            const total = rt.availableRooms ?? "N/A";
            return (
              <li key={rt.id} className="text-xs mb-2 flex flex-col">
                <div>
                  <span className="font-semibold">{rt.roomType}</span>
                  {" "}
                  - ${rt.price}
                  {rt.amenities && (
                    <span className="text-gray-500 ml-1">({rt.amenities})</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Available Rooms:{" "}
                  <span className="font-semibold text-gray-700">
                    {available} / {total}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    )}
  </div>
))}

        </div>
      </section>

      {/* AGENDA */}
      <section>
        <HeaderWithIcon title="Agenda" icon={<Calendar size={18} />} />
        <div className="mt-3">
          {agendaItems.length === 0 ? (
            <p className="text-gray-500 italic">No agenda items yet.</p>
          ) : agendaItems.map((item: any) => (
            <div key={item.id} className="mb-3 flex items-start gap-3 bg-white p-4 rounded-lg shadow">
              <div className="rounded-full bg-primary/20 text-primary w-12 h-12 flex items-center justify-center font-bold text-lg">
                {formatDate(item.date).split(' ')[0]}
              </div>
              <div className="flex-1">
                <div className="flex gap-2 items-baseline">
                  <h4 className="font-bold text-lg">{item.title}</h4>
                  <span className="text-xs text-gray-500">{formatTime(item.startTime)} - {formatTime(item.endTime)}</span>
                </div>
                <p className="text-gray-700">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TICKETS */}
      <section>
        <HeaderWithIcon title="Tickets" icon={<Ticket size={18} />} />
        <div className="flex gap-4 flex-wrap mt-2">
          {eventTickets.length === 0 ? (
            <p className="text-gray-500 italic">No tickets defined.</p>
          ) : eventTickets.map((et: any) => (
            <div key={et.ticketId} className="bg-white rounded-lg border shadow px-5 py-4 flex items-center gap-4">
              <img src={et.ticket.logo} alt={et.ticket.name} className="h-14 w-14 object-cover rounded-lg border" />
              <div>
                <span className="block font-semibold text-lg">{et.ticket.name}</span>
                <span className="block text-gray-700">Price: ${et.ticket.price}</span>
                <span className="block text-xs text-gray-500">{et.quantity} available</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SPONSORS */}
      <section>
        <HeaderWithIcon title="Sponsors" icon={<Star size={18} />} />
        <div className="flex gap-4 flex-wrap mt-2">
          {eventSponsorTypes.length === 0 ? (
            <p className="text-gray-500 italic">No sponsor packages defined.</p>
          ) : eventSponsorTypes.map((es: any) => (
            <div key={es.sponsorTypeId} className="bg-white border shadow rounded-lg px-5 py-4 flex items-center gap-4">
              <img src={es.sponsorType.image} alt={es.sponsorType.name} className="h-12 w-12 object-cover rounded border" />
              <div>
                <span className="font-semibold">{es.sponsorType.name}</span>
                <span className="block text-gray-700">${es.sponsorType.price}</span>
                <span className="text-xs text-gray-500">{es.quantity} slots</span>
                <p className="text-xs mt-1 text-gray-600">{es.sponsorType.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* VENUE */}
      <section>
        <HeaderWithAction
          title="Venue"
          buttonLabel={venue ? "Edit Venue" : "Add Venue"}
          icon={<Landmark size={18} />}
          onAction={() => setIsVenueSheetOpen(true)}
        />
        <div className="mt-3">
          {venue ? (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl font-bold">{venue.name}</h3>
              <p className="text-gray-700 mt-1 mb-4">{venue.description}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {venue.imageUrls?.map((url: string, i: number) => (
                  <img key={i} src={url} alt="Venue" className="rounded-md border w-full h-32 object-cover" />
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <VenueDetail label="Closest Airport" value={venue.closestAirport} />
                <VenueDetail label="Public Transport" value={venue.publicTransport} />
                <VenueDetail label="Nearby Places" value={venue.nearbyPlaces} />
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">No venue linked.</p>
          )}
        </div>
        <Sheet open={isVenueSheetOpen} onOpenChange={setIsVenueSheetOpen}>
          <SheetContent side="right" className="w-full sm:w-[400px] max-w-[95vw] p-6">
            <h2 className="text-xl font-bold mb-4">{venue ? "Edit Venue" : "Add Venue"}</h2>
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSaveVenue(); }}>
              {[
                { label: "Venue Name", name: "name" },
                { label: "Description", name: "description", textarea: true },
                { label: "Image URLs (comma separated)", name: "imageUrls", textarea: true },
                { label: "Closest Airport", name: "closestAirport" },
                { label: "Public Transport", name: "publicTransport" },
                { label: "Nearby Places", name: "nearbyPlaces" },
              ].map(field => (
                <div key={field.name}>
                  <Label>{field.label}</Label>
                  {field.textarea ? (
                    <Textarea
                      className="text-gray-900"
                      value={venueForm[field.name as keyof typeof venueForm]}
                      onChange={e => setVenueForm({ ...venueForm, [field.name]: e.target.value })}
                    />
                  ) : (
                    <Input
                      className="text-gray-900"
                      value={venueForm[field.name as keyof typeof venueForm]}
                      onChange={e => setVenueForm({ ...venueForm, [field.name]: e.target.value })}
                    />
                  )}
                </div>
              ))}
              <Button disabled={savingVenue} className="w-full">
                {venue ? "Update Venue" : "Add Venue"}
                {savingVenue && <Loader2 className="animate-spin ml-2 h-4 w-4" />}
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </section>
    </div>
  );
}

// HEADER helpers — use for consistent styling
function HeaderWithAction({ title, buttonLabel, icon, onAction } : any) {
  return (
    <div className="flex justify-between items-center mb-2">
      <div className="flex items-center gap-2 text-xl font-bold">{icon}{title}</div>
      <Button variant="outline" size="sm" className="gap-2" onClick={onAction}>{buttonLabel}</Button>
    </div>
  );
}
function HeaderWithIcon({ title, icon } : any) {
  return <h2 className="flex items-center gap-2 text-xl font-bold mb-2">{icon}{title}</h2>;
}
function VenueDetail({ label, value } : { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-semibold">{value || "N/A"}</div>
    </div>
  );
}
