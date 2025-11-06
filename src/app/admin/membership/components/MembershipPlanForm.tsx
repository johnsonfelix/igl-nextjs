"use client";

import { useState, useEffect } from "react";
import { MembershipPlan } from "@prisma/client";
import { uploadFileToS3 } from "@/app/lib/s3-upload"; // same helper used elsewhere

type FormProps = {
  plan: MembershipPlan | null;
  onSuccess: (plan: MembershipPlan, action: "create" | "update") => void;
  onCancel: () => void;
};

export default function MembershipPlanForm({ plan, onSuccess, onCancel }: FormProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [features, setFeatures] = useState("");
  const [description, setDescription] = useState("");

  // Image upload state replaces URL input
  const [thumbnail, setThumbnail] = useState(""); // holds existing or uploaded URL
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const isEditing = Boolean(plan);

  useEffect(() => {
    if (isEditing && plan) {
      setName(plan.name);
      setSlug(plan.slug || "");
      setPrice(plan.price);
      setDescription(plan.description || "");
      setThumbnail(plan.thumbnail || "");
      setFeatures((plan.features || []).join("\n"));
      setFile(null);
      setPreviewUrl(plan.thumbnail || null);
    } else {
      setName("");
      setSlug("");
      setPrice("");
      setDescription("");
      setThumbnail("");
      setFeatures("");
      setFile(null);
      setPreviewUrl(null);
    }
  }, [plan, isEditing]);

  // Create blob preview and revoke it on cleanup
  useEffect(() => {
    if (!file) {
      // fall back to existing thumbnail when editing
      setPreviewUrl(thumbnail || null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, thumbnail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Upload only if user selected a new file; otherwise keep existing URL
      let uploadedUrl = thumbnail;
      if (file) {
        uploadedUrl = await uploadFileToS3(file); // returns public S3 URL
      }

      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        price: Number(price || 0),
        description: description.trim(),
        thumbnail: uploadedUrl ?? "",
        features: features
          .split("\n")
          .map((f) => f.trim())
          .filter(Boolean),
      };

      const api = isEditing ? `/api/admin/membership-plans/${plan!.id}` : "/api/admin/membership-plans";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(api, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to save");
      }

      const savedPlan: MembershipPlan = await res.json();
      onSuccess(savedPlan, isEditing ? "update" : "create");

      // Reset after success
      setFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error("Save plan error:", error);
      alert("An error occurred saving the plan. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{isEditing ? "Edit Plan" : "Create New Plan"}</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Subscription Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border p-2 rounded-md"
                placeholder="e.g. Platinum, Gold, Silver"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full border p-2 rounded-md"
                placeholder="unique-slug"
              />
            </div>
          </div>

          {/* Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Price (USD)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full border p-2 rounded-md"
                step="0.01"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Feature Count</label>
              <div className="mt-2 text-sm text-gray-600">{features.split("\n").filter(Boolean).length} features</div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border p-2 rounded-md"
              rows={3}
              placeholder="Short plan description"
            />
          </div>

          {/* Thumbnail upload */}
          <div>
            <label className="block text-sm font-medium mb-1">Thumbnail</label>
            <input
              type="file"
              accept="image/*"
              className="mt-2 text-sm"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                if (!f) {
                  // If cleared, revert preview to existing URL in edit mode
                  setPreviewUrl(thumbnail || null);
                }
              }}
            />
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Thumbnail Preview"
                className="w-full h-40 object-contain border rounded mt-2 p-2 bg-white"
                onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
              />
            )}
          </div>

          {/* Features */}
          <div>
            <label className="block text-sm font-medium mb-1">Features (one per line)</label>
            <textarea
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              className="w-full border p-2 rounded-md"
              rows={6}
              placeholder={"Feature 1\nFeature 2\nFeature 3"}
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-60"
            >
              {isLoading ? (isEditing ? "Updating..." : "Creating...") : isEditing ? "Update Plan" : "Create Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
