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
  '.png': 'image/png'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath.startsWith('/Gatesync')) reqPath = reqPath.slice('/Gatesync'.length);
  if (!reqPath || reqPath === '/') reqPath = '/index.html';
  let filePath = path.join(distDir, reqPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, 'index.html');
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(5002, async () => {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.join(os.tmpdir(), 'edge_debug_' + Date.now());

  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    'http://localhost:5002/Gatesync/'
  ], { detached: true, stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 2000));
  const res = await fetch('http://127.0.0.1:9223/json/list');
  const targets = await res.json();
  const ws = new WebSocket(targets[0].webSocketDebuggerUrl);

  ws.onopen = () => {
    ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
    ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Runtime.exceptionThrown') {
      console.log('CONSOLE EXCEPTION:', JSON.stringify(data.params.exceptionDetails));
    }
    if (data.method === 'Runtime.consoleAPICalled') {
      console.log('CONSOLE LOG:', data.params.type, data.params.args.map(a => a.value || a.description).join(' '));
    }
  };

  setTimeout(async () => {
    ws.send(JSON.stringify({
      id: 99,
      method: 'Runtime.evaluate',
      params: { expression: 'document.body.innerText' }
    }));
  }, 3000);

  setTimeout(() => {
    try { edgeProc.kill(); } catch (e) {}
    server.close();
    process.exit(0);
  }, 6000);
});
