
import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Loader2, Trash2, Plus, Building2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface SponsorAssignmentManagerProps {
    eventId: string;
    sponsorTypeId: string;
    sponsorTypeName: string;
    maxSlots: number;
}

interface AssignedCompany {
    orderId: string;
    company: {
        id: string;
        name: string;
        logoUrl: string | null;
    };
    purchaseDate: string;
}

interface CompanyOption {
    id: string;
    name: string;
}

export default function SponsorAssignmentManager({
    eventId,
    sponsorTypeId,
    sponsorTypeName,
    maxSlots,
}: SponsorAssignmentManagerProps) {
    const [loading, setLoading] = useState(false);
    const [assignments, setAssignments] = useState<AssignedCompany[]>([]);
    const [companies, setCompanies] = useState<CompanyOption[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState("");
    const [assigning, setAssigning] = useState(false);

    // Fetch initial data
    useEffect(() => {
        fetchAssignments();
        fetchCompanies();
    }, [eventId, sponsorTypeId]);

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/events/${eventId}/sponsors/${sponsorTypeId}/assignments`
            );
            if (res.ok) {
                setAssignments(await res.json());
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load assignments");
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanies = async () => {
        try {
            // Assuming there's an API to search/list companies. 
            // If not, we might need to create one or use an existing one.
            // Based on file list, `api/companies` likely returns a list.
            const res = await fetch("/api/companies");
            if (res.ok) {
                const data = await res.json();
                // The API output seen earlier seems to be an array of objects
                setCompanies(
                    data.map((c: any) => ({
                        id: c.id,
                        name: c.name,
                    }))
                        .sort((a: any, b: any) => a.name.localeCompare(b.name))
                );
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleAssign = async () => {
        if (!selectedCompanyId) return;
        setAssigning(true);
        try {
            const res = await fetch(
                `/api/events/${eventId}/sponsors/${sponsorTypeId}/assignments`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ companyId: selectedCompanyId }),
                }
            );

            if (res.ok) {
                toast.success("Company assigned successfully");
                setSelectedCompanyId("");
                fetchAssignments();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to assign company");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error assigning company");
        } finally {
            setAssigning(false);
        }
    };

    const handleUnassign = async (orderId: string) => {
        if (!confirm("Are you sure you want to remove this company from this sponsorship?")) return;

        try {
            const res = await fetch(
                `/api/events/${eventId}/sponsors/${sponsorTypeId}/assignments?orderId=${orderId}`,
                {
                    method: "DELETE",
                }
            );

            if (res.ok) {
                toast.success("Company removed");
                fetchAssignments();
            } else {
                toast.error("Failed to remove company");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error removing company");
        }
    };

    const slotsUsed = assignments.length;
    const isFull = slotsUsed >= maxSlots;

    return (
        <div className="space-y-6">
            <div className="border-b border-gray-100 pb-4 flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">
                        Assignments for <span className="text-[#004aad]">{sponsorTypeName}</span>
                    </h3>
                    <p className="text-sm text-gray-500">
                        Manage companies assigned to this sponsorship package.
                    </p>
                </div>
                <div className={`px-3 py-1 rounded-lg text-sm font-bold ${isFull ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {slotsUsed} / {maxSlots} Slots Used
                </div>
            </div>

            {/* Add New Assignment */}
            <div className="flex flex-col sm:flex-row gap-3 items-end bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex-1 w-full">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                        Select Company
                    </label>
                    <select
                        className="w-full h-11 rounded-lg border-gray-200 focus:ring-[#004aad] focus:border-[#004aad] disabled:opacity-50 disabled:bg-gray-100"
                        value={selectedCompanyId}
                        onChange={(e) => setSelectedCompanyId(e.target.value)}
                        disabled={isFull}
                    >
                        <option value="">{isFull ? "No slots available" : "-- Choose a Company --"}</option>
                        {companies.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>
                <Button
                    onClick={handleAssign}
                    disabled={!selectedCompanyId || assigning || isFull}
                    className="h-11 bg-[#004aad] hover:bg-[#00317a] text-white font-bold px-6 min-w-[120px]"
                >
                    {assigning ? <Loader2 className="animate-spin h-5 w-5" /> : <><Plus className="h-4 w-4 mr-2" /> Assign</>}
                </Button>
            </div>

            {/* List Assignments */}
            <div className="space-y-3">
                {loading ? (
                    <div className="py-8 flex justify-center">
                        <Loader2 className="animate-spin h-8 w-8 text-gray-300" />
                    </div>
                ) : assignments.length === 0 ? (
                    <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-xl text-gray-400">
                        No companies assigned yet.
                    </div>
                ) : (
                    assignments.map((assignment) => (
                        <div
                            key={assignment.orderId}
                            className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100 overflow-hidden">
                                    {assignment.company.logoUrl ? (
                                        <img
                                            src={assignment.company.logoUrl}
                                            alt={assignment.company.name}
                                            className="h-full w-full object-contain"
                                        />
                                    ) : (
                                        <Building2 className="h-6 w-6 text-gray-300" />
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800">{assignment.company.name}</h4>
                                    <p className="text-xs text-gray-500">
                                        Assigned on {new Date(assignment.purchaseDate).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnassign(assignment.orderId)}
                                className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
