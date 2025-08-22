"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent } from "@/app/components/ui/card";
import { Plus, Edit, Trash2, Search, Filter, MapPin, Phone, Mail, Image as ImageIcon, DollarSign } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/app/components/ui/sheet";
import { Skeleton } from "@/app/components/ui/skeleton";

export default function HotelsPage() {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [roomFormOpen, setRoomFormOpen] = useState(false);
  const [manageRoomsOpen, setManageRoomsOpen] = useState(false);
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [onlyWithRooms, setOnlyWithRooms] = useState(false);

  const [formData, setFormData] = useState({
    hotelName: "",
    address: "",
    contact: "",
    contactPerson: "",
    email: "",
    eventId: "",
    image: "",
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
    if (!formData.hotelName || !formData.address || !formData.contact || !formData.contactPerson || !formData.email) {
      alert("Please fill out all required fields before saving.");
      return;
    }
    try {
      const url = editingId ? `/api/admin/hotels/${editingId}` : "/api/admin/hotels";
      const method = editingId ? "PUT" : "POST";

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          eventId: formData.eventId.trim() === "" ? null : formData.eventId.trim(),
        }),
      });

      setFormData({ hotelName: "", address: "", contact: "", contactPerson: "", email: "", eventId: "", image: "" });
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
      contactPerson: hotel.contactPerson || "",
      email: hotel.email || "",
      image: hotel.image || "",
    });
    setEditingId(hotel.id);
    setFormOpen(true);
  };

  // open room form for a specific room (ensure id is string)
  const openRoomForm = (hotelId: string, room?: any) => {
    setSelectedHotelId(hotelId);
    if (room) {
      setRoomFormData({
        roomType: room.roomType || "",
        price: String(room.price ?? ""),
        availableRooms: String(room.availableRooms ?? ""),
        maxOccupancy: String(room.maxOccupancy ?? ""),
        amenities: room.amenities || "",
        image: room.image || "",
      });
      setEditingRoomId(String(room.id));
    } else {
      setRoomFormData({ roomType: "", price: "", availableRooms: "", maxOccupancy: "", amenities: "", image: "" });
      setEditingRoomId(null);
    }
    setRoomFormOpen(true);
  };

  const handleRoomSubmit = async () => {
    if (!selectedHotelId) return;
    try {
      const url = editingRoomId ? `/api/admin/room-types/${editingRoomId}` : "/api/admin/room-types";
      const method = editingRoomId ? "PUT" : "POST";

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId: selectedHotelId,
          roomType: roomFormData.roomType,
          price: parseFloat(roomFormData.price || "0"),
          availableRooms: parseInt(roomFormData.availableRooms || "0"),
          maxOccupancy: parseInt(roomFormData.maxOccupancy || "0"),
          amenities: roomFormData.amenities,
          image: roomFormData.image,
        }),
      });

      setRoomFormData({ roomType: "", price: "", availableRooms: "", maxOccupancy: "", amenities: "", image: "" });
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

  // Filter + search
  const visibleHotels = hotels
    .filter(h => (onlyWithRooms ? (h.roomTypes && h.roomTypes.length > 0) : true))
    .filter(h => h.hotelName.toLowerCase().includes(search.toLowerCase()) || (h.address || "").toLowerCase().includes(search.toLowerCase()));

  // Small presentational subcomponent
  const HotelCard = ({ hotel }: { hotel: any }) => {
    const roomsCount = hotel.roomTypes ? hotel.roomTypes.length : 0;
    const lowestPrice = hotel.roomTypes && hotel.roomTypes.length > 0 ? Math.min(...hotel.roomTypes.map((r: any) => r.price || 0)) : null;

    return (
      <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-br from-white/60 to-white/40 rounded-2xl shadow-lg border overflow-hidden">
        <div className="relative">
          <div className="h-44 w-full bg-gray-100">
            {hotel.image ? (
              <img src={hotel.image} alt={hotel.hotelName} className="w-full h-44 object-cover" />
            ) : (
              <div className="w-full h-44 flex items-center justify-center text-gray-400">
                <ImageIcon size={36} />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute left-4 bottom-3 text-white">
              <h3 className="text-lg font-semibold drop-shadow">{hotel.hotelName}</h3>
              <p className="text-xs drop-shadow">{hotel.address || "No address"}</p>
            </div>
            <div className="absolute right-4 top-4 flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => openEditForm(hotel)}>
                <Edit size={16} />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(hotel.id)} className="text-red-600">
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin size={14} />
                <span>{hotel.address || "-"}</span>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1"><Phone size={12} />{hotel.contact || "-"}</div>
                <div className="flex items-center gap-1"><Mail size={12} />{hotel.email || "-"}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">{roomsCount} room{roomsCount !== 1 ? "s" : ""}</div>
              {lowestPrice !== null && (
                <div className="text-xs mt-1 flex items-center gap-1 text-gray-600"><DollarSign size={12} />{lowestPrice}</div>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {hotel.roomTypes && hotel.roomTypes.length > 0 ? (
              hotel.roomTypes.slice(0, 3).map((r: any) => (
                <div key={r.id} className="px-2 py-1 rounded-full bg-gray-100 text-xs text-gray-700 border">{r.roomType} • ₹{r.price}</div>
              ))
            ) : (
              <div className="text-xs text-gray-400">No room types added.</div>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="outline" onClick={() => openRoomForm(hotel.id)}>
              <Plus size={14} /> Add Room
            </Button>

            {/* Manage rooms - opens a sheet listing all room subtypes with edit buttons */}
            <Button size="sm" variant="ghost" onClick={() => { setSelectedHotelId(hotel.id); setManageRoomsOpen(true); }}>
              Manage Rooms
            </Button>
          </div>
        </CardContent>
      </motion.div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Hotels</h1>
          <p className="text-sm text-gray-500">Manage hotels and room types — beautiful, quick and usable.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-white">
            <Search size={16} className="text-gray-400" />
            <Input placeholder="Search hotels or address" value={search} onChange={(e) => setSearch(e.target.value)} className="border-0 p-0 bg-transparent" />
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setOnlyWithRooms(!onlyWithRooms)} className={`px-3 py-2 rounded-lg border ${onlyWithRooms ? "bg-indigo-600 text-white" : "bg-white text-gray-700"}`}>
              <Filter size={14} className="inline-block mr-2" /> {onlyWithRooms ? "With rooms" : "All"}
            </button>

            <Sheet open={formOpen} onOpenChange={setFormOpen}>
              <SheetTrigger asChild>
                <Button className="gap-2">
                  <Plus size={16} /> Add Hotel
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-[520px] bg-white text-gray-900">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-2">{editingId ? "Edit Hotel" : "Add Hotel"}</h2>
                  <p className="text-sm text-gray-500 mb-4">Add or update hotel details. Image URL will show preview.</p>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <Label>Hotel Name</Label>
                      <Input value={formData.hotelName} onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })} placeholder="Hotel name" />
                    </div>

                    <div>
                      <Label>Address</Label>
                      <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="123, City, Country" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Contact</Label>
                        <Input value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} placeholder="+91 98xxxx" />
                      </div>
                      <div>
                        <Label>Contact Person</Label>
                        <Input value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} placeholder="Name" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Email</Label>
                        <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" />
                      </div>
                      <div>
                        <Label>Event ID (optional)</Label>
                        <Input value={formData.eventId} onChange={(e) => setFormData({ ...formData, eventId: e.target.value })} placeholder="Event id" />
                      </div>
                    </div>

                    <div>
                      <Label>Image URL (optional)</Label>
                      <Input value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} placeholder="https://..." />
                      {formData.image && (
                        <div className="mt-2 rounded overflow-hidden border"> 
                          <img src={formData.image} alt="preview" className="w-full h-36 object-cover" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-4">
                      <Button variant="ghost" onClick={() => { setFormOpen(false); setEditingId(null); }}>Cancel</Button>
                      <Button onClick={handleSubmit} variant="primary">{editingId ? "Update Hotel" : "Save Hotel"}</Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden">
              <Skeleton className="h-44" />
              <Skeleton className="h-20 mt-3" />
            </div>
          ))}
        </div>
      ) : visibleHotels.length === 0 ? (
        <div className="text-center py-12 border rounded-2xl bg-gradient-to-r from-gray-50 to-white">
          <p className="text-gray-500">No hotels match your search.</p>
          <Button className="mt-4" onClick={() => setFormOpen(true)}>
            <Plus size={16} /> Add your first hotel
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleHotels.map((hotel) => (
            <HotelCard key={hotel.id} hotel={hotel} />
          ))}
        </div>
      )}

      {/* Room Form */}
      <Sheet open={roomFormOpen} onOpenChange={setRoomFormOpen}>
        <SheetContent side="right" className="w-full sm:w-[520px] bg-white text-gray-900">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-2">{editingRoomId ? "Edit Room Type" : "Add Room Type"}</h2>
            <p className="text-sm text-gray-500 mb-4">Attach room types to the selected hotel.</p>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label>Room Type</Label>
                <Input value={roomFormData.roomType} onChange={(e) => setRoomFormData({ ...roomFormData, roomType: e.target.value })} placeholder="Deluxe / Suite" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Price (₹)</Label>
                  <Input value={roomFormData.price} onChange={(e) => setRoomFormData({ ...roomFormData, price: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <Label>Available Rooms</Label>
                  <Input value={roomFormData.availableRooms} onChange={(e) => setRoomFormData({ ...roomFormData, availableRooms: e.target.value })} placeholder="0" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Max Occupancy</Label>
                  <Input value={roomFormData.maxOccupancy} onChange={(e) => setRoomFormData({ ...roomFormData, maxOccupancy: e.target.value })} placeholder="2" />
                </div>
                <div>
                  <Label>Image URL (optional)</Label>
                  <Input value={roomFormData.image} onChange={(e) => setRoomFormData({ ...roomFormData, image: e.target.value })} placeholder="https://..." />
                </div>
              </div>

              <div>
                <Label>Amenities</Label>
                <Input value={roomFormData.amenities} onChange={(e) => setRoomFormData({ ...roomFormData, amenities: e.target.value })} placeholder="WiFi, AC, Breakfast" />
              </div>

              <div className="flex items-center justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => { setRoomFormOpen(false); setEditingRoomId(null); }}>Cancel</Button>
                <Button onClick={handleRoomSubmit} variant="primary">{editingRoomId ? "Update Room" : "Save Room"}</Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Manage Rooms Sheet */}
      <Sheet open={manageRoomsOpen} onOpenChange={setManageRoomsOpen}>
        <SheetContent side="right" className="w-full sm:w-[520px] bg-white text-gray-900">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-2">Manage Rooms</h2>
            <p className="text-sm text-gray-500 mb-4">Edit, delete or add room types for the selected hotel.</p>

            <div className="space-y-3">
              {selectedHotelId && (
                (hotels.find(h => h.id === selectedHotelId)?.roomTypes || []).map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between border rounded p-3">
                    <div>
                      <div className="font-medium">{r.roomType} • ₹{r.price}</div>
                      <div className="text-xs text-gray-500">Available: {r.availableRooms} | Max: {r.maxOccupancy}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { openRoomForm(selectedHotelId, r); /* close manage so room sheet is focused */ setManageRoomsOpen(false); }}>
                        <Edit size={14} /> Edit
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => handleRoomDelete(r.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))
              )}

              <div className="pt-3">
                <Button onClick={() => { openRoomForm(selectedHotelId || ""); setManageRoomsOpen(false); }}>
                  <Plus size={14} /> Add Room
                </Button>
              </div>
            </div>

            <div className="mt-4 text-right">
              <Button variant="ghost" onClick={() => setManageRoomsOpen(false)}>Close</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
