"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Plus, Edit, Trash2, MapPin, Calendar, Users } from "lucide-react";

interface PastEvent {
    id: string;
    title: string;
    place: string;
    date: string;
    membersAttended: number;
    description: string;
    mainImage: string;
    carouselImages: string[];
    createdAt: string;
}

export default function PastEventsPage() {
    const router = useRouter();
    const [events, setEvents] = useState<PastEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await fetch("/api/admin/past-events");
            if (res.ok) {
                const data = await res.json();
                setEvents(data);
            }
        } catch (error) {
            console.error("Error fetching past events:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this event?")) return;

        try {
            const res = await fetch(`/api/admin/past-events/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setEvents(events.filter((e) => e.id !== id));
                alert("Event deleted successfully");
            } else {
                alert("Failed to delete event");
            }
        } catch (error) {
            console.error("Error deleting event:", error);
            alert("Error deleting event");
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Past Events</h1>
                    <p className="text-gray-500 mt-2">Manage IGLA past conferences and verify details</p>
                </div>
                <Button
                    onClick={() => router.push("/admin/past-events/create")}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Plus size={16} className="mr-2" />
                    Add New Event
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : events.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-gray-500">
                        No past events found. Create your first one!
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {events.map((event) => (
                        <Card key={event.id} className="border border-gray-200">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="w-full md:w-48 h-32 flex-shrink-0">
                                        <img
                                            src={event.mainImage}
                                            alt={event.title}
                                            className="w-full h-full rounded-lg object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">
                                                    {event.title}
                                                </h3>
                                                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                                                    <div className="flex items-center gap-1">
                                                        <MapPin size={16} className="text-blue-500" />
                                                        {event.place}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar size={16} className="text-green-500" />
                                                        {event.date}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Users size={16} className="text-purple-500" />
                                                        {event.membersAttended} Members
                                                    </div>
                                                </div>

                                                <p className="text-gray-700 mt-3 line-clamp-2">
                                                    {event.description}
                                                </p>

                                                <div className="mt-3 text-xs text-gray-500">
                                                    {event.carouselImages.length} carousel images
                                                </div>
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        router.push(`/admin/past-events/${event.id}`)
                                                    }
                                                >
                                                    <Edit size={14} className="mr-1" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDelete(event.id)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 size={14} className="mr-1" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
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
