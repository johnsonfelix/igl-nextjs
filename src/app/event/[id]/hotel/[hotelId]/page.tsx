'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Loader, MapPin } from 'lucide-react';
import { useCart } from '@/app/event/[id]/CartContext';

interface RoomType {
  id: string;
  hotelId: string;
  roomType: string;
  price: number;
  amenities: string | null;
  availableRooms?: number;
  image?: string | null;
}

interface HotelData {
  id: string;
  hotelName: string;
  address?: string | null;
  image?: string | null;
}

export default function HotelRoomsPage({
  params,
}: {
  params: Promise<{ id: string; hotelId: string }>;
}) {
  const { id: eventId, hotelId } = use(params);
  const [hotel, setHotel] = useState<HotelData | null>(null);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/events/${eventId}/hotels/${hotelId}/rooms`);
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(e?.error || `Failed with ${res.status}`);
        }
        const data = await res.json();
        setHotel(data.hotel);
        setRooms(
          data.roomTypes.map((r: any) => ({
            id: r.id,
            hotelId: r.hotelId,
            roomType: r.roomType,
            price: r.price,
            amenities: r.amenities,
            availableRooms: r.eventRoomTypes?.[0]?.quantity ?? r.availableRooms ?? 0,
            image: r.image ?? null,
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [eventId, hotelId]);

  const handleAdd = (room: RoomType) => {
    if ((room.availableRooms ?? 0) <= 0) {
      alert('This room type is sold out for the event.');
      return;
    }
    addToCart({
      productId: hotel!.id,
      productType: 'HOTEL',
      name: `${hotel!.hotelName} - ${room.roomType}`,
      price: room.price,
      image: hotel!.image,
      roomTypeId: room.id,
    });
    alert('Room added to cart!');
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader className="h-12 w-12 animate-spin text-indigo-600" /></div>;
  if (error) return <div className="p-6 bg-red-50 rounded-md text-red-700">{error}</div>;

  return (
    <div className="container mx-auto p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href={`/event/${eventId}`} className="text-indigo-600 hover:underline">← Back to Event</Link>
        <h2 className="text-2xl font-bold text-slate-800">{hotel?.hotelName ?? 'Hotel Rooms'}</h2>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4 items-center mb-4">
          <img src={hotel?.image || '/placeholder.png'} className="w-28 h-20 object-cover rounded-md" />
          <div>
            <p className="font-bold">{hotel?.hotelName}</p>
            <p className="text-sm text-slate-500 flex items-center gap-2"><MapPin className="h-4 w-4" /> {hotel?.address}</p>
          </div>
        </div>

        {rooms.length === 0 ? (
          <p className="text-slate-500">No room types available for this hotel.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map(room => (
              <div key={room.id} className="p-4 border rounded-md flex items-center gap-4">
                <img src={room.image || '/placeholder.png'} className="w-24 h-20 object-cover rounded-md" />
                <div className="flex-grow">
                  <p className="font-semibold text-slate-800">{room.roomType}</p>
                  <p className="text-sm text-slate-500">{room.amenities}</p>
                  <p className="text-sm mt-1">Available: <span className="font-medium">{room.availableRooms ?? 0}</span></p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-indigo-600 text-lg">${room.price.toFixed(2)}</p>
                  {(room.availableRooms ?? 0) > 0 ? (
                    <button onClick={() => handleAdd(room)} className="mt-2 bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700">Add</button>
                  ) : (
                    <span className="text-red-500 font-semibold mt-2 block">Sold out</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
