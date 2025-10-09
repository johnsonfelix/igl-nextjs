"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/app/components/ui/utils";
import { ReactNode } from "react";
import { Home, Ticket, Hotel, Briefcase, Store } from "lucide-react";

const MENU_ITEMS = [
  { name: "Sponsors", href: "/admin/sponsors", icon: <Briefcase className="h-5 w-5" /> },
  { name: "Hotels", href: "/admin/hotels", icon: <Hotel className="h-5 w-5" /> },
  { name: "Booths", href: "/admin/booths", icon: <Store className="h-5 w-5" /> },
  { name: "Tickets", href: "/admin/tickets", icon: <Ticket className="h-5 w-5" /> },
  { name: "Events", href: "/admin/events", icon: <Ticket className="h-5 w-5" /> },
  { name: "Companies", href: "/admin/company", icon: <Ticket className="h-5 w-5" /> },
  { name: "Users", href: "/admin/users", icon: <Ticket className="h-5 w-5" /> },
  { name: "Membership", href: "/admin/membership", icon: <Ticket className="h-5 w-5" /> },
  { name: "Coupon", href: "/admin/coupon", icon: <Ticket className="h-5 w-5" /> },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col p-6">
        <div className="mb-10">
          <Link
            href="/admin"
            className="text-2xl font-bold flex items-center gap-2 text-primary"
          >
            <Home className="h-6 w-6" /> IGLA
          </Link>
        </div>

        <nav className="flex flex-col space-y-1">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">&copy; 2025 IGLA Admin</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
