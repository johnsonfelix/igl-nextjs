'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, MapPin, Users, ArrowRight, AlertTriangle, Loader } from 'lucide-react';
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
    <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 group hover:shadow-2xl hover:-translate-y-2">
      <div className="relative h-56 w-full overflow-hidden">
        <img src={thumbnail || '/placeholder.png'} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className={`absolute top-4 right-4 px-3 py-1 text-sm font-semibold rounded-full shadow-lg ${
            eventType === 'Hot' ? 'bg-rose-500 text-white' : 'bg-indigo-500 text-white'
          }`}>
          {eventType}
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-2xl font-bold text-slate-800 mb-3 truncate" title={name}>{name}</h3>
        <div className="space-y-3 text-slate-600">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-indigo-500" />
            <span>{`${formattedStartDate} - ${formattedEndDate}`}</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-indigo-500" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-indigo-500" />
            <span>{expectedAudience} Attendees</span>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-slate-100">
          <Link href={`/event/${id}`} passHref>
            <span className="inline-flex items-center gap-2 font-semibold text-indigo-600 hover:text-indigo-800 transition-colors group">
              View Details <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function EventsListPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/events'); // Use relative path for API calls
        if (!res.ok) {
          throw new Error(`Failed to fetch events. Status: ${res.status}`);
        }
        const data: Event[] = await res.json();
        setEvents(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        // Fallback to mock data on error
        const mockData = [{"id":"cmdyonggh0001gasshmpz2x0i","name":"The 20th Global Freight Forwarders Conference","startDate":"2025-08-14T00:00:00.000Z","endDate":"2025-08-30T00:00:00.000Z","location":"Shanghai, China","thumbnail":"https://images.unsplash.com/photo-1561489396-888724a1543d?q=80&w=2070&auto=format&fit=crop","eventType":"Hot","expectedAudience":"2000+"},{"id":"cmfbbukz90000ga1sijup34x4","name":"Indonesia Regional Conference 2025","startDate":"2025-10-23T00:00:00.000Z","endDate":"2025-10-30T00:00:00.000Z","location":"Bali, Indonesia","thumbnail":"https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1938&auto=format&fit=crop","eventType":"New","expectedAudience":"1200"}];
        setEvents(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-12 md:px-6 md:py-16 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2">
            Upcoming Conferences & Events
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Explore our global and regional events, designed to connect and empower freight forwarding professionals worldwide.
            </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:px-6 md:py-16">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="h-12 w-12 animate-spin text-indigo-600" />
          </div>
        ) : error && events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-red-50 text-red-700 rounded-lg p-8 border border-red-200">
            <AlertTriangle className="h-12 w-12 mb-4" />
            <h2 className="text-2xl font-bold">Failed to load events</h2>
            <p>{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
