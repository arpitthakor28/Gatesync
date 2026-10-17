import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  UserCog,
  UserPlus,
  Mail,
  Phone,
  Clock,
  Shield,
  Trash2,
  X
} from 'lucide-react';

export const StaffView = () => {
  const { data, userRole, addStaff, deleteStaff } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);

  const [newStaff, setNewStaff] = useState({
    username: '',
    email: '',
    phone: '',
    role: 'Security Guard',
    shift: 'Day (8 AM - 8 PM)'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newStaff.username || !newStaff.email) return;
    addStaff(newStaff);
    setNewStaff({ username: '', email: '', phone: '', role: 'Security Guard', shift: 'Day (8 AM - 8 PM)' });
    setShowAddModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <UserCog style={{ color: 'var(--warning)' }} /> GateSync Staff Roster
          </h2>
          <p className="section-subtitle">
            Security guards, maintenance personnel, shift rosters & contact details
          </p>
        </div>
        {userRole === 'admin' && (
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <UserPlus size={18} /> Register Staff Personnel
          </button>
        )}
      </div>

      {/* Staff Personnel Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {data.staff.map(staff => (
          <div key={staff.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="badge badge-warning">{staff.role || 'Staff Member'}</span>
                <span className="badge badge-info">{staff.shift || 'General Shift'}</span>
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
                {staff.username}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={14} style={{ color: 'var(--primary)' }} /> {staff.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={14} style={{ color: 'var(--success)' }} /> {staff.phone || '9876543210'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={14} style={{ color: 'var(--warning)' }} /> Shift: {staff.shift}
                </div>
              </div>
            </div>

            {userRole === 'admin' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', pt: '12px', borderTop: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => deleteStaff(staff.id)}
                  className="btn btn-danger btn-sm"
                >
                  <Trash2 size={14} /> Remove Staff
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MODAL: Register New Staff */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} style={{ color: 'var(--primary)' }} /> Register New Staff
              </h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Staff Full Name</label>
                <input
                  type="text"
                  placeholder="Staff member name"
                  value={newStaff.username}
                  onChange={e => setNewStaff({ ...newStaff, username: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  placeholder="staff@gatesync.com"
                  value={newStaff.email}
                  onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  type="text"
                  placeholder="Mobile number"
                  value={newStaff.phone}
                  onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assigned Designation / Role</label>
                <select
                  value={newStaff.role}
                  onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
                  className="form-select"
                >
                  <option value="Head Security Guard">Head Security Guard</option>
                  <option value="Gate Guard">Gate Security Guard</option>
                  <option value="Maintenance Technician">Maintenance Technician</option>
                  <option value="Landscape Supervisor">Landscape Supervisor</option>
                  <option value="Housekeeping Lead">Housekeeping Lead</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Duty Shift Timing</label>
                <select
                  value={newStaff.shift}
                  onChange={e => setNewStaff({ ...newStaff, shift: e.target.value })}
                  className="form-select"
                >
                  <option value="Day (8 AM - 8 PM)">Day Shift (8 AM - 8 PM)</option>
                  <option value="Night (8 PM - 8 AM)">Night Shift (8 PM - 8 AM)</option>
                  <option value="General (9 AM - 6 PM)">General Shift (9 AM - 6 PM)</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
                Register Staff Personnel
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
