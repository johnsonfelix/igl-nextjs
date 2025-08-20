import React, { useState, ChangeEvent, useMemo } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

interface BoothSubType {
  id?: string;
  name: string;
  price: string;
  description: string;
}

interface Booth {
  id: string;
  name: string;
  subTypes?: BoothSubType[];
}

interface BoothSubTypeManagerProps {
  eventId: string;
  eventBooths: Booth[]; // Each booth has at least: id, name, subTypes[]
  refreshEvent: () => Promise<void> | void;
}

export default function BoothSubTypeManager({
  eventId,
  eventBooths,
  refreshEvent,
}: BoothSubTypeManagerProps) {
  // State: Which booth is selected for managing subtypes
  const [selectedBoothId, setSelectedBoothId] = useState(
    eventBooths.length > 0 ? eventBooths[0].id : ""
  );
  // Subtypes editing state (always as string for in-form edits)
  const initialEditingSubTypes = useMemo(() => {
    const booth = eventBooths.find((b) => b.id === selectedBoothId);
    return (
      booth?.subTypes?.map((st) => ({
        id: st.id,
        name: st.name,
        price: st.price?.toString() ?? "",
        description: st.description ?? "",
      })) ?? []
    );
    // eslint-disable-next-line
  }, [selectedBoothId, eventBooths.length]);
  const [editingSubTypes, setEditingSubTypes] = useState<BoothSubType[]>(initialEditingSubTypes);
  const [bulkSubTypeNames, setBulkSubTypeNames] = useState("");
  const [saving, setSaving] = useState(false);

  // Refresh rows when selected booth changes or refreshed (keep edits local only)
  React.useEffect(() => {
    const booth = eventBooths.find((b) => b.id === selectedBoothId);
    setEditingSubTypes(
      booth?.subTypes?.map((st) => ({
        id: st.id,
        name: st.name,
        price: st.price?.toString() ?? "",
        description: st.description ?? "",
      })) ?? []
    );
  }, [selectedBoothId, eventBooths]);

  if (!eventBooths.length) {
    return <div className="text-gray-500 text-lg">No booths are attached to this event.</div>;
  }

  // CRUD Handlers
  const handleSubTypeChange = (
    idx: number,
    field: keyof Omit<BoothSubType, "id">,
    value: string
  ) => {
    setEditingSubTypes((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleRemoveSubType = (idx: number) =>
    setEditingSubTypes((prev) => prev.filter((_, i) => i !== idx));

  const handleAddEmptyRow = () =>
    setEditingSubTypes((prev) => [...prev, { name: "", price: "", description: "" }]);

  const handleBulkAdd = () => {
    const names = bulkSubTypeNames
      .split(",")
      .map((n) => n.trim())
      .filter((n) => n)
      .filter(
        (n) =>
          editingSubTypes.findIndex(
            (st) => st.name.toLowerCase() === n.toLowerCase()
          ) === -1
      );
    if (names.length) {
      setEditingSubTypes((prev) => [
        ...prev,
        ...names.map((name) => ({ name, price: "", description: "" })),
      ]);
    }
    setBulkSubTypeNames("");
  };

  const boothName = eventBooths.find((b) => b.id === selectedBoothId)?.name || "";

  // Save all subtypes for selected booth
  const handleSaveSubTypes = async () => {
    setSaving(true);
    const cleaned = editingSubTypes
      .filter((st) => st.name.trim())
      .map((st) => ({
        id: st.id,
        name: st.name.trim(),
        price: parseFloat(st.price) || 0,
        description: st.description.trim(),
      }));
    try {
      const res = await fetch(
        `/api/events/${eventId}/booths/${selectedBoothId}/subtypes`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subTypes: cleaned }),
        }
      );
      if (!res.ok) {
        throw new Error(await res.text());
      }
      await refreshEvent();
    } catch (err) {
      alert("Error saving sub-types: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-3">Manage Booth Sub-Types</h2>
      <Label className="mb-1 block text-base">Choose Booth</Label>
      <select
        className="mb-6 min-w-[240px] h-12 px-4 text-lg rounded border"
        value={selectedBoothId}
        onChange={(e) => setSelectedBoothId(e.target.value)}
      >
        {eventBooths.map((booth) => (
          <option key={booth.id} value={booth.id}>
            {booth.name}
          </option>
        ))}
      </select>

      <div className="mb-3 flex flex-wrap gap-2">
        <Input
          placeholder="Type: 1A, 1B, 1C..."
          className="flex-1"
          value={bulkSubTypeNames}
          onChange={(e) => setBulkSubTypeNames(e.target.value)}
        />
        <Button size="sm" onClick={handleBulkAdd} className="h-12" variant="outline">
          + Bulk Add
        </Button>
        <Button size="sm" onClick={handleAddEmptyRow} className="h-12" variant="primary">
          + Add Empty Row
        </Button>
      </div>

      <div className="overflow-x-auto border rounded-md max-h-[350px] min-h-[150px] bg-gray-50 mb-4">
        <table className="min-w-full text-base">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="py-2 px-3 text-left">Name</th>
              <th className="py-2 px-3 text-left">Price (INR)</th>
              <th className="py-2 px-3 text-left">Description</th>
              <th className="py-2 px-3 text-left w-12"></th>
            </tr>
          </thead>
          <tbody>
            {editingSubTypes.length === 0 && (
              <tr>
                <td colSpan={4} className="py-3 px-4 text-gray-400 text-center">
                  No sub-types added yet.
                </td>
              </tr>
            )}
            {editingSubTypes.map((subType, idx) => (
              <tr key={subType.id ?? idx} className="border-b hover:bg-gray-200/50">
                <td>
                  <Input
                    value={subType.name}
                    placeholder="e.g. 1A"
                    className="min-w-[90px]"
                    onChange={(e) => handleSubTypeChange(idx, "name", e.target.value)}
                  />
                </td>
                <td>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={subType.price}
                    placeholder="Price"
                    className="min-w-[90px]"
                    onChange={(e) => handleSubTypeChange(idx, "price", e.target.value)}
                  />
                </td>
                <td className="w-[240px]">
                  <Textarea
                    rows={2}
                    value={subType.description}
                    placeholder="Description"
                    onChange={(e) => handleSubTypeChange(idx, "description", e.target.value)}
                  />
                </td>
                <td>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemoveSubType(idx)}
                    className="w-9 px-0"
                    title="Remove Sub-Type"
                  >
                    ✕
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex">
        <Button
          onClick={handleSaveSubTypes}
          disabled={saving}
          className="h-12 text-lg flex-1"variant="primary"
        >
          Save Sub-Types for "{boothName}"
        </Button>
      </div>
    </div>
  );
}
