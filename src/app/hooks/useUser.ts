import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface User {
  email?: string;
  id?: string;
  name?: string;
  companyId?: string | null;
}

export function useUser(): User | null {
  const [user, setUser] = useState<User | null>(null);
  const [revalidator, setRevalidator] = useState(0); // <— internal bump to refetch
  const pathname = usePathname();

  // Listen for auth changes (login/logout) from anywhere
  useEffect(() => {
    const onAuth = () => setRevalidator((n) => n + 1);
    window.addEventListener("auth:changed", onAuth);
    return () => window.removeEventListener("auth:changed", onAuth);
  }, []);

  // Actually fetch the session
  useEffect(() => {
    let aborted = false;

    fetch(`/api/me?t=${Date.now()}`, {
      cache: "no-store",
      credentials: "include",
      headers: {
        "x-no-cache": "1",
      },
    })
      .then(async (res) => {
        if (aborted) return;
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        if (!aborted) setUser(null);
      });

    return () => {
      aborted = true;
    };
  }, [pathname, revalidator]);

  return user;
}
