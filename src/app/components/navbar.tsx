"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, X, User } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import Image from "next/image";

interface User {
  email?: string;
  role?: string;
}

function useUser(): User | null {
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;
    fetch("/api/me")
      .then(async (res) => {
        if (isMounted) {
          if (res.ok) {
            setUser(await res.json());
          } else {
            setUser(null);
          }
        }
      })
      .catch((error) => {
        if (isMounted) {
          console.error("Failed to fetch user data:", error);
          setUser(null);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  return user;
}

interface NavItem {
  name: string;
  href: string;
}

const navItems: NavItem[] = [
  { name: "Home", href: "/" },
  { name: "Membership", href: "/membership/become-member" },
  { name: "Event", href: "/event/list" },
  { name: "Company Directory", href: "/directory" },
  { name: "Inquiry", href: "/inquiry" },
  { name: "Risk Protection", href: "/risk" },
  { name: "About Us", href: "/about" },
  { name: "Admin", href: "/admin/dashboard" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const user = useUser();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        accountOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [accountOpen]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/logout", { method: "POST" });
      if (res.ok) {
        setAccountOpen(false);
        router.push("/company/login");
      }
    } catch (error) {
      console.error("Network error during logout:", error);
    }
  };

  // Filter nav items: Hide "Admin" unless user is ADMIN
  const displayNavItems = navItems.filter((item) => {
    if (item.name === "Admin") {
      return user?.role === 'ADMIN';
    }
    return true;
  });

  return (
    <div className="flex flex-col">
      {/* Top Bar - Integrated to be Global */}
      <div className="bg-[#5da765] text-white py-2 px-4 text-sm">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <p className="font-medium">
            Early Bird Offer for Members!{" "}
            <Link href="#" className="underline font-bold text-blue-900">
              Grab now
            </Link>
          </p>
          <div className="flex gap-4 mt-2 md:mt-0">
            <a href="tel:+919940100929" className="hover:text-black">
              +91 99401 00929
            </a>
            <a href="mailto:sales@igla.asia" className="hover:text-black">
              sales@igla.asia
            </a>
          </div>
        </div>
      </div>

      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          {/* Logo */}
          <Link href="/">
            <Image
              src="/images/logo.png"
              alt="IGLA Logo"
              width={150}
              height={50}
              className="w-auto h-12"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex gap-6 font-medium text-gray-700 items-center">
            {displayNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition hover:text-[#5da765] ${pathname === item.href ? "text-[#5da765]" : ""
                  }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="hidden sm:flex items-center gap-4">
            {/* Secure Pay - Only on Home */}
            {pathname === "/" && (
              <Link
                href="/risk"
                className="flex items-center gap-2 font-bold text-gray-700"
              >
                <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  🛡️
                </span>
                <span className="hidden xl:inline">SecurePay</span>
              </Link>
            )}

            {/* Download App - Only on Home */}
            {pathname === "/" && (
              <button className="bg-[#5da765] hover:bg-[#4a8a52] text-white px-6 py-2 rounded-full font-medium transition-colors shadow-lg flex items-center gap-2">
                📱 Download the App
              </button>
            )}

            {/* Account Menu (Desktop) */}
            {user ? (
              <div className="relative hidden md:block" ref={menuRef}>
                <button
                  className="flex items-center px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 focus:outline-none"
                  onClick={() => setAccountOpen((open) => !open)}
                >
                  <User className="h-5 w-5 mr-2" />
                  <span>Account</span>
                </button>
                {accountOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md py-1 border z-50">
                    <Link
                      href="/account"
                      className="block px-4 py-2 hover:bg-gray-50 text-gray-700"
                      onClick={() => setAccountOpen(false)}
                    >
                      Account Settings
                    </Link>
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
              // Login Button - Shown if user is not filtered out or specific location requested, here it is standard auth logic
              // If user is not logged in, show a login button
              <div className="hidden md:block">
                <Link href="/company/login">
                  <button className="bg-[#5da765] hover:bg-[#4a8a52] text-white px-6 py-2 rounded-full font-medium transition-colors shadow-md">
                    Login
                  </button>
                </Link>
              </div>
            )}
          </div>


          {/* Mobile Menu Toggle & Account (Mobile) */}
          <div className="lg:hidden flex items-center gap-2">
            {/* Account User Mobile */}
            {user && (
              <div className="relative" ref={menuRef}>
                <button
                  className="p-2 rounded-full bg-gray-100"
                  onClick={() => setAccountOpen((o) => !o)}
                >
                  <User className="h-5 w-5" />
                </button>
                {accountOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md py-1 border z-50">
                    <Link
                      href="/account"
                      className="block px-4 py-2 hover:bg-gray-50 text-gray-700"
                      onClick={() => setAccountOpen(false)}
                    >
                      Account Settings
                    </Link>
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
            )}

            <Button
              variant="ghost"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu (expanded) */}
        {menuOpen && (
          <div className="lg:hidden bg-white border-t shadow">
            <nav className="flex flex-col space-y-1 p-4">
              {displayNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm px-3 py-2 rounded-md transition ${pathname === item.href
                    ? "bg-[#2563EB] text-white"
                    : "text-gray-700 hover:bg-gray-100"
                    }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {/* Mobile Actions */}
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t">
                {pathname === "/" && (
                  <>
                    <Link href="/risk" className="flex items-center gap-2 font-bold text-gray-700 p-2">
                      <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600">🛡️</span>
                      SecurePay
                    </Link>
                    <button className="bg-[#5da765] text-white px-4 py-2 rounded-lg font-medium w-full">
                      Download App
                    </button>
                  </>
                )}
                {!user && (
                  <Link href="/company/login" className="block">
                    <button className="w-full bg-[#5da765] text-white px-4 py-2 rounded-lg font-medium text-center hover:bg-[#4a8a52] transition-colors shadow-sm">
                      Login
                    </button>
                  </Link>
                )}
              </div>

            </nav>
          </div>
        )}
      </header>
    </div>
  );
}
