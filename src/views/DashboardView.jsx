import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  UserCog,
  IndianRupee,
  FileText,
  UserCheck,
  Bell,
  ArrowUpRight,
  TrendingUp,
  ShieldAlert,
  Calendar,
  Wrench,
  Home,
  CheckCircle2,
  Clock,
  Shield,
  Sparkles,
  Activity,
  ArrowDownRight
} from 'lucide-react';

export const DashboardView = () => {
  const { data, userRole, setActiveTab, currentUser } = useApp();

  // Metrics
  const totalMembers = data.members.length;
  const totalStaff = data.staff.length;
  const societyFund = data.billing.reduce((acc, curr) => acc + (curr.amount_payed || 0), 0);
  const unpaidBillsCountAll = data.billing.filter(b => b.status === 0).length;

  const myFlat = currentUser?.flat || 'A-101';
  const myBills = data.billing.filter(b => b.member_id === currentUser?.id || b.flat === myFlat);
  const myPendingBills = myBills.filter(b => b.status === 0);
  const myTotalDueAmount = myPendingBills.reduce((acc, curr) => acc + curr.total_amount, 0);
  const myVisitors = data.registry.filter(r => r.flat === myFlat);
  const myActiveVisitors = myVisitors.filter(r => r.status === 'Inside');

  const activeVisitorsAll = data.registry.filter(r => r.status === 'Inside').length;
  const todayEntriesCount = data.registry.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Welcome Banner */}
      <div className="glass-card" style={{
        background: userRole === 'admin' 
          ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, rgba(2, 132, 199, 0.1) 50%, rgba(224, 242, 254, 0.5) 100%)'
          : userRole === 'staff'
          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)'
          : 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
        border: `1px solid ${userRole === 'admin' ? 'rgba(14, 165, 233, 0.4)' : userRole === 'staff' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        padding: '32px'
      }}>
        <div>
          <span className={`badge ${userRole === 'admin' ? 'badge-primary' : userRole === 'staff' ? 'badge-warning' : 'badge-success'}`} style={{ marginBottom: '10px' }}>
            <Sparkles size={12} />
            {userRole === 'admin' ? 'Management Command Center' : userRole === 'staff' ? 'Gate Security Desk' : `Resident Suite — Unit ${myFlat}`}
          </span>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 900, marginTop: '4px', letterSpacing: '-0.03em' }}>
            Welcome back, {currentUser?.username || 'User'}! 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '6px', maxWidth: '650px' }}>
            {userRole === 'admin' && 'System overview active. Full administration rights enabled for billing, security gate desks, and GateSync members.'}
            {userRole === 'member' && `Private resident view for Unit ${myFlat}. Access your maintenance invoices, pre-approve gate visitors, and book home services.`}
            {userRole === 'staff' && 'Gate desk security mode active. Live gate visitor entrance logging and resident confirmation stream.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '14px' }}>
          {userRole === 'admin' && (
            <button onClick={() => setActiveTab('billing')} className="btn btn-primary" style={{ padding: '12px 24px' }}>
              <FileText size={18} /> Issue Maintenance Bill
            </button>
          )}
          {userRole === 'member' && (
            <button onClick={() => setActiveTab('billing')} className="btn btn-success" style={{ padding: '12px 24px' }}>
              <IndianRupee size={18} /> Pay Dues Online
            </button>
          )}
          {userRole === 'staff' && (
            <button onClick={() => setActiveTab('registry')} className="btn btn-warning" style={{ padding: '12px 24px' }}>
              <UserCheck size={18} /> Check-In Gate Visitor
            </button>
          )}
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      {userRole === 'admin' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
          
          <div className="glass-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('members')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ width: '54px', height: '54px', borderRadius: '16px', background: 'rgba(99, 102, 241, 0.18)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={28} />
              </div>
              <span className="badge badge-success"><TrendingUp size={12} /> +100% Occupancy</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total Residents</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '4px' }}>{totalMembers}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>11 Units Occupied</div>
          </div>

          <div className="glass-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('staff')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ width: '54px', height: '54px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.18)', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCog size={28} />
              </div>
              <span className="badge badge-primary">Active Duty</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Active Staff</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '4px' }}>{totalStaff}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>Security & Technicians</div>
          </div>

          <div className="glass-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('billing')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ width: '54px', height: '54px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.18)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IndianRupee size={28} />
              </div>
              <span className="badge badge-success"><TrendingUp size={12} /> +14.2% MoM</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>GateSync Fund</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--color-success)', marginTop: '4px' }}>₹{societyFund.toLocaleString()}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>Total Collections Paid</div>
          </div>

          <div className="glass-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('billing')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ width: '54px', height: '54px', borderRadius: '16px', background: 'rgba(244, 63, 94, 0.18)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={28} />
              </div>
              <span className="badge badge-danger">Requires Action</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Unpaid Bills</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--color-danger)', marginTop: '4px' }}>{unpaidBillsCountAll}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-danger)', marginTop: '4px' }}>Collection Overdue</div>
          </div>

        </div>
      )}

      {userRole === 'member' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ width: '54px', height: '54px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.18)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Home size={28} />
              </div>
              <span className="badge badge-success">Verified Resident</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>My Registered Unit</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--color-success)', marginTop: '4px' }}>{myFlat}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>Green Valley Housing</div>
          </div>

          <div className="glass-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('billing')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ width: '54px', height: '54px', borderRadius: '16px', background: myPendingBills.length > 0 ? 'rgba(244, 63, 94, 0.18)' : 'rgba(16, 185, 129, 0.18)', color: myPendingBills.length > 0 ? 'var(--color-danger)' : 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IndianRupee size={28} />
              </div>
              <span className={`badge ${myPendingBills.length > 0 ? 'badge-danger' : 'badge-success'}`}>
                {myPendingBills.length > 0 ? 'Payment Due' : 'All Clear'}
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>My Outstanding Balance</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: myPendingBills.length > 0 ? 'var(--color-danger)' : 'var(--color-success)', marginTop: '4px' }}>
              ₹{myTotalDueAmount.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              {myPendingBills.length > 0 ? `${myPendingBills.length} Bill Outstanding` : 'No Maintenance Dues'}
            </div>
          </div>

          <div className="glass-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('registry')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ width: '54px', height: '54px', borderRadius: '16px', background: 'rgba(99, 102, 241, 0.18)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={28} />
              </div>
              <span className="badge badge-primary">{myActiveVisitors.length} Inside Now</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>My Unit Visitors</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '4px' }}>{myVisitors.length}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>Total Gate Logs</div>
          </div>
        </div>
      )}

      {/* Graphical Analytics Charts (Admin Mode) */}
      {userRole === 'admin' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          
          {/* Monthly Collections Area Trend Graph (SVG Visual) */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={20} style={{ color: 'var(--color-primary)' }} /> Financial Collections Trend
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Monthly maintenance revenue trajectory (INR)</p>
              </div>
              <span className="badge badge-success">+18.5% Growth</span>
            </div>

            {/* SVG Visual Chart */}
            <div style={{ height: '180px', width: '100%', position: 'relative' }}>
              <svg viewBox="0 0 500 150" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,130 Q70,90 140,110 T280,40 T420,60 T500,20 L500,150 L0,150 Z"
                  fill="url(#chartGrad)"
                />
                <path
                  d="M0,130 Q70,90 140,110 T280,40 T420,60 T500,20"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <circle cx="280" cy="40" r="6" fill="#8b5cf6" stroke="#ffffff" strokeWidth="2" />
                <circle cx="500" cy="20" r="6" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
              </svg>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', pt: '10px', marginTop: '10px', borderTop: '1px solid var(--border-glass)' }}>
              <span>May</span>
              <span>Jun</span>
              <span>Jul</span>
              <span>Aug</span>
              <span>Sep (Current)</span>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '16px' }}>Quick Control Desk</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={() => setActiveTab('billing')} className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '12px 16px' }}>
                  <FileText size={18} style={{ color: 'var(--color-primary)' }} /> Issue Monthly Utility Bill
                </button>
                <button onClick={() => setActiveTab('announcements')} className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '12px 16px' }}>
                  <Bell size={18} style={{ color: 'var(--color-warning)' }} /> Broadcast Urgent Notice
                </button>
                <button onClick={() => setActiveTab('members')} className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '12px 16px' }}>
                  <Users size={18} style={{ color: 'var(--color-success)' }} /> Register New Resident
                </button>
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '16px' }}>
              Administrator Privileges Enabled
            </div>
          </div>

        </div>
      )}

      {/* Main Grid: Gate Visitors Stream + Notices */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Gate Visitor Registry Table */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserCheck size={22} style={{ color: 'var(--color-primary)' }} />
                {userRole === 'member' ? `Visitors for Unit ${myFlat}` : 'Live Security Gate Stream'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {userRole === 'member' ? 'Security gate log for your flat entrance only' : 'Real-time entrance & exit security log'}
              </p>
            </div>
            <button onClick={() => setActiveTab('registry')} className="btn btn-secondary btn-sm">
              Full Log <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Visitor Name</th>
                  <th>Destination Unit</th>
                  <th>Purpose</th>
                  <th>Check In Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(userRole === 'member' ? myVisitors : data.registry).slice(0, 5).map((reg, idx) => (
                  <tr key={reg.id}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 700 }}>{reg.person_name}</td>
                    <td><span className="badge badge-info">{reg.flat}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{reg.purpose}</td>
                    <td style={{ fontSize: '0.8rem' }}>{reg.in_time}</td>
                    <td>
                      <span className={`badge ${reg.status === 'Inside' ? 'badge-warning' : 'badge-success'}`}>
                        {reg.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notice Board Widget */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={20} style={{ color: 'var(--color-warning)' }} /> Notice Board
            </h3>
            <button onClick={() => setActiveTab('announcements')} className="btn btn-secondary btn-sm">
              All Notices
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.announcements.filter(a => a.announcement_status === 1).slice(0, 3).map(ann => (
              <div key={ann.announcement_id} style={{
                padding: '16px',
                borderRadius: '14px',
                background: 'var(--bg-dark-input)',
                border: '1px solid var(--border-glass)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className={`badge ${ann.category === 'Urgent' ? 'badge-danger' : ann.category === 'Event' ? 'badge-success' : 'badge-info'}`}>
                    {ann.category || 'General'}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{ann.created_at}</span>
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                  {ann.announcement_subject}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  {ann.announcement_text.length > 80 ? `${ann.announcement_text.substring(0, 80)}...` : ann.announcement_text}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
