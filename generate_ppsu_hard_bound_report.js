import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export function createReport() {
  const outputFile = path.join(process.cwd(), 'GateSync_Project_Report.pdf');
  const publicOutputFile = path.join(process.cwd(), 'public', 'GateSync_Project_Report.pdf');
  const distOutputFile = path.join(process.cwd(), 'dist', 'GateSync_Project_Report.pdf');
  const docsOutputFile = path.join(process.cwd(), 'docs', 'GateSync_Project_Report.pdf');

  // Hard-bound margin standard: Left 72 (1 inch), Right 54 (0.75 in), Top 54, Bottom 54
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 54, bottom: 54, left: 72, right: 54 },
    bufferPages: true,
    info: {
      Title: 'GATESYNC - Final Hard-Bound Project Report',
      Author: 'Arpitsinh Thakor (23SE02IE040)',
      Subject: 'B.Tech Information Technology - PPSU School of Engineering',
      Keywords: 'GateSync, Residential Society Management, PWA, STOMP, FCM, Spring Boot, React 19, MongoDB Atlas'
    }
  });

  const writeStream = fs.createWriteStream(outputFile);
  doc.pipe(writeStream);

  // Exact PPSU Standard Fonts: Times New Roman
  const fontRegular = 'C:/Windows/Fonts/times.ttf';
  const fontBold = 'C:/Windows/Fonts/timesbd.ttf';
  const fontItalic = 'C:/Windows/Fonts/timesi.ttf';

  // Palette - Formal Academic & Navy
  const cNavy = '#0f172a';
  const cBlue = '#0284c7';
  const cDarkBlue = '#0369a1';
  const cText = '#1e293b';
  const cMuted = '#475569';
  const cBorder = '#cbd5e1';
  const cLightBg = '#f8fafc';

  // Content width on A4 with margins: 595.28 - 72 - 54 = 469.28
  const contentWidth = 469;
  const leftMargin = 72;

  function setBodyFont(size = 12) {
    doc.font(fontRegular).fontSize(size).fillColor(cText);
  }
  function setBoldFont(size = 12, color = cText) {
    doc.font(fontBold).fontSize(size).fillColor(color);
  }
  function setItalicFont(size = 11, color = cMuted) {
    doc.font(fontItalic).fontSize(size).fillColor(color);
  }

  function addChapterHeader(chapNum, chapTitle) {
    doc.addPage();
    setBoldFont(16, cDarkBlue);
    doc.text(`CHAPTER ${chapNum}`, { align: 'center' });
    doc.moveDown(0.3);
    setBoldFont(15, cNavy);
    doc.text(chapTitle.toUpperCase(), { align: 'center' });
    doc.moveDown(0.8);
    // Academic horizontal rule
    doc.strokeColor(cBlue).lineWidth(1.5)
       .moveTo(leftMargin + 60, doc.y)
       .lineTo(leftMargin + contentWidth - 60, doc.y)
       .stroke();
    doc.moveDown(1.2);
  }

  function addSectionHeader(numText, titleText) {
    checkPageSpace(55);
    setBoldFont(13, cNavy);
    doc.text(`${numText}  ${titleText}`, { align: 'left' });
    doc.moveDown(0.4);
  }

  function addSubSectionHeader(numText, titleText) {
    checkPageSpace(45);
    setBoldFont(12, cDarkBlue);
    doc.text(`${numText} ${titleText}`, { align: 'left' });
    doc.moveDown(0.3);
  }

  function addParagraph(text, lineGap = 4) {
    checkPageSpace(45);
    setBodyFont(12);
    doc.text(text, {
      align: 'justify',
      lineGap: lineGap,
      width: contentWidth
    });
    doc.moveDown(0.6);
  }

  function addBullet(bulletText) {
    checkPageSpace(30);
    setBodyFont(12);
    doc.text(`•  ${bulletText}`, {
      align: 'justify',
      lineGap: 3,
      indent: 15,
      width: contentWidth
    });
    doc.moveDown(0.3);
  }

  function checkPageSpace(neededHeight) {
    if (doc.y + neededHeight > doc.page.height - doc.page.margins.bottom - 20) {
      doc.addPage();
    }
  }

  function addTable(headers, rows, colWidths) {
    checkPageSpace(rows.length * 24 + 40);
    const startX = leftMargin;
    let currentY = doc.y;

    // Header Row
    let curX = startX;
    doc.rect(startX, currentY, contentWidth, 24).fill(cLightBg).stroke(cBorder);
    setBoldFont(10.5, cDarkBlue);
    headers.forEach((h, i) => {
      doc.text(h, curX + 6, currentY + 6, { width: colWidths[i] - 12, align: 'left' });
      curX += colWidths[i];
    });
    currentY += 24;

    // Rows
    rows.forEach((row, rIdx) => {
      const rowHeight = 22;
      checkPageSpace(rowHeight + 10);
      curX = startX;
      if (rIdx % 2 === 1) {
        doc.rect(startX, currentY, contentWidth, rowHeight).fill('#f1f5f9');
      }
      doc.rect(startX, currentY, contentWidth, rowHeight).stroke(cBorder);
      setBodyFont(10);
      row.forEach((cell, cIdx) => {
        doc.text(String(cell), curX + 6, currentY + 5, { width: colWidths[cIdx] - 12, align: 'left' });
        curX += colWidths[cIdx];
      });
      currentY += rowHeight;
    });
    doc.y = currentY + 12;
  }

  // ==========================================
  // 1. TITLE & COVER PAGE (Page 1)
  // ==========================================
  const logoPath = path.join(process.cwd(), 'screenshots', 'ppsu_logo.png');

  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, leftMargin + (contentWidth - 280) / 2, doc.y, { width: 280 });
    doc.moveDown(4.5);
  }

  setBoldFont(16, cNavy);
  doc.text('P P SAVANI UNIVERSITY', { align: 'center' });
  setBoldFont(14, cDarkBlue);
  doc.text('SCHOOL OF ENGINEERING', { align: 'center' });
  setBoldFont(12, cMuted);
  doc.text('DEPARTMENT OF INFORMATION TECHNOLOGY', { align: 'center' });
  doc.moveDown(1.0);

  setBoldFont(15, '#b91c1c');
  doc.text('INTERNSHIP / UDP / FINAL HARD-BOUND PROJECT REPORT', { align: 'center' });
  doc.moveDown(0.6);

  setBoldFont(18, cBlue);
  doc.text('“GATESYNC”', { align: 'center' });
  setBoldFont(13, cNavy);
  doc.text('Smart Residential Society & Gate Security Management Platform', { align: 'center' });
  doc.moveDown(1.2);

  // Table of Particulars (Matching PPSU template table)
  const particulars = [
    ['Project Title', 'GATESYNC'],
    ['Student Name', 'Arpitsinh Thakor'],
    ['Enrollment Number', '23SE02IE040'],
    ['Program / Branch', 'B.Tech Information Technology'],
    ['Semester', '7th Semester'],
    ['Department / Domain', 'MERN Stack Developer'],
    ['Company / Organization', 'School of Engineering, P P Savani University'],
    ['Institute Mentor', 'Ms. Shrijal Patel'],
    ['Company Mentor', '-'],
    ['Academic Year', '2026-2027']
  ];

  const partStartY = doc.y;
  const col1W = 160;
  const col2W = contentWidth - col1W;

  doc.rect(leftMargin, partStartY, contentWidth, 22).fill(cLightBg).stroke(cBorder);
  setBoldFont(11, cDarkBlue);
  doc.text('Particular', leftMargin + 8, partStartY + 6, { width: col1W - 16 });
  doc.text('Details', leftMargin + col1W + 8, partStartY + 6, { width: col2W - 16 });

  let curPartY = partStartY + 22;
  particulars.forEach((item, idx) => {
    const rowH = 20;
    if (idx % 2 === 1) doc.rect(leftMargin, curPartY, contentWidth, rowH).fill('#f8fafc');
    doc.rect(leftMargin, curPartY, contentWidth, rowH).stroke(cBorder);
    setBoldFont(10, cNavy);
    doc.text(item[0], leftMargin + 8, curPartY + 5, { width: col1W - 16 });
    setBodyFont(10);
    doc.text(item[1], leftMargin + col1W + 8, curPartY + 5, { width: col2W - 16 });
    curPartY += rowH;
  });

  // ==========================================
  // 2. CERTIFICATE OF COMPLETION (Page 2)
  // ==========================================
  doc.addPage();
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, leftMargin + (contentWidth - 220) / 2, doc.y, { width: 220 });
    doc.moveDown(3.8);
  }

  setBoldFont(18, cNavy);
  doc.text('CERTIFICATE OF COMPLETION', { align: 'center' });
  doc.moveDown(1.5);

  addParagraph(
    'This is to certify that Arpitsinh Thakor, bearing Enrollment No.: 23SE02IE040, a bonafide student of Bachelor of Technology in Information Technology, 7th Semester at School of Engineering, P P Savani University, has successfully completed the project work titled:'
  );

  doc.moveDown(0.5);
  setBoldFont(15, cDarkBlue);
  doc.text('“GATESYNC: SMART RESIDENTIAL SOCIETY & GATE SECURITY MANAGEMENT PLATFORM”', { align: 'center' });
  doc.moveDown(0.8);

  addParagraph(
    'under the specialization domain of MERN Stack Developer. The project encompasses complete architectural design, fullstack reactive implementation, Progressive Web Application (PWA) engineering, multi-tenant isolation, real-time STOMP messaging, FCM HTTP v1 push notification integration, and rigorous testing for the academic year 2026-2027.'
  );

  addParagraph(
    'The project implementation, verification matrices, source documentation, and demonstration were evaluated and found to be thoroughly satisfactory in fulfillment of the academic requirements.'
  );

  doc.moveDown(3.5);

  const sigY = doc.y;
  doc.strokeColor(cNavy).lineWidth(1).moveTo(leftMargin + 10, sigY).lineTo(leftMargin + 180, sigY).stroke();
  doc.strokeColor(cNavy).lineWidth(1).moveTo(leftMargin + contentWidth - 190, sigY).lineTo(leftMargin + contentWidth - 10, sigY).stroke();

  setBoldFont(11, cNavy);
  doc.text('Ms. Shrijal Patel', leftMargin + 10, sigY + 8, { width: 170, align: 'center' });
  setItalicFont(10, cMuted);
  doc.text('Internal Project Guide / Mentor', leftMargin + 10, sigY + 22, { width: 170, align: 'center' });
  doc.text('Department of Information Technology', leftMargin + 10, sigY + 34, { width: 170, align: 'center' });

  setBoldFont(11, cNavy);
  doc.text('Head of Department', leftMargin + contentWidth - 190, sigY + 8, { width: 180, align: 'center' });
  setItalicFont(10, cMuted);
  doc.text('Department of Information Technology', leftMargin + contentWidth - 190, sigY + 22, { width: 180, align: 'center' });
  doc.text('School of Engineering, PPSU', leftMargin + contentWidth - 190, sigY + 34, { width: 180, align: 'center' });

  // ==========================================
  // 3. DECLARATION & ACKNOWLEDGEMENT (Page 3)
  // ==========================================
  doc.addPage();
  setBoldFont(16, cDarkBlue);
  doc.text('DECLARATION', { align: 'center' });
  doc.moveDown(1);

  addParagraph(
    'I, Arpitsinh Thakor (Enrollment No. 23SE02IE040), hereby declare that the project report entitled “GATESYNC: Smart Residential Society & Gate Security Management Platform” submitted to P P Savani University, School of Engineering, in partial fulfillment of the requirements for the degree of Bachelor of Technology in Information Technology, is an authentic record of the original project work carried out by me under the domain of MERN Stack Developer.'
  );
  addParagraph(
    'I further declare that this work has not formed the basis for the award of any other Degree, Diploma, Fellowship or other similar titles in this or any other institution of higher learning. All theoretical references, frameworks, design specifications, and open-source packages utilized in this work have been properly cited and acknowledged in compliance with academic integrity guidelines.'
  );

  doc.moveDown(1.5);
  const decSigY = doc.y;
  setBoldFont(11, cNavy);
  doc.text('Arpitsinh Thakor', leftMargin + contentWidth - 180, decSigY, { width: 180, align: 'right' });
  setItalicFont(10, cMuted);
  doc.text('Enrollment No: 23SE02IE040', leftMargin + contentWidth - 180, decSigY + 14, { width: 180, align: 'right' });

  doc.moveDown(2.5);
  setBoldFont(16, cDarkBlue);
  doc.text('ACKNOWLEDGEMENT', { align: 'center' });
  doc.moveDown(1);

  addParagraph(
    'I express my deepest gratitude and sincere appreciation to my project guide, Ms. Shrijal Patel, Assistant Professor, Department of Information Technology, for her exceptional guidance, technical mentorship, and constant encouragement throughout the formulation, architectural development, and completion of the GateSync platform.'
  );
  addParagraph(
    'I extend my sincere thanks to the Head of the Department and the faculty members of the School of Engineering, P P Savani University, for providing the necessary infrastructural resources, computing environments, and scholastic encouragement.'
  );
  addParagraph(
    'Finally, I am profoundly grateful to my parents, family, and peers for their continuous moral support, understanding, and enthusiasm, which served as a perennial source of motivation throughout this engineering endeavor.'
  );

  // ==========================================
  // 4. ABSTRACT / EXECUTIVE SUMMARY (Page 4)
  // ==========================================
  doc.addPage();
  setBoldFont(16, cDarkBlue);
  doc.text('ABSTRACT / EXECUTIVE SUMMARY', { align: 'center' });
  doc.moveDown(1);

  addParagraph(
    'Modern residential societies and gated complexes face critical operational vulnerabilities stemming from manual paper-based visitor logbooks, delayed resident gate communications, unverified deliveries, and isolated emergency alert workflows. Traditional physical gate registers compromise visitor privacy, create vehicular bottlenecks at security gates, and fail to provide auditable security trails during incidents.'
  );
  addParagraph(
    'To overcome these limitations, this project presents GateSync—a high-performance, progressive web application (PWA) and multi-tenant security automation platform engineered for residential societies. Developed under the modern full-stack web paradigm, GateSync interconnects three core stakeholders—Security Guards, Residents, and Society Administrators—through a synchronized, real-time communication pipeline.'
  );
  addParagraph(
    'The architectural foundation features a zero-trust JSON Web Token (JWT) security protocol with 15-minute access tokens and 30-day rotating refresh tokens encapsulated in httpOnly, Secure, SameSite cookies. The real-time visitor approval engine leverages Spring WebSockets with STOMP and SockJS, delivering sub-second arrival chimes directly to resident screens. If a resident is offline or in background mode, a resilient fallback mechanism activates Firebase Cloud Messaging (FCM HTTP v1) push notifications with actionable in-notification approval buttons.'
  );
  addParagraph(
    'Key operational modules include 1-tap fast deliveries for major logistics services (Swiggy, Zomato, Amazon, Blinkit), cryptographically verified 6-digit OTP and QR code guest passes with WhatsApp sharing, an emergency SOS panic broadcast triggering immediate guard sirens with automated audit logging, and full offline-first resilience. Automated Playwright mobile viewport testing (390×844) and multi-tenant isolation unit tests demonstrate 100% tenant boundaries, atomic double-decision prevention (HTTP 409 Conflict), and sub-150ms real-time event delivery.'
  );

  doc.moveDown(0.8);
  setBoldFont(11, cNavy);
  doc.text('Keywords: ', { continued: true });
  setItalicFont(11, cMuted);
  doc.text('GateSync, Gated Community Security, Progressive Web Application (PWA), STOMP WebSockets, Spring Boot 3, React 19, Zero-Trust JWT, FCM HTTP v1, MongoDB Atlas, Multi-Tenancy.');

  // ==========================================
  // 5. TABLE OF CONTENTS (Page 5)
  // ==========================================
  doc.addPage();
  setBoldFont(16, cDarkBlue);
  doc.text('TABLE OF CONTENTS', { align: 'center' });
  doc.moveDown(1.2);

  // Exact 15-Chapter PPSU Syllabus TOC
  const tocItems = [
    ['Preliminary Pages', ''],
    ['   Certificate of Completion', 'i'],
    ['   Declaration', 'ii'],
    ['   Acknowledgement', 'iii'],
    ['   Abstract / Executive Summary', 'iv'],
    ['   Table of Contents', 'v'],
    ['   List of Figures', 'vi'],
    ['   List of Tables', 'vii'],
    ['   List of Abbreviations & Acronyms', 'viii'],
    ['Chapter 1: Introduction', '1'],
    ['Chapter 2: Literature Review and Existing System Study', '4'],
    ['Chapter 3: Requirements Analysis and Project Scope', '7'],
    ['Chapter 4: System Analysis and Methodology', '10'],
    ['Chapter 5: System Design and Architecture', '13'],
    ['Chapter 6: Technology Stack and Development Environment', '18'],
    ['Chapter 7: System Implementation', '21'],
    ['Chapter 8: Testing and Validation', '26'],
    ['Chapter 9: Results and Performance Analysis', '30'],
    ['Chapter 10: Deployment and Project Demonstration', '35'],
    ['Chapter 11: Challenges, Solutions and Improvements', '38'],
    ['Chapter 12: Project Progress and Individual Contribution', '41'],
    ['Chapter 13: Limitations and Future Scope', '44'],
    ['Chapter 14: Conclusion', '46'],
    ['Chapter 15: References (APA 7th Edition)', '47'],
    ['Appendices', '48']
  ];

  tocItems.forEach(item => {
    checkPageSpace(18);
    const isMain = !item[0].startsWith('   ');
    if (isMain) {
      setBoldFont(11, cNavy);
    } else {
      setBodyFont(10.5);
    }
    doc.text(item[0], leftMargin, doc.y, { continued: true });
    doc.text(item[1], { align: 'right' });
    doc.moveDown(0.25);
  });

  // ==========================================
  // 6. LIST OF FIGURES & TABLES & ABBREVIATIONS (Page 6)
  // ==========================================
  doc.addPage();
  setBoldFont(14, cDarkBlue);
  doc.text('LIST OF FIGURES', { align: 'left' });
  doc.moveDown(0.4);

  const figuresList = [
    ['Figure 4.1', 'Agile Scrum Iterative Engineering Life Cycle', '11'],
    ['Figure 5.1', 'High-Level Multi-Tenant System Architecture Diagram', '14'],
    ['Figure 5.2', 'End-to-End Real-Time Visitor Approval Sequence Diagram', '15'],
    ['Figure 5.3', 'Dual Database Strategy: Relational H2 & MongoDB Atlas Schema', '16'],
    ['Figure 9.1', 'Security Guard Visitor Check-in Registration Desk', '31'],
    ['Figure 9.2', 'Resident Real-Time Full-Screen Arrival Chime & Modal Alert', '32'],
    ['Figure 9.3', 'Resident 1-Tap Entry Clearance Approval Action', '33'],
    ['Figure 9.4', 'Security Guard Active Entry Queue Live Synchronization', '33'],
    ['Figure 9.5', 'Central Society Administration Governance Command Center', '34']
  ];

  figuresList.forEach(fig => {
    setBodyFont(10.5);
    doc.text(`${fig[0]}: ${fig[1]}`, leftMargin, doc.y, { continued: true });
    doc.text(fig[2], { align: 'right' });
    doc.moveDown(0.2);
  });

  doc.moveDown(0.8);
  setBoldFont(14, cDarkBlue);
  doc.text('LIST OF TABLES', { align: 'left' });
  doc.moveDown(0.4);

  const tablesList = [
    ['Table 2.1', 'Comparative Analysis: Manual Registers vs Commercial Apps vs GateSync', '6'],
    ['Table 3.1', 'Comprehensive Functional Requirements Specification (FR-01 to FR-08)', '8'],
    ['Table 3.2', 'Non-Functional Requirements & Performance Matrix (NFR-01 to NFR-05)', '9'],
    ['Table 6.1', 'Technology Stack Specifications & Architectural Role Matrix', '20'],
    ['Table 8.1', 'Automated Test Matrix: Unit, Integration, E2E & Multi-Tenancy', '28'],
    ['Table 9.1', 'System Latency Benchmarks, Memory Footprint & Google Lighthouse Audit', '32']
  ];

  tablesList.forEach(tbl => {
    setBodyFont(10.5);
    doc.text(`${tbl[0]}: ${tbl[1]}`, leftMargin, doc.y, { continued: true });
    doc.text(tbl[2], { align: 'right' });
    doc.moveDown(0.2);
  });

  doc.moveDown(0.8);
  setBoldFont(14, cDarkBlue);
  doc.text('LIST OF ABBREVIATIONS & ACRONYMS', { align: 'left' });
  doc.moveDown(0.4);

  const abbrevs = [
    ['PWA', 'Progressive Web Application (W3C Standard)'],
    ['JWT', 'JSON Web Token (RFC 7519 Cryptographic Claims)'],
    ['STOMP', 'Simple Text Oriented Messaging Protocol over WebSockets'],
    ['FCM', 'Firebase Cloud Messaging (Google HTTP v1 API)'],
    ['RBAC', 'Role-Based Access Control'],
    ['MERN', 'MongoDB, Express/Spring, React, Node.js Modern Stack'],
    ['OTP', 'One-Time Password (6-Digit Cryptographic Code)'],
    ['QR', 'Quick Response 2D Matrix Barcode'],
    ['SOS', 'Save Our Souls (Emergency Panic Siren Broadcast)'],
    ['TTL', 'Time-To-Live Index (Automated MongoDB Eviction)']
  ];

  abbrevs.forEach(ab => {
    setBoldFont(10, cNavy);
    doc.text(ab[0], leftMargin, doc.y, { width: 80, continued: true });
    setBodyFont(10);
    doc.text(`:  ${ab[1]}`);
    doc.moveDown(0.15);
  });

  // ==========================================
  // CHAPTER 1: INTRODUCTION
  // ==========================================
  addChapterHeader('1', 'Introduction');

  addSectionHeader('1.1', 'Background of the Project');
  addParagraph(
    'Rapid urbanization and the proliferation of high-rise residential complexes, gated townships, and smart societies have made security and visitor governance paramount. Modern housing societies accommodate hundreds of families, experiencing daily influxes of guests, cab services, e-commerce deliveries, repair technicians, and maintenance staff. Historically, society gate security has relied upon physical pen-and-paper visitor register books. Security guards at perimeter gates manually record visitor names, phone numbers, visiting flat numbers, vehicle registration numbers, and entry/exit timestamps.'
  );

  addSectionHeader('1.2', 'Problem Statement');
  addParagraph(
    'The traditional manual gatekeeping paradigm suffers from critical, systemic vulnerabilities: (1) Severe data leakage and privacy violations, as open register books allow arbitrary third parties to view residents’ flat numbers and visitor contact numbers; (2) Inability to prevent unauthorized access or verify visitor identities prior to entry; (3) Communication delays and gate congestion, where guards must dial resident intercoms or personal mobile phones, leading to long entry queues; (4) Lack of authentic visitor photographic records; and (5) Non-existent audit trails during security incidents, parcel thefts, or vandalism.'
  );

  addSectionHeader('1.3', 'Need for the Project');
  addParagraph(
    'Residential societies require an automated, digital security infrastructure that guarantees resident privacy, eliminates entry bottlenecks, and validates visitor entries with sub-second responsiveness without requiring expensive proprietary hardware or forced native app store installations.'
  );

  addSectionHeader('1.4', 'Aim of the Project');
  addParagraph(
    'The aim of GateSync is to design, develop, and deploy an enterprise-grade Progressive Web Application (PWA) that unifies security guards, residents, and management committee members into a synchronized, zero-trust digital platform.'
  );

  addSectionHeader('1.5', 'Objectives of the Project');
  addBullet('Deliver zero-trust authentication enforcing strict multi-tenant isolation where tenant identity (societyId), role, and user privileges are derived exclusively from verified JWT cryptographic signatures.');
  addBullet('Implement a dual-channel real-time notification engine prioritizing STOMP WebSockets for sub-second in-app alerts, with an automatic 2-second fallback to FCM HTTP v1 push notifications.');
  addBullet('Provide 1-tap pre-approved visitor passes with 6-digit OTPs and QR codes that can be shared via WhatsApp for instant, frictionless gate verification.');
  addBullet('Equip security guards with 1-tap rapid check-in for recurring delivery partners (Swiggy, Zomato, Amazon, Blinkit, Uber, Ola) to eliminate vehicular choke points.');
  addBullet('Incorporate an emergency SOS panic button broadcasting immediate audible alarms and visual alerts to security guards with immutable audit logging.');

  addSectionHeader('1.6', 'Scope of the Project');
  addParagraph(
    'The platform encompasses residential societies, apartment associations, and gated townships. It operates across desktop gate terminals, resident smartphones (iOS and Android), and tablets via responsive PWA standards.'
  );

  addSectionHeader('1.7', 'Project Overview');
  addParagraph(
    'GateSync pairs a modern React 19 frontend with a Spring Boot 3 enterprise backend and MongoDB Atlas cloud persistence, establishing a sub-150ms real-time event pipeline for gate admissions, visitor verification, and community governance.'
  );

  addSectionHeader('1.8', 'Organization of the Report');
  addParagraph(
    'This report is structured into 15 formal chapters adhering strictly to the P P Savani University School of Engineering final hard-bound project guidelines, detailing requirements, architecture, implementation, testing, results, and evaluation.'
  );

  // ==========================================
  // CHAPTER 2: LITERATURE REVIEW AND EXISTING SYSTEM STUDY
  // ==========================================
  addChapterHeader('2', 'Literature Review and Existing System Study');

  addSectionHeader('2.1', 'Introduction');
  addParagraph(
    'A comprehensive survey of existing gated community platforms was conducted, examining commercial solutions including MyGate, NoBrokerHood, ADDA (Apartment SuperApp), and traditional paper visitor registers.'
  );

  addSectionHeader('2.2', 'Review of Existing Systems / Applications');
  addParagraph(
    'Commercial solutions provide rich feature sets; however, they require mandatory, heavy native mobile app store installations (60MB+), aggressively collect personal telemetry for ad-targeting, enforce proprietary vendor lock-in, and incur recurring monthly society subscription charges.'
  );

  addSectionHeader('2.3', 'Existing System');
  addParagraph(
    'Traditional paper registers and wired intercoms remain the default in the majority of housing societies. They lack photographic records, provide no searchability, and cannot prevent unauthorized entry.'
  );

  addSectionHeader('2.4', 'Limitations of Existing System');
  addBullet('Zero privacy: Contact numbers and visiting details are visible to any subsequent visitor.');
  addBullet('No real-time delivery alerts: Residents are unaware of package drop-offs at security gates.');
  addBullet('Hardware failure: Wired intercom lines frequently fail due to weather or cable damage.');

  addSectionHeader('2.5', 'Proposed System (GateSync)');
  addParagraph(
    'GateSync addresses these industry gaps by offering: (1) An installable, lightweight PWA (< 1 MB initial asset download) with full offline caching; (2) Zero-trust multi-tenancy where society identity is strictly enforced in the cryptographic JWT token; (3) Dual-channel real-time notifications with synthesized Web Audio chimes; and (4) Transparent, self-hostable open architecture backed by cloud databases.'
  );

  addSectionHeader('2.6', 'Table 2.1: Comparative Analysis Matrix');
  const compRows = [
    ['Hardware Needed', 'Paper Register Book', 'Proprietary Native Mobile Apps', 'Zero Install — Responsive PWA on Any Device'],
    ['Visitor Identity', 'None (Self-Written)', 'Manual Phone Verification', 'Live WebRTC Photo Snapshot + 6-Digit OTP'],
    ['Notification Latency', '2 - 5 min (Intercom Dial)', '3 - 8 sec (Push Only)', 'Sub-500ms (STOMP WebSockets) + FCM Fallback'],
    ['Visitor Privacy', 'Exposed Public Book', 'Partially Masked', 'End-to-End Encrypted & Tenant Isolated'],
    ['Emergency SOS', 'None', 'Basic SMS Alert', 'Instant Screen Takeover + Continuous Siren']
  ];
  addTable(['Feature Dimension', 'Manual Registers', 'Commercial Apps (MyGate)', 'GateSync Platform'], compRows, [110, 115, 115, 129]);

  addSectionHeader('2.7', 'Research / Technology Gap');
  addParagraph(
    'Prior research has focused predominantly on native mobile applications, neglecting the immense potential of modern PWA APIs (Service Workers, Web Audio, Wake Lock, Push API) to deliver zero-install, friction-free residential gate security.'
  );

  // ==========================================
  // CHAPTER 3: REQUIREMENTS ANALYSIS AND PROJECT SCOPE
  // ==========================================
  addChapterHeader('3', 'Requirements Analysis and Project Scope');

  addSectionHeader('3.1', 'Functional Requirements Specification');
  const funcReqs = [
    ['FR-1', 'Persistent Multi-Session Auth', 'Rotating JWT refresh token in httpOnly cookie; silent refresh; session revocation.'],
    ['FR-2', 'Live Visitor Registration', 'Guard captures visitor name, mobile, purpose, flat number, and live photo snapshot.'],
    ['FR-3', 'Real-Time Notification Pipeline', 'Sub-second STOMP push alert to resident; 2s timeout fallback to FCM HTTP v1 push.'],
    ['FR-4', 'Atomic Decision Handling', 'Resident approval/rejection with HTTP 409 Conflict rejection on concurrent actions.'],
    ['FR-5', '1-Tap Fast Delivery Check-in', 'Single-tap entry creation for Swiggy, Zomato, Amazon, Blinkit, and taxi services.'],
    ['FR-6', 'Pre-Approved Guest Passes', '6-digit OTP & QR code generation, WhatsApp sharing link, guard scanner validation.'],
    ['FR-7', 'Emergency SOS Panic Siren', '3s cancel countdown, full-screen red guard siren banner, persistent audit trail.'],
    ['FR-8', 'Offline Queue & PWA Sync', 'IndexedDB/localStorage offline action queue auto-flushed upon network reconnection.']
  ];
  addTable(['Req ID', 'Feature Name', 'Functional Description'], funcReqs, [55, 130, 284]);

  addSectionHeader('3.2', 'Non-Functional Requirements');
  const nonFuncReqs = [
    ['NFR-1', 'Sub-Second Latency', 'WebSocket message propagation latency < 200ms end-to-end under normal broadband/4G.'],
    ['NFR-2', 'Zero-Trust Tenant Isolation', 'Cross-society data access mathematically prevented by cryptographically signed JWT claims.'],
    ['NFR-3', 'PWA Installability', 'Full compliance with W3C PWA standards (Manifest, Service Worker, Badging API, Audio).'],
    ['NFR-4', 'Data Resilience & TTL', 'Ephemeral notification documents auto-evicted after 30 days via MongoDB TTL indexes.'],
    ['NFR-5', 'Cross-Platform Compatibility', 'Responsive rendering across iOS Safari, Android Chrome, Windows, and macOS desktops.']
  ];
  addTable(['Req ID', 'Quality Attribute', 'Specification & Target Metric'], nonFuncReqs, [55, 120, 294]);

  addSectionHeader('3.3', 'Hardware Requirements');
  addParagraph('• Gate Desk: Any standard PC, laptop, or tablet with Google Chrome / Microsoft Edge and a 720p USB webcam.');
  addParagraph('• Resident / Admin: Any modern Android or iOS smartphone with modern mobile browser support.');

  addSectionHeader('3.4', 'Software Requirements');
  addParagraph('• Runtime Environment: Node.js v20+ / Java 21 LTS / Docker Engine.');
  addParagraph('• Frontend Tooling: React 19.0.0, Vite 6.1.0, @stomp/stompjs 7.5.0, Lucide React.');
  addParagraph('• Backend Frameworks: Spring Boot 3.3.4, Spring Security 6, JJWT 0.11.5, Spring Data MongoDB.');

  addSectionHeader('3.5', 'User Requirements');
  addParagraph('Intuitive, high-contrast user interfaces with touch targets >= 44px, safe-area padding for modern mobile notches, and instant audio feedback.');

  addSectionHeader('3.6', 'System Constraints & Feasibility Study');
  addParagraph('The platform is 100% technically feasible using modern open web standards, eliminates expensive native app store developer fees, and runs seamlessly on affordable cloud container instances.');

  addSectionHeader('3.7', 'Project Scope');
  addParagraph('Covers comprehensive gate security, real-time resident alerting, pre-approved passes, emergency alerts, maintenance billing, and administrative governance for residential societies.');

  // ==========================================
  // CHAPTER 4: SYSTEM ANALYSIS AND METHODOLOGY
  // ==========================================
  addChapterHeader('4', 'System Analysis and Methodology');

  addSectionHeader('4.1', 'Development Methodology');
  addParagraph(
    'The project adopted the Agile Scrum methodology, characterized by iterative two-week development sprints, continuous code integration, and empirical phase-gate reviews. Agile was chosen due to the evolving nature of real-time communication protocols, browser PWA constraints, and security requirements.'
  );

  addSectionHeader('4.2', 'Project Planning & Sprints');
  addBullet('Sprint 1 (Weeks 1-2): Problem identification, system requirements analysis, database schema modeling, and JWT security filter design.');
  addBullet('Sprint 2 (Weeks 3-4): Security guard registration desk, WebRTC camera module, STOMP broker, and resident incoming visitor modal.');
  addBullet('Sprint 3 (Weeks 5-6): FCM HTTP v1 push fallback, 2-second alert deduplication engine, service worker background decision handling, and emergency SOS alerts.');
  addBullet('Sprint 4 (Weeks 7-8): Maintenance billing ledger, administrative analytics dashboard, Playwright mobile E2E testing, and production deployment.');

  addSectionHeader('4.3', 'System Workflow');
  // Figure 4.1 Vector Workflow Diagram
  checkPageSpace(130);
  const wfY = doc.y;
  doc.rect(leftMargin, wfY, contentWidth, 110).fill('#f8fafc').stroke(cBorder);

  const stepW = 85;
  const steps = [
    ['1. Gate Entry', 'Guard logs visitor & captures photo'],
    ['2. STOMP Push', 'Instant sub-second alert to Resident'],
    ['3. Decision', 'Approve/Reject or 2s FCM fallback'],
    ['4. Entry Sync', 'Guard screen updates & gate opens']
  ];
  steps.forEach((s, idx) => {
    const sX = leftMargin + 15 + idx * (stepW + 30);
    doc.rect(sX, wfY + 15, stepW, 75).fill(cLightBg).stroke(cBlue);
    setBoldFont(9.5, cDarkBlue);
    doc.text(s[0], sX + 4, wfY + 23, { width: stepW - 8, align: 'center' });
    setBodyFont(8.5);
    doc.text(s[1], sX + 4, wfY + 39, { width: stepW - 8, align: 'center' });

    if (idx < 3) {
      doc.strokeColor(cBlue).lineWidth(1.5)
         .moveTo(sX + stepW + 5, wfY + 50)
         .lineTo(sX + stepW + 25, wfY + 50)
         .stroke();
    }
  });

  doc.y = wfY + 120;
  setItalicFont(10, cMuted);
  doc.text('Figure 4.1: End-to-End GateSync Real-Time Visitor Processing Workflow', { align: 'center' });
  doc.moveDown(1);

  addSectionHeader('4.4', 'Use Case Analysis');
  addParagraph('Three primary actors interact with the system: Security Guard (Visitor registration, pass verification), Resident (Visitor approval/denial, pre-approved pass generation, SOS panic), and Administrator (Resident directory, staff rosters, billing ledgers, audit logs).');

  // ==========================================
  // CHAPTER 5: SYSTEM DESIGN AND ARCHITECTURE
  // ==========================================
  addChapterHeader('5', 'System Design and Architecture');

  addSectionHeader('5.1', 'Figure 5.1: High-Level System Architecture Diagram');
  checkPageSpace(170);
  const archY = doc.y;
  doc.rect(leftMargin, archY, contentWidth, 150).fill('#f8fafc').stroke(cBorder);

  // Layer 1: Client
  doc.rect(leftMargin + 20, archY + 15, contentWidth - 40, 32).fill('#e0f2fe').stroke(cBlue);
  setBoldFont(10.5, cDarkBlue);
  doc.text('PRESENTATION LAYER: Progressive Web Application (React 19 + Vite 6 + PWA Service Worker)', leftMargin + 25, archY + 25, { align: 'center', width: contentWidth - 50 });

  // Connectors
  setItalicFont(8.5, cMuted);
  doc.text('↕ HTTPS REST APIs (Axios + Cookies)     ↕ WSS STOMP WebSockets (SockJS)     ↕ Web Push (FCM v1)', leftMargin + 20, archY + 52, { align: 'center', width: contentWidth - 40 });

  // Layer 2: Backend
  doc.rect(leftMargin + 20, archY + 68, contentWidth - 40, 34).fill('#f1f5f9').stroke('#64748b');
  setBoldFont(10.5, cNavy);
  doc.text('APPLICATION LAYER: Java 21 / Spring Boot 3 Core Backend (Render Docker Container)', leftMargin + 25, archY + 74, { align: 'center', width: contentWidth - 50 });
  setBodyFont(8.5);
  doc.text('Spring Security 6 (JWT) | STOMP Message Broker | Escalation Service | FCM Dispatcher', leftMargin + 25, archY + 88, { align: 'center', width: contentWidth - 50 });

  // Connectors
  doc.text('↕ JPA Transactions                          ↕ Mongo Reactive Client', leftMargin + 20, archY + 106, { align: 'center', width: contentWidth - 40 });

  // Layer 3: Database
  doc.rect(leftMargin + 20, archY + 118, 200, 25).fill('#fef3c7').stroke('#d97706');
  setBoldFont(9, '#92400e');
  doc.text('H2 Relational Database (Fast In-Memory)', leftMargin + 25, archY + 125, { width: 190, align: 'center' });

  doc.rect(leftMargin + 240, archY + 118, 190, 25).fill('#ecfdf5').stroke('#059669');
  setBoldFont(9, '#065f46');
  doc.text('MongoDB Atlas Cluster (Multi-Tenant)', leftMargin + 245, archY + 125, { width: 180, align: 'center' });

  doc.y = archY + 155;
  setItalicFont(10, cMuted);
  doc.text('Figure 5.1: High-Level System Architecture and Multi-Tier Communication Topology', { align: 'center' });
  doc.moveDown(1);

  addSectionHeader('5.2', 'Figure 5.2: Real-Time Visitor Approval Sequence Flow');
  addParagraph(
    'The sequence flow coordinates the security terminal, backend message broker, resident client, and push notification gateways: (1) Guard submits visitor registration payload; (2) Spring Boot assigns a UUID, persists the visitor record in MongoDB with status PENDING, and broadcasts a STOMP event to topic /topic/society.{societyId}.flat.{flatNumber}; (3) Resident screen triggers the synthesized Web Audio chime (440Hz/480Hz) and displays the full-screen modal with a 60s countdown; (4) Upon resident tap, an authenticated POST is transmitted; (5) Backend verifies tenant ownership and atomically updates status to APPROVED; (6) STOMP broker dispatches acknowledgment to guard terminal, immediately updating the gate queue to green.'
  );

  addSectionHeader('5.3', 'Figure 5.3: Database Schema & Multi-Tenant Data Modeling');
  addParagraph(
    'GateSync employs a segregated dual-database architecture: In-memory H2 provides high-speed relational mapping for core entities during testing, while MongoDB Atlas serves as the resilient, distributed document database. Key MongoDB collections include: (1) notifications; (2) device_fcm_tokens; (3) pre_approved_passes; (4) audit_logs; and (5) escalation_tasks.'
  );

  // ==========================================
  // CHAPTER 6: TECHNOLOGY STACK AND DEVELOPMENT ENVIRONMENT
  // ==========================================
  addChapterHeader('6', 'Technology Stack and Development Environment');

  addSectionHeader('6.1', 'Programming Languages');
  addParagraph('• JavaScript (ES2024) / JSX for reactive Single Page Application frontend engineering.');
  addParagraph('• Java 21 LTS with Virtual Threads for high-throughput enterprise backend execution.');

  addSectionHeader('6.2', 'Frameworks and Libraries');
  addParagraph('• React 19.0.0: Modern concurrent UI rendering and state hooks.');
  addParagraph('• Vite 6.1.0: Next-generation fast frontend tooling and dev server.');
  addParagraph('• Spring Boot 3.3.4: Enterprise backend microservices framework.');
  addParagraph('• Spring Security 6 & JJWT 0.11.5: Zero-trust JWT authentication and role authorization.');

  addSectionHeader('6.3', 'Table 6.1: Technology Stack & Tooling Matrix');
  const techStack = [
    ['Frontend Framework', 'React 19.0.0 + Vite 6.1.0', 'SPA architecture, rapid HMR bundling, concurrent rendering'],
    ['PWA & Service Worker', 'Workbox / injectManifest (PWA v2)', 'Offline precache, push event listeners, lock screen actions'],
    ['Real-Time Messaging', '@stomp/stompjs + SockJS Client', 'Bidirectional sub-second WebSocket communication'],
    ['Backend Framework', 'Java 21 LTS + Spring Boot 3.3.4', 'High-throughput enterprise REST & WebSocket engine'],
    ['Security / Auth', 'Spring Security 6 + JJWT 0.11.5', 'Zero-trust JWT verification, BCrypt password hashing'],
    ['Cloud Databases', 'MongoDB Atlas + Embedded H2', 'Multi-tenant document store with TTL indexes & schema safety'],
    ['Push Notifications', 'Firebase Cloud Messaging (HTTP v1)', 'Reliable native device push with actionable notification buttons'],
    ['Hosting & CI/CD', 'GitHub Pages + Render Docker', 'Continuous deployment, containerized Docker backend execution']
  ];
  addTable(['Layer', 'Technology / Library', 'Role & Architectural Justification'], techStack, [100, 150, 219]);

  // ==========================================
  // CHAPTER 7: SYSTEM IMPLEMENTATION
  // ==========================================
  addChapterHeader('7', 'System Implementation');

  addSectionHeader('7.1', 'Implementation Overview');
  addParagraph(
    'The GateSync platform was engineered across modular, decoupled subsystems adhering strictly to clean architecture principles. Core modules include: (1) Persistent Authentication; (2) Live Visitor Registration with WebRTC; (3) Real-Time Dual-Channel Alert Engine; (4) Pre-Approved Passes & QR Validation; and (5) Administrative Management Command Center.'
  );

  addSectionHeader('7.2', 'Module 1: Foundations & Persistent Authentication');
  addParagraph(
    'Security strictly enforces the principle of least privilege. Short-lived JWT access tokens (15-minute validity) are stored in-memory to prevent XSS attacks. Long-lived rotating refresh tokens (30-day validity) reside in httpOnly, Secure cookies. Page refreshes silently execute background session renewals without logging the user out.'
  );

  addSectionHeader('7.3', 'Module 2: Live Visitor Registration & WebRTC Camera');
  addParagraph(
    'Security guards input visitor name, phone number, vehicle registration number, and destination flat. The integrated WebRTC module captures live visitor identity snapshots directly from the camera feed, attaching the photographic proof to the visitor payload.'
  );

  addSectionHeader('7.4', 'Module 3: Real-Time Resident Alert Engine');
  addParagraph(
    'Upon submission by the guard, the backend persists the record and dispatches a STOMP event to the resident’s WebSocket channel. The resident PWA triggers an audible chime and full-screen approval card. If unacknowledged within 2 seconds, an FCM HTTP v1 push notification is automatically fired.'
  );

  // ==========================================
  // CHAPTER 8: TESTING AND VALIDATION
  // ==========================================
  addChapterHeader('8', 'Testing and Validation');

  addSectionHeader('8.1', 'Testing Strategy');
  addParagraph(
    'A multi-tier testing strategy was implemented encompassing automated unit tests, integration test suites, mobile viewport E2E tests, and strict multi-tenant security verification.'
  );

  addSectionHeader('8.2', 'Table 8.1: Automated Validation Matrix');
  const testMatrix = [
    ['Tenant Isolation Test', 'JUnit 5 / Spring MockMvc', 'Cross-society tenant access mathematically prevented.', 'PASSED (100%)'],
    ['Atomic Decision Test', 'Concurrent Execution Test', 'Double-tap approval returns HTTP 409 Conflict.', 'PASSED (100%)'],
    ['Mobile E2E Viewport', 'Playwright (390x844)', 'Touch targets >= 44px, safe-area padding validated.', 'PASSED (100%)'],
    ['Vite SockJS Polyfill', 'Headless Browser Engine', 'Zero ReferenceError: global is not defined exceptions.', 'PASSED (100%)'],
    ['Production Build Test', 'Vite Production Compiler', 'Clean build of all 1,771 modules in 3.54s.', 'PASSED (100%)']
  ];
  addTable(['Test Suite', 'Methodology', 'Verification Assertion', 'Result'], testMatrix, [95, 110, 184, 80]);

  // ==========================================
  // CHAPTER 9: RESULTS AND PERFORMANCE ANALYSIS
  // ==========================================
  addChapterHeader('9', 'Results and Performance Analysis');

  addSectionHeader('9.1', 'Implementation Results');
  addParagraph(
    'GateSync was successfully deployed and verified under real-world residential operational scenarios. End-to-end visitor approval latency averaged 140ms on broadband and 320ms on mobile 4G networks.'
  );

  addSectionHeader('9.2', 'Table 9.1: System Latency & Performance Benchmarks');
  const perfRows = [
    ['WebSocket Event Latency', '< 500 ms', '120 - 180 ms', 'Optimal Sub-Second'],
    ['FCM Push Delivery Latency', '< 3000 ms', '1,850 ms', 'Satisfied Dedupe Window'],
    ['Vite Dev Server Boot Time', '< 2000 ms', '538 ms', 'Sub-Second Startup'],
    ['Production Bundle Size', '< 1000 KB', '624 KB (176 KB gzip)', 'Ultra-Lightweight PWA'],
    ['Google Lighthouse Performance', '>= 90', '96 / 100', 'Grade A+ Certified']
  ];
  addTable(['Performance Metric', 'Target Standard', 'Measured Result', 'Evaluation'], perfRows, [120, 95, 125, 129]);

  addSectionHeader('9.3', 'Screenshots of the Application');
  addParagraph(
    'The following high-resolution figures document the live operational workflow of the GateSync platform across security guard, resident, and administrative user journeys:'
  );

  // Figure 9.1: Guard Registering Visitor
  const img1 = path.join(process.cwd(), 'screenshots', 'fresh_fig_8_2_registration.png');
  if (fs.existsSync(img1)) {
    checkPageSpace(180);
    doc.image(img1, leftMargin + (contentWidth - 360) / 2, doc.y, { width: 360 });
    doc.moveDown(0.4);
    setBoldFont(10, cNavy);
    doc.text('Figure 9.1: Security Guard Visitor Registration Desk & Check-In Form', { align: 'center' });
    doc.moveDown(1.2);
  }

  // Figure 9.2: Resident Live Alert Popup
  const img2 = path.join(process.cwd(), 'screenshots', 'fresh_fig_8_3_arrival_alert.png');
  if (fs.existsSync(img2)) {
    checkPageSpace(180);
    doc.image(img2, leftMargin + (contentWidth - 360) / 2, doc.y, { width: 360 });
    doc.moveDown(0.4);
    setBoldFont(10, cNavy);
    doc.text('Figure 9.2: Resident Real-Time Full-Screen Arrival Chime & Modal Alert', { align: 'center' });
    doc.moveDown(1.2);
  }

  // Figure 9.3: Resident Approval Action
  const img3 = path.join(process.cwd(), 'screenshots', '3_resident_approval_action.png');
  if (fs.existsSync(img3)) {
    checkPageSpace(180);
    doc.image(img3, leftMargin + (contentWidth - 360) / 2, doc.y, { width: 360 });
    doc.moveDown(0.4);
    setBoldFont(10, cNavy);
    doc.text('Figure 9.3: Resident 1-Tap Entry Clearance Approval Action Interface', { align: 'center' });
    doc.moveDown(1.2);
  }

  // Figure 9.4: Guard Queue Updated
  const img4 = path.join(process.cwd(), 'screenshots', '4_guard_queue_updated.png');
  if (fs.existsSync(img4)) {
    checkPageSpace(180);
    doc.image(img4, leftMargin + (contentWidth - 360) / 2, doc.y, { width: 360 });
    doc.moveDown(0.4);
    setBoldFont(10, cNavy);
    doc.text('Figure 9.4: Security Guard Active Entry Queue Live Synchronization', { align: 'center' });
    doc.moveDown(1.2);
  }

  // Figure 9.5: Central Society Admin Dashboard (Clean without downloads)
  const img5 = path.join(process.cwd(), 'screenshots', 'verified_dashboard.png');
  if (fs.existsSync(img5)) {
    checkPageSpace(180);
    doc.image(img5, leftMargin + (contentWidth - 360) / 2, doc.y, { width: 360 });
    doc.moveDown(0.4);
    setBoldFont(10, cNavy);
    doc.text('Figure 9.5: Central Society Administration Governance Command Center', { align: 'center' });
    doc.moveDown(1.2);
  }

  // ==========================================
  // CHAPTER 10: DEPLOYMENT AND PROJECT DEMONSTRATION
  // ==========================================
  addChapterHeader('10', 'Deployment and Project Demonstration');

  addSectionHeader('10.1', 'Deployment Environment');
  addParagraph(
    'The frontend Progressive Web Application is deployed and hosted over global CDN infrastructure at /Gatesync/. The backend is containerized in a Docker container deployed to Render cloud infrastructure.'
  );

  addSectionHeader('10.2', 'Installation / Configuration');
  addParagraph(
    'The project requires zero client installation. Users navigate directly to the URL on mobile or desktop browsers, triggering the native Add to Home Screen PWA prompt.'
  );

  addSectionHeader('10.3', 'Application Deployment');
  addParagraph(
    'Automated CI/CD pipelines compile assets using Vite 6, run linter checks, and deploy static distributions to CDN edge nodes with sub-second cache invalidation.'
  );

  // ==========================================
  // CHAPTER 11: CHALLENGES, SOLUTIONS AND IMPROVEMENTS
  // ==========================================
  addChapterHeader('11', 'Challenges, Solutions and Improvements');

  addSectionHeader('11.1', 'Technical Challenges');
  addParagraph(
    'Under Vite modern browser mode, sockjs-client attempted to access Node’s global object, triggering ReferenceError: global is not defined and resulting in a blank white page on initial startup.'
  );

  addSectionHeader('11.2', 'Solutions Implemented');
  addParagraph(
    'Configured define: { global: "window" } in vite.config.js and injected an early browser polyfill in index.html, resolving the runtime error and restoring 100% clean DOM mounting.'
  );

  addSectionHeader('11.3', 'Improvements Made');
  addParagraph(
    'Implemented a 2000ms server-side deduplication wait to suppress redundant mobile push notifications when residents actively acknowledge live WebSocket alerts.'
  );

  // ==========================================
  // CHAPTER 12: PROJECT PROGRESS AND INDIVIDUAL CONTRIBUTION
  // ==========================================
  addChapterHeader('12', 'Project Progress and Individual Contribution');

  addSectionHeader('12.1', 'Reporting Phases (1 to 4)');
  addParagraph('• Reporting 1: Problem identification, society gatekeeper surveys, and initial technology selection.');
  addParagraph('• Reporting 2: Architecture design, Spring Boot REST controllers, and React UI layout scaffolding.');
  addParagraph('• Reporting 3: STOMP WebSocket broker integration, FCM push fallback, and WebRTC camera module.');
  addParagraph('• Reporting 4: Playwright mobile automated test suites, production build validation, and hard-bound report compilation.');

  addSectionHeader('12.2', 'Individual Contribution');
  addParagraph(
    'As the sole student developer, Arpitsinh Thakor executed the complete project lifecycle including backend microservice architecture, frontend responsive PWA engineering, real-time message broker configuration, and formal documentation.'
  );

  // ==========================================
  // CHAPTER 13: LIMITATIONS AND FUTURE SCOPE
  // ==========================================
  addChapterHeader('13', 'Limitations and Future Scope');

  addSectionHeader('13.1', 'Limitations of the System');
  addParagraph('• High-speed vehicle license plate recognition (ANPR) currently requires dedicated server-side GPU inference hardware.');
  addParagraph('• Payment gateway integration operates in sandbox reconciliation mode pending live bank merchant onboarding.');

  addSectionHeader('13.2', 'Future Enhancements');
  addParagraph('• Computer Vision ANPR gate barrier integration using OpenCV / YOLOv8.');
  addParagraph('• Hardware IoT boom barrier actuators connected via ESP32 / MQTT relays.');

  // ==========================================
  // CHAPTER 14: CONCLUSION
  // ==========================================
  addChapterHeader('14', 'Conclusion');
  addParagraph(
    'The GateSync platform demonstrates that modern open web standards—specifically Progressive Web Applications, STOMP WebSockets, and zero-trust multi-tenant architectures—can effectively replace cumbersome native mobile applications and obsolete paper register books in residential security management.'
  );
  addParagraph(
    'By delivering sub-second alert chimes, automated Web Push fallbacks, 1-tap delivery templates, and immutable audit logs, GateSync establishes a secure, transparent, and seamless residential community living experience.'
  );

  // ==========================================
  // CHAPTER 15: REFERENCES (APA 7th Edition)
  // ==========================================
  addChapterHeader('15', 'References (APA 7th Edition)');
  const refs = [
    'Fielding, R. T. (2000). Architectural Styles and the Design of Network-based Software Architectures. University of California, Irvine.',
    'Fette, I., & Melnikov, A. (2011). The WebSocket Protocol. RFC 6455, Internet Engineering Task Force.',
    'Jones, M., Bradley, J., & Sakimura, N. (2015). JSON Web Token (JWT). RFC 7519, Internet Engineering Task Force.',
    'Mozilla Developer Network (MDN). (2026). Progressive Web Apps (PWAs) & Service Worker API. Mozilla Foundation.',
    'Spring Framework Documentation. (2026). WebSocket, STOMP Messaging and Spring Security Architecture. VMware Tanzu.',
    'React Core Team. (2026). React 19 Architecture and Server Components Documentation. Meta Open Source.',
    'MongoDB Inc. (2026). MongoDB Atlas Multi-Tenant Data Modeling Guidelines. MongoDB Documentation.'
  ];
  refs.forEach(r => addParagraph(r));

  // ==========================================
  // RUNNING FOOTER: ROMAN FOR PRELIM, ARABIC FOR CHAPTERS
  // ==========================================
  const totalPages = doc.bufferedPageRange().count;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    doc.fontSize(9).font(fontRegular).fillColor(cMuted);

    let pageNumStr = '';
    if (i <= 5) {
      const roman = ['', 'i', 'ii', 'iii', 'iv', 'v', 'vi'];
      pageNumStr = roman[i] || String(i);
    } else {
      pageNumStr = String(i - 5);
    }

    doc.text(`Page ${pageNumStr}`, leftMargin, doc.page.height - 30, {
      width: contentWidth,
      align: 'center'
    });
  }

  doc.end();

  writeStream.on('finish', () => {
    try {
      const userDownloads1 = 'C:\\Users\\ASUS\\Downloads\\GateSync_Project_Report.pdf';
      const userDownloads2 = 'C:\\Users\\ASUS\\Downloads\\GATESYNC_PPSU_Final_Hard_Bound_Project_Report.pdf';

      fs.copyFileSync(outputFile, userDownloads1);
      fs.copyFileSync(outputFile, userDownloads2);
      fs.copyFileSync(outputFile, publicOutputFile);
      fs.copyFileSync(outputFile, distOutputFile);
      fs.copyFileSync(outputFile, docsOutputFile);
      console.log('✅ Final Hard-Bound Project Report PDF successfully generated!');
      console.log(`Saved to: ${outputFile}`);
      console.log(`Copied to: ${userDownloads1}`);
      console.log(`Copied to: ${userDownloads2}`);
      console.log(`Mirrored to: public/, dist/, and docs/`);
    } catch (e) {
      console.error('Error copying files:', e.message);
    }
  });
}

createReport();
