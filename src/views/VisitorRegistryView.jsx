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
  X
} from 'lucide-react';

export const VisitorRegistryView = () => {
  const { data, userRole, addVisitor, checkoutVisitor, currentUser } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

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
                      {reg.status === 'Inside' && (userRole === 'admin' || userRole === 'staff') && (
                        <button
                          onClick={() => checkoutVisitor(reg.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--warning)' }}
                        >
                          <LogOut size={14} /> Check Out
                        </button>
                      )}
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
                <Shield size={20} style={{ color: 'var(--primary)' }} />
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

    </div>
  );
};
