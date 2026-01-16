"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Plus, Trash2, Edit, Ticket, ImageIcon, Search, Loader2, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/app/components/ui/sheet";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { Skeleton } from "@/app/components/ui/skeleton";
import { uploadFileToS3 } from "@/app/lib/s3-upload";

export default function TicketsPage() {
  const [tickets, settickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Image upload states
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    sellingPrice: "",
    logo: "", // holds existing logo URL or uploaded URL
    features: [] as string[],
  });
  const [currentFeature, setCurrentFeature] = useState("");
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

  // Create or update preview when file changes
  useEffect(() => {
    if (!file) {
      // When clearing the file, fall back to existing logo for preview (edit mode)
      setPreviewUrl(formData.logo || null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, formData.logo]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.price) {
      alert("Please fill out name and price before saving.");
      return;
    }
    // Require an image either via selected file or an existing logo when editing
    if (!file && !formData.logo) {
      alert("Please select an image to upload.");
      return;
    }

    setSaving(true);
    try {
      // Upload only if a new file is selected
      let logoUrl = formData.logo;
      if (file) {
        logoUrl = await uploadFileToS3(file); // returns public S3 URL
      }

      const url = editingId ? `/api/admin/tickets/${editingId}` : "/api/admin/tickets";
      const method = editingId ? "PUT" : "POST";

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          logo: logoUrl ?? "",
          price: parseFloat(formData.price || "0"),
          sellingPrice: formData.sellingPrice ? parseFloat(formData.sellingPrice) : null,
        }),
      });

      setFormData({ name: "", price: "", sellingPrice: "", logo: "", features: [] });
      setCurrentFeature("");
      setFile(null);
      setPreviewUrl(null);
      setEditingId(null);
      setFormOpen(false);
      fetchtickets();
    } catch (error) {
      console.error("Failed to save ticket:", error);
      alert("Failed to save ticket. See console for details.");
    } finally {
      setSaving(false);
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
      price: String(ticket.price ?? ""),
      sellingPrice: ticket.sellingPrice ? String(ticket.sellingPrice) : "",
      logo: ticket.logo || "",
      features: ticket.features || [],
    });
    setCurrentFeature("");
    setFile(null);
    setPreviewUrl(ticket.logo || null);
    setEditingId(ticket.id);
    setFormOpen(true);
  };

  const filteredTickets = tickets.filter((ticket) =>
    ticket.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">Manage event tickets and pricing.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tickets..."
              className="pl-10 bg-white border-gray-200 focus:ring-emerald-500 focus:border-emerald-500 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Sheet open={formOpen} onOpenChange={setFormOpen}>
            <SheetTrigger asChild>
              <Button className="w-full sm:w-auto gap-2 bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-600 shadow-sm transition-all font-semibold">
                <Plus size={18} />
                Add Ticket
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[480px]">
              <div className="space-y-6 py-6">
                <SheetHeader>
                  <SheetTitle className="text-2xl font-bold text-gray-900">
                    {editingId ? "Edit Ticket" : "Add New Ticket"}
                  </SheetTitle>
                  <SheetDescription className="text-sm text-gray-500 mt-1">
                    Set the details for the event ticket.
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Ticket Name</Label>
                    <Input
                      className="focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="e.g. VIP Pass"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-700 font-medium">Original Price ($)</Label>
                      <Input
                        className="focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="e.g. 1000"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-700 font-medium">Selling Price ($)</Label>
                      <Input
                        className="focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="e.g. 800"
                        value={formData.sellingPrice}
                        onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Features Field */}
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Features</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          className="flex-1 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="e.g. VIP Access, Free Meal"
                          value={currentFeature}
                          onChange={(e) => setCurrentFeature(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && currentFeature.trim()) {
                              e.preventDefault();
                              if (!formData.features.includes(currentFeature.trim())) {
                                setFormData({ ...formData, features: [...formData.features, currentFeature.trim()] });
                              }
                              setCurrentFeature("");
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => {
                            if (currentFeature.trim() && !formData.features.includes(currentFeature.trim())) {
                              setFormData({ ...formData, features: [...formData.features, currentFeature.trim()] });
                              setCurrentFeature("");
                            }
                          }}
                        >
                          <Plus size={16} />
                        </Button>
                      </div>
                      {formData.features.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          {formData.features.map((feature, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="pl-3 pr-2 py-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 flex items-center gap-1"
                            >
                              {feature}
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    features: formData.features.filter((_, i) => i !== idx),
                                  });
                                }}
                                className="ml-1 hover:bg-emerald-300 rounded-full p-0.5 transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Logo Upload Field */}
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Ticket Image / Logo</Label>
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors text-center cursor-pointer relative group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null;
                          setFile(f);
                          if (!f) {
                            setPreviewUrl(formData.logo || null);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      {previewUrl ? (
                        <div className="relative w-full h-40">
                          <img
                            src={previewUrl}
                            alt="Ticket Preview"
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium rounded-lg z-20 pointer-events-none">
                            Change Image
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <ImageIcon className="h-10 w-10 mb-3 text-emerald-100" />
                          <span className="text-sm text-gray-500 mb-2">Drag & drop or click to upload</span>
                          <Button size="sm" variant="outline" className="mt-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 pointer-events-none">
                            Choose File
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSubmit} disabled={saving}>
                      {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : editingId ? "Update Ticket" : "Save Ticket"}
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <div className="bg-emerald-50 p-4 rounded-full mb-4">
            <Ticket className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No tickets found</h3>
          <p className="text-gray-500 mt-1">
            Get started by adding your first ticket type.
          </p>
          <Button variant="ghost" className="text-emerald-600 mt-2 hover:bg-emerald-50" onClick={() => setFormOpen(true)}>
            Add a Ticket
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="group hover:shadow-xl transition-all duration-300 border border-gray-100 rounded-xl bg-white overflow-hidden flex flex-col h-full hover:-translate-y-1"
            >
              <div className="relative h-48 bg-gray-50 flex items-center justify-center p-6 border-b border-gray-100 group-hover:bg-gray-100/50 transition-colors">
                {ticket.logo ? (
                  <img
                    src={ticket.logo}
                    alt={ticket.name}
                    className="w-full h-full object-contain filter group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-300">
                    <Ticket size={48} strokeWidth={1} />
                    <span className="text-xs mt-2 font-medium">No Logo</span>
                  </div>
                )}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 w-10 p-0 bg-white/90 hover:bg-white shadow-sm text-gray-600 hover:text-emerald-600 flex items-center justify-center transition-transform hover:scale-105"
                      onClick={(e) => { e.stopPropagation(); openEditForm(ticket); }}
                    >
                      <Edit size={18} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 w-10 p-0 bg-white/90 hover:bg-white shadow-sm text-gray-600 hover:text-red-600 flex items-center justify-center transition-transform hover:scale-105"
                      onClick={(e) => { e.stopPropagation(); handleDelete(ticket.id); }}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>
              </div>

              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 text-lg line-clamp-1 group-hover:text-emerald-600 transition-colors" title={ticket.name}>{ticket.name}</h3>
                </div>

                {/* Features badges */}
                {ticket.features && ticket.features.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {ticket.features.slice(0, 3).map((feature: string, idx: number) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-200"
                      >
                        {feature}
                      </Badge>
                    ))}
                    {ticket.features.length > 3 && (
                      <Badge
                        variant="secondary"
                        className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 border-gray-200"
                      >
                        +{ticket.features.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                <div className="mt-auto pt-4 border-t border-gray-50 space-y-1">
                  {ticket.sellingPrice ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Price</span>
                      <div className="flex flex-col items-end">
                        <span className="font-mono text-gray-400 line-through text-sm">
                          ${Number(ticket.price).toLocaleString()}
                        </span>
                        <span className="font-mono font-bold text-emerald-600 text-lg">
                          ${Number(ticket.sellingPrice).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Price</span>
                      <span className="font-mono font-bold text-emerald-600 text-lg">
                        ${Number(ticket.price).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
