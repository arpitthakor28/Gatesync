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

server.listen(5016, async () => {
  console.log('Capture server running on port 5016');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.join(os.tmpdir(), 'edge_quick_' + Date.now());

  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9266',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1440,900',
    'http://localhost:5016/Gatesync/'
  ], { detached: true, stdio: 'ignore' });

  await sleep(2500);

  try {
    const res = await fetch('http://127.0.0.1:9266/json/new?http://localhost:5016/Gatesync/', { method: 'PUT' });
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

    // 1. Navigate to Visitor Registry
    console.log('Navigating to Visitor Registry...');
    await send('Runtime.evaluate', {
      expression: `window.location.hash = '#/registry';`
    });
    await sleep(1500);

    // 2. Click "1-Tap Quick Delivery"
    console.log('Opening 1-Tap Quick Delivery modal...');
    await send('Runtime.evaluate', {
      expression: `
        const btns = Array.from(document.querySelectorAll('button'));
        const qBtn = btns.find(b => b.textContent && b.textContent.includes('1-Tap Quick Delivery'));
        if (qBtn) qBtn.click();
      `
    });
    await sleep(1200);

    // Take screenshot of 1-Tap Quick Delivery modal
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    const buf1 = Buffer.from(shot1.data, 'base64');
    fs.writeFileSync(path.join(process.cwd(), 'screenshots', 'fresh_real_quick_delivery_modal.png'), buf1);
    console.log('Saved fresh_real_quick_delivery_modal.png:', buf1.length, 'bytes');

    // Close modal
    await send('Runtime.evaluate', {
      expression: `
        const closeBtn = document.querySelector('.modal-close, button[aria-label="Close"]');
        if (closeBtn) closeBtn.click();
      `
    });
    await sleep(800);

    // 3. Click "Scan Pass / OTP"
    console.log('Opening Pass Scanner modal...');
    await send('Runtime.evaluate', {
      expression: `
        const btns = Array.from(document.querySelectorAll('button'));
        const sBtn = btns.find(b => b.textContent && b.textContent.includes('Scan Pass / OTP'));
        if (sBtn) sBtn.click();
      `
    });
    await sleep(1200);

    // Take screenshot of Pass Scanner modal
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    const buf2 = Buffer.from(shot2.data, 'base64');
    fs.writeFileSync(path.join(process.cwd(), 'screenshots', 'fresh_pass_scanner_modal.png'), buf2);
    console.log('Saved fresh_pass_scanner_modal.png:', buf2.length, 'bytes');

  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    try { edgeProc.kill(); } catch (e) {}
    server.close();
    process.exit(0);
  }
});
