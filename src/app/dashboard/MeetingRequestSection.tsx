'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Users, Send, CheckCircle, XCircle, Clock, Building2, ArrowRight, X, Loader2, MessageSquare, ChevronDown, MapPin, Coffee } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface ConferenceTicket {
    eventId: string;
    eventName: string;
}

interface MeetingRequestSectionProps {
    companyId: string;
    conferenceTickets: ConferenceTicket[];
}

interface MeetingSessionOption {
    id: string;
    sessionIndex: number;
    startTime: string;
    endTime: string;
    companyId: string | null;
    companyBId: string | null;
    table: string | null;
}

interface MeetingSlotOption {
    id: string;
    eventId: string;
    title: string;
    startTime: string;
    endTime: string;
    sessions: number;
    meetingSessions: MeetingSessionOption[];
    blockedMeetingSlots?: { companyId: string }[];
    meetingRequests?: { fromCompanyId: string; toCompanyId: string }[];
}

interface CompanyOption {
    id: string;
    name: string;
    logoUrl: string | null;
    location?: { city: string; country: string } | null;
}

interface MeetingRequest {
    id: string;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
    message: string | null;
    declineReason: string | null;
    createdAt: string;
    fromCompany: CompanyOption;
    toCompany: CompanyOption;
    event: { id: string; name: string };
    meetingSlot: {
        id: string;
        title: string;
        startTime: string;
        endTime: string;
        meetingSessions?: { table: string | null }[];
    };
}

function formatTime24(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MeetingRequestSection({ companyId, conferenceTickets }: MeetingRequestSectionProps) {
    const [showModal, setShowModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<ConferenceTicket | null>(null);
    const [sessions, setSessions] = useState<MeetingSessionOption[]>([]);
    const [companies, setCompanies] = useState<CompanyOption[]>([]);
    const [requests, setRequests] = useState<MeetingRequest[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [sending, setSending] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [decliningRequestId, setDecliningRequestId] = useState<string | null>(null);
    const [declineReason, setDeclineReason] = useState('');

    // Block status state
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [blockingSlots, setBlockingSlots] = useState<Set<string>>(new Set());
    const [savingBlocks, setSavingBlocks] = useState(false);
    const [blockEvent, setBlockEvent] = useState<ConferenceTicket | null>(null);

    // Form state
    const [slots, setSlots] = useState<MeetingSlotOption[]>([]);
    const [busyMap, setBusyMap] = useState<Map<string, Set<string>>>(new Map());
    const [selectedSlotId, setSelectedSlotId] = useState('');
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [message, setMessage] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Logic to close dropdown if clicked outside
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    useEffect(() => {
        fetchRequests();
    }, [companyId]);

    const fetchRequests = async () => {
        setLoadingRequests(true);
        try {
            const res = await fetch(`/api/meeting-requests?companyId=${companyId}`);
            if (res.ok) {
                setRequests(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingRequests(false);
        }
    };

    const openModal = async (ticket: ConferenceTicket) => {
        setSelectedEvent(ticket);
        setShowModal(true);
        setSelectedSlotId('');
        setSelectedCompanyId('');
        setMessage('');
        setLoadingSessions(true);

        try {
            // Fetch available sessions for this event
            const sessRes = await fetch(`/api/events/${ticket.eventId}/meetings`);
            if (sessRes.ok) {
                const fetchedSlots = await sessRes.json();
                setSlots(fetchedSlots);

                const newBusyMap = new Map<string, Set<string>>();

                for (const slot of fetchedSlots) {
                    // Track busy company per time slot entirely
                    const timeKey = `${slot.startTime}_${slot.endTime}`;
                    if (!newBusyMap.has(timeKey)) newBusyMap.set(timeKey, new Set());
                    const busySet = newBusyMap.get(timeKey)!;

                    for (const session of slot.meetingSessions || []) {
                        if (session.companyId) {
                            busySet.add(typeof session.companyId === 'string' ? session.companyId : session.companyId.id || session.companyId);
                        }
                        if (session.companyBId) {
                            busySet.add(typeof session.companyBId === 'string' ? session.companyBId : session.companyBId.id || session.companyBId);
                        }
                        // Also from company objects if populated
                        if ((session as any).company?.id) busySet.add((session as any).company.id);
                        if ((session as any).companyB?.id) busySet.add((session as any).companyB.id);
                    }

                    // Track explicit blocks
                    for (const block of slot.blockedMeetingSlots || []) {
                        if (block.companyId) busySet.add(block.companyId);
                    }

                    // Track pending/accepted requests
                    for (const req of slot.meetingRequests || []) {
                        if (req.fromCompanyId) busySet.add(req.fromCompanyId);
                        if (req.toCompanyId) busySet.add(req.toCompanyId);
                    }
                }
                setBusyMap(newBusyMap);
            }

            // Fetch companies that bought tickets for this event (excluding current company)
            const compRes = await fetch(`/api/meeting-requests/eligible-companies?eventId=${ticket.eventId}&excludeCompanyId=${companyId}`);
            if (compRes.ok) {
                setCompanies(await compRes.json());
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to load data');
        } finally {
            setLoadingSessions(false);
        }
    };

    const openBlockModal = async (ticket: ConferenceTicket) => {
        setBlockEvent(ticket);
        setShowBlockModal(true);
        setBlockingSlots(new Set());
        setLoadingSessions(true);

        try {
            // Fetch available sessions for this event
            const sessRes = await fetch(`/api/events/${ticket.eventId}/meetings`);
            if (sessRes.ok) {
                const fetchedSlots = await sessRes.json();
                setSlots(fetchedSlots);
            }

            // Fetch explicitly blocked slots for this company
            const blockRes = await fetch(`/api/meeting-requests/blocked-slots?companyId=${companyId}&eventId=${ticket.eventId}`);
            if (blockRes.ok) {
                const blockedSlotIds = await blockRes.json();
                setBlockingSlots(new Set(blockedSlotIds));
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to load slots');
        } finally {
            setLoadingSessions(false);
        }
    };

    const handleSaveBlocks = async () => {
        if (!blockEvent) return;
        setSavingBlocks(true);
        try {
            const res = await fetch('/api/meeting-requests/blocked-slots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyId,
                    eventId: blockEvent.eventId,
                    meetingSlotIds: Array.from(blockingSlots),
                }),
            });

            if (res.ok) {
                toast.success('Blocked status updated!');
                setShowBlockModal(false);
            } else {
                toast.error('Failed to update blocked status');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error updating blocked status');
        } finally {
            setSavingBlocks(false);
        }
    };

    const handleSendRequest = async () => {
        if (!selectedSlotId || !selectedCompanyId || !selectedEvent) {
            toast.error('Please select a time slot and a company');
            return;
        }

        setSending(true);
        try {
            const res = await fetch('/api/meeting-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId: selectedEvent.eventId,
                    meetingSlotId: selectedSlotId,
                    fromCompanyId: companyId,
                    toCompanyId: selectedCompanyId,
                    message: message || undefined,
                }),
            });

            if (res.ok) {
                toast.success('Meeting request sent!');
                setShowModal(false);
                fetchRequests();
            } else {
                const err = await res.json();
                toast.error(err.error || 'Failed to send request');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error sending request');
        } finally {
            setSending(false);
        }
    };

    const handleRespond = async (requestId: string, status: 'ACCEPTED' | 'DECLINED', reason?: string) => {
        setProcessingId(requestId);
        try {
            const res = await fetch(`/api/meeting-requests/${requestId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, declineReason: reason }),
            });

            if (res.ok) {
                toast.success(status === 'ACCEPTED' ? 'Meeting accepted!' : 'Meeting declined');
                fetchRequests();
            } else {
                const err = await res.json();
                toast.error(err.error || 'Failed to respond');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error responding to request');
        } finally {
            setProcessingId(null);
        }
    };

    const handleCancel = async (requestId: string) => {
        if (!confirm('Are you sure you want to cancel this meeting request?')) return;

        setProcessingId(requestId);
        try {
            const res = await fetch(`/api/meeting-requests/${requestId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success('Meeting request cancelled');
                fetchRequests();
            } else {
                const err = await res.json();
                toast.error(err.error || 'Failed to cancel request');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error cancelling request');
        } finally {
            setProcessingId(null);
        }
    };

    const incomingRequests = requests.filter((r) => r.toCompany.id === companyId);
    const outgoingRequests = requests.filter((r) => r.fromCompany.id === companyId);

    const statusBadge = (status: string, table?: string | null) => {
        switch (status) {
            case 'PENDING':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="h-3 w-3" /> Pending
                    </span>
                );
            case 'ACCEPTED':
                return (
                    <div className="flex flex-col items-end gap-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                            <CheckCircle className="h-3 w-3" /> Accepted
                        </span>
                        {table && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-[#004aad]/10 text-[#004aad]">
                                <MapPin className="h-3 w-3 flex-none" /> {table}
                            </span>
                        )}
                    </div>
                );
            case 'DECLINED':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                        <XCircle className="h-3 w-3" /> Declined
                    </span>
                );
        }
    };

    if (conferenceTickets.length === 0) return null;

    return (
        <div className="space-y-6">
            {/* Request Meeting Buttons */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 rounded-xl bg-[#004aad]/10">
                        <Users className="w-5 h-5 text-[#004aad]" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">One-to-One Meetings</h3>
                        <p className="text-sm text-gray-500">Request meetings with other conference attendees</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {conferenceTickets.map((ticket) => (
                        <div key={ticket.eventId} className="space-y-2">
                            <button
                                onClick={() => openModal(ticket)}
                                className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gradient-to-r from-gray-50 to-white hover:from-[#004aad]/5 hover:to-white hover:border-[#004aad]/20 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-[#004aad]/10 flex items-center justify-center group-hover:bg-[#004aad]/20 transition-colors">
                                        <Send className="h-4 w-4 text-[#004aad]" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-gray-800 text-sm">Request One-to-One Meeting</div>
                                        <div className="text-xs text-gray-500">{ticket.eventName}</div>
                                    </div>
                                </div>
                                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#004aad] transition-colors" />
                            </button>

                            <button
                                onClick={() => openBlockModal(ticket)}
                                className="w-full flex items-center justify-between p-3 rounded-xl border border-dashed border-gray-200 bg-white hover:bg-gray-50 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                                        <XCircle className="h-4 w-4 text-gray-500" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold text-gray-600 text-sm">Manage Blocked Status</div>
                                        <div className="text-xs text-gray-400">Block yourself from specific meetings sessions</div>
                                    </div>
                                </div>
                                <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Meeting Requests List */}
            {(incomingRequests.length > 0 || outgoingRequests.length > 0) && (
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2.5 rounded-xl bg-purple-50">
                            <MessageSquare className="w-5 h-5 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Meeting Requests</h3>
                    </div>

                    {/* Incoming */}
                    {incomingRequests.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Received</h4>
                            <div className="space-y-3">
                                {incomingRequests.map((req) => (
                                    <div key={req.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-sm text-gray-800">{req.fromCompany.name}</span>
                                                    <ArrowRight className="h-3 w-3 text-gray-400" />
                                                    <span className="text-sm text-gray-500">You</span>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {formatDate(req.meetingSlot.startTime)} · {req.meetingSlot.title} · {formatTime24(req.meetingSlot.startTime)} – {formatTime24(req.meetingSlot.endTime)}
                                                </div>
                                                {req.message && (
                                                    <p className="text-xs text-gray-600 mt-1 italic">&quot;{req.message}&quot;</p>
                                                )}
                                                {req.status === 'DECLINED' && req.declineReason && (
                                                    <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded-md border border-red-100">
                                                        <span className="font-bold">Decline reason:</span> {req.declineReason}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 flex-none">
                                                {req.status === 'PENDING' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleRespond(req.id, 'ACCEPTED')}
                                                            disabled={processingId === req.id}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
                                                        >
                                                            {processingId === req.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => { setDecliningRequestId(req.id); setDeclineReason(''); }}
                                                            disabled={processingId === req.id || decliningRequestId !== null}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-300 transition-colors disabled:opacity-50"
                                                        >
                                                            <XCircle className="h-3 w-3" /> Decline
                                                        </button>
                                                    </>
                                                ) : (
                                                    statusBadge(req.status, req.meetingSlot.meetingSessions?.[0]?.table)
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Outgoing */}
                    {outgoingRequests.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Sent</h4>
                            <div className="space-y-3">
                                {outgoingRequests.map((req) => (
                                    <div key={req.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm text-gray-500">You</span>
                                                    <ArrowRight className="h-3 w-3 text-gray-400" />
                                                    <span className="font-bold text-sm text-gray-800">{req.toCompany.name}</span>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {formatDate(req.meetingSlot.startTime)} · {req.meetingSlot.title} · {formatTime24(req.meetingSlot.startTime)} – {formatTime24(req.meetingSlot.endTime)}
                                                </div>
                                                {req.status === 'DECLINED' && req.declineReason && (
                                                    <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded-md border border-red-100">
                                                        <span className="font-bold">Decline reason:</span> {req.declineReason}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end gap-2 text-right flex-none">
                                                {statusBadge(req.status, req.meetingSlot.meetingSessions?.[0]?.table)}
                                                {req.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => handleCancel(req.id)}
                                                        disabled={processingId === req.id}
                                                        className="inline-flex items-center gap-1 text-xs text-red-600 font-semibold hover:text-red-700 transition-colors disabled:opacity-50"
                                                    >
                                                        {processingId === req.id ? <Loader2 className="h-3 w-3 animate-spin inline" /> : <X className="h-3 w-3 inline" />}
                                                        Cancel Request
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Request Modal */}
            <AnimatePresence>
                {showModal && selectedEvent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center"
                    >
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />

                        <motion.div
                            initial={{ opacity: 0, y: 30, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 30, scale: 0.97 }}
                            className="relative z-10 w-full max-w-5xl mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Header */}
                            <div className="flex-none flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-[#004aad]/10 flex items-center justify-center">
                                        <Users className="h-6 w-6 text-[#004aad]" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">Request One-to-One Meeting</h3>
                                        <p className="text-sm text-gray-500 mt-0.5">{selectedEvent.eventName}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowModal(false)} className="h-10 w-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                                    <X className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-8 overflow-y-auto flex-1">
                                {loadingSessions ? (
                                    <div className="py-20 flex flex-col items-center justify-center">
                                        <Loader2 className="animate-spin h-10 w-10 text-[#004aad] mb-4" />
                                        <p className="text-gray-500 font-medium text-sm">Loading available sessions...</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                                        {/* Left Side: Select Session (takes 3 cols on large screens) */}
                                        <div className="lg:col-span-3 space-y-5">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="h-8 w-8 rounded-full bg-[#004aad]/10 text-[#004aad] flex items-center justify-center font-bold text-sm">1</div>
                                                <h4 className="text-base font-bold text-gray-800">Select Meeting Session</h4>
                                            </div>

                                            {slots.length === 0 ? (
                                                <div className="text-sm text-gray-400 py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                                                    <Clock className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                                                    <p className="font-semibold text-gray-500">No meeting slots available</p>
                                                    <p className="mt-1">Check back later for open slots.</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                                    {slots.map((slot: any) => {
                                                        const is11_27Mar = formatTime24(slot.startTime) === '11:00' && formatDate(slot.startTime).includes('27 Mar');
                                                        return (
                                                            <React.Fragment key={slot.id}>
                                                                {false && is11_27Mar && (
                                                                    <div className="col-span-full p-4 rounded-xl border border-orange-100 bg-gradient-to-r from-orange-50 to-white flex items-center justify-between shadow-sm opacity-90 my-2">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="h-10 w-10 rounded-lg bg-orange-100/70 flex items-center justify-center">
                                                                                <Coffee className="h-5 w-5 text-orange-600" />
                                                                            </div>
                                                                            <div>
                                                                                <div className="font-bold text-gray-800 text-sm">Tea Break</div>
                                                                                <div className="text-xs text-gray-500">27 Mar 2026 • 10:30 — 11:00</div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-lg tracking-wide">
                                                                            BREAK
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <label
                                                                    className={`relative flex flex-col p-5 rounded-2xl border-2 transition-all cursor-pointer group hover:shadow-md ${selectedSlotId === slot.id
                                                                        ? 'border-[#004aad] bg-gradient-to-br from-[#004aad]/5 to-white shadow-sm'
                                                                        : 'bg-white border-gray-100 hover:border-[#004aad]/30'
                                                                        }`}
                                                                >
                                                                    <input
                                                                        type="radio"
                                                                        name="meetingSlot"
                                                                        className="absolute top-4 right-4 h-4 w-4 accent-[#004aad] cursor-pointer"
                                                                        checked={selectedSlotId === slot.id}
                                                                        onChange={() => {
                                                                            setSelectedSlotId(slot.id);
                                                                            setSelectedCompanyId('');
                                                                        }}
                                                                    />
                                                                    <div className="mb-4">
                                                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${selectedSlotId === slot.id ? 'bg-[#004aad] text-white shadow-lg shadow-blue-900/20' : 'bg-[#004aad]/10 text-[#004aad] group-hover:bg-[#004aad]/20'}`}>
                                                                            <Users className="h-6 w-6" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <h4 className="font-bold text-gray-900 text-base mb-1">{slot.title}</h4>
                                                                        <div className="text-xs font-medium text-gray-500 mb-2">{formatDate(slot.startTime)}</div>
                                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">
                                                                            <Clock className="h-3.5 w-3.5 text-gray-500" />
                                                                            {formatTime24(slot.startTime)} — {formatTime24(slot.endTime)}
                                                                        </div>
                                                                    </div>
                                                                </label>
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Side: Company & Message (takes 2 cols) */}
                                        <div className="lg:col-span-2 space-y-6 lg:border-l lg:border-gray-100 lg:pl-8">
                                            <div>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="h-8 w-8 rounded-full bg-[#004aad]/10 text-[#004aad] flex items-center justify-center font-bold text-sm">2</div>
                                                    <h4 className="text-base font-bold text-gray-800">Select Company</h4>
                                                </div>
                                                {(() => {
                                                    const selectedSlot = slots.find((s) => s.id === selectedSlotId);
                                                    const timeKey = selectedSlot ? `${selectedSlot.startTime}_${selectedSlot.endTime}` : null;
                                                    const busyCompanyIds = new Set(timeKey ? busyMap.get(timeKey) || new Set() : []);

                                                    let availableCompanies = companies.filter(c => !busyCompanyIds.has(c.id));

                                                    if (availableCompanies.length === 0) {
                                                        return (
                                                            <div className="text-sm text-gray-400 py-6 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                                                                {timeKey ? 'No available companies for this time slot' : 'Select a time slot first'}
                                                            </div>
                                                        );
                                                    }

                                                    const selectedCompany = availableCompanies.find(c => c.id === selectedCompanyId);

                                                    return (
                                                        <div className="relative" ref={dropdownRef}>
                                                            {/* Custom Dropdown Trigger */}
                                                            <button
                                                                type="button"
                                                                onClick={() => !(!selectedSlotId) && setIsDropdownOpen(!isDropdownOpen)}
                                                                disabled={!selectedSlotId}
                                                                className={`w-full h-auto min-h-[48px] py-2 pl-4 pr-10 rounded-xl border text-left flex items-center justify-between transition-colors bg-white ${!selectedSlotId ? 'opacity-50 cursor-not-allowed border-gray-200' :
                                                                    isDropdownOpen ? 'border-[#004aad] ring-2 ring-[#004aad]/20 shadow-sm' : 'border-gray-200 hover:border-gray-300 shadow-sm'
                                                                    }`}
                                                            >
                                                                {!selectedSlotId ? (
                                                                    <span className="text-gray-500 font-medium text-sm flex items-center gap-3">
                                                                        <Building2 className="h-5 w-5 text-gray-400 flex-none" />
                                                                        — Select a time slot first —
                                                                    </span>
                                                                ) : !selectedCompany ? (
                                                                    <span className="text-gray-500 font-medium text-sm flex items-center gap-3">
                                                                        <Building2 className="h-5 w-5 text-gray-400 flex-none" />
                                                                        — Choose a company —
                                                                    </span>
                                                                ) : (
                                                                    <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                                                                        <div className="h-8 w-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-none overflow-hidden">
                                                                            {selectedCompany.logoUrl ? (
                                                                                <img src={selectedCompany.logoUrl} alt="" className="w-full h-full object-contain p-1" />
                                                                            ) : (
                                                                                <Building2 className="h-4 w-4 text-gray-400" />
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="font-bold text-gray-900 text-sm truncate">{selectedCompany.name}</div>
                                                                            {selectedCompany.location && (
                                                                                <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                                                                                    <MapPin className="h-3 w-3 flex-none" />
                                                                                    {selectedCompany.location.city ? `${selectedCompany.location.city}, ` : ''}{selectedCompany.location.country}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <ChevronDown className={`absolute right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                                            </button>

                                                            {/* Dropdown Menu */}
                                                            <AnimatePresence>
                                                                {isDropdownOpen && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, y: -5 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        exit={{ opacity: 0, y: -5 }}
                                                                        transition={{ duration: 0.15 }}
                                                                        className="absolute z-20 top-[calc(100%+8px)] left-0 w-full bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden"
                                                                    >
                                                                        <div className="max-h-60 overflow-y-auto py-2 overscroll-contain no-scrollbar">
                                                                            {availableCompanies.map((c) => {
                                                                                const isSelected = selectedCompanyId === c.id;
                                                                                return (
                                                                                    <button
                                                                                        key={c.id}
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            setSelectedCompanyId(c.id);
                                                                                            setIsDropdownOpen(false);
                                                                                        }}
                                                                                        className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${isSelected ? 'bg-[#004aad]/5' : 'hover:bg-gray-50'
                                                                                            }`}
                                                                                    >
                                                                                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-none border transition-colors ${isSelected ? 'bg-white border-[#004aad]/20' : 'bg-white border-gray-100'
                                                                                            } overflow-hidden`}>
                                                                                            {c.logoUrl ? (
                                                                                                <img src={c.logoUrl} alt="" className="w-full h-full object-contain p-1.5" />
                                                                                            ) : (
                                                                                                <Building2 className={`h-5 w-5 ${isSelected ? 'text-[#004aad]' : 'text-gray-400'}`} />
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="flex-1 min-w-0 pt-0.5">
                                                                                            <div className={`font-bold text-sm truncate ${isSelected ? 'text-[#004aad]' : 'text-gray-900'}`}>
                                                                                                {c.name}
                                                                                            </div>
                                                                                            {c.location && (
                                                                                                <div className="text-xs text-gray-500 flex items-center gap-1 mt-1 truncate">
                                                                                                    <MapPin className="h-3 w-3" />
                                                                                                    {c.location.city ? `${c.location.city}, ` : ''}{c.location.country}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                        {isSelected && (
                                                                                            <CheckCircle className="h-5 w-5 text-[#004aad] flex-none mt-1" />
                                                                                        )}
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="h-8 w-8 rounded-full bg-[#004aad]/10 text-[#004aad] flex items-center justify-center font-bold text-sm">3</div>
                                                    <h4 className="text-base font-bold text-gray-800">Add Message <span className="text-gray-400 font-normal text-sm">(optional)</span></h4>
                                                </div>
                                                <textarea
                                                    rows={4}
                                                    className="w-full rounded-xl border-gray-200 text-sm focus:ring-[#004aad] focus:border-[#004aad] resize-none shadow-sm p-4 placeholder-gray-400"
                                                    placeholder="Introduce yourself or mention what you'd like to discuss..."
                                                    value={message}
                                                    onChange={(e) => setMessage(e.target.value)}
                                                />
                                            </div>

                                            {/* Summary & Submit */}
                                            <div className="pt-6 border-t border-gray-100 mt-auto">
                                                <button
                                                    onClick={handleSendRequest}
                                                    disabled={sending || !selectedSlotId || !selectedCompanyId}
                                                    className="w-full h-14 rounded-xl bg-[#004aad] text-white text-base font-bold hover:bg-[#003a8c] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 active:scale-[0.98]"
                                                >
                                                    {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                                    Send Meeting Request
                                                </button>
                                                <p className="text-xs text-center text-gray-500 mt-4 font-medium">
                                                    The selected company will be notified of your request.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Decline Modal */}
            <AnimatePresence>
                {decliningRequestId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                    >
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !processingId && setDecliningRequestId(null)} />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
                        >
                            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900">Decline Meeting Request</h3>
                                <button
                                    onClick={() => !processingId && setDecliningRequestId(null)}
                                    disabled={!!processingId}
                                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-50"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="p-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for declining (required)</label>
                                <textarea
                                    className="w-full rounded-xl border-gray-200 text-sm focus:ring-red-500 focus:border-red-500 shadow-sm p-3 placeholder-gray-400"
                                    rows={3}
                                    placeholder="Please provide a brief reason..."
                                    value={declineReason}
                                    onChange={(e) => setDeclineReason(e.target.value)}
                                    autoFocus
                                    disabled={!!processingId}
                                />
                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        onClick={() => setDecliningRequestId(null)}
                                        disabled={!!processingId}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!declineReason.trim()) { toast.error("Reason is required"); return; }
                                            await handleRespond(decliningRequestId, 'DECLINED', declineReason);
                                            setDecliningRequestId(null);
                                        }}
                                        disabled={!declineReason.trim() || !!processingId}
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 relative"
                                    >
                                        {processingId === decliningRequestId && <Loader2 className="h-4 w-4 animate-spin absolute left-2" />}
                                        <span className={processingId === decliningRequestId ? 'pl-6' : ''}>Confirm Decline</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Block Modal */}
            <AnimatePresence>
                {showBlockModal && blockEvent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center"
                    >
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !savingBlocks && setShowBlockModal(false)} />

                        <motion.div
                            initial={{ opacity: 0, y: 30, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 30, scale: 0.97 }}
                            className="relative z-10 w-full max-w-3xl mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="flex-none flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                                        <XCircle className="h-6 w-6 text-gray-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">Manage Blocked Status</h3>
                                        <p className="text-sm text-gray-500 mt-0.5">{blockEvent.eventName}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => !savingBlocks && setShowBlockModal(false)}
                                    disabled={savingBlocks}
                                    className="h-10 w-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50"
                                >
                                    <X className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="p-8 overflow-y-auto flex-1">
                                {loadingSessions ? (
                                    <div className="py-20 flex flex-col items-center justify-center">
                                        <Loader2 className="animate-spin h-10 w-10 text-gray-400 mb-4" />
                                        <p className="text-gray-500 font-medium text-sm">Loading available sessions...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm border border-blue-100 flex gap-3">
                                            <div className="mt-0.5"><Users className="h-5 w-5 text-blue-600" /></div>
                                            <div>
                                                <p className="font-semibold mb-1">How blocking works:</p>
                                                <p className="text-blue-700/80">Select any sessions where you are unavailable. When you block a session, your company will be completely hidden from the dropdown menu when other companies try to book one-to-one meetings for that specific timeslot.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {slots.length === 0 ? (
                                                <div className="text-sm text-gray-400 py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                                                    <Clock className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                                                    <p className="font-semibold text-gray-500">No meeting slots available</p>
                                                </div>
                                            ) : (
                                                slots.map((slot: any) => {
                                                    const isBlocked = blockingSlots.has(slot.id);
                                                    const is11_27Mar = formatTime24(slot.startTime) === '11:00' && formatDate(slot.startTime).includes('27 Mar');

                                                    return (
                                                        <React.Fragment key={slot.id}>
                                                            {false && is11_27Mar && (
                                                                <div className="p-4 rounded-xl border border-orange-100 bg-gradient-to-r from-orange-50 to-white flex items-center justify-between shadow-sm opacity-70">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="h-5 w-5 rounded border border-orange-300 bg-orange-50 flex items-center justify-center">
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-bold text-gray-800 text-base">Tea Break</span>
                                                                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
                                                                                    Break
                                                                                </span>
                                                                            </div>
                                                                            <div className="text-sm text-gray-500 mt-1">
                                                                                27 Mar 2026 • 10:30 — 11:00
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <label
                                                                className={`p-4 rounded-xl border-2 transition-all cursor-pointer block ${isBlocked
                                                                    ? 'border-red-500 bg-red-50/50 shadow-sm'
                                                                    : 'bg-white border-gray-100 hover:border-gray-200'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500 disabled:opacity-50"
                                                                        checked={isBlocked}
                                                                        disabled={savingBlocks}
                                                                        onChange={(e) => {
                                                                            const newSet = new Set(blockingSlots);
                                                                            if (e.target.checked) newSet.add(slot.id);
                                                                            else newSet.delete(slot.id);
                                                                            setBlockingSlots(newSet);
                                                                        }}
                                                                    />
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-bold text-gray-800 text-base">{slot.title}</span>
                                                                            {isBlocked && (
                                                                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
                                                                                    Blocked
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-sm text-gray-500 mt-1">
                                                                            {formatDate(slot.startTime)} • {formatTime24(slot.startTime)} — {formatTime24(slot.endTime)}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </label>
                                                        </React.Fragment>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 flex-none">
                                <button
                                    onClick={() => !savingBlocks && setShowBlockModal(false)}
                                    disabled={savingBlocks}
                                    className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveBlocks}
                                    disabled={savingBlocks || loadingSessions}
                                    className="px-6 py-2.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {savingBlocks && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Save Blocked Status
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
