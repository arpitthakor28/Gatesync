const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

const distDir = path.join(process.cwd(), 'dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath.startsWith('/Gatesync')) {
    reqPath = reqPath.slice('/Gatesync'.length);
  }
  if (!reqPath || reqPath === '/') reqPath = '/index.html';

  let filePath = path.join(distDir, reqPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': mimeTypes[ext] || 'application/octet-stream',
    'Access-Control-Allow-Origin': '*'
  });
  fs.createReadStream(filePath).pipe(res);
});

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

server.listen(5015, async () => {
  console.log('Capture server running on port 5015');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.join(os.tmpdir(), 'edge_fig_' + Date.now());

  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9255',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1440,900',
    'http://localhost:5015/Gatesync/'
  ], { detached: true, stdio: 'ignore' });

  await sleep(2500);

  try {
    const res = await fetch('http://127.0.0.1:9255/json/new?http://localhost:5015/Gatesync/', { method: 'PUT' });
    const target = await res.json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    let msgId = 1;
    const pending = new Map();
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && pending.has(data.id)) {
        const { resolve, reject } = pending.get(data.id);
        pending.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };

    await new Promise(r => { ws.onopen = r; });

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');

    console.log('Waiting for app to hydrate...');
    await sleep(2000);

    // Navigate to Visitor Registry
    console.log('Navigating to Visitor Registry...');
    await send('Runtime.evaluate', {
      expression: `
        window.location.hash = '#/registry';
      `
    });
    await sleep(1500);

    // Open Register Gate Visitor modal
    console.log('Opening Register Gate Visitor modal...');
    await send('Runtime.evaluate', {
      expression: `
        const btns = Array.from(document.querySelectorAll('button'));
        const regBtn = btns.find(b => b.textContent && b.textContent.includes('Register Gate Visitor'));
        if (regBtn) regBtn.click();
      `
    });
    await sleep(1000);

    // Fill in realistic visitor details for the screenshot
    await send('Runtime.evaluate', {
      expression: `
        const inputs = Array.from(document.querySelectorAll('.modal-content input'));
        if (inputs[0]) inputs[0].value = 'Rahul Verma (Plumber / Repair)';
        if (inputs[1]) inputs[1].value = '9876543210';
        if (inputs[2]) inputs[2].value = 'GJ-05-AB-4321';
      `
    });
    await sleep(500);

    // Capture Figure 8.2
    console.log('Capturing Figure 8.2: Visitor Registration Desk Modal...');
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    const buf1 = Buffer.from(shot1.data, 'base64');
    fs.writeFileSync(path.join(process.cwd(), 'screenshots', 'fresh_fig_8_2_registration.png'), buf1);
    console.log('Saved fresh_fig_8_2_registration.png:', buf1.length, 'bytes');

    // Close the modal
    await send('Runtime.evaluate', {
      expression: `
        const closeBtn = document.querySelector('.modal-close');
        if (closeBtn) closeBtn.click();
      `
    });
    await sleep(800);

    // Switch to Resident role if available, or trigger incoming visitor alert
    console.log('Triggering Incoming Visitor Arrival Alert Modal...');
    await send('Runtime.evaluate', {
      expression: `
        if (window.__setIncomingVisitor) {
          window.__setIncomingVisitor({
            id: 'VIS-9021',
            visitorName: 'Ramesh Patel (Swiggy Delivery)',
            visitorPhone: '9876112233',
            flatNumber: 'A-101',
            purpose: 'Food Delivery Order #8921',
            vehicleNumber: 'GJ-05-DL-8842',
            photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
            createdAt: new Date().toISOString()
          });
        }
      `
    });
    await sleep(1200);

    // Capture Figure 8.3
    console.log('Capturing Figure 8.3: Resident Real-Time Arrival Alert Modal...');
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    const buf2 = Buffer.from(shot2.data, 'base64');
    fs.writeFileSync(path.join(process.cwd(), 'screenshots', 'fresh_fig_8_3_arrival_alert.png'), buf2);
    console.log('Saved fresh_fig_8_3_arrival_alert.png:', buf2.length, 'bytes');

  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    try { edgeProc.kill(); } catch (e) {}
    server.close();
    process.exit(0);
  }
});
