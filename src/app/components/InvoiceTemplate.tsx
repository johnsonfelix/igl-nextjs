
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
        phoneNumber?: string;
        taxNumber?: string;
        gstNumber?: string;
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

    const blue = '#004aad';
    const darkBlue = '#00317a';
    const borderStyle = `2px solid ${blue}`;

    return (
        <div
            id="invoice-component"
            style={{
                backgroundColor: '#ffffff',
                color: '#1e293b',
                width: '210mm',
                minWidth: '210mm',
                padding: '10mm',
                boxSizing: 'border-box',
                margin: '0 auto',
                fontFamily: 'Arial, Helvetica, sans-serif',
                fontSize: '14px',
                lineHeight: '1.4',
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', border: borderStyle, marginBottom: '16px' }}>
                <div style={{ width: '33.33%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: borderStyle }}>
                    <img src="/images/logo.png" alt="IGLA Logo" style={{ width: '112px', objectFit: 'contain' }} />
                </div>
                <div style={{ width: '66.67%', padding: '16px' }}>
                    <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: blue, marginBottom: '4px', lineHeight: '1.1', margin: '0 0 4px 0' }}>Innovative Global Logistics Allianz</h1>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: blue, marginBottom: '12px', lineHeight: '1.1', margin: '0 0 12px 0' }}>( IGLA )</h2>
                    {/* <div style={{ fontSize: '13px', fontWeight: '500', lineHeight: '1.5' }}>
                        <p style={{ margin: '0' }}>Amber 16 F 2, Olympia Opaline, 33, Rajiv Gandhi Road,</p>
                        <p style={{ margin: '0' }}>Navalur, Chennai - 600 130, India.</p>
                        <p style={{ margin: '4px 0 0 0' }}>Mob : +91 9363027279 , Mail : <span style={{ fontWeight: 'bold' }}>sales@igla.asia</span></p>
                        <p style={{ margin: '0' }}>Website : <span style={{ fontWeight: 'bold' }}>www.igla.asia</span></p>
                    </div> */}
                </div>
            </div>

            {/* Customer & Invoice Details */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                {/* Customer Details */}
                <div style={{ width: '50%', border: borderStyle, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ backgroundColor: darkBlue, padding: '8px 12px', fontWeight: 'bold', fontSize: '15px', color: '#ffffff' }}>
                        Customer Details
                    </div>
                    <div style={{ padding: '12px', fontSize: '13px', flex: 1 }}>
                        <div style={{ marginBottom: '8px' }}>
                            <div style={{ fontWeight: 'bold', textTransform: 'uppercase', color: darkBlue, fontSize: '13px' }}>{customerDetails.companyName}</div>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: '110px', padding: '2px 0', verticalAlign: 'top' }}>Address</td>
                                    <td style={{ fontWeight: 'bold', padding: '2px 0', lineHeight: '1.3', wordBreak: 'break-word' }}>{customerDetails.address || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td style={{ width: '110px', padding: '2px 0', verticalAlign: 'top' }}>Tel</td>
                                    <td style={{ fontWeight: 'bold', padding: '2px 0', lineHeight: '1.3' }}>{customerDetails.phoneNumber || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td style={{ width: '110px', padding: '2px 0', verticalAlign: 'top' }}>Tax Number</td>
                                    <td style={{ fontWeight: 'bold', padding: '2px 0', lineHeight: '1.3' }}>{customerDetails.taxNumber || 'N/A'}</td>
                                </tr>
                                {customerDetails.gstNumber && (
                                    <tr>
                                        <td style={{ width: '110px', padding: '2px 0', verticalAlign: 'top' }}>GST Number</td>
                                        <td style={{ fontWeight: 'bold', padding: '2px 0', lineHeight: '1.3' }}>{customerDetails.gstNumber}</td>
                                    </tr>
                                )}
                                <tr>
                                    <td style={{ width: '110px', padding: '2px 0', verticalAlign: 'top' }}>Postal Code</td>
                                    <td style={{ fontWeight: 'bold', padding: '2px 0', lineHeight: '1.3' }}>{customerDetails.postalCode || 'N/A'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Invoice Details */}
                <div style={{ width: '50%', border: borderStyle, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ backgroundColor: darkBlue, padding: '8px 12px', fontWeight: 'bold', fontSize: '15px', color: '#ffffff' }}>
                        Invoice Details
                    </div>
                    <div style={{ padding: '12px', fontSize: '13px', flex: 1 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: '110px', padding: '3px 0', color: '#475569', verticalAlign: 'top' }}>Participant Name</td>
                                    <td style={{ padding: '3px 0' }}>
                                        <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>: {customerDetails.name}</div>
                                        {customerDetails.designation && (
                                            <div style={{ fontSize: '11px', paddingLeft: '8px' }}>{customerDetails.designation}</div>
                                        )}
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ width: '110px', padding: '3px 0', color: '#475569' }}>Email</td>
                                    <td style={{ fontWeight: 'bold', padding: '3px 0' }}>: {customerDetails.email}</td>
                                </tr>
                                <tr>
                                    <td style={{ width: '110px', padding: '3px 0', color: '#475569' }}>Bill No</td>
                                    <td style={{ fontWeight: 'bold', padding: '3px 0' }}>: {orderId}</td>
                                </tr>
                                <tr>
                                    <td style={{ width: '110px', padding: '3px 0', color: '#475569' }}>Member Code</td>
                                    <td style={{ fontWeight: 'bold', padding: '3px 0' }}>: {customerDetails.memberId}</td>
                                </tr>
                                <tr>
                                    <td style={{ width: '110px', padding: '3px 0', color: '#475569' }}>Bill Date</td>
                                    <td style={{ fontWeight: 'bold', padding: '3px 0' }}>: {format(new Date(date), 'dd/MM/yyyy')}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <table style={{ width: '100%', border: borderStyle, borderCollapse: 'collapse', marginBottom: '16px' }}>
                <thead>
                    <tr style={{ backgroundColor: darkBlue, color: '#ffffff', fontSize: '13px' }}>
                        <th style={{ padding: '8px', borderRight: '1px solid rgba(255,255,255,0.2)', width: '56px', textAlign: 'center' }}>S.No</th>
                        <th style={{ padding: '8px', borderRight: '1px solid rgba(255,255,255,0.2)', textAlign: 'left' }}>Item Name</th>
                        <th style={{ padding: '8px', borderRight: '1px solid rgba(255,255,255,0.2)', width: '96px', textAlign: 'center' }}>Rate</th>
                        <th style={{ padding: '8px', borderRight: '1px solid rgba(255,255,255,0.2)', width: '56px', textAlign: 'center' }}>Qty</th>
                        <th style={{ padding: '8px', width: '112px', textAlign: 'center' }}>Total ({currency})</th>
                    </tr>
                </thead>
                <tbody style={{ fontSize: '13px' }}>
                    {items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '8px', borderRight: `1px solid ${blue}`, textAlign: 'center' }}>{idx + 1}</td>
                            <td style={{ padding: '8px', borderRight: `1px solid ${blue}` }}>{item.name}</td>
                            <td style={{ padding: '8px', borderRight: `1px solid ${blue}`, textAlign: 'center' }}>
                                {item.originalPrice && item.originalPrice > item.price && (
                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                        <span style={{ fontSize: '11px', color: '#6b7280' }}>
                                            {formatPrice(item.originalPrice || 0)}
                                        </span>
                                        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                                            <line x1="0" y1="85%" x2="100%" y2="85%" stroke="#6b7280" strokeWidth="1.5" />
                                        </svg>
                                    </div>
                                )}
                                <div style={item.originalPrice && item.originalPrice > item.price ? { fontWeight: 'bold', color: blue } : {}}>
                                    {formatPrice(item.price)}
                                </div>
                            </td>
                            <td style={{ padding: '8px', borderRight: `1px solid ${blue}`, textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{item.total !== 0 ? formatPrice(item.total) : item.total}</td>
                        </tr>
                    ))}
                    {/* Maintain a few empty rows for structure */}
                    {[...Array(Math.max(0, 3 - items.length))].map((_, i) => (
                        <tr key={`empty-${i}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '8px', borderRight: `1px solid ${blue}`, textAlign: 'center' }}>&nbsp;</td>
                            <td style={{ padding: '8px', borderRight: `1px solid ${blue}` }}>&nbsp;</td>
                            <td style={{ padding: '8px', borderRight: `1px solid ${blue}`, textAlign: 'center' }}>&nbsp;</td>
                            <td style={{ padding: '8px', borderRight: `1px solid ${blue}`, textAlign: 'center' }}>&nbsp;</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>&nbsp;</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr style={{ borderTop: borderStyle }}>
                        <td colSpan={3} style={{ padding: '8px', textAlign: 'right', fontSize: '11px', paddingRight: '16px', borderRight: `1px solid ${blue}`, color: '#6b7280' }}>
                            ***Bank Charges Included
                        </td>
                        <td style={{ padding: 0 }} colSpan={2}>
                            <div style={{ display: 'flex', flexDirection: 'column', fontSize: '11px' }}>
                                {currency === 'INR' ? (
                                    <>
                                        <div style={{ display: 'flex', borderBottom: `1px solid ${blue}` }}>
                                            <div style={{ flex: 1, padding: '4px', borderRight: `1px solid ${blue}`, textAlign: 'center', fontWeight: 'bold', color: darkBlue }}>Total</div>
                                            <div style={{ flex: 1, padding: '4px', textAlign: 'right', paddingRight: '8px' }}>
                                                {formatPrice(totalAmount / 1.18)}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', borderBottom: `1px solid ${blue}` }}>
                                            <div style={{ flex: 1, padding: '4px', borderRight: `1px solid ${blue}`, textAlign: 'center', fontWeight: 'bold', color: darkBlue }}>CGST (9%)</div>
                                            <div style={{ flex: 1, padding: '4px', textAlign: 'right', paddingRight: '8px' }}>
                                                {formatPrice((totalAmount / 1.18) * 0.09)}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', borderBottom: `1px solid ${blue}` }}>
                                            <div style={{ flex: 1, padding: '4px', borderRight: `1px solid ${blue}`, textAlign: 'center', fontWeight: 'bold', color: darkBlue }}>SGST (9%)</div>
                                            <div style={{ flex: 1, padding: '4px', textAlign: 'right', paddingRight: '8px' }}>
                                                {formatPrice((totalAmount / 1.18) * 0.09)}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', backgroundColor: '#eff6ff' }}>
                                            <div style={{ flex: 1, padding: '4px', borderRight: `1px solid ${blue}`, textAlign: 'center', fontWeight: 'bold', color: darkBlue }}>Grand Total</div>
                                            <div style={{ flex: 1, padding: '4px', textAlign: 'right', fontWeight: 'bold', paddingRight: '8px', fontSize: '13px' }}>
                                                {formatPrice(totalAmount)}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ textAlign: 'center', fontWeight: 'bold', color: darkBlue, borderBottom: `1px solid ${blue}`, padding: '4px' }}>Grand Total</div>
                                        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16px', padding: '8px' }}>{totalAmount !== 0 ? formatPrice(totalAmount) : totalAmount}</div>
                                    </>
                                )}
                            </div>
                        </td>
                    </tr>
                </tfoot>
            </table>

            {/* Footer / Terms */}
            <div style={{ border: borderStyle, padding: '16px', fontSize: '13px' }}>
                <div style={{ display: 'flex', gap: '24px' }}>
                    <div style={{ width: '50%' }}>
                        <h3 style={{ fontWeight: 'bold', color: darkBlue, marginBottom: '4px', margin: '0 0 4px 0', fontSize: '13px' }}>Bank Transfer:</h3>
                        <div style={{ fontSize: '11px', lineHeight: '1.5', color: '#374151' }}>
                            <div style={{ fontWeight: 'bold', color: darkBlue }}>Beneficiary's Bank</div>
                            <div>HDFC Bank Limited</div>
                            <div>Parrys Corner Branch</div>
                            <div>SWIFT CODE: HDFCINBBCHE</div>
                            <div>ACCOUNT NAME: INNOVATIVE GLOBAL LOGISTICS ALLIANZ</div>
                            <div>ACCOUNT NO: 50200035538980</div>
                        </div>
                    </div>
                    <div style={{ width: '50%' }}>
                        <h4 style={{ fontWeight: 'bold', color: darkBlue, marginBottom: '4px', margin: '0 0 4px 0', fontSize: '13px' }}>Remarks:</h4>
                        <div style={{ fontSize: '11px', lineHeight: '1.5', color: '#334155' }}>
                            <div style={{ display: 'flex', gap: '4px', marginBottom: '2px' }}>
                                <span style={{ width: '12px', flexShrink: 0 }}>1.</span>
                                <div>We will confirm your registration once we have received your full payment.</div>
                            </div>
                            <div style={{ display: 'flex', gap: '4px', marginBottom: '2px' }}>
                                <span style={{ width: '12px', flexShrink: 0 }}>2.</span>
                                <div>Bank transfer must be NET and FREE of all charges (Bank Transfer cost to be borne by the participant).</div>
                            </div>
                            <div style={{ display: 'flex', gap: '4px', marginBottom: '2px' }}>
                                <span style={{ width: '12px', flexShrink: 0 }}>3.</span>
                                <div>Registration cancellations received prior to 10th January 2025 will be eligible to receive a 50% refund.</div>
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <span style={{ width: '12px', flexShrink: 0 }}>4.</span>
                                <div>Cancellations received after 10th January 2025 will not be eligible for a refund.</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div style={{ fontSize: '11px', textAlign: 'center', marginTop: '8px', color: '#9ca3af' }}>
                    Terms & Conditions apply.
                </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '11px', marginTop: '16px', color: '#9ca3af' }}>
                This is a System Generated Invoice copy and does not require any Signature.
            </div>
        </div>
    );
};
