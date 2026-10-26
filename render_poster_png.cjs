const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

const server = http.createServer((req, res) => {
  if (req.url.endsWith('.pdf')) {
    const pdfPath = path.join(process.cwd(), 'GATESYNC_Project_Poster_A2_1Page.pdf');
    res.writeHead(200, { 'Content-Type': 'application/pdf', 'Access-Control-Allow-Origin': '*' });
    fs.createReadStream(pdfPath).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
        <style>body { margin: 0; padding: 0; background: #fff; overflow: hidden; }</style>
      </head>
      <body>
        <canvas id="posterCanvas"></canvas>
        <script>
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          pdfjsLib.getDocument('http://localhost:5013/poster.pdf').promise.then(pdf => {
            pdf.getPage(1).then(page => {
              const scale = 1.2;
              const viewport = page.getViewport({ scale });
              const canvas = document.getElementById('posterCanvas');
              const ctx = canvas.getContext('2d');
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              page.render({ canvasContext: ctx, viewport }).promise.then(() => {
                window.RENDER_DONE = true;
              });
            });
          }).catch(e => {
            console.error(e);
            window.RENDER_DONE = 'error: ' + e.message;
          });
        </script>
      </body>
      </html>
    `);
  }
});

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

server.listen(5013, async () => {
  console.log('Renderer server listening on port 5013');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.join(os.tmpdir(), 'edge_poster_' + Date.now());

  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9244',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1500,2100',
    'http://localhost:5013/'
  ], { detached: true, stdio: 'ignore' });

  await sleep(2500);

  try {
    const res = await fetch('http://127.0.0.1:9244/json/new?http://localhost:5013/', { method: 'PUT' });
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

    console.log('Waiting for PDF.js render...');
    for (let i = 0; i < 40; i++) {
      await sleep(500);
      const evalRes = await send('Runtime.evaluate', { expression: 'window.RENDER_DONE' });
      if (evalRes && evalRes.result && evalRes.result.value) {
        console.log('Render status:', evalRes.result.value);
        break;
      }
    }

    await sleep(1000);

    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    if (shot && shot.data) {
      const buf = Buffer.from(shot.data, 'base64');
      fs.writeFileSync('d:\\Projects\\GATESYNC\\poster_preview.png', buf);
      fs.writeFileSync('C:\\Users\\ASUS\\.gemini\\antigravity-ide\\brain\\fa14f572-6efc-4bce-a23e-43719378adbf\\poster_preview.png', buf);
      console.log('Poster screenshot saved successfully: ' + buf.length + ' bytes');
    }
  } catch (err) {
    console.error('Error during poster render:', err);
  } finally {
    try { edgeProc.kill(); } catch (e) {}
    server.close();
    process.exit(0);
  }
});
