import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export function createPoster() {
  const outputFile = path.join(process.cwd(), 'GATESYNC_Project_Poster_A2_1Page.pdf');
  const userDownloads1 = 'C:\\Users\\ASUS\\Downloads\\GATESYNC_Project_Poster_A2_1Page.pdf';
  const userDownloads2 = 'C:\\Users\\ASUS\\Downloads\\Final_Project_Poster.pdf';
  const publicOutputFile = path.join(process.cwd(), 'public', 'GATESYNC_Project_Poster_A2_1Page.pdf');
  const distOutputFile = path.join(process.cwd(), 'dist', 'GATESYNC_Project_Poster_A2_1Page.pdf');
  const docsOutputFile = path.join(process.cwd(), 'docs', 'GATESYNC_Project_Poster_A2_1Page.pdf');

  // Exact A2 Dimensions: 42.0 cm x 59.4 cm (1191.12 x 1684.08 pt)
  const width = 1191.12;
  const height = 1684.08;
  const margin = 36;

  const doc = new PDFDocument({
    size: [width, height],
    margins: { top: margin, bottom: 5, left: margin, right: margin },
    autoFirstPage: true,
    info: {
      Title: 'GateSync - User Defined Project Final Poster Presentation',
      Author: 'Arpitsinh Thakor (23SE02IE040)',
      Subject: 'B.Tech Information Technology - PPSU School of Engineering'
    }
  });

  const writeStream = fs.createWriteStream(outputFile);
  doc.pipe(writeStream);

  // Official Cambria Fonts
  const fontRegular = 'C:/Windows/Fonts/cambria.ttc';
  const fontBold = 'C:/Windows/Fonts/cambriab.ttf';
  const fontItalic = 'C:/Windows/Fonts/cambriai.ttf';

  // Palette: Premium Sapphire / Royal Blue Theme
  const cBlueHeader = '#1d4ed8'; // Vibrant Sapphire / Royal Blue
  const cBlueText = '#1e40af';   // Deep Royal Blue for Titles & Highlights
  const cText = '#1f2937';       // Dark charcoal text
  const cMuted = '#4b5563';      // Slate muted text
  const cBorder = '#cbd5e1';     // Light slate border

  // Available printable width
  const contentWidth = width - margin * 2; // 1119.12 pt
  const colGap = 32;
  const colWidth = (contentWidth - colGap) / 2; // 543.56 pt

  const col1Left = margin;
  const col2Left = margin + colWidth + colGap;

  // -------------------------------------------------------------
  // 1. TOP HEADER BANNER
  // -------------------------------------------------------------
  const logoPath = path.join(process.cwd(), 'screenshots', 'ppsu_logo.png');
  const soeBannerPath = path.join(process.cwd(), 'screenshots', 'ppsu_soe_banner.png');

  // Left PPSU NAAC A+ Logo
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, margin, margin + 2, { width: 230 });
  }

  // Right School of Engineering Banner
  if (fs.existsSync(soeBannerPath)) {
    doc.image(soeBannerPath, width - margin - 230, margin + 12, { width: 230 });
  }

  // Center Title & Details
  const centerTop = margin + 4;
  const centerLeft = margin + 235;
  const centerWidth = contentWidth - 470; // 649.12 pt

  // Main Title: 26pt Cambria Bold (fits in 1 clean line)
  doc.font(fontBold).fontSize(26).fillColor('#111827')
     .text('GateSync Security & Society Management Platform', centerLeft, centerTop, {
       width: centerWidth,
       align: 'center'
     });

  const subY = doc.y + 6;
  // Subtitle: 16.5pt Cambria Italic
  doc.font(fontItalic).fontSize(16.5).fillColor('#374151')
     .text('A Multi-Tenant Progressive Web Application & Real-Time Security System', centerLeft, subY, {
       width: centerWidth,
       align: 'center'
     });

  const authY = doc.y + 8;
  // Student & Mentor row (15pt)
  doc.font(fontBold).fontSize(15).fillColor('#111827')
     .text('Student: Arpitsinh Thakor (Enrollment: 23SE02IE040)   |   Mentor: Ms. Shrijal Patel', centerLeft, authY, {
       width: centerWidth,
       align: 'center'
     });

  const deptY = doc.y + 5;
  // Department & Institution row (13.5pt)
  doc.font(fontRegular, 'Cambria').fontSize(13.5).fillColor('#4b5563')
     .text('Department of Information Technology and Engineering | School of Engineering, P P Savani University', centerLeft, deptY, {
       width: centerWidth,
       align: 'center'
     });

  // Vibrant Blue Divider Line
  const dividerY = Math.max(doc.y + 14, margin + 122);
  doc.strokeColor(cBlueHeader).lineWidth(3).moveTo(margin, dividerY).lineTo(width - margin, dividerY).stroke();

  // -------------------------------------------------------------
  // SECTION BANNER HELPER (Vibrant Blue Background)
  // -------------------------------------------------------------
  function drawSectionBanner(x, y, w, titleText) {
    const bannerHeight = 36;
    doc.roundedRect(x, y, w, bannerHeight, 6).fill(cBlueHeader);
    doc.font(fontBold).fontSize(20).fillColor('#ffffff')
       .text(titleText, x, y + 8, { width: w, align: 'center', lineBreak: false });
    return y + bannerHeight + 12;
  }

  // HELPER: DRAW CRISP OPEN-CIRCLE BLUE BULLET
  function drawBlueBullet(x, y) {
    doc.circle(x + 5, y + 7, 2.5).lineWidth(1.4).strokeColor(cBlueHeader).stroke();
  }

  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // COLUMN 1: LEFT SIDE CONTENT
  // -------------------------------------------------------------
  let c1Y = dividerY + 16;

  // 1. ABSTRACT
  c1Y = drawSectionBanner(col1Left, c1Y, colWidth, 'Abstract');

  doc.font(fontRegular, 'Cambria').fontSize(13).fillColor(cText);
  doc.text(
    'GateSync is a community-based residential security and visitor governance platform developed to modernize physical gatekeeping operations and establish real-time digital communication between security guards and residents. Modern residential societies often struggle with manual paper logbooks, unverified visitor entries, long visitor queues, and delayed intercom communications. GateSync provides a unified digital bridge connecting guards, residents, and society administrators with sub-second STOMP WebSocket arrival alerts, 1-tap fast deliveries, pre-approved WhatsApp QR passes, and emergency SOS alarms.',
    col1Left, c1Y, { width: colWidth, align: 'justify', lineGap: 2.5 }
  );
  c1Y = doc.y + 5;

  doc.font(fontItalic).fontSize(11.5).fillColor(cBlueText).text(
    'Keywords: Visitor Management, Gated Society Security, PWA, STOMP WebSockets, Spring Boot 3, React 19, MongoDB Atlas.',
    col1Left, c1Y, { width: colWidth, lineGap: 2 }
  );
  c1Y = doc.y + 12;

  // 2. INTRODUCTION
  c1Y = drawSectionBanner(col1Left, c1Y, colWidth, 'Introduction');

  doc.font(fontRegular, 'Cambria').fontSize(13.5).fillColor(cText);
  doc.text(
    'Modern housing societies and gated communities face severe operational bottlenecks and security risks during peak visitor, guest, and delivery influxes, creating an urgent need for an automated, real-time digital solution.',
    col1Left, c1Y, { width: colWidth, align: 'justify', lineGap: 2.5 }
  );
  c1Y = doc.y + 6;

  const introBullets = [
    'Long gate delays of 5 to 10 minutes per vehicle during peak delivery and cab hours',
    'Manual paper registers prone to privacy leaks, illegible entries, and lost visitor records',
    'Zero real-time communication between gate security guards and flat residents during arrival',
    'Delayed intercom phone calls leading to delivery cancellations and severe gate vehicular congestion'
  ];

  introBullets.forEach(b => {
    drawBlueBullet(col1Left, c1Y);
    doc.font(fontRegular, 'Cambria').fontSize(12.5).fillColor(cText)
       .text(b, col1Left + 16, c1Y, { width: colWidth - 16, lineGap: 2 });
    c1Y = doc.y + 4;
  });

  c1Y += 4;
  doc.font(fontRegular, 'Cambria').fontSize(13).fillColor(cText).text(
    'This project presents GateSync—a high-performance, multi-tenant Progressive Web Application providing instant resident arrival alerts with audio chimes, 1-tap fast deliveries, pre-approved QR passes, and emergency SOS alarms.',
    col1Left, c1Y, { width: colWidth, align: 'justify', lineGap: 2.5 }
  );
  c1Y = doc.y + 12;

  // 3. OBJECTIVES
  c1Y = drawSectionBanner(col1Left, c1Y, colWidth, 'Objectives');

  const objItems = [
    ['Eliminate Gate Choke Points', 'Cut visitor check-in and resident approval time by 80% via digital real-time push alerts.'],
    ['Multi-Tenant Isolation Architecture', 'Securely power multiple residential societies from a single cloud backend with zero data leakage.'],
    ['Role-Specific Control Desks', 'Deliver tailored, high-productivity portals for Security Guards, Residents, and Society Admins.'],
    ['Sub-Second Real-Time Synchronization', 'Transmit instant visitor arrival events to resident screens within 140ms using STOMP WebSockets.'],
    ['1-Tap Rapid Deliveries and Passes', 'Accelerate Swiggy, Zomato, Amazon, Blinkit, and Cab entries via 1-tap fast buttons and QR guest passes.'],
    ['Zero-Trust Security and PWA Access', 'Enforce rotating JWT cookies, role-based access control RBAC, and offline-first PWA caching.']
  ];

  objItems.forEach(([head, desc]) => {
    drawBlueBullet(col1Left, c1Y);
    doc.font(fontBold).fontSize(13).fillColor(cBlueText);
    const headText = `${head}: `;
    const headWidth = doc.widthOfString(headText);
    doc.text(headText, col1Left + 16, c1Y, { lineBreak: false });
    doc.font(fontRegular, 'Cambria').fontSize(12.5).fillColor(cText);
    doc.text(desc, col1Left + 16 + headWidth, c1Y, { width: colWidth - 16 - headWidth, lineGap: 1.8 });
    c1Y = doc.y + 4;
  });

  c1Y += 10;

  // 4. METHODOLOGY
  c1Y = drawSectionBanner(col1Left, c1Y, colWidth, 'Methodology');

  doc.font(fontRegular, 'Cambria').fontSize(13.5).fillColor(cText)
     .text('Developed using Agile Scrum over four 2-week iterations with end-of-sprint stakeholder reviews:', col1Left, c1Y, { width: colWidth, lineGap: 2.5 });
  c1Y = doc.y + 6;

  const sprints = [
    ['Sprint 1–2', 'Persistent Auth & Zero-Trust JWT: 15m access token, rotating 30d httpOnly cookie, and device session management.'],
    ['Sprint 3–4', 'Reliable Dual-Channel Push: STOMP over WebSocket broker, 2s dedupe window, and FCM HTTP v1 push fallback.'],
    ['Sprint 5–6', '1-Tap Fast Delivery & Emergency SOS: Quick Swiggy/Zomato/Blinkit check-in, 6-digit OTP/QR passes, and guard siren broadcast.']
  ];

  sprints.forEach(([ph, desc]) => {
    drawBlueBullet(col1Left, c1Y);
    doc.font(fontBold).fontSize(13).fillColor(cBlueText);
    const phText = `${ph}: `;
    const phWidth = doc.widthOfString(phText);
    doc.text(phText, col1Left + 16, c1Y, { lineBreak: false });
    doc.font(fontRegular, 'Cambria').fontSize(12.5).fillColor(cText);
    doc.text(desc, col1Left + 16 + phWidth, c1Y, { width: colWidth - 16 - phWidth, lineGap: 2 });
    c1Y = doc.y + 4;
  });

  c1Y += 5;

  // Tech Badges
  function drawPill(text, x, y, bg = '#dbeafe', textCol = '#1e40af') {
    doc.font(fontBold).fontSize(10.5);
    const tw = doc.widthOfString(text);
    const pw = tw + 14;
    doc.roundedRect(x, y, pw, 22, 5).fill(bg);
    doc.fillColor(textCol).text(text, x + 7, y + 5, { lineBreak: false });
    return pw + 6;
  }

  // Row 1: Frontend
  doc.font(fontBold).fontSize(11.5).fillColor('#111827').text('Frontend:', col1Left, c1Y + 4, { lineBreak: false });
  let curPillX = col1Left + 68;
  ['React 19', 'Vite 6', 'PWA Service Worker', 'STOMP / SockJS', 'Axios'].forEach(t => {
    curPillX += drawPill(t, curPillX, c1Y, '#dbeafe', '#1e40af');
  });
  c1Y += 26;

  // Row 2: Backend
  doc.font(fontBold).fontSize(11.5).fillColor('#111827').text('Backend:', col1Left, c1Y + 4, { lineBreak: false });
  curPillX = col1Left + 68;
  ['Java 21', 'Spring Boot 3', 'Spring Security 6', 'MongoDB Atlas', 'FCM v1'].forEach(t => {
    curPillX += drawPill(t, curPillX, c1Y, '#e0f2fe', '#0369a1');
  });
  c1Y += 30;

  // 5. SYSTEM ARCHITECTURE & DATA FLOW
  c1Y = drawSectionBanner(col1Left, c1Y, colWidth, 'System Architecture & Data Flow');

  doc.font(fontRegular, 'Cambria').fontSize(13).fillColor(cText)
     .text('A RESTful and Event-Driven 3-tier architecture with bi-directional WebSockets:', col1Left, c1Y, { width: colWidth, lineGap: 2 });
  c1Y = doc.y + 2;
  doc.font(fontRegular, 'Cambria').fontSize(11.5).fillColor(cMuted)
     .text('PWA Client React 19 ↔ Spring Boot 3 Gateway & Broker ↔ MongoDB Atlas Multi-Tenant Cloud. Real-time arrival alerts broadcast instantly without polling overhead.', col1Left, c1Y, { width: colWidth, lineGap: 1.8 });
  c1Y = doc.y + 8;

  // Framed Architecture Diagram Box
  const diagX = col1Left;
  const diagY = c1Y;
  const diagW = colWidth;
  const diagH = 215;

  doc.roundedRect(diagX, diagY, diagW, diagH, 8).fill('#f8fafc').stroke(cBorder);

  // Tier 1: Client
  doc.roundedRect(diagX + 14, diagY + 10, diagW - 28, 46, 6).fill('#e0f2fe').stroke('#0284c7');
  doc.font(fontBold).fontSize(11).fillColor('#0369a1').text('TIER 1: PROGRESSIVE WEB APPLICATION — CLIENT SUITE', diagX + 18, diagY + 14, { width: diagW - 36, align: 'center', lineBreak: false });
  doc.font(fontRegular, 'Cambria').fontSize(9.5).fillColor('#1e293b')
     .text('Resident PWA — Arrival Audio Alerts  |  Guard Desk — 1-Tap Fast Check-In  |  Admin Management Desk', diagX + 18, diagY + 28, { width: diagW - 36, align: 'center', lineBreak: false });
  doc.font(fontItalic).fontSize(8.5).fillColor('#0284c7')
     .text('Service Worker Cache  •  Web Audio 440/480Hz Chime  •  Screen Wake Lock  •  Offline Action Queue', diagX + 18, diagY + 41, { width: diagW - 36, align: 'center', lineBreak: false });

  // Flow Arrow 1
  doc.strokeColor('#64748b').lineWidth(1.2).moveTo(diagX + diagW / 2, diagY + 56).lineTo(diagX + diagW / 2, diagY + 71).stroke();
  doc.font(fontBold).fontSize(8.5).fillColor('#64748b').text('↕ HTTPS REST APIs via Axios  |  ↕ WSS STOMP WebSockets via SockJS', diagX + 18, diagY + 61, { width: diagW - 36, align: 'center', lineBreak: false });

  // Tier 2: Backend
  doc.roundedRect(diagX + 14, diagY + 72, diagW - 28, 68, 6).fill('#f1f5f9').stroke('#475569');
  doc.font(fontBold).fontSize(11).fillColor('#0f172a').text('TIER 2: SPRING BOOT 3 ENTERPRISE APPLICATION SERVER', diagX + 18, diagY + 76, { width: diagW - 36, align: 'center', lineBreak: false });
  doc.font(fontRegular, 'Cambria').fontSize(9).fillColor('#334155')
     .text('Spring Security 6 Zero-Trust JWT Filter Chain  |  STOMP Simple Message Broker', diagX + 18, diagY + 90, { width: diagW - 36, align: 'center', lineBreak: false });
  doc.text('Notification Pipeline Engine with 2s Dedupe  |  Escalation Timers: 60s Alert & 120s Guard Tel Link', diagX + 18, diagY + 102, { width: diagW - 36, align: 'center', lineBreak: false });
  doc.text('Pre-Approved Pass Generator: 6-Digit OTP & QR Pass  |  SOS Emergency Siren Dispatcher', diagX + 18, diagY + 114, { width: diagW - 36, align: 'center', lineBreak: false });
  doc.font(fontItalic).fontSize(8.5).fillColor('#1d4ed8')
     .text('FCM HTTP v1 Push Fallback Gateway — Stale Token Eviction & Lock-Screen Action Buttons', diagX + 18, diagY + 126, { width: diagW - 36, align: 'center', lineBreak: false });

  // Flow Arrow 2
  doc.strokeColor('#64748b').lineWidth(1.2).moveTo(diagX + diagW / 2, diagY + 140).lineTo(diagX + diagW / 2, diagY + 154).stroke();
  doc.font(fontBold).fontSize(8.5).fillColor('#64748b').text('↕ JPA Transactions  |  ↕ MongoDB Reactive Document Client', diagX + 18, diagY + 144, { width: diagW - 36, align: 'center', lineBreak: false });

  // Tier 3: Storage
  const boxW = (diagW - 38) / 2;
  doc.roundedRect(diagX + 14, diagY + 156, boxW, 58, 6).fill('#ecfdf5').stroke('#059669');
  doc.font(fontBold).fontSize(10.5).fillColor('#065f46').text('MongoDB Atlas Cloud Cluster', diagX + 16, diagY + 161, { width: boxW - 4, align: 'center', lineBreak: false });
  doc.font(fontRegular, 'Cambria').fontSize(8.5).fillColor('#047857')
     .text('Multi-Tenant Document Persistence:\n• notifications with Dedupe & TTL\n• pre_approved_passes QR & OTP\n• device_fcm_tokens & audit_logs', diagX + 20, diagY + 174, { width: boxW - 12 });

  doc.roundedRect(diagX + 24 + boxW, diagY + 156, boxW, 58, 6).fill('#fef3c7').stroke('#d97706');
  doc.font(fontBold).fontSize(10.5).fillColor('#92400e').text('Embedded H2 & Cloud Storage', diagX + 26 + boxW, diagY + 161, { width: boxW - 4, align: 'center', lineBreak: false });
  doc.font(fontRegular, 'Cambria').fontSize(8.5).fillColor('#b45309')
     .text('Relational Engine & Media CDN:\n• Fast relational mapping\n• User principal credentials\n• Cloudinary photo storage\n• Render cloud deployment', diagX + 30 + boxW, diagY + 174, { width: boxW - 12 });

  c1Y = diagY + diagH + 8;
  doc.font(fontItalic).fontSize(11).fillColor(cMuted)
     .text('Figure 1: Level-1 Data Flow & Multi-Tier Real-Time Event Architecture', col1Left, c1Y, { width: colWidth, align: 'center', lineBreak: false });

  // -------------------------------------------------------------
  // COLUMN 2: RIGHT SIDE CONTENT
  // -------------------------------------------------------------
  let c2Y = dividerY + 16;

  // 1. RESULTS & DISCUSSION
  c2Y = drawSectionBanner(col2Left, c2Y, colWidth, 'Results & Discussion');

  // KPI Stat Boxes in Elegant Soft Ice Blue
  const kpiW = (colWidth - 24) / 3;
  const kpiH = 76;
  const kpis = [
    { stat: '80%', label: 'Verification Time Cut' },
    { stat: '<140ms', label: 'Avg. WebSocket Latency' },
    { stat: '100%', label: 'Delivery Pass Accuracy' }
  ];

  kpis.forEach((kpi, idx) => {
    const kX = col2Left + idx * (kpiW + 12);
    doc.roundedRect(kX, c2Y, kpiW, kpiH, 6).fill('#eff6ff').stroke('#bfdbfe');
    doc.font(fontBold).fontSize(30).fillColor('#1d4ed8').text(kpi.stat, kX, c2Y + 8, { width: kpiW, align: 'center', lineBreak: false });
    doc.font(fontRegular, 'Cambria').fontSize(11.5).fillColor('#1e40af').text(kpi.label, kX + 4, c2Y + 46, { width: kpiW - 8, align: 'center', lineBreak: false });
  });

  c2Y += kpiH + 14;

  const resBullets = [
    ['Zero-Trust Multi-Tenancy', 'Multi-tenant isolation verified during high-load concurrent stress tests with zero tenant bleed.'],
    ['100% Delivery Accuracy', 'Cryptographic 6-digit OTP & 1-tap Swiggy, Zomato, Blinkit check-ins completely eliminated unverified trespassers.'],
    ['Real-Time Synchronization', 'STOMP over WebSocket arrival alerts broadcast within 140ms with user-unlocked Web Audio chimes.']
  ];

  resBullets.forEach(([head, desc]) => {
    drawBlueBullet(col2Left, c2Y);
    doc.font(fontBold).fontSize(13.5).fillColor(cBlueText);
    const headText = `${head}: `;
    const headWidth = doc.widthOfString(headText);
    doc.text(headText, col2Left + 16, c2Y, { lineBreak: false });
    doc.font(fontRegular, 'Cambria').fontSize(13).fillColor(cText);
    doc.text(desc, col2Left + 16 + headWidth, c2Y, { width: colWidth - 16 - headWidth, lineGap: 2 });
    c2Y = doc.y + 5;
  });

  c2Y += 6;

  // 2x2 Grid of Genuine Live Production Screenshots (CLEAN: No Downloads Hub!)
  const imgW = (colWidth - 14) / 2; // ~264 pt
  const imgH = 150;
  const gridY = c2Y;

  const shot1 = path.join(process.cwd(), 'screenshots', 'verified_dashboard.png');
  const shot2 = path.join(process.cwd(), 'screenshots', 'fresh_3_guard_desk.png');
  const shot3 = path.join(process.cwd(), 'screenshots', 'fresh_real_quick_delivery_modal.png');
  const shot4 = path.join(process.cwd(), 'screenshots', 'fresh_3_maintenance_billing.png');

  // Image 1: Top-Left (Executive Management Dashboard)
  if (fs.existsSync(shot1)) {
    doc.roundedRect(col2Left, gridY, imgW, imgH, 4).stroke(cBorder);
    doc.image(shot1, col2Left, gridY, { width: imgW, height: imgH });
    doc.font(fontItalic).fontSize(10.5).fillColor('#1d4ed8').text('Executive Dashboard Desk', col2Left, gridY + imgH + 5, { width: imgW, align: 'center', lineBreak: false });
  }

  // Image 2: Top-Right (Security Guard Gate Desk)
  if (fs.existsSync(shot2)) {
    doc.roundedRect(col2Left + imgW + 14, gridY, imgW, imgH, 4).stroke(cBorder);
    doc.image(shot2, col2Left + imgW + 14, gridY, { width: imgW, height: imgH });
    doc.font(fontItalic).fontSize(10.5).fillColor('#1d4ed8').text('Security Guard Gate Desk', col2Left + imgW + 14, gridY + imgH + 5, { width: imgW, align: 'center', lineBreak: false });
  }

  const row2Y = gridY + imgH + 24;

  // Image 3: Bottom-Left (1-Tap Swiggy & Cab Fast Entry)
  if (fs.existsSync(shot3)) {
    doc.roundedRect(col2Left, row2Y, imgW, imgH, 4).stroke(cBorder);
    doc.image(shot3, col2Left, row2Y, { width: imgW, height: imgH });
    doc.font(fontItalic).fontSize(10.5).fillColor('#1d4ed8').text('1-Tap Swiggy & Cab Fast Entry', col2Left, row2Y + imgH + 5, { width: imgW, align: 'center', lineBreak: false });
  }

  // Image 4: Bottom-Right (Maintenance Billing & Ledger)
  if (fs.existsSync(shot4)) {
    doc.roundedRect(col2Left + imgW + 14, row2Y, imgW, imgH, 4).stroke(cBorder);
    doc.image(shot4, col2Left + imgW + 14, row2Y, { width: imgW, height: imgH });
    doc.font(fontItalic).fontSize(10.5).fillColor('#1d4ed8').text('Maintenance Billing & Ledger', col2Left + imgW + 14, row2Y + imgH + 5, { width: imgW, align: 'center', lineBreak: false });
  }

  c2Y = row2Y + imgH + 22;
  doc.font(fontItalic).fontSize(11).fillColor(cMuted)
     .text('Figure 2: Production UI — Executive Dashboard, Guard Gate Desk, 1-Tap Deliveries & Maintenance Ledger', col2Left, c2Y, { width: colWidth, align: 'center', lineBreak: false });

  c2Y += 22;

  // 2. CONCLUSION & FUTURE WORK
  c2Y = drawSectionBanner(col2Left, c2Y, colWidth, 'Conclusion & Future Work');

  doc.font(fontRegular, 'Cambria').fontSize(14.5).fillColor(cText);
  doc.text(
    'The GateSync platform successfully replaces manual paper registers with structured digital visitor workflows. The scalable multi-tenant architecture allows seamless onboarding of residential societies with zero parameter-tampering vulnerability.',
    col2Left, c2Y, { width: colWidth, align: 'justify', lineGap: 3 }
  );
  c2Y = doc.y + 7;

  const conclBullets = [
    ['Key Impact', 'Drastic 80% reduction in gate verification delays, zero lost visitor logs, automated emergency SOS alerts.'],
    ['Applications', 'Residential gated townships, high-rise luxury apartments, commercial tech parks, corporate campuses.'],
    ['Limitations', 'Free cloud tiers require wake-up warming; vehicle plate logging currently relies on guard keyboard input.']
  ];

  conclBullets.forEach(([head, desc]) => {
    drawBlueBullet(col2Left, c2Y);
    doc.font(fontBold).fontSize(13.5).fillColor(cBlueText);
    const headText = `${head}: `;
    const headWidth = doc.widthOfString(headText);
    doc.text(headText, col2Left + 16, c2Y, { lineBreak: false });
    doc.font(fontRegular, 'Cambria').fontSize(13).fillColor(cText);
    doc.text(desc, col2Left + 16 + headWidth, c2Y, { width: colWidth - 16 - headWidth, lineGap: 2 });
    c2Y = doc.y + 4;
  });

  c2Y += 5;
  doc.font(fontBold).fontSize(13.5).fillColor('#111827').text('Future Enhancements:', col2Left, c2Y);
  c2Y = doc.y + 6;

  const futureItems = [
    'AI-powered Automatic Number Plate Recognition ANPR using camera computer vision to auto-log visitor vehicles',
    'IoT Smart Boom Barrier microcontroller relays ESP32 / MQTT for automated gate opening upon verified QR passes',
    'Facial recognition biometrics for recurring domestic maids, drivers, and maintenance staff'
  ];

  futureItems.forEach(item => {
    drawBlueBullet(col2Left, c2Y);
    doc.font(fontRegular, 'Cambria').fontSize(13).fillColor(cText).text(item, col2Left + 16, c2Y, { width: colWidth - 16, lineGap: 2 });
    c2Y = doc.y + 4;
  });

  c2Y += 14;

  // 3. REFERENCES
  c2Y = drawSectionBanner(col2Left, c2Y, colWidth, 'References');

  const refs = [
    '[1] Fielding, R. T. (2000). Architectural Styles and the Design of Network-based Software Architectures. UC Irvine.',
    '[2] Jones, M., et al. (2015). JSON Web Token (JWT). RFC 7519, Internet Engineering Task Force (IETF).',
    '[3] MongoDB, Inc. (2024). MongoDB Atlas Cloud Architecture & Multi-Tenant Indexing Guide. docs.mongodb.com',
    '[4] Walls, C. (2022). Spring Boot in Action (2nd ed.). Manning Publications.',
    '[5] World Wide Web Consortium (W3C). (2024). Progressive Web Apps Architecture & Service Workers Recommendation.'
  ];

  refs.forEach(r => {
    doc.font(fontRegular, 'Cambria').fontSize(12).fillColor('#374151')
       .text(r, col2Left, c2Y, { width: colWidth, lineGap: 2 });
    c2Y = doc.y + 3;
  });

  // -------------------------------------------------------------
  // FOOTER BAR
  // -------------------------------------------------------------
  const footerY = height - margin - 22;
  doc.strokeColor('#bfdbfe').lineWidth(1.5).moveTo(margin, footerY - 8).lineTo(width - margin, footerY - 8).stroke();

  doc.font(fontRegular, 'Cambria').fontSize(13.5).fillColor('#374151')
     .text('P P Savani University | Kosamba, Surat, Gujarat – 394125', margin, footerY, { width: 380, align: 'left', lineBreak: false });

  doc.font(fontRegular, 'Cambria').fontSize(13.5).fillColor('#374151')
     .text('Department of Information Technology and Engineering | B.Tech Project | 2026–2027', margin + 380, footerY, { width: width - margin * 2 - 760, align: 'center', lineBreak: false });

  doc.font(fontRegular, 'Cambria').fontSize(13.5).fillColor('#374151')
     .text('Mentor: Ms. Shrijal Patel | Enrollment: 23SE02IE040', width - margin - 380, footerY, { width: 380, align: 'right', lineBreak: false });

  doc.end();

  writeStream.on('finish', () => {
    try {
      fs.copyFileSync(outputFile, userDownloads1);
      fs.copyFileSync(outputFile, userDownloads2);
      fs.copyFileSync(outputFile, publicOutputFile);
      fs.copyFileSync(outputFile, distOutputFile);
      fs.copyFileSync(outputFile, docsOutputFile);
      console.log('✅ GATESYNC Project Poster PDF generated successfully in Royal Blue layout!');
      console.log(`Saved to: ${outputFile}`);
      console.log(`Copied to: ${userDownloads1}`);
      console.log(`Copied to: ${userDownloads2}`);
    } catch (e) {
      console.error('Error copying poster file:', e.message);
    }
  });
}

createPoster();
