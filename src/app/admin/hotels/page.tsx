"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent } from "@/app/components/ui/card";
import {
  Plus, Edit, Trash2, Search, Filter, MapPin, Phone, Mail,
  Image as ImageIcon, DollarSign, Bed, Users, Wifi, AlertCircle, Building2
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/app/components/ui/sheet";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Badge } from "@/app/components/ui/badge";
import { uploadFileToS3 } from "@/app/lib/s3-upload";

export default function HotelsPage() {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Hotel form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingHotel, setSavingHotel] = useState(false);
  const [hotelFile, setHotelFile] = useState<File | null>(null);
  const [hotelPreviewUrl, setHotelPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    hotelName: "",
    address: "",
    contact: "",
    contactPerson: "",
    email: "",
    eventId: "",
    image: "",
  });

  // Room form state
  const [roomFormOpen, setRoomFormOpen] = useState(false);
  const [manageRoomsOpen, setManageRoomsOpen] = useState(false);
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [savingRoom, setSavingRoom] = useState(false);
  const [roomFile, setRoomFile] = useState<File | null>(null);
  const [roomPreviewUrl, setRoomPreviewUrl] = useState<string | null>(null);
  const [roomFormData, setRoomFormData] = useState({
    roomType: "",
    price: "",
    availableRooms: "",
    maxOccupancy: "",
    amenities: "",
    image: "",
  });

  // Filters
  const [search, setSearch] = useState("");
  const [onlyWithRooms, setOnlyWithRooms] = useState(false);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/hotels?includeRooms=true");
      if (!res.ok) throw new Error("Failed to fetch hotels");
      const data = await res.json();
      if (Array.isArray(data)) {
        setHotels(data);
      } else {
        setHotels([]);
      }
    } catch (error) {
      console.error("Fetch hotels failed:", error);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  // Preview URL lifecycle for hotel image
  useEffect(() => {
    if (!hotelFile) {
      setHotelPreviewUrl(formData.image || null);
      return;
    }
    const url = URL.createObjectURL(hotelFile);
    setHotelPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [hotelFile, formData.image]);

  // Preview URL lifecycle for room image
  useEffect(() => {
    if (!roomFile) {
      setRoomPreviewUrl(roomFormData.image || null);
      return;
    }
    const url = URL.createObjectURL(roomFile);
    setRoomPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [roomFile, roomFormData.image]);

  const resetHotelForm = () => {
    setFormData({
      hotelName: "",
      address: "",
      contact: "",
      contactPerson: "",
      email: "",
      eventId: "",
      image: ""
    });
    setHotelFile(null);
    setHotelPreviewUrl(null);
    setEditingId(null);
  };

  const handleOpenAddHotel = () => {
    resetHotelForm();
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.hotelName || !formData.address || !formData.contact || !formData.contactPerson || !formData.email) {
      alert("Please fill out all required fields before saving.");
      return;
    }
    setSavingHotel(true);
    try {
      let imageUrl = formData.image;
      if (hotelFile) {
        imageUrl = await uploadFileToS3(hotelFile);
      }

      const url = editingId ? `/api/admin/hotels/${editingId}` : "/api/admin/hotels";
      const method = editingId ? "PUT" : "POST";

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          image: imageUrl ?? "",
          eventId: formData.eventId.trim() === "" ? null : formData.eventId.trim(),
        }),
      });

      resetHotelForm();
      setFormOpen(false);
      fetchHotels();
    } catch (error) {
      console.error("Save hotel failed:", error);
      alert("Failed to save hotel. See console for details.");
    } finally {
      setSavingHotel(false);
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
    setHotelFile(null);
    setHotelPreviewUrl(hotel.image || null);
    setEditingId(hotel.id);
    setFormOpen(true);
  };

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
      setRoomFile(null);
      setRoomPreviewUrl(room.image || null);
      setEditingRoomId(String(room.id));
    } else {
      setRoomFormData({ roomType: "", price: "", availableRooms: "", maxOccupancy: "", amenities: "", image: "" });
      setRoomFile(null);
      setRoomPreviewUrl(null);
      setEditingRoomId(null);
    }
    setRoomFormOpen(true);
  };

  const handleRoomSubmit = async () => {
    if (!selectedHotelId) return;
    setSavingRoom(true);
    try {
      let imageUrl = roomFormData.image;
      if (roomFile) {
        imageUrl = await uploadFileToS3(roomFile);
      }

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
          image: imageUrl ?? "",
        }),
      });

      setRoomFormData({ roomType: "", price: "", availableRooms: "", maxOccupancy: "", amenities: "", image: "" });
      setRoomFile(null);
      setRoomPreviewUrl(null);
      setEditingRoomId(null);
      setRoomFormOpen(false);
      fetchHotels();
    } catch (error) {
      console.error("Save room type failed:", error);
      alert("Failed to save room type. See console for details.");
    } finally {
      setSavingRoom(false);
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

  const visibleHotels = useMemo(
    () =>
      (Array.isArray(hotels) ? hotels : [])
        .filter((h) => (onlyWithRooms ? h.roomTypes && h.roomTypes.length > 0 : true))
        .filter(
          (h) =>
            h.hotelName.toLowerCase().includes(search.toLowerCase()) ||
            (h.address || "").toLowerCase().includes(search.toLowerCase()),
        ),
    [hotels, onlyWithRooms, search],
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const HotelCard = ({ hotel }: { hotel: any }) => {
    const roomsCount = hotel.roomTypes ? hotel.roomTypes.length : 0;
    const lowestPrice =
      hotel.roomTypes && hotel.roomTypes.length > 0 ? Math.min(...hotel.roomTypes.map((r: any) => r.price || 0)) : null;

    return (
      <motion.div variants={itemVariants} className="group flex flex-col h-full">
        <div className="relative overflow-hidden rounded-2xl shadow-sm border border-gray-100 bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex-1 flex flex-col">
          {/* Image Section */}
          <div className="relative h-56 overflow-hidden bg-gray-100 group">
            {hotel.image ? (
              <img src={hotel.image} alt={hotel.hotelName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-200">
                <Building2 size={64} strokeWidth={1} />
              </div>
            )}

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Top Actions Overlay */}
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button size="icon" className="h-9 w-9 bg-white/90 hover:bg-white text-gray-700 hover:text-emerald-600 rounded-full shadow-lg backdrop-blur-sm transition-colors" onClick={() => openEditForm(hotel)}>
                <Edit size={16} />
              </Button>
              <Button size="icon" className="h-9 w-9 bg-white/90 hover:bg-white text-gray-700 hover:text-red-600 rounded-full shadow-lg backdrop-blur-sm transition-colors" onClick={() => handleDelete(hotel.id)}>
                <Trash2 size={16} />
              </Button>
            </div>

            {/* Bottom Info Overlay */}
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <h3 className="text-xl font-bold tracking-tight drop-shadow-md leading-tight mb-1">{hotel.hotelName}</h3>
              <div className="flex items-center gap-1.5 text-white/90 text-sm font-medium drop-shadow-sm">
                <MapPin size={14} className="text-emerald-400" />
                <span className="truncate">{hotel.address || "No address provided"}</span>
              </div>
            </div>
          </div>

          <CardContent className="p-5 flex-1 flex flex-col gap-4">
            {/* Contact Details Grid */}
            <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2" title={hotel.contact}>
                <Phone size={14} className="text-emerald-500/70" />
                <span className="truncate">{hotel.contact || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2" title={hotel.email}>
                <Mail size={14} className="text-emerald-500/70" />
                <span className="truncate">{hotel.email || "N/A"}</span>
              </div>
            </div>

            {/* Rooms Preview Pucks */}
            <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-gray-100">
              {hotel.roomTypes && hotel.roomTypes.length > 0 ? (
                hotel.roomTypes.slice(0, 3).map((r: any) => (
                  <Badge key={r.id} variant="secondary" className="bg-emerald-50 text-white border-0 font-medium">
                    {r.roomType} <span className="mx-1">•</span> ₹{r.price}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-gray-400 italic flex items-center gap-1">
                  <AlertCircle size={12} /> No rooms configured
                </span>
              )}
              {hotel.roomTypes?.length > 3 && (
                <span className="text-xs text-gray-400 self-center">+{hotel.roomTypes.length - 3} more</span>
              )}
            </div>

            {/* Card Footer Actions */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <Button variant="outline" className="w-full border-gray-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors" onClick={() => openRoomForm(hotel.id)}>
                <Plus size={16} className="mr-2" /> Add Room
              </Button>
              <Button variant="ghost" className="w-full text-gray-600 hover:text-gray-900 group-hover:bg-gray-50"
                onClick={() => {
                  setSelectedHotelId(hotel.id);
                  setManageRoomsOpen(true);
                }}>
                Manage ({roomsCount})
              </Button>
            </div>
          </CardContent>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Hotels</h1>
          <p className="text-gray-500 mt-2 text-lg">Curate your hospitality partners and room inventory.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search hotels..."
              className="pl-10 w-full sm:w-72 bg-white border-gray-200 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Button
            variant="outline"
            onClick={() => setOnlyWithRooms(!onlyWithRooms)}
            className={`transition-all ${onlyWithRooms ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-white text-gray-700 border-gray-200"}`}
          >
            <Filter size={16} className={`mr-2 ${onlyWithRooms ? "text-emerald-600" : "text-gray-400"}`} />
            {onlyWithRooms ? "With Rooms Only" : "All Hotels"}
          </Button>

          <Sheet open={formOpen} onOpenChange={setFormOpen}>
            <SheetTrigger asChild>
              {/* 
                     Using onClick to strictly ensure form reset. 
                     Note: SheetTrigger prevents the default onClick from propagating sometimes, 
                     so we rely on the manual setFormOpen(true) inside handleOpenAddHotel.
                     BUT SheetTrigger automatically toggles state. 
                     We should REMOVE SheetTrigger and just use a Button if we want manual control, 
                     OR we can keep SheetTrigger and just use onOpenChange to reset if opening.
                     
                     Better approach: Remove SheetTrigger, use standard Button + onClick handler.
                 */}
              <div />
            </SheetTrigger>
            <Button onClick={handleOpenAddHotel} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all">
              <Plus size={18} className="mr-2" /> Add Hotel
            </Button>

            <SheetContent side="right" className="w-full sm:w-[540px] overflow-y-auto">
              <div className="py-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{editingId ? "Edit Hotel" : "Add New Hotel"}</h2>
                  <p className="text-sm text-gray-500">Create a new hotel profile for the event.</p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label>Hotel Name</Label>
                    <Input
                      placeholder="e.g. Grand Hyatt Logistics"
                      className="focus:ring-emerald-500"
                      value={formData.hotelName}
                      onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      placeholder="Full street address"
                      className="focus:ring-emerald-500"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Contact Number</Label>
                      <Input placeholder="+1 234..." className="focus:ring-emerald-500"
                        value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Manager Name</Label>
                      <Input placeholder="John Doe" className="focus:ring-emerald-500"
                        value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input placeholder="reservations@hotel.com" className="focus:ring-emerald-500"
                        value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Event ID (Optional)</Label>
                      <Input placeholder="EXT-101" className="focus:ring-emerald-500"
                        value={formData.eventId} onChange={(e) => setFormData({ ...formData, eventId: e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Hotel Image</Label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:bg-emerald-50/50 hover:border-emerald-200 transition-all text-center relative group">
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null;
                          setHotelFile(f);
                          if (!f) setHotelPreviewUrl(formData.image || null);
                        }}
                      />
                      {hotelPreviewUrl ? (
                        <div className="relative h-48 w-full rounded-lg overflow-hidden shadow-sm">
                          <img src={hotelPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white font-medium">Click to change</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-4">
                          <div className="bg-emerald-100 p-3 rounded-full mb-3 text-emerald-600">
                            <ImageIcon size={24} />
                          </div>
                          <p className="text-sm font-medium text-gray-700">Click or drag image here</p>
                          <p className="text-xs text-gray-500 mt-1">Supports JPG, PNG (Max 5MB)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    {/* Cancel button now also resets form for good measure */}
                    <Button variant="outline" className="flex-1" onClick={() => {
                      setFormOpen(false);
                      resetHotelForm();
                    }}>Cancel</Button>
                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSubmit} disabled={savingHotel}>
                      {savingHotel ? "Saving..." : "Save Hotel"}
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-[400px] rounded-2xl" />
          ))}
        </div>
      ) : visibleHotels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-gray-200 text-center">
          <div className="bg-emerald-50 p-5 rounded-full mb-4">
            <Building2 size={48} className="text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">No hotels found</h3>
          <p className="text-gray-500 max-w-md mt-2 mb-6">We couldn't find any hotels matching your criteria. Try adjusting your filters or add a new hotel.</p>
          <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleOpenAddHotel}>
            Add First Hotel
          </Button>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
        >
          <AnimatePresence>
            {visibleHotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Room Form Sheet */}
      <Sheet open={roomFormOpen} onOpenChange={setRoomFormOpen}>
        <SheetContent side="right" className="w-full sm:w-[500px] bg-white">
          <div className="py-6 space-y-6 h-full flex flex-col">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{editingRoomId ? "Edit Room" : "Add Room"}</h2>
              <p className="text-sm text-gray-500">Configure room details and pricing.</p>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label>Room Type Name</Label>
                <Input placeholder="e.g. Deluxe Ocean View" className="focus:ring-emerald-500"
                  value={roomFormData.roomType} onChange={(e) => setRoomFormData({ ...roomFormData, roomType: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (₹)</Label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input placeholder="5000" className="pl-9 focus:ring-emerald-500"
                      value={roomFormData.price} onChange={(e) => setRoomFormData({ ...roomFormData, price: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Available Qty</Label>
                  <div className="relative">
                    <Bed size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input placeholder="10" className="pl-9 focus:ring-emerald-500"
                      value={roomFormData.availableRooms} onChange={(e) => setRoomFormData({ ...roomFormData, availableRooms: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Occupancy</Label>
                  <div className="relative">
                    <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input placeholder="2" className="pl-9 focus:ring-emerald-500"
                      value={roomFormData.maxOccupancy} onChange={(e) => setRoomFormData({ ...roomFormData, maxOccupancy: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Amenities</Label>
                  <div className="relative">
                    <Wifi size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input placeholder="WiFi, AC..." className="pl-9 focus:ring-emerald-500"
                      value={roomFormData.amenities} onChange={(e) => setRoomFormData({ ...roomFormData, amenities: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Room Layout / Image</Label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 hover:bg-gray-50 text-center relative group">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setRoomFile(f);
                      if (!f) setRoomPreviewUrl(roomFormData.image || null);
                    }}
                  />
                  {roomPreviewUrl ? (
                    <div className="relative h-40 w-full rounded-lg overflow-hidden">
                      <img src={roomPreviewUrl} alt="Room" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-6 text-gray-400">
                      <ImageIcon size={32} className="mb-2" />
                      <span className="text-xs">Upload Room Image</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 flex gap-3 mt-auto">
              <Button variant="outline" className="flex-1" onClick={() => setRoomFormOpen(false)}>Cancel</Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleRoomSubmit} disabled={savingRoom}>
                {savingRoom ? "Saving..." : "Save Room"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Manage Rooms List Sheet */}
      <Sheet open={manageRoomsOpen} onOpenChange={setManageRoomsOpen}>
        <SheetContent side="right" className="w-full sm:w-[500px] overflow-y-auto">
          <div className="py-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Room Inventory</h2>
                <p className="text-sm text-gray-500">Manage rooms for the selected hotel.</p>
              </div>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => {
                openRoomForm(selectedHotelId || "");
                setManageRoomsOpen(false);
              }}>
                <Plus size={16} className="mr-1" /> Add
              </Button>
            </div>

            <div className="space-y-3 mt-6">
              {selectedHotelId && (hotels.find(h => h.id === selectedHotelId)?.roomTypes || []).length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl">
                  <p className="text-gray-500">No rooms added yet.</p>
                </div>
              ) : (
                selectedHotelId && (hotels.find(h => h.id === selectedHotelId)?.roomTypes || []).map((r: any) => (
                  <div key={r.id} className="flex gap-4 p-3 rounded-xl border border-gray-100 bg-white hover:shadow-md transition-shadow">
                    <div className="h-20 w-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {r.image ? (
                        <img src={r.image} alt={r.roomType} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <ImageIcon size={20} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{r.roomType}</h4>
                      <p className="text-emerald-600 font-bold text-sm">₹{r.price}</p>
                      <div className="flex gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Bed size={12} /> {r.availableRooms} Left</span>
                        <span className="flex items-center gap-1"><Users size={12} /> Max {r.maxOccupancy}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 justify-center">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-emerald-600" onClick={() => {
                        openRoomForm(selectedHotelId, r);
                        setManageRoomsOpen(false);
                      }}>
                        <Edit size={16} />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={() => handleRoomDelete(r.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
