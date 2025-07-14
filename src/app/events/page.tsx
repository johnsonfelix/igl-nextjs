"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Edit, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (res.ok) {
        setEvents(prev => prev.filter(event => event.id !== id));
      } else {
        console.error("Failed to delete event:", await res.json());
      }
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        <Link href="/events/create">
          <Button>
            <Plus size={16} className="mr-1" /> Create Event
          </Button>
        </Link>
      </div>

      {loading ? (
        <p>Loading events...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map(event => (
            <Card key={event.id} className="border border-gray-200 rounded-lg hover:shadow">
              <CardContent className="p-0">
                {event.thumbnail ? (
                  <img
                    src={event.thumbnail}
                    alt={event.name}
                    className="w-full h-40 object-cover rounded-t"
                  />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center bg-gray-50 text-gray-400">
                    No Thumbnail
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <h2 className="font-semibold text-lg">{event.name}</h2>
                  <p className="text-sm text-gray-500">{event.location}</p>
                  <p className="text-xs text-gray-400">
                    {event.startDate ? new Date(event.startDate).toLocaleDateString() : "No Date"}
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Link href={`/events/${event.id}`}>
                      <Button variant="outline" size="sm" className="flex-1">
                        View
                      </Button>
                    </Link>
                    <Link href={`/events/create?id=${event.id}`}>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit size={14} className="mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDelete(event.id)}
                      disabled={deletingId === event.id}
                    >
                      {deletingId === event.id ? (
                        "Deleting..."
                      ) : (
                        <>
                          <Trash2 size={14} className="mr-1" />
                          Delete
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
