import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PrintInvoiceModal } from '../components/PrintInvoiceModal';
import {
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  Printer,
  CreditCard,
  IndianRupee,
  Search,
  Calculator,
  ShieldAlert,
  Zap,
  Droplet,
  Building,
  X
} from 'lucide-react';

export const BillingView = () => {
  const { data, userRole, createBill, payBill, currentUser } = useApp();

  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [selectedBillForPrint, setSelectedBillForPrint] = useState(null);
  const [selectedBillForPay, setSelectedBillForPay] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (userRole === 'staff') {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '600px', margin: '40px auto' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.15)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
          <ShieldAlert size={32} />
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px' }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.6' }}>
          Maintenance Billing and financial payment ledgers are strictly restricted to GateSync Administrators and Flat Residents.
        </p>
      </div>
    );
  }

  // New Bill Form State with auto calculation
  const [newBillData, setNewBillData] = useState({
    member_id: data.members[0]?.id || 1,
    block_rate: 4000,
    elec_prev: 100,
    elec_curr: 250,
    elec_rate: 15,
    water_prev: 200,
    water_curr: 450,
    water_rate: 10,
    due_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  });

  const elecUnits = Math.max(0, newBillData.elec_curr - newBillData.elec_prev);
  const elecAmount = elecUnits * newBillData.elec_rate;

  const waterUnits = Math.max(0, newBillData.water_curr - newBillData.water_prev);
  const waterAmount = waterUnits * newBillData.water_rate;

  const totalCalculatedBill = Number(newBillData.block_rate) + elecAmount + waterAmount;

  const myFlat = currentUser?.flat || 'A-101';
  const filteredBills = data.billing.filter(bill => {
    if (userRole === 'member') {
      if (bill.member_id !== currentUser?.id && bill.flat !== myFlat) {
        return false;
      }
    }

    const matchesSearch = bill.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          bill.invoice.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          bill.flat.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'pending') return matchesSearch && bill.status === 0;
    if (filterStatus === 'paid') return matchesSearch && bill.status === 1;
    return matchesSearch;
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const targetMember = data.members.find(m => m.id === Number(newBillData.member_id)) || data.members[0];
    
    createBill({
      member_id: targetMember.id,
      member_name: targetMember.username,
      flat: targetMember.flat,
      due_date: newBillData.due_date,
      total_amount: totalCalculatedBill,
      breakdown: [
        { type: 'Block Maintenance', reading: 0, prev_reading: 0, rate: Number(newBillData.block_rate), amount: Number(newBillData.block_rate) },
        { type: 'Electricity Unit Charge', reading: Number(newBillData.elec_curr), prev_reading: Number(newBillData.elec_prev), rate: Number(newBillData.elec_rate), amount: elecAmount },
        { type: 'Water Utility Charge', reading: Number(newBillData.water_curr), prev_reading: Number(newBillData.water_prev), rate: Number(newBillData.water_rate), amount: waterAmount }
      ]
    });
    setShowCreateModal(false);
  };

  const [payAmountInput, setPayAmountInput] = useState('');
  const [payMethod, setPayMethod] = useState('UPI Online / QR Code');

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!selectedBillForPay) return;
    const amountToPay = payAmountInput ? Number(payAmountInput) : selectedBillForPay.total_amount;
    payBill(selectedBillForPay.id, amountToPay, payMethod);
    setSelectedBillForPay(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Header Section */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <FileText style={{ color: 'var(--color-primary)' }} />
            {userRole === 'member' ? `Maintenance Statement for Unit ${myFlat}` : 'GateSync Maintenance Bills'}
          </h2>
          <p className="section-subtitle">
            {userRole === 'member'
              ? 'Private statement of block rent, electricity consumption, and water utility charges'
              : 'Issue maintenance invoices, calculate meter readings, and manage resident payments'}
          </p>
        </div>
        {userRole === 'admin' && (
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary" style={{ padding: '12px 24px' }}>
            <Plus size={18} /> Generate Monthly Bill
          </button>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '16px 28px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setFilterStatus('all')}
            className={`btn btn-sm ${filterStatus === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            All Statements ({data.billing.filter(b => userRole === 'admin' || b.member_id === currentUser?.id || b.flat === myFlat).length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`btn btn-sm ${filterStatus === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Pending Dues ({data.billing.filter(b => b.status === 0 && (userRole === 'admin' || b.member_id === currentUser?.id || b.flat === myFlat)).length})
          </button>
          <button
            onClick={() => setFilterStatus('paid')}
            className={`btn btn-sm ${filterStatus === 'paid' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Paid Receipts ({data.billing.filter(b => b.status === 1 && (userRole === 'admin' || b.member_id === currentUser?.id || b.flat === myFlat)).length})
          </button>
        </div>

        {userRole === 'admin' && (
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search invoice or resident..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '40px', width: '100%', borderRadius: '20px' }}
            />
          </div>
        )}
      </div>

      {/* Bills Table Card */}
      <div className="glass-card">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Billing Date</th>
                <th>Resident Member</th>
                <th>Flat Unit</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No maintenance statement records found matching filter.
                  </td>
                </tr>
              ) : (
                filteredBills.map(bill => (
                  <tr key={bill.id}>
                    <td style={{ fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>{bill.invoice}</td>
                    <td style={{ fontSize: '0.85rem' }}>{bill.billing_date}</td>
                    <td style={{ fontWeight: 700 }}>{bill.member_name}</td>
                    <td><span className="badge badge-info">{bill.flat}</span></td>
                    <td style={{ fontWeight: 900, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                      ₹{bill.total_amount.toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge ${bill.status === 1 ? 'badge-success' : 'badge-danger'}`}>
                        {bill.status === 1 ? 'Paid ✓' : 'Pending Payment'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setSelectedBillForPrint(bill)}
                          className="btn btn-secondary btn-sm"
                          title="View / Print Official Receipt"
                        >
                          <Printer size={14} /> Official Receipt
                        </button>
                        {bill.status === 0 && (
                          <button
                            onClick={() => {
                              setSelectedBillForPay(bill);
                              setPayAmountInput(bill.total_amount);
                            }}
                            className="btn btn-success btn-sm"
                          >
                            <CreditCard size={14} /> Pay Dues Now
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Generate New Maintenance Bill (Interactive Meter Gauges) */}
      {showCreateModal && userRole === 'admin' && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Calculator size={22} style={{ color: 'var(--color-primary)' }} /> Monthly Bill Generator & Calculator
              </h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="form-group">
                <label className="form-label">Target Resident Unit</label>
                <select
                  value={newBillData.member_id}
                  onChange={e => setNewBillData({ ...newBillData, member_id: e.target.value })}
                  className="form-select"
                >
                  {data.members.map(m => (
                    <option key={m.id} value={m.id}>{m.username} ({m.flat})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Base Block Maintenance Charge (₹)</label>
                <input
                  type="number"
                  value={newBillData.block_rate}
                  onChange={e => setNewBillData({ ...newBillData, block_rate: e.target.value })}
                  className="form-input"
                />
              </div>

              {/* Electricity Meter Gauge Card */}
              <div style={{ background: 'var(--bg-dark-input)', padding: '18px', borderRadius: '16px', border: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={18} /> ⚡ Electricity Meter Reading
                  </span>
                  <span className="badge badge-warning">{elecUnits} Units Consumed</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Previous Reading</label>
                    <input type="number" value={newBillData.elec_prev} onChange={e => setNewBillData({ ...newBillData, elec_prev: e.target.value })} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Current Reading</label>
                    <input type="number" value={newBillData.elec_curr} onChange={e => setNewBillData({ ...newBillData, elec_curr: e.target.value })} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rate / Unit (₹)</label>
                    <input type="number" value={newBillData.elec_rate} onChange={e => setNewBillData({ ...newBillData, elec_rate: e.target.value })} className="form-input" />
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>
                  Subtotal Charge: <strong style={{ color: 'var(--text-main)', fontSize: '1rem' }}>₹{elecAmount}</strong>
                </div>
              </div>

              {/* Water Meter Gauge Card */}
              <div style={{ background: 'var(--bg-dark-input)', padding: '18px', borderRadius: '16px', border: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Droplet size={18} /> 💧 Water Utility Reading
                  </span>
                  <span className="badge badge-info">{waterUnits} Units Consumed</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Previous Reading</label>
                    <input type="number" value={newBillData.water_prev} onChange={e => setNewBillData({ ...newBillData, water_prev: e.target.value })} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Current Reading</label>
                    <input type="number" value={newBillData.water_curr} onChange={e => setNewBillData({ ...newBillData, water_curr: e.target.value })} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rate / Unit (₹)</label>
                    <input type="number" value={newBillData.water_rate} onChange={e => setNewBillData({ ...newBillData, water_rate: e.target.value })} className="form-input" />
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>
                  Subtotal Charge: <strong style={{ color: 'var(--text-main)', fontSize: '1rem' }}>₹{waterAmount}</strong>
                </div>
              </div>

              {/* Auto Total Summary Banner */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--grad-primary)', padding: '20px 24px', borderRadius: '16px', boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4)' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase' }}>Total Net Payable Invoice</div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.7)' }}>Base Maintenance + Electricity + Water</div>
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff' }}>
                  ₹{totalCalculatedBill.toLocaleString()}
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '14px' }}>
                Generate & Issue Statement
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Pay Maintenance Bill */}
      {selectedBillForPay && (
        <div className="modal-overlay" onClick={() => setSelectedBillForPay(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CreditCard size={22} style={{ color: 'var(--color-success)' }} /> Payment Gateway Simulator
              </h3>
              <button className="modal-close" onClick={() => setSelectedBillForPay(null)}><X size={20} /></button>
            </div>

            <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Virtual Credit Card Display */}
              <div style={{
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
                padding: '20px',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8 }}>GateSync Pay Instant</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 900 }}>VISA</span>
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Statement for {selectedBillForPay.member_name} ({selectedBillForPay.flat})</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '8px', color: '#6ee7b7' }}>
                  ₹{selectedBillForPay.total_amount.toLocaleString()}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Channel</label>
                <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="form-select">
                  <option value="UPI Online / QR Code">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="Credit / Debit Card">Credit / Debit Card</option>
                  <option value="Net Banking">Net Banking (HDFC / ICICI / SBI)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Enter Payment Amount (₹)</label>
                <input
                  type="number"
                  value={payAmountInput}
                  onChange={e => setPayAmountInput(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <button type="submit" className="btn btn-success" style={{ width: '100%', padding: '14px' }}>
                Confirm & Pay ₹{selectedBillForPay.total_amount.toLocaleString()}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {selectedBillForPrint && (
        <PrintInvoiceModal
          bill={selectedBillForPrint}
          onClose={() => setSelectedBillForPrint(null)}
        />
      )}

    </div>
  );
};
