"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent } from "@/app/components/ui/card";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/app/components/ui/sheet";
import { Skeleton } from "@/app/components/ui/skeleton";

export default function HotelsPage() {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [roomFormOpen, setRoomFormOpen] = useState(false);
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    hotelName: "",
    address: "",
    contact: "",
    eventId: "",
  });
  const [roomFormData, setRoomFormData] = useState({
    roomType: "",
    price: "",
    availableRooms: "",
    maxOccupancy: "",
    amenities: "",
    image: "",
  });

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/hotels?includeRooms=true");
      const data = await res.json();
      setHotels(data);
    } catch (error) {
      console.error("Fetch hotels failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const handleSubmit = async () => {
    try {
      const url = editingId
        ? `/api/admin/hotels/${editingId}`
        : "/api/admin/hotels";
      const method = editingId ? "PUT" : "POST";

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          eventId: formData.eventId.trim() === "" ? null : formData.eventId.trim(),
        }),
      });

      setFormData({ hotelName: "", address: "", contact: "", eventId: "" });
      setEditingId(null);
      setFormOpen(false);
      fetchHotels();
    } catch (error) {
      console.error("Save hotel failed:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this hotel?")) return;
    try {
      await fetch(`/api/admin/hotels/${id}`, { method: "DELETE" });
      fetchHotels();
    } catch (error) {
      console.error("Delete hotel failed:", error);
    }
  };

  const openEditForm = (hotel: any) => {
    setFormData({
      hotelName: hotel.hotelName || "",
      address: hotel.address || "",
      contact: hotel.contact || "",
      eventId: hotel.eventId || "",
    });
    setEditingId(hotel.id);
    setFormOpen(true);
  };

  const openRoomForm = (hotelId: string, room?: any) => {
    setSelectedHotelId(hotelId);
    if (room) {
      setRoomFormData({
        roomType: room.roomType || "",
        price: String(room.price || ""),
        availableRooms: String(room.availableRooms || ""),
        maxOccupancy: String(room.maxOccupancy || ""),
        amenities: room.amenities || "",
        image: room.image || "",
      });
      setEditingRoomId(room.id);
    } else {
      setRoomFormData({
        roomType: "",
        price: "",
        availableRooms: "",
        maxOccupancy: "",
        amenities: "",
        image: "",
      });
      setEditingRoomId(null);
    }
    setRoomFormOpen(true);
  };

  const handleRoomSubmit = async () => {
    if (!selectedHotelId) return;
    try {
      const url = editingRoomId
        ? `/api/admin/room-types/${editingRoomId}`
        : "/api/admin/room-types";
      const method = editingRoomId ? "PUT" : "POST";

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId: selectedHotelId,
          roomType: roomFormData.roomType,
          price: parseFloat(roomFormData.price),
          availableRooms: parseInt(roomFormData.availableRooms),
          maxOccupancy: parseInt(roomFormData.maxOccupancy),
          amenities: roomFormData.amenities,
          image: roomFormData.image,
        }),
      });

      setRoomFormData({
        roomType: "",
        price: "",
        availableRooms: "",
        maxOccupancy: "",
        amenities: "",
        image: "",
      });
      setEditingRoomId(null);
      setRoomFormOpen(false);
      fetchHotels();
    } catch (error) {
      console.error("Save room type failed:", error);
    }
  };

  const handleRoomDelete = async (id: string) => {
    if (!confirm("Delete this room type?")) return;
    try {
      await fetch(`/api/admin/room-types/${id}`, { method: "DELETE" });
      fetchHotels();
    } catch (error) {
      console.error("Delete room type failed:", error);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Hotels</h1>
        <Sheet open={formOpen} onOpenChange={setFormOpen}>
          <SheetTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} />
              Add Hotel
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-[420px] bg-white text-gray-900">
            <div className="p-4 space-y-4">
              <h2 className="text-lg font-semibold">
                {editingId ? "Edit Hotel" : "Add Hotel"}
              </h2>
              {[
                { key: "hotelName", label: "Hotel Name" },
                { key: "address", label: "Address" },
                { key: "contact", label: "Contact" },
                { key: "eventId", label: "Event ID (optional)" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <Input
                    placeholder={label}
                    value={formData[key as keyof typeof formData]}
                    onChange={(e) =>
                      setFormData({ ...formData, [key]: e.target.value })
                    }
                  />
                </div>
              ))}
              <Button onClick={handleSubmit} className="w-full">
                {editingId ? "Update Hotel" : "Save Hotel"}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : hotels.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <p className="text-gray-500">No hotels found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {hotels.map((hotel) => (
            <Card key={hotel.id} className="border">
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold text-lg">{hotel.hotelName}</h3>
                <p className="text-sm text-gray-500">{hotel.address || "No address"}</p>
                <p className="text-sm text-gray-500">{hotel.contact || "No contact"}</p>
                {/* <p className="text-xs text-gray-400">
                  Event ID: {hotel.eventId || "Unassigned"}
                </p> */}

                {/* RoomTypes */}
<div className="pt-2 space-y-2">
  <h4 className="text-sm font-semibold">Room Types</h4>
  {hotel.roomTypes && hotel.roomTypes.length > 0 ? (
    hotel.roomTypes.map((room: any) => (
      <div
        key={room.id}
        className="border rounded p-2 flex justify-between items-center text-sm"
      >
        <div>
          <div className="font-semibold">{room.roomType} - ${room.price}</div>
          <div className="text-xs text-gray-500">
            Available: {room.availableRooms} | Max: {room.maxOccupancy}
          </div>
          {room.amenities && (
            <div className="text-xs text-gray-400">
              Amenities: {room.amenities}
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            onClick={() => openRoomForm(hotel.id, room)}
          >
            <Edit size={14} />
          </Button>
          <Button
            variant="outline"
            className="text-red-600 hover:bg-red-50"
            onClick={() => handleRoomDelete(room.id)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    ))
  ) : (
    <p className="text-xs text-gray-400">No room types added.</p>
  )}
</div>


                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditForm(hotel)}
                  >
                    <Edit size={16} className="mr-1" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(hotel.id)}
                  >
                    <Trash2 size={16} className="mr-1" /> Delete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openRoomForm(hotel.id)}
                  >
                    <Plus size={16} className="mr-1" /> Add Room
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* RoomType Form */}
      <Sheet open={roomFormOpen} onOpenChange={setRoomFormOpen}>
        <SheetContent side="right" className="w-full sm:w-[420px] bg-white text-gray-900">
          <div className="p-4 space-y-4">
            <h2 className="text-lg font-semibold">
              {editingRoomId ? "Edit Room Type" : "Add Room Type"}
            </h2>
            {[
              { key: "roomType", label: "Room Type (e.g., Deluxe)" },
              { key: "price", label: "Price" },
              { key: "availableRooms", label: "Available Rooms" },
              { key: "maxOccupancy", label: "Max Occupancy" },
              { key: "amenities", label: "Amenities (comma separated)" },
              { key: "image", label: "Image URL (optional)" },
            ].map(({ key, label }) => (
              <div key={key}>
                <Label>{label}</Label>
                <Input
                  placeholder={label}
                  value={roomFormData[key as keyof typeof roomFormData]}
                  onChange={(e) =>
                    setRoomFormData({ ...roomFormData, [key]: e.target.value })
                  }
                />
              </div>
            ))}
            <Button onClick={handleRoomSubmit} className="w-full">
              {editingRoomId ? "Update Room Type" : "Save Room Type"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
