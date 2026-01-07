import React from 'react';
import { ShieldCheck, XCircle, FileText } from 'lucide-react';

export default function PaymentProtectionPage() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 bg-white text-gray-800">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-extrabold text-[#004aad] mb-2">Payment Protection Plan (PPP)</h1>
                <h2 className="text-xl font-medium text-gray-600">Terms & Conditions</h2>
            </div>

            <div className="space-y-10">

                {/* Conditions */}
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="bg-blue-600 text-white rounded-full p-1"><ShieldCheck size={20} /></span>
                        Applicable Conditions
                    </h3>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                            <span className="font-bold text-blue-600">•</span>
                            <span><strong>Credit Limit:</strong> IGLA will cover debts according to the membership agreed.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="font-bold text-blue-600">•</span>
                            <span>Both parties must be IGLA members at time of transaction.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="font-bold text-blue-600">•</span>
                            <span>The Payment Protection Plan is applicable for the business from the date of a valid Protection Policy.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="font-bold text-blue-600">•</span>
                            <span>Claims will not be accepted if the business is done before the policy’s commencement date.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="font-bold text-blue-600">•</span>
                            <span>Payment Protection only covers claims against non-payment of freight payment by paid Members due to insolvency and/or bankruptcy.</span>
                        </li>
                    </ul>
                </div>

                {/* Exclusions */}
                <div className="bg-red-50 rounded-xl p-6 border border-red-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="bg-red-600 text-white rounded-full p-1"><XCircle size={20} /></span>
                        Exclusions – Not Covered Under PPP
                    </h3>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                            <span className="font-bold text-red-600">•</span>
                            <span>Operational or service failures, errors of omission or commission</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="font-bold text-red-600">•</span>
                            <span>Cargo claims due to force majeure, vessel or carrier fault, cargo abandonment, misrouting, misrepresentation, or government/location restrictions</span>
                        </li>
                    </ul>
                    <div className="mt-4 p-4 bg-white rounded-lg border border-red-200 text-sm font-medium text-red-800">
                        Note: Members are advised to obtain cargo insurance and third-party liability insurance separately.
                    </div>
                </div>

                {/* Guidelines */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="bg-gray-700 text-white rounded-full p-1"><FileText size={20} /></span>
                        Guidelines for Claims Filing
                    </h3>
                    <ul className="space-y-3 mb-6">
                        <li className="flex items-start gap-2">
                            <span className="font-bold text-gray-600">•</span>
                            <span>A mutually signed agency agreement between both parties must exist prior to business.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="font-bold text-gray-600">•</span>
                            <div>
                                When a debtor’s IGLA membership is terminated:
                                <ul className="list-disc pl-5 mt-1 space-y-1 text-sm text-gray-600">
                                    <li>A termination notice will be sent via email with a claim deadline.</li>
                                    <li>If no claim is received by IGLA Admin before the deadline, the claim will not be paid.</li>
                                </ul>
                            </div>
                        </li>
                    </ul>

                    <h4 className="font-bold text-gray-800 mb-3">To qualify for a claim:</h4>
                    <ol className="list-decimal pl-5 space-y-2 text-gray-700">
                        <li>The unpaid invoice must relate to international shipment services.</li>
                        <li>The invoice should be issued correctly as per IGLA Rules & Procedures.</li>
                        <li>Three reminders must be sent at reasonable intervals—the latest within 90 days from the invoice date—informing the defaulter that a report would be filed with IGLA Admin.</li>
                        <li>Settlement will be made as per IGLA rules and regulations after 120 days, provided all claim requirements are verified and found correct.</li>
                    </ol>
                </div>

            </div>
        </div>
    );
}
