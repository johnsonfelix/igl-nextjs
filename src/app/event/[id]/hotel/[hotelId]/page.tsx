'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader, MapPin, Tag } from 'lucide-react';
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

type OfferScope = 'ALL' | 'HOTELS' | 'TICKETS' | 'SPONSORS' | 'CUSTOM';
interface Offer {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  percentage: number;
  scope: OfferScope;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive: boolean;
  hotelIds?: string[];
  ticketIds?: string[];
  sponsorTypeIds?: string[];
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

  // Offers
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);

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
            price: Number(r.price ?? 0),
            amenities: r.amenities ?? null,
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

    const fetchOffers = async () => {
      setOffersLoading(true);
      try {
        const r = await fetch('/api/admin/offers');
        if (!r.ok) {
          // don't block page load if offers fail
          console.warn('Failed to load offers', r.status);
          setOffers([]);
          return;
        }
        const data = await r.json();
        setOffers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Offers fetch error', err);
        setOffers([]);
      } finally {
        setOffersLoading(false);
      }
    };

    fetchRooms();
    fetchOffers();
  }, [eventId, hotelId]);

  // determine best offer percent for a given hotelId (checks validity and time windows)
  function getBestOfferPercentForHotel(hId: string): { percent: number | null; name?: string | null } {
    if (!offers || offers.length === 0) return { percent: null };

    const now = new Date();
    const applicable = offers.filter((o) => {
      if (!o.isActive) return false;
      if (o.startsAt && new Date(o.startsAt) > now) return false;
      if (o.endsAt && new Date(o.endsAt) < now) return false;

      if (o.scope === 'ALL') return true;
      if (o.scope === 'HOTELS') return true;
      if (o.scope === 'CUSTOM') {
        if (Array.isArray(o.hotelIds) && o.hotelIds.includes(hId)) return true;
      }
      return false;
    });

    if (applicable.length === 0) return { percent: null };
    const best = applicable.reduce((acc, cur) => (cur.percentage > acc.percentage ? cur : acc), applicable[0]);
    return { percent: best.percentage, name: best.name };
  }

  function formatPrice(n: number) {
    return n % 1 === 0 ? n.toLocaleString() : n.toFixed(2);
  }
  function getDiscountedPrice(original: number, percent?: number | null) {
    if (!percent || percent <= 0) return original;
    return Math.max(0, +(original * (1 - percent / 100)).toFixed(2));
  }

  const handleAdd = (room: RoomType) => {
    if ((room.availableRooms ?? 0) <= 0) {
      alert('This room type is sold out for the event.');
      return;
    }

    // compute best offer for this hotel
    const { percent } = getBestOfferPercentForHotel(hotel!.id);
    const effectivePrice = getDiscountedPrice(room.price, percent ?? null);

    addToCart({
      productId: hotel!.id,
      productType: 'HOTEL',
      name: `${hotel!.hotelName} - ${room.roomType}`,
      price: effectivePrice,
      // image: hotel!.image,
      roomTypeId: room.id,
    });
    alert(`Room added to cart at $${effectivePrice.toFixed(2)}${percent ? ` (saved ${percent}%)` : ''}!`);
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

        {offersLoading && (
          <div className="mb-4 text-sm text-slate-500">Loading offers…</div>
        )}

        {rooms.length === 0 ? (
          <p className="text-slate-500">No room types available for this hotel.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map(room => {
              const { percent, name: offerName } = getBestOfferPercentForHotel(room.hotelId);
              const discounted = percent && percent > 0;
              const newPrice = getDiscountedPrice(room.price, percent ?? null);

              return (
                <div key={room.id} className="relative p-4 border rounded-md flex items-center gap-4 bg-white">
                  {discounted && (
                    <div className="absolute -top-3 left-3 bg-red-600 text-white px-2 py-1 rounded-md text-sm font-bold flex items-center gap-1 shadow">
                      <Tag className="h-4 w-4" /> -{Math.round(percent!)}%
                    </div>
                  )}

                  <img src={room.image || '/placeholder.png'} className="w-24 h-20 object-cover rounded-md" />
                  <div className="flex-grow">
                    <p className="font-semibold text-slate-800">{room.roomType}</p>
                    <p className="text-sm text-slate-500">{room.amenities}</p>
                    <p className="text-sm mt-1">Available: <span className="font-medium">{room.availableRooms ?? 0}</span></p>
                  </div>
                  <div className="text-right">
                    {discounted ? (
                      <>
                        <div className="text-sm text-slate-500 line-through">${formatPrice(room.price)}</div>
                        <div className="font-bold text-indigo-600 text-lg">${formatPrice(newPrice)}</div>
                        {offerName && <div className="text-xs text-amber-600 mt-1">{offerName}</div>}
                      </>
                    ) : (
                      <div className="font-bold text-indigo-600 text-lg">${formatPrice(room.price)}</div>
                    )}

                    {(room.availableRooms ?? 0) > 0 ? (
                      <button onClick={() => handleAdd(room)} className="mt-2 bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700">Add</button>
                    ) : (
                      <span className="text-red-500 font-semibold mt-2 block">Sold out</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
