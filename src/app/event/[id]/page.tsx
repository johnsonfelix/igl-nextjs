'use client';

import { useEffect, useState, use } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, BedDouble, Briefcase, Building, Calendar, Clock, Hotel, Loader, MapPin, Ticket, Users, AlertTriangle, ShoppingCart, X, Trash2, Plus, Minus
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { CartProvider, useCart, CartItem } from './CartContext';
import { useAuth } from '@/app/context/AuthContext';

// --- TYPE DEFINITIONS ---
interface Booth {
  id: string;
  name: string;
  image: string | null;
  price: number;
  description: string | null;
  subTypes?: { id: string; name: string; price: number; isAvailable: boolean }[];
}
interface HotelData {
  id: string;
  hotelName: string;
  image: string | null;
  address: string;
  roomTypes: {
    id: string;
    roomType: string;
    price: number;
    amenities: string | null;
    eventRoomTypes: { quantity: number }[];
  }[];
}
interface EventTicket {
  ticket: {
    id: string;
    name: string;
    logo: string | null;
    price: number;
  };
  quantity: number;
}
interface SponsorType {
  sponsorType: {
    id: string;
    name: string;
    image: string | null;
    price: number;
  };
  quantity: number;
}
interface RoomType {
  id: string;
  hotelId: string;
  roomType: string;
  price: number;
  amenities: string | null;
  eventRoomTypes: { quantity: number }[];
}
interface AgendaItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
}
interface Venue {
  name: string;
  description: string;
  imageUrls: string[];
}
interface EventData {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  thumbnail: string;
  eventType: string;
  expectedAudience: string;
  description: string;
  booths: Booth[];
  hotels: HotelData[];
  eventTickets: EventTicket[];
  eventSponsorTypes: SponsorType[];
  agendaItems: AgendaItem[];
  venue: Venue | null;
  roomTypes: RoomType[];
}

// --- UI COMPONENTS ---
const InfoPill = ({ icon: Icon, text }: { icon: React.ElementType; text: string }) => (
  <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-md border border-white/20">
    <Icon className="h-5 w-5" />
    <span>{text}</span>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg">
    <h3 className="text-2xl font-bold text-slate-800 mb-6 pb-3 border-b-2 border-slate-100">{title}</h3>
    {children}
  </div>
);

const PriceCard = ({ item, productType, actionText = "Select" }: { item: { id: string; name: string; image: string | null; price: number; }, productType: CartItem['productType'], actionText?: string; }) => {
  const { addToCart } = useCart();
  const handleAddToCart = () => {
    addToCart({
      productId: item.id,
      productType,
      name: item.name,
      price: item.price,
      image: item.image || undefined,
    });
    alert(`${item.name} added to cart!`);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col">
      <div className="relative h-40 w-full bg-slate-100 rounded-t-lg">
        <img src={item.image || '/placeholder.png'} alt={item.name} className="w-full h-full object-cover rounded-t-lg" />
      </div>
      <div className="p-4 flex-grow">
        <h4 className="text-lg font-semibold text-slate-800">{item.name}</h4>
        <p className="text-2xl font-bold text-indigo-600 mt-2">${item.price.toLocaleString()}</p>
      </div>
      <div className="p-4 bg-slate-50 rounded-b-lg">
        <button onClick={handleAddToCart} className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
          {actionText} <ShoppingCart className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// --- Main Page Component Wrapper ---
export default function EventDetailPageWrapper({ params }: { params: Promise<{ id: string }> }) {
  return (
    <CartProvider>
      <EventDetailPage params={params} />
    </CartProvider>
  );
}

// --- MAIN PAGE COMPONENT ---
function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('About');
  const [isCartOpen, setCartOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<HotelData | null>(null);

  const { itemCount } = useCart();

  useEffect(() => {
    const fetchEventData = async () => {
      if (!resolvedParams.id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/events/${resolvedParams.id}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error('Event not found.');
          throw new Error(`API responded with status ${res.status}`);
        }
        const currentEvent: EventData = await res.json();
        setEventData(currentEvent);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchEventData();
  }, [resolvedParams.id]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader className="h-16 w-16 animate-spin text-indigo-600" /></div>;
  if (error) return <div className="flex flex-col h-screen items-center justify-center bg-red-50 p-4"><div className="rounded-lg bg-white p-8 text-center shadow-md border border-red-200"><AlertTriangle className="h-12 w-12 mx-auto text-red-500" /><h2 className="mt-4 text-2xl font-bold text-red-700">Error Loading Event</h2><p className="mt-2 text-red-600">{error}</p><Link href="/events" className="mt-6 inline-flex items-center gap-2 rounded-md bg-red-600 px-6 py-2 text-white hover:bg-red-700"><ArrowLeft className="h-4 w-4"/> Go Back to Events</Link></div></div>;
  if (!eventData) notFound();

  const { name, startDate, endDate, location, expectedAudience, thumbnail, description, venue, agendaItems, eventTickets, booths, eventSponsorTypes, hotels } = eventData;
  const tabs = ['About', 'Agenda', 'Tickets & Booths', 'Sponsors', 'Accommodation'];
  
  const renderContent = () => {
    switch (activeTab) {
      case 'About': return ( <Section title="About The Event"><p className="text-slate-600 leading-relaxed mb-8">{description}</p>{venue ? ( <> <h4 className="text-xl font-bold text-slate-800 mb-4">Venue: {venue.name}</h4><p className="text-slate-600 leading-relaxed mb-6">{venue.description}</p><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{venue.imageUrls.map((url, i) => <img key={i} src={url} alt={`Venue Image ${i+1}`} className="rounded-lg object-cover w-full h-auto" />)}</div></> ) : <p className="text-slate-500">Venue details are not available for this event.</p>}</Section> );
      case 'Agenda': return ( <Section title="Event Agenda">{agendaItems.length > 0 ? ( <div className="space-y-6">{agendaItems.map(item => ( <div key={item.id} className="flex gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200"><div className="flex flex-col items-center text-indigo-600 font-semibold pt-1"><span className="text-2xl">{format(parseISO(item.date), 'dd')}</span><span>{format(parseISO(item.date), 'MMM')}</span></div><div className="border-l-2 border-indigo-200 pl-4"><p className="font-bold text-lg text-slate-800">{item.title}</p><p className="text-sm text-slate-500 my-1">{format(parseISO(item.startTime), 'h:mm a')} - {format(parseISO(item.endTime), 'h:mm a')}</p><p className="text-slate-600">{item.description}</p></div></div> ))}</div> ) : <p className="text-slate-500">The agenda has not been published yet.</p>}</Section> );
      case 'Tickets & Booths': return ( <div className="space-y-8"><Section title="Event Tickets"><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{eventTickets.map(({ ticket }) => <PriceCard key={ticket.id} item={{...ticket, image: ticket.logo}} productType='TICKET' actionText="Buy Ticket" />)}</div></Section><Section title="Exhibition Booths"><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{booths.map(booth => <PriceCard key={booth.id} item={booth} productType='BOOTH' actionText="Book Booth" />)}</div></Section></div> );
      case 'Sponsors': return ( <Section title="Sponsorship Opportunities"><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{eventSponsorTypes.map(({ sponsorType }) => <PriceCard key={sponsorType.id} item={{...sponsorType}} productType='SPONSOR' actionText="Sponsor" />)}</div></Section> );
      case 'Accommodation': return (
        <Section title="Official Hotels & Rooms">
          {hotels.length > 0 ? (
            <div className="space-y-8">
              {hotels.map(hotel => (
                <div key={hotel.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-white">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <img src={hotel.image || '/placeholder.png'} alt={hotel.hotelName} className="w-full sm:w-48 h-40 sm:h-32 rounded-md object-cover" />
                    <div className="flex-grow">
                      <h4 className="text-xl font-bold flex items-center gap-2"><Hotel className="h-5 w-5 text-indigo-600" /> {hotel.hotelName}</h4>
                      <p className="text-slate-500 flex items-center gap-2 mt-1"><MapPin className="h-4 w-4" /> {hotel.address}</p>
                    </div>
                    <button onClick={() => setSelectedHotel(hotel)} className="bg-indigo-100 text-indigo-700 font-semibold py-2 px-4 rounded-md hover:bg-indigo-200 transition-colors self-start sm:self-center w-full sm:w-auto">View Rooms</button>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-slate-500">Official hotel information is not available.</p>}
        </Section>
      );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative h-[50vh] w-full">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-cyan-800" />
        <img src={thumbnail} alt={name} className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12 text-white bg-gradient-to-t from-black/70 to-transparent">
          <Link href="/event/list" className="absolute top-8 left-8 flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full transition-colors"><ArrowLeft className="h-5 w-5"/>Back to Events</Link>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 drop-shadow-xl">{name}</h1>
          <div className="flex flex-wrap gap-4">
            <InfoPill icon={Calendar} text={`${format(parseISO(startDate), 'MMM dd')} - ${format(parseISO(endDate), 'MMM dd, yyyy')}`} />
            <InfoPill icon={MapPin} text={location} />
            <InfoPill icon={Users} text={`${expectedAudience} Attendees`} />
          </div>
        </div>
      </div>
      <main className="container mx-auto p-4 md:p-8 -mt-20 relative">
        <div className="bg-white/70 backdrop-blur-md rounded-lg shadow-lg p-2 flex items-center justify-start space-x-2 overflow-x-auto mb-8 border border-slate-200/80">
          {tabs.map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition-colors ${ activeTab === tab ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100' }`}>{tab}</button>))}
        </div>
        {renderContent()}
      </main>
      <button onClick={() => setCartOpen(true)} className="fixed bottom-8 right-8 bg-indigo-600 text-white rounded-full shadow-lg p-4 hover:bg-indigo-700 transition-transform hover:scale-105 flex items-center gap-2">
        <ShoppingCart className="h-6 w-6" />
        {itemCount > 0 && <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold">{itemCount}</span>}
      </button>
      <CartSheet isOpen={isCartOpen} onClose={() => setCartOpen(false)} eventId={eventData.id} />
      {selectedHotel && <HotelRoomsModal hotel={selectedHotel} onClose={() => setSelectedHotel(null)} />}
    </div>
  );
}

// --- Hotel Rooms Modal Component ---
const HotelRoomsModal = ({ hotel, onClose }: { hotel: HotelData, onClose: () => void }) => {
    const { addToCart } = useCart();
    const handleAddRoom = (room: HotelData['roomTypes'][0]) => {
        addToCart({
            productId: hotel.id,
            productType: 'HOTEL',
            name: `${hotel.hotelName} - ${room.roomType}`,
            price: room.price,
            image: hotel.image,
            roomTypeId: room.id
        });
        alert('Room added to cart!');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800">Room Types at {hotel.hotelName}</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><X className="h-6 w-6" /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {hotel.roomTypes.length > 0 ? (
                        <div className="space-y-4">
                            {hotel.roomTypes.map(room => {
                                const available = room.eventRoomTypes[0]?.quantity ?? 0;
                                return (
                                <div key={room.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-200">
                                    <div>
                                        <p className="font-semibold text-slate-800">{room.roomType}</p>
                                        <p className="text-xs text-slate-500">{room.amenities}</p>
                                        <p className="text-sm font-medium text-slate-700 mt-1">Available: {available}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-indigo-600 text-lg">${room.price}</p>
                                        {available > 0 ? (
                                            <button onClick={() => handleAddRoom(room)} className="text-sm bg-indigo-600 text-white px-3 py-1 rounded-md mt-1 hover:bg-indigo-700">Add</button>
                                        ) : ( <p className="text-sm text-red-500 font-semibold">Sold Out</p> )}
                                    </div>
                                </div>
                            )})}
                        </div>
                    ) : <p>No room types available for this event.</p>}
                </div>
            </div>
        </div>
    );
};

// --- Cart Sheet Component ---
const CartSheet = ({ isOpen, onClose, eventId }: { isOpen: boolean, onClose: () => void, eventId: string }) => {
    const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
    const [isCheckingOut, setCheckingOut] = useState(false);
    const { user } = useAuth();
    const companyId = user?.companyId;

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handleCheckout = async () => {
        if (!companyId) {
            alert('You must be logged in to check out.');
            return;
        }
        if (cart.length === 0) return;
        setCheckingOut(true);
        try {
            const response = await fetch(`/api/events/${eventId}/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyId: companyId, cartItems: cart }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Checkout failed');
            }
            alert('Checkout successful!');
            clearCart();
            onClose();
        } catch (err) {
            alert(`Error: ${err instanceof Error ? err.message : 'An unknown error occurred'}`);
        } finally {
            setCheckingOut(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose}>
            <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-slate-800">Your Cart</h2>
                    <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800"><X className="h-6 w-6"/></button>
                </div>
                
                {cart.length === 0 ? (
                    <div className="flex-grow flex items-center justify-center text-slate-500">Your cart is empty.</div>
                ) : (
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        {cart.map(item => (
                            <div key={`${item.productId}-${item.roomTypeId || ''}`} className="flex gap-4">
                                <img src={item.image || '/placeholder.png'} alt={item.name} className="w-16 h-16 rounded-md object-cover border" />
                                <div className="flex-grow">
                                    <p className="font-semibold text-slate-700">{item.name}</p>
                                    <p className="text-sm text-slate-500">${item.price.toFixed(2)}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <button onClick={() => updateQuantity(item.productId, item.quantity - 1, item.roomTypeId)} className="p-1 rounded-full bg-slate-200 hover:bg-slate-300"><Minus className="h-4 w-4" /></button>
                                        <span className="font-semibold w-4 text-center">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.productId, item.quantity + 1, item.roomTypeId)} className="p-1 rounded-full bg-slate-200 hover:bg-slate-300"><Plus className="h-4 w-4" /></button>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-slate-800">${(item.price * item.quantity).toFixed(2)}</p>
                                    <button onClick={() => removeFromCart(item.productId, item.roomTypeId)} className="text-red-500 hover:text-red-700 mt-2"><Trash2 className="h-5 w-5"/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                <div className="p-4 border-t bg-slate-50">
                    <div className="flex justify-between items-center font-bold text-lg mb-4 text-slate-800">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                    <button onClick={handleCheckout} disabled={cart.length === 0 || isCheckingOut || !companyId} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-md hover:bg-indigo-700 disabled:bg-slate-400 flex items-center justify-center transition-colors">
                        {isCheckingOut ? <Loader className="animate-spin h-6 w-6"/> : 'Proceed to Checkout'}
                    </button>
                    {!companyId && <p className="text-xs text-center text-red-600 mt-2">Please log in to check out.</p>}
                </div>
            </div>
        </div>
    );
};
