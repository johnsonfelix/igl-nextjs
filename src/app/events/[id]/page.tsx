"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/app/components/ui/sheet";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";

export default function EventViewPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<any>(null);
  const [agendaItems, setAgendaItems] = useState<any[]>([]);
  const [venue, setVenue] = useState<any>(null);
  const [isVenueSheetOpen, setIsVenueSheetOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [agendaForm, setAgendaForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    title: "",
    description: "",
  });
  const [venueForm, setVenueForm] = useState({
    name: "",
    description: "",
    imageUrls: "",
    closestAirport: "",
    publicTransport: "",
    nearbyPlaces: "",
  });

  const [creatingAgenda, setCreatingAgenda] = useState(false);
  const [savingVenue, setSavingVenue] = useState(false);

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`);
      const data = await res.json();
      setEvent(data);
    } catch (error) {
      console.error("Error fetching event:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgendaItems = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/agenda`);
      const data = await res.json();
      setAgendaItems(data);
    } catch (error) {
      console.error("Error fetching agenda:", error);
    }
  };

  const fetchVenue = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/venue`);
      if (res.ok) {
        const data = await res.json();
        if (data && Object.keys(data).length > 0) {
          setVenue(data);
          setVenueForm({
            name: data.name || "",
            description: data.description || "",
            imageUrls: data.imageUrls?.join(", ") || "",
            closestAirport: data.closestAirport || "",
            publicTransport: data.publicTransport || "",
            nearbyPlaces: data.nearbyPlaces || "",
          });
        } else {
          setVenue(null);
        }
      } else {
        setVenue(null);
      }
    } catch (error) {
      console.error("Error fetching venue:", error);
      setVenue(null);
    }
  };

  const handleCreateAgenda = async () => {
  setCreatingAgenda(true);
  try {
    const { date, startTime, endTime, title, description } = agendaForm;
    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);

    const payload = {
      title,
      description,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
    };

    const res = await fetch(`/api/events/${eventId}/agenda`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      await fetchAgendaItems();
      setAgendaForm({
        date: "",
        startTime: "",
        endTime: "",
        title: "",
        description: "",
      });
    } else {
      console.error(await res.json());
    }
  } catch (error) {
    console.error("Error creating agenda item:", error);
  } finally {
    setCreatingAgenda(false);
  }
};


  const handleSaveVenue = async () => {
    setSavingVenue(true);
    try {
      const payload = {
        ...venueForm,
        imageUrls: venueForm.imageUrls.split(",").map((url) => url.trim()),
      };
      const method = venue ? "PUT" : "POST";
      const res = await fetch(`/api/events/${eventId}/venue`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchVenue();
        setVenueForm({
          name: "",
          description: "",
          imageUrls: "",
          closestAirport: "",
          publicTransport: "",
          nearbyPlaces: "",
        });
      } else {
        console.error(await res.json());
      }
    } catch (error) {
      console.error("Error saving venue:", error);
    } finally {
      setSavingVenue(false);
    }
  };

  useEffect(() => {
  if (isVenueSheetOpen && venue) {
    setVenueForm({
      name: venue.name || "",
      description: venue.description || "",
      imageUrls: venue.imageUrls?.join(", ") || "",
      closestAirport: venue.closestAirport || "",
      publicTransport: venue.publicTransport || "",
      nearbyPlaces: venue.nearbyPlaces || "",
    });
  }
}, [isVenueSheetOpen, venue]);


  useEffect(() => {
    fetchEvent();
    fetchAgendaItems();
    fetchVenue();
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-primary-500" />
      </div>
    );
  }

  const handleDeleteAgenda = async (agendaId: string) => {
  if (!confirm("Are you sure you want to delete this agenda item?")) return;
  try {
    const res = await fetch(`/api/events/${eventId}/agenda/${agendaId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await fetchAgendaItems();
    } else {
      console.error(await res.json());
    }
  } catch (error) {
    console.error("Error deleting agenda item:", error);
  }
};


  if (!event) {
    return <div className="text-center text-gray-500">Event not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Event Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{event.name}</h1>
        <Button onClick={() => router.push(`/admin/events/edit?id=${eventId}`)}>
          Edit Event
        </Button>
      </div>

      <p className="text-gray-600">{event.description}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p><strong>Location:</strong> {event.location}</p>
          <p className="text-gray-600">
            {event.startDate?.split("T")[0] ?? "No start date"} - {event.endDate?.split("T")[0] ?? "No end date"}
          </p>
          <p><strong>Type:</strong> {event.eventType}</p>
          <p><strong>Expected Audience:</strong> {event.expectedAudience}</p>
        </div>
        {event.thumbnail && (
          <img
            src={event.thumbnail}
            alt="Event Thumbnail"
            className="rounded-lg object-cover w-full h-48"
          />
        )}
      </div>

      {/* Attachments */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Attachments</h2>
        {["booths", "hotels", "tickets", "sponsorTypes"].map((key) => (
          <div key={key}>
            <h3 className="font-medium">{key.charAt(0).toUpperCase() + key.slice(1)}</h3>
            {event[key]?.length > 0 ? (
              <ul className="list-disc list-inside text-gray-700">
                {event[key].map((item: any) => (
                  <li key={item.id}>{item.name || item.hotelName}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No {key} attached.</p>
            )}
          </div>
        ))}
      </div>

      {/* Agenda Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Agenda</h2>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus size={16} /> Create Agenda
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[400px] p-6">
              <h2 className="text-lg font-semibold mb-4">Create Agenda Item</h2>
              {/* Agenda Form */}
              <div className="space-y-4">
                {[
                  { label: "Date", type: "date", name: "date" },
                  { label: "Start Time", type: "time", name: "startTime" },
                  { label: "End Time", type: "time", name: "endTime" },
                  { label: "Title", type: "text", name: "title", placeholder: "Agenda Title" },
                ].map((field) => (
                  <div key={field.name}>
                    <Label>{field.label}</Label>
                    <Input
                      className="text-2xl text-gray-900"
                      type={field.type}
                      placeholder={field.placeholder}
                      value={agendaForm[field.name as keyof typeof agendaForm]}
                      onChange={(e) =>
                        setAgendaForm({ ...agendaForm, [field.name]: e.target.value })
                      }
                    />
                  </div>
                ))}
                <div>
                  <Label>Description</Label>
                  <Textarea
                    className="text-2xl text-gray-900"
                    placeholder="Agenda Description"
                    value={agendaForm.description}
                    onChange={(e) => setAgendaForm({ ...agendaForm, description: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreateAgenda} disabled={creatingAgenda} className="w-full text-gray-900">
                  {creatingAgenda ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" /> Creating...
                    </>
                  ) : (
                    "Create Agenda Item"
                  )}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        {agendaItems.length > 0 ? (
  <ul className="space-y-2">
    {agendaItems.map((item) => (
      <li key={item.id} className="p-4 bg-white rounded shadow-sm flex justify-between items-start">
        <div>
          <p className="font-medium">{item.title}</p>
          <p className="text-sm text-gray-600">{item.description}</p>
          <p className="text-sm text-gray-500">
            {item.date.split("T")[0]} | {item.startTime} - {item.endTime}
          </p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleDeleteAgenda(item.id)}
        >
          Delete
        </Button>
      </li>
    ))}
  </ul>
) : (
  <p className="text-sm text-gray-500">No agenda items yet.</p>
)}

      </div>

      {/* Venue Section */}
<Sheet open={isVenueSheetOpen} onOpenChange={setIsVenueSheetOpen}>
  <SheetTrigger asChild>
    <Button variant="outline" className="gap-2">
      <Plus size={16} /> {venue ? "Edit Venue" : "Add Venue"}
    </Button>
  </SheetTrigger>

  <SheetContent side="right" className="w-full sm:w-[400px] p-6 overflow-auto">
    <h2 className="text-lg font-semibold mb-4">{venue ? "Edit Venue" : "Add Venue"}</h2>
    <div className="space-y-4">
      {[
        { label: "Venue Name", name: "name" },
        { label: "Description", name: "description", textarea: true },
        { label: "Image URLs (comma separated)", name: "imageUrls", textarea: true },
        { label: "Closest Airport", name: "closestAirport" },
        { label: "Public Transport", name: "publicTransport" },
        { label: "Nearby Places", name: "nearbyPlaces" },
      ].map((field) => (
        <div key={field.name}>
          <Label>{field.label}</Label>
          {field.textarea ? (
            <Textarea
              placeholder={field.label}
              value={venueForm[field.name as keyof typeof venueForm]}
              onChange={(e) => setVenueForm({ ...venueForm, [field.name]: e.target.value })}
            />
          ) : (
            <Input
              placeholder={field.label}
              value={venueForm[field.name as keyof typeof venueForm]}
              onChange={(e) => setVenueForm({ ...venueForm, [field.name]: e.target.value })}
            />
          )}
        </div>
      ))}
      <Button onClick={handleSaveVenue} disabled={savingVenue} className="w-full">
        {savingVenue ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
        {venue ? "Update Venue" : "Add Venue"}
      </Button>
    </div>
  </SheetContent>
</Sheet>

{venue && (
  <div className="space-y-4">
    <h2 className="text-xl font-semibold">Venue Details</h2>
    <p className="font-medium">{venue.name}</p>
    <p className="text-gray-600">{venue.description}</p>
    <div className="grid grid-cols-2 gap-2">
      {venue.imageUrls?.length > 0 ? (
        venue.imageUrls.map((url: string) => (
          <img key={url} src={url} alt="Venue" className="rounded w-full h-40 object-cover" />
        ))
      ) : (
        <p className="col-span-2 text-sm text-gray-500">No images available.</p>
      )}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      <p><strong>Closest Airport:</strong> {venue.closestAirport || "N/A"}</p>
      <p><strong>Public Transport:</strong> {venue.publicTransport || "N/A"}</p>
      <p><strong>Nearby Places:</strong> {venue.nearbyPlaces || "N/A"}</p>
    </div>
  </div>
)}

    </div>
  );
}
