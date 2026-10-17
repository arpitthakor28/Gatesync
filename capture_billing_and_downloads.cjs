const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');
const distDir = path.join(process.cwd(), 'dist');

const mimeTypes = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath.startsWith('/Gatesync')) reqPath = reqPath.slice('/Gatesync'.length);
  if (!reqPath || reqPath === '/') reqPath = '/index.html';
  let filePath = path.join(distDir, reqPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) filePath = path.join(distDir, 'index.html');
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(5015, async () => {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.join(os.tmpdir(), 'edge_clean2_' + Date.now());
  const edgeProc = spawn(edgePath, [
    '--headless=new', '--remote-debugging-port=9235', '--disable-gpu',
    `--user-data-dir=${userDataDir}`, '--window-size=1440,900', 'http://localhost:5015/Gatesync/'
  ], { detached: true, stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 2000));
  const res = await fetch('http://127.0.0.1:9235/json/new?http://localhost:5015/Gatesync/', { method: 'PUT' });
  const target = await res.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

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

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Runtime.evaluate', { expression: `localStorage.setItem('gatesync_notif_prompt_dismissed', 'true');` });
  await send('Page.navigate', { url: 'http://localhost:5015/Gatesync/' });
  await new Promise(r => setTimeout(r, 3500));

  // Click Maintenance Billing
  await send('Runtime.evaluate', {
    expression: `Array.from(document.querySelectorAll('button, a')).find(b => b.textContent && b.textContent.includes('Maintenance Billing')).click();`
  });
  await new Promise(r => setTimeout(r, 1200));
  let shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/fresh_3_maintenance_billing.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved screenshots/fresh_3_maintenance_billing.png');

  // Click GateSync Downloads
  await send('Runtime.evaluate', {
    expression: `Array.from(document.querySelectorAll('button, a')).find(b => b.textContent && b.textContent.includes('GateSync Downloads')).click();`
  });
  await new Promise(r => setTimeout(r, 1200));
  shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/fresh_4_downloads_hub.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved screenshots/fresh_4_downloads_hub.png');

  ws.close();
  try { process.kill(edgeProc.pid); } catch(e){}
  server.close();
  process.exit(0);
});
