"use client";

import { useState } from "react";

export default function AdminPage() {
  const [loading, setLoading] = useState(false);

  const createSponsor = async () => {
    setLoading(true);
    await fetch("/api/admin/create-sponsor", {
      method: "POST",
      body: JSON.stringify({
        name: "Awesome Partner",
        partnerType: "Gold",
        logo: "/logo.png",
        country: "USA",
      }),
    });
    setLoading(false);
  };

  const linkSponsor = async () => {
    setLoading(true);
    await fetch("/api/admin/link-sponsor", {
      method: "POST",
      body: JSON.stringify({
        eventId: "event-id-here",
        sponsorId: "sponsor-id-here",
      }),
    });
    setLoading(false);
  };

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded mr-4"
        onClick={createSponsor}
        disabled={loading}
      >
        Create Sponsor
      </button>

      <button
        className="bg-green-600 text-white px-4 py-2 rounded"
        onClick={linkSponsor}
        disabled={loading}
      >
        Link Sponsor to Event
      </button>
    </main>
  );
}
