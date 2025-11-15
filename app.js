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
  // convert local time to UTC, then add 3 hours
  const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
  const target = new Date(utc.getTime() + 3 * 3600 * 1000);

  const y = target.getUTCFullYear();
  const mo = String(target.getUTCMonth() + 1).padStart(2, '0');
  const d = String(target.getUTCDate()).padStart(2, '0');

  let hh = target.getUTCHours(); // 0-23
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
  const content = `APP1 ${ip}\n`;
  try {
    fs.writeFileSync(OUTFILE, content, { encoding: 'utf8' });
    console.log('Wrote:', content.trim(), '->', OUTFILE);
  } catch (err) {
    console.error('Failed to write output file:', err);
  }
  return { ip, content };
}

function buildHtml({ ip, timestamp, fileContents }) {
  // simple, clean, responsive card with copy + refresh
  // fileContents should already be escaped/controlled (we write only plain text to the file)
  const safeFile = (fileContents || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>APP1 - Pod Info</title>
<style>
  :root{
    --bg:#0f172a;
    --card:#0b1220;
    --accent:#60a5fa;
    --muted:#94a3b8;
    --glass: rgba(255,255,255,0.03);
  }

  html,body{
    height:100%;
    margin:0;
    font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial;
    color:#e6eef8;
    overflow:hidden;
    background: radial-gradient(circle at center, #0a1536 0%, #050a1a 100%);
    position: relative;
  }

  /* 🐳 Docker background logo faintly visible */
  body::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: url('https://www.docker.com/wp-content/uploads/2022/03/Moby-logo.png');
    background-repeat: no-repeat;
    background-position: center;
    background-size: 60%;
    opacity: 0.08;
    filter: blur(1px);
    z-index: 0;
  }

  .wrap{
    min-height:100%;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:40px;
    position: relative;
    z-index: 1;
    animation: fadeIn 1.5s ease;
  }

  .card{
    background: rgba(11, 18, 32, 0.7);
    backdrop-filter: blur(14px);
    border-radius:20px;
    box-shadow: 0 12px 40px rgba(2,6,23,0.6);
    padding:40px;
    width:90%;
    max-width:980px;
    border:1px solid rgba(255,255,255,0.05);
    transform: translateY(40px);
    opacity: 0;
    animation: slideUp 1s ease forwards;
  }

  header{
    display:flex;
    align-items:center;
    gap:18px;
    margin-bottom:24px;
    animation: fadeIn 1.4s ease;
  }

  .logo{
    width:70px;
    height:70px;
    border-radius:14px;
    background:linear-gradient(90deg,var(--accent),#7dd3fc);
    display:flex;
    align-items:center;
    justify-content:center;
    color:#04263a;
    font-weight:800;
    font-size:22px;
    box-shadow:0 8px 20px rgba(32,81,230,0.1);
    transform: scale(0.9);
    animation: popIn 1s ease forwards;
  }

  h1{
    margin:0;
    font-size:28px;
  }

  p.lead{
    margin:0;
    color:var(--muted);
    font-size:15px;
  }

  .info{
    display:flex;
    gap:24px;
    align-items:center;
    margin-top:24px;
    flex-wrap:wrap;
    animation: fadeIn 1.6s ease;
  }

  .field{
    background:var(--glass);
    padding:20px;
    border-radius:14px;
    min-width:280px;
    flex:1;
    transition: all 0.3s ease;
  }

  .field:hover{
    transform: translateY(-4px);
    box-shadow: 0 6px 14px rgba(96,165,250,0.2);
  }

  .label{
    font-size:13px;
    color:var(--muted);
    margin-bottom:6px;
  }

  .value{
    font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;
    font-size:22px;
    color:#d6ecff;
  }

  .row{
    display:flex;
    gap:12px;
    margin-top:14px;
    align-items:center;
  }

  button{
    background:transparent;
    border:1px solid rgba(255,255,255,0.1);
    padding:10px 16px;
    border-radius:10px;
    color:inherit;
    cursor:pointer;
    backdrop-filter: blur(6px);
    transition: all 0.3s ease;
    font-size:15px;
  }

  button:hover{
    transform: translateY(-2px);
    border-color: var(--accent);
  }

  button.primary{
    background:linear-gradient(90deg,var(--accent),#7dd3fc);
    color:#022039;
    border:none;
    font-weight:600;
  }

  button.primary:hover{
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 4px 16px rgba(96,165,250,0.4);
  }

  small{color:var(--muted);}
  footer{margin-top:20px;color:var(--muted);font-size:14px;display:flex;justify-content:space-between;align-items:center;}
  pre{margin:0;white-space:pre-wrap;word-break:break-word;}
  @media (max-width:600px){
    .info{flex-direction:column;}
    .field{min-width:auto;}
  }

  /* ✨ Animations ✨ */
  @keyframes fadeIn { from {opacity:0;} to {opacity:1;} }
  @keyframes slideUp { from {opacity:0; transform:translateY(40px);} to {opacity:1; transform:translateY(0);} }
  @keyframes popIn { 0% {transform: scale(0);} 60% {transform: scale(1.1);} 100% {transform: scale(1);} }
</style>


</head>
<body>
<div class="wrap">
  <div class="card" role="main">
    <header>
      <div class="logo">A1</div>
      <div>
        <h1>APP1 - Pod Info</h1>

      </div>
    </header>

    <div class="info">
      <div class="field">
        <div class="label">Service</div>
        <div class="value">APP1</div>

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
  const refreshBtn = document.getElementById('refreshBtn');
  const ipValue = document.getElementById('ipValue');
  const fileContents = document.getElementById('fileContents');
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
  if (req.url === '/' || req.url === '/output' || req.url === '/index.html') {
    // read output file to display exact contents
    let file = '';
    try {
      file = fs.readFileSync(OUTFILE, 'utf8');
    } catch (err) {
      // file may not exist yet - ignore and show N/A
    }
    const ip = getContainerIP();
    const html = buildHtml({ ip, timestamp: formatUTCPlus3(), fileContents: file });
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } else if (req.url === '/refresh') {
    const result = writeOutput();
    const payload = {
      content: result.content,
      timestamp: formatUTCPlus3()
    };
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(payload));
  } else if (req.url === '/raw') {
    // raw text version (same as earlier simple endpoint)
    let file = '';
    try {
      file = fs.readFileSync(OUTFILE, 'utf8');
    } catch (err) {
      file = 'No output yet\n';
    }
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(file);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found\n');
  }
});

// initial write + start server
writeOutput(); // initial write
server.listen(PORT, () => {
  console.log(`Nice UI server listening on port ${PORT}`);
});
