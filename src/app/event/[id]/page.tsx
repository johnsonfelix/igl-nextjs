"use client";

import { useEffect, useState, use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Hotel,
  Loader,
  MapPin,
  Calendar,
  Users,
  AlertTriangle,
  ShoppingCart,
  X,
  Trash2,
  Plus,
  Minus,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useCart, CartItem } from "./CartContext";
import { useAuth } from "@/app/context/AuthContext";
import toast from "react-hot-toast";

// --- TYPE DEFINITIONS ---

interface BoothSubType {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  type?: string | null; // "BOOTH_NUMBER" | "TIME_SLOT" | "CUSTOM"
  slotStart?: string | null;
  slotEnd?: string | null;
  isAvailable: boolean;
}

interface Booth {
  id: string;
  name: string;
  image: string | null;
  price: number;
  description: string | null;
  subTypes?: BoothSubType[];
  quantity?: number; // optional, when derived from eventBooths
}

interface EventBoothJoin {
  eventId: string;
  boothId: string;
  quantity: number;
  booth: Booth;
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

  // old shape
  booths?: Booth[];
  // new shape with join table
  eventBooths?: EventBoothJoin[];

  hotels?: HotelData[];
  eventTickets?: EventTicket[];
  eventSponsorTypes?: SponsorType[];
  agendaItems?: AgendaItem[];
  venue?: Venue | null;
  roomTypes?: RoomType[];
}

// Offer shape (matches your API / earlier backend)
interface Offer {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  percentage: number;
  scope:
  | "ALL"
  | "HOTELS"
  | "TICKETS"
  | "SPONSORS"
  | "BOOTHS"
  | "CUSTOM";
  startsAt?: string | null;
  endsAt?: string | null;
  isActive: boolean;
  hotelIds?: string[];
  ticketIds?: string[];
  sponsorTypeIds?: string[];
  boothIds?: string[]; // booths support
}

// --- UI COMPONENTS ---

const InfoPill = ({
  icon: Icon,
  text,
}: {
  icon: React.ElementType;
  text: string;
}) => (
  <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-md border border-white/20">
    <Icon className="h-5 w-5" />
    <span>{text}</span>
  </div>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg">
    <h3 className="text-2xl font-bold text-slate-800 mb-6 pb-3 border-b-2 border-slate-100">
      {title}
    </h3>
    {children}
  </div>
);

// Small badge component for discount
const DiscountBadge = ({
  pct,
  title,
}: {
  pct: number;
  title?: string;
}) => (
  <div
    title={title}
    className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 rounded-md text-sm font-bold shadow"
  >
    -{Math.round(pct)}%
  </div>
);

// price helpers
function formatPrice(n: number) {
  return n % 1 === 0 ? n.toLocaleString() : n.toFixed(2);
}
function getDiscountedPrice(original: number, percent?: number | null) {
  if (!percent || percent <= 0) return original;
  return Math.max(0, +(original * (1 - percent / 100)).toFixed(2));
}

// --- Redesigned PriceCard with IGLA Theme ---
const PriceCard = ({
  item,
  productType,
  actionText = "Select",
  offerPercent,
  offerName,
}: {
  item: { id: string; name: string; image: string | null; price: number };
  productType: CartItem["productType"];
  actionText?: string;
  offerPercent?: number | null;
  offerName?: string | null;
}) => {
  const { addToCart } = useCart();
  const handleAddToCart = () => {
    const effectivePrice = getDiscountedPrice(item.price, offerPercent);
    addToCart({
      productId: item.id,
      productType,
      name: item.name,
      price: effectivePrice,
      image: item.image || undefined,
    });
    toast.success(`${item.name} added to cart!`);
  };

  const discounted = !!offerPercent && offerPercent > 0;
  const newPrice = getDiscountedPrice(item.price, offerPercent);

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full relative">
      {discounted && (
        <div className="absolute top-3 right-3 z-10 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          {Math.round(offerPercent!)}% OFF
        </div>
      )}
      <div className="relative h-48 w-full overflow-hidden">
        <img
          src={item.image || "/placeholder.png"}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
      </div>

      <div className="p-5 flex-grow flex flex-col">
        <h4 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-[#5da765] transition-colors">{item.name}</h4>

        <div className="mt-auto pt-4 border-t border-gray-100">
          {discounted ? (
            <div className="flex items-end gap-2 mb-4">
              <span className="text-2xl font-bold text-[#5da765]">${formatPrice(newPrice)}</span>
              <span className="text-sm text-gray-400 line-through mb-1">${item.price.toLocaleString()}</span>
            </div>
          ) : (
            <div className="text-2xl font-bold text-[#5da765] mb-4">${item.price.toLocaleString()}</div>
          )}

          <button
            onClick={handleAddToCart}
            className="w-full bg-white border-2 border-[#5da765] text-[#5da765] font-bold py-2 rounded-lg hover:bg-[#5da765] hover:text-white transition-all flex items-center justify-center gap-2"
          >
            {actionText} <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const BoothCard = ({
  booth,
  offerPercent,
  offerName,
  onBook,
}: {
  booth: Booth;
  offerPercent?: number | null;
  offerName?: string | null;
  onBook: () => void;
}) => {
  const discounted = !!offerPercent && offerPercent > 0;
  const newPrice = getDiscountedPrice(booth.price, offerPercent);

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full relative">
      {discounted && (
        <div className="absolute top-3 right-3 z-10 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          {Math.round(offerPercent!)}% OFF
        </div>
      )}
      <div className="relative h-48 w-full overflow-hidden">
        <img
          src={booth.image || "/placeholder.png"}
          alt={booth.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      </div>
      <div className="p-5 flex-grow flex flex-col">
        <h4 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-[#5da765] transition-colors">{booth.name}</h4>
        {booth.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-4">
            {booth.description}
          </p>
        )}

        <div className="mt-auto pt-4 border-t border-gray-100">
          {discounted ? (
            <div className="flex items-end gap-2 mb-4">
              <span className="text-2xl font-bold text-[#5da765]">${formatPrice(newPrice)}</span>
              <span className="text-sm text-gray-400 line-through mb-1">${booth.price.toLocaleString()}</span>
            </div>
          ) : (
            <div className="text-2xl font-bold text-[#5da765] mb-4">${booth.price.toLocaleString()}</div>
          )}

          <button
            onClick={onBook}
            className="w-full bg-[#5da765] text-white font-bold py-2 rounded-lg hover:bg-[#4a8a52] transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            Book Booth <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Page Component Wrapper (Next.js route) ---
export default function EventDetailPageWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <EventDetailPage params={params} />;
}

// --- MAIN PAGE COMPONENT ---
function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  const { itemCount, addToCart } = useCart();
  const { user } = useAuth();
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("About");
  const [isCartOpen, setCartOpen] = useState(false);

  // Offers loaded from backend
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);

  // Booth subtype modal state
  const [boothModalOpen, setBoothModalOpen] = useState(false);
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [boothSubtypes, setBoothSubtypes] = useState<BoothSubType[]>([]);
  const [boothSubtypesLoading, setBoothSubtypesLoading] = useState(false);
  const [boothSubtypesError, setBoothSubtypesError] = useState<string | null>(
    null
  );
  const [selectedSubtypeId, setSelectedSubtypeId] = useState<string | null>(
    null
  );
  const [boothOffer, setBoothOffer] = useState<{
    percent: number | null;
    name?: string | null;
  }>({ percent: null });

  // Hotel expansion state
  const [expandedHotelId, setExpandedHotelId] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventData = async () => {
      if (!resolvedParams.id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/events/${resolvedParams.id}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Event not found.");
          throw new Error(`API responded with status ${res.status}`);
        }
        const currentEvent: EventData = await res.json();
        setEventData(currentEvent);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    const fetchOffers = async () => {
      setOffersLoading(true);
      try {
        const r = await fetch("/api/admin/offers");
        if (!r.ok) {
          console.warn("Unable to load offers:", r.status);
          setOffers([]);
          return;
        }
        let data: Offer[] = await r.json();

        // --- INJECT MEMBERSHIP DISCOUNT ---
        if (user?.companyId) {
          try {
            const compRes = await fetch(`/api/companies/${user.companyId}`);
            if (compRes.ok) {
              const compData = await compRes.json();
              const discount = compData.membershipPlan?.discountPercentage;
              if (discount && discount > 0) {
                // Create a "Membership Discount" offer that applies to everything
                const membershipOffer: Offer = {
                  id: "membership-discount",
                  name: `Membership Discount (${discount}%)`,
                  percentage: discount,
                  scope: "ALL",
                  isActive: true,
                  description: "Exclusive discount for your membership level",
                };
                // Add it to the list. logic below picks best offer, so if this is higher it wins.
                data = [...data, membershipOffer];
              }
            }
          } catch (e) {
            console.error("Failed to fetch membership discount", e);
          }
        }

        setOffers(data || []);
      } catch (err) {
        console.error("Failed to load offers", err);
        setOffers([]);
      } finally {
        setOffersLoading(false);
      }
    };

    fetchEventData();
    fetchOffers();
  }, [resolvedParams.id, user?.companyId]);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader className="h-16 w-16 animate-spin text-[#5da765]" />
      </div>
    );
  if (error)
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-red-50 p-4">
        <div className="rounded-lg bg-white p-8 text-center shadow-md border border-red-200">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-500" />
          <h2 className="mt-4 text-2xl font-bold text-red-700">
            Error Loading Event
          </h2>
          <p className="mt-2 text-red-600">{error}</p>
          <Link
            href="/event/list"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-red-600 px-6 py-2 text-white hover:bg-red-700"
          >
            <ArrowLeft className="h-4 w-4" /> Go Back to Events
          </Link>
        </div>
      </div>
    );
  if (!eventData) notFound();

  const {
    id,
    name,
    startDate,
    endDate,
    location,
    expectedAudience,
    thumbnail,
    description,
  } = eventData;

  const venue = eventData.venue ?? null;
  const agendaItems = eventData.agendaItems ?? [];
  const eventTickets = eventData.eventTickets ?? [];
  const eventSponsorTypes = eventData.eventSponsorTypes ?? [];
  const hotels = eventData.hotels ?? [];

  // booths can come as legacy or via join table
  const boothsList: Booth[] =
    eventData.eventBooths && Array.isArray(eventData.eventBooths)
      ? eventData.eventBooths
        .filter((eb) => eb.booth)
        .map((eb) => ({
          ...eb.booth,
          quantity: eb.quantity,
        }))
      : eventData.booths ?? [];

  const tabs = ["About", "Agenda", "Tickets & Booths", "Sponsors", "Accommodation"];

  // Helper: determine best applicable offer for a product
  function getBestOfferForItem(
    productType: CartItem["productType"],
    productId: string
  ): { percent: number | null; name?: string | null } {
    if (!offers || offers.length === 0) return { percent: null };

    const now = new Date();
    const applicable: Offer[] = offers.filter((o) => {
      if (!o.isActive) return false;
      if (o.startsAt && new Date(o.startsAt) > now) return false;
      if (o.endsAt && new Date(o.endsAt) < now) return false;

      if (o.scope === "ALL") return true;
      if (productType === "TICKET" && o.scope === "TICKETS") return true;
      if (productType === "HOTEL" && o.scope === "HOTELS") return true;
      if (productType === "SPONSOR" && o.scope === "SPONSORS") return true;
      if (productType === "BOOTH" && o.scope === "BOOTHS") return true;

      if (o.scope === "CUSTOM") {
        if (
          productType === "TICKET" &&
          Array.isArray(o.ticketIds) &&
          o.ticketIds.includes(productId)
        )
          return true;
        if (
          productType === "HOTEL" &&
          Array.isArray(o.hotelIds) &&
          o.hotelIds.includes(productId)
        )
          return true;
        if (
          productType === "SPONSOR" &&
          Array.isArray(o.sponsorTypeIds) &&
          o.sponsorTypeIds.includes(productId)
        )
          return true;
        if (
          productType === "BOOTH" &&
          Array.isArray(o.boothIds) &&
          o.boothIds.includes(productId)
        )
          return true;
      }
      return false;
    });

    if (applicable.length === 0) return { percent: null };
    const best = applicable.reduce((acc, cur) =>
      cur.percentage > acc.percentage ? cur : acc
    );
    return { percent: best.percentage, name: best.name };
  }

  // --- Booth subtype modal behaviour ---

  const fetchBoothSubtypes = async (boothId: string) => {
    setBoothSubtypesLoading(true);
    setBoothSubtypesError(null);
    try {
      const res = await fetch(
        `/api/admin/booth-subtypes?boothId=${boothId}&eventId=${id}`
      );
      if (!res.ok) throw new Error("Failed to load booth options");
      const data: BoothSubType[] = await res.json();
      setBoothSubtypes(data);
      const firstAvailable =
        data.find((st) => st.isAvailable) ?? (data.length > 0 ? data[0] : null);
      setSelectedSubtypeId(firstAvailable ? firstAvailable.id : null);
    } catch (err) {
      setBoothSubtypesError(
        err instanceof Error ? err.message : "Failed to load booth options"
      );
      setBoothSubtypes([]);
      setSelectedSubtypeId(null);
    } finally {
      setBoothSubtypesLoading(false);
    }
  };

  const openBoothModal = (booth: Booth) => {
    setSelectedBooth(booth);
    setBoothModalOpen(true);
    const offer = getBestOfferForItem("BOOTH", booth.id);
    setBoothOffer(offer);
    fetchBoothSubtypes(booth.id);
  };

  const closeBoothModal = () => {
    setBoothModalOpen(false);
    setSelectedBooth(null);
    setBoothSubtypes([]);
    setBoothSubtypesError(null);
    setSelectedSubtypeId(null);
  };

  const handleConfirmBoothSubtype = () => {
    if (!selectedBooth || !selectedSubtypeId) {
      toast.error("Please select a booth option.");
      return;
    }
    const subtype = boothSubtypes.find((st) => st.id === selectedSubtypeId);
    if (!subtype) {
      toast.error("Invalid booth option selected.");
      return;
    }

    const basePrice = subtype.price;
    const finalPrice = getDiscountedPrice(basePrice, boothOffer.percent);

    // NOTE: make sure CartItem type (and checkout API) support boothSubTypeId
    addToCart({
      productId: selectedBooth.id,
      productType: "BOOTH",
      name: `${selectedBooth.name} - ${subtype.name}`,
      price: finalPrice,
      image: selectedBooth.image || undefined,
      // @ts-ignore if your CartItem doesn't have this yet
      boothSubTypeId: subtype.id,
      boothSubTypeName: subtype.name,
    });

    toast.success("Booth added to cart!");
    closeBoothModal();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* --- HERO SECTION --- */}
      <div className="relative h-[400px] w-full overflow-hidden">
        <img
          src={thumbnail || "/images/bg-2.jpg"}
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#5da765]/80 mix-blend-multiply"></div>
        <div className="absolute inset-0 flex flex-col justify-center px-4 md:px-12 max-w-7xl mx-auto">
          <Link href="/event/list" className="text-white/80 hover:text-white flex items-center gap-2 mb-4 font-medium transition-colors w-fit">
            <ArrowLeft className="h-4 w-4" /> Back to Events
          </Link>
          <div className="bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full w-fit mb-4 border border-white/30 text-white text-xs font-bold uppercase tracking-wider">
            {eventData.eventType} Event
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 leading-tight">{name}</h1>
          <p className="text-white/90 text-xl font-light flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {format(parseISO(startDate), "MMMM d, yyyy")}
          </p>
        </div>
      </div>

      {/* --- CONTENT LAYOUT --- */}
      <div className="max-w-7xl mx-auto px-4 py-12 -mt-20 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT COLUMN: TABS & CONTENT */}
        <div className="lg:col-span-2 space-y-8">
          {/* Tabs Navigation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 flex overflow-x-auto gap-2">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${activeTab === tab
                  ? 'bg-[#5da765] text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-[#5da765]'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-[500px]">
            {activeTab === "About" && (
              <div className="animate-fadeIn">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">About the Event</h2>
                <div className="prose prose-lg text-gray-600 max-w-none">
                  <p>{description}</p>
                </div>
              </div>
            )}

            {activeTab === "Agenda" && (
              <div className="animate-fadeIn space-y-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Event Schedule</h2>
                {agendaItems.length > 0 ? (
                  Object.entries(
                    agendaItems.reduce((acc, item) => {
                      const dateKey = item.date.split('T')[0];
                      if (!acc[dateKey]) acc[dateKey] = [];
                      acc[dateKey].push(item);
                      return acc;
                    }, {} as Record<string, typeof agendaItems>)
                  )
                    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                    .map(([date, items]) => (
                      <div key={date} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                          <div className="bg-[#5da765] text-white rounded-lg p-2 shadow-sm">
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">
                              {format(parseISO(date), "EEEE, MMMM d, yyyy")}
                            </h3>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                              Day {Math.ceil((new Date(date).getTime() - new Date(agendaItems[0].date).getTime()) / (1000 * 60 * 60 * 24)) + 1}
                            </p>
                          </div>
                        </div>
                        <div className="divide-y divide-gray-100">
                          {items
                            .sort((a, b) => a.startTime.localeCompare(b.startTime))
                            .map((item) => (
                              <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row gap-6">
                                <div className="min-w-[140px] flex-shrink-0">
                                  <div className="inline-flex items-center justify-center bg-green-50 text-[#5da765] px-3 py-1.5 rounded-lg text-sm font-bold border border-green-100">
                                    {format(parseISO(item.startTime), "h:mm a")} - {format(parseISO(item.endTime), "h:mm a")}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h4>
                                  <p className="text-gray-600 leading-relaxed text-sm">{item.description}</p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed text-gray-500">
                    No agenda items published yet.
                  </div>
                )}
              </div>
            )}

            {activeTab === "Tickets & Booths" && (
              <div className="animate-fadeIn space-y-12">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span className="bg-[#5da765] w-2 h-8 rounded-full"></span>
                    Event Tickets
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {eventTickets.map(({ ticket }) => {
                      const best = getBestOfferForItem("TICKET", ticket.id);
                      return <PriceCard key={ticket.id} item={{ ...ticket, image: ticket.logo }} productType="TICKET" actionText="Buy Ticket" offerPercent={best.percent ?? undefined} offerName={best.name} />
                    })}
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span className="bg-[#5da765] w-2 h-8 rounded-full"></span>
                    Exhibition Booths
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {boothsList.map((booth) => {
                      const best = getBestOfferForItem("BOOTH", booth.id);
                      return <BoothCard key={booth.id} booth={booth} offerPercent={best.percent ?? undefined} offerName={best.name} onBook={() => openBoothModal(booth)} />
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Sponsors" && (
              <div className="animate-fadeIn">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Sponsorship Opportunities</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {eventSponsorTypes.map(({ sponsorType }) => {
                    const best = getBestOfferForItem("SPONSOR", sponsorType.id);
                    return <PriceCard key={sponsorType.id} item={{ ...sponsorType }} productType="SPONSOR" actionText="Become Sponsor" offerPercent={best.percent ?? undefined} offerName={best.name} />
                  })}
                </div>
              </div>
            )}

            {activeTab === "Accommodation" && (
              <div className="animate-fadeIn">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Official Hotels</h2>
                {hotels.length > 0 ? (
                  <div className="space-y-6">
                    {hotels.map((hotel) => {
                      const isExpanded = expandedHotelId === hotel.id;
                      return (
                        <div key={hotel.id} className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-shadow bg-white">
                          <div
                            className="flex flex-col md:flex-row cursor-pointer"
                            onClick={() => setExpandedHotelId(isExpanded ? null : hotel.id)}
                          >
                            <div className="md:w-1/3 h-48 md:h-auto relative">
                              <img src={hotel.image || "/placeholder.png"} className="absolute inset-0 w-full h-full object-cover" />
                            </div>
                            <div className="p-6 md:w-2/3 flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-start">
                                  <h3 className="text-xl font-bold text-gray-800 mb-1">{hotel.hotelName}</h3>
                                  <div className="bg-gray-100 rounded-full p-2">
                                    {isExpanded ? <Minus className="h-4 w-4 text-gray-600" /> : <Plus className="h-4 w-4 text-gray-600" />}
                                  </div>
                                </div>
                                <p className="text-gray-500 text-sm flex items-center gap-1 mb-2"><MapPin className="h-4 w-4" /> {hotel.address}</p>
                                <p className="text-sm text-[#5da765] font-medium">{hotel.roomTypes.length} Room Types Available</p>
                              </div>
                            </div>
                          </div>

                          {/* Expanded content (Rooms) */}
                          {isExpanded && (
                            <div className="p-6 pt-0 border-t border-gray-100 bg-gray-50/50">
                              <div className="mt-4 mb-2">
                                <h4 className="font-bold text-gray-700 mb-3">Select a Room</h4>
                                <div className="space-y-3">
                                  {hotel.roomTypes.map((rt) => (
                                    <div key={rt.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between gap-4">
                                      <div className="flex-grow">
                                        <div className="flex justify-between items-start mb-1">
                                          <p className="font-bold text-gray-800 text-lg">{rt.roomType}</p>
                                          {/* Price displayed prominently on mobile, or right side on desktop */}
                                          <p className="font-bold text-[#5da765] sm:hidden text-lg">${rt.price}</p>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-2">{rt.amenities || "Standard amenities included."}</p>
                                        <div className="flex flex-wrap gap-2">
                                          {rt.amenities?.split(',').map((amenity, idx) => (
                                            <span key={idx} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full uppercase tracking-wide">{amenity.trim()}</span>
                                          ))}
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end justify-center min-w-[120px] border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-4 mt-2 sm:mt-0">
                                        <p className="font-bold text-[#5da765] text-xl hidden sm:block mb-2">${rt.price}</p>
                                        <button onClick={(e) => {
                                          e.stopPropagation();
                                          addToCart({
                                            productId: hotel.id,
                                            roomTypeId: rt.id,
                                            productType: "HOTEL",
                                            name: `${hotel.hotelName} - ${rt.roomType}`,
                                            price: rt.price,
                                            image: hotel.image || undefined
                                          });
                                          toast.success("Room added to cart!");
                                        }} className="w-full sm:w-auto bg-[#5da765] text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#4a8a52] transition-colors shadow-sm flex items-center justify-center gap-2">
                                          Add Room <ShoppingCart className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : <p className="text-gray-500 italic">No accommodation details available.</p>}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: SIDEBAR */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-[100px]">
            <h3 className="text-lg font-bold text-gray-800 mb-6 pb-4 border-b">Event Details</h3>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-[#5da765]">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Date & Time</p>
                  <p className="font-bold text-gray-800">{format(parseISO(startDate), "MMM d, yyyy")} - {format(parseISO(endDate), "MMM d, yyyy")}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Location</p>
                  <p className="font-bold text-gray-800">{location}</p>
                  {venue && <p className="text-xs text-gray-500 mt-1">{venue.name}</p>}
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Expected Audience</p>
                  <p className="font-bold text-gray-800">{expectedAudience} Attendees</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <button className="w-full bg-[#5da765] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#4a8a52] transition-colors flex items-center justify-center gap-2" onClick={() => setActiveTab("Tickets & Booths")}>
                Register Now <ArrowRight className="h-5 w-5" />
              </button>
              <p className="text-center text-xs text-gray-400 mt-3">Secure your spot today.</p>
            </div>
          </div>
        </div>

      </div>

      {/* --- CART FLOATING BUTTON --- */}


      {/* --- BOOTH MODAL --- */}
      {boothModalOpen && selectedBooth && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-scaleIn">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">Select Booth Type</h3>
              <button onClick={closeBoothModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex gap-4 mb-6">
                {selectedBooth.image && <img src={selectedBooth.image} className="w-20 h-20 rounded-lg object-cover bg-gray-100" />}
                <div>
                  <h4 className="font-bold text-lg">{selectedBooth.name}</h4>
                  <p className="text-sm text-gray-500">{selectedBooth.description}</p>
                </div>
              </div>

              {boothSubtypesLoading ? (
                <div className="py-8 flex justify-center"><Loader className="animate-spin text-[#5da765]" /></div>
              ) : boothSubtypesError ? (
                <p className="text-red-500 text-center">{boothSubtypesError}</p>
              ) : (
                <div className="space-y-3">
                  {boothSubtypes.map((st) => {
                    const finalPrice = getDiscountedPrice(st.price, boothOffer.percent);
                    const isSelected = selectedSubtypeId === st.id;
                    return (
                      <div
                        key={st.id}
                        onClick={() => st.isAvailable && setSelectedSubtypeId(st.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center ${isSelected ? 'border-[#5da765] bg-green-50' : 'border-gray-100 hover:border-gray-200'
                          } ${!st.isAvailable ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <div>
                          <p className="font-bold text-gray-800">{st.name}</p>
                          {st.description && <p className="text-xs text-gray-500">{st.description}</p>}
                          {st.slotStart && st.slotEnd && (
                            <p className="text-xs text-[#5da765] mt-1 font-medium bg-green-50 w-fit px-2 py-0.5 rounded">
                              {format(new Date(st.slotStart), "MMM d, h:mm a")} - {format(new Date(st.slotEnd), "h:mm a")}
                            </p>
                          )}
                          {!st.isAvailable && <span className="text-xs font-bold text-red-500">Sold Out</span>}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#5da765]">${finalPrice.toLocaleString()}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={closeBoothModal} className="px-6 py-2 rounded-lg font-bold text-gray-600 hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleConfirmBoothSubtype} className="px-6 py-2 rounded-lg font-bold bg-[#5da765] text-white hover:bg-[#4a8a52] transition-colors shadow-md">Confirm Booking</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// --- CartSheet Component ---
const CartSheet = ({
  isOpen,
  onClose,
  eventId,
}: {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
}) => {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const [isCheckingOut, setCheckingOut] = useState(false);
  const { user } = useAuth();
  const companyId = user?.companyId;

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleCheckout = async () => {
    if (!companyId) {
      toast.error("You must be logged in to check out.");
      return;
    }
    if (cart.length === 0) return;
    setCheckingOut(true);
    try {
      const response = await fetch(`/api/events/${eventId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: companyId, cartItems: cart }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Checkout failed");
      }
      toast.success("Checkout successful!");
      clearCart();
      onClose();
    } catch (err) {
      toast.error(
        `Error: ${err instanceof Error ? err.message : "An unknown error occurred"
        }`
      );
    } finally {
      setCheckingOut(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose}>
      <div
        className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-slate-800">Your Cart</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-800"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex-grow flex items-center justify-center text-slate-500">
            Your cart is empty.
          </div>
        ) : (
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {cart.map((item) => (
              <div
                key={`${item.productId}-${item.roomTypeId || ""}-${(item as any).boothSubTypeId || ""}`}
                className="flex gap-4"
              >
                <img
                  src={item.image || "/placeholder.png"}
                  alt={item.name}
                  className="w-16 h-16 rounded-md object-cover border"
                />
                <div className="flex-grow">
                  <p className="font-semibold text-slate-700">{item.name}</p>
                  <p className="text-sm text-slate-500">
                    ${item.price.toFixed(2)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.productId,
                          item.quantity - 1,
                          item.roomTypeId
                        )
                      }
                      className="p-1 rounded-full bg-slate-200 hover:bg-slate-300"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="font-semibold w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.productId,
                          item.quantity + 1,
                          item.roomTypeId
                        )
                      }
                      className="p-1 rounded-full bg-slate-200 hover:bg-slate-300"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                  <button
                    onClick={() =>
                      removeFromCart(item.productId, item.roomTypeId)
                    }
                    className="text-red-500 hover:text-red-700 mt-2"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
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
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isCheckingOut || !companyId}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-md hover:bg-indigo-700 disabled:bg-slate-400 flex items-center justify-center transition-colors"
          >
            {isCheckingOut ? (
              <Loader className="animate-spin h-6 w-6" />
            ) : (
              "Proceed to Checkout"
            )}
          </button>
          {!companyId && (
            <p className="text-xs text-center text-red-600 mt-2">
              Please log in to check out.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
