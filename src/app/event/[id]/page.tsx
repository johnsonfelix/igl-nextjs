"use client";

import { useEffect, useState, use, useMemo } from "react";
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
  ShieldCheck,
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
    features?: string[];
  };
  quantity: number;
}

interface SponsorType {
  sponsorType: {
    id: string;
    name: string;
    image: string | null;
    price: number;
    features?: string[];
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
  purchaseOrders?: any[]; // Allow any for now to avoid strict type definition hell, or define simpler structure
  earlyBird?: boolean;
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
  isSoldOut = false,
  onAddToCart,
  onBuyNow,
  eventId,
}: {
  item: { id: string; name: string; image: string | null; price: number; originalPrice?: number; features?: string[] };
  productType: CartItem["productType"];
  actionText?: string;
  offerPercent?: number | null;
  offerName?: string | null;
  isSoldOut?: boolean;
  onAddToCart?: (quantity: number) => void;
  onBuyNow?: (quantity: number) => void;
  eventId?: string;
}) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  // item.price is the effective prices (selling price).
  // item.originalPrice is the higher list price (if any).
  const basePrice = item.price;
  const originalPrice = item.originalPrice;

  // Calculate final price after offer (if any)
  const newPrice = getDiscountedPrice(basePrice, offerPercent);

  // Determine if we show a discount view
  const hasOffer = !!offerPercent && offerPercent > 0;
  // If originalPrice exists and is greater than basePrice, that's a built-in discount
  const hasListPriceDiscount = !!originalPrice && originalPrice > basePrice;

  const discounted = hasOffer || hasListPriceDiscount;

  const handleAddToCart = () => {
    if (isSoldOut) return;

    if (onAddToCart) {
      onAddToCart(quantity);
    } else {
      // Add to cart with the selected quantity
      for (let i = 0; i < quantity; i++) {
        addToCart({
          productId: item.id,
          productType,
          name: item.name,
          price: newPrice,
          originalPrice: originalPrice ?? item.price,
          image: item.image || undefined,
        });
      }
      toast.success(`${quantity} x ${item.name} added to cart!`);
    }

    setQuantity(1); // Reset quantity after adding
  };

  const incrementQuantity = () => {
    setQuantity(prev => Math.min(prev + 1, 99));
  };

  const decrementQuantity = () => {
    setQuantity(prev => Math.max(prev - 1, 1));
  };

  const isTicket = productType === "TICKET";

  // Savings calculation
  const savings = hasOffer
    ? (basePrice - newPrice)
    : (hasListPriceDiscount ? ((originalPrice || 0) - basePrice) : 0);

  const totalSavings = savings * ((isTicket || productType === "SPONSOR") ? quantity : 1);
  const showSavings = savings > 0 && !isSoldOut;

  // Display Price Logic:
  // 1. Offer active: New Price (Bold) + Base Price (Crossed)
  // 2. No Offer, List Price Discount: Base Price (Bold) + Original Price (Crossed)
  // 3. No Discount: Base Price (Bold)

  return (
    <div className={`group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full relative ${isSoldOut ? 'opacity-75 grayscale-[0.5]' : ''}`}>
      {isSoldOut ? (
        <div className="absolute top-2 right-2 z-10 bg-gray-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
          SOLD OUT
        </div>
      ) : discounted && (
        <div className="absolute top-2 right-2 z-10 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
          {hasOffer ? `${Math.round(offerPercent!)}% OFF` : 'SALE'}
        </div>
      )}

      <div className={`relative w-full overflow-hidden border-b border-gray-100 ${productType === 'SPONSOR' ? 'bg-white aspect-square h-auto' : 'bg-gray-50 h-36'}`}>
        <img
          src={item.image || "/placeholder.png"}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {isSoldOut && <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
          <span className="bg-white/80 text-gray-800 px-3 py-1 rounded font-bold border border-gray-200 text-xs uppercase tracking-wider">Sold Out</span>
        </div>}
      </div>

      <div className="p-3 flex-grow flex flex-col gap-2">
        <h4 className="text-sm font-bold text-gray-900 leading-tight group-hover:text-[#004aad] transition-colors line-clamp-1">{item.name}</h4>

        {/* Features  */}
        {item.features && item.features.length > 0 && (
          <div className="space-y-0.5 mb-2">
            {item.features.slice(0, 3).map((feature: string, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5 text-[10px] text-gray-600">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                  <Check className="w-1.5 h-1.5 text-white" strokeWidth={4} />
                </div>
                <span className="font-medium line-clamp-1">{feature}</span>
              </div>
            ))}
            {item.features.length > 3 && (
              <div className="text-[9px] text-gray-400 font-semibold ml-4.5">
                +{item.features.length - 3} more
              </div>
            )}
          </div>
        )}

        <div className="mt-auto pt-2 border-t border-gray-100 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            {/* Price section */}
            <div className="flex flex-col">
              {discounted && !isSoldOut ? (
                <div className="flex flex-col leading-none">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-bold text-[#004aad]">
                      ${formatPrice(hasOffer ? newPrice : basePrice)}
                    </span>
                    <span className="text-xs text-gray-400 line-through">
                      ${(hasOffer ? basePrice : (originalPrice || basePrice)).toLocaleString()}
                    </span>
                  </div>
                  {showSavings && (
                    <span className="text-[10px] text-green-600 font-semibold mt-0.5">
                      Save ${totalSavings.toFixed(2)}
                    </span>
                  )}
                </div>
              ) : (
                <div className={`text-lg font-bold ${isSoldOut ? 'text-gray-400' : 'text-[#004aad]'}`}>${item.price.toLocaleString()}</div>
              )}
            </div>

            {/* Quantity Controls - Compact & Inline */}
            {(isTicket || productType === "SPONSOR") && !isSoldOut && (
              <div className="flex items-center gap-0 border border-gray-200 rounded overflow-hidden h-7">
                <button
                  onClick={decrementQuantity}
                  className="w-7 h-full flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-[#004aad] transition-colors active:bg-gray-200"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="text-xs font-semibold text-gray-800 w-8 text-center bg-white h-full flex items-center justify-center border-x border-gray-200">{quantity}</span>
                <button
                  onClick={incrementQuantity}
                  className="w-7 h-full flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-[#004aad] transition-colors active:bg-gray-200"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* Show split buttons only for tickets, single button for sponsors */}
          {productType === "TICKET" || productType === "SPONSOR" ? (
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddToCart}
                  disabled={isSoldOut}
                  className={`p-2 rounded transition-all flex items-center justify-center ${isSoldOut
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-[#004aad] text-white hover:bg-[#00317a] shadow-sm hover:shadow active:translate-y-0.5'
                    }`}
                  title="Buy Now"
                >
                  <ShoppingCart className="h-4 w-4" />
                </button>

                <button
                  onClick={() => {
                    if (onBuyNow) {
                      onBuyNow(quantity);
                    } else {
                      handleAddToCart();
                    }
                  }}
                  disabled={isSoldOut}
                  className={`flex-1 py-2 rounded text-xs font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 ${isSoldOut
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow active:translate-y-0.5'
                    }`}
                >
                  {isSoldOut ? "Sold Out" : actionText || "Buy Now"}
                </button>
              </div>
              <Link
                href={productType === "TICKET"
                  ? `/event/${eventId}/ticket/${item.id}`
                  : `/event/${eventId}/sponsor/${item.id}`
                }
                className="w-full py-1.5 text-xs font-semibold text-gray-500 hover:text-[#004aad] hover:underline text-center transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                View More Details
              </Link>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={isSoldOut}
              className={`w-full py-2 rounded text-xs font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 ${isSoldOut
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-[#004aad] text-white hover:bg-[#00317a] shadow-sm hover:shadow active:translate-y-0.5'
                }`}
            >
              {isSoldOut ? "Sold Out" : actionText} {!isSoldOut && <ShoppingCart className="h-3 w-3" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Helper Components ---

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
      <div className="relative h-48 bg-gray-100">
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <span className="text-lg font-semibold">Booth Preview</span>
        </div>
      </div>
      <div className="p-5 flex-grow flex flex-col">
        <h4 className="text-lg font-bold text-gray-800 mb-2">{booth.name}</h4>
        <div className="mt-auto">
          {discounted ? (
            <div>
              <span className="text-xl font-bold text-[#004aad]">${formatPrice(newPrice)}</span>
              <span className="text-sm text-gray-400 line-through ml-2">${booth.price.toLocaleString()}</span>
            </div>
          ) : (
            <div className="text-xl font-bold text-[#004aad]">${booth.price.toLocaleString()}</div>
          )}
          <button onClick={onBook} className="mt-4 w-full bg-[#004aad] text-white py-2 rounded-lg font-bold">
            Book Booth
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

  const { itemCount, addToCart, cart, updateQuantity } = useCart();
  const { user } = useAuth();
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("Tickets");
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
  const [venueGalleryOpen, setVenueGalleryOpen] = useState(false);
  const VENUE_IMAGES = [
    "/images/h-Bangkok.jpg",
    "/images/h-Bangkok1.jpg",
    "/images/h-Bangkok2.jpg",
    "/images/h-Bangkok3.jpg",
    "/images/h-Bangkok4.jpg",
    "/images/h-Bangkok5.jpg"
  ];

  // --- BOOKING WIZARD STATE ---
  const [bookingStep, setBookingStep] = useState<"TICKET" | "SPONSOR" | "SUMMARY">("TICKET");
  const [wizardOpen, setWizardOpen] = useState(false);

  // --- SPONSORSHIP POPUP STATE (Buy Now) ---
  const [sponsorshipPopupOpen, setSponsorshipPopupOpen] = useState(false);
  const [selectedSponsorInPopup, setSelectedSponsorInPopup] = useState<string | null>(null);

  // Prevent body scroll when popup is open
  useEffect(() => {
    if (sponsorshipPopupOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sponsorshipPopupOpen]);


  // Selection state
  // const [wizardSelectedTicket, setWizardSelectedTicket] = useState<{ id: string; name: string; price: number; image: string | null } | null>(null);
  // const [wizardSelectedVariant, setWizardSelectedVariant] = useState<{ name: string; price: number } | null>(null);

  // NEW: Multi-ticket state
  // Key: `${ticket.id}__${variant.name}` -> Value: quantity
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({});
  // NEW: Sponsor quantities
  const [sponsorQuantities, setSponsorQuantities] = useState<Record<string, number>>({});

  // NEW: Hover/Click focus state for policy preview
  const [focusedTicketName, setFocusedTicketName] = useState<string | null>(null);

  // NEW: Member Level for Pricing
  const [currentUserMembership, setCurrentUserMembership] = useState<string | null>(null);

  const [wizardSelectedBooth, setWizardSelectedBooth] = useState<Booth | null>(null);
  const [wizardSelectedBoothSlot, setWizardSelectedBoothSlot] = useState<BoothSubType | null>(null);

  // Helper to manage Ticket Quantities
  const handleTicketQuantityChange = (ticketId: string, variantName: string, delta: number) => {
    const key = `${ticketId}__${variantName}`;
    const currentQty = ticketQuantities[key] || 0;
    const nextQty = Math.max(0, currentQty + delta);

    // Create proposed state
    const nextState = { ...ticketQuantities };
    if (nextQty === 0) {
      delete nextState[key];
    } else {
      nextState[key] = nextQty;
    }

    // Validate: Accompanying <= Ticket
    let ticketCount = 0;
    let accompanyingCount = 0;

    Object.entries(nextState).forEach(([k, qty]) => {
      const [, vName] = k.split('__');
      const vNameLower = vName.toLowerCase();

      if (vNameLower.includes("meeting package")) return;

      if (vNameLower.includes("accompanying")) {
        accompanyingCount += qty;
      } else if (vNameLower.includes("ticket") || vNameLower.includes("regular")) {
        ticketCount += qty;
      }
    });

    if (accompanyingCount > ticketCount) {
      // Identify which action caused this to give a nice error message
      if (variantName.toLowerCase().includes("accompanying")) {
        toast.error("Accompanying members cannot exceed the number of tickets.");
      } else {
        toast.error("Cannot reduce tickets below the number of accompanying members.");
      }
      return;
    }

    setTicketQuantities(nextState);
  };

  const totalTicketsSelected = Object.values(ticketQuantities).reduce((a, b) => a + b, 0);

  const sponsorsByType = useMemo(() => {
    if (!eventData?.purchaseOrders) return {};

    const groups: Record<string, any[]> = {};

    eventData.purchaseOrders.forEach((po: any) => {
      if (!po.company || po.status !== 'COMPLETED') return;

      if (Array.isArray(po.items)) {
        po.items.forEach((item: any) => {
          if (item.productType === 'SPONSOR') {
            const typeName = item.name;
            if (!groups[typeName]) {
              groups[typeName] = [];
            }
            // Check if company already added to this group (in case of multiple same items? unlikely but good safety)
            if (!groups[typeName].some(c => c.id === po.company.id)) {
              groups[typeName].push(po.company);
            }
          }
        });
      }
    });
    return groups;
  }, [eventData?.purchaseOrders]);

  const handleSponsorQuantityChange = (sponsorTypeId: string, delta: number) => {
    const currentQty = sponsorQuantities[sponsorTypeId] || 0;
    const nextQty = Math.max(0, currentQty + delta);

    const nextState = { ...sponsorQuantities };
    if (nextQty === 0) {
      delete nextState[sponsorTypeId];
    } else {
      nextState[sponsorTypeId] = nextQty;
    }
    setSponsorQuantities(nextState);
  };

  const getSponsorSubtotal = () => {
    let total = 0;
    Object.entries(sponsorQuantities).forEach(([id, qty]) => {
      const sp = eventSponsorTypes.find(s => s.sponsorType.id === id);
      if (sp) {
        total += sp.sponsorType.price * qty;
      }
    });
    return total;
  };

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
        if (variant) {
          price = getEffectiveTicketPrice({ price: variant.price, sellingPrice: null });
        }
      } else {
        price = getEffectiveTicketPrice({ price: parent.ticket.price, sellingPrice: parent.ticket.sellingPrice, id: parent.ticket.id });
      }
      total += price * qty;
    });
    return total;
  };

  // Helper: Get effective ticket price
  const getEffectiveTicketPrice = (ticket: { price: number; sellingPrice?: number | null, id?: string }) => {
    // Rule: If ticket price is 750 (Standard) OR 850 (Base) -> and user is Paid Member -> 650
    const isStandard = ticket.price === 750 || ticket.price === 850 || ticket.sellingPrice === 750;
    const isPaidMember = currentUserMembership && ["silver", "gold", "platinum", "diamond"].some(m => currentUserMembership.toLowerCase().includes(m));

    if (isStandard && isPaidMember) {
      return 650;
    }
    return ticket.sellingPrice ?? ticket.price;
  };

  // Helper: Get effective sponsor price (Early Bird + Member Discount)
  const getEffectiveSponsorPrice = (sponsorType: { id: string; price: number }) => {
    const isPaidMember = currentUserMembership && ["silver", "gold", "platinum", "diamond"].some(m => currentUserMembership.toLowerCase().includes(m));

    // 1. Early Bird Override (50% OFF)
    if (eventData?.earlyBird && isPaidMember) {
      return sponsorType.price * 0.5;
    }

    // 2. Best Offer found
    const best = getBestOfferForItem("SPONSOR", sponsorType.id);
    if (best.percent && best.percent > 0) {
      return getDiscountedPrice(sponsorType.price, best.percent);
    }

    return sponsorType.price;
  };

  // Prevent body scroll when wizard is open
  useEffect(() => {
    if (wizardOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [wizardOpen]);

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
            console.log("Fetching company data for companyId:", user.companyId);
            const compRes = await fetch(`/api/companies/${user.companyId}`);
            if (compRes.ok) {
              const compData = await compRes.json();
              console.log("Company data:", compData);

              let membershipName = null;
              let discount = null;

              // Try new membershipPlan first
              if (compData.membershipPlan?.name) {
                membershipName = compData.membershipPlan.name;
                discount = compData.membershipPlan.discountPercentage;
                console.log("Membership plan name:", membershipName);
              }
              // Fallback to legacy purchasedMembership field
              else if (compData.purchasedMembership) {
                membershipName = compData.purchasedMembership;
                console.log("Legacy membership name:", membershipName);

                // Map legacy membership names to discount percentages
                const legacyDiscounts: Record<string, number> = {
                  "Silver": 10,
                  "Gold": 15,
                  "Platinum": 20,
                  "Diamond": 25,
                };

                const membershipLower = membershipName.toLowerCase();
                for (const [key, value] of Object.entries(legacyDiscounts)) {
                  if (membershipLower.includes(key.toLowerCase())) {
                    discount = value;
                    break;
                  }
                }
              }

              if (membershipName) {
                setCurrentUserMembership(membershipName);
              }

              console.log("Discount percentage:", discount);
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
                console.log("Membership offer added:", membershipOffer);
              }
            } else {
              console.warn("Failed to fetch company data:", compRes.status);
            }
          } catch (e) {
            console.error("Failed to fetch membership discount", e);
          }
        } else {
          console.log("No companyId found for user");
        }

        console.log("Final offers array:", data);
        setOffers(data || []);
      } catch (err) {
        console.error("Failed to load offers", err);
        setOffers([]);
      } finally {
        setOffersLoading(false);
      }
    };

    console.log("User object:", user);
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



  const tabs = ["Tickets", "Agenda", "About", "About Venue", "Event Sponsors"];

  // Helper: determine best applicable offer for a product
  function getBestOfferForItem(
    productType: string,
    productId: string
  ): { percent: number | null; name?: string | null } {
    if (!offers || offers.length === 0) return { percent: null };

    const now = new Date();
    const applicable: Offer[] = offers.filter((o) => {
      if (!o.isActive) return false;
      if (o.startsAt && new Date(o.startsAt) > now) return false;
      if (o.endsAt && new Date(o.endsAt) < now) return false;

      // Exclude tickets from ALL scope offers (membership discounts)
      if (o.scope === "ALL" && productType === "TICKET") return false;
      // Exclude sponsors from ALL scope offers (membership discounts) when early bird is active
      if (o.scope === "ALL" && productType === "SPONSOR" && eventData?.earlyBird) return false;
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

  // --- BUY NOW HANDLER (opens sponsorship popup) ---
  const handleBuyNow = (ticketItem: { id: string, name: string, price: number, originalPrice: number, image: string | null }, quantity: number) => {
    // Add ticket to cart first
    handleDirectTicketAdd(ticketItem, quantity);
    // Open sponsorship popup
    setSponsorshipPopupOpen(true);
  };

  // --- DIRECT TICKET ADD HANDLER ---
  const handleDirectTicketAdd = (ticketItem: { id: string, name: string, price: number, originalPrice: number, image: string | null }, quantity: number) => {
    // 1. Add the Ticket
    for (let i = 0; i < quantity; i++) {
      addToCart({
        productId: ticketItem.id,
        productType: "TICKET",
        name: ticketItem.name,
        price: ticketItem.price,
        originalPrice: ticketItem.originalPrice,
        image: ticketItem.image || undefined
      });
    }

    // 2. Determine Complimentary Room Eligibility
    const lowerName = ticketItem.name.toLowerCase();
    const isMeetingPackage = lowerName.includes("meeting package");
    const isAccompanying = lowerName.includes("accompanying");

    if (!isMeetingPackage && !isAccompanying) {
      if (hotels.length > 0) {
        const hotel = hotels[0];
        const deluxeRoom = hotel.roomTypes.find(rt => rt.roomType.toLowerCase().includes("deluxe")) || hotel.roomTypes[0];

        if (deluxeRoom) {
          for (let i = 0; i < quantity; i++) {
            addToCart({
              productId: hotel.id,
              roomTypeId: deluxeRoom.id,
              productType: "HOTEL",
              name: `Hotel - ${deluxeRoom.roomType} (Complimentary)`,
              price: 0,
              originalPrice: deluxeRoom.price,
              image: hotel.image || undefined
            });
          }
          toast.success(`Bonus: ${quantity} Complimentary Room(s) added!`);
        }
      }
    } else {
      toast.success(`${quantity} x ${ticketItem.name} added to cart!`);
    }
  };

  // --- BOOKING WIZARD LOGIC ---

  // --- BOOKING WIZARD LOGIC ---

  const openBookingWizard = () => {
    // Reset or Keep? Usually fresh start is better.
    setTicketQuantities({});
    setWizardSelectedBooth(null); // Reset booth
    setWizardSelectedBoothSlot(null); // Reset slot
    setBookingStep("TICKET");
    setSponsorQuantities({});
    setFocusedTicketName(null);
    setWizardOpen(true);
  };

  const closeWizard = () => {
    setWizardOpen(false);
    setTicketQuantities({});
    setSponsorQuantities({});
    setWizardSelectedBooth(null);
    setWizardSelectedBoothSlot(null);
    setFocusedTicketName(null);
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
          price = getEffectiveTicketPrice({ price: variant.price, sellingPrice: null });
          originalPrice = variant.price;
        }
      } else {
        price = getEffectiveTicketPrice({ price: parent.ticket.price, sellingPrice: parent.ticket.sellingPrice, id: parent.ticket.id });
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


    // 2. Add Selected Sponsors
    Object.entries(sponsorQuantities).forEach(([id, qty]) => {
      const sp = eventSponsorTypes.find(s => s.sponsorType.id === id);
      if (sp) {
        const effectivePrice = getEffectiveSponsorPrice(sp.sponsorType);
        for (let i = 0; i < qty; i++) {
          addToCart({
            productId: sp.sponsorType.id,
            productType: "SPONSOR",
            name: sp.sponsorType.name,
            price: effectivePrice,
            originalPrice: sp.sponsorType.price,
            image: sp.sponsorType.image || undefined,
          });
        }
      }
    });

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
              name: `Hotel - ${deluxeRoom.roomType} (Complimentary)`,
              price: 0,
              originalPrice: deluxeRoom.price,
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
    // Redirect to checkout page
    router.push(`/event/${resolvedParams.id}/checkout`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* --- SPONSORSHIP POPUP (Buy Now) --- */}
      {sponsorshipPopupOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn overflow-y-auto"
          onClick={() => {
            // Close popup and go to checkout when clicking outside
            setSponsorshipPopupOpen(false);
            setSelectedSponsorInPopup(null);
            router.push(`/event/${resolvedParams.id}/checkout`);
          }}
        >
          <div
            className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            {/* Header */}
            <div className="relative p-8 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 overflow-hidden">
              <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
              <div className="relative z-10">
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                  Early Bird Offers!
                </h2>
                <p className="text-white/90 text-lg">
                  Check out our sponsorship packages for <span className="font-bold text-yellow-300">50% off</span> and <span className="font-bold text-yellow-300">FREE tickets!</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setSponsorshipPopupOpen(false);
                  setSelectedSponsorInPopup(null);
                  router.push(`/event/${resolvedParams.id}/checkout`);
                }}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors z-20"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* Sponsors Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {eventSponsorTypes.map(({ sponsorType }) => {
                  const effectivePrice = getEffectiveSponsorPrice(sponsorType);
                  const hasDiscount = effectivePrice < sponsorType.price;
                  const discountPercent = hasDiscount ? Math.round(((sponsorType.price - effectivePrice) / sponsorType.price) * 100) : 0;
                  const isSelected = selectedSponsorInPopup === sponsorType.id;

                  // Determine free tickets
                  let freeTickets = 0;
                  const sName = sponsorType.name.toLowerCase();
                  if (sName.includes("title sponsor")) freeTickets = 3;
                  else if (sName.includes("gala dinner")) freeTickets = 2;
                  else if (sName.includes("welcome cocktail")) freeTickets = 2;
                  else if (sName.includes("t shirts") || sName.includes("t-shirt")) freeTickets = 1;

                  return (
                    <div
                      key={sponsorType.id}
                      onClick={() => setSelectedSponsorInPopup(sponsorType.id)}
                      className={`cursor-pointer border-2 rounded-xl p-5 transition-all relative group ${isSelected
                        ? 'border-emerald-500 bg-emerald-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-emerald-300 hover:shadow-md'
                        }`}
                    >
                      {hasDiscount && (
                        <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10">
                          {discountPercent}% OFF
                        </div>
                      )}

                      {isSelected && (
                        <div className="absolute top-3 left-3 bg-emerald-500 text-white rounded-full p-1 shadow-lg z-10">
                          <Check className="h-4 w-4" />
                        </div>
                      )}

                      <div className="h-20 w-full bg-gray-100 rounded-lg mb-4 overflow-hidden flex items-center justify-center">
                        {sponsorType.image ? (
                          <img src={sponsorType.image} alt={sponsorType.name} className="h-full w-full object-contain p-2" />
                        ) : (
                          <span className="text-gray-400 font-bold text-3xl">{sponsorType.name.charAt(0)}</span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-gray-900 mb-2 line-clamp-2">{sponsorType.name}</h4>

                      <div className="flex flex-col gap-1 mb-3">
                        {hasDiscount ? (
                          <>
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-bold text-emerald-600">${formatPrice(effectivePrice)}</span>
                              <span className="text-sm text-gray-400 line-through">${sponsorType.price.toLocaleString()}</span>
                            </div>
                            <span className="text-xs text-green-600 font-semibold">
                              Save ${(sponsorType.price - effectivePrice).toFixed(0)}
                            </span>
                          </>
                        ) : (
                          <span className="text-xl font-bold text-gray-800">${sponsorType.price.toLocaleString()}</span>
                        )}
                      </div>

                      {freeTickets > 0 && (
                        <div className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
                          <span>🎟️</span> {freeTickets} Free Ticket{freeTickets > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setSponsorshipPopupOpen(false);
                  setSelectedSponsorInPopup(null);
                  router.push(`/event/${resolvedParams.id}/checkout`);
                }}
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-gray-700 transition-all"
              >
                Skip & Checkout
              </button>
              <button
                onClick={() => {
                  if (selectedSponsorInPopup) {
                    // Add selected sponsor to cart
                    const sponsor = eventSponsorTypes.find(s => s.sponsorType.id === selectedSponsorInPopup);
                    if (sponsor) {
                      const effectivePrice = getEffectiveSponsorPrice(sponsor.sponsorType);

                      // Add sponsor
                      addToCart({
                        productId: sponsor.sponsorType.id,
                        productType: "SPONSOR",
                        name: sponsor.sponsorType.name,
                        price: effectivePrice,
                        originalPrice: sponsor.sponsorType.price,
                        image: sponsor.sponsorType.image || undefined,
                      });

                      // Add complimentary tickets
                      let freeTickets = 0;
                      const sName = sponsor.sponsorType.name.toLowerCase();
                      if (sName.includes("title sponsor")) freeTickets = 3;
                      else if (sName.includes("gala dinner")) freeTickets = 2;
                      else if (sName.includes("welcome cocktail")) freeTickets = 2;
                      else if (sName.includes("t shirts") || sName.includes("t-shirt")) freeTickets = 1;

                      if (freeTickets > 0) {
                        // 1. Add free tickets FIRST to ensure validTicketCount stays > 0
                        // This prevents Accompanying Members from being auto-removed by CartContext dependency logic
                        const standardTicket = eventTickets.find(et =>
                          (et.ticket.name.toLowerCase().includes("regular") ||
                            et.ticket.name.toLowerCase().includes("standard") ||
                            et.ticket.name.toLowerCase().includes("ticket")) &&
                          !et.ticket.name.toLowerCase().includes("accompanying") &&
                          !et.ticket.name.toLowerCase().includes("meeting package")
                        );

                        if (standardTicket) {
                          for (let i = 0; i < freeTickets; i++) {
                            addToCart({
                              productId: standardTicket.ticket.id,
                              productType: "TICKET",
                              name: `${standardTicket.ticket.name} (Complimentary)`,
                              price: 0,
                              originalPrice: standardTicket.ticket.price,
                              image: standardTicket.ticket.logo || undefined,
                              isComplimentary: true,
                              linkedSponsorId: sponsor.sponsorType.id,
                            });
                          }

                          // 2. Remove existing paid tickets to avoid double charging
                          // Only do this if we successfully added the free tickets
                          let ticketsToDeduct = freeTickets;
                          const paidTickets = cart.filter(item =>
                            item.productType === "TICKET" &&
                            !item.isComplimentary &&
                            (item.name.toLowerCase().includes("regular") || item.name.toLowerCase().includes("ticket")) &&
                            !item.name.toLowerCase().includes("accompanying") &&
                            !item.name.toLowerCase().includes("meeting package")
                          );

                          for (const paidTicket of paidTickets) {
                            if (ticketsToDeduct <= 0) break;
                            const qtyToRemove = Math.min(paidTicket.quantity, ticketsToDeduct);
                            // Update quantity (0 will remove it)
                            updateQuantity(paidTicket.productId, paidTicket.quantity - qtyToRemove, paidTicket.roomTypeId, paidTicket.isComplimentary, paidTicket.linkedSponsorId);
                            ticketsToDeduct -= qtyToRemove;
                          }
                        }
                      }

                      toast.success(`${sponsor.sponsorType.name} added to cart!`);
                    }
                  }
                  setSponsorshipPopupOpen(false);
                  setSelectedSponsorInPopup(null);
                  router.push(`/event/${resolvedParams.id}/checkout`);
                }}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedSponsorInPopup}
              >
                {selectedSponsorInPopup ? "Proceed to Checkout" : "Select a Sponsor"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <div className={`h-2 w-12 rounded-full ${bookingStep === 'SPONSOR' ? 'bg-[#004aad]' : 'bg-[#004aad]/30'}`} />
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
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">Select Ticket Type</h3>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={closeWizard}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                        title="Back"
                      >
                        <ArrowLeft size={20} />
                      </button>
                      <button
                        onClick={() => {
                          let hasRegularTicket = false;
                          Object.entries(ticketQuantities).forEach(([key, qty]) => {
                            const [, vName] = key.split('__');
                            if (vName.toLowerCase().includes("ticket") && !vName.toLowerCase().includes("accompanying")) {
                              hasRegularTicket = true;
                            }
                          });
                          if (!hasRegularTicket) {
                            handleWizardAddToCart();
                          } else {
                            setBookingStep("SPONSOR");
                          }
                        }}
                        disabled={totalTicketsSelected === 0}
                        className="px-6 py-2 bg-[#004aad] text-white rounded-lg font-bold hover:bg-[#00317a] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Register Now
                      </button>
                    </div>
                  </div>
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

                      const ticketStock = option.parentTicket && (option.parentTicket as any).quantity !== undefined ? (option.parentTicket as any).quantity : 999;
                      const isSoldOut = ticketStock <= 0;

                      // Pricing Override
                      const effectivePrice = getEffectiveTicketPrice({
                        price: option.originalPrice,
                        sellingPrice: option.sellingPrice,
                        id: option.id
                      });
                      const showStrike = effectivePrice < option.originalPrice;
                      const isMemberPrice = effectivePrice === 650 && option.originalPrice === 750;

                      return (
                        <div
                          key={key}
                          onClick={() => {
                            // Just focus the ticket policy
                            setFocusedTicketName(option.name);
                          }}
                          className={`rounded-xl border-2 p-6 transition-all flex flex-col h-full bg-white cursor-pointer ${qty > 0 || focusedTicketName === option.name ? 'border-[#004aad] ring-2 ring-blue-100' : 'border-gray-100 hover:border-blue-200'} ${isSoldOut ? 'opacity-70 grayscale bg-gray-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex-grow">
                            <div className="mb-2 font-bold text-gray-500 uppercase text-xs tracking-wider">
                              {option.parentTicket.name !== option.name ? option.parentTicket.name : 'Standard'}
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 mb-1 leading-tight">{option.name}</h4>
                            {isSoldOut ? (
                              <div className="mt-2 mb-2 inline-block bg-gray-600 text-white text-xs font-bold px-2 py-1 rounded">SOLD OUT</div>
                            ) : showStrike ? (
                              <div className="flex flex-col">
                                <span className="text-sm text-gray-400 line-through">${option.originalPrice.toLocaleString()}</span>
                                <span className="text-2xl font-bold text-[#004aad]">${effectivePrice.toLocaleString()}</span>
                                {isMemberPrice && <span className="mt-1 text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full w-fit">Member Price</span>}
                              </div>
                            ) : (
                              <p className="text-2xl font-bold text-[#004aad]">${effectivePrice.toLocaleString()}</p>
                            )}
                          </div>

                          {/* Features Badges */}
                          {option.parentTicket?.features && option.parentTicket.features.length > 0 && (
                            <div className="mt-4 space-y-1">
                              {option.parentTicket.features.slice(0, 4).map((feature: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 text-xs text-gray-700">
                                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                  </div>
                                  <span className="font-medium">{feature}</span>
                                </div>
                              ))}
                              {option.parentTicket.features.length > 4 && (
                                <div className="text-xs text-gray-500 font-semibold ml-6">
                                  +{option.parentTicket.features.length - 4} more features
                                </div>
                              )}
                            </div>
                          )}

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
                              className={`p-2 rounded-md transition-colors ${isSoldOut ? 'text-gray-300 cursor-not-allowed' : 'bg-white text-gray-700 shadow-sm hover:text-[#004aad] hover:bg-white'}`}
                              disabled={isSoldOut}
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
                        let isAccompanying = false;

                        // Priority: Focused Ticket -> Selected Quantities
                        if (focusedTicketName) {
                          const lower = focusedTicketName.toLowerCase();
                          if (lower.includes('meeting package')) hasExcluded = true;
                          else {
                            hasIncluded = true;
                            if (lower.includes('accompanying')) isAccompanying = true;
                          }
                        } else {
                          Object.entries(ticketQuantities).forEach(([key, qty]) => {
                            if (qty > 0) {
                              const lower = key.toLowerCase();
                              if (lower.includes('meeting package')) hasExcluded = true;
                              // Assume others (Ticket, Accompanying) include accommodation
                              else {
                                hasIncluded = true;
                                if (lower.includes('accompanying')) isAccompanying = true;
                              }
                            }
                          });
                        }

                        // If nothing focused AND nothing selected, show default (Included)
                        const noSelection = !hasIncluded && !hasExcluded;
                        const showIncluded = hasIncluded || noSelection;
                        const showExcluded = hasExcluded; // Only show excluded if explicitly triggered

                        return (
                          <div className="space-y-4">
                            {showIncluded && (
                              <div className="flex gap-3 animate-fadeIn">
                                <div className="mt-1 bg-emerald-100 text-emerald-600 rounded-full p-1 h-fit"><Check size={14} /></div>
                                <div>
                                  <span className="font-bold text-gray-800 block mb-1">Accommodation Included:</span>
                                  Registration fees includes <span className="font-semibold text-gray-900">2 nights (March 25 & 26) stay</span> at the conference hotel with breakfast and access to all Sessions, two lunches, Dinners, Refreshment, Welcome cocktail, Gala Dinner and Conference material.
                                  {isAccompanying && (
                                    <span className="block mt-2 text-amber-700 font-medium animate-fadeIn">Note: Accompanying member cannot be added separately; it is added only when buying a regular ticket.</span>
                                  )}
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

              {/* STEP 2: SELECT SPONSOR (OPTIONAL) */}
              {bookingStep === "SPONSOR" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">Select Sponsorship (Optional)</h3>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setBookingStep("TICKET")}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                        title="Back"
                      >
                        <ArrowLeft size={20} />
                      </button>
                      <button
                        onClick={handleWizardAddToCart}
                        className="px-6 py-2 bg-[#004aad] text-white rounded-lg font-bold hover:bg-[#00317a] transition-all text-sm"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {eventSponsorTypes.map(({ sponsorType }) => {
                      const qty = sponsorQuantities[sponsorType.id] || 0;

                      const effectivePrice = getEffectiveSponsorPrice(sponsorType);
                      const hasDiscount = effectivePrice < sponsorType.price;
                      // Calculate percent for badge
                      const percentOff = hasDiscount ? ((sponsorType.price - effectivePrice) / sponsorType.price) * 100 : 0;

                      return (
                        <div key={sponsorType.id} className={`rounded-xl border-2 p-6 transition-all flex flex-col h-full bg-white relative ${qty > 0 ? 'border-[#004aad] ring-2 ring-blue-100' : 'border-gray-100 hover:border-blue-200'}`}>
                          {/* Discount Badge */}
                          {hasDiscount && (
                            <div className="absolute top-3 right-3 z-10 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                              {Math.round(percentOff)}% OFF
                            </div>
                          )}

                          <div className="flex-grow">
                            <div className="h-24 w-full bg-gray-100 rounded-lg mb-4 overflow-hidden flex items-center justify-center">
                              {sponsorType.image ? (
                                <img src={sponsorType.image} alt={sponsorType.name} className="h-full w-full object-contain" />
                              ) : (
                                <span className="text-gray-400 font-bold text-2xl">{sponsorType.name.charAt(0)}</span>
                              )}
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 mb-1">{sponsorType.name}</h4>

                            {/* Price Display with Discount */}
                            {hasDiscount ? (
                              <div className="flex flex-col">
                                <span className="text-sm text-gray-400 line-through">${sponsorType.price.toLocaleString()}</span>
                                <span className="text-2xl font-bold text-[#004aad]">${formatPrice(effectivePrice)}</span>
                              </div>
                            ) : (
                              <p className="text-2xl font-bold text-[#004aad]">${sponsorType.price.toLocaleString()}</p>
                            )}
                          </div>

                          <div className="mt-6 flex items-center justify-between bg-gray-50 rounded-lg p-1 border border-gray-200">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleSponsorQuantityChange(sponsorType.id, -1); }}
                              className={`p-2 rounded-md transition-colors ${qty === 0 ? 'text-gray-300 cursor-not-allowed' : 'bg-white text-gray-700 shadow-sm hover:text-[#004aad]'}`}
                              disabled={qty === 0}
                            >
                              <Minus size={16} />
                            </button>
                            <span className={`font-bold text-lg w-8 text-center ${qty > 0 ? 'text-[#004aad]' : 'text-gray-400'}`}>{qty}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleSponsorQuantityChange(sponsorType.id, 1); }}
                              className="p-2 rounded-md transition-colors bg-white text-gray-700 shadow-sm hover:text-[#004aad] hover:bg-white"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: SUMMARY */}
              {bookingStep === "SUMMARY" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">Confirm Your Selection</h3>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setBookingStep("SPONSOR")}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                        title="Back"
                      >
                        <ArrowLeft size={20} />
                      </button>
                      <button
                        onClick={handleWizardAddToCart}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-200 text-sm"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
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
                          if (variant) {
                            price = getEffectiveTicketPrice({ price: variant.price, sellingPrice: null });
                          }
                        } else {
                          price = getEffectiveTicketPrice({ price: parent.ticket.price, sellingPrice: parent.ticket.sellingPrice, id: parent.ticket.id });
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
                    {Object.entries(sponsorQuantities).length > 0 ? (
                      <div className="pb-4 border-b border-gray-200 space-y-3 pt-4">
                        <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Selected Sponsor Packages</h4>
                        {Object.entries(sponsorQuantities).map(([id, qty]) => {
                          const sp = eventSponsorTypes.find(s => s.sponsorType.id === id);
                          if (!sp) return null;
                          const effectivePrice = getEffectiveSponsorPrice(sp.sponsorType);
                          return (
                            <div key={id} className="flex justify-between items-center">
                              <div>
                                <p className="font-bold text-gray-900">{sp.sponsorType.name} <span className="text-gray-500 text-xs font-normal">x {qty}</span></p>
                              </div>
                              <p className="font-bold text-[#004aad]">${(effectivePrice * qty).toLocaleString()}</p>
                            </div>
                          )
                        })}
                      </div>
                    ) : null}
                    <div className="flex justify-between items-center pt-4 border-t-2 border-dashed border-gray-200">
                      <p className="font-extrabold text-lg">Total</p>
                      <p className="font-extrabold text-xl text-[#004aad]">
                        ${(getTicketSubtotal() + getSponsorSubtotal()).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}


            </div>
          </div>
        </div>
      )}

      {/* --- VENUE GALLERY MODAL --- */}
      {venueGalleryOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn" onClick={() => setVenueGalleryOpen(false)}>
          <div className="relative w-full max-w-5xl bg-transparent p-0" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setVenueGalleryOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X size={32} />
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {VENUE_IMAGES.map((img, idx) => (
                <div key={idx} className="aspect-video rounded-xl overflow-hidden shadow-2xl border border-white/10 group">
                  <img
                    src={img}
                    alt={`Venue ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- HERO SECTION --- */}
      <div className="relative h-[400px] w-full overflow-hidden">
        <img
          src={id === "cmjn1f6ih0000gad4xa4j7dp3" ? "/images/event-bangkok-hero.png" : (thumbnail || "/images/h-Bangkok5.jpg")}
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
          <div className="flex flex-wrap items-center gap-6 mt-1">
            <p className="text-white/90 text-xl font-light flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {format(parseISO(startDate), "MMMM d, yyyy")} - {format(parseISO(endDate), "MMMM d, yyyy")}
            </p>
            <div className="hidden md:block h-6 w-px bg-white/30"></div>
            <p className="text-white/90 text-xl font-light flex items-center gap-2">
              <Users className="h-5 w-5" />
              Expected Audience: {expectedAudience} Attendees
            </p>
          </div>
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

            {activeTab === "Event Sponsors" && (
              <Section title="Event Sponsors">
                {Object.keys(sponsorsByType).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center animate-fadeIn">
                    <div className="bg-gray-50 p-6 rounded-full mb-4">
                      <ShieldCheck className="w-12 h-12 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Be our first sponsor!</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Showcase your brand to industry leaders. Contact us to learn about sponsorship opportunities.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-12 animate-fadeIn">
                    {Object.entries(sponsorsByType).map(([typeName, companies]) => (
                      <div key={typeName}>
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                          <div className="h-8 w-1.5 bg-[#004aad] rounded-full"></div>
                          {typeName}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {companies.map((company: any) => (
                            <div
                              key={company.id}
                              className="group relative bg-white rounded-2xl p-6 flex flex-col items-center text-center shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
                            >
                              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#004aad] to-indigo-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

                              <div className="w-28 h-28 mb-6 relative rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm flex items-center justify-center group-hover:border-[#004aad]/20 transition-colors">
                                {company.logoUrl ? (
                                  <img src={company.logoUrl} alt={company.name} className="w-full h-full object-contain p-3" />
                                ) : company.media?.find((m: any) => m.type === 'LOGO') ? (
                                  <img src={company.media.find((m: any) => m.type === 'LOGO').url} alt={company.name} className="w-full h-full object-contain p-3" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-[#004aad] bg-gradient-to-br from-blue-50 to-indigo-50">
                                    {company.name.charAt(0)}
                                  </div>
                                )}
                              </div>

                              <h4 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-[#004aad] transition-colors">{company.name}</h4>

                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            )}

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
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                console.log("Opening gallery");
                                setVenueGalleryOpen(true);
                              }}
                              className="ml-4 inline-block mt-4 text-[#004aad] font-bold text-sm hover:underline cursor-pointer"
                            >
                              + More Photos
                            </button>
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

            {activeTab === "Tickets" && (
              <div className="animate-fadeIn space-y-8">
                {/* Tickets Section */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Available Tickets</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {eventTickets
                      .sort((a, b) => {
                        // Sort by price descending (highest first)
                        const priceA = a.ticket.sellingPrice ?? a.ticket.price;
                        const priceB = b.ticket.sellingPrice ?? b.ticket.price;
                        return priceB - priceA;
                      })
                      .flatMap(({ ticket, quantity }) => {
                        const variants = TICKET_VARIANTS[ticket.name];
                        const isSoldOut = quantity <= 0;

                        if (variants && variants.length > 0) {
                          return variants.map(variant => {
                            const best = getBestOfferForItem("TICKET", ticket.id);
                            const effectivePrice = getEffectiveTicketPrice({
                              price: variant.price,
                              sellingPrice: null
                            });
                            const hasDiscount = effectivePrice < variant.price || (best.percent && best.percent > 0);

                            return (
                              <PriceCard
                                key={`${ticket.id}-${variant.name}`}
                                item={{
                                  id: ticket.id,
                                  name: variant.name,
                                  image: ticket.logo,
                                  price: effectivePrice,
                                  originalPrice: variant.price,
                                  features: ticket.features,
                                }}
                                productType="TICKET"
                                actionText="Buy Now"
                                offerPercent={best.percent ?? undefined}
                                offerName={best.name}
                                isSoldOut={isSoldOut}
                                onAddToCart={(qty) => handleDirectTicketAdd({
                                  id: ticket.id,
                                  name: variant.name,
                                  price: effectivePrice,
                                  originalPrice: variant.price,
                                  image: ticket.logo,
                                }, qty)}
                                onBuyNow={(qty) => handleBuyNow({
                                  id: ticket.id,
                                  name: variant.name,
                                  price: effectivePrice,
                                  originalPrice: variant.price,
                                  image: ticket.logo,
                                }, qty)}
                                eventId={id}
                              />
                            );
                          });
                        }

                        const best = getBestOfferForItem("TICKET", ticket.id);
                        const effectivePrice = getEffectiveTicketPrice({
                          price: ticket.price,
                          sellingPrice: ticket.sellingPrice,
                          id: ticket.id
                        });

                        return (
                          <PriceCard
                            key={ticket.id}
                            item={{
                              id: ticket.id,
                              name: ticket.name,
                              image: ticket.logo,
                              price: effectivePrice,
                              originalPrice: ticket.price,
                              features: ticket.features,
                            }}
                            productType="TICKET"
                            actionText="Buy Now"
                            offerPercent={best.percent ?? undefined}
                            offerName={best.name}
                            isSoldOut={isSoldOut}
                            onAddToCart={(qty) => handleDirectTicketAdd({
                              id: ticket.id,
                              name: ticket.name,
                              price: effectivePrice,
                              originalPrice: ticket.price,
                              image: ticket.logo,
                            }, qty)}
                            onBuyNow={(qty) => handleBuyNow({
                              id: ticket.id,
                              name: ticket.name,
                              price: effectivePrice,
                              originalPrice: ticket.price,
                              image: ticket.logo,
                            }, qty)}
                            eventId={id}
                          />
                        );
                      })}
                  </div>
                </div>


              </div>
            )}



            {/* --- Sponsorship Opportunities (Restored) --- */}
            {activeTab === "Tickets" && eventSponsorTypes.length > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-100">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <div className="h-8 w-1.5 bg-[#004aad] rounded-full"></div>
                  Sponsorship Opportunities
                </h3>

                <div className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {eventSponsorTypes.map(({ sponsorType }) => {
                      const qty = sponsorQuantities[sponsorType.id] || 0;
                      const effectivePrice = getEffectiveSponsorPrice(sponsorType);

                      // Calculate discount percentage for badge display
                      const hasDiscount = effectivePrice < sponsorType.price;
                      const discountPercent = hasDiscount ? ((sponsorType.price - effectivePrice) / sponsorType.price) * 100 : null;

                      // Custom Handler for Free Tickets Logic
                      const handleSponsorAdd = (quantityToAdd: number) => {
                        console.log('handleSponsorAdd called', { sponsorType: sponsorType.name, quantityToAdd });

                        // 1. Add the Sponsor Item itself
                        for (let i = 0; i < quantityToAdd; i++) {
                          addToCart({
                            productId: sponsorType.id,
                            productType: "SPONSOR",
                            name: sponsorType.name,
                            price: effectivePrice,
                            originalPrice: sponsorType.price,
                            image: sponsorType.image || undefined,
                          });
                        }

                        // 2. Determine Free Tickets
                        let freeTickets = 0;
                        const sName = sponsorType.name.toLowerCase();
                        console.log('Checking sponsor name:', sName);

                        if (sName.includes("title sponsor")) freeTickets = 3;
                        else if (sName.includes("gala dinner")) freeTickets = 2;
                        else if (sName.includes("welcome cocktail")) freeTickets = 2;
                        else if (sName.includes("t shirts") || sName.includes("t-shirt")) freeTickets = 1;

                        console.log('Free tickets determined:', freeTickets);

                        if (freeTickets > 0) {
                          const totalFree = freeTickets * quantityToAdd;

                          // Find a Standard Ticket to add as free
                          const standardTicket = eventTickets.find(et =>
                            et.ticket.name.toLowerCase().includes("regular") ||
                            et.ticket.name.toLowerCase().includes("standard") ||
                            et.ticket.name.toLowerCase().includes("ticket")
                          );

                          console.log('Standard ticket found:', standardTicket?.ticket.name);

                          if (standardTicket) {
                            // Add Free Tickets
                            for (let i = 0; i < totalFree; i++) {
                              addToCart({
                                productId: standardTicket.ticket.id,
                                productType: "TICKET",
                                name: `Hotel - ${standardTicket.ticket.name} (Complimentary)`,
                                price: 0, // FREE
                                originalPrice: standardTicket.ticket.price, // Show value
                                image: standardTicket.ticket.logo || undefined,
                                isComplimentary: true,
                                linkedSponsorId: sponsorType.id,
                              });
                            }
                            toast.success(`Bonus: Added ${totalFree} free tickets!`);
                          } else {
                            console.warn('No standard ticket found!');
                          }
                        }
                      };

                      return (
                        <PriceCard
                          key={sponsorType.id}
                          item={{
                            ...sponsorType,
                            // Pass original price, let PriceCard handle the discount
                            price: sponsorType.price,
                            originalPrice: sponsorType.price,
                            features: sponsorType.features,
                          }}
                          productType="SPONSOR"
                          actionText="Buy Now"
                          offerPercent={discountPercent ?? undefined}
                          offerName={hasDiscount ? (eventData?.earlyBird ? "Early Bird Special" : "Member Discount") : undefined}
                          onAddToCart={handleSponsorAdd}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "About Venue" && (
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
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setVenueGalleryOpen(true);
                              }}
                              className="bg-gray-100 rounded-lg h-32 w-full flex items-center justify-center text-gray-400 font-medium hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                              + More Photos
                            </button>
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
                                        <p className={`font-bold text-lg ${rt.eventRoomTypes[0]?.quantity <= 0 ? 'text-gray-500' : 'text-gray-800'}`}>
                                          {rt.roomType}
                                          {rt.eventRoomTypes[0]?.quantity <= 0 ? (
                                            <span className="ml-2 bg-gray-600 text-white text-xs px-2 py-0.5 rounded-full uppercase tracking-wide">Sold Out</span>
                                          ) : (
                                            <span className="text-sm text-[#004aad] ml-2 font-normal">(Comes along with the ticket)</span>
                                          )}
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
                                      <p className={`font-bold text-xl hidden sm:block mb-2 ${rt.eventRoomTypes[0]?.quantity <= 0 ? 'text-gray-400' : 'text-[#004aad]'}`}>${rt.price}</p>
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
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5 sticky top-[90px] max-h-[calc(100vh-100px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">

            {/* Header */}
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-[#004aad] mb-1 leading-tight">Why Sponsor?</h3>
              <div className="h-1 w-12 bg-gradient-to-r from-emerald-400 to-teal-500 mx-auto rounded-full"></div>
            </div>

            {/* Unified Content Sections */}
            <div className="space-y-6">

              {/* Global Reach */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-2">
                  <MapPin size={12} className="text-[#004aad]" /> Global Digital Reach
                </h4>
                <div className="bg-gradient-to-br from-[#004aad] to-blue-900 rounded-lg p-3 text-white shadow-inner">
                  <p className="text-[10px] text-blue-100 leading-tight mb-2">
                    Targeting logistics pros across <span className="font-bold text-white">India, APAC, ME, EU & USA</span>.
                  </p>
                  <div className="flex justify-between items-center text-[10px] border-t border-white/10 pt-2">
                    <span className="text-blue-200">250k+ Impressions</span>
                    <span className="font-bold">120k+ Pros</span>
                  </div>
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-2">
                  <Users size={12} className="text-[#004aad]" /> Target Audience
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {["Freight Forwarders", "Logistics Owners", "Managers", "CXOs", "Importers"].map((role, idx) => (
                    <span key={idx} className="bg-gray-50 text-gray-600 px-2 py-1 rounded-md font-medium text-[10px] border border-gray-100">
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              {/* Key Benefits */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-2">
                  <Check size={12} className="text-emerald-600" /> Key Benefits
                </h4>
                <ul className="space-y-1.5">
                  {[
                    "Premium On-Ground Exposure",
                    "Multi-Channel Promotion",
                    "Visibility in Networking Zones",
                    "Long-term Brand Recall",
                    "Global Brand Travel"
                  ].map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-[10px] text-gray-600 font-medium">
                      <div className="mt-1 min-w-[3px] h-1 w-1 rounded-full bg-emerald-500"></div>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Cart Button */}
            <div className="mt-6 pt-4 border-t border-gray-100 sticky bottom-0 bg-white pb-1">
              <button
                className="w-full bg-[#004aad] text-white font-bold py-3 rounded-xl shadow-lg hover:bg-[#00317a] transition-colors flex items-center justify-center gap-2"
                onClick={() => router.push(`/event/${id}/checkout`)}
              >
                <ShoppingCart className="h-4 w-4" />
                <div className="flex items-center gap-2 text-sm">
                  <span>Your Cart</span>
                  {itemCount > 0 && (
                    <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </div>
              </button>
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
