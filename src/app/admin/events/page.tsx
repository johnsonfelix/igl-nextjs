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
    <div className="min-h-screen p-8 bg-[#f8f9fa] font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Events Management</h1>
            <p className="mt-1 text-sm text-gray-500">Manage your events, edit details, and track performance</p>
          </div>

          <Link href="/admin/events/create">
            <Button className="bg-[#004aad] hover:bg-[#4a8a52] text-white shadow-md hover:shadow-lg transition-all rounded-xl px-6 py-6 h-auto">
              <span className="flex items-center gap-2 font-bold">
                <Plus size={18} /> Create New Event
              </span>
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-0 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden h-80">
                <div className="h-48 bg-gray-100 animate-pulse"></div>
                <div className="p-5 space-y-3">
                  <div className="h-6 bg-gray-100 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="group relative"
              >
                <Card className="rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col">
                  <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                    {event.thumbnail ? (
                      <img
                        src={event.thumbnail}
                        alt={event.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400 flex-col gap-2">
                        <Eye size={32} className="opacity-20" />
                        <span className="text-xs font-medium">No Thumbnail</span>
                      </div>
                    )}

                    <div className="absolute top-4 left-4">
                      <div className="px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm text-xs font-bold text-gray-800 shadow-sm flex items-center gap-1.5">
                        <Eye size={12} className="text-[#004aad]" />
                        {event.location || 'Location Pending'}
                      </div>
                    </div>

                    <div className="absolute bottom-4 right-4">
                      <div className="px-3 py-1.5 rounded-lg bg-[#004aad] text-white text-xs font-bold shadow-md">
                        {event.startDate ? new Date(event.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBD'}
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-5 flex flex-col flex-grow">
                    <div className="mb-4 flex-grow">
                      <h2 className="text-xl font-bold text-gray-800 mb-2 line-clamp-1 group-hover:text-[#004aad] transition-colors">{event.name}</h2>
                      <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{event.description || 'No description provided.'}</p>
                    </div>

                    <div className="pt-4 border-t border-gray-50 grid grid-cols-3 gap-2">
                      <Link href={`/admin/events/${event.id}`} className="w-full">
                        <Button variant="ghost" size="sm" className="w-full justify-center gap-1.5 text-gray-600 hover:text-[#004aad] hover:bg-green-50 rounded-lg">
                          <Eye size={16} /> <span className="text-xs font-bold">View</span>
                        </Button>
                      </Link>

                      <Link href={`/admin/events/create?id=${event.id}`} className="w-full">
                        <Button variant="ghost" size="sm" className="w-full justify-center gap-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit size={16} /> <span className="text-xs font-bold">Edit</span>
                        </Button>
                      </Link>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(event.id)}
                        disabled={deletingId === event.id}
                        className="w-full justify-center gap-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        {deletingId === event.id ? (
                          <span className="text-xs font-bold">...</span>
                        ) : (
                          <><Trash2 size={16} /> <span className="text-xs font-bold">Delete</span></>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {events.length === 0 && (
              <div className="col-span-full py-16 px-6 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <Plus size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">No events created yet</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">Get started by creating your first event to manage logistics and registrations.</p>
                <Link href="/admin/events/create">
                  <Button className="bg-[#004aad] hover:bg-[#4a8a52] text-white font-bold">
                    Create First Event
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
