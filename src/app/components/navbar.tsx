"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, X, User } from "lucide-react";
// Assuming you have a custom Button component, adjust path if needed
import { Button } from "@/app/components/ui/button";
import { useUser } from "../hooks/useUser";

// Define a type for your user object for better type safety
interface User {
  email?: string;
  // Add other user properties you expect from /api/me
  // companyId?: string; // Example
}

const user = useUser();

// Hook: Fetch user info from /api/me
// This hook determines if the user is logged in
// function useUser(): User | null {
//   const [user, setUser] = useState<User | null>(null);
//   const pathname = usePathname();

//   useEffect(() => {
//     let aborted = false;

//     fetch(`/api/me?t=${Date.now()}`, {
//       cache: 'no-store',
//       credentials: 'include',
//     })
//       .then(async (res) => {
//         if (aborted) return;
//         if (res.ok) setUser(await res.json());
//         else setUser(null);
//       })
//       .catch(() => {
//         if (!aborted) setUser(null);
//       });

//     return () => {
//       aborted = true;
//     };
//   }, [pathname]);

//   return user;
// }

// Define the structure for your navigation items
interface NavItem {
  name: string;
  href: string;
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard" },
  // { name: "Events", href: "/events" },
  { name: "Membership", href: "/membership/become-member" },
  { name: "Event", href: "/event/list" },
  { name: "Company Directory", href: "/directory" },
  { name: "Inquiry", href: "/inquiry" },
  { name: "Risk Protection", href: "/risk" },
  { name: "About Us", href: "/about" },
  { name: "Admin", href: "/admin/sponsors" },
  // Add other navigation items as needed
  // { name: "Chat", href: "/company/chat" }, // Example: if you add a direct link to chat
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false); // State for mobile menu open/close
  const [accountOpen, setAccountOpen] = useState(false); // State for account dropdown open/close
  const menuRef = useRef<HTMLDivElement>(null); // Ref for clicking outside the account dropdown
  const router = useRouter();
  const user = useUser(); // Get user session data

  // Effect to close the account dropdown when clicking outside of it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Check if the click occurred outside the dropdown, but only if the dropdown is open
      if (
        accountOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setAccountOpen(false);
      }
    }

    // Attach the event listener to the document when the component mounts or accountOpen changes
    document.addEventListener("click", handleClickOutside);

    // Cleanup function: remove the event listener when the component unmounts
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [accountOpen]); // Dependency array: re-run effect if accountOpen state changes

  // Handle user logout
const handleLogout = async () => {
  try {
    const res = await fetch("/api/logout", { method: "POST", credentials: "include" });
    if (res.ok) {
      setAccountOpen(false);
      // broadcast
      window.dispatchEvent(new Event("auth:changed"));
      router.replace("/company/login");
    } else {
      console.error("Logout failed:", await res.text());
    }
  } catch (e) {
    console.error("Network error during logout:", e);
  }
};

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        {/* Logo/Brand Name */}
        <Link
          href="/dashboard"
          className="text-xl font-bold text-primary"
        >
          IGLA
        </Link>

        {/* Desktop Navigation Menu */}
        <nav className="hidden md:flex space-x-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm px-3 py-2 rounded-md transition ${
                pathname === item.href
                  ? "bg-[#2563EB] text-white" // Active link style
                  : "text-gray-700 hover:bg-gray-100" // Inactive link style
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Account Menu (Desktop) - Visible only if user is logged in */}
        {user ? ( // Only render account menu if user object exists
          <div className="relative hidden md:block" ref={menuRef}>
            <button
              className="flex items-center px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 focus:outline-none"
              aria-haspopup="true"
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen((open) => !open)} // Toggle account dropdown
            >
              <User className="h-5 w-5 mr-2" /> {/* User icon */}
              <span>Account</span> {/* Account text */}
            </button>
            {/* Account Dropdown Content - Visible only if accountOpen is true */}
            {accountOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md py-1 border z-50">
                <Link
                  href="/account"
                  className="block px-4 py-2 hover:bg-gray-50 text-gray-700"
                  onClick={() => setAccountOpen(false)} // Close dropdown on link click
                >
                  Account Settings
                </Link>
                {/* <Link
                  href="/admin/store-setup"
                  className="block px-4 py-2 hover:bg-gray-50 text-gray-700"
                  onClick={() => setAccountOpen(false)} // Close dropdown on link click
                >
                  Store Setup
                </Link> */}
                <button
                  type="button"
                  onClick={handleLogout} // Logout handler
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          // If user is not logged in, show a login button
          <div className="hidden md:block">
            <Link href="/company/login">
              <Button variant="ghost">Login</Button>
            </Link>
          </div>
        )}

        {/* Mobile Menu Toggle & Account (Mobile) */}
        <div className="md:hidden flex items-center gap-2">
          {/* Account button (mobile) - Visible only if user is logged in */}
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                className="p-2 rounded-full bg-gray-100 focus:outline-none"
                onClick={() => setAccountOpen((o) => !o)} // Toggle account dropdown
                aria-label="Open account menu"
              >
                <User className="h-5 w-5" />
              </button>
              {/* Account Dropdown Content (Mobile) - Visible only if accountOpen is true */}
              {accountOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md py-1 border z-50">
                  <Link
                    href="/account"
                    className="block px-4 py-2 hover:bg-gray-50 text-gray-700"
                    onClick={() => setAccountOpen(false)}
                  >
                    Account Settings
                  </Link>
                  {/* <Link
                    href="/admin/store-setup"
                    className="block px-4 py-2 hover:bg-gray-50 text-gray-700"
                    onClick={() => setAccountOpen(false)}
                  >
                    Store Setup
                  </Link> */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            // If user is not logged in, show a login button (optional for mobile)
            <Link href="/company/login">
              <Button variant="ghost" className="p-2">
                Login
              </Button>
            </Link>
          )}

          {/* Mobile Nav Menu Toggle */}
          <Button
            variant="ghost"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle Menu"
          >
            {menuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu (expanded) */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t shadow">
          <nav className="flex flex-col space-y-1 p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm px-3 py-2 rounded-md transition ${
                  pathname === item.href
                    ? "bg-[#2563EB] text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => setMenuOpen(false)} // Close mobile menu on nav item click
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
