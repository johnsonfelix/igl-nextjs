"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Plus, Edit, Trash2, Star } from "lucide-react";

interface Testimonial {
    id: string;
    name: string;
    role: string;
    description: string;
    rating: number;
    image: string | null;
    isActive: boolean;
    createdAt: string;
}

export default function TestimonialsPage() {
    const router = useRouter();
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const fetchTestimonials = async () => {
        try {
            const res = await fetch("/api/admin/testimonials");
            if (res.ok) {
                const data = await res.json();
                setTestimonials(data);
            }
        } catch (error) {
            console.error("Error fetching testimonials:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this testimonial?")) return;

        try {
            const res = await fetch(`/api/admin/testimonials/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setTestimonials(testimonials.filter((t) => t.id !== id));
                alert("Testimonial deleted successfully");
            } else {
                alert("Failed to delete testimonial");
            }
        } catch (error) {
            console.error("Error deleting testimonial:", error);
            alert("Error deleting testimonial");
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Testimonials</h1>
                    <p className="text-gray-500 mt-2">Manage customer testimonials</p>
                </div>
                <Button
                    onClick={() => router.push("/admin/testimony/create")}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Plus size={16} className="mr-2" />
                    Add New
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : testimonials.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-gray-500">
                        No testimonials yet. Create your first one!
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {testimonials.map((testimonial) => (
                        <Card key={testimonial.id} className="border border-gray-200">
                            <CardContent className="p-6">
                                <div className="flex gap-6">
                                    {testimonial.image && (
                                        <img
                                            src={testimonial.image}
                                            alt={testimonial.name}
                                            className="w-24 h-24 rounded-lg object-cover"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">
                                                    {testimonial.name}
                                                </h3>
                                                <p className="text-sm text-gray-600">{testimonial.role}</p>
                                                <div className="flex items-center gap-1 mt-2">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            size={16}
                                                            className={
                                                                i < testimonial.rating
                                                                    ? "fill-yellow-400 text-yellow-400"
                                                                    : "text-gray-300"
                                                            }
                                                        />
                                                    ))}
                                                </div>
                                                <p className="text-gray-700 mt-3 line-clamp-2">
                                                    {testimonial.description}
                                                </p>
                                                <div className="flex items-center gap-4 mt-3">
                                                    <span
                                                        className={`text-xs px-2 py-1 rounded-full ${testimonial.isActive
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-gray-100 text-gray-700"
                                                            }`}
                                                    >
                                                        {testimonial.isActive ? "Active" : "Inactive"}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(testimonial.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        router.push(`/admin/testimony/${testimonial.id}`)
                                                    }
                                                >
                                                    <Edit size={14} className="mr-1" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDelete(testimonial.id)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 size={14} className="mr-1" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
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
