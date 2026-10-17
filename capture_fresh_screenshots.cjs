const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function capture() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.join(os.tmpdir(), 'edge_cdp_profile_' + Date.now());

  console.log('1. Launching Edge with remote debugging on port 9222...');
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1440,900',
    'http://localhost:3000/Gatesync/'
  ], { detached: true, stdio: 'ignore' });

  // Wait for port 9222 to be ready
  let targets = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const res = await fetch('http://127.0.0.1:9222/json/list');
      targets = await res.json();
      if (targets && targets.length > 0) break;
    } catch (e) {}
  }

  if (!targets || targets.length === 0) {
    console.error('Could not connect to Edge on port 9222');
    process.exit(1);
  }

  const target = targets.find(t => t.type === 'page') || targets[0];
  console.log('2. Connected to target page:', target.title, target.url);
  const wsUrl = target.webSocketDebuggerUrl;

  const ws = new WebSocket(wsUrl);

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

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  console.log('3. Enabling Page and Runtime...');
  await send('Page.enable');
  await send('Runtime.enable');

  // Navigate to GateSync
  await send('Page.navigate', { url: 'http://localhost:3000/Gatesync/' });
  console.log('4. Waiting 4 seconds for React 19 to hydrate...');
  await sleep(4000);

  async function takeScreenshot(filename) {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(res.data, 'base64');
    const outPath = path.join(process.cwd(), 'screenshots', filename);
    fs.writeFileSync(outPath, buf);
    console.log(`Saved screenshot: ${filename} (${buf.length} bytes)`);
  }

  // 1. Dashboard (Resident view)
  console.log('5. Capturing Resident Dashboard...');
  await takeScreenshot('fresh_1_dashboard.png');

  // 2. Click "Visitor Registry"
  console.log('6. Navigating to Visitor Registry...');
  await send('Runtime.evaluate', {
    expression: `
      const buttons = Array.from(document.querySelectorAll('button, a'));
      const regBtn = buttons.find(b => b.textContent && b.textContent.includes('Visitor Registry'));
      if (regBtn) regBtn.click();
    `
  });
  await sleep(1500);
  await takeScreenshot('fresh_2_visitor_registry.png');

  // 3. Click "Quick Delivery" button if present
  console.log('7. Triggering Quick Delivery modal...');
  await send('Runtime.evaluate', {
    expression: `
      const buttons = Array.from(document.querySelectorAll('button'));
      const delivBtn = buttons.find(b => b.textContent && b.textContent.includes('Quick Delivery') || b.textContent.includes('1-Tap'));
      if (delivBtn) delivBtn.click();
    `
  });
  await sleep(1200);
  await takeScreenshot('fresh_3_quick_delivery_modal.png');

  // Close modal if open
  await send('Runtime.evaluate', {
    expression: `
      const closeBtn = document.querySelector('button[aria-label="Close"], .modal-close');
      if (closeBtn) closeBtn.click();
    `
  });
  await sleep(800);

  // 4. Switch to Staff / Guard mode
  console.log('8. Switching role to Staff (Guard Desk)...');
  await send('Runtime.evaluate', {
    expression: `
      const buttons = Array.from(document.querySelectorAll('button'));
      const guardBtn = buttons.find(b => b.textContent && (b.textContent.trim() === 'Staff' || b.textContent.includes('Guard')));
      if (guardBtn) guardBtn.click();
    `
  });
  await sleep(1500);
  await takeScreenshot('fresh_4_guard_desk.png');

  // 5. Switch to Admin mode
  console.log('9. Switching role to Admin...');
  await send('Runtime.evaluate', {
    expression: `
      const buttons = Array.from(document.querySelectorAll('button'));
      const adminBtn = buttons.find(b => b.textContent && b.textContent.trim() === 'Admin');
      if (adminBtn) adminBtn.click();
    `
  });
  await sleep(1500);
  await takeScreenshot('fresh_5_admin_dashboard.png');

  // 6. Downloads View
  console.log('10. Navigating to Downloads Hub...');
  await send('Runtime.evaluate', {
    expression: `
      const buttons = Array.from(document.querySelectorAll('button, a'));
      const downBtn = buttons.find(b => b.textContent && b.textContent.includes('Downloads'));
      if (downBtn) downBtn.click();
    `
  });
  await sleep(1500);
  await takeScreenshot('fresh_6_downloads_hub.png');

  ws.close();
  try { edgeProc.kill(); } catch (e) {}
  console.log('✅ ALL FRESH SCREENSHOTS CAPTURED SUCCESSFULLY!');
  process.exit(0);
}

capture().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
