'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT) || 3000;
const root = path.join(__dirname, '..', 'dist');
const indexPath = path.join(root, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html not found. Run: npm run build');
  process.exit(1);
}

const indexHtml = fs.readFileSync(indexPath);

const server = http.createServer((req, res) => {
  // SPA: every path serves index.html (client ID comes from URL in the app)
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-cache',
  });
  res.end(indexHtml);
});

server.listen(port, () => {
  console.log(`Asset Tracking — local server`);
  console.log(`  http://localhost:${port}/EIAC`);
  console.log(`  http://localhost:${port}/`);
  console.log('Press Ctrl+C to stop.');
});
