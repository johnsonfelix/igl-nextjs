'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, MapPin, Users, ArrowRight, AlertTriangle, Loader, Star } from 'lucide-react';
import { format, parseISO } from 'date-fns';

// --- TYPE DEFINITION for an Event ---
interface Event {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  thumbnail: string;
  eventType: string;
  expectedAudience: string;
}

// --- EventCard Component ---
const EventCard = ({ event }: { event: Event }) => {
  const { id, name, startDate, endDate, location, thumbnail, eventType, expectedAudience } = event;

  // Format dates for display
  const formattedStartDate = format(parseISO(startDate), 'MMM dd');
  const formattedEndDate = format(parseISO(endDate), 'dd, yyyy');

  return (
    <Link href={`/event/${id}`} className="block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 group hover:shadow-xl hover:-translate-y-1">
      <div className="relative h-64 w-full overflow-hidden">
        <Image
          src={thumbnail || '/placeholder-event.jpg'}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>

        {/* Badge */}
        <div className={`absolute top-4 right-4 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-1 ${eventType === 'Hot' ? 'bg-rose-600 text-white' : 'bg-[#004aad] text-white'}`}>
          {eventType === 'Hot' && <Star className="w-3 h-3 fill-current" />}
          {eventType}
        </div>

        {/* Date Overlay */}
        <div className="absolute bottom-4 left-4 text-white">
          <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-lg p-3 text-center min-w-[60px]">
            <div className="text-xl font-bold leading-none">
              {format(parseISO(startDate), 'dd')}
              {format(parseISO(startDate), 'dd') !== format(parseISO(endDate), 'dd') && `-${format(parseISO(endDate), 'dd')}`}
            </div>
            <div className="text-xs font-medium uppercase mt-1">{format(parseISO(startDate), 'MMM')}</div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 leading-tight group-hover:text-[#004aad] transition-colors" title={name}>
          {name}
        </h3>

        <div className="space-y-3 text-sm text-gray-600 mb-6">
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-[#004aad]" />
            <span className="font-medium">{location}</span>
          </div>
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-[#004aad]" />
            <span>Expected attendance: {expectedAudience}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#004aad] uppercase tracking-wider">
            <Calendar className="h-4 w-4 text-[#004aad]" />
            {formattedStartDate} - {formattedEndDate}
          </div>
          <span className="inline-flex items-center gap-1 text-[#004aad] font-bold text-sm hover:gap-2 transition-all">
            Register Now <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function EventsListPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch events from API
        const res = await fetch('/api/events');
        let data: Event[] = [];

        if (res.ok) {
          data = await res.json();
        } else {
          // Fallback to mock data if API fails or for demo
          data = [
            { "id": "1", "name": "The 20th Global Freight Forwarders Conference", "startDate": "2026-08-14T00:00:00.000Z", "endDate": "2026-08-30T00:00:00.000Z", "location": "Shanghai, China", "thumbnail": "https://images.unsplash.com/photo-1561489396-888724a1543d?q=80&w=2070&auto=format&fit=crop", "eventType": "Hot", "expectedAudience": "2000+" },
            { "id": "2", "name": "Indonesia Regional Conference 2026", "startDate": "2026-10-23T00:00:00.000Z", "endDate": "2026-10-30T00:00:00.000Z", "location": "Bali, Indonesia", "thumbnail": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1938&auto=format&fit=crop", "eventType": "New", "expectedAudience": "1200" },
            { "id": "3", "name": "10th IGLA Annual Conference", "startDate": "2024-03-25T00:00:00.000Z", "endDate": "2024-03-27T00:00:00.000Z", "location": "Vietnam", "thumbnail": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop", "eventType": "Past", "expectedAudience": "800" },
            { "id": "4", "name": "IGLA Networking Summit 2023", "startDate": "2023-11-15T00:00:00.000Z", "endDate": "2023-11-18T00:00:00.000Z", "location": "Bangkok, Thailand", "thumbnail": "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop", "eventType": "Past", "expectedAudience": "1500" },
            { "id": "5", "name": "Logistics Future Forum 2019", "startDate": "2019-05-20T00:00:00.000Z", "endDate": "2019-05-22T00:00:00.000Z", "location": "Kuala Lumpur, Malaysia", "thumbnail": "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=2069&auto=format&fit=crop", "eventType": "Past", "expectedAudience": "950" }
          ];
        }

        // Filter events
        const now = new Date();
        const upcomingEvents = data.filter(event => parseISO(event.startDate) > now);
        const pastEventsList = data.filter(event => parseISO(event.startDate) <= now);

        // Sort by date
        upcomingEvents.sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());
        // Sort past events: newest first
        pastEventsList.sort((a, b) => parseISO(b.startDate).getTime() - parseISO(a.startDate).getTime());

        setEvents(upcomingEvents);
        setPastEvents(pastEventsList);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <header className="relative h-[300px] lg:h-[400px] flex items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/event-list-bg.jpg"
            alt="Events Background"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[#004aad]/80 mix-blend-multiply"></div>
        </div>
        <div className="relative z-10 px-4 max-w-4xl mx-auto">
          <span className="text-white/80 font-bold tracking-widest uppercase text-sm mb-4 block animate-fadeIn">Networking & Growth</span>
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 animate-slideUp">
            Global Conferences & Events
          </h1>
          <p className="text-white/90 text-lg max-w-2xl mx-auto leading-relaxed animate-slideUp" style={{ animationDelay: '0.1s' }}>
            Join industry leaders and freight forwarders from around the world. Connect, collaborate, and expand your business reach.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 -mt-28 relative z-20">
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 flex justify-center items-center min-h-[400px]">
            <Loader className="h-12 w-12 animate-spin text-[#004aad]" />
          </div>
        ) : error && events.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 flex flex-col items-center justify-center text-center">
            <div className="bg-red-50 p-4 rounded-full mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Unavailable</h2>
            <p className="text-gray-500">{error}</p>
          </div>
        ) : (
          <>
            <div className="max-w-4xl mx-auto flex flex-col gap-10">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>

            {/* History of Events Section */}
            {pastEvents.length > 0 && (
              <div className="mt-24">
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-1.5 h-10 bg-[#004aad] rounded-full"></div>
                  <h2 className="text-3xl font-bold text-gray-800">History of Events</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {pastEvents.map((event) => (
                    <Link key={event.id} href={`/event/${event.id}`} className="block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 group">
                      <div className="relative h-48 w-full overflow-hidden">
                        <Image
                          src={event.thumbnail || '/placeholder-event.jpg'}
                          alt={event.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 right-3 bg-gray-900/70 text-white text-xs font-bold px-2 py-1 rounded">
                          PAST EVENT
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-2 text-xs text-[#004aad] font-bold uppercase tracking-wider mb-2">
                          <Calendar className="h-3 w-3" />
                          {format(parseISO(event.startDate), 'MMM yyyy')}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-snug group-hover:text-[#004aad] transition-colors">
                          {event.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <MapPin className="h-3.5 w-3.5" />
                          {event.location}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
