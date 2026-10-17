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

server.listen(5011, async () => {
  console.log('Server running on port 5011');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.join(os.tmpdir(), 'edge_clean_' + Date.now());

  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9231',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1440,900',
    'http://localhost:5011/Gatesync/'
  ], { detached: true, stdio: 'ignore' });

  await sleep(2000);
  const res = await fetch('http://127.0.0.1:9231/json/new?http://localhost:5011/Gatesync/', { method: 'PUT' });
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

  // Disable notifications popup
  await send('Runtime.evaluate', {
    expression: `
      localStorage.setItem('gatesync_notif_prompt_dismissed', 'true');
    `
  });

  // Reload to apply dismissed state
  await send('Page.navigate', { url: 'http://localhost:5011/Gatesync/' });
  await sleep(3500);

  async function takeScreenshot(name) {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(res.data, 'base64');
    const outPath = path.join(process.cwd(), 'screenshots', name);
    fs.writeFileSync(outPath, buf);
    console.log(`✅ Saved screenshot: ${name} (${buf.length} bytes)`);
  }

  // 1. Dashboard (Clean, no prompt)
  console.log('1. Capturing Clean Executive Dashboard...');
  await takeScreenshot('fresh_1_dashboard.png');

  // 2. Click "Visitor Gate Registry"
  console.log('2. Navigating to Visitor Registry...');
  await send('Runtime.evaluate', {
    expression: `
      const buttons = Array.from(document.querySelectorAll('button, a'));
      const regBtn = buttons.find(b => b.textContent && b.textContent.includes('Visitor Gate Registry'));
      if (regBtn) regBtn.click();
    `
  });
  await sleep(1500);
  await takeScreenshot('fresh_2_visitor_registry.png');

  // 3. Click "1-Tap Quick Delivery"
  console.log('3. Opening 1-Tap Quick Delivery modal...');
  await send('Runtime.evaluate', {
    expression: `
      const buttons = Array.from(document.querySelectorAll('button'));
      const delBtn = buttons.find(b => b.textContent && b.textContent.includes('1-Tap Quick Delivery'));
      if (delBtn) delBtn.click();
    `
  });
  await sleep(1000);
  await takeScreenshot('fresh_5_delivery_modal.png');

  // Close modal
  await send('Runtime.evaluate', {
    expression: `
      const closeBtn = document.querySelector('button[aria-label="Close"], .modal-close') || Array.from(document.querySelectorAll('button')).find(b => b.innerHTML.includes('lucide-x') || b.textContent === '✕' || b.querySelector('svg'));
      // or click backdrop
      const backdrop = document.querySelector('.fixed.inset-0');
      if (backdrop) backdrop.click();
    `
  });
  await sleep(800);

  // 4. Switch to Guard Role
  console.log('4. Switching to Guard role...');
  await send('Runtime.evaluate', {
    expression: `
      const roleBtns = Array.from(document.querySelectorAll('header button, nav button'));
      const guardBtn = roleBtns.find(b => b.textContent && b.textContent.trim() === 'Guard');
      if (guardBtn) guardBtn.click();
    `
  });
  await sleep(1200);
  await takeScreenshot('fresh_3_guard_desk.png');

  // 5. Open Scan Pass / OTP modal
  console.log('5. Opening Pass Scanner Modal...');
  await send('Runtime.evaluate', {
    expression: `
      const buttons = Array.from(document.querySelectorAll('button'));
      const scanBtn = buttons.find(b => b.textContent && (b.textContent.includes('Scan Pass') || b.textContent.includes('Scan')));
      if (scanBtn) scanBtn.click();
    `
  });
  await sleep(1200);
  await takeScreenshot('fresh_3_pass_scanner.png');

  // Close modal
  await send('Runtime.evaluate', {
    expression: `
      const backdrop = document.querySelector('.fixed.inset-0');
      if (backdrop) backdrop.click();
    `
  });
  await sleep(800);

  // 6. Navigate to GateSync Downloads
  console.log('6. Navigating to GateSync Downloads...');
  await send('Runtime.evaluate', {
    expression: `
      const buttons = Array.from(document.querySelectorAll('button, a'));
      const dlBtn = buttons.find(b => b.textContent && b.textContent.includes('GateSync Downloads'));
      if (dlBtn) dlBtn.click();
    `
  });
  await sleep(1500);
  await takeScreenshot('fresh_4_downloads_hub.png');

  console.log('All fresh screenshots captured cleanly!');
  ws.close();
  try { process.kill(edgeProc.pid); } catch(e){}
  server.close();
  process.exit(0);
});
