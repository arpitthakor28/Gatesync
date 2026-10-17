import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  Plus,
  Trash2,
  CheckCircle,
  Archive,
  AlertTriangle,
  Calendar,
  X,
  Info
} from 'lucide-react';

export const AnnouncementsView = () => {
  const { data, userRole, addAnnouncement, toggleAnnouncementStatus, deleteAnnouncement } = useApp();
  const [filterCategory, setFilterCategory] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newNotice, setNewNotice] = useState({
    announcement_subject: '',
    announcement_text: '',
    category: 'General'
  });

  const filteredAnnouncements = data.announcements.filter(a => {
    if (filterCategory === 'All') return true;
    return a.category === filterCategory;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newNotice.announcement_subject || !newNotice.announcement_text) return;
    addAnnouncement(newNotice);
    setNewNotice({ announcement_subject: '', announcement_text: '', category: 'General' });
    setShowAddModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Bell style={{ color: 'var(--warning)' }} /> GateSync Notice Board
          </h2>
          <p className="section-subtitle">
            Official announcements, urgent water/power maintenance alerts, and committee updates
          </p>
        </div>
        {userRole === 'admin' && (
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus size={18} /> Post New Notice
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="glass-card" style={{ display: 'flex', gap: '8px', padding: '14px 24px' }}>
        {['All', 'Urgent', 'General', 'Event'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`btn btn-sm ${filterCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
          >
            {cat} Notices
          </button>
        ))}
      </div>

      {/* Notice Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {filteredAnnouncements.length === 0 ? (
          <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
            No notices posted under this category.
          </div>
        ) : (
          filteredAnnouncements.map(ann => (
            <div key={ann.announcement_id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className={`badge ${
                    ann.category === 'Urgent' ? 'badge-danger' : 
                    ann.category === 'Event' ? 'badge-success' : 'badge-info'
                  }`}>
                    {ann.category || 'General'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ann.created_at}</span>
                    <span className={`badge ${ann.announcement_status === 1 ? 'badge-success' : 'badge-warning'}`}>
                      {ann.announcement_status === 1 ? 'Active' : 'Archived'}
                    </span>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
                  {ann.announcement_subject}
                </h3>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                  {ann.announcement_text}
                </p>
              </div>

              {/* Admin Actions Footer */}
              {userRole === 'admin' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', pt: '12px', borderTop: '1px solid var(--border-color)' }}>
                  <button
                    onClick={() => toggleAnnouncementStatus(ann.announcement_id)}
                    className="btn btn-secondary btn-sm"
                    title="Archive or Activate notice"
                  >
                    <Archive size={14} /> {ann.announcement_status === 1 ? 'Archive' : 'Activate'}
                  </button>
                  <button
                    onClick={() => deleteAnnouncement(ann.announcement_id)}
                    className="btn btn-danger btn-sm"
                    title="Delete notice permanently"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* MODAL: Post New Notice */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={20} style={{ color: 'var(--primary)' }} /> Post GateSync Announcement
              </h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Notice Category</label>
                <select
                  value={newNotice.category}
                  onChange={e => setNewNotice({ ...newNotice, category: e.target.value })}
                  className="form-select"
                >
                  <option value="General">General Information</option>
                  <option value="Urgent">Urgent Maintenance / Interruption</option>
                  <option value="Event">GateSync Event / Celebration</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Announcement Subject / Headline</label>
                <input
                  type="text"
                  placeholder="e.g. Water Tank Cleaning Schedule"
                  value={newNotice.announcement_subject}
                  onChange={e => setNewNotice({ ...newNotice, announcement_subject: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notice Content Details</label>
                <textarea
                  rows="4"
                  placeholder="Enter full details of the notice for residents..."
                  value={newNotice.announcement_text}
                  onChange={e => setNewNotice({ ...newNotice, announcement_text: e.target.value })}
                  className="form-textarea"
                  required
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
                Publish Announcement
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
