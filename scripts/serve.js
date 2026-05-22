'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT) || 3000;
const root = path.join(__dirname, '..', 'dist');
const indexPath = path.join(root, 'index.html');
const adminPath = path.join(root, 'admin', 'index.html');

const MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
};

if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html not found. Run: npm run build');
  process.exit(1);
}

function readIndexHtml() {
  return fs.readFileSync(indexPath, 'utf8');
}
function readAdminHtml() {
  return fs.existsSync(adminPath) ? fs.readFileSync(adminPath, 'utf8') : null;
}

function tryStatic(filePath, res) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return false;
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': 'public, max-age=3600',
  });
  fs.createReadStream(filePath).pipe(res);
  return true;
}

const server = http.createServer((req, res) => {
  const urlPath = (req.url || '/').split('?')[0];

  const adminHtml = readAdminHtml();
  if (adminHtml && (urlPath === '/admin' || urlPath === '/admin/')) {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
    });
    res.end(adminHtml);
    return;
  }

  const staticFile = path.join(root, urlPath.replace(/^\//, ''));
  if (urlPath !== '/' && tryStatic(staticFile, res)) return;

  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
  });
  res.end(readIndexHtml());
});

server.listen(port, () => {
  const hasAdmin = fs.existsSync(adminPath);
  const builtAt = fs.statSync(indexPath).mtime.toISOString();
  console.log(`Asset Tracking — local server`);
  console.log(`  Serving: ${root}`);
  console.log(`  index.html built: ${builtAt}`);
  console.log(`  http://localhost:${port}/          ← login page (new UI)`);
  if (hasAdmin) console.log(`  http://localhost:${port}/admin`);
  console.log(`  http://localhost:${port}/EIAC      ← client app (not root login)`);
  console.log('Press Ctrl+C to stop.');
});
