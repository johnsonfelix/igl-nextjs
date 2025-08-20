// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    async function checkUser() {
      const res = await fetch('/api/me'); // An optional API to get user session
      if (res.ok) {
        const data = await res.json();
        setUser(data.userId);
      } else {
        router.push('/login'); // Redirect guest to login
      }
      setLoading(false);
    }

    checkUser();
  }, []);

  if (loading) return <p className="p-8">Loading...</p>;
  if (!user) return null;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Welcome to Dashboard</h1>
      <p className="mt-2 text-sm text-gray-500">User ID: {user}</p>
    </div>
  );
}
