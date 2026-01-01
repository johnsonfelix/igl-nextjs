"use client";

import { useEffect, useState, use } from "react";
import { notFound, useRouter } from "next/navigation";
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
  Check,
  Plane,
  Train,
  Coffee,
  Info,
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
    sellingPrice?: number | null;
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
  location?: string | null;
  closestAirport?: string | null;
  publicTransport?: string | null;
  nearbyPlaces?: string | null;
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

// --- CONFIG ---
const TICKET_VARIANTS: Record<string, { name: string; price: number }[]> = {
  // Mapping by ticket name. In a real app, this should be DB driven or ID based.
  "Regular Ticket": [
    { name: "Regular Ticket", price: 850 },
    { name: "Accompanying Member", price: 650 },
    { name: "Meeting Package", price: 600 },
  ],
};

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

  // Use sellingPrice if available as the base price before any offer
  const basePrice = (item as any).sellingPrice ?? item.price;
  const hasSellingPrice = !!(item as any).sellingPrice;
  const hasOffer = !!offerPercent && offerPercent > 0;

  // If there is an offer OR a selling price difference, we consider it "discounted" for display purposes
  // However, the rendering logic below checks 'discounted' to decide whether to show strict old/new price layout.
  // The rendering logic below (lines 286+) was updated to use 'discounted' as the trigger for the complex view.
  const discounted = hasOffer || hasSellingPrice;

  const newPrice = getDiscountedPrice(basePrice, offerPercent);

  const handleAddToCart = () => {
    addToCart({
      productId: item.id,
      productType,
      name: item.name,
      price: newPrice,
      originalPrice: item.price,
      image: item.image || undefined,
    });
    toast.success(`${item.name} added to cart!`);
  };

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
        <h4 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-[#004aad] transition-colors">{item.name}</h4>

        <div className="mt-auto pt-4 border-t border-gray-100">
          {discounted ? (
            <div className="flex items-end gap-2 mb-4">
              <div className="flex flex-col">
                {offerPercent ? (
                  <>
                    <span className="text-2xl font-bold text-[#004aad]">${formatPrice(newPrice)}</span>
                    <span className="text-sm text-gray-400 line-through mb-1">${basePrice.toLocaleString()}</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-bold text-[#004aad]">${formatPrice(basePrice)}</span>
                    <span className="text-sm text-gray-400 line-through mb-1">${item.price.toLocaleString()}</span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="text-2xl font-bold text-[#004aad] mb-4">${item.price.toLocaleString()}</div>
          )}

          <button
            onClick={handleAddToCart}
            className="w-full bg-white border-2 border-[#004aad] text-[#004aad] font-bold py-2 rounded-lg hover:bg-[#004aad] hover:text-white transition-all flex items-center justify-center gap-2"
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
        <h4 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-[#004aad] transition-colors">{booth.name}</h4>
        {booth.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-4">
            {booth.description}
          </p>
        )}

        <div className="mt-auto pt-4 border-t border-gray-100">
          {discounted ? (
            <div className="flex items-end gap-2 mb-4">
              <span className="text-2xl font-bold text-[#004aad]">${formatPrice(newPrice)}</span>
              <span className="text-sm text-gray-400 line-through mb-1">${booth.price.toLocaleString()}</span>
            </div>
          ) : (
            <div className="text-2xl font-bold text-[#004aad] mb-4">${booth.price.toLocaleString()}</div>
          )}

          <button
            onClick={onBook}
            className="w-full bg-[#004aad] text-white font-bold py-2 rounded-lg hover:bg-[#00317a] transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
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
  const router = useRouter();

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


  // --- BOOKING WIZARD STATE ---
  const [bookingStep, setBookingStep] = useState<"TICKET" | "BOOTH" | "SUMMARY">("TICKET");
  const [wizardOpen, setWizardOpen] = useState(false);

  // Selection state
  // const [wizardSelectedTicket, setWizardSelectedTicket] = useState<{ id: string; name: string; price: number; image: string | null } | null>(null);
  // const [wizardSelectedVariant, setWizardSelectedVariant] = useState<{ name: string; price: number } | null>(null);

  // NEW: Multi-ticket state
  // Key: `${ticket.id}__${variant.name}` -> Value: quantity
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({});

  const [wizardSelectedBooth, setWizardSelectedBooth] = useState<Booth | null>(null);
  const [wizardSelectedBoothSlot, setWizardSelectedBoothSlot] = useState<BoothSubType | null>(null);

  // Helper to manage Ticket Quantities
  const handleTicketQuantityChange = (ticketId: string, variantName: string, delta: number) => {
    const key = `${ticketId}__${variantName}`;
    setTicketQuantities((prev) => {
      const current = prev[key] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: next };
    });
  };

  const totalTicketsSelected = Object.values(ticketQuantities).reduce((a, b) => a + b, 0);

  const getTicketSubtotal = () => {
    let total = 0;
    Object.entries(ticketQuantities).forEach(([key, qty]) => {
      // We need to find the price for this key. 
      // This is slightly inefficient but safe. 
      // Ideally we store price in the key or a separate lookup, but looking up in eventTickets is fine.
      // key format: `${ticketId}__${variantName}`
      const [tId, vName] = key.split('__');

      // Find the ticket parent
      const parent = eventTickets.find(et => et.ticket.id === tId);
      if (!parent) return;

      // Find variant price
      let price = 0;
      const variants = TICKET_VARIANTS[parent.ticket.name];
      if (variants) {
        const variant = variants.find(v => v.name === vName);
        if (variant) price = variant.price;
      } else {
        price = parent.ticket.price;
      }
      total += price * qty;
    });
    return total;
  };

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
        <Loader className="h-16 w-16 animate-spin text-[#004aad]" />
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
  const hotels = (eventData.hotels && eventData.hotels.length > 0) ? eventData.hotels : [
    {
      id: "fallback-hotel-radisson",
      hotelName: "Radisson Suites Bangkok Sukhumvit",
      image: "/images/h-Bangkok.jpg",
      address: "23/2 Soi Sukhumvit 13, Khlong Toei Nuea, Watthana, Bangkok 10110, Thailand",
      roomTypes: [
        {
          id: "rt-deluxe-room",
          roomType: "Deluxe Room",
          price: 150, // Estimate or placeholder
          amenities: "King Bed, City View, Free WiFi, Breakfast Included",
          eventRoomTypes: [{ quantity: 100 }],
        },
        {
          id: "rt-premier-room",
          roomType: "Premier Room",
          price: 200, // Estimate or placeholder
          amenities: "Spacious Suite, Lounge Access, Free WiFi, Breakfast Included",
          eventRoomTypes: [{ quantity: 50 }],
        }
      ]
    } as HotelData
  ];

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

  // --- BOOKING WIZARD LOGIC ---

  // --- BOOKING WIZARD LOGIC ---

  const openBookingWizard = () => {
    // Reset or Keep? Usually fresh start is better.
    setTicketQuantities({});
    setWizardSelectedBooth(null); // Reset booth
    setWizardSelectedBoothSlot(null); // Reset slot
    setBookingStep("TICKET");
    setWizardOpen(true);
  };

  const closeWizard = () => {
    setWizardOpen(false);
    setTicketQuantities({});
    setWizardSelectedBooth(null);
    setWizardSelectedBoothSlot(null);
  };

  const handleWizardBoothSelect = (booth: Booth) => {
    if (wizardSelectedBooth?.id === booth.id) {
      // Deselect if already selected
      setWizardSelectedBooth(null);
      setWizardSelectedBoothSlot(null);
      setBoothSubtypes([]);
      return;
    }
    setWizardSelectedBooth(booth);
    setWizardSelectedBoothSlot(null);
    fetchBoothSubtypes(booth.id);
  };

  const handleWizardAddToCart = () => {
    if (totalTicketsSelected === 0) return;

    // 1. Add All Selected Tickets
    Object.entries(ticketQuantities).forEach(([key, qty]) => {
      const [tId, vName] = key.split('__');
      const parent = eventTickets.find(et => et.ticket.id === tId);
      if (!parent) return;

      let price = 0;
      let originalPrice = 0;
      const variants = TICKET_VARIANTS[parent.ticket.name];
      if (variants) {
        const variant = variants.find(v => v.name === vName);
        if (variant) {
          price = variant.price;
          originalPrice = variant.price;
        }
      } else {
        price = parent.ticket.sellingPrice ?? parent.ticket.price;
        originalPrice = parent.ticket.price;
      }

      // Add each unit
      for (let i = 0; i < qty; i++) {
        addToCart({
          productId: parent.ticket.id,
          productType: "TICKET",
          name: vName, // Variant name
          price: price,
          originalPrice: originalPrice,
          image: parent.ticket.logo || undefined,
        });
      }
    });

    // 2. Add Booth (if selected)
    // NOTE: Booth logic remains "one per booking flow" for now, as requested/implied
    if (wizardSelectedBooth) {
      const price = 0; // Booth is included with ticket
      const name = wizardSelectedBoothSlot
        ? `${wizardSelectedBooth.name} - ${wizardSelectedBoothSlot.name}`
        : wizardSelectedBooth.name;

      addToCart({
        productId: wizardSelectedBooth.id,
        productType: "BOOTH",
        name: name,
        price: price, // Set to 0 as requested
        image: wizardSelectedBooth.image || undefined,
        boothSubTypeId: wizardSelectedBoothSlot?.id,
        boothSubTypeName: wizardSelectedBoothSlot?.name,
      });
    }

    // 3. Auto-add Accommodation (Deluxe Room)
    // Logic: 1 Room holds (1 Ticket + 1 Accompanying).
    // Meeting Package = 0 Rooms.
    let ticketCount = 0;
    let accompanyingCount = 0;

    // Log quantities for debugging
    console.log("Ticket Quantities:", ticketQuantities);

    Object.entries(ticketQuantities).forEach(([key, qty]) => {
      const parts = key.split('__');
      if (parts.length >= 2) {
        const vName = parts[1];
        const vNameLower = vName.toLowerCase();
        console.log(`Checking ticket: ${vName}, Qty: ${qty}`);

        if (vNameLower.includes("meeting package")) {
          // No room for meeting package
          return;
        }

        if (vNameLower.includes("accompanying")) {
          accompanyingCount += qty;
        } else if (vNameLower.includes("ticket")) {
          // Catches "Ticket", "Regular Ticket", "Standard Ticket"
          ticketCount += qty;
        }
      }
    });

    // Calculate rooms needed
    // 1 Ticket + 1 Accompanying = 1 Room.
    const roomsNeeded = Math.max(ticketCount, accompanyingCount);

    console.log(`Calculated Rooms Needed: ${roomsNeeded} (Tickets: ${ticketCount}, Accompanying: ${accompanyingCount})`);

    if (roomsNeeded > 0) {
      if (hotels.length > 0) {
        // Find Deluxe Room in the first hotel (Radisson)
        const hotel = hotels[0];
        console.log("Selected Hotel:", hotel.hotelName);

        // Try to find Deluxe, otherwise default to the first room type available
        const deluxeRoom = hotel.roomTypes.find(rt => rt.roomType.toLowerCase().includes("deluxe")) || hotel.roomTypes[0];
        console.log("Selected Room Type:", deluxeRoom);

        if (deluxeRoom) {
          for (let i = 0; i < roomsNeeded; i++) {
            console.log("Adding room to cart...");
            addToCart({
              productId: hotel.id,
              roomTypeId: deluxeRoom.id,
              productType: "HOTEL",
              name: `${hotel.hotelName} - ${deluxeRoom.roomType}`,
              price: deluxeRoom.price,
              image: hotel.image || undefined
            });
          }
          toast.success(`${roomsNeeded} ${deluxeRoom.roomType}(s) added automatically!`);
        } else {
          console.warn("No room types available in the hotel to auto-add.");
        }
      } else {
        console.warn("No hotels available for this event to auto-add rooms.");
      }
    }

    toast.success("Items added to cart!");
    closeWizard();
    setCartOpen(true); // Open cart to show user
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* --- WIZARD MODAL --- */}
      {wizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Complete Your Booking</h2>
                <div className="flex gap-2 mt-2">
                  <div className={`h-2 w-12 rounded-full ${bookingStep === 'TICKET' ? 'bg-[#004aad]' : 'bg-[#004aad]/30'}`} />
                  <div className={`h-2 w-12 rounded-full ${bookingStep === 'BOOTH' ? 'bg-[#004aad]' : 'bg-[#004aad]/30'}`} />
                  <div className={`h-2 w-12 rounded-full ${bookingStep === 'SUMMARY' ? 'bg-[#004aad]' : 'bg-[#004aad]/30'}`} />
                </div>
              </div>
              <button onClick={closeWizard} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={24} /></button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">

              {/* STEP 1: SELECT TICKET VARIANT */}
              {bookingStep === "TICKET" && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800">Select Ticket Type</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {eventTickets.flatMap(({ ticket }) => {
                      const variants = TICKET_VARIANTS[ticket.name];
                      if (variants && variants.length > 0) {
                        return variants.map(variant => ({
                          id: ticket.id, // Keep parent ID for cart
                          name: variant.name,
                          price: variant.price,
                          originalPrice: variant.price, // Variants currently don't have selling price logic override
                          sellingPrice: null,
                          image: ticket.logo,
                          parentTicket: ticket // Keep ref
                        }));
                      }
                      return [{
                        id: ticket.id,
                        name: ticket.name,
                        price: ticket.sellingPrice ?? ticket.price, // Use selling price if active
                        originalPrice: ticket.price,
                        sellingPrice: ticket.sellingPrice,
                        image: ticket.logo,
                        parentTicket: ticket
                      }];
                    }).sort((a, b) => b.price - a.price).map((option) => {
                      const key = `${option.id}__${option.name}`;
                      const qty = ticketQuantities[key] || 0;

                      return (
                        <div
                          key={key}
                          className={`rounded-xl border-2 p-6 transition-all flex flex-col h-full bg-white ${qty > 0 ? 'border-[#004aad] ring-2 ring-blue-100' : 'border-gray-100 hover:border-blue-200'}`}
                        >
                          <div className="flex-grow">
                            <div className="mb-2 font-bold text-gray-500 uppercase text-xs tracking-wider">
                              {option.parentTicket.name !== option.name ? option.parentTicket.name : 'Standard'}
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 mb-1 leading-tight">{option.name}</h4>
                            {option.sellingPrice ? (
                              <div className="flex flex-col">
                                <span className="text-sm text-gray-400 line-through">${option.originalPrice.toLocaleString()}</span>
                                <span className="text-2xl font-bold text-[#004aad]">${option.price.toLocaleString()}</span>
                              </div>
                            ) : (
                              <p className="text-2xl font-bold text-[#004aad]">${option.price}</p>
                            )}
                          </div>

                          {/* Quantity Control */}
                          <div className="mt-6 flex items-center justify-between bg-gray-50 rounded-lg p-1 border border-gray-200">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleTicketQuantityChange(option.id, option.name, -1); }}
                              className={`p-2 rounded-md transition-colors ${qty === 0 ? 'text-gray-300 cursor-not-allowed' : 'bg-white text-gray-700 shadow-sm hover:text-[#004aad]'}`}
                              disabled={qty === 0}
                            >
                              <Minus size={16} />
                            </button>
                            <span className={`font-bold text-lg w-8 text-center ${qty > 0 ? 'text-[#004aad]' : 'text-gray-400'}`}>{qty}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleTicketQuantityChange(option.id, option.name, 1); }}
                              className="p-2 rounded-md bg-white text-gray-700 shadow-sm hover:text-[#004aad] hover:bg-white transition-colors"
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                        </div>
                      )
                    })}
                  </div>

                  {/* Policy & Details Section */}
                  <div className="mt-8 bg-blue-50/50 rounded-xl p-6 border border-blue-100">
                    {/* <h4 className="flex items-center font-bold text-gray-800">
                      <InfoPill icon={AlertTriangle} text="Important Information" />
                    </h4> */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
                      {(() => {
                        let hasIncluded = false;
                        let hasExcluded = false;
                        Object.entries(ticketQuantities).forEach(([key, qty]) => {
                          if (qty > 0) {
                            const lower = key.toLowerCase();
                            if (lower.includes('meeting package')) hasExcluded = true;
                            // Assume others (Ticket, Accompanying) include accommodation
                            else hasIncluded = true;
                          }
                        });
                        const noSelection = !hasIncluded && !hasExcluded;
                        const showIncluded = hasIncluded || noSelection;
                        const showExcluded = hasExcluded || noSelection;

                        return (
                          <div className="space-y-4">
                            {showIncluded && (
                              <div className="flex gap-3 animate-fadeIn">
                                <div className="mt-1 bg-emerald-100 text-emerald-600 rounded-full p-1 h-fit"><Check size={14} /></div>
                                <div>
                                  <span className="font-bold text-gray-800 block mb-1">Accommodation Included:</span>
                                  Registration fees includes <span className="font-semibold text-gray-900">2 nights (March 25 & 26) stay</span> at the conference hotel with breakfast and access to all Sessions, two lunches, Dinners, Refreshment, Welcome cocktail, Gala Dinner and Conference material.
                                </div>
                              </div>
                            )}
                            {showExcluded && (
                              <div className="flex gap-3 animate-fadeIn">
                                <div className="mt-1 bg-amber-100 text-amber-600 rounded-full p-1 h-fit"><X size={14} /></div>
                                <div>
                                  <span className="font-bold text-gray-800 block mb-1">Accommodation Excluded:</span>
                                  Certain packages may exclude Accommodation at the conference hotel, but provide full access to all Sessions, Two lunches, Dinners, Refreshment, welcome cocktail, Gala Dinner and Conference material.
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm h-fit">
                        <h5 className="font-bold text-red-600 mb-2 flex items-center gap-2">
                          <Trash2 size={16} /> Cancellation & Refund Policy
                        </h5>
                        <ul className="space-y-2 list-disc list-inside marker:text-red-300">
                          <li>
                            Registration cancellations received prior to <span className="font-semibold text-gray-900">January 10, 2026</span> will be eligible to receive a <span className="font-bold text-red-500">50% refund</span>.
                          </li>
                          <li>
                            Cancellations received after the stated deadline will <span className="font-bold">not be eligible for a refund</span>.
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: SELECT BOOTH */}
              {bookingStep === "BOOTH" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">Select Exhibition Booth</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {boothsList.map((booth) => (
                      <div key={booth.id} className={`rounded-xl border-2 transition-all overflow-hidden ${wizardSelectedBooth?.id === booth.id ? 'border-[#004aad] bg-blue-50/50' : 'border-gray-100 hover:border-blue-200'}`}>
                        <div
                          onClick={() => handleWizardBoothSelect(booth)}
                          className="cursor-pointer group flex gap-4 p-4"
                        >
                          <div className="h-20 w-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                            {booth.image && <img src={booth.image} className="h-full w-full object-cover" alt={booth.name} />}
                          </div>
                          <div className="flex-grow">
                            <h4 className="font-semibold text-gray-900">{booth.name}</h4>
                            <p className="text-[#004aad] font-bold">Included</p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{booth.description}</p>
                          </div>
                          <div className="flex items-center px-2">
                            {wizardSelectedBooth?.id === booth.id ? (
                              <div className="bg-[#004aad] text-white p-1 rounded-full"><Users size={16} /></div>
                            ) : (
                              <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
                            )}
                          </div>
                        </div>

                        {/* SLOTS EXPANSION */}
                        {wizardSelectedBooth?.id === booth.id && (
                          <div className="px-4 pb-4 animate-fadeIn border-t border-blue-100 mt-2 pt-2">
                            <h5 className="text-sm font-bold text-gray-700 mb-2">Select a Slot / Type:</h5>
                            {boothSubtypesLoading ? (
                              <div className="flex justify-center py-4"><Loader className="animate-spin text-[#004aad]" /></div>
                            ) : boothSubtypes.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {boothSubtypes.map(slot => (
                                  <button
                                    key={slot.id}
                                    onClick={() => setWizardSelectedBoothSlot(slot)}
                                    className={`text-left text-sm p-3 rounded-lg border flex justify-between items-center transition-all ${wizardSelectedBoothSlot?.id === slot.id ? 'bg-[#004aad] text-white border-[#004aad] shadow-md' : 'bg-white border-gray-200 hover:border-[#004aad] text-gray-700'}`}
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-semibold">{slot.name}</span>
                                      {slot.slotStart && (
                                        <span className={`text-xs mt-0.5 ${wizardSelectedBoothSlot?.id === slot.id ? 'text-blue-100' : 'text-gray-500'}`}>
                                          {format(parseISO(slot.slotStart), "MMM d, h:mm a")}
                                          {slot.slotEnd && ` - ${format(parseISO(slot.slotEnd), "h:mm a")}`}
                                        </span>
                                      )}
                                    </div>
                                    <span className="font-bold whitespace-nowrap ml-2">Included</span>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 italic py-2">No specific slots available. The base booth will be booked.</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: SUMMARY */}
              {bookingStep === "SUMMARY" && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800">Confirm Your Selection</h3>
                  <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                    <div className="pb-4 border-b border-gray-200 space-y-3">
                      <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Selected Tickets</h4>
                      {Object.entries(ticketQuantities).map(([key, qty]) => {
                        const [tId, vName] = key.split('__');
                        const parent = eventTickets.find(et => et.ticket.id === tId);
                        if (!parent) return null;
                        let price = 0;
                        const variants = TICKET_VARIANTS[parent.ticket.name];
                        if (variants) {
                          const variant = variants.find(v => v.name === vName);
                          if (variant) price = variant.price;
                        } else {
                          price = parent.ticket.price;
                        }

                        return (
                          <div key={key} className="flex justify-between items-center">
                            <div>
                              <p className="font-bold text-gray-900">{vName} <span className="text-gray-500 text-xs font-normal">x {qty}</span></p>
                            </div>
                            <p className="font-bold text-[#004aad]">${(price * qty).toLocaleString()}</p>
                          </div>
                        )
                      })}
                    </div>
                    {wizardSelectedBooth ? (
                      <div className="flex justify-between items-center pt-2">
                        <div>
                          <p className="font-bold text-gray-900">{wizardSelectedBooth.name}</p>
                          <p className="text-sm text-gray-500">
                            Exhibition Booth
                            {wizardSelectedBoothSlot && <span className="block text-xs font-semibold text-[#004aad]">Slot: {wizardSelectedBoothSlot.name}</span>}
                          </p>
                        </div>
                        <p className="font-bold text-[#004aad]">
                          Included
                        </p>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 italic">No booth selected</div>
                    )}
                    <div className="flex justify-between items-center pt-4 border-t-2 border-dashed border-gray-200">
                      <p className="font-extrabold text-lg">Total</p>
                      <p className="font-extrabold text-xl text-[#004aad]">
                        ${getTicketSubtotal().toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer / Controls */}
              {/* Footer / Controls */}
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between">
                {bookingStep === "TICKET" && (
                  <>
                    <div />
                    <button
                      onClick={() => {
                        // Check if we should skip booth
                        // Logic: If ONLY "Accompanying Member" is selected (no Regular Ticket), skip booth.
                        // Or stricter: Booth is ONLY for "Regular Ticket".
                        let hasRegularTicket = false;
                        Object.entries(ticketQuantities).forEach(([key, qty]) => {
                          const [, vName] = key.split('__');
                          if (vName.toLowerCase().includes("ticket") && !vName.toLowerCase().includes("accompanying")) {
                            hasRegularTicket = true;
                          }
                        });

                        if (!hasRegularTicket) {
                          setBookingStep("SUMMARY");
                        } else {
                          setBookingStep("BOOTH");
                        }
                      }}
                      disabled={totalTicketsSelected === 0}
                      className="px-8 py-3 bg-[#004aad] text-white rounded-xl font-bold hover:bg-[#00317a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {(() => {
                        let hasRegularTicket = false;
                        Object.entries(ticketQuantities).forEach(([key, qty]) => {
                          const [, vName] = key.split('__');
                          if (vName.toLowerCase().includes("ticket") && !vName.toLowerCase().includes("accompanying")) {
                            hasRegularTicket = true;
                          }
                        });
                        return hasRegularTicket ? "Next: Select Booth" : "Next: Review";
                      })()}
                    </button>
                  </>
                )}
                {bookingStep === "BOOTH" && (
                  <>
                    <button onClick={() => setBookingStep("TICKET")} className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-200 rounded-xl">Back</button>
                    <button
                      onClick={() => setBookingStep("SUMMARY")}
                      disabled={!wizardSelectedBooth}
                      className="px-8 py-3 bg-[#004aad] text-white rounded-xl font-bold hover:bg-[#00317a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next: Review
                    </button>
                  </>
                )}
                {bookingStep === "SUMMARY" && (
                  <>
                    <button onClick={() => {
                      // Smart Back: Check if we skipped booth
                      let hasRegularTicket = false;
                      Object.entries(ticketQuantities).forEach(([key, qty]) => {
                        const [, vName] = key.split('__');
                        if (vName.toLowerCase().includes("ticket") && !vName.toLowerCase().includes("accompanying")) {
                          hasRegularTicket = true;
                        }
                      });

                      if (!hasRegularTicket) {
                        setBookingStep("TICKET");
                      } else {
                        setBookingStep("BOOTH");
                      }
                    }} className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-200 rounded-xl">Back</button>
                    <button
                      onClick={handleWizardAddToCart}
                      className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-200"
                    >
                      Add to Cart
                    </button>
                  </>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- HERO SECTION --- */}
      <div className="relative h-[400px] w-full overflow-hidden">
        <img
          src={id === "cmjn1f6ih0000gad4xa4j7dp3" ? "/images/event-bangkok-hero.png" : (thumbnail || "/images/bg-2.jpg")}
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#004aad]/80 mix-blend-multiply"></div>
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
                  ? 'bg-[#004aad] text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-[#004aad]'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-[500px]">

            {activeTab === "About" && (
              <div className="animate-fadeIn space-y-10">
                {/* 2. Description Content */}
                <div className="flex flex-col gap-10">
                  {/* HERO TEXT */}
                  <div className="bg-gradient-to-r from-blue-50 via-white to-blue-50 p-8 rounded-2xl border border-blue-100 text-center">
                    <h2 className="text-3xl font-extrabold text-[#004aad] mb-4">
                      IGLA Global Logistics Conference 2026
                    </h2>
                    <p className="text-lg text-gray-700 leading-relaxed max-w-4xl mx-auto">
                      Join the <span className="font-bold text-[#004aad]">Innovative Global Logistics Allianz (IGLA)</span> at its prestigious 3-day flagship event in the heart of Bangkok, Thailand.
                      This premier gathering brings together logistics professionals, freight forwarders, supply chain innovators, transport experts, and industry leaders from around the world for immersive learning, collaboration, and business development.
                    </p>
                    {/* <a href="https://igla.asia" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-6 text-[#004aad] font-bold hover:underline">
                      Visit igla.asia <ArrowRight size={16} />
                    </a> */}
                  </div>

                  {/* WHAT TO EXPECT GRID */}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <div className="bg-[#004aad] p-1.5 rounded-lg"><Check className="text-white h-5 w-5" /></div>
                      What to Expect
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Global Networking */}
                      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                          <Users className="h-6 w-6" />
                        </div>
                        <h4 className="text-xl font-bold text-gray-800 mb-2">Global Networking</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          Connect with hundreds of logistics leaders, decision-makers, and service providers to expand your professional network.
                        </p>
                      </div>

                      {/* Insightful Sessions */}
                      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4">
                          <Info className="h-6 w-6" />
                        </div>
                        <h4 className="text-xl font-bold text-gray-800 mb-2">Insightful Sessions</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          Engage with expert-led discussions, industry panels, and keynote presentations focusing on the latest trends, technologies, and strategies shaping the future of global logistics.
                        </p>
                      </div>

                      {/* Business Opportunities */}
                      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
                          <Check className="h-6 w-6" />
                        </div>
                        <h4 className="text-xl font-bold text-gray-800 mb-2">Business Opportunities</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          Explore new partnerships, discover innovative solutions, and participate in curated sessions designed to accelerate business growth and cross-border collaboration.
                        </p>
                      </div>

                      {/* Strategic Venue */}
                      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-4">
                          <Hotel className="h-6 w-6" />
                        </div>
                        <h4 className="text-xl font-bold text-gray-800 mb-2">Strategic Venue</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          Hosted at the elegant <span className="font-semibold text-orange-600">Radisson Suites Bangkok Sukhumvit</span>, providing a premium setting for high-impact exchanges in one of Southeast Asia’s busiest logistics hubs.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* OUTRO */}
                  <div className="bg-[#004aad]/5 border-l-4 border-[#004aad] p-6 rounded-r-xl">
                    <p className="text-gray-700 italic font-medium leading-relaxed">
                      "Whether you’re looking to stay ahead of industry trends, build strategic alliances, or explore new market opportunities, the IGLA Global Logistics Conference 2026 is the place to be for professionals committed to shaping the future of global supply chains."
                    </p>
                  </div>
                </div>

                {/* 2. Venue Information Section */}
                {(() => {
                  // Fallback/Override for the specific event reqested by user
                  const targetId = "cmjn1f6ih0000gad4xa4j7dp3";
                  const showVenue = venue || (id === targetId ? {
                    name: "RADISSON SUITES BANGKOK SUKHUMVIT",
                    description: "An upscale hotel located in the bustling Sukhumvit area, offering spacious suites and world-class amenities.",
                    imageUrls: ["/images/venue-placeholder.jpg"],
                    closestAirport: "Suvarnabhumi Airport (BKK) - 28km (approx. 30-45 min by taxi). Don Mueang (DMK) - 20km.",
                    publicTransport: "Free shuttle to BTS Nana Skytrain & Sukhumvit MRT station. Excellent connectivity to the city.",
                    nearbyPlaces: "Terminal 21 Shopping Mall, Benjakitti Park, Sukhumvit Soi 11 Nightlife, Erawan Shrine."
                  } : null);

                  if (!showVenue) return null;

                  return (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden animate-fadeIn">
                      <div className="p-0 grid grid-cols-1 lg:grid-cols-3">
                        {/* LEFT: GOOGLE MAP */}
                        <div className="lg:col-span-1 h-[400px] lg:h-auto min-h-[400px] relative">
                          <iframe
                            title="Venue Map"
                            width="100%"
                            height="100%"
                            style={{ border: 0, minHeight: '400px' }}
                            loading="lazy"
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                            src={`https://maps.google.com/maps?q=${encodeURIComponent(showVenue.name + " " + showVenue.location || "")}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                            className="absolute inset-0"
                          />
                        </div>

                        {/* RIGHT: DETAILS LIST */}
                        <div className="lg:col-span-2 p-8 lg:p-10 flex flex-col justify-center">
                          <div className="mb-8 border-b border-gray-100 pb-6">
                            <h3 className="text-3xl font-bold text-gray-900 mb-2">{showVenue.name}</h3>
                            <p className="text-gray-500 font-medium flex items-center gap-2">
                              <MapPin className="h-5 w-5 text-[#004aad]" />
                              {showVenue.location || "Bangkok, Thailand"}
                            </p>
                            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(showVenue.name)}`} target="_blank" rel="noreferrer" className="inline-block mt-4 text-[#004aad] font-bold text-sm hover:underline">
                              View larger map →
                            </a>
                          </div>

                          <div className="space-y-8">
                            {/* Airport */}
                            <div className="flex gap-4 items-start">
                              <div className="flex-shrink-0 mt-1">
                                <Plane className="h-6 w-6 text-[#004aad] fill-blue-50" />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-800 text-lg mb-1">Airport</h4>
                                <p className="text-gray-600 leading-relaxed text-sm">
                                  {showVenue.closestAirport || "Suvarnabhumi Airport (BKK) is approximately 30-45 minutes by taxi."}
                                </p>
                              </div>
                            </div>

                            {/* METRO */}
                            <div className="flex gap-4 items-start">
                              <div className="flex-shrink-0 mt-1">
                                <Train className="h-6 w-6 text-[#004aad] fill-blue-50" />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-800 text-lg mb-1">METRO</h4>
                                <p className="text-gray-600 leading-relaxed text-sm">
                                  {showVenue.publicTransport || "Easy access via BTS Nana Skytrain (Exit 3) and MRT Sukhumvit Station, providing seamless connectivity to the city."}
                                </p>
                              </div>
                            </div>

                            {/* Nearby / Parking */}
                            <div className="flex gap-4 items-start">
                              <div className="flex-shrink-0 mt-1">
                                <Coffee className="h-6 w-6 text-[#004aad] fill-blue-50" />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-800 text-lg mb-1">Nearby & Parking</h4>
                                <p className="text-gray-600 leading-relaxed text-sm">
                                  {showVenue.nearbyPlaces || "Located near Terminal 21 Shopping Mall. Free private parking is available on site for guests."}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
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
                          <div className="bg-[#004aad] text-white rounded-lg p-2 shadow-sm">
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
                                  <div className="inline-flex items-center justify-center bg-blue-50 text-[#004aad] px-3 py-1.5 rounded-lg text-sm font-bold border border-blue-100">
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
              <div className="animate-fadeIn py-12 flex flex-col items-center justify-center text-center">
                <button
                  onClick={() => {
                    openBookingWizard();
                  }}
                  className="bg-[#004aad] hover:bg-[#00317a] text-white text-xl font-bold px-12 py-5 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-3 mb-8"
                >
                  <span>Book Your Tickets</span>
                  <ArrowRight className="h-6 w-6" />
                </button>
                <div className="bg-[#004aad]/5 p-4 rounded-full mb-6">
                  <div className="bg-[#004aad]/10 p-6 rounded-full">
                    <ShoppingCart className="h-12 w-12 text-[#004aad]" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Ready to Join Us?</h2>
                <p className="text-gray-500 max-w-lg mx-auto mb-8 text-lg">
                  Secure your spot at {name}. Choose from a variety of ticket options to make the most of your experience.
                </p>
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
              <div className="animate-fadeIn space-y-8">
                {/* Featured Hotel Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="relative h-96 w-full">
                    <img
                      src="/images/h-Bangkok.jpg"
                      alt="Radisson Suites Bangkok Sukhumvit"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8">
                      <h2 className="text-4xl font-bold text-white mb-2">Radisson Suites Bangkok Sukhumvit</h2>
                      <p className="text-white/90 text-lg flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-orange-400" />
                        23/2 Soi Sukhumvit 13, Khlong Toei Nuea, Watthana, Bangkok 10110, Thailand
                      </p>
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800 mb-4">About the Hotel</h3>
                          <p className="text-gray-600 leading-relaxed text-sm">
                            Experience the perfect blend of style and convenience at Radisson Suites Bangkok Sukhumvit.
                            Located in the vibrant Sukhumvit district, our hotel offers easy access to the city's
                            best shopping, dining, and entertainment venues. Just minutes away from the Nana BTS Skytrain
                            and Sukhumvit MRT stations, you can easily explore everything Bangkok has to offer.
                          </p>
                        </div>

                        {/* Image Gallery */}
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 mb-4">Gallery</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <img src="/images/h-Bangkok.jpg" className="rounded-lg h-32 w-full object-cover shadow-sm hover:scale-105 transition-transform" />
                            <img src="/images/h-Bangkok1.jpg" className="rounded-lg h-32 w-full object-cover shadow-sm hover:scale-105 transition-transform" />
                            <img src="/images/h-Bangkok2.jpg" className="rounded-lg h-32 w-full object-cover shadow-sm hover:scale-105 transition-transform" />
                            <div className="bg-gray-100 rounded-lg h-32 w-full flex items-center justify-center text-gray-400 font-medium">
                              + More Photos
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 h-full">
                          <h3 className="text-lg font-bold text-[#004aad] mb-4 flex items-center gap-2">
                            <Hotel className="h-5 w-5" /> Hotel Amenities
                          </h3>
                          <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-gray-700">
                              <div className="bg-white p-1.5 rounded-full shadow-sm text-blue-500"><Check size={14} /></div>
                              Rooftop Swimming Pool
                            </li>
                            <li className="flex items-center gap-3 text-gray-700">
                              <div className="bg-white p-1.5 rounded-full shadow-sm text-blue-500"><Check size={14} /></div>
                              Fitness Center
                            </li>
                            <li className="flex items-center gap-3 text-gray-700">
                              <div className="bg-white p-1.5 rounded-full shadow-sm text-blue-500"><Check size={14} /></div>
                              Free High-Speed Wi-Fi
                            </li>
                            <li className="flex items-center gap-3 text-gray-700">
                              <div className="bg-white p-1.5 rounded-full shadow-sm text-blue-500"><Check size={14} /></div>
                              On-site Restaurant & Bar
                            </li>
                            <li className="flex items-center gap-3 text-gray-700">
                              <div className="bg-white p-1.5 rounded-full shadow-sm text-blue-500"><Check size={14} /></div>
                              Business Center
                            </li>
                            <li className="flex items-center gap-3 text-gray-700">
                              <div className="bg-white p-1.5 rounded-full shadow-sm text-blue-500"><Check size={14} /></div>
                              Concierge Services
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rooms Section */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">Available Options</h3>
                  {hotels.length > 0 ? (
                    <div className="space-y-6">
                      {hotels.map((hotel) => (
                        <div key={hotel.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                          {/* Only show rooms, hide the hotel header if we act like this IS the hotel page, 
                             BUT existing logic iterates over hotels. 
                             If the loop contains Radisson, we might be duplicating the header info if we printed it above.
                             For now, I'll keep the room listing logic which is inside the loop. 
                             I'll strip the per-hotel header from the loop to make it look like "Rooms for the above hotel"
                             assuming the event only has this one hotel or they are all valid options for it. 
                             If there are multiple hotels, this might be confusing, but the user said "this IS the hotel".
                         */}
                          <div className="p-6">
                            {/* Rooms List - Always Visible */}
                            <div className="">
                              <div className="space-y-3">
                                {hotel.roomTypes.map((rt) => (
                                  <div key={rt.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between gap-4">
                                    <div className="flex-grow">
                                      <div className="flex justify-between items-start mb-1">
                                        <p className="font-bold text-gray-800 text-lg">
                                          {rt.roomType}
                                          <span className="text-sm text-[#004aad] ml-2 font-normal">(Comes along with the ticket)</span>
                                        </p>
                                        <p className="font-bold text-[#004aad] sm:hidden text-lg">${rt.price}</p>
                                      </div>
                                      <p className="text-sm text-gray-500 mb-2">{rt.amenities || "Standard amenities included."}</p>
                                      <div className="flex flex-wrap gap-2">
                                        {rt.amenities?.split(',').map((amenity, idx) => (
                                          <span key={idx} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full uppercase tracking-wide">{amenity.trim()}</span>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end justify-center min-w-[120px] border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-4 mt-2 sm:mt-0">
                                      <p className="font-bold text-[#004aad] text-xl hidden sm:block mb-2">${rt.price}</p>
                                      {/* Button hidden as requested previously */}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-gray-500 italic">No accommodation details available.</p>}
                </div>
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
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#004aad]">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Date & Time</p>
                  <p className="font-bold text-gray-800">{format(parseISO(startDate), "MMM d, yyyy")} - {format(parseISO(endDate), "MMM d, yyyy")}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-[#2ebb79]">
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
              <button
                className="w-full bg-[#004aad] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#00317a] transition-colors flex items-center justify-center gap-2"
                onClick={() => router.push(`/event/${id}/cart`)}
              >
                <ShoppingCart className="h-5 w-5" />
                <div className="flex items-center gap-2">
                  <span>Your Cart</span>
                  {itemCount > 0 && (
                    <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[24px] flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </div>
              </button>
              {/* <p className="text-center text-xs text-gray-400 mt-3">Proceed to checkout.</p> */}
            </div>
          </div>
        </div>

      </div >

      {/* --- CART FLOATING BUTTON --- */}


      {/* --- BOOTH MODAL --- */}
      {
        boothModalOpen && selectedBooth && (
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
                  <div className="py-8 flex justify-center"><Loader className="animate-spin text-[#004aad]" /></div>
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
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center ${isSelected ? 'border-[#004aad] bg-blue-50' : 'border-gray-100 hover:border-gray-200'
                            } ${!st.isAvailable ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                          <div>
                            <p className="font-bold text-gray-800">{st.name}</p>
                            {st.description && <p className="text-xs text-gray-500">{st.description}</p>}
                            {st.slotStart && st.slotEnd && (
                              <p className="text-xs text-[#004aad] mt-1 font-medium bg-blue-50 w-fit px-2 py-0.5 rounded">
                                {format(new Date(st.slotStart), "MMM d, h:mm a")} - {format(new Date(st.slotEnd), "h:mm a")}
                              </p>
                            )}
                            {!st.isAvailable && <span className="text-xs font-bold text-red-500">Sold Out</span>}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[#004aad]">${finalPrice.toLocaleString()}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button onClick={closeBoothModal} className="px-6 py-2 rounded-lg font-bold text-gray-600 hover:bg-gray-200 transition-colors">Cancel</button>
                <button onClick={handleConfirmBoothSubtype} className="px-6 py-2 rounded-lg font-bold bg-[#004aad] text-white hover:bg-[#00317a] transition-colors shadow-md">Confirm Booking</button>
              </div>
            </div>
          </div>
        )
      }

    </div >
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
