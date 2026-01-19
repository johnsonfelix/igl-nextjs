"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { ArrowLeft, Star } from "lucide-react";

export default function EditTestimonialPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        role: "",
        description: "",
        rating: 5,
        image: "",
        isActive: true,
    });

    useEffect(() => {
        fetchTestimonial();
    }, [id]);

    const fetchTestimonial = async () => {
        try {
            const res = await fetch(`/api/admin/testimonials/${id}`);
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    name: data.name,
                    role: data.role,
                    description: data.description,
                    rating: data.rating,
                    image: data.image || "",
                    isActive: data.isActive,
                });
            }
        } catch (error) {
            console.error("Error fetching testimonial:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch(`/api/admin/testimonials/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                alert("Testimonial updated successfully!");
                router.push("/admin/testimony");
            } else {
                alert("Failed to update testimonial");
            }
        } catch (error) {
            console.error("Error updating testimonial:", error);
            alert("Error updating testimonial");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading...</div>;
    }

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
                    <CardTitle>Edit Testimonial</CardTitle>
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
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">
                                Image URL
                            </label>
                            <Input
                                value={formData.image}
                                onChange={(e) =>
                                    setFormData({ ...formData, image: e.target.value })
                                }
                            />
                            {formData.image && (
                                <img
                                    src={formData.image}
                                    alt="Preview"
                                    className="mt-2 w-32 h-32 rounded-lg object-cover border"
                                />
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
                                Description *
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
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
                                className="w-4 h-4"
                            />
                            <label htmlFor="isActive" className="text-sm">
                                Display on homepage (Active)
                            </label>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="submit"
                                disabled={saving}
                                className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                                {saving ? "Saving..." : "Save Changes"}
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
