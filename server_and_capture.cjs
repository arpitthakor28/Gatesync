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

server.listen(5007, async () => {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.join(os.tmpdir(), 'edge_cap_' + Date.now());

  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9227',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1440,900',
    'http://localhost:5007/Gatesync/'
  ], { detached: true, stdio: 'ignore' });

  await sleep(2000);
  const res = await fetch('http://127.0.0.1:9227/json/new?http://localhost:5007/Gatesync/', { method: 'PUT' });
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
  await sleep(3500);

  async function takeScreenshot(name) {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(res.data, 'base64');
    const outPath = path.join(process.cwd(), 'screenshots', name);
    fs.writeFileSync(outPath, buf);
    console.log(`✅ Saved screenshot: ${name} (${buf.length} bytes)`);
  }

  // 1. Dashboard
  console.log('1. Capturing Dashboard...');
  await takeScreenshot('fresh_1_dashboard.png');

  // 2. Hash to #/registry
  console.log('2. Navigating to #/registry...');
  await send('Runtime.evaluate', { expression: `window.location.hash = '#/registry';` });
  await sleep(1500);
  await takeScreenshot('fresh_2_visitor_registry.png');

  // 3. Hash to #/billing
  console.log('3. Navigating to #/billing...');
  await send('Runtime.evaluate', { expression: `window.location.hash = '#/billing';` });
  await sleep(1500);
  await takeScreenshot('fresh_3_maintenance_billing.png');

  // 4. Hash to #/downloads
  console.log('4. Navigating to #/downloads...');
  await send('Runtime.evaluate', { expression: `window.location.hash = '#/downloads';` });
  await sleep(1500);
  await takeScreenshot('fresh_4_downloads_hub.png');

  // 5. Open Guard Quick Delivery Modal or Pass Modal
  console.log('5. Navigating to #/registry and clicking Quick Delivery button...');
  await send('Runtime.evaluate', { expression: `window.location.hash = '#/registry';` });
  await sleep(1000);
  await send('Runtime.evaluate', {
    expression: `
      const btns = Array.from(document.querySelectorAll('button'));
      const qBtn = btns.find(b => b.textContent && (b.textContent.includes('Quick Delivery') || b.textContent.includes('1-Tap') || b.textContent.includes('Pre-Approved Pass')));
      if (qBtn) qBtn.click();
    `
  });
  await sleep(1500);
  await takeScreenshot('fresh_5_delivery_modal.png');

  ws.close();
  try { edgeProc.kill(); } catch (e) {}
  server.close();
  console.log('🎉 ALL 5 FRESH SCREENSHOTS CAPTURED WITH REAL HASH ROUTING!');
  process.exit(0);
});
