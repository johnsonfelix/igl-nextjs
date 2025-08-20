import React, { useState, ChangeEvent } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

interface BoothSubType {
  id?: string; // optional, if tracked in DB
  name: string;
  price: string;       // price held as string in form state
  description: string;
}

interface Booth {
  id: string;
  name: string;
  image: string;
  price: number;
  description?: string;
  subTypes?: BoothSubType[];
}

interface BoothSettingsProps {
  eventId: string;
  eventBooths: Booth[];
  refreshEvent: () => Promise<void> | void;
  onClose?: () => void;
}

interface BoothForm {
  name: string;
  image: string;
  price: string;
  description: string;
  subTypes: BoothSubType[];
}

export function BoothSettings({
  eventId,
  eventBooths,
  refreshEvent,
}: BoothSettingsProps) {
  const [editingBooth, setEditingBooth] = useState<Booth | null>(null);
  const [boothForm, setBoothForm] = useState<BoothForm>({
    name: "",
    image: "",
    price: "",
    description: "",
    subTypes: [],
  });
  const [saving, setSaving] = useState(false);

  const openBoothEdit = (booth: Booth | null) => {
    setEditingBooth(booth);
    setBoothForm(
      booth
        ? {
            name: booth.name,
            image: booth.image,
            price: booth.price.toString(),
            description: booth.description || "",
            subTypes:
              booth.subTypes?.map((st) => ({
                id: st.id,
                name: st.name,
                price: st.price.toString ? st.price.toString() : st.price,
                description: st.description || "",
              })) || [],
          }
        : { name: "", image: "", price: "", description: "", subTypes: [] }
    );
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setBoothForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubTypeChange = (
    index: number,
    field: keyof Omit<BoothSubType, "id">,
    value: string
  ) => {
    const newSubTypes = [...boothForm.subTypes];
    newSubTypes[index] = { ...newSubTypes[index], [field]: value };
    setBoothForm((prev) => ({ ...prev, subTypes: newSubTypes }));
  };

  const handleAddSubType = () => {
    setBoothForm((prev) => ({
      ...prev,
      subTypes: [...prev.subTypes, { name: "", price: "", description: "" }],
    }));
  };

  const handleRemoveSubType = (index: number) => {
    const newSubTypes = boothForm.subTypes.filter((_, i) => i !== index);
    setBoothForm((prev) => ({ ...prev, subTypes: newSubTypes }));
  };

  const handleSaveBooth = async () => {
    setSaving(true);
    try {
      const method = editingBooth ? "PUT" : "POST";
      const apiUrl = editingBooth
        ? `/api/events/${eventId}/booths/${editingBooth.id}`
        : `/api/events/${eventId}/booths`;

      // Clean subTypes before sending
      const cleanedSubTypes = boothForm.subTypes
        .filter((st) => st.name.trim() !== "")
        .map((st) => ({
          name: st.name.trim(),
          price: parseFloat(st.price),
          description: st.description.trim(),
        }));

      const payload = {
        name: boothForm.name.trim(),
        image: boothForm.image.trim(),
        price: parseFloat(boothForm.price),
        description: boothForm.description.trim(),
        subTypes: cleanedSubTypes,
      };

      const res = await fetch(apiUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setEditingBooth(null);
        setBoothForm({
          name: "",
          image: "",
          price: "",
          description: "",
          subTypes: [],
        });
        await refreshEvent();
      } else {
        console.error(await res.json());
      }
    } catch (err) {
      console.error("Error saving booth:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBooth = async (boothId: string) => {
    if (!confirm("Delete booth?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}/booths/${boothId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await refreshEvent();
      } else {
        console.error(await res.json());
      }
    } catch (err) {
      console.error("Error deleting booth:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Booth Settings</h2>

      {/* Booth List */}
      <div className="mb-6 max-h-[300px] overflow-auto border rounded-md p-4">
        {eventBooths?.length > 0 ? (
          <ul className="space-y-4">
            {eventBooths.map((booth) => (
              <li
                key={booth.id}
                className="flex justify-between items-center p-3 border-b last:border-b-0"
              >
                <div>
                  <div className="font-semibold text-lg">{booth.name}</div>
                  <div className="text-sm text-gray-600">₹{booth.price}</div>
                </div>
                <div className="space-x-2">
                  <Button size="sm" onClick={() => openBoothEdit(booth)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteBooth(booth.id)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No booths configured.</p>
        )}
      </div>

      {/* Add/Edit Booth Form */}
      <div className="p-6 border border-gray-300 rounded-lg shadow-sm bg-white max-w-3xl mx-auto">
        <h3 className="text-xl font-semibold mb-4">
          {editingBooth ? "Edit Booth" : "Add Booth"}
        </h3>

        {/* Main Booth Fields */}
        <div className="mb-4">
          <Label>Name</Label>
          <Input
            name="name"
            value={boothForm.name}
            onChange={handleChange}
            placeholder="Booth Name"
            className="h-12 text-lg"
          />
        </div>
        <div className="mb-4">
          <Label>Price (INR)</Label>
          <Input
            name="price"
            type="number"
            value={boothForm.price}
            onChange={handleChange}
            placeholder="Base Price"
            min="0"
            className="h-12 text-lg"
          />
        </div>
        <div className="mb-4">
          <Label>Image URL</Label>
          <Input
            name="image"
            value={boothForm.image}
            onChange={handleChange}
            placeholder="Image URL"
            className="h-12 text-lg"
          />
        </div>
        <div className="mb-6">
          <Label>Description</Label>
          <Textarea
            name="description"
            value={boothForm.description}
            onChange={handleChange}
            placeholder="Description"
            rows={4}
            className="text-lg"
          />
        </div>

        {/* Sub-Types Section */}
        <div className="mb-6">
          <Label className="text-lg font-semibold mb-2 block">
            Sub-Types (e.g., 1A, 1B)
          </Label>
          {boothForm.subTypes.length > 0 ? (
            boothForm.subTypes.map((subType, idx) => (
              <div
                key={idx}
                className="mb-4 p-4 border rounded-md bg-gray-50 space-y-2"
              >
                <div className="flex flex-col md:flex-row md:space-x-4">
                  <Input
                    placeholder="Name"
                    value={subType.name}
                    onChange={(e) =>
                      handleSubTypeChange(idx, "name", e.target.value)
                    }
                    className="w-full text-lg"
                  />
                  <Input
                    type="number"
                    placeholder="Price"
                    min="0"
                    value={subType.price}
                    onChange={(e) =>
                      handleSubTypeChange(idx, "price", e.target.value)
                    }
                    className="w-full text-lg"
                  />
                </div>
                <Textarea
                  placeholder="Description"
                  value={subType.description}
                  onChange={(e) =>
                    handleSubTypeChange(idx, "description", e.target.value)
                  }
                  rows={3}
                  className="w-full text-lg"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveSubType(idx)}
                >
                  Remove Sub-Type
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 mb-4">No sub-types added yet.</p>
          )}
          <Button size="sm" onClick={handleAddSubType}>
            + Add Sub-Type
          </Button>
        </div>

        {/* Save & Cancel Buttons */}
        <div className="flex space-x-4">
          <Button
            onClick={handleSaveBooth}
            disabled={saving}
            className="flex-1 h-12 text-lg"
          >
            {editingBooth ? "Update Booth" : "Add Booth"}
          </Button>
          {editingBooth && (
            <Button
              variant="ghost"
              onClick={() => openBoothEdit(null)}
              className="flex-1 h-12 text-lg"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
