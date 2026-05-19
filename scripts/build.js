'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const appTemplatePath = path.join(root, 'src', 'app.template.html');
const adminTemplatePath = path.join(root, 'src', 'admin.template.html');
const outDir = path.join(root, 'dist');
const outPath = path.join(outDir, 'index.html');
const adminOutDir = path.join(outDir, 'admin');
const adminOutPath = path.join(adminOutDir, 'index.html');

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
const adminPassword = process.env.ADMIN_PASSWORD || '';
const bootstrapAdminUser = process.env.BOOTSTRAP_ADMIN_USER || 'admin';
// Default must stay stable once users exist. Match .env.local / Vercel PORTAL_AUTH_SALT.
const portalSalt =
  process.env.PORTAL_AUTH_SALT ||
  'yak-local-dev-salt-change-for-production';

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    'Warning: SUPABASE_URL and SUPABASE_ANON_KEY are not set. Build will succeed but the app will run offline until Vercel env vars are configured.'
  );
}

function injectSupabase(html) {
  return html
    .replaceAll('__SUPABASE_URL__', supabaseUrl)
    .replaceAll('__SUPABASE_ANON_KEY__', supabaseKey)
    .replaceAll('__SUPABASE_TABLE__', supabaseTable)
    .replaceAll('__PORTAL_AUTH_SALT__', portalSalt);
}

let appHtml = fs.readFileSync(appTemplatePath, 'utf8');
appHtml = injectSupabase(appHtml)
  .replace('__BOOTSTRAP_ADMIN_USER_JSON__', JSON.stringify(bootstrapAdminUser))
  .replace('__ADMIN_PASSWORD_JSON__', JSON.stringify(adminPassword));

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, appHtml, 'utf8');
console.log('Built', outPath);

const publicDir = path.join(root, 'public');
if (fs.existsSync(publicDir)) {
  for (const name of fs.readdirSync(publicDir)) {
    const src = path.join(publicDir, name);
    if (!fs.statSync(src).isFile()) continue;
    const dest = path.join(outDir, name);
    fs.copyFileSync(src, dest);
    console.log('Copied', dest);
  }
}

let adminHtml = fs.readFileSync(adminTemplatePath, 'utf8');
adminHtml = injectSupabase(adminHtml);

fs.mkdirSync(adminOutDir, { recursive: true });
fs.writeFileSync(adminOutPath, adminHtml, 'utf8');
console.log('Built', adminOutPath);
