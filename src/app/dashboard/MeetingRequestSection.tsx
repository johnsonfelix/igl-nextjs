'use client';

import React, { useState, useEffect } from 'react';
import { Users, Send, CheckCircle, XCircle, Clock, Building2, ArrowRight, X, Loader2, MessageSquare } from 'lucide-react';
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
    meetingSlot: {
        title: string;
        startTime: string;
        endTime: string;
    };
}

interface CompanyOption {
    id: string;
    name: string;
    logoUrl: string | null;
}

interface MeetingRequest {
    id: string;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
    message: string | null;
    createdAt: string;
    fromCompany: CompanyOption;
    toCompany: CompanyOption;
    event: { id: string; name: string };
    meetingSession: {
        id: string;
        sessionIndex: number;
        startTime: string;
        endTime: string;
        meetingSlot: { title: string; startTime: string; endTime: string };
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

    // Form state
    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [message, setMessage] = useState('');

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
        setSelectedSessionId('');
        setSelectedCompanyId('');
        setMessage('');
        setLoadingSessions(true);

        try {
            // Fetch available sessions for this event
            const sessRes = await fetch(`/api/events/${ticket.eventId}/meetings`);
            if (sessRes.ok) {
                const slots = await sessRes.json();
                // Flatten all sessions from all slots, filter to those not fully booked
                const allSessions: MeetingSessionOption[] = [];
                for (const slot of slots) {
                    for (const session of slot.meetingSessions || []) {
                        if (!(session.companyId && session.companyBId)) {
                            allSessions.push({
                                ...session,
                                meetingSlot: {
                                    title: slot.title,
                                    startTime: slot.startTime,
                                    endTime: slot.endTime,
                                },
                            });
                        }
                    }
                }
                setSessions(allSessions);
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

    const handleSendRequest = async () => {
        if (!selectedSessionId || !selectedCompanyId || !selectedEvent) {
            toast.error('Please select a session and a company');
            return;
        }

        setSending(true);
        try {
            const res = await fetch('/api/meeting-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId: selectedEvent.eventId,
                    meetingSessionId: selectedSessionId,
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

    const handleRespond = async (requestId: string, status: 'ACCEPTED' | 'DECLINED') => {
        setProcessingId(requestId);
        try {
            const res = await fetch(`/api/meeting-requests/${requestId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
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

    const statusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="h-3 w-3" /> Pending
                    </span>
                );
            case 'ACCEPTED':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle className="h-3 w-3" /> Accepted
                    </span>
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
                        <button
                            key={ticket.eventId}
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
                                                    {req.meetingSession.meetingSlot.title} · Session #{req.meetingSession.sessionIndex + 1} · {formatTime24(req.meetingSession.startTime)} – {formatTime24(req.meetingSession.endTime)}
                                                </div>
                                                {req.message && (
                                                    <p className="text-xs text-gray-600 mt-1 italic">&quot;{req.message}&quot;</p>
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
                                                            onClick={() => handleRespond(req.id, 'DECLINED')}
                                                            disabled={processingId === req.id}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-300 transition-colors disabled:opacity-50"
                                                        >
                                                            <XCircle className="h-3 w-3" /> Decline
                                                        </button>
                                                    </>
                                                ) : (
                                                    statusBadge(req.status)
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
                                                    {req.meetingSession.meetingSlot.title} · Session #{req.meetingSession.sessionIndex + 1} · {formatTime24(req.meetingSession.startTime)} – {formatTime24(req.meetingSession.endTime)}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 text-right flex-none">
                                                {statusBadge(req.status)}
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

                                            {sessions.length === 0 ? (
                                                <div className="text-sm text-gray-400 py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                                                    <Clock className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                                                    <p className="font-semibold text-gray-500">No available sessions found</p>
                                                    <p className="mt-1">All slots might be fully booked.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-6 pr-2">
                                                    {Object.entries(sessions.reduce((acc, session) => {
                                                        const dateStr = formatDate(session.startTime);
                                                        if (!acc[dateStr]) acc[dateStr] = [];
                                                        acc[dateStr].push(session);
                                                        return acc;
                                                    }, {} as Record<string, MeetingSessionOption[]>)).map(([date, dateSessions]) => (
                                                        <div key={date} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                                            <div className="bg-gradient-to-r from-gray-50 to-white px-5 py-3 border-b border-gray-100 flex items-center gap-3">
                                                                <div className="h-8 w-8 rounded-lg bg-[#004aad]/10 flex items-center justify-center">
                                                                    <Clock className="h-4 w-4 text-[#004aad]" />
                                                                </div>
                                                                <h4 className="font-bold text-gray-800">{date}</h4>
                                                                <span className="ml-auto text-xs font-bold text-[#004aad] bg-[#004aad]/10 px-2.5 py-1 rounded-md">
                                                                    {dateSessions.length} slots
                                                                </span>
                                                            </div>
                                                            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                {dateSessions.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).map((session) => (
                                                                    <label
                                                                        key={session.id}
                                                                        className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedSessionId === session.id
                                                                            ? 'border-[#004aad] bg-[#004aad]/5 shadow-sm'
                                                                            : 'border-transparent bg-gray-50 hover:bg-gray-100'
                                                                            }`}
                                                                    >
                                                                        <input
                                                                            type="radio"
                                                                            name="session"
                                                                            value={session.id}
                                                                            checked={selectedSessionId === session.id}
                                                                            onChange={() => setSelectedSessionId(session.id)}
                                                                            className="mt-1 accent-[#004aad] h-4 w-4"
                                                                        />
                                                                        <div className="flex-1">
                                                                            <div className="text-sm font-bold text-gray-800 leading-tight mb-1" title={session.meetingSlot.title}>
                                                                                {session.meetingSlot.title.length > 25 ? session.meetingSlot.title.substring(0, 25) + "..." : session.meetingSlot.title}
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                                                                <span>Session #{session.sessionIndex + 1}</span>
                                                                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                                                <span className="text-[#004aad]">
                                                                                    {formatTime24(session.startTime)} – {formatTime24(session.endTime)}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
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
                                                {companies.length === 0 ? (
                                                    <div className="text-sm text-gray-400 py-6 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                                                        No other companies found
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <Building2 className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                                                        <select
                                                            className="w-full h-12 pl-11 pr-4 rounded-xl border-gray-200 text-sm font-medium focus:ring-[#004aad] focus:border-[#004aad] bg-white shadow-sm"
                                                            value={selectedCompanyId}
                                                            onChange={(e) => setSelectedCompanyId(e.target.value)}
                                                        >
                                                            <option value="">— Choose a company —</option>
                                                            {companies.map((c) => (
                                                                <option key={c.id} value={c.id}>{c.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
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
                                                    disabled={sending || !selectedSessionId || !selectedCompanyId}
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
        </div>
    );
}
