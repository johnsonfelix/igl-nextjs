"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Plus, Trash2, Edit } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/app/components/ui/sheet";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"; // Assuming you have a Select component
import { Badge } from "@/app/components/ui/badge";
import { Skeleton } from "@/app/components/ui/skeleton";

interface Coupon {
  id: string;
  code: string;
  discountType: "FIXED" | "PERCENTAGE";
  discountValue: number;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    discountType: "FIXED",
    discountValue: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      setCoupons(data);
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSubmit = async () => {
    if (!formData.code || !formData.discountValue) {
      alert("Please fill out all fields before saving.");
      return;
    }

    const apiEndpoint = editingId
      ? `/api/admin/coupons/${editingId}`
      : "/api/admin/coupons";
    const method = editingId ? "PUT" : "POST";

    try {
      await fetch(apiEndpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          discountValue: parseFloat(formData.discountValue),
        }),
      });

      setFormData({ code: "", discountType: "FIXED", discountValue: "" });
      setEditingId(null);
      setFormOpen(false);
      fetchCoupons();
    } catch (error) {
      console.error("Failed to save coupon:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      fetchCoupons();
    } catch (error) {
      console.error("Failed to delete coupon:", error);
    }
  };

  const openEditForm = (coupon: Coupon) => {
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
    });
    setEditingId(coupon.id);
    setFormOpen(true);
  };

  const formatDiscount = (coupon: Coupon) => {
    return coupon.discountType === "PERCENTAGE"
      ? `${coupon.discountValue}%`
      : `$${coupon.discountValue.toFixed(2)}`;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="text-sm text-gray-500">
            Manage your discount coupons
          </p>
        </div>
        <Sheet open={formOpen} onOpenChange={setFormOpen}>
          <SheetTrigger asChild>
            <Button
              className="gap-2"
              onClick={() => {
                setEditingId(null);
                setFormData({
                  code: "",
                  discountType: "FIXED",
                  discountValue: "",
                });
              }}
            >
              <Plus size={16} />
              Add Coupon
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-[420px]">
            <div className="space-y-6 p-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? "Edit Coupon" : "Add New Coupon"}
              </h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-800">Coupon Code</Label>
                  <Input
                    required
                    className="text-gray-900 placeholder-gray-400"
                    placeholder="e.g., SUMMER25"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-800">Type</Label>
                    <Select
                      value={formData.discountType}
                      onValueChange={(value) =>
                        setFormData({ ...formData, discountType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FIXED">Fixed Amount</SelectItem>
                        <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-800">Value</Label>
                    <Input
                      required
                      type="number"
                      className="text-gray-900 placeholder-gray-400"
                      placeholder={
                        formData.discountType === "FIXED" ? "e.g., 10" : "e.g., 25"
                      }
                      value={formData.discountValue}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountValue: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                <Button onClick={handleSubmit}>
                  {editingId ? "Update Coupon" : "Save Coupon"}
                </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg bg-gray-50">
          <p className="text-gray-500">
            No coupons found. Add your first coupon to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {coupons.map((coupon) => (
            <Card
              key={coupon.id}
              className="hover:shadow-md transition border border-gray-200 rounded-lg bg-white"
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg truncate">
                    {coupon.code}
                  </h3>
                  <Badge variant="default">{formatDiscount(coupon)}</Badge>
                </div>
                <p className="text-sm text-gray-500 capitalize">
                  {coupon.discountType.toLowerCase()} Discount
                </p>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditForm(coupon)}
                  >
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(coupon.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
