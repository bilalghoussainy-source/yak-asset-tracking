'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const templatePath = path.join(root, 'src', 'app.template.html');
const outDir = path.join(root, 'dist');
const outPath = path.join(outDir, 'index.html');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvFile(path.join(root, '.env'));
loadEnvFile(path.join(root, '.env.local'));

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';
const supabaseTable = process.env.SUPABASE_TABLE || 'asset_tracker';

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    'Warning: SUPABASE_URL and SUPABASE_ANON_KEY are not set. Build will succeed but the app will run offline until Vercel env vars are configured.'
  );
}

let html = fs.readFileSync(templatePath, 'utf8');
html = html
  .replaceAll('__SUPABASE_URL__', supabaseUrl)
  .replaceAll('__SUPABASE_ANON_KEY__', supabaseKey)
  .replaceAll('__SUPABASE_TABLE__', supabaseTable);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, html, 'utf8');
console.log('Built', outPath);
