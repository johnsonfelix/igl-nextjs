"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { ArrowLeft, Upload, X, Image as ImageIcon } from "lucide-react";
import { uploadFileToS3 } from "@/app/lib/s3-upload";

export default function CreatePastEventPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploadingMain, setUploadingMain] = useState(false);
    const [uploadingCarousel, setUploadingCarousel] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        place: "",
        date: "",
        membersAttended: "",
        description: "",
        mainImage: "",
        carouselImages: [] as string[],
    });

    const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please select an image file");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert("Image size should be less than 5MB");
            return;
        }

        setUploadingMain(true);
        try {
            const publicUrl = await uploadFileToS3(file);
            setFormData({ ...formData, mainImage: publicUrl });
        } catch (error) {
            console.error("Error uploading file:", error);
            alert("Failed to upload image. Please try again.");
        } finally {
            setUploadingMain(false);
        }
    };

    const handleCarouselUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploadingCarousel(true);
        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                if (!file.type.startsWith("image/")) return null;
                return await uploadFileToS3(file);
            });

            const uploadedUrls = (await Promise.all(uploadPromises)).filter(Boolean) as string[];
            setFormData((prev) => ({
                ...prev,
                carouselImages: [...prev.carouselImages, ...uploadedUrls],
            }));
        } catch (error) {
            console.error("Error uploading files:", error);
            alert("Failed to upload some images. Please try again.");
        } finally {
            setUploadingCarousel(false);
        }
    };

    const removeCarouselImage = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            carouselImages: prev.carouselImages.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/admin/past-events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                alert("Event created successfully!");
                router.push("/admin/past-events");
            } else {
                const error = await res.json();
                alert(`Error: ${error.error || "Failed to create event"}`);
            }
        } catch (error) {
            console.error("Error creating event:", error);
            alert("Error creating event");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
            <Button
                variant="ghost"
                onClick={() => router.push("/admin/past-events")}
                className="mb-4"
            >
                <ArrowLeft size={16} className="mr-2" />
                Back to List
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>Create New Past Event</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">
                                    Event Title *
                                </label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData({ ...formData, title: e.target.value })
                                    }
                                    placeholder="e.g. 1st IGLA Annual Conference"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">
                                    Place *
                                </label>
                                <Input
                                    value={formData.place}
                                    onChange={(e) =>
                                        setFormData({ ...formData, place: e.target.value })
                                    }
                                    placeholder="e.g. Shanghai"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">
                                    Date *
                                </label>
                                <Input
                                    value={formData.date}
                                    onChange={(e) =>
                                        setFormData({ ...formData, date: e.target.value })
                                    }
                                    placeholder="e.g. Jun 2013"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">
                                    Members Attended *
                                </label>
                                <Input
                                    type="number"
                                    value={formData.membersAttended}
                                    onChange={(e) =>
                                        setFormData({ ...formData, membersAttended: e.target.value })
                                    }
                                    placeholder="e.g. 1000"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">
                                Main Banner Image *
                            </label>

                            {!formData.mainImage ? (
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleMainImageUpload}
                                        disabled={uploadingMain}
                                        className="hidden"
                                        id="main-image-upload"
                                    />
                                    <label
                                        htmlFor="main-image-upload"
                                        className="cursor-pointer flex flex-col items-center gap-3"
                                    >
                                        <Upload className="w-12 h-12 text-gray-400" />
                                        {uploadingMain ? (
                                            <div className="text-blue-600 font-medium">
                                                Uploading...
                                            </div>
                                        ) : (
                                            <>
                                                <div className="text-sm text-gray-600">
                                                    <span className="font-semibold text-blue-600">
                                                        Click to upload main banner
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    PNG, JPG up to 5MB
                                                </div>
                                            </>
                                        )}
                                    </label>
                                </div>
                            ) : (
                                <div className="relative inline-block w-full">
                                    <img
                                        src={formData.mainImage}
                                        alt="Preview"
                                        className="w-full h-64 rounded-lg object-cover border shadow-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, mainImage: "" })}
                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
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
                                placeholder="Describe the event..."
                                required
                                rows={4}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-200 outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 flex justify-between">
                                <span>Carousel Images ({formData.carouselImages.length})</span>
                                <span className="text-xs font-normal text-gray-500">Add multiple images for the gallery</span>
                            </label>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                {formData.carouselImages.map((url, index) => (
                                    <div key={index} className="relative group aspect-square">
                                        <img
                                            src={url}
                                            alt={`Carousel ${index + 1}`}
                                            className="w-full h-full object-cover rounded-lg border"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeCarouselImage(index)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}

                                <div className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center p-4 hover:border-gray-400 transition-colors aspect-square cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleCarouselUpload}
                                        disabled={uploadingCarousel}
                                        className="hidden"
                                        id="carousel-upload"
                                    />
                                    <label
                                        htmlFor="carousel-upload"
                                        className="cursor-pointer flex flex-col items-center gap-2 w-full h-full justify-center"
                                    >
                                        <ImageIcon className="w-8 h-8 text-gray-400" />
                                        <span className="text-xs text-center text-gray-600">
                                            {uploadingCarousel ? "Uploading..." : "Add Images"}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t">
                            <Button
                                type="submit"
                                disabled={loading || uploadingMain || uploadingCarousel}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {loading ? "Creating..." : "Create Event"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push("/admin/past-events")}
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
