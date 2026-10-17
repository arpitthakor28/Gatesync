import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Users,
  Receipt,
  UserCheck,
  FileDown,
  HardDriveDownload,
  Sparkles,
  QrCode
} from 'lucide-react';

export const GateSyncDownloadsView = () => {
  const { data, userRole, currentUser } = useApp();
  const [downloadedItem, setDownloadedItem] = useState(null);

  const triggerDownload = (filename, content, type = 'text/csv;charset=utf-8;') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadedItem(filename);
    setTimeout(() => setDownloadedItem(null), 4000);
  };

  const handleExportVisitorLogs = () => {
    const myFlat = currentUser?.flat || 'A-101';
    const logsToExport = data.registry.filter(r => userRole === 'admin' || userRole === 'staff' || r.flat === myFlat);
    
    const headers = ['Log_ID', 'Visitor_Name', 'Phone', 'Visiting_Flat', 'Purpose', 'Check_In_Time', 'Check_Out_Time', 'Status'];
    const rows = logsToExport.map(r => [
      r.id,
      `"${(r.person_name || '').replace(/"/g, '""')}"`,
      `"${(r.phone || 'N/A').replace(/"/g, '""')}"`,
      `"${(r.flat || '').replace(/"/g, '""')}"`,
      `"${(r.purpose || '').replace(/"/g, '""')}"`,
      `"${(r.in_time || '').replace(/"/g, '""')}"`,
      `"${(r.out_time || '').replace(/"/g, '""')}"`,
      `"${(r.status || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    triggerDownload('gatesync_visitor_logs.csv', csvContent);
  };

  const handleExportBillingReport = () => {
    const headers = ['Bill_ID', 'Resident_Name', 'Flat', 'Month', 'Maintenance_Amount', 'Due_Date', 'Payment_Status'];
    const rows = data.billing.map(b => [
      b.id,
      `"${(b.member_name || '').replace(/"/g, '""')}"`,
      `"${(b.flat || '').replace(/"/g, '""')}"`,
      `"${(b.month || '').replace(/"/g, '""')}"`,
      b.amount,
      `"${(b.due_date || '').replace(/"/g, '""')}"`,
      b.status === 1 ? 'Paid' : 'Unpaid'
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    triggerDownload('gatesync_maintenance_billing_report.csv', csvContent);
  };

  const handleExportMembersDirectory = () => {
    const headers = ['Member_ID', 'Name', 'Flat', 'Wing', 'Role', 'Mobile', 'Email'];
    const rows = data.members.map(m => [
      m.id,
      `"${(m.username || '').replace(/"/g, '""')}"`,
      `"${(m.flat || '').replace(/"/g, '""')}"`,
      `"${(m.wing || '').replace(/"/g, '""')}"`,
      `"${(m.role || '').replace(/"/g, '""')}"`,
      `"${(m.phone || '').replace(/"/g, '""')}"`,
      `"${(m.email || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    triggerDownload('gatesync_resident_directory.csv', csvContent);
  };

  const handleDownloadGuardApp = () => {
    const appManifest = JSON.stringify({
      appName: "GateSync Security Guard Desk",
      version: "2.4.0-release",
      buildNumber: "10948",
      platform: "Android APK & Desktop Suite",
      license: "GateSync Enterprise License",
      features: [
        "OTP Gate Check-in",
        "License Plate Scanner",
        "Live Resident Approval Push",
        "Offline Registry Sync"
      ],
      downloadTimestamp: new Date().toISOString()
    }, null, 2);

    triggerDownload('gatesync_security_guard_app_v2.4.apk.json', appManifest, 'application/json');
  };

  const handleDownloadProjectReportPDF = () => {
    const base = import.meta.env.BASE_URL || '/';
    const cleanBase = base.endsWith('/') ? base : base + '/';
    const pdfUrl = `${cleanBase}GateSync_Project_Report.pdf`;

    const link = document.createElement('a');
    link.href = pdfUrl;
    link.setAttribute('download', 'GATESYNC_PPSU_Final_Hard_Bound_Project_Report.pdf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadedItem('GateSync_Project_Report.pdf (55 Pages)');
    setTimeout(() => setDownloadedItem(null), 4000);
  };

  const handleDownloadProjectReportDocx = () => {
    const base = import.meta.env.BASE_URL || '/';
    const cleanBase = base.endsWith('/') ? base : base + '/';
    const docxUrl = `${cleanBase}GATESYNC_PPSU_Final_Hard_Bound_Project_Report.docx`;

    const link = document.createElement('a');
    link.href = docxUrl;
    link.setAttribute('download', 'GATESYNC_PPSU_Final_Hard_Bound_Project_Report.docx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadedItem('GATESYNC_PPSU_Final_Hard_Bound_Project_Report.docx');
    setTimeout(() => setDownloadedItem(null), 4000);
  };

  const handleDownloadProjectPosterPDF = () => {
    const base = import.meta.env.BASE_URL || '/';
    const cleanBase = base.endsWith('/') ? base : base + '/';
    const posterUrl = `${cleanBase}GATESYNC_Project_Poster_A2_1Page.pdf`;

    const link = document.createElement('a');
    link.href = posterUrl;
    link.setAttribute('download', 'GATESYNC_Project_Poster_A2_1Page.pdf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadedItem('GATESYNC_Project_Poster_A2_1Page.pdf');
    setTimeout(() => setDownloadedItem(null), 4000);
  };

  const handleDownloadRulesDoc = () => {
    const textContent = `==========================================================
GATESYNC HOUSING SOCIETY GATE SECURITY & RESIDENT RULES
==========================================================
Issued: 2026-09-27 | System: GateSync M3 Suite

1. GATE VISITORS & DELIVERIES:
   - All external visitors (Swiggy, Zomato, Amazon, Guests) must present OTP or flat confirmation at Gate Desk.
   - Unverified entries will require instant Resident Approval via the GateSync Portal.

2. PARKING & SPEED LIMITS:
   - Vehicle speed limit inside society campus: 10 km/h.
   - Visitor vehicles must park in designated Guest Bay (Slots P1 - P12).

3. MAINTENANCE BILLING DUES:
   - Maintenance bills are issued on the 1st of every month.
   - Late payments after the 10th attract a nominal 2% delay surcharge.

4. EMERGENCY NUMBERS:
   - Security Main Gate Desk: Intercom 001 / +91 98765 00001
   - Society Office Secretary: Intercom 100 / +91 98765 00002
==========================================================
`;
    triggerDownload('gatesync_society_bylaws_and_rules.txt', textContent, 'text/plain');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(224, 242, 254, 0.5) 100%)',
        borderRadius: '24px',
        padding: '32px',
        border: '1px solid var(--border-glass)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ zIndex: 2, maxWidth: '640px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '20px',
            background: 'var(--m3-primary-container)',
            color: '#ffffff',
            fontSize: '0.78rem',
            fontWeight: 800,
            marginBottom: '14px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <Sparkles size={14} /> Official Download Section
          </div>
          <h2 style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '10px', letterSpacing: '-0.02em' }}>
            GateSync Downloads Hub
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Export society data spreadsheets, download the GateSync Security Desk Guard App, and fetch official financial summaries and bylaws.
          </p>
        </div>

        <div style={{
          width: '90px',
          height: '90px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, var(--m3-primary) 0%, #651fff 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(124, 77, 255, 0.35)'
        }}>
          <HardDriveDownload size={44} />
        </div>
      </div>

      {/* Success Alert Toast */}
      {downloadedItem && (
        <div style={{
          padding: '16px 20px',
          borderRadius: '16px',
          backgroundColor: 'var(--m3-sys-color-surface-container-high)',
          border: '1px solid var(--m3-tertiary)',
          color: 'var(--m3-tertiary)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: 700,
          fontSize: '0.9rem',
          animation: 'fadeIn 0.3s ease'
        }}>
          <CheckCircle2 size={20} />
          Successfully pushed <strong>{downloadedItem}</strong> to your computer downloads folder!
        </div>
      )}

      {/* Primary Download Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Project Report PDF Download Card */}
        <div className="glass-card" style={{
          display: 'flex',
          flexDirection: 'column',
          justify: 'space-between',
          gap: '20px',
          padding: '24px',
          border: '1px solid var(--border-glass)',
          background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.88) 0%, rgba(240, 249, 255, 0.75) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                backgroundColor: 'rgba(14, 165, 233, 0.16)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(14, 165, 233, 0.2)'
              }}>
                <FileText size={24} />
              </div>
              <span className="badge badge-primary" style={{ padding: '4px 12px', fontSize: '0.8rem', background: '#0284c7', color: '#ffffff' }}>
                PPSU NAAC A+ Format
              </span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '6px', color: 'var(--text-main)' }}>
              Final Hard-Bound Project Report
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '8px', background: 'rgba(2, 132, 199, 0.12)', color: '#0369a1' }}>
                Arpitsinh Thakor • 23SE02IE040
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', color: '#047857' }}>
                AY 2026-2027
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.12)', color: '#4338ca' }}>
                55 Pages — All 15 Chapters
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Official P P Savani University School of Engineering Hard-Bound Project Report in Cambria 12pt justified font, with university logos, sequence diagrams, live screenshots, and QA test matrices.
            </p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={handleDownloadProjectReportPDF} className="btn btn-primary" style={{ width: '100%', gap: '10px', fontWeight: 800 }}>
              <FileDown size={18} /> Download Final Report PDF — 55 Pages
            </button>
            <button onClick={handleDownloadProjectPosterPDF} className="btn btn-secondary btn-sm" style={{ width: '100%', gap: '8px', fontSize: '0.82rem', background: '#fef2f2', color: '#991b1b', borderColor: '#fecdd3', fontWeight: 700 }}>
              <FileDown size={14} /> Download Official Project Poster A2 PDF
            </button>
            <button onClick={handleDownloadProjectReportDocx} className="btn btn-secondary btn-sm" style={{ width: '100%', gap: '8px', fontSize: '0.8rem' }}>
              <Download size={14} /> Download Word Format .docx
            </button>
          </div>
        </div>
        
        {/* Visitor Logs CSV Export */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px', padding: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                backgroundColor: 'rgba(124, 77, 255, 0.15)',
                color: 'var(--m3-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <UserCheck size={24} />
              </div>
              <span className="badge badge-primary">CSV Export</span>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>
              GateSync Visitor Logs
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Export complete security check-in & check-out records, timestamps, phone numbers, and visiting flat numbers.
            </p>
          </div>
          
          <button onClick={handleExportVisitorLogs} className="btn btn-primary" style={{ width: '100%', gap: '10px' }}>
            <FileSpreadsheet size={18} /> Download Visitor CSV
          </button>
        </div>

        {/* Maintenance Billing CSV Export */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px', padding: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                backgroundColor: 'rgba(76, 175, 80, 0.15)',
                color: '#4caf50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Receipt size={24} />
              </div>
              <span className="badge badge-success">Financial Report</span>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>
              Maintenance Billing Report
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Download monthly maintenance ledger, payment statuses (Paid / Unpaid), due dates, and collection balances.
            </p>
          </div>
          
          <button onClick={handleExportBillingReport} className="btn btn-primary" style={{ width: '100%', gap: '10px' }}>
            <FileDown size={18} /> Download Billing CSV
          </button>
        </div>

        {/* Resident Directory CSV Export */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px', padding: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                backgroundColor: 'rgba(33, 150, 243, 0.15)',
                color: '#2196f3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Users size={24} />
              </div>
              <span className="badge badge-info">Directory</span>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>
              Resident Directory Sheet
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Download society roster with wing designations, flat numbers, contact details, and user permissions.
            </p>
          </div>
          
          <button onClick={handleExportMembersDirectory} className="btn btn-primary" style={{ width: '100%', gap: '10px' }}>
            <Download size={18} /> Download Roster CSV
          </button>
        </div>

        {/* GateSync Guard APK Download */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px', padding: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                backgroundColor: 'rgba(255, 152, 0, 0.15)',
                color: '#ff9800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Smartphone size={24} />
              </div>
              <span className="badge badge-warning">Mobile Guard App</span>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>
              GateSync Mobile Security APK
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Download the standalone GateSync Security Guard App v2.4 for gate tablet check-ins and license plate reading.
            </p>
          </div>
          
          <button onClick={handleDownloadGuardApp} className="btn btn-secondary" style={{ width: '100%', gap: '10px' }}>
            <HardDriveDownload size={18} /> Download GateSync APK
          </button>
        </div>

        {/* Society Rules & Emergency Contacts PDF/TXT */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px', padding: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                backgroundColor: 'rgba(233, 30, 99, 0.15)',
                color: '#e91e63',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShieldCheck size={24} />
              </div>
              <span className="badge badge-primary">Official Doc</span>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>
              GateSync Society Bylaws
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Download official society gate security protocols, emergency intercom codes, and maintenance penalty terms.
            </p>
          </div>
          
          <button onClick={handleDownloadRulesDoc} className="btn btn-secondary" style={{ width: '100%', gap: '10px' }}>
            <FileText size={18} /> Download Bylaws Doc
          </button>
        </div>

      </div>

    </div>
  );
};
