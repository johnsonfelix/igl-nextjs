"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Plus, Trash2, Edit, Search, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/app/components/ui/sheet";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { Skeleton } from "@/app/components/ui/skeleton";

export default function TicketsPage() {
  const [tickets, settickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    logo: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchtickets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tickets");
      const data = await res.json();
      settickets(data);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchtickets();
  }, []);

  const handleSubmit = async () => {
  try {
    const url = editingId
      ? `/api/admin/tickets/${editingId}`
      : "/api/admin/tickets";
    const method = editingId ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        price: parseFloat(formData.price || "0"), // ensure number
      }),
    });

    setFormData({ name: "", price: "", logo: "" });
    setEditingId(null);
    setFormOpen(false);
    fetchtickets();
  } catch (error) {
    console.error("Failed to save ticket:", error);
  }
};


  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ticket?")) return;
    try {
      await fetch(`/api/admin/tickets/${id}`, { method: "DELETE" });
      fetchtickets();
    } catch (error) {
      console.error("Failed to delete ticket:", error);
    }
  };

  const openEditForm = (ticket: any) => {
    setFormData({
      name: ticket.name,
      price: ticket.price,
      logo: ticket.logo,
    });
    setEditingId(ticket.id);
    setFormOpen(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">tickets</h1>
          <p className="text-sm text-gray-500">Manage your event tickets efficiently</p>
        </div>
        <Sheet open={formOpen} onOpenChange={setFormOpen}>
          <SheetTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} />
              Add ticket
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-[420px]">
  <div className="space-y-6 p-4">
    <h2 className="text-lg font-semibold text-gray-900">
      {editingId ? "Edit ticket" : "Add New ticket"}
    </h2>

    <div className="space-y-4">
      <div>
        <Label className="text-gray-800">Name</Label>
        <Input
          className="text-gray-900 placeholder-gray-400"
          placeholder="ticket name"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
        />
      </div>

      <div>
        <Label className="text-gray-800">Price</Label>
        <Input
          className="text-gray-900 placeholder-gray-400"
          placeholder="$1000"
          value={formData.price}
          onChange={(e) =>
            setFormData({ ...formData, price: e.target.value })
          }
        />
      </div>

      {/* <div>
        <Label className="text-gray-800">Country</Label>
        <Input
          className="text-gray-900 placeholder-gray-400"
          placeholder="Country"
          value={formData.country}
          onChange={(e) =>
            setFormData({ ...formData, country: e.target.value })
          }
        />
      </div> */}

      <div>
        <Label className="text-gray-800">Logo URL</Label>
        <Input
          className="text-gray-900 placeholder-gray-400"
          placeholder="https://example.com/logo.png"
          value={formData.logo}
          onChange={(e) =>
            setFormData({ ...formData, logo: e.target.value })
          }
        />
        {formData.logo && (
          <img
            src={formData.logo}
            alt="Logo Preview"
            className="w-32 h-32 object-contain border rounded mt-2 p-2 bg-white"
            onError={(e) =>
              ((e.target as HTMLImageElement).style.display = "none")
            }
          />
        )}
      </div>

      <Button className="w-full mt-2" onClick={handleSubmit}>
        {editingId ? "Update ticket" : "Save ticket"}
      </Button>
    </div>
  </div>
</SheetContent>

        </Sheet>
      </div>

      {/* tickets List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg bg-gray-50">
          <p className="text-gray-500">No tickets found. Add your first ticket to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="hover:shadow-md transition border border-gray-200 rounded-lg bg-white overflow-hidden"
            >
              <CardContent className="p-0">
                {ticket.logo ? (
                  <img
                    src={ticket.logo}
                    alt={ticket.name}
                    className="w-full h-40 object-contain bg-gray-50 p-4 border-b"
                  />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center bg-gray-50 text-gray-400">
                    No Logo
                  </div>
                )}
                <div className="p-4 space-y-1">
  <h3 className="font-semibold text-lg truncate">{ticket.name}</h3>
  <p className="text-sm text-gray-600">Price: ${ticket.price}</p>
  <div className="flex gap-2 pt-3">
    <Button
      variant="outline"
      size="sm"
      className="flex-1"
      onClick={() => openEditForm(ticket)}
    >
      <Edit className="h-4 w-4 mr-1" /> Edit
    </Button>
    <Button
      variant="outline"
      size="sm"
      className="flex-1 text-red-600 hover:bg-red-50"
      onClick={() => handleDelete(ticket.id)}
    >
      <Trash2 className="h-4 w-4 mr-1" /> Delete
    </Button>
  </div>
</div>

              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
