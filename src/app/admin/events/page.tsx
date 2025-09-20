'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Edit, Plus, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEvents(prev => prev.filter(event => event.id !== id));
      } else {
        console.error('Failed to delete event:', await res.json());
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen p-8 bg-gradient-to-b from-[#050816] via-[#07102a] to-[#081426] text-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Events</h1>
            <p className="mt-1 text-sm text-slate-400">Futuristic dashboard with neon glass UI</p>
          </div>

          <Link href="/admin/events/create">
            <Button className="relative overflow-hidden">
              <span className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 to-violet-500 opacity-40 blur-lg animate-[pulse_4s_infinite] rounded-lg" />
              <span className="relative flex items-center gap-2 z-10">
                <Plus size={14} /> Create Event
              </span>
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 rounded-2xl bg-gradient-to-br from-white/3 to-white/2 border border-white/6 backdrop-blur-sm animate-pulse h-60" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <motion.div
                key={event.id}
                whileHover={{ translateY: -6, scale: 1.02 }}
                className="relative rounded-2xl overflow-hidden"
              >
                <Card className="rounded-2xl bg-gradient-to-b from-[#07122b] to-[#021024] border border-white/6 shadow-[0_10px_30px_rgba(2,6,23,0.6)]">
                  <CardContent className="p-0">
                    <div className="relative h-40 w-full">
                      {event.thumbnail ? (
                        <img src={event.thumbnail} alt={event.name} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#081428] to-[#031023] text-slate-500">
                          No Thumbnail
                        </div>
                      )}

                      <div className="absolute left-4 top-4 px-3 py-1 rounded-full bg-white/6 backdrop-blur-sm text-xs font-semibold border border-white/6">
                        {event.location || '—'}
                      </div>

                      <div className="absolute right-4 bottom-[-18px] transform">
                        <div className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-400/20 to-violet-500/20 text-xs font-bold border border-cyan-500/20 backdrop-blur-sm shadow-md">
                          {event.startDate ? new Date(event.startDate).toLocaleDateString() : 'No Date'}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h2 className="text-lg font-bold text-white">{event.name}</h2>
                      <p className="text-sm text-slate-300 line-clamp-2">{event.description || ''}</p>

                      <div className="flex items-center gap-2 pt-4">
                        <Link href={`/admin/events/${event.id}`}>
                          <Button variant="ghost" size="sm" className="flex-1 justify-center gap-2 border border-white/6 hover:bg-white/4">
                            <Eye size={14} /> View
                          </Button>
                        </Link>

                        <Link href={`/admin/events/create?id=${event.id}`}>
                          <Button variant="outline" size="sm" className="flex-1 justify-center gap-2 border border-white/6 hover:bg-white/4">
                            <Edit size={14} /> Edit
                          </Button>
                        </Link>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(event.id)}
                          disabled={deletingId === event.id}
                          className="flex-1 justify-center gap-2 text-rose-400 hover:bg-rose-900/10"
                        >
                          {deletingId === event.id ? 'Deleting...' : <><Trash2 size={14} /> Delete</>}
                        </Button>
                      </div>
                    </div>

                    {/* neon bottom accent */}
                    <div className="h-1 bg-gradient-to-r from-cyan-400 via-pink-500 to-violet-500 opacity-80" />
                  </CardContent>
                </Card>

                {/* subtle holo glow */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl -z-10 blur-2xl opacity-40 bg-gradient-to-br from-cyan-400/8 to-violet-500/8" />
              </motion.div>
            ))}

            {events.length === 0 && (
              <div className="col-span-full text-center py-16 text-slate-400">No events yet — create your first event.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
