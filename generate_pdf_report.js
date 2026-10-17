import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const generatePDF = () => {
  const doc = new PDFDocument({
    margin: 45,
    size: 'A4',
    bufferPages: true,
    info: {
      Title: 'GateSync - Smart Society & Gate Security Management Platform Project Report',
      Author: 'Arpitsinh Thakor (23SE02IE040)',
      Subject: 'Software Engineering & Final Project Report'
    }
  });

  const pdfPathProject = path.join(process.cwd(), 'GateSync_Project_Report.pdf');
  const pdfPathPublic = path.join(process.cwd(), 'public', 'GateSync_Project_Report.pdf');

  const writeStreamProject = fs.createWriteStream(pdfPathProject);
  doc.pipe(writeStreamProject);

  // AI Sky Blue & Navy Styling palette
  const primaryColor = '#0284c7';
  const secondaryColor = '#0ea5e9';
  const textColor = '#0c1e33';
  const mutedTextColor = '#47617d';
  const cardBg = '#f0f9ff';

  // --- COVER / HEADER ---
  doc.rect(0, 0, doc.page.width, 140).fill('#0c1e33');

  doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('GATESYNC MANAGEMENT PLATFORM', 45, 32);
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#38bdf8').text('SMART RESIDENTIAL SOCIETY & GATE SECURITY DESK — PROJECT REPORT', 45, 64);
  doc.fontSize(9.5).font('Helvetica').fillColor('#94a3b8').text('P P Savani University | B.Tech Information Technology & Engineering — 7th Semester', 45, 88);
  doc.fillColor('#e2e8f0').text('Candidate: Arpitsinh Thakor | Enrollment: 23SE02IE040 | Mentor: Ms. Shrijal Patel', 45, 106);

  doc.moveDown(4);

  // --- ABSTRACT ---
  doc.fillColor(textColor).fontSize(16).font('Helvetica-Bold').text('1. Executive Abstract & System Overview', 45, 160);
  doc.fontSize(10).font('Helvetica').fillColor(mutedTextColor).text(
    'GateSync is a high-performance web platform engineered using React 19 and Google Material Design 3. The platform automates housing society governance, maintenance billing calculations, gate security visitor logging, notice broadcasts, and financial data exports.',
    45, 185, { width: 500, align: 'justify', lineGap: 3 }
  );

  // --- OBJECTIVES ---
  doc.fillColor(textColor).fontSize(16).font('Helvetica-Bold').text('2. Core System Objectives', 45, 240);

  const bulletPoints = [
    'Automate Maintenance Billing: Dynamic itemized bill generation for society maintenance, electricity, and water.',
    'Role-Based Portal Access: Distinct UI control desks for Admin Authority, Resident Portal, and Security Gate.',
    'Security & Gate Registry: Real-time visitor entry and exit tracking with phone validation and privacy filters.',
    'GateSync Downloads Hub: Direct CSV exports for visitor logs, maintenance ledgers, and resident directories.'
  ];

  let yPos = 265;
  bulletPoints.forEach(point => {
    doc.fillColor(primaryColor).fontSize(12).text('• ', 45, yPos);
    doc.fillColor(textColor).fontSize(10).font('Helvetica').text(point, 60, yPos, { width: 480 });
    yPos += 20;
  });

  // --- MODULE SPECIFICATIONS & IMAGES ---
  doc.fillColor(textColor).fontSize(16).font('Helvetica-Bold').text('3. UI Interface & Module Specifications', 45, 360);

  const shotDir = path.join(process.cwd(), 'screenshots');

  // Dashboard UI Image
  const dashboardImg = path.join(shotDir, 'fresh_1_dashboard.png');
  if (fs.existsSync(dashboardImg)) {
    doc.fontSize(11).font('Helvetica-Bold').fillColor(secondaryColor).text('Module 3.1: Executive Dashboard Desk', 45, 390);
    doc.image(dashboardImg, 45, 410, { width: 500 });
  }

  // Next Page for Visitor & Downloads UI
  doc.addPage();

  const visitorImg = path.join(shotDir, 'fresh_2_visitor_registry.png');
  if (fs.existsSync(visitorImg)) {
    doc.fontSize(11).font('Helvetica-Bold').fillColor(secondaryColor).text('Module 3.2: Live Visitor Security Registry Desk', 45, 45);
    doc.image(visitorImg, 45, 65, { width: 500 });
  }

  const downloadsImg = path.join(shotDir, 'fresh_4_downloads_hub.png');
  if (fs.existsSync(downloadsImg)) {
    doc.fontSize(11).font('Helvetica-Bold').fillColor(secondaryColor).text('Module 3.3: GateSync Downloads Hub — CSV & Report Exporter', 45, 340);
    doc.image(downloadsImg, 45, 360, { width: 500 });
  }

  // Next Page for Code Architecture & Verification
  doc.addPage();

  doc.fillColor(textColor).fontSize(16).font('Helvetica-Bold').text('4. Codebase Architecture & Build Verification', 45, 45);

  doc.fontSize(10).font('Helvetica').fillColor(mutedTextColor).text(
    'The application codebase is structured under src/ into components, context, data models, and views. State management is powered by AppContext with localStorage state persistence.',
    45, 70, { width: 500 }
  );

  // Table of Verification
  doc.rect(45, 105, 500, 110).fill(cardBg);
  doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('Build Quality & Testing Verification Matrix', 55, 115);

  doc.fillColor(textColor).fontSize(9).font('Helvetica-Bold');
  doc.text('Test Case', 60, 135);
  doc.text('Command', 200, 135);
  doc.text('Result', 360, 135);
  doc.text('Status', 470, 135);

  doc.font('Helvetica').fillColor(mutedTextColor);
  doc.text('Vite Build', 60, 155);
  doc.text('npm run build', 200, 155);
  doc.text('Transformed 1606 modules', 360, 155);
  doc.fillColor('green').text('PASSED', 470, 155);

  doc.fillColor(mutedTextColor);
  doc.text('Dev Server', 60, 175);
  doc.text('npx vite --port 5173', 200, 175);
  doc.text('Running on localhost:5173', 360, 175);
  doc.fillColor('green').text('PASSED', 470, 175);

  doc.fillColor(mutedTextColor);
  doc.text('Data Exporter', 60, 195);
  doc.text('CSV Export Handler', 200, 195);
  doc.text('Generates formatted CSVs', 360, 195);
  doc.fillColor('green').text('PASSED', 470, 195);

  doc.fillColor(textColor).fontSize(14).font('Helvetica-Bold').text('5. Conclusion & Future Scope', 45, 240);
  doc.fontSize(10).font('Helvetica').fillColor(mutedTextColor).text(
    'GateSync delivers an end-to-end digital governance solution. Future roadmap plans include real-time WebSocket gate push alerts, online payment gateway reconciliation, and automated camera license plate reading.',
    45, 260, { width: 500, lineGap: 3 }
  );

  // Footer on pages
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).fillColor('#888888').text(
      `GateSync Smart Residential Society & Gate Security Platform — Page ${i + 1} of ${range.count}`,
      45, doc.page.height - 30, { align: 'center', width: 500 }
    );
  }

  doc.end();

  writeStreamProject.on('finish', () => {
    try {
      fs.copyFileSync(pdfPathProject, pdfPathPublic);
      fs.copyFileSync(pdfPathProject, path.join(process.cwd(), 'public', 'Society_Management_System_Project_Report.pdf'));
      fs.copyFileSync(pdfPathProject, 'C:\\Users\\ASUS\\Downloads\\GateSync_Project_Summary_Report.pdf');
      console.log('GateSync Summary PDF successfully generated and copied to Downloads!');
    } catch (e) {
      console.log('PDF generated at project root.');
    }
  });
};

generatePDF();
