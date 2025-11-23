// app.js
const fs = require('fs');
const os = require('os');
const http = require('http');
const path = require('path');

const OUTFILE = path.join(__dirname, 'output.txt');
const PORT = process.env.PORT || 3000;

// return first non-internal IPv4 address (or 0.0.0.0 if none)
function getContainerIP() {
  const nets = os.networkInterfaces() || {};
  const addrs = [];
  for (const name of Object.keys(nets)) {
    const ifaces = nets[name] || [];
    for (const iface of ifaces) {
      if (iface && iface.family === 'IPv4' && !iface.internal && iface.address) {
        addrs.push({ iface: name, addr: iface.address });
      }
    }
  }
  return addrs.length > 0 ? addrs[0].addr : '0.0.0.0';
}

// compute a formatted timestamp in UTC+3 in 12-hour format with AM/PM
function formatUTCPlus3() {
  const now = new Date();
  const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
  const target = new Date(utc.getTime() + 2 * 3600 * 1000);

  const y = target.getUTCFullYear();
  const mo = String(target.getUTCMonth() + 1).padStart(2, '0');
  const d = String(target.getUTCDate()).padStart(2, '0');

  let hh = target.getUTCHours();
  const mm = String(target.getUTCMinutes()).padStart(2, '0');
  const ss = String(target.getUTCSeconds()).padStart(2, '0');

  const ampm = hh >= 12 ? 'PM' : 'AM';
  hh = hh % 12;
  if (hh === 0) hh = 12;
  const hhStr = String(hh).padStart(2, '0');

  return `${d}/${mo}/${y} ${hhStr}:${mm}:${ss} ${ampm}`;
}

function writeOutput() {
  const ip = getContainerIP();
  const content = `APP ${ip}\n`;
  try {
    fs.writeFileSync(OUTFILE, content, { encoding: 'utf8' });
    console.log('Wrote:', content.trim(), '->', OUTFILE);
  } catch (err) {
    console.error('Failed to write output file:', err);
  }
  return { ip, content };
}

function buildHtml({ ip, timestamp, fileContents }) {
  const safeFile = (fileContents || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Depi Final Project</title>

<style>
/* (كل الستايلات زي ما هي بدون تغيير) */
</style>

</head>
<body>
<div class="wrap">
  <div class="card" role="main">
    <header>
      <div class="logo">
        <img src="depi.png" alt="Logo" style="width:50px; height:auto;">
      </div>
      <div>
        <h1>APP - Pod Info</h1>
      </div>
    </header>

    <div class="info">
      <div class="field">
        <div class="label">Service</div>
        <div class="value">APP</div>

        <div class="label" style="margin-top:10px">Container IP</div>
        <div class="value" id="ipValue">${ip}</div>

        <div class="row">
          <button class="primary" id="copyBtn">Copy IP</button>
          <small id="msg" style="margin-left:8px"></small>
        </div>
      </div>

      <div class="field">
        <div class="label">Output file</div>
        <pre id="fileContents" style="margin:8px 0;font-size:20px;color:#dff1ff;background:transparent;border-radius:6px;padding:6px;">${safeFile || 'N/A'}</pre>

        <div class="label">Last updated</div>
        <div class="value" id="ts">${timestamp}</div>
      </div>
    </div>

  </div>
</div>

<script>
const copyBtn = document.getElementById('copyBtn');
const ipValue = document.getElementById('ipValue');
const msg = document.getElementById('msg');

function showMsg(t) {
  msg.textContent = t;
  setTimeout(()=> msg.textContent='', 2600);
}

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(ipValue.textContent.trim());
    showMsg('Copied!');
  } catch(err) {
    showMsg('Copy failed');
  }
});
</script>

</body>
</html>`;
}

// server
const server = http.createServer((req, res) => {

  // main page
  if (req.url === '/' || req.url === '/output' || req.url === '/index.html') {

    let file = '';
    try {
      file = fs.readFileSync(OUTFILE, 'utf8');
    } catch (err) {}

    const ip = getContainerIP();
    const html = buildHtml({
      ip,
      timestamp: formatUTCPlus3(),
      fileContents: file
    });

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);

  // refresh endpoint
  } else if (req.url === '/refresh') {

    const result = writeOutput();
    const payload = {
      content: result.content,
      timestamp: formatUTCPlus3()
    };

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(payload));

  // serve image depi.png
  } else if (req.url === '/depi.png') {

    const imgPath = path.join(__dirname, 'depi.png');
    try {
      const img = fs.readFileSync(imgPath);
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(img);
    } catch (err) {
      res.writeHead(404);
      res.end('Image not found');
    }

  // raw file endpoint
  } else if (req.url === '/raw') {

    let file = '';
    try {
      file = fs.readFileSync(OUTFILE, 'utf8');
    } catch (err) {
      file = 'No output yet\n';
    }

    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(file);

  // fallback
  } else {

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found\n');

  }
});

// start server
writeOutput();
server.listen(PORT, () => {
  console.log(`Nice UI server listening on port ${PORT}`);
});
