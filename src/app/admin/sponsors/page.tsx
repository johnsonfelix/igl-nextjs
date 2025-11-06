"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Plus, Trash2, Edit } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/app/components/ui/sheet";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { Skeleton } from "@/app/components/ui/skeleton";

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
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

    return data.publicUrl ?? (data.key ? `https://${process.env.NEXT_PUBLIC_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${data.key}` : null);
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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sponsors</h1>
          <p className="text-sm text-gray-500">Manage your event sponsors efficiently</p>
        </div>
        <Sheet open={formOpen} onOpenChange={setFormOpen}>
          <SheetTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} />
              Add Sponsor
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-[420px]">
            <div className="space-y-6 p-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? "Edit Sponsor" : "Add New Sponsor"}
              </h2>

              <div className="space-y-4">
                <div>
                  <Label className="text-gray-800">Name</Label>
                  <Input
                    required
                    className="text-gray-900 placeholder-gray-400"
                    placeholder="Sponsor name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label className="text-gray-800">Description</Label>
                  <Input
                    required
                    className="text-gray-900 placeholder-gray-400"
                    placeholder="Platinum, Gold, etc."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label className="text-gray-800">Price</Label>
                  <Input
                    required
                    className="text-gray-900 placeholder-gray-400"
                    placeholder="USD"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label className="text-gray-800">Logo</Label>
                  {/* If user wants to keep existing image, they can leave file empty */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setFile(f);
                      if (!f) {
                        // if they cleared file, keep existing preview from URL or reset
                        setPreviewUrl(formData.image || null);
                      }
                    }}
                    className="mt-2"
                  />
                  {/* preview either local file or existing url */}
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Logo Preview"
                      className="w-32 h-32 object-contain border rounded mt-2 p-2 bg-white"
                      onError={(e) =>
                        ((e.target as HTMLImageElement).style.display = "none")
                      }
                    />
                  )}
                </div>

                <Button variant="primary" onClick={handleSubmit} disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Update Sponsor" : "Save Sponsor"}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Sponsors List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : sponsors.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg bg-gray-50">
          <p className="text-gray-500">No sponsors found. Add your first sponsor to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sponsors.map((sponsor) => (
            <Card
              key={sponsor.id}
              className="hover:shadow-md transition border border-gray-200 rounded-lg bg-white overflow-hidden"
            >
              <CardContent className="p-0">
                {sponsor.image ? (
                  <img
                    src={sponsor.image}
                    alt={sponsor.name}
                    className="w-full h-40 object-contain bg-gray-50 p-4 border-b"
                  />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center bg-gray-50 text-gray-400">
                    No Logo
                  </div>
                )}
                <div className="p-4 space-y-1">
                  <h3 className="font-semibold text-lg truncate">{sponsor.name}</h3>
                  <div className="flex justify-between items-center text-white">
                    <Badge variant="secondary"> ${sponsor.price || "Unknown"}</Badge>
                  </div>
                  <div className="flex gap-2 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditForm(sponsor)}
                    >
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(sponsor.id)}
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
