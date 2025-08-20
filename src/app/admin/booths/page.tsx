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

export default function BoothsPage() {
  const [Booths, setBooths] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    image: ""
  });
  const [editingId, setEditingId] = useState<string | null>(null);

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

  useEffect(() => {
    fetchBooths();
  }, []);


  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.image) {
    alert("Please fill out all fields before saving.");
    return;
  }
    try {
      if (editingId) {
        await fetch(`/api/admin/booths/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        await fetch("/api/admin/booths", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }
      setFormData({ name: "", price: "", image: "" });
      setEditingId(null);
      setFormOpen(false);
      fetchBooths();
    } catch (error) {
      console.error("Failed to save booth:", error);
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
      price: booth.price,
      image: booth.image,
    });
    setEditingId(booth.id);
    setFormOpen(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booths</h1>
          <p className="text-sm text-gray-500">Manage your event Booths efficiently</p>
        </div>
        <Sheet open={formOpen} onOpenChange={setFormOpen}>
          <SheetTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} />
              Add booth
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-[420px]">
  <div className="space-y-6 p-4">
    <h2 className="text-lg font-semibold text-gray-900">
      {editingId ? "Edit booth" : "Add New booth"}
    </h2>

    <div className="space-y-4">
      <div>
        <Label className="text-gray-800">Name</Label>
        <Input
          className="text-gray-900 placeholder-gray-400"
          placeholder="booth name"
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
          placeholder="$20000"
          value={formData.price}
          onChange={(e) =>
            setFormData({ ...formData, price: e.target.value })
          }
        />
      </div>



      <div>
        <Label className="text-gray-800">image URL</Label>
        <Input
          className="text-gray-900 placeholder-gray-400"
          placeholder="https://example.com/image.png"
          value={formData.image}
          onChange={(e) =>
            setFormData({ ...formData, image: e.target.value })
          }
        />
        {formData.image && (
          <img
            src={formData.image}
            alt="image Preview"
            className="w-32 h-32 object-contain border rounded mt-2 p-2 bg-white"
            onError={(e) =>
              ((e.target as HTMLImageElement).style.display = "none")
            }
          />
        )}
      </div>

      <Button variant="primary" onClick={handleSubmit}>
        {editingId ? "Update booth" : "Save booth"}
      </Button>
    </div>
  </div>
</SheetContent>

        </Sheet>
      </div>

      {/* Booths List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : Booths.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg bg-gray-50">
          <p className="text-gray-500">No Booths found. Add your first booth to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Booths.map((booth) => (
            <Card
              key={booth.id}
              className="hover:shadow-md transition border border-gray-200 rounded-lg bg-white overflow-hidden"
            >
              <CardContent className="p-0">
                {booth.image ? (
                  <img
                    src={booth.image}
                    alt={booth.name}
                    className="w-full h-40 object-contain bg-gray-50 p-4 border-b"
                  />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center bg-gray-50 text-gray-400">
                    No image
                  </div>
                )}
                <div className="p-4 space-y-1">
                  <h3 className="font-semibold text-lg truncate">{booth.name}</h3>
                  <div className="flex justify-between items-center">
                    <Badge variant="secondary">{booth.price || "Unknown"}</Badge>
                   
                  </div>
                  <div className="flex gap-2 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditForm(booth)}
                    >
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(booth.id)}
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
