"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Search, Calendar, Clock, MessageSquare, Building2, ChevronDown } from "lucide-react";

type MeetingRequest = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  message: string | null;
  createdAt: string;
  event: { name: string };
  fromCompany: { name: string };
  toCompany: { name: string };
  meetingSlot: { startTime: string; endTime: string; title: string };
};

export default function RequestsPage() {
  const [requests, setRequests] = useState<MeetingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/requests");
      const data = await res.json();
      setRequests(data);
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const fromComp = req.fromCompany?.name?.toLowerCase() || "";
    const toComp = req.toCompany?.name?.toLowerCase() || "";
    const evt = req.event?.name?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();

    const matchesSearch = fromComp.includes(query) || toComp.includes(query) || evt.includes(query);
    const matchesStatus = statusFilter === "ALL" || req.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none">Accepted</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-none">Pending</Badge>;
      case "DECLINED":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-none">Declined</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false
      }).format(new Date(dateString));
    } catch { return dateString; }
  };

  const formatTimeOnly = (dateString: string) => {
     try {
       return new Intl.DateTimeFormat('en-US', {
         hour: '2-digit', minute: '2-digit', hour12: false
       }).format(new Date(dateString));
     } catch { return ""; }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      }).format(new Date(dateString));
    } catch { return dateString; }
  };

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Meeting Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor all one-to-one networking meeting requests across events.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search companies, events..."
              className="pl-10 bg-white border-gray-200 focus:ring-emerald-500 focus:border-emerald-500 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="relative w-full sm:w-40">
            <select
              className="w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2 px-4 pr-8 rounded-md leading-tight focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 text-sm h-10"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="DECLINED">Declined</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
          
          <Button onClick={fetchRequests} variant="outline" className="w-full sm:w-auto bg-white hover:bg-gray-50">
            Refresh
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
             <Skeleton key={i} className="h-32 w-full rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <div className="bg-emerald-50 p-4 rounded-full mb-4">
            <MessageSquare className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No requests found</h3>
          <p className="text-gray-500 mt-1 text-center max-w-sm">
            {searchQuery || statusFilter !== "ALL" ? "Try adjusting your filters to see more results." : "No one-to-one meeting requests have been made yet."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
             <table className="w-full text-sm text-left whitespace-nowrap md:whitespace-normal">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-200">
                <tr>
                  <th scope="col" className="px-6 py-4 font-medium">Event & Time</th>
                  <th scope="col" className="px-6 py-4 font-medium">Request Details</th>
                  <th scope="col" className="px-6 py-4 font-medium">Status</th>
                  <th scope="col" className="px-6 py-4 font-medium">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 align-top w-64">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-start gap-2 font-medium text-gray-900">
                          <Calendar className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                          <span className="line-clamp-2" title={req.event?.name}>{req.event?.name || "Unknown Event"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 text-xs">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          {req.meetingSlot ? (
                            <span>
                              {formatDateTime(req.meetingSlot.startTime)} - {formatTimeOnly(req.meetingSlot.endTime)}
                            </span>
                          ) : (
                            <span>No Slot Assigned</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top w-80">
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col">
                           <span className="text-[10px] uppercase font-semibold text-gray-400 mb-0.5 tracking-wider">From</span>
                           <div className="flex items-start gap-1.5 font-medium text-gray-900" title={req.fromCompany?.name}>
                             <Building2 className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                             <span className="line-clamp-2">{req.fromCompany?.name || "Unknown"}</span>
                           </div>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] uppercase font-semibold text-gray-400 mb-0.5 tracking-wider">To</span>
                           <div className="flex items-start gap-1.5 font-medium text-gray-900" title={req.toCompany?.name}>
                             <Building2 className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                             <span className="line-clamp-2">{req.toCompany?.name || "Unknown"}</span>
                           </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-col items-start gap-2 mt-1">
                        {getStatusBadge(req.status)}
                        <span className="text-xs text-gray-400 font-medium">
                           {formatDate(req.createdAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top min-w-[200px]">
                      {req.message ? (
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed line-clamp-3" title={req.message}>
                            "{req.message}"
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm italic py-2 inline-block">No message included</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
