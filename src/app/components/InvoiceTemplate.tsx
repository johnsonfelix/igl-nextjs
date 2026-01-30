
import React from 'react';
import { format } from 'date-fns';

interface InvoiceProps {
    orderId: string;
    date: string | Date;
    customerDetails: {
        name: string;
        email: string;
        companyName: string;
        designation: string;
        address: string;
        memberId: string;
        // New fields
        phoneNumber?: string;
        taxNumber?: string;
        postalCode?: string;
    };
    items: Array<{
        name: string;
        quantity: number;
        price: number;
        originalPrice?: number;
        total: number;
    }>;
    totalAmount: number;
    currency?: string;
}

export const InvoiceTemplate = ({ orderId, date, customerDetails, items, totalAmount, currency = 'USD' }: InvoiceProps) => {
    const formatPrice = (amount: number) => {
        if (currency === 'THB') {
            return `฿${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency,
            }).format(amount);
        } catch (e) {
            return `${currency} ${amount.toFixed(2)}`;
        }
    };

    return (
        <div
            id="invoice-component"
            className="mx-auto"
            style={{
                backgroundColor: '#ffffff',
                color: '#1e293b', // slate-800
                width: '210mm',
                minHeight: '296mm', // Slightly less than 297mm to prevent overflow to 2nd page
                padding: '10mm', // standard margin
                boxSizing: 'border-box'
            }}
        >
            {/* Header */}
            <div className="flex justify-between border-2 border-[#004aad] mb-4">
                <div className="p-4 w-1/3 flex items-center justify-center border-r-2 border-[#004aad]">
                    <img src="/images/logo.png" alt="IGLA Logo" className="w-28 object-contain" />
                </div>
                <div className="p-4 w-2/3">
                    <h1 className="text-xl font-bold text-[#004aad] mb-1 leading-none">Innovative Global Logistics Allianz</h1>
                    <h2 className="text-lg font-bold text-[#004aad] mb-3 leading-none">( IGLA )</h2>
                    <div className="text-sm font-medium space-y-1 leading-snug">
                        <p>Amber 16 F 2, Olympia Opaline, 33, Rajiv Gandhi Road,</p>
                        <p>Navalur, Chennai - 600 130, India.</p>
                        <p>Mob : +91 9940100929 , Mail : <span className="font-bold">sales@igla.asia</span></p>
                        <p>Website : <span className="font-bold">http://igla.asia/</span></p>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 mb-4">
                {/* Customer Details */}
                <div className="w-1/2 border-2 border-[#004aad] flex flex-col">
                    <div className="bg-[#00317a] p-2 px-3 font-bold text-base" style={{ color: '#ffffff' }}>
                        Customer Details
                    </div>
                    <div className="p-3 text-sm flex-1">
                        <div className="mb-2">
                            <div className="font-bold uppercase text-[#00317a] text-sm">{customerDetails.companyName}</div>
                        </div>
                        <div className="grid grid-cols-[110px_1fr] gap-x-2 gap-y-1">
                            {/* Removed Registered Name section as requested */}

                            <div className="">Address</div>
                            <div className="font-bold break-words leading-tight">{customerDetails.address || 'N/A'}</div>

                            <div className="">Tel</div>
                            <div className="font-bold leading-tight">{customerDetails.phoneNumber || 'N/A'}</div>

                            <div className="">Tax Number</div>
                            <div className="font-bold leading-tight">{customerDetails.taxNumber || 'N/A'}</div>

                            <div className="">Postal Code</div>
                            <div className="font-bold leading-tight">{customerDetails.postalCode || 'N/A'}</div>
                        </div>
                    </div>
                </div>

                {/* Invoice Details */}
                <div className="w-1/2 border-2 border-[#004aad] flex flex-col">
                    <div className="bg-[#00317a] p-2 px-3 font-bold text-base" style={{ color: '#ffffff' }}>
                        Invoice Details
                    </div>
                    <div className="p-3 text-sm space-y-1 flex-1">
                        <div className="grid grid-cols-[110px_auto]">
                            <span style={{ color: '#475569' }}>Participant Name</span>
                            <div>
                                <div className="font-bold uppercase">: {customerDetails.name}</div>
                                {customerDetails.designation && (
                                    <div className="text-xs pl-2">{customerDetails.designation}</div>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-[110px_auto]">
                            <span style={{ color: '#475569' }}>Email</span>
                            <span className="font-bold truncate">: {customerDetails.email}</span>
                        </div>
                        <div className="grid grid-cols-[110px_auto]">
                            <span style={{ color: '#475569' }}>Bill No</span>
                            <span className="font-bold">: {orderId}</span>
                        </div>
                        <div className="grid grid-cols-[110px_auto]">
                            <span style={{ color: '#475569' }}>Member Code</span>
                            <span className="font-bold">: {customerDetails.memberId}</span>
                        </div>
                        <div className="grid grid-cols-[110px_auto]">
                            <span style={{ color: '#475569' }}>Bill Date</span>
                            <span className="font-bold">: {format(new Date(date), 'dd/MM/yyyy')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full border-2 border-[#004aad] mb-4">
                <thead>
                    <tr className="bg-[#00317a] text-sm" style={{ color: '#ffffff' }}>
                        <th className="p-2 border-r w-14" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>S.No</th>
                        <th className="p-2 border-r text-left" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>Item Name</th>
                        <th className="p-2 border-r w-24" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>Rate</th>
                        <th className="p-2 border-r w-14" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>Qty</th>
                        <th className="p-2 w-28">Total ({currency})</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {items.map((item, idx) => (
                        <tr key={idx} className="border-b" style={{ borderColor: '#e5e7eb' }}>
                            <td className="p-2 border-r border-[#004aad] text-center">{idx + 1}</td>
                            <td className="p-2 border-r border-[#004aad]">{item.name}</td>
                            <td className="p-2 border-r border-[#004aad] text-center">
                                {item.originalPrice && item.originalPrice > item.price && (
                                    <div className="text-xs text-gray-400 line-through">
                                        {formatPrice(item.originalPrice)}
                                    </div>
                                )}
                                <div className={item.originalPrice && item.originalPrice > item.price ? "font-bold text-[#004aad]" : ""}>
                                    {formatPrice(item.price)}
                                </div>
                            </td>
                            <td className="p-2 border-r border-[#004aad] text-center">{item.quantity}</td>
                            <td className="p-2 text-center font-bold">{item.total !== 0 ? formatPrice(item.total) : item.total}</td>
                        </tr>
                    ))}
                    {/* Maintain a few empty rows for structure */}
                    {[...Array(Math.max(0, 3 - items.length))].map((_, i) => (
                        <tr key={`empty-${i}`} className="border-b" style={{ borderColor: '#f3f4f6' }}>
                            <td className="p-2 border-r border-[#004aad] text-center">&nbsp;</td>
                            <td className="p-2 border-r border-[#004aad]">&nbsp;</td>
                            <td className="p-2 border-r border-[#004aad] text-center">&nbsp;</td>
                            <td className="p-2 border-r border-[#004aad] text-center">&nbsp;</td>
                            <td className="p-2 text-center">&nbsp;</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="border-t-2 border-[#004aad]">
                        <td colSpan={4} className="p-2 text-right text-xs pr-4 border-r border-[#004aad]" style={{ color: '#6b7280' }}>
                            ***Bank Charges Included
                        </td>
                        <td className="p-0">
                            <div className="flex flex-col h-full">
                                <div className="text-center text-xs font-bold text-[#00317a] border-b border-[#004aad] p-1">Grand Total</div>
                                <div className="text-center font-bold text-lg p-2">{totalAmount !== 0 ? formatPrice(totalAmount) : totalAmount}</div>
                            </div>
                        </td>
                    </tr>
                </tfoot>
            </table>

            {/* Footer / Terms */}
            <div className="border-2 border-[#004aad] p-4 text-sm">
                <div className="flex gap-6">
                    <div className="w-1/2">
                        <h3 className="font-bold text-[#00317a] mb-1">Bank Transfer:</h3>
                        <div className="text-xs leading-snug" style={{ color: '#374151' }}>
                            <div className="font-bold text-[#00317a]">Beneficiary's Bank</div>
                            <div>HDFC Bank Limited</div>
                            <div>Parrys Corner Branch</div>
                            <div>SWIFT CODE: HDFCINBBCHE</div>
                            <div>ACCOUNT NAME: INNOVATIVE GLOBAL LOGISTICS ALLIANZ</div>
                            <div>ACCOUNT NO: 50200035538980</div>
                        </div>
                    </div>
                    <div className="w-1/2">
                        <h4 className="font-bold text-[#00317a] mb-1">Remarks:</h4>
                        <ol className="list-decimal list-inside space-y-1 text-xs leading-snug" style={{ color: '#334155' }}>
                            <li>We will confirm your registration once we have received your full payment.</li>
                            <li>Bank transfer must be NET and FREE of all charges (Bank Transfer cost to be borne by the participant).</li>
                            <li>Registration cancellations received prior to 10th January 2025 will be eligible to receive a 50% refund.</li>
                            <li>Cancellations received after 10th January 2025 will not be eligible for a refund.</li>
                        </ol>
                    </div>
                </div>
                <div className="text-xs text-center mt-2" style={{ color: '#9ca3af' }}>
                    Terms & Conditions apply.
                </div>
            </div>

            <div className="text-center text-xs mt-4 print:hidden" style={{ color: '#9ca3af' }}>
                This is a System Generated Invoice copy and does not require any Signature.
            </div>
        </div>
    );
};
