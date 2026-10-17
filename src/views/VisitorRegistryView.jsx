import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { visitorApi } from '../api/client';
import { PreApprovedPassModal } from '../components/PreApprovedPassModal';
import { PassScannerModal } from '../components/PassScannerModal';
import { GuardQuickDeliveryModal } from '../components/GuardQuickDeliveryModal';
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
  XCircle,
  AlertTriangle,
  Download,
  QrCode,
  Scan,
  Zap,
  PhoneCall,
  Lock,
  Unlock,
  Car
} from 'lucide-react';

export const VisitorRegistryView = () => {
  const { data, userRole, currentUser } = useApp();
  const { user, role, societyId } = useAuth();
  const { guardWakeLockActive } = useNotifications();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [visitorLogs, setVisitorLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showQuickDeliveryModal, setShowQuickDeliveryModal] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);

  const myFlat = currentUser?.flat || user?.flatNumber || 'A-101';
  const isResident = userRole === 'member' || role === 'RESIDENT';
  const isGuard = userRole === 'staff' || role === 'GUARD' || userRole === 'admin';

  const [newVisitor, setNewVisitor] = useState({
    visitorName: '',
    visitorPhone: '',
    vehicleNumber: '',
    flatNumber: isResident ? myFlat : (data.members[0]?.flat || 'A-101'),
    purpose: 'Personal Guest',
    photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
  });

  // Load real history from backend with fallback to AppContext data
  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const history = await visitorApi.getHistory();
      if (Array.isArray(history) && history.length > 0) {
        const mapped = history.map(item => ({
          id: item.id,
          person_name: item.visitorName,
          flat: item.flatNumber,
          purpose: item.purpose || 'Visit',
          phone: item.visitorPhone || '',
          vehicle: item.vehicleNumber || '',
          photoUrl: item.photoUrl,
          status: item.checkedOutAt ? 'Checked Out' : (item.status === 'APPROVED' ? 'Inside' : item.status),
          in_time: item.createdAt ? new Date(item.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Just now',
          out_time: item.checkedOutAt ? new Date(item.checkedOutAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '-',
          raw: item
        }));
        setVisitorLogs(mapped);
      } else {
        setVisitorLogs(data.registry || []);
      }
    } catch (e) {
      console.warn('Backend history fetch error, using local state:', e);
      setVisitorLogs(data.registry || []);
    } finally {
      setLoading(false);
    }
  }, [data.registry]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Strict Resident Privacy Filter
  const filteredVisitors = visitorLogs.filter(reg => {
    if (isResident) {
      if (reg.flat !== myFlat) return false;
    }

    const matchesSearch =
      (reg.person_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reg.flat || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reg.purpose || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'Inside') return matchesSearch && reg.status === 'Inside';
    if (statusFilter === 'Checked Out') return matchesSearch && reg.status === 'Checked Out';
    if (statusFilter === 'PENDING') return matchesSearch && (reg.status === 'PENDING' || reg.status === 'VISITOR_NO_RESPONSE');
    return matchesSearch;
  });

  // Guard registers a new visitor
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newVisitor.visitorName) return;

    try {
      const payload = {
        ...newVisitor,
        flatNumber: isResident ? myFlat : newVisitor.flatNumber
      };

      const res = await visitorApi.createRequest(payload);

      // Add to local list immediately
      const newItem = {
        id: res.id || Date.now(),
        person_name: payload.visitorName,
        flat: payload.flatNumber,
        purpose: payload.purpose,
        phone: payload.visitorPhone,
        vehicle: payload.vehicleNumber,
        photoUrl: payload.photoUrl,
        status: res.status || 'PENDING',
        in_time: 'Just now',
        out_time: '-',
        raw: res
      };

      setVisitorLogs(prev => [newItem, ...prev]);
      setShowAddModal(false);
      setNewVisitor({
        visitorName: '',
        visitorPhone: '',
        vehicleNumber: '',
        flatNumber: isResident ? myFlat : (data.members[0]?.flat || 'A-101'),
        purpose: 'Personal Guest',
        photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
      });
    } catch (err) {
      alert('Could not register visitor: ' + (err.response?.data?.message || err.message));
    }
  };

  // Guard checks out visitor
  const handleCheckout = async (id) => {
    try {
      await visitorApi.checkout(id);
      setVisitorLogs(prev => prev.map(v => v.id === id ? { ...v, status: 'Checked Out', out_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : v));
    } catch (err) {
      alert('Checkout error: ' + (err.response?.data?.message || err.message));
    }
  };

  // CSV Export for visitor logs
  const exportCsv = () => {
    const headers = ['Log ID', 'Visitor Name', 'Phone', 'Flat', 'Purpose', 'Vehicle', 'Check In Time', 'Check Out Time', 'Status'];
    const rows = filteredVisitors.map((v, i) => [
      i + 1,
      `"${v.person_name || ''}"`,
      `"${v.phone || ''}"`,
      `"${v.flat || ''}"`,
      `"${v.purpose || ''}"`,
      `"${v.vehicle || ''}"`,
      `"${v.in_time || ''}"`,
      `"${v.out_time || ''}"`,
      `"${v.status || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GateSync_Visitors_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Section Header with Action Bar */}
      <div className="section-header" style={{ flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 className="section-title">
            <UserCheck style={{ color: 'var(--color-primary, #0284c7)' }} />
            {isResident ? `Gate Visitors Log for Flat ${myFlat}` : 'Gate Visitor Security Registry'}
          </h2>
          <p className="section-subtitle">
            {isResident
              ? 'Real-time security gate check-in logs and instant pre-approved visitor entry passes'
              : 'Main Gate desk live visitor logging, intercom verification, and instant 1-tap deliveries'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {isResident ? (
            <button
              onClick={() => setShowPassModal(true)}
              className="btn btn-primary"
              style={{ minHeight: '44px', gap: '8px', fontWeight: 800 }}
            >
              <QrCode size={18} /> Create Pre-Approved Pass
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowQuickDeliveryModal(true)}
                className="btn btn-secondary"
                style={{ minHeight: '44px', gap: '8px', fontWeight: 700, borderColor: 'var(--color-success, #10b981)', color: 'var(--color-success, #10b981)' }}
              >
                <Zap size={16} /> 1-Tap Quick Delivery
              </button>

              <button
                onClick={() => setShowScanModal(true)}
                className="btn btn-secondary"
                style={{ minHeight: '44px', gap: '8px', fontWeight: 700, borderColor: 'var(--color-warning, #f59e0b)', color: 'var(--color-warning, #f59e0b)' }}
              >
                <Scan size={16} /> Scan Pass / OTP
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary"
                style={{ minHeight: '44px', gap: '8px', fontWeight: 800 }}
              >
                <Plus size={18} /> Register Gate Visitor
              </button>
            </>
          )}

          <button
            onClick={exportCsv}
            className="btn btn-secondary"
            style={{ minHeight: '44px', gap: '6px' }}
            title="Export visitor logs to CSV"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Gate Desk Status Bar for Guards (Wake Lock indicator) */}
      {isGuard && (
        <div style={{
          backgroundColor: 'var(--bg-dark-input, rgba(240, 249, 255, 0.6))',
          borderRadius: '16px',
          border: '1px solid var(--border-glass, rgba(0,0,0,0.06))',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="pulse-dot" style={{ backgroundColor: 'var(--color-success, #10b981)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main, #0c1e33)' }}>
              Gate 1 Terminal Active
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
              Society SOC-101 • STOMP Real-time Stream Connected
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
            {guardWakeLockActive ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-success, #10b981)', fontWeight: 700 }}>
                <Lock size={14} /> Screen Wake Lock: ON (Screen will not dim)
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Unlock size={14} /> Screen Wake Lock: Inactive
              </span>
            )}
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '16px 24px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['All', 'PENDING', 'Inside', 'Checked Out'].map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`btn btn-sm ${statusFilter === tab ? 'btn-primary' : 'btn-secondary'}`}
              style={{ minHeight: '38px', borderRadius: '14px', fontWeight: 700 }}
            >
              {tab === 'All' ? `All Logs (${filteredVisitors.length})` :
               tab === 'PENDING' ? 'Pending Approval' :
               tab === 'Inside' ? 'Currently Inside' : 'Checked Out'}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #64748b)' }} />
          <input
            type="text"
            placeholder="Search visitor name or flat..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '36px', width: '100%', minHeight: '40px', borderRadius: '16px' }}
          />
        </div>
      </div>

      {/* Registry Table Card */}
      <div className="glass-card">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th># Log</th>
                <th>Visitor Name & Phone</th>
                <th>Destination</th>
                <th>Purpose</th>
                <th>Vehicle</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisitors.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted, #64748b)' }}>
                    No visitor logs found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredVisitors.map((reg, idx) => {
                  const isPending = reg.status === 'PENDING';
                  const isNoResponse = reg.status === 'VISITOR_NO_RESPONSE';

                  return (
                    <tr key={reg.id} style={{ backgroundColor: isNoResponse ? 'rgba(245, 158, 11, 0.08)' : undefined }}>
                      <td>{idx + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img
                            src={reg.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                            alt=""
                            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ fontWeight: 800, color: 'var(--text-main, #0c1e33)' }}>{reg.person_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Phone size={11} /> {reg.phone || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-info">Flat {reg.flat}</span>
                      </td>
                      <td style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.85rem' }}>{reg.purpose}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>{reg.vehicle || '-'}</td>
                      <td style={{ fontSize: '0.8rem' }}>{reg.in_time}</td>
                      <td style={{ fontSize: '0.8rem', color: reg.out_time === '-' ? 'var(--color-warning, #f59e0b)' : 'var(--text-muted, #64748b)' }}>
                        {reg.out_time}
                      </td>
                      <td>
                        <span className={`badge ${
                          reg.status === 'Inside' ? 'badge-warning' :
                          reg.status === 'Checked Out' ? 'badge-success' :
                          reg.status === 'APPROVED' ? 'badge-success' :
                          reg.status === 'REJECTED' ? 'badge-danger' :
                          reg.status === 'VISITOR_NO_RESPONSE' ? 'badge-danger' : 'badge-primary'
                        }`}>
                          {reg.status === 'VISITOR_NO_RESPONSE' ? 'No Response (120s)' : reg.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => { setSelectedVisitor(reg); setShowAuditModal(true); }}
                            className="btn btn-secondary btn-sm"
                            style={{ gap: '4px', minHeight: '36px' }}
                            title="View security audit details"
                          >
                            <Eye size={14} /> Audit
                          </button>

                          {/* Fallback for Guard on VISITOR_NO_RESPONSE (Call Resident direct tel:) */}
                          {isNoResponse && isGuard && (
                            <a
                              href={`tel:${reg.phone || '9876543210'}`}
                              className="btn btn-danger btn-sm"
                              style={{ gap: '4px', minHeight: '36px', textDecoration: 'none' }}
                            >
                              <PhoneCall size={14} /> Call Flat
                            </a>
                          )}

                          {reg.status === 'Inside' && isGuard && (
                            <button
                              onClick={() => handleCheckout(reg.id)}
                              className="btn btn-sm"
                              style={{
                                gap: '4px',
                                minHeight: '36px',
                                background: 'rgba(245, 158, 11, 0.12)',
                                color: 'var(--color-warning, #f59e0b)',
                                border: '1px solid rgba(245, 158, 11, 0.35)'
                              }}
                            >
                              <LogOut size={14} /> Check Out
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Register New Visitor Form */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={20} style={{ color: 'var(--color-primary, #0284c7)' }} />
                Gate Check-In Visitor Form
              </h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Visitor Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Suresh Kumar"
                  value={newVisitor.visitorName}
                  onChange={e => setNewVisitor({ ...newVisitor, visitorName: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="10-digit mobile number"
                    value={newVisitor.visitorPhone}
                    onChange={e => setNewVisitor({ ...newVisitor, visitorPhone: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Vehicle Number</label>
                  <input
                    type="text"
                    placeholder="e.g. MH-02-CD-5678"
                    value={newVisitor.vehicleNumber}
                    onChange={e => setNewVisitor({ ...newVisitor, vehicleNumber: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Visiting Flat Unit</label>
                  <select
                    value={newVisitor.flatNumber}
                    onChange={e => setNewVisitor({ ...newVisitor, flatNumber: e.target.value })}
                    className="form-select"
                  >
                    {data.members.map(m => (
                      <option key={m.id} value={m.flat}>{m.flat} — {m.username}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Purpose of Entry</label>
                  <select
                    value={newVisitor.purpose}
                    onChange={e => setNewVisitor({ ...newVisitor, purpose: e.target.value })}
                    className="form-select"
                  >
                    <option value="Personal Guest">Personal Guest / Relative</option>
                    <option value="Food Delivery">Food Delivery (Swiggy/Zomato)</option>
                    <option value="Parcel Delivery">Parcel Delivery (Amazon)</option>
                    <option value="Cab Driver">Cab Pickup / Drop</option>
                    <option value="Maintenance Service">Technician / Maintenance</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ minHeight: '48px', borderRadius: '16px', fontWeight: 800 }}>
                Check-In & Dispatch Live Alert
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Visitor Audit Dossier */}
      {showAuditModal && selectedVisitor && (
        <div className="modal-overlay" onClick={() => setShowAuditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={22} style={{ color: 'var(--color-primary, #0284c7)' }} />
                  Security Audit Dossier
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
                  Log Record ID: #GS-AUDIT-{String(selectedVisitor.id).padStart(4, '0')}
                </span>
              </div>
              <button className="modal-close" onClick={() => setShowAuditModal(false)}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', borderRadius: '16px', background: 'var(--bg-dark-input, rgba(240, 249, 255, 0.6))' }}>
                <img
                  src={selectedVisitor.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                  alt=""
                  style={{ width: '56px', height: '56px', borderRadius: '16px', objectFit: 'cover' }}
                />
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>{selectedVisitor.person_name}</h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
                    Phone: {selectedVisitor.phone || 'N/A'} • Vehicle: {selectedVisitor.vehicle || 'None'}
                  </div>
                  <span className="badge badge-info" style={{ marginTop: '6px' }}>Destination: Flat {selectedVisitor.flat}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--border-glass, rgba(0,0,0,0.08))' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)', fontWeight: 700 }}>CHECK-IN TIME</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '2px' }}>{selectedVisitor.in_time}</div>
                </div>
                <div style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--border-glass, rgba(0,0,0,0.08))' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)', fontWeight: 700 }}>CHECK-OUT TIME</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '2px' }}>{selectedVisitor.out_time}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={() => setShowAuditModal(false)} className="btn btn-secondary">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Approved Pass Modal */}
      <PreApprovedPassModal
        isOpen={showPassModal}
        onClose={() => setShowPassModal(false)}
      />

      {/* Guard Pass Scanner Modal */}
      <PassScannerModal
        isOpen={showScanModal}
        onClose={() => setShowScanModal(false)}
        onPassVerified={() => loadHistory()}
      />

      {/* Guard 1-Tap Quick Delivery Modal */}
      <GuardQuickDeliveryModal
        isOpen={showQuickDeliveryModal}
        onClose={() => setShowQuickDeliveryModal(false)}
        flats={data.members}
        onQuickEntryDone={() => loadHistory()}
      />

    </div>
  );
};
