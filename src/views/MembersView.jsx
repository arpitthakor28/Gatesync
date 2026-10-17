import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Phone,
  Home,
  Trash2,
  Lock,
  X
} from 'lucide-react';

export const MembersView = () => {
  const { data, userRole, addMember, deleteMember } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newMember, setNewMember] = useState({
    username: '',
    email: '',
    phone: '',
    flat: '',
    address: '',
    status: 'Owner'
  });

  const filteredMembers = data.members.filter(m => {
    return m.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
           m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           m.flat.toLowerCase().includes(searchTerm.toLowerCase()) ||
           m.phone.includes(searchTerm);
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newMember.username || !newMember.email || !newMember.flat) return;
    addMember(newMember);
    setNewMember({ username: '', email: '', phone: '', flat: '', address: '', status: 'Owner' });
    setShowAddModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Users style={{ color: 'var(--primary)' }} /> GateSync Resident Directory
          </h2>
          <p className="section-subtitle">
            {userRole === 'admin'
              ? 'Complete resident database, flat assignments, registration controls'
              : 'Community resident directory & flat unit lookup'}
          </p>
        </div>
        {userRole === 'admin' && (
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <UserPlus size={18} /> Register New Member
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="glass-card" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search member name, flat unit, email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '36px', width: '100%' }}
          />
        </div>
        {userRole !== 'admin' && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Lock size={12} /> Read Only Directory
          </span>
        )}
      </div>

      {/* Grid of Resident Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {filteredMembers.map(member => (
          <div key={member.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span className="badge badge-info" style={{ fontSize: '0.85rem' }}>{member.flat || 'A-101'}</span>
                <span className={`badge ${member.status === 'Owner' ? 'badge-success' : 'badge-warning'}`}>
                  {member.status || 'Owner'}
                </span>
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '10px' }}>
                {member.username}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={14} style={{ color: 'var(--primary)' }} /> {member.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={14} style={{ color: 'var(--success)' }} /> {member.phone || 'N/A'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Home size={14} style={{ color: 'var(--warning)' }} /> {member.address || 'Green Valley GateSync Residency'}
                </div>
              </div>
            </div>

            {/* Admin Only Delete Action */}
            {userRole === 'admin' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', pt: '12px', borderTop: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => deleteMember(member.id)}
                  className="btn btn-danger btn-sm"
                  title="Remove member"
                >
                  <Trash2 size={14} /> Remove Member
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MODAL: Register New Resident (Admin Only) */}
      {showAddModal && userRole === 'admin' && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} style={{ color: 'var(--primary)' }} /> Register New Resident Member
              </h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  placeholder="Resident name"
                  value={newMember.username}
                  onChange={e => setNewMember({ ...newMember, username: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    placeholder="email@domain.com"
                    value={newMember.email}
                    onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Flat / Unit Number</label>
                  <input
                    type="text"
                    placeholder="e.g. B-204"
                    value={newMember.flat}
                    onChange={e => setNewMember({ ...newMember, flat: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    placeholder="Mobile number"
                    value={newMember.phone}
                    onChange={e => setNewMember({ ...newMember, phone: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Occupancy Status</label>
                  <select
                    value={newMember.status}
                    onChange={e => setNewMember({ ...newMember, status: e.target.value })}
                    className="form-select"
                  >
                    <option value="Owner">Flat Owner</option>
                    <option value="Tenant">Registered Tenant</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Permanent Address</label>
                <input
                  type="text"
                  placeholder="Address string"
                  value={newMember.address}
                  onChange={e => setNewMember({ ...newMember, address: e.target.value })}
                  className="form-input"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
                Save Member Record
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
