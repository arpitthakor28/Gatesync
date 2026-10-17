import React from 'react';
import { Building2, Printer, CheckCircle, Clock, X, QrCode } from 'lucide-react';

export const PrintInvoiceModal = ({ bill, onClose }) => {
  if (!bill) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content printable-invoice-container" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '750px', padding: '36px' }}
      >
        {/* Action Header - Hidden when printing */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Maintenance Invoice & Payment Receipt</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handlePrint} className="btn btn-primary btn-sm">
              <Printer size={16} /> Print Receipt
            </button>
            <button onClick={onClose} className="btn btn-secondary btn-sm">
              <X size={16} /> Close
            </button>
          </div>
        </div>

        {/* Invoice Printable Document Body */}
        <div style={{ background: '#ffffff', color: '#0f172a', padding: '24px', borderRadius: '12px', fontFamily: 'var(--font-body)' }}>
          
          {/* Header Brand */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: '20px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#6366f1', color: '#ffffff', padding: '8px', borderRadius: '8px' }}>
                  <Building2 size={24} />
                </div>
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>GATESYNC - GREEN VALLEY RESIDENCY</h1>
                  <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Reg No: HS-MUM-2022-89412 | Sector 4, Main Boulevard</p>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 800,
                backgroundColor: bill.status === 1 ? '#dcfce7' : '#fef3c7',
                color: bill.status === 1 ? '#15803d' : '#b45309',
                border: `1px solid ${bill.status === 1 ? '#86efac' : '#fde047'}`
              }}>
                {bill.status === 1 ? 'OFFICIAL RECEIPT - PAID' : 'PAYMENT DUE'}
              </span>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155', marginTop: '8px' }}>
                Invoice #: <span style={{ color: '#6366f1' }}>{bill.invoice}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Date: {bill.billing_date}
              </div>
            </div>
          </div>

          {/* Member & Billing Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', marginBottom: '20px' }}>
            <div>
              <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '6px' }}>Billed Resident</h4>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{bill.member_name}</div>
              <div style={{ fontSize: '0.85rem', color: '#334155' }}>Flat Unit: <strong>{bill.flat}</strong></div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Billing Cycle: September 2024</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '6px' }}>Payment Info</h4>
              <div style={{ fontSize: '0.85rem', color: '#334155' }}>Due Date: <strong>{bill.due_date || '2024-09-30'}</strong></div>
              <div style={{ fontSize: '0.85rem', color: '#334155' }}>Payment Method: <strong>{bill.payment_method || 'Online Banking / UPI'}</strong></div>
              {bill.status === 1 && (
                <div style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 700, marginTop: '4px' }}>
                  Paid Amount: ₹{bill.amount_payed.toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Line Items Breakdown Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ background: '#e2e8f0', color: '#334155', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}># Breakdown Item</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Reading / Cons.</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Unit Rate</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {bill.breakdown && bill.breakdown.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                  <td style={{ padding: '10px', fontWeight: 600, color: '#1e293b' }}>{item.type}</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#64748b' }}>
                    {item.reading > 0 ? `${item.reading - item.prev_reading} units` : 'Fixed Charge'}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#64748b' }}>
                    {item.rate > 0 ? `₹${item.rate}` : '-'}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    ₹{item.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total Payable Summary */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '10px', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Net Payable Amount</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Includes all municipal taxes, water & electricity utilities.</div>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4f46e5' }}>
              ₹{bill.total_amount.toLocaleString()}
            </div>
          </div>

          {/* Footer Seals & Verification */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px dashed #cbd5e1', pt: '16px', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <QrCode size={48} style={{ color: '#475569' }} />
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                Scan to verify invoice authenticity.<br/>
                Computer Generated Document - No physical signature required.
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid #94a3b8', width: '160px', marginBottom: '4px' }}></div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Authorized Treasurer</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Green Valley GateSync Society</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
