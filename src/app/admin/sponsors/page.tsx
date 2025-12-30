"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Plus, Trash2, Edit, Search, Image as ImageIcon, Users } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/app/components/ui/sheet";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { Skeleton } from "@/app/components/ui/skeleton";

import { Reorder } from "framer-motion";

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    image: "", // final URL stored here
    description: "",
    price: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSponsors();
  }, []);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const fetchSponsors = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sponsors");
      const data = await res.json();
      setSponsors(data);
    } catch (error) {
      console.error("Failed to fetch sponsors:", error);
    } finally {
      setLoading(false);
    }
  };

  const uploadFileToS3 = async (fileToUpload: File) => {
    const params = new URLSearchParams({
      filename: fileToUpload.name,
      contentType: fileToUpload.type || "application/octet-stream",
    });

    // 1) Request presign info
    const presignResp = await fetch(`/api/upload-url?${params.toString()}`);
    if (!presignResp.ok) {
      const body = await presignResp.text().catch(() => "<could not read body>");
      throw new Error(`Failed to get upload URL (status ${presignResp.status}): ${body}`);
    }

    // 2) Parse JSON and log it for debugging
    const data = await presignResp.json().catch((e) => {
      throw new Error("Presign endpoint returned invalid JSON: " + String(e));
    });
    console.log("Presign response data:", data);

    // 3) Decide PUT vs POST
    if (data.post && data.post.url && data.post.fields) {
      // presigned POST
      const fd = new FormData();
      Object.entries(data.post.fields).forEach(([k, v]) => fd.append(k, v as string));
      fd.append("file", fileToUpload);

      const uploadResp = await fetch(data.post.url, {
        method: "POST",
        body: fd,
      });

      if (!uploadResp.ok) {
        const text = await uploadResp.text().catch(() => "<no body>");
        throw new Error(`S3 POST upload failed: ${uploadResp.status} ${text}`);
      }

      return data.publicUrl ?? (data.key ? `https://${process.env.NEXT_PUBLIC_NEXT_PUBLIC_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${data.key}` : null);
    }

    if (data.uploadUrl) {
      // presigned PUT
      const uploadUrl: string = data.uploadUrl;
      console.log("Using presigned PUT URL:", uploadUrl);

      // Must set the exact content-type the presign expects (server should return contentType)
      const signedContentType = data.contentType ?? fileToUpload.type ?? "application/octet-stream";

      const putResp = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": signedContentType,
        },
        body: fileToUpload,
      });

      if (!putResp.ok) {
        const text = await putResp.text().catch(() => "<no body>");
        console.error("PUT response body:", text);
        throw new Error(`Upload to S3 failed: ${putResp.status} ${text}`);
      }

      return data.publicUrl;
    }

    // If we reach here, the response was unexpected
    throw new Error("Presign response missing uploadUrl or post fields: " + JSON.stringify(data));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.description || !formData.price) {
      alert("Please fill out all fields before saving.");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = formData.image;

      // if a local file is selected, upload it first
      if (file) {
        imageUrl = await uploadFileToS3(file);
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        image: imageUrl,
      };

      if (editingId) {
        await fetch(`/api/admin/sponsors/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/admin/sponsors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      // reset form
      setFormData({ name: "", image: "", description: "", price: "" });
      setFile(null);
      setPreviewUrl(null);
      setEditingId(null);
      setFormOpen(false);
      await fetchSponsors();
    } catch (error) {
      console.error("Failed to save sponsor:", error);
      alert("Failed to save sponsor. See console for more details.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this sponsor?")) return;
    try {
      await fetch(`/api/admin/sponsors/${id}`, { method: "DELETE" });
      fetchSponsors();
    } catch (error) {
      console.error("Failed to delete sponsor:", error);
    }
  };

  const openEditForm = (sponsor: any) => {
    setFormData({
      name: sponsor.name,
      description: sponsor.description,
      image: sponsor.image || "",
      price: sponsor.price || "",
    });
    setFile(null);
    setPreviewUrl(sponsor.image || null);
    setEditingId(sponsor.id);
    setFormOpen(true);
  };

  const handleReorder = (newOrder: any[]) => {
    setSponsors(newOrder); // Optimistic update

    // Debounce or save logic could go here, but for now we'll just fire-and-forget or use a small timeout
    // Actually, framer-motion calls this frequently. We should probably debounce or just send the full list order.
    // For simplicity, let's just trigger save on drag end? Reorder.Group doesn't have a simple "onDragEnd" with the new order.
    // It updates state via onReorder.
    // We'll use a timeout to save changes after 1 second of inactivity.
  };

  // Effect to save order when sponsors change (debounced)
  useEffect(() => {
    if (loading || sponsors.length === 0) return;

    const timer = setTimeout(() => {
      // Prepare payload: id and new index
      const items = sponsors.map((s, index) => ({ id: s.id, sortOrder: index }));
      fetch('/api/admin/sponsors/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      }).catch(err => console.error("Failed to save order", err));
    }, 1000);

    return () => clearTimeout(timer);
  }, [sponsors]);

  const filteredSponsors = sponsors.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Sponsors</h1>
          <p className="text-gray-500 mt-1">Manage your event sponsors and partnerships.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search sponsors..."
              className="pl-10 bg-white border-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Sheet open={formOpen} onOpenChange={setFormOpen}>
            <SheetTrigger asChild>
              <Button className="w-full sm:w-auto gap-2 bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-600 shadow-sm transition-all font-semibold">
                <Plus size={18} />
                Add Sponsor
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[420px]">
              <div className="space-y-6 p-4">
                <SheetHeader className="border-b pb-4">
                  <SheetTitle className="text-xl font-bold text-gray-900">
                    {editingId ? "Edit Sponsor" : "Add New Sponsor"}
                  </SheetTitle>
                  <SheetDescription className="text-sm text-gray-500 mt-1">
                    {editingId ? "Update the sponsor details below." : "Enter details for the new sponsor."}
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Name <span className="text-red-500">*</span></Label>
                    <Input
                      required
                      placeholder="e.g. Acme Corp"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Description <span className="text-red-500">*</span></Label>
                    <Input
                      required
                      placeholder="e.g. Platinum Partner"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      className="focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Price (USD) <span className="text-red-500">*</span></Label>
                    <Input
                      required
                      placeholder="e.g. 5000"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      className="focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Logo</Label>
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
                        <div className="relative w-full h-32">
                          <img
                            src={previewUrl}
                            alt="Logo Preview"
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
                      {saving ? "Saving..." : editingId ? "Update Sponsor" : "Save Sponsor"}
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Sponsors List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : filteredSponsors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <div className="bg-emerald-50 p-4 rounded-full mb-4">
            <Users className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No sponsors found</h3>
          <p className="text-gray-500 mt-1">
            {searchQuery ? "Try adjusting your search terms." : "Get started by adding your first sponsor."}
          </p>
          {!searchQuery && (
            <Button variant="ghost" className="text-emerald-600 mt-2 hover:bg-emerald-50" onClick={() => setFormOpen(true)}>
              Add a Sponsor
            </Button>
          )}
        </div>
      ) : searchQuery ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSponsors.map((sponsor) => (
            <Card
              key={sponsor.id}
              className="group hover:shadow-xl transition-all duration-300 border border-gray-100 rounded-xl bg-white overflow-hidden flex flex-col h-full hover:-translate-y-1"
            >
              <div className="relative h-48 bg-gray-50 flex items-center justify-center p-6 border-b border-gray-100 group-hover:bg-gray-100/50 transition-colors">
                {sponsor.image ? (
                  <img
                    src={sponsor.image}
                    alt={sponsor.name}
                    className="w-full h-full object-contain filter group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-300">
                    <ImageIcon size={48} strokeWidth={1} />
                    <span className="text-xs mt-2 font-medium">No Logo</span>
                  </div>
                )}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 w-10 p-0 bg-white/90 hover:bg-white shadow-sm text-gray-600 hover:text-emerald-600 flex items-center justify-center"
                      onClick={(e) => { e.stopPropagation(); openEditForm(sponsor); }}
                    >
                      <Edit size={18} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 w-10 p-0 bg-white/90 hover:bg-white shadow-sm text-gray-600 hover:text-red-600 flex items-center justify-center"
                      onClick={(e) => { e.stopPropagation(); handleDelete(sponsor.id); }}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>
              </div>
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 text-lg line-clamp-1 group-hover:text-emerald-600 transition-colors" title={sponsor.name}>{sponsor.name}</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[2.5em]">{sponsor.description}</p>
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contribution</span>
                  <span className="font-mono font-bold text-emerald-600 text-lg">
                    ${Number(sponsor.price).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Reorder.Group axis="y" values={sponsors} onReorder={setSponsors} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sponsors.map((sponsor) => (
            <Reorder.Item key={sponsor.id} value={sponsor} className="h-full">
              <Card
                className="group hover:shadow-xl transition-all duration-300 border border-gray-100 rounded-xl bg-white overflow-hidden flex flex-col h-full hover:scale-[1.02] cursor-move"
              >
                <div className="relative h-48 bg-gray-50 flex items-center justify-center p-6 border-b border-gray-100 group-hover:bg-gray-100/50 transition-colors">
                  {sponsor.image ? (
                    <img
                      src={sponsor.image}
                      alt={sponsor.name}
                      className="w-full h-full object-contain filter group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-300">
                      <ImageIcon size={48} strokeWidth={1} />
                      <span className="text-xs mt-2 font-medium">No Logo</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-10 w-10 p-0 bg-white/90 hover:bg-white shadow-sm text-gray-600 hover:text-emerald-600 flex items-center justify-center"
                        onClick={(e) => { e.stopPropagation(); openEditForm(sponsor); }}
                      >
                        <Edit size={18} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-10 w-10 p-0 bg-white/90 hover:bg-white shadow-sm text-gray-600 hover:text-red-600 flex items-center justify-center"
                        onClick={(e) => { e.stopPropagation(); handleDelete(sponsor.id); }}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                </div>
                <CardContent className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 text-lg line-clamp-1 group-hover:text-emerald-600 transition-colors" title={sponsor.name}>{sponsor.name}</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[2.5em]">{sponsor.description}</p>
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contribution</span>
                    <span className="font-mono font-bold text-emerald-600 text-lg">
                      ${Number(sponsor.price).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}
    </div>
  );
}
