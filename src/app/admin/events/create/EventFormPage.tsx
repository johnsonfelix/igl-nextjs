"use client"

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Sheet, SheetContent, SheetTrigger } from "@/app/components/ui/sheet";
import { Plus, Loader2, ChevronDown, Calendar } from "lucide-react";

export default function EventFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("id"); // if present, edit mode

  const isEditMode = Boolean(eventId);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);

  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    location: "",
    thumbnail: "",
    eventType: "New",
    expectedAudience: "",
    description: "",
  });

  const [booths, setBooths] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [sponsorTypes, setSponsorTypes] = useState<any[]>([]);

  const [selectedBoothIds, setSelectedBoothIds] = useState<string[]>([]);
  const [selectedHotelIds, setSelectedHotelIds] = useState<string[]>([]);
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [selectedSponsorTypeIds, setSelectedSponsorTypeIds] = useState<string[]>([]);

  // New: Track quantities for tickets and sponsors
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({});
  const [sponsorQuantities, setSponsorQuantities] = useState<Record<string, number>>({});

  const [selectedRoomTypeIds, setSelectedRoomTypeIds] = useState<string[]>([]);
  const [roomTypeQuantities, setRoomTypeQuantities] = useState<Record<string, number>>({});

  // Fetch attachments (booths, hotels, tickets, sponsor types)
  const fetchAttachments = async () => {
    try {
      const [boothRes, hotelRes, ticketRes, sponsorTypeRes] = await Promise.all([
        fetch("/api/admin/booths"),
        fetch("/api/admin/hotels"),
        fetch("/api/admin/tickets"),
        fetch("/api/admin/sponsors"),
      ]);
      setBooths(await boothRes.json());
      setHotels(await hotelRes.json());
      setTickets(await ticketRes.json());
      setSponsorTypes(await sponsorTypeRes.json());
    } catch (error) {
      console.error("Failed to fetch attachments:", error);
    }
  };

  // Fetch event data if editing
  const fetchEvent = async () => {
  try {
    setFetching(true);
    const res = await fetch(`/api/events/${eventId}`);
    if (!res.ok) {
      console.error(await res.json());
      return;
    }
    const event = await res.json();

    setFormData({
      name: event.name,
      startDate: event.startDate?.split("T")[0] ?? "",
      endDate: event.endDate?.split("T")[0] ?? "",
      location: event.location,
      thumbnail: event.thumbnail ?? "",
      eventType: event.eventType ?? "New",
      expectedAudience: event.expectedAudience ?? "",
      description: event.description ?? "",
    });

    setSelectedBoothIds(event.booths?.map((b: any) => b.id) ?? []);
    setSelectedHotelIds(event.hotels?.map((h: any) => h.id) ?? []);

    setSelectedTicketIds(event.eventTickets?.map((et: any) => et.ticketId) ?? []);
    setTicketQuantities(
      event.eventTickets?.reduce((acc: any, et: any) => {
        acc[et.ticketId] = et.quantity ?? 1;
        return acc;
      }, {}) ?? {}
    );

    setSelectedSponsorTypeIds(event.eventSponsorTypes?.map((es: any) => es.sponsorTypeId) ?? []);
    setSponsorQuantities(
      event.eventSponsorTypes?.reduce((acc: any, es: any) => {
        acc[es.sponsorTypeId] = es.quantity ?? 1;
        return acc;
      }, {}) ?? {}
    );

    setSelectedRoomTypeIds(event.eventRoomTypes?.map((ert: any) => ert.roomTypeId) ?? []);
setRoomTypeQuantities(
  event.eventRoomTypes?.reduce((acc: any, ert: any) => {
    acc[ert.roomTypeId] = ert.quantity ?? 1;
    return acc;
  }, {}) ?? {}
);

  } catch (error) {
    console.error("Failed to fetch event:", error);
  } finally {
    setFetching(false);
  }
};


  useEffect(() => {
    fetchAttachments();
    if (isEditMode) fetchEvent();
  }, [eventId]);

  // Form submit handler
  const handleSubmit = async () => {
    try {
      setLoading(true);
      const res = await fetch(isEditMode ? `/api/events/${eventId}` : `/api/events`, {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: eventId,
          ...formData,
          booths: selectedBoothIds,
          hotels: selectedHotelIds,
          tickets: selectedTicketIds.map(id => ({
            id,
            quantity: ticketQuantities[id] || 1,
          })),
          sponsorTypes: selectedSponsorTypeIds.map(id => ({
            id,
            quantity: sponsorQuantities[id] || 1,
          })),
          roomTypes: selectedRoomTypeIds.map(id => ({
  id,
  quantity: roomTypeQuantities[id] || 1,
})),

        }),
      });

      if (res.ok) {
        router.push("/events");
      } else {
        console.error(await res.json());
      }
    } catch (error) {
      console.error("Error submitting event:", error);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? "Edit Event" : "Create New Event"}
        </h1>
        <p className="text-gray-600">
          {isEditMode
            ? "Update the details of your event below"
            : "Fill in the details below to create a new event"}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: "Event Name", key: "name", placeholder: "Enter event name", required: true },
            { label: "Location", key: "location", placeholder: "Enter venue location", required: true },
            { label: "Thumbnail URL", key: "thumbnail", placeholder: "https://example.com/image.jpg" },
            { label: "Expected Audience", key: "expectedAudience", placeholder: "e.g. 1000+" },
          ].map((field) => (
            <div key={field.key} className="space-y-2">
              <Label className="flex items-center gap-1">
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </Label>
              <Input
                placeholder={field.placeholder}
                value={formData[field.key as keyof typeof formData]}
                onChange={(e) =>
                  setFormData({ ...formData, [field.key]: e.target.value })
                }
                className="focus:ring-2 focus:ring-primary-500 text-gray-900"
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Start Date <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="pl-10 focus:ring-2 focus:ring-primary-500 text-gray-900"
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              End Date <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="pl-10 focus:ring-2 focus:ring-primary-500 text-gray-900"
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4  text-gray-900" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            placeholder="Enter detailed event description..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={4}
            className="focus:ring-2 focus:ring-primary-500 text-gray-900"
          />
        </div>

        <div className="space-y-2">
          <Label>Event Type</Label>
          <select
            value={formData.eventType}
            onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50  text-gray-900"
          >
            <option value="New">New Event</option>
            <option value="Hot">Hot Event</option>
          </select>
        </div>
      </div>

      {/* Attachments Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Attachments</h2>
            <p className="text-sm text-gray-500">Add booths, hotels, and tickets to your event</p>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2 text-gray-900">
                <Plus size={16} />
                Manage Attachments
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[500px] bg-white overflow-auto">
              <div className="space-y-6 p-4">
                <h2 className="text-xl font-semibold text-gray-900">Add Items to Event</h2>

                {/* Booths Section */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-800 flex items-center gap-2">
                    <ChevronDown className="h-4 w-4" />
                    Booths
                    {selectedBoothIds.length > 0 && (
                      <span className="ml-auto bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                        {selectedBoothIds.length} selected
                      </span>
                    )}
                  </h3>
                  {booths.length === 0 ? (
                    <p className="text-sm text-gray-500 p-2">No booths available.</p>
                  ) : (
                    <div className="space-y-2">
                      {booths.map((booth) => (
                        <div key={booth.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                          <Checkbox
                            id={`booth-${booth.id}`}
                            checked={selectedBoothIds.includes(booth.id)}
                            onCheckedChange={(checked) => {
                              setSelectedBoothIds((prev) =>
                                checked
                                  ? [...prev, booth.id]
                                  : prev.filter((id) => id !== booth.id)
                              );
                            }}
                            className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <Label htmlFor={`booth-${booth.id}`} className="flex-1 cursor-pointer">
                            <span className="font-medium">{booth.name}</span>
                            {booth.description && (
                              <p className="text-sm text-gray-500">{booth.description}</p>
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

               {/* Hotels Section with RoomTypes */}
<div className="space-y-3">
  <h3 className="font-medium text-gray-800 flex items-center gap-2">
    <ChevronDown className="h-4 w-4" />
    Hotels
    {selectedHotelIds.length > 0 && (
      <span className="ml-auto bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
        {selectedHotelIds.length} selected
      </span>
    )}
  </h3>

  {hotels.length === 0 ? (
    <p className="text-sm text-gray-500 p-2">No hotels available.</p>
  ) : (
    <div className="space-y-4">
      {hotels.map((hotel) => (
        <div key={hotel.id} className="border rounded p-2">
          <div className="flex items-center gap-3 hover:bg-gray-50 rounded p-1">
            <Checkbox
              id={`hotel-${hotel.id}`}
              checked={selectedHotelIds.includes(hotel.id)}
              onCheckedChange={(checked) => {
                setSelectedHotelIds((prev) =>
                  checked ? [...prev, hotel.id] : prev.filter((id) => id !== hotel.id)
                );

                // If hotel was unchecked, also clear selected room types for that hotel
                if (!checked) {
                  setSelectedRoomTypeIds((prev) =>
                    prev.filter((rtId) => {
                      const rt = hotels.flatMap(h => h.roomTypes).find(r => r.id === rtId);
                      // keep room types that don't belong to this unchecked hotel
                      return rt?.hotelId !== hotel.id;
                    })
                  );
                  setRoomTypeQuantities((prev) => {
                    // Remove quantities for room types of this hotel
                    const copy = { ...prev };
                    hotel.roomTypes.forEach((rt:any) => {
                      delete copy[rt.id];
                    });
                    return copy;
                  });
                }
              }}
              className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <Label htmlFor={`hotel-${hotel.id}`} className="flex-1 cursor-pointer">
              <div className="font-medium">{hotel.hotelName}</div>
              {hotel.address && <p className="text-sm text-gray-500">{hotel.address}</p>}
            </Label>
          </div>

          {/* RoomTypes for this hotel, indented */}
          <div className="ml-8 mt-2 space-y-2">
            {hotel.roomTypes.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No rooms available.</p>
            ) : (
              hotel.roomTypes.map((roomType:any) => (
                <div key={roomType.id} className="flex items-center gap-3">
                  <Checkbox
                    id={`roomType-${roomType.id}`}
                    checked={selectedRoomTypeIds.includes(roomType.id)}
                    onCheckedChange={(checked) => {
                      setSelectedRoomTypeIds((prev) =>
                        checked
                          ? [...prev, roomType.id]
                          : prev.filter((id) => id !== roomType.id)
                      );
                      // On uncheck, remove quantity from state
                      if (!checked) {
                        setRoomTypeQuantities((prev) => {
                          const copy = { ...prev };
                          delete copy[roomType.id];
                          return copy;
                        });
                      } else {
                        // If newly checked, initialize quantity to 1 if not set
                        setRoomTypeQuantities((prev) => ({
                          ...prev,
                          [roomType.id]: prev[roomType.id] || 1,
                        }));
                      }
                    }}
                    className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <Label htmlFor={`roomType-${roomType.id}`} className="flex-1 cursor-pointer">
                    <div className="flex justify-between font-medium">
                      <span>{roomType.roomType}</span>
                      <span className="text-primary-600 text-sm font-semibold">${roomType.price}</span>
                    </div>
                  </Label>

                  {/* Quantity input, only visible if selected */}
                  {selectedRoomTypeIds.includes(roomType.id) && (
                    <Input
                      type="number"
                      min={1}
                      value={roomTypeQuantities[roomType.id] || 1}
                      onChange={(e) =>
                        setRoomTypeQuantities((prev) => ({
                          ...prev,
                          [roomType.id]: Math.max(1, Number(e.target.value)),
                        }))
                      }
                      className="w-20 text-gray-900"
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )}
</div>


                {/* Tickets Section with Quantity Input */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-800 flex items-center gap-2">
                    <ChevronDown className="h-4 w-4" />
                    Tickets
                    {selectedTicketIds.length > 0 && (
                      <span className="ml-auto bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                        {selectedTicketIds.length} selected
                      </span>
                    )}
                  </h3>
                  {tickets.length === 0 ? (
                    <p className="text-sm text-gray-500 p-2">No tickets available.</p>
                  ) : (
                    <div className="space-y-2">
                      {tickets.map((ticket) => (
                        <div key={ticket.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                          <Checkbox
                            id={`ticket-${ticket.id}`}
                            checked={selectedTicketIds.includes(ticket.id)}
                            onCheckedChange={(checked) => {
                              setSelectedTicketIds((prev) =>
                                checked
                                  ? [...prev, ticket.id]
                                  : prev.filter((id) => id !== ticket.id)
                              );

                              if (!checked) {
                                setTicketQuantities(prev => {
                                  const copy = { ...prev };
                                  delete copy[ticket.id];
                                  return copy;
                                });
                              } else {
                                setTicketQuantities(prev => ({
                                  ...prev,
                                  [ticket.id]: prev[ticket.id] || 1,
                                }));
                              }
                            }}
                            className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <Label htmlFor={`ticket-${ticket.id}`} className="flex-1 cursor-pointer">
                            <div className="flex justify-between">
                              <span className="font-medium">{ticket.name}</span>
                              <span className="text-sm font-medium text-primary-600">${ticket.price}</span>
                            </div>
                            {ticket.description && (
                              <p className="text-sm text-gray-500">{ticket.description}</p>
                            )}
                          </Label>
                          {/* Quantity Input */}
                          {selectedTicketIds.includes(ticket.id) && (
                            <Input
                              type="number"
                              min={1}
                              value={ticketQuantities[ticket.id] || 1}
                              onChange={(e) =>
                                setTicketQuantities(prev => ({
                                  ...prev,
                                  [ticket.id]: Math.max(1, Number(e.target.value)),
                                }))
                              }
                              className="w-20 text-gray-900"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sponsor Types Section with Quantity Input */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-800 flex items-center gap-2">
                    <ChevronDown className="h-4 w-4" />
                    Sponsor Types
                    {selectedSponsorTypeIds.length > 0 && (
                      <span className="ml-auto bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                        {selectedSponsorTypeIds.length} selected
                      </span>
                    )}
                  </h3>
                  {sponsorTypes.length === 0 ? (
                    <p className="text-sm text-gray-500 p-2">No sponsor types available.</p>
                  ) : (
                    <div className="space-y-2">
                      {sponsorTypes.map((sponsorType) => (
                        <div key={sponsorType.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                          <Checkbox
                            id={`sponsorType-${sponsorType.id}`}
                            checked={selectedSponsorTypeIds.includes(sponsorType.id)}
                            onCheckedChange={(checked) => {
                              setSelectedSponsorTypeIds((prev) =>
                                checked
                                  ? [...prev, sponsorType.id]
                                  : prev.filter((id) => id !== sponsorType.id)
                              );
                              if (!checked) {
                                setSponsorQuantities(prev => {
                                  const copy = { ...prev };
                                  delete copy[sponsorType.id];
                                  return copy;
                                });
                              } else {
                                setSponsorQuantities(prev => ({
                                  ...prev,
                                  [sponsorType.id]: prev[sponsorType.id] || 1,
                                }));
                              }
                            }}
                            className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <Label htmlFor={`sponsorType-${sponsorType.id}`} className="flex-1 cursor-pointer">
                            <span className="font-medium">{sponsorType.name}</span>
                            {sponsorType.description && (
                              <p className="text-sm text-gray-500">{sponsorType.description}</p>
                            )}
                          </Label>
                          {/* Quantity Input */}
                          {selectedSponsorTypeIds.includes(sponsorType.id) && (
                            <Input
                              type="number"
                              min={1}
                              value={sponsorQuantities[sponsorType.id] || 1}
                              onChange={(e) =>
                                setSponsorQuantities(prev => ({
                                  ...prev,
                                  [sponsorType.id]: Math.max(1, Number(e.target.value)),
                                }))
                              }
                              className="w-20 text-gray-900"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </SheetContent>
          </Sheet>
        </div>

        {(selectedBoothIds.length > 0 || selectedHotelIds.length > 0 || selectedTicketIds.length > 0 || selectedSponsorTypeIds.length > 0) ? (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-2">Selected Items</h3>
            <div className="flex flex-wrap gap-2">
              {selectedBoothIds.length > 0 && (
                <span className="inline-flex items-center bg-blue-50 text-blue-800 text-xs px-3 py-1 rounded-full">
                  {selectedBoothIds.length} Booth{selectedBoothIds.length !== 1 ? 's' : ''}
                </span>
              )}
              {selectedHotelIds.length > 0 && (
                <span className="inline-flex items-center bg-green-50 text-green-800 text-xs px-3 py-1 rounded-full">
                  {selectedHotelIds.length} Hotel{selectedHotelIds.length !== 1 ? 's' : ''}
                </span>
              )}
              {selectedTicketIds.length > 0 && (
                <span className="inline-flex items-center bg-purple-50 text-purple-800 text-xs px-3 py-1 rounded-full">
                  {selectedTicketIds.length} Ticket{selectedTicketIds.length !== 1 ? 's' : ''}
                </span>
              )}
              {selectedSponsorTypeIds.length > 0 && (
                <span className="inline-flex items-center bg-yellow-50 text-yellow-800 text-xs px-3 py-1 rounded-full">
                  {selectedSponsorTypeIds.length} Sponsor Type{selectedSponsorTypeIds.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-gray-500">No items selected yet</p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button variant="outline" onClick={() => router.push("/admin/events")}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading} className="min-w-[120px]">
          {loading ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              {isEditMode ? "Updating..." : "Creating..."}
            </>
          ) : isEditMode ? (
            "Update Event"
          ) : (
            "Create Event"
          )}
        </Button>
      </div>
    </div>
  );
}
