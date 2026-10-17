const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const distDir = path.join(process.cwd(), 'dist');

const server = http.createServer((req, res) => {
  let p = req.url.split('?')[0].replace('/Gatesync', '');
  if (!p || p === '/') p = '/index.html';
  const f = path.join(distDir, p);
  const ext = path.extname(f);
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
  res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

server.listen(5003, async () => {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--disable-gpu',
    '--user-data-dir=' + path.join(os.tmpdir(), 'edge_' + Date.now())
  ]);

  await new Promise(r => setTimeout(r, 1500));
  const res = await fetch('http://127.0.0.1:9224/json/new?http://localhost:5003/Gatesync/', { method: 'PUT' });
  const target = await res.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  ws.onopen = () => {
    ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
    ws.send(JSON.stringify({ id: 2, method: 'Page.enable' }));
  };

  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.method === 'Runtime.consoleAPICalled') {
      console.log('LOG:', m.params.args.map(a => a.value || a.description).join(' '));
    }
    if (m.method === 'Runtime.exceptionThrown') {
      console.error('EXCEPTION:', m.params.exceptionDetails.text, m.params.exceptionDetails.exception?.description);
    }
    if (m.id === 10) {
      console.log('ROOT HTML:', m.result.result.value);
    }
  };

  setTimeout(() => {
    ws.send(JSON.stringify({
      id: 10,
      method: 'Runtime.evaluate',
      params: { expression: 'document.querySelector("#root") ? document.querySelector("#root").innerHTML.substring(0, 500) : "no-root"' }
    }));
  }, 3500);

  setTimeout(() => {
    try { edge.kill(); } catch (e) {}
    server.close();
    process.exit(0);
  }, 5000);
});
