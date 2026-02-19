'use client';

import { useEffect, useState } from 'react';
import {
    BarChart3, Eye, Users, Clock, TrendingDown,
    Globe, Monitor, Smartphone, Tablet,
    RefreshCw, Calendar, MapPin, ArrowUpRight
} from 'lucide-react';

interface StatsData {
    totalVisits: number;
    uniqueVisitors: number;
    avgDuration: number;
    bounceRate: number;
    topPages: { page: string; count: number }[];
    topCountries: { country: string; count: number }[];
    deviceBreakdown: { device: string; count: number }[];
    browserBreakdown: { browser: string; count: number }[];
    osBreakdown: { os: string; count: number }[];
    recentVisits: {
        id: string; page: string; ip: string; country: string; city: string;
        device: string; browser: string; os: string; duration: number;
        referrer: string; createdAt: string;
    }[];
    visitsOverTime: { date: string; count: number }[];
}

const DEVICE_ICONS: Record<string, React.ReactNode> = {
    Desktop: <Monitor size={16} />,
    Mobile: <Smartphone size={16} />,
    Tablet: <Tablet size={16} />,
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

// Simple bar chart using CSS
function BarChartSimple({ data, color = '#3b82f6' }: { data: { label: string; value: number }[]; color?: string }) {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="space-y-2.5">
            {data.map((item, i) => (
                <div key={item.label} className="group">
                    <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-700 font-medium truncate max-w-[200px]">{item.label}</span>
                        <span className="text-gray-500 font-semibold tabular-nums">{item.value.toLocaleString()}</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                                width: `${(item.value / max) * 100}%`,
                                background: COLORS[i % COLORS.length],
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

// Sparkline-style area chart using SVG
function AreaChart({ data }: { data: { date: string; count: number }[] }) {
    if (data.length < 2) return <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Not enough data yet</div>;

    const max = Math.max(...data.map(d => d.count), 1);
    const width = 800;
    const height = 180;
    const padding = 30;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;

    const points = data.map((d, i) => ({
        x: padding + (i / (data.length - 1)) * chartW,
        y: padding + chartH - (d.count / max) * chartH,
    }));

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return (
        <div className="relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                    </linearGradient>
                </defs>
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map(pct => (
                    <line key={pct} x1={padding} y1={padding + chartH * (1 - pct)} x2={width - padding} y2={padding + chartH * (1 - pct)}
                        stroke="#f0f0f0" strokeWidth="1" />
                ))}
                {/* Area */}
                <path d={areaPath} fill="url(#areaGrad)" />
                {/* Line */}
                <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {/* Dots */}
                {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
                ))}
            </svg>
            {/* X-axis labels */}
            <div className="flex justify-between px-8 text-xs text-gray-400 -mt-1">
                {data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 6)) === 0 || i === data.length - 1).map(d => (
                    <span key={d.date}>{new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                ))}
            </div>
        </div>
    );
}

// Donut chart
function DonutChart({ data }: { data: { label: string; value: number }[] }) {
    const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
    const radius = 60;
    const strokeWidth = 18;
    const circumference = 2 * Math.PI * radius;
    let accumulatedOffset = 0;

    return (
        <div className="flex items-center gap-6">
            <svg width="160" height="160" viewBox="0 0 160 160">
                {data.map((item, i) => {
                    const pct = item.value / total;
                    const dashArray = `${pct * circumference} ${circumference}`;
                    const dashOffset = -accumulatedOffset * circumference;
                    accumulatedOffset += pct;
                    return (
                        <circle key={item.label} cx="80" cy="80" r={radius} fill="none"
                            stroke={COLORS[i % COLORS.length]} strokeWidth={strokeWidth}
                            strokeDasharray={dashArray} strokeDashoffset={dashOffset}
                            transform="rotate(-90 80 80)" className="transition-all duration-700" />
                    );
                })}
                <text x="80" y="76" textAnchor="middle" className="text-2xl font-bold" fill="#1f2937">{total.toLocaleString()}</text>
                <text x="80" y="96" textAnchor="middle" className="text-xs" fill="#9ca3af">total</text>
            </svg>
            <div className="space-y-2">
                {data.map((item, i) => (
                    <div key={item.label} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-gray-600">{item.label}</span>
                        <span className="text-gray-400 font-medium ml-auto tabular-nums">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function StatisticsClient({ initialTotalVisits }: { initialTotalVisits: number }) {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(30);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const res = await fetch(`/api/analytics/stats?days=${days}`);
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.error('Failed to load analytics:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchStats(); }, [days]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => fetchStats(true), 30000);
        return () => clearInterval(interval);
    }, [days]);

    const kpis = stats ? [
        { label: 'Total Page Views', value: stats.totalVisits.toLocaleString(), icon: <Eye size={22} />, color: 'bg-blue-50 text-blue-600', ring: 'ring-blue-100' },
        { label: 'Unique Visitors', value: stats.uniqueVisitors.toLocaleString(), icon: <Users size={22} />, color: 'bg-emerald-50 text-emerald-600', ring: 'ring-emerald-100' },
        { label: 'Avg. Duration', value: formatDuration(stats.avgDuration), icon: <Clock size={22} />, color: 'bg-amber-50 text-amber-600', ring: 'ring-amber-100' },
        { label: 'Bounce Rate', value: `${stats.bounceRate}%`, icon: <TrendingDown size={22} />, color: 'bg-red-50 text-red-600', ring: 'ring-red-100' },
    ] : [];

    return (
        <div className="min-h-screen space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Statistics & Analytics</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Monitor your website visitors and engagement</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Date range selector */}
                    <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        {[7, 30, 90].map(d => (
                            <button key={d} onClick={() => setDays(d)}
                                className={`px-4 py-2 text-sm font-medium transition-all ${days === d
                                    ? 'bg-blue-600 text-white shadow-inner'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}>
                                {d}d
                            </button>
                        ))}
                    </div>
                    <button onClick={() => fetchStats(true)}
                        className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                        title="Refresh">
                        <RefreshCw size={18} className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex h-96 items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
                        <p className="text-gray-500 font-medium">Loading analytics...</p>
                    </div>
                </div>
            ) : stats ? (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {kpis.map(kpi => (
                            <div key={kpi.label} className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-xl ${kpi.color} ring-1 ${kpi.ring}`}>{kpi.icon}</div>
                                </div>
                                <p className="text-3xl font-bold text-gray-800 mb-1">{kpi.value}</p>
                                <p className="text-sm text-gray-500 font-medium">{kpi.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Visits Over Time */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <BarChart3 size={20} className="text-blue-600" />
                            <h2 className="text-lg font-bold text-gray-800">Visits Over Time</h2>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full ml-2">Last {days} days</span>
                        </div>
                        <AreaChart data={stats.visitsOverTime} />
                    </div>

                    {/* Two-column layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Pages */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <ArrowUpRight size={20} className="text-emerald-600" />
                                <h2 className="text-lg font-bold text-gray-800">Top Pages</h2>
                            </div>
                            {stats.topPages.length > 0 ? (
                                <BarChartSimple data={stats.topPages.map(p => ({ label: p.page, value: p.count }))} />
                            ) : (
                                <p className="text-gray-400 text-sm text-center py-8">No page data yet</p>
                            )}
                        </div>

                        {/* Top Countries */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <Globe size={20} className="text-blue-600" />
                                <h2 className="text-lg font-bold text-gray-800">Top Countries</h2>
                            </div>
                            {stats.topCountries.length > 0 ? (
                                <BarChartSimple data={stats.topCountries.map(c => ({ label: c.country, value: c.count }))} color="#10b981" />
                            ) : (
                                <p className="text-gray-400 text-sm text-center py-8">No country data yet</p>
                            )}
                        </div>
                    </div>

                    {/* Three-column breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Device */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Monitor size={18} className="text-blue-500" /> Devices
                            </h2>
                            <DonutChart data={stats.deviceBreakdown.map(d => ({ label: d.device, value: d.count }))} />
                        </div>

                        {/* Browser */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Globe size={18} className="text-emerald-500" /> Browsers
                            </h2>
                            <DonutChart data={stats.browserBreakdown.map(b => ({ label: b.browser, value: b.count }))} />
                        </div>

                        {/* OS */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Tablet size={18} className="text-amber-500" /> Operating Systems
                            </h2>
                            <DonutChart data={stats.osBreakdown.map(o => ({ label: o.os, value: o.count }))} />
                        </div>
                    </div>

                    {/* Recent Visits Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Calendar size={18} className="text-blue-600" /> Recent Visits
                                {refreshing && <RefreshCw size={14} className="animate-spin text-blue-400 ml-2" />}
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/80">
                                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Page</th>
                                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Country</th>
                                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Device</th>
                                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Browser</th>
                                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">IP</th>
                                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Duration</th>
                                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">When</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {stats.recentVisits.length === 0 ? (
                                        <tr><td colSpan={7} className="text-center py-12 text-gray-400">No visits recorded yet</td></tr>
                                    ) : (
                                        stats.recentVisits.map(visit => (
                                            <tr key={visit.id} className="hover:bg-blue-50/30 transition-colors">
                                                <td className="px-6 py-3.5 text-sm font-medium text-gray-800 max-w-[200px] truncate">{visit.page}</td>
                                                <td className="px-6 py-3.5 text-sm text-gray-600">
                                                    <span className="flex items-center gap-1.5">
                                                        <MapPin size={13} className="text-gray-400" />
                                                        {visit.country || 'Unknown'}{visit.city ? `, ${visit.city}` : ''}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5 text-sm text-gray-600">
                                                    <span className="flex items-center gap-1.5">
                                                        {DEVICE_ICONS[visit.device] || <Monitor size={14} />}
                                                        {visit.device}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5 text-sm text-gray-600">{visit.browser}</td>
                                                <td className="px-6 py-3.5 text-sm text-gray-400 font-mono text-xs">{visit.ip || '—'}</td>
                                                <td className="px-6 py-3.5 text-sm text-gray-600 tabular-nums">{visit.duration > 0 ? formatDuration(visit.duration) : '—'}</td>
                                                <td className="px-6 py-3.5 text-sm text-gray-400 whitespace-nowrap">{timeAgo(visit.createdAt)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-center py-20 text-gray-500">Failed to load analytics data.</div>
            )}
        </div>
    );
}
