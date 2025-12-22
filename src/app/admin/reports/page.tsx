import React from 'react';
import { PrismaClient } from '@prisma/client';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

async function getReports() {
    try {
        const reports = await prisma.report.findMany({
            include: {
                reportedCompany: {
                    select: {
                        name: true,
                        id: true,
                        status: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc',
            }
        });
        return reports;
    } catch (error) {
        console.error("Failed to fetch reports:", error);
        return [];
    }
}

export default async function AdminReportsPage() {
    const reports = await getReports();

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Risk Reports</h1>
                <p className="text-gray-500">Manage and review reports submitted against companies.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-900 font-semibold border-b">
                            <tr>
                                <th className="p-4">Reported Company</th>
                                <th className="p-4">Reason</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Date</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {reports.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        No reports found.
                                    </td>
                                </tr>
                            ) : (
                                reports.map((report) => (
                                    <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium text-gray-900">
                                            {report.reportedCompany.name}
                                            {report.reportedCompany.status === 'BLOCKLISTED' && <span className="ml-2 text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Blocked</span>}
                                            {report.reportedCompany.status === 'SUSPENDED' && <span className="ml-2 text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Suspended</span>}
                                        </td>
                                        <td className="p-4 max-w-md truncate" title={report.reason}>
                                            {report.reason}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${report.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                    report.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {report.status === 'PENDING' && <Clock size={12} />}
                                                {report.status === 'RESOLVED' && <CheckCircle size={12} />}
                                                {report.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-500">
                                            {new Date(report.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button className="text-[#004aad] hover:underline text-xs font-semibold">View Details</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
