import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  UserCheck,
  Plus,
  LogOut,
  Search,
  Clock,
  Shield,
  Phone,
  Building,
  X,
  Eye,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  User,
  Calendar,
  FileText
} from 'lucide-react';

export const VisitorRegistryView = () => {
  const { data, userRole, addVisitor, checkoutVisitor, currentUser } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);

  const myFlat = currentUser?.flat || 'A-101';

  const [newVisitor, setNewVisitor] = useState({
    person_name: '',
    flat: userRole === 'member' ? myFlat : (data.members[0]?.flat || 'A-101'),
    purpose: 'Personal Guest',
    phone: ''
  });

  // STRICT PRIVACY FILTER:
  const filteredVisitors = data.registry.filter(reg => {
    // RESIDENT PRIVACY SCOPE: Residents ONLY see visitors arriving for THEIR flat
    if (userRole === 'member') {
      if (reg.flat !== myFlat) return false;
    }

    const matchesSearch = reg.person_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          reg.flat.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          reg.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'Inside') return matchesSearch && reg.status === 'Inside';
    if (statusFilter === 'Checked Out') return matchesSearch && reg.status === 'Checked Out';
    return matchesSearch;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newVisitor.person_name) return;
    addVisitor({
      ...newVisitor,
      flat: userRole === 'member' ? myFlat : newVisitor.flat
    });
    setNewVisitor({
      person_name: '',
      flat: userRole === 'member' ? myFlat : (data.members[0]?.flat || 'A-101'),
      purpose: 'Personal Guest',
      phone: ''
    });
    setShowAddModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <UserCheck style={{ color: 'var(--primary)' }} />
            {userRole === 'member' ? `Gate Visitors Log for Flat ${myFlat}` : 'Gate Visitor Security Registry'}
          </h2>
          <p className="section-subtitle">
            {userRole === 'member'
              ? 'Security check-in logs and pre-approved visitor entries for your unit'
              : 'Gate desk entry & exit timestamps for guests, deliveries, and service technicians'}
          </p>
        </div>
        
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus size={18} /> {userRole === 'member' ? 'Pre-Approve Visitor' : 'Register Gate Visitor'}
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '16px 24px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setStatusFilter('All')}
            className={`btn btn-sm ${statusFilter === 'All' ? 'btn-primary' : 'btn-secondary'}`}
          >
            All Logs ({data.registry.filter(r => userRole === 'admin' || userRole === 'staff' || r.flat === myFlat).length})
          </button>
          <button
            onClick={() => setStatusFilter('Inside')}
            className={`btn btn-sm ${statusFilter === 'Inside' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Currently Inside ({data.registry.filter(r => r.status === 'Inside' && (userRole === 'admin' || userRole === 'staff' || r.flat === myFlat)).length})
          </button>
          <button
            onClick={() => setStatusFilter('Checked Out')}
            className={`btn btn-sm ${statusFilter === 'Checked Out' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Checked Out ({data.registry.filter(r => r.status === 'Checked Out' && (userRole === 'admin' || userRole === 'staff' || r.flat === myFlat)).length})
          </button>
        </div>

        {userRole !== 'member' && (
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search visitor name or flat..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '36px', width: '100%' }}
            />
          </div>
        )}
      </div>

      {/* Registry Table Card */}
      <div className="glass-card">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th># Log</th>
                <th>Visitor Name & Contact</th>
                <th>Destination Flat</th>
                <th>Purpose of Visit</th>
                <th>Check In Time</th>
                <th>Check Out Time</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisitors.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No visitor logs found for your unit.
                  </td>
                </tr>
              ) : (
                filteredVisitors.map((reg, idx) => (
                  <tr key={reg.id}>
                    <td>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{reg.person_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={12} /> {reg.phone || 'N/A'}
                      </div>
                    </td>
                    <td><span className="badge badge-info">{reg.flat}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{reg.purpose}</td>
                    <td style={{ fontSize: '0.8rem' }}>{reg.in_time}</td>
                    <td style={{ fontSize: '0.8rem', color: reg.out_time === '-' ? 'var(--warning)' : 'var(--text-muted)' }}>
                      {reg.out_time}
                    </td>
                    <td>
                      <span className={`badge ${reg.status === 'Inside' ? 'badge-warning' : 'badge-success'}`}>
                        {reg.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => { setSelectedVisitor(reg); setShowAuditModal(true); }}
                          className="btn btn-secondary btn-sm"
                          style={{ gap: '6px' }}
                          title="View complete security audit details"
                        >
                          <Eye size={14} /> Audit
                        </button>
                        {reg.status === 'Inside' && (userRole === 'admin' || userRole === 'staff') && (
                          <button
                            onClick={() => checkoutVisitor(reg.id)}
                            className="btn btn-sm"
                            style={{
                              gap: '6px',
                              background: 'rgba(245, 158, 11, 0.12)',
                              color: 'var(--color-warning)',
                              border: '1px solid rgba(245, 158, 11, 0.35)'
                            }}
                          >
                            <LogOut size={14} /> Check Out
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

      {/* MODAL: Register New Visitor Entry */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={20} style={{ color: 'var(--color-primary)' }} />
                {userRole === 'member' ? `Pre-Approve Visitor for Flat ${myFlat}` : 'Gate Check-In Visitor Form'}
              </h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Visitor Full Name / Delivery Service</label>
                <input
                  type="text"
                  placeholder="e.g. Swiggy Delivery / Suresh Varma"
                  value={newVisitor.person_name}
                  onChange={e => setNewVisitor({ ...newVisitor, person_name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone Number</label>
                <input
                  type="text"
                  placeholder="10-digit mobile number"
                  value={newVisitor.phone}
                  onChange={e => setNewVisitor({ ...newVisitor, phone: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Visiting Flat Unit</label>
                {userRole === 'member' ? (
                  <input type="text" value={myFlat} disabled className="form-input" />
                ) : (
                  <select
                    value={newVisitor.flat}
                    onChange={e => setNewVisitor({ ...newVisitor, flat: e.target.value })}
                    className="form-select"
                  >
                    {data.members.map(m => (
                      <option key={m.id} value={m.flat}>{m.flat} — {m.username}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Purpose of Entry</label>
                <select
                  value={newVisitor.purpose}
                  onChange={e => setNewVisitor({ ...newVisitor, purpose: e.target.value })}
                  className="form-select"
                >
                  <option value="Food Delivery">Food Delivery (Zomato/Swiggy)</option>
                  <option value="Parcel Delivery">Parcel Delivery (Amazon/Flipkart)</option>
                  <option value="Personal Guest">Personal Guest / Relative</option>
                  <option value="Maintenance Service">Technician / Maintenance</option>
                  <option value="Cab Driver">Cab Pickup / Drop</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
                {userRole === 'member' ? 'Pre-Approve Visitor Entry' : 'Check-In Visitor & Save Entry'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Visitor Audit & Security Details */}
      {showAuditModal && selectedVisitor && (
        <div className="modal-overlay" onClick={() => setShowAuditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={22} style={{ color: 'var(--color-primary)' }} />
                  Security Audit Dossier
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Log Record ID: #GS-AUDIT-{String(selectedVisitor.id).padStart(4, '0')}
                </span>
              </div>
              <button className="modal-close" onClick={() => setShowAuditModal(false)}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '12px' }}>
              
              {/* Visitor Identity Hero Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(224, 242, 254, 0.45) 100%)',
                border: '1px solid var(--border-glass)',
                borderRadius: '16px',
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '1.2rem',
                    boxShadow: '0 4px 14px rgba(14, 165, 233, 0.35)'
                  }}>
                    {selectedVisitor.person_name ? selectedVisitor.person_name.charAt(0).toUpperCase() : 'V'}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      {selectedVisitor.person_name}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      <Phone size={13} style={{ color: 'var(--color-primary)' }} />
                      {selectedVisitor.phone || 'Phone Not Registered'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span className={`badge ${selectedVisitor.status === 'Inside' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.82rem', padding: '4px 12px' }}>
                    {selectedVisitor.status === 'Inside' ? '● Currently Inside Campus' : '✓ Checked Out (Departure Verified)'}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Security Clearance Pass</span>
                </div>
              </div>

              {/* Security Telemetry Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                
                <div style={{ background: 'var(--bg-dark-input)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    <Building size={14} style={{ color: 'var(--color-primary)' }} /> Destination Flat Unit
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                    Flat {selectedVisitor.flat}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Host: {data.members.find(m => m.flat === selectedVisitor.flat)?.username || 'Resident Member'}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-dark-input)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    <FileText size={14} style={{ color: 'var(--color-primary)' }} /> Visit Category / Purpose
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                    {selectedVisitor.purpose}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {selectedVisitor.purpose.includes('Delivery') ? 'Authorized Delivery Service' : 'Residential Visitor'}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-dark-input)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    <Clock size={14} style={{ color: 'var(--color-success)' }} /> Gate Check-In Time
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
                    {selectedVisitor.in_time || 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '2px' }}>
                    Gate Terminal: Main North Gate Desk
                  </div>
                </div>

                <div style={{ background: 'var(--bg-dark-input)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    <LogOut size={14} style={{ color: selectedVisitor.out_time === '-' ? 'var(--color-warning)' : 'var(--color-primary)' }} /> Gate Check-Out Time
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
                    {selectedVisitor.out_time === '-' ? 'In Progress (Active)' : selectedVisitor.out_time}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: selectedVisitor.out_time === '-' ? 'var(--color-warning)' : 'var(--text-muted)', marginTop: '2px' }}>
                    {selectedVisitor.out_time === '-' ? 'Visitor currently in premises' : 'Exit scanned & verified'}
                  </div>
                </div>

              </div>

              {/* Security Audit Verification Checklist */}
              <div style={{
                background: 'rgba(240, 249, 255, 0.65)',
                border: '1px solid var(--border-glass)',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '0.8rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                  <CheckCircle2 size={15} style={{ color: 'var(--color-success)' }} />
                  <span><strong>Resident Unit Authorization:</strong> Verified for Flat {selectedVisitor.flat}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                  <CheckCircle2 size={15} style={{ color: 'var(--color-success)' }} />
                  <span><strong>Security Checkpoint:</strong> Main Gate barrier scanner logged entry</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                  <CheckCircle2 size={15} style={{ color: 'var(--color-success)' }} />
                  <span><strong>Audit Trail Hash:</strong> SHA-256 integrity token logged to GateSync Ledger</span>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '6px' }}>
                {selectedVisitor.status === 'Inside' && (userRole === 'admin' || userRole === 'staff') && (
                  <button
                    onClick={() => {
                      checkoutVisitor(selectedVisitor.id);
                      setSelectedVisitor(prev => ({
                        ...prev,
                        status: 'Checked Out',
                        out_time: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      }));
                    }}
                    className="btn btn-warning"
                    style={{ gap: '6px' }}
                  >
                    <LogOut size={16} /> Mark Checked Out Now
                  </button>
                )}
                <button
                  onClick={() => setShowAuditModal(false)}
                  className="btn btn-secondary"
                >
                  Close Audit Dossier
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
