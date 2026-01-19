"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/app/components/ui/utils";
import { ReactNode } from "react";
import {
  LayoutDashboard,
  Handshake,
  Hotel,
  Store,
  Ticket,
  Calendar,
  Building2,
  Users,
  CreditCard,
  Tags,
  LogOut,
  AlertTriangle,
  MessageCircle,
  History
} from "lucide-react";

const MENU_ITEMS = [
  { name: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { name: "Sponsors", href: "/admin/sponsors", icon: <Handshake className="h-5 w-5" /> },
  { name: "Companies", href: "/admin/company", icon: <Building2 className="h-5 w-5" /> },
  { name: "Events", href: "/admin/events", icon: <Calendar className="h-5 w-5" /> },
  { name: "Past Events", href: "/admin/past-events", icon: <History className="h-5 w-5" /> },
  { name: "Hotels", href: "/admin/hotels", icon: <Hotel className="h-5 w-5" /> },
  { name: "Booths", href: "/admin/booths", icon: <Store className="h-5 w-5" /> },
  { name: "Tickets", href: "/admin/tickets", icon: <Ticket className="h-5 w-5" /> },
  { name: "Users", href: "/admin/users", icon: <Users className="h-5 w-5" /> },
  { name: "Membership", href: "/admin/membership", icon: <CreditCard className="h-5 w-5" /> },
  { name: "Coupons", href: "/admin/coupon", icon: <Tags className="h-5 w-5" /> },
  { name: "Testimonials", href: "/admin/testimony", icon: <MessageCircle className="h-5 w-5" /> },
  { name: "Reports", href: "/admin/reports", icon: <AlertTriangle className="h-5 w-5" /> },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col shadow-sm z-10 sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 pb-8 border-b border-gray-50">
          <Link
            href="/admin/dashboard"
            className="text-2xl font-extrabold flex items-center gap-3 text-blue-600 tracking-tight transition-opacity hover:opacity-80"
          >
            <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <span>IGLA<span className="text-gray-400 font-light hidden sm:inline">Admin</span></span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Main Menu</p>
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-blue-600 hover:translate-x-1"
                )}
              >
                <span className={cn(
                  "transition-colors duration-200",
                  isActive ? "text-blue-600" : "text-gray-400 group-hover:text-blue-500"
                )}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-50 bg-gray-50/50">
          <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-gray-600 hover:bg-white hover:text-red-600 hover:shadow-sm transition-all duration-200 group">
            <LogOut className="h-5 w-5 text-gray-400 group-hover:text-red-500" />
            Logout
          </button>
          <div className="mt-4 px-2 flex items-center justify-between">
            <p className="text-xs text-gray-400 font-medium">&copy; 2025 IGLA</p>
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">v1.2</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto w-full">
        {children}
      </main>
    </div>
  );
}
