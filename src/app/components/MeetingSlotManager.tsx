'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2, Trash2, Plus, Clock, ArrowLeftRight, Users, X, Building2, Edit2, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface MeetingSlotManagerProps {
    eventId: string;
    onClose: () => void;
}

interface MeetingSessionData {
    id: string;
    sessionIndex: number;
    startTime: string;
    endTime: string;
    companyId: string | null;
    company: { id: string; name: string; logoUrl: string | null } | null;
    companyBId: string | null;
    companyB: { id: string; name: string; logoUrl: string | null } | null;
}

interface MeetingSlotData {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    sessions: number;
    meetingSessions: MeetingSessionData[];
}

interface CompanyOption {
    id: string;
    name: string;
}

function formatTime(iso: string) {
    const d = new Date(iso);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export default function MeetingSlotManager({ eventId, onClose }: MeetingSlotManagerProps) {
    const [loading, setLoading] = useState(false);
    const [slots, setSlots] = useState<MeetingSlotData[]>([]);
    const [companies, setCompanies] = useState<CompanyOption[]>([]);
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [assigningSessionId, setAssigningSessionId] = useState<string | null>(null);
    const [assigningField, setAssigningField] = useState<'A' | 'B' | null>(null);

    // Edit sessions state
    const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
    const [editSessionCount, setEditSessionCount] = useState(1);
    const [updatingSlot, setUpdatingSlot] = useState(false);

    // Create form
    const [form, setForm] = useState({
        title: 'One-to-One Meeting',
        date: '',
        startTime: '',
        endTime: '',
        sessions: 2,
    });

    useEffect(() => {
        fetchSlots();
        fetchCompanies();
    }, [eventId]);

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const fetchSlots = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/events/${eventId}/meetings`);
            if (res.ok) setSlots(await res.json());
        } catch (err) {
            console.error(err);
            toast.error('Failed to load meeting slots');
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanies = async () => {
        try {
            const res = await fetch('/api/companies');
            if (res.ok) {
                const data = await res.json();
                setCompanies(
                    data
                        .map((c: any) => ({ id: c.id, name: c.name }))
                        .sort((a: CompanyOption, b: CompanyOption) => a.name.localeCompare(b.name))
                );
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreate = async () => {
        if (!form.date || !form.startTime || !form.endTime || form.sessions < 1) {
            toast.error('Please fill in all fields');
            return;
        }

        setCreating(true);
        try {
            const startISO = new Date(`${form.date}T${form.startTime}:00`).toISOString();
            const endISO = new Date(`${form.date}T${form.endTime}:00`).toISOString();

            const res = await fetch(`/api/events/${eventId}/meetings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: form.title,
                    startTime: startISO,
                    endTime: endISO,
                    sessions: form.sessions,
                }),
            });

            if (res.ok) {
                toast.success('Meeting slot created');
                setShowForm(false);
                setForm({ title: 'One-to-One Meeting', date: '', startTime: '', endTime: '', sessions: 2 });
                fetchSlots();
            } else {
                const err = await res.json();
                toast.error(err.error || 'Failed to create');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error creating meeting slot');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (slotId: string) => {
        if (!confirm('Delete this meeting slot and all its sessions?')) return;
        try {
            const res = await fetch(`/api/events/${eventId}/meetings/${slotId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Meeting slot deleted');
                fetchSlots();
            } else {
                toast.error('Failed to delete');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error deleting');
        }
    };

    const handleAssign = async (slotId: string, sessionId: string, field: 'A' | 'B', companyId: string) => {
        setAssigningSessionId(sessionId);
        setAssigningField(field);
        try {
            const payload: any = { sessionId };
            if (field === 'A') {
                payload.companyId = companyId || null;
            } else {
                payload.companyBId = companyId || null;
            }

            const res = await fetch(`/api/events/${eventId}/meetings/${slotId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                toast.success(companyId ? 'Company assigned' : 'Company removed');
                fetchSlots();
            } else {
                toast.error('Failed to assign');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error assigning');
        } finally {
            setAssigningSessionId(null);
            setAssigningField(null);
        }
    };

    const handleEditSessions = async (slotId: string) => {
        if (editSessionCount < 1) {
            toast.error('Must have at least 1 session');
            return;
        }
        setUpdatingSlot(true);
        try {
            const res = await fetch(`/api/events/${eventId}/meetings/${slotId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessions: editSessionCount }),
            });
            if (res.ok) {
                toast.success('Sessions updated');
                setEditingSlotId(null);
                fetchSlots();
            } else {
                const err = await res.json();
                toast.error(err.error || 'Failed to update');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error updating sessions');
        } finally {
            setUpdatingSlot(false);
        }
    };

    // Calculate preview of session durations
    const previewDuration = () => {
        if (!form.date || !form.startTime || !form.endTime || form.sessions < 1) return '';
        const s = new Date(`${form.date}T${form.startTime}:00`);
        const e = new Date(`${form.date}T${form.endTime}:00`);
        if (e <= s) return '';
        const totalMin = (e.getTime() - s.getTime()) / 60000;
        const perSession = Math.floor(totalMin / form.sessions);
        return `${perSession} min each`;
    };

    const isAssigning = (sessionId: string, field: 'A' | 'B') =>
        assigningSessionId === sessionId && assigningField === field;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-start justify-center"
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 40, scale: 0.97 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative z-10 w-full max-w-5xl mx-4 my-6 max-h-[calc(100vh-48px)] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="flex-none flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-[#5da765]/10 flex items-center justify-center">
                                <Users className="h-6 w-6 text-[#5da765]" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">One-to-One Meetings</h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Create meeting slots and pair companies for one-to-one sessions
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="h-10 w-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                        >
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-6">
                        {/* Create Button / Form */}
                        {!showForm ? (
                            <Button
                                onClick={() => setShowForm(true)}
                                className="bg-[#5da765] hover:bg-[#4a8a52] text-white font-bold rounded-xl h-12 px-6 shadow-lg shadow-green-900/10"
                            >
                                <Plus className="h-4 w-4 mr-2" /> Create Meeting Slot
                            </Button>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 p-6 space-y-5 shadow-sm"
                            >
                                <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wider flex items-center gap-2">
                                    <Plus className="h-4 w-4 text-[#5da765]" />
                                    New Meeting Slot
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <Label className="text-gray-700 font-semibold mb-1.5 block">Title</Label>
                                        <Input
                                            className="rounded-xl border-gray-200 h-11"
                                            value={form.title}
                                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-gray-700 font-semibold mb-1.5 block">Date</Label>
                                        <Input
                                            type="date"
                                            className="rounded-xl border-gray-200 h-11"
                                            value={form.date}
                                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div>
                                        <Label className="text-gray-700 font-semibold mb-1.5 block">Start Time</Label>
                                        <Input
                                            type="time"
                                            className="rounded-xl border-gray-200 h-11"
                                            value={form.startTime}
                                            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-gray-700 font-semibold mb-1.5 block">End Time</Label>
                                        <Input
                                            type="time"
                                            className="rounded-xl border-gray-200 h-11"
                                            value={form.endTime}
                                            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-gray-700 font-semibold mb-1.5 block">
                                            Sessions
                                            {previewDuration() && (
                                                <span className="ml-2 text-xs font-normal text-[#5da765]">
                                                    ({previewDuration()})
                                                </span>
                                            )}
                                        </Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={20}
                                            className="rounded-xl border-gray-200 h-11"
                                            value={form.sessions}
                                            onChange={(e) =>
                                                setForm({ ...form, sessions: Math.max(1, parseInt(e.target.value) || 1) })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1 rounded-xl h-11 font-semibold"
                                        onClick={() => setShowForm(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleCreate}
                                        disabled={creating}
                                        className="flex-1 bg-[#5da765] hover:bg-[#4a8a52] text-white rounded-xl h-11 font-semibold"
                                    >
                                        {creating ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                                        Create Slot
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* List Meeting Slots */}
                        {loading ? (
                            <div className="py-16 flex justify-center">
                                <Loader2 className="animate-spin h-10 w-10 text-gray-300" />
                            </div>
                        ) : slots.length === 0 ? (
                            <div className="py-16 text-center border-2 border-dashed border-gray-100 rounded-2xl text-gray-400">
                                <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                <p className="font-semibold text-lg text-gray-500">No meeting slots created yet</p>
                                <p className="text-sm mt-1">Create your first meeting slot to pair companies</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {slots.map((slot) => (
                                    <motion.div
                                        key={slot.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                                    >
                                        {/* Slot header */}
                                        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-[#5da765]/10 flex items-center justify-center">
                                                    <Clock className="h-5 w-5 text-[#5da765]" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800">{slot.title}</h4>
                                                    <p className="text-sm text-gray-500 flex items-center gap-1.5">
                                                        <Clock className="h-3 w-3" />
                                                        {formatDate(slot.startTime)} • {formatTime(slot.startTime)} — {formatTime(slot.endTime)}
                                                        <span className="ml-2 px-2 py-0.5 bg-[#5da765]/10 text-[#5da765] text-xs font-bold rounded-md">
                                                            {slot.sessions} sessions
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditingSlotId(editingSlotId === slot.id ? null : slot.id);
                                                        setEditSessionCount(slot.sessions);
                                                    }}
                                                    className="text-gray-400 hover:text-[#5da765] hover:bg-green-50 rounded-lg"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(slot.id)}
                                                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Edit sessions inline form */}
                                        {editingSlotId === slot.id && (
                                            <div className="mx-5 mt-4 p-4 rounded-xl bg-amber-50/50 border border-amber-200/50">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1">
                                                        <Label className="text-gray-600 font-semibold text-xs uppercase tracking-wider mb-1.5 block">Number of Sessions</Label>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-9 w-9 p-0 rounded-lg"
                                                                onClick={() => setEditSessionCount(Math.max(1, editSessionCount - 1))}
                                                                disabled={editSessionCount <= 1 || updatingSlot}
                                                            >
                                                                −
                                                            </Button>
                                                            <Input
                                                                type="number"
                                                                min={1}
                                                                max={20}
                                                                className="w-20 text-center rounded-lg h-9 font-bold text-lg"
                                                                value={editSessionCount}
                                                                onChange={(e) => setEditSessionCount(Math.max(1, parseInt(e.target.value) || 1))}
                                                                disabled={updatingSlot}
                                                            />
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-9 w-9 p-0 rounded-lg"
                                                                onClick={() => setEditSessionCount(Math.min(20, editSessionCount + 1))}
                                                                disabled={editSessionCount >= 20 || updatingSlot}
                                                            >
                                                                +
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 pt-5">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="rounded-lg h-9 px-4 font-semibold"
                                                            onClick={() => setEditingSlotId(null)}
                                                            disabled={updatingSlot}
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="bg-[#5da765] hover:bg-[#4a8a52] text-white rounded-lg h-9 px-4 font-semibold"
                                                            onClick={() => handleEditSessions(slot.id)}
                                                            disabled={updatingSlot || editSessionCount === slot.sessions}
                                                        >
                                                            {updatingSlot ? <Loader2 className="animate-spin h-4 w-4 mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                                                            Save
                                                        </Button>
                                                    </div>
                                                </div>
                                                {editSessionCount !== slot.sessions && (
                                                    <p className="text-xs text-amber-700 mt-2 font-medium">
                                                        {editSessionCount > slot.sessions
                                                            ? `Adding ${editSessionCount - slot.sessions} session(s). Times will be recalculated.`
                                                            : `Removing ${slot.sessions - editSessionCount} session(s) from the end. Company assignments on removed sessions will be lost.`
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Sessions — two company columns */}
                                        <div className="p-5 space-y-3">
                                            {/* Column headers */}
                                            <div className="hidden md:grid grid-cols-[48px_1fr_48px_1fr] gap-3 px-4 pb-2">
                                                <div />
                                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                    Company A
                                                </div>
                                                <div />
                                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                    Company B
                                                </div>
                                            </div>

                                            {slot.meetingSessions.map((session, idx) => (
                                                <div
                                                    key={session.id}
                                                    className="group rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all p-4"
                                                >
                                                    <div className="grid grid-cols-1 md:grid-cols-[48px_1fr_48px_1fr] gap-3 items-center">
                                                        {/* Session index badge */}
                                                        <div className="hidden md:flex flex-none w-10 h-10 rounded-lg bg-white border border-gray-200 items-center justify-center text-sm font-bold text-gray-600 shadow-sm">
                                                            {idx + 1}
                                                        </div>

                                                        {/* Company A */}
                                                        <div>
                                                            <div className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                                                                Company A
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-none h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                                                                    <Building2 className="h-4 w-4 text-blue-500" />
                                                                </div>
                                                                <select
                                                                    className="w-full h-10 rounded-lg border-gray-200 text-sm font-medium focus:ring-[#5da765] focus:border-[#5da765] disabled:opacity-50 bg-white"
                                                                    value={session.companyId || ''}
                                                                    disabled={isAssigning(session.id, 'A')}
                                                                    onChange={(e) =>
                                                                        handleAssign(slot.id, session.id, 'A', e.target.value)
                                                                    }
                                                                >
                                                                    <option value="">— Select Company A —</option>
                                                                    {companies.map((c) => (
                                                                        <option key={c.id} value={c.id}>
                                                                            {c.name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                {isAssigning(session.id, 'A') && (
                                                                    <Loader2 className="h-4 w-4 animate-spin text-gray-400 flex-none" />
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Arrow connector */}
                                                        <div className="hidden md:flex items-center justify-center">
                                                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-50 to-orange-50 border border-gray-100 flex items-center justify-center">
                                                                <ArrowLeftRight className="h-4 w-4 text-gray-400" />
                                                            </div>
                                                        </div>

                                                        {/* Company B */}
                                                        <div>
                                                            <div className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 mt-3">
                                                                Company B
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-none h-8 w-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center">
                                                                    <Building2 className="h-4 w-4 text-orange-500" />
                                                                </div>
                                                                <select
                                                                    className="w-full h-10 rounded-lg border-gray-200 text-sm font-medium focus:ring-[#5da765] focus:border-[#5da765] disabled:opacity-50 bg-white"
                                                                    value={session.companyBId || ''}
                                                                    disabled={isAssigning(session.id, 'B')}
                                                                    onChange={(e) =>
                                                                        handleAssign(slot.id, session.id, 'B', e.target.value)
                                                                    }
                                                                >
                                                                    <option value="">— Select Company B —</option>
                                                                    {companies.map((c) => (
                                                                        <option key={c.id} value={c.id}>
                                                                            {c.name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                {isAssigning(session.id, 'B') && (
                                                                    <Loader2 className="h-4 w-4 animate-spin text-gray-400 flex-none" />
                                                                )}
                                                            </div>
                                                        </div>


                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
