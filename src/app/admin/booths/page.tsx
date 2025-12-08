"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Plus, Trash2, Edit, Store, ImageIcon, Search } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/app/components/ui/sheet";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { Skeleton } from "@/app/components/ui/skeleton";
import { uploadFileToS3 } from "@/app/lib/s3-upload";

export default function BoothsPage() {
  const [booths, setBooths] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    image: "", // This will hold the final image URL
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch booths on initial load
  useEffect(() => {
    fetchBooths();
  }, []);

  // Create a preview URL when a file is selected
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const fetchBooths = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/booths");
      const data = await res.json();
      setBooths(data);
    } catch (error) {
      console.error("Failed to fetch Booths:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price) {
      alert("Please fill out all fields before saving.");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = formData.image;

      // If a new file is selected, upload it to S3
      if (file) {
        imageUrl = await uploadFileToS3(file);
      }

      const payload = { ...formData, image: imageUrl };

      if (editingId) {
        await fetch(`/api/admin/booths/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/admin/booths", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      // Reset form and state
      setFormData({ name: "", price: "", image: "" });
      setFile(null);
      setPreviewUrl(null);
      setEditingId(null);
      setFormOpen(false);
      await fetchBooths(); // Refresh the list
    } catch (error) {
      console.error("Failed to save booth:", error);
      alert("Failed to save booth. See console for details.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this booth?")) return;
    try {
      await fetch(`/api/admin/booths/${id}`, { method: "DELETE" });
      fetchBooths();
    } catch (error) {
      console.error("Failed to delete booth:", error);
    }
  };

  const openEditForm = (booth: any) => {
    setFormData({
      name: booth.name,
      price: booth.price || "",
      image: booth.image || "",
    });
    setFile(null);
    setPreviewUrl(booth.image || null); // Show existing image
    setEditingId(booth.id);
    setFormOpen(true);
  };

  const filteredBooths = booths.filter((booth) =>
    booth.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Booths</h1>
          <p className="text-sm text-gray-500 mt-1">Manage physical booth locations and pricing.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search booths..."
              className="pl-10 bg-white border-gray-200 focus:ring-emerald-500 focus:border-emerald-500 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Sheet open={formOpen} onOpenChange={setFormOpen}>
            <SheetTrigger asChild>
              <Button className="w-full sm:w-auto gap-2 bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-600 shadow-sm transition-all font-semibold">
                <Plus size={18} />
                Add Booth
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[480px]">
              <div className="space-y-6 py-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingId ? "Edit Booth" : "Add New Booth"}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Set the details for the exhibition booth.</p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Booth Name</Label>
                    <Input
                      className="focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="e.g. Premium Corner Booth"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Price ($)</Label>
                    <Input
                      className="focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="e.g. 5000"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                    />
                  </div>

                  {/* Image Upload Field */}
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Layout / Image</Label>
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors text-center cursor-pointer relative group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null;
                          setFile(f);
                          if (!f) {
                            setPreviewUrl(formData.image || null);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      {previewUrl ? (
                        <div className="relative w-full h-40">
                          <img
                            src={previewUrl}
                            alt="Booth Preview"
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
                      {saving ? "Saving..." : editingId ? "Update Booth" : "Save Booth"}
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Booths List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : filteredBooths.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <div className="bg-emerald-50 p-4 rounded-full mb-4">
            <Store className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No booths found</h3>
          <p className="text-gray-500 mt-1">
            Get started by adding your first booth configuration.
          </p>
          <Button variant="ghost" className="text-emerald-600 mt-2 hover:bg-emerald-50" onClick={() => setFormOpen(true)}>
            Add a Booth
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooths.map((booth) => (
            <Card
              key={booth.id}
              className="group hover:shadow-xl transition-all duration-300 border border-gray-100 rounded-xl bg-white overflow-hidden flex flex-col h-full hover:-translate-y-1"
            >
              <div className="relative h-48 bg-gray-50 flex items-center justify-center p-6 border-b border-gray-100 group-hover:bg-gray-100/50 transition-colors">
                {booth.image ? (
                  <img
                    src={booth.image}
                    alt={booth.name}
                    className="w-full h-full object-contain filter group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-300">
                    <Store size={48} strokeWidth={1} />
                    <span className="text-xs mt-2 font-medium">No Image</span>
                  </div>
                )}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 w-10 p-0 bg-white/90 hover:bg-white shadow-sm text-gray-600 hover:text-emerald-600 flex items-center justify-center transition-transform hover:scale-105"
                      onClick={(e) => { e.stopPropagation(); openEditForm(booth); }}
                    >
                      <Edit size={18} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 w-10 p-0 bg-white/90 hover:bg-white shadow-sm text-gray-600 hover:text-red-600 flex items-center justify-center transition-transform hover:scale-105"
                      onClick={(e) => { e.stopPropagation(); handleDelete(booth.id); }}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>
              </div>

              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 text-lg line-clamp-1 group-hover:text-emerald-600 transition-colors" title={booth.name}>{booth.name}</h3>
                </div>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Price</span>
                  <span className="font-mono font-bold text-emerald-600 text-lg">
                    ${Number(booth.price).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
