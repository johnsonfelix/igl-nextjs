"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { ArrowLeft, Star, Upload, X } from "lucide-react";
import { uploadFileToS3 } from "@/app/lib/s3-upload";

export default function CreateTestimonialPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        role: "",
        description: "",
        rating: 5,
        image: "",
        isActive: true,
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            alert("Please select an image file");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert("Image size should be less than 5MB");
            return;
        }

        setUploading(true);
        try {
            const publicUrl = await uploadFileToS3(file);
            setFormData({ ...formData, image: publicUrl });
        } catch (error) {
            console.error("Error uploading file:", error);
            alert("Failed to upload image. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = () => {
        setFormData({ ...formData, image: "" });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/admin/testimonials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                alert("Testimonial created successfully!");
                router.push("/admin/testimony");
            } else {
                const error = await res.json();
                alert(`Error: ${error.error || "Failed to create testimonial"}`);
            }
        } catch (error) {
            console.error("Error creating testimonial:", error);
            alert("Error creating testimonial");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
            <Button
                variant="ghost"
                onClick={() => router.push("/admin/testimony")}
                className="mb-4"
            >
                <ArrowLeft size={16} className="mr-2" />
                Back to List
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>Create New Testimonial</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">
                                    Name *
                                </label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    placeholder="John Doe"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">
                                    Role/Title *
                                </label>
                                <Input
                                    value={formData.role}
                                    onChange={(e) =>
                                        setFormData({ ...formData, role: e.target.value })
                                    }
                                    placeholder="CEO, Company Name"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">
                                Profile Image
                            </label>

                            {!formData.image ? (
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                        className="hidden"
                                        id="image-upload"
                                    />
                                    <label
                                        htmlFor="image-upload"
                                        className="cursor-pointer flex flex-col items-center gap-3"
                                    >
                                        <Upload className="w-12 h-12 text-gray-400" />
                                        {uploading ? (
                                            <div className="text-blue-600 font-medium">
                                                Uploading...
                                            </div>
                                        ) : (
                                            <>
                                                <div className="text-sm text-gray-600">
                                                    <span className="font-semibold text-blue-600">
                                                        Click to upload
                                                    </span>{" "}
                                                    or drag and drop
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    PNG, JPG, JPEG up to 5MB
                                                </div>
                                            </>
                                        )}
                                    </label>
                                </div>
                            ) : (
                                <div className="relative inline-block">
                                    <img
                                        src={formData.image}
                                        alt="Preview"
                                        className="w-48 h-48 rounded-lg object-cover border shadow-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">
                                Rating *
                            </label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                    <button
                                        key={rating}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, rating })}
                                        className="focus:outline-none"
                                    >
                                        <Star
                                            size={32}
                                            className={
                                                rating <= formData.rating
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : "text-gray-300"
                                            }
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">
                                Description/Testimonial *
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                placeholder="Share your experience..."
                                required
                                rows={5}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-200 outline-none"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) =>
                                    setFormData({ ...formData, isActive: e.target.checked })
                                }
                                className="w-4 h-4 text-blue-600 rounded"
                            />
                            <label htmlFor="isActive" className="text-sm text-gray-700">
                                Display on homepage (Active)
                            </label>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="submit"
                                disabled={loading || uploading}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {loading ? "Creating..." : "Create Testimonial"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push("/admin/testimony")}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
