"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, X, User, Phone, Mail, Download, LogIn } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import Image from "next/image";
import toast from "react-hot-toast";
import EventNavCard from "@/components/EventNavCard";

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
  { name: "Event", href: "/event/cmjn1f6ih0000gad4xa4j7dp3" },
  { name: "Company Directory", href: "/directory" },
  { name: "Inquiry", href: "/inquiry" },
  { name: "Risk Protection", href: "/secure-pay" },
  { name: "About Us", href: "/about" },
  { name: "Contact Us", href: "/contact-us" },
  { name: "Admin", href: "/admin/dashboard" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [showSignInBanner, setShowSignInBanner] = useState(true);
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

  const handleDownloadClick = () => {
    toast("Mobile App Coming Soon!", {
      icon: "📱",
      style: {
        borderRadius: "10px",
        background: "#333",
        color: "#fff",
      },
    });
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
      <div className="bg-[#ceeba3] text-gray-700 py-2 px-4 text-sm font-medium">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="font-medium text-black fs-15">
            Early Bird Offer for Members!{" "}
            <Link href="/event/cmjn1f6ih0000gad4xa4j7dp3" className="underline font-bold text-[#004aad]">
              Grab now
            </Link>
          </div>
          <div className="hidden md:flex gap-4 mt-2 md:mt-0 text-black">
            <a href="tel:+919940100929" className="hover:text-black flex items-center gap-2">
              <Phone className="w-4 h-4 text-black" />
              <span className="text-black">+91 99401 00929</span>
            </a>
            <a href="mailto:sales@igla.asia" className="hover:text-black flex items-center gap-2">
              <Mail className="w-4 h-4 text-black" />
              <span className="text-black">sales@igla.asia</span>
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
              <div key={item.href} className="relative group h-full flex items-center">
                <Link
                  href={item.href}
                  className={`transition font-medium text-[15px] hover:text-[#2ebb79] py-4 ${pathname === item.href ? "text-[#2ebb79]" : "text-[#232323]"
                    }`}
                >
                  {item.name}
                </Link>

                {item.name === "Event" && (
                  <div className="absolute top-[80%] left-1/2 -translate-x-1/2 w-[600px] pt-4 hidden group-hover:block hover:block transition-all duration-300 z-50">
                    <div className="bg-white rounded-xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.2)] border border-gray-100 overflow-hidden">
                      <EventNavCard />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="hidden sm:flex items-center gap-4">
            {/* Secure Pay - Only on Home */}
            {/* Secure Pay - Only on Home (Hidden as per request) */}
            {/* <Link
              href="/secure-pay"
              className="flex items-center gap-2 font-medium text-[16px] text-gray-700"
            >
              <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                🛡️
              </span>
              <span className="hidden xl:inline">SecurePay</span>
            </Link> */}

            {/* Download App - Global */}
            {/* <button onClick={handleDownloadClick} className="bg-gradient-to-r from-[#77a1d3] via-[#79cbca] to-[#77a1d3] bg-[length:200%_auto] hover:bg-right transition-all duration-500 text-white px-6 py-2 rounded-full font-medium text-[16px] shadow-lg flex items-center gap-2">
              <Download className="w-4 h-4" /> Download the App
            </button> */}

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
                      href="/dashboard"
                      className="block px-4 py-2 hover:bg-gray-50 text-gray-700"
                      onClick={() => setAccountOpen(false)}
                    >
                      Dashboard
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
              <div className="hidden md:block relative">
                <Link href="/company/login">
                  <button className="bg-gradient-to-r from-[#2ebb79] to-[#12ade8] hover:opacity-90 text-white px-6 py-2 rounded-md font-medium text-[16px] transition-all shadow-md flex items-center gap-2">
                    <LogIn className="w-4 h-4" /> Login
                  </button>
                </Link>

                {/* Sign In Banner Popup */}
                {showSignInBanner && (
                  <div className="absolute top-full right-0 mt-4 w-[320px] 2xl:w-[400px] z-50 animate-fadeIn select-none filter drop-shadow-2xl">
                    {/* Triangle pointer */}
                    <div className="absolute -top-2 right-10 w-4 h-4 bg-[#004aad] transform rotate-45 z-0"></div>

                    {/* Back Card (Orange) */}
                    <div className="bg-gradient-to-br from-[#2ebb79] to-[#004aad] rounded-2xl p-5 pb-24 2xl:p-6 2xl:pb-28 shadow-lg relative text-white">
                      {/* Decorative Pattern */}
                      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>

                      {/* Front Card (Cream/Message Bubble) */}
                      <div className="absolute -bottom-0 left-4 right-4 bg-white text-gray-800 rounded-xl p-3 2xl:p-4 shadow-xl border border-teal-100 flex items-start gap-3 transform transition-transform hover:-translate-y-1 z-20">
                        {/* Tail for bubble effect */}
                        <div className="absolute -top-2 left-8 w-4 h-4 bg-white transform rotate-45 border-t border-l border-teal-100"></div>

                        <div className="flex-1">
                          <p className="font-bold text-xs 2xl:text-sm leading-snug">
                            <span className="text-[#004aad]">Exclusive Offer:</span> Exclusive offer for members. Log in now to unlock <span className="underline decoration-teal-300 decoration-2">special pricing and benefits.</span>
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setShowSignInBanner(false);
                          }}
                          className="text-gray-400 hover:text-gray-900 transition-colors p-1 hover:bg-gray-100 rounded-full flex-shrink-0"
                        >
                          <X size={16} strokeWidth={2.5} />
                        </button>
                      </div>

                      <div className="relative z-10 flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-xl 2xl:text-2xl font-extrabold mb-1 drop-shadow-sm tracking-tight leading-none text-white">Sign in to get</h3>
                          <h3 className="text-xl 2xl:text-2xl font-extrabold mb-4 drop-shadow-sm text-[#ceeba3] leading-none">50% OFF on Sponsorships</h3>
                        </div>

                        {/* Decorative Elements */}
                        <div className="absolute right-0 top-0 opacity-90 pointer-events-none transform scale-75 origin-top-right">
                          <div className="relative transform rotate-12 bg-white/20 backdrop-blur-sm p-3 rounded-2xl border border-white/30 shadow-xl">
                            <span className="text-4xl filter drop-shadow-lg">🎁</span>
                          </div>
                          <div className="absolute -bottom-8 -left-8 transform -rotate-12 bg-white/20 backdrop-blur-sm p-2 rounded-xl border border-white/30 shadow-xl">
                            <span className="text-2xl filter drop-shadow-lg">💎</span>
                          </div>
                        </div>
                      </div>
                    </div>


                  </div>
                )}
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
                {/* <Link href="/secure-pay" className="flex items-center gap-2 font-medium text-[16px] text-gray-700 p-2">
                  <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600">🛡️</span>
                  SecurePay
                </Link> */}
                <button onClick={handleDownloadClick} className="bg-gradient-to-r from-[#77a1d3] via-[#79cbca] to-[#77a1d3] bg-[length:200%_auto] hover:bg-right transition-all duration-500 text-white px-4 py-2 rounded-lg font-medium text-[16px] w-full flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" /> Download App
                </button>
                {!user && (
                  <Link href="/company/login" className="block">
                    <button className="w-full bg-gradient-to-r from-[#2ebb79] to-[#12ade8] text-white px-4 py-2 rounded-md font-medium text-[16px] text-center hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-2">
                      <LogIn className="w-4 h-4" /> Login
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
