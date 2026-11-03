#!/usr/bin/env node
/**
 * Builds a self-hosted Expo Go update that anyone can open (no Expo account).
 *
 * Expo Go only lets account members open EAS Update projects, but it still loads
 * self-hosted updates that follow the Expo Updates protocol and ship plain
 * JavaScript bundles. This script turns `expo export --no-bytecode` output into
 * that format and places it inside the web build so a single static host
 * (Vercel) serves both:
 *
 *   https://<host>/            → web app
 *   exps://<host>/expo-go      → Expo Go (manifest picked by the expo-platform header, see vercel.json)
 *
 * Usage (after exporting):
 *   npx expo export --platform ios --platform android --no-bytecode --output-dir dist-native
 *   node scripts/build-expo-go.mjs [--native dist-native] [--out dist-web/expo-go] [--base https://host/expo-go]
 */
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const root = process.cwd();
const nativeDir = path.resolve(root, args.native ?? 'dist-native');
const outDir = path.resolve(root, args.out ?? 'dist-web/expo-go');
const host = process.env.EXPO_GO_HOST ?? 'solaris-explorer.vercel.app';
const baseUrl = (args.base ?? `https://${host}/expo-go`).replace(/\/$/, '');

const CONTENT_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  ttf: 'font/ttf',
  otf: 'font/otf',
  woff: 'font/woff',
  woff2: 'font/woff2',
  json: 'application/json',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  mp4: 'video/mp4',
};

const sha256url = (buf) => crypto.createHash('sha256').update(buf).digest('base64url');
const md5 = (buf) => crypto.createHash('md5').update(buf).digest('hex');
/** Deterministic RFC-4122-shaped UUID derived from content. */
function uuidFrom(seed) {
  const h = crypto.createHash('sha256').update(seed).digest('hex');
  const variant = ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${variant}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

const metadata = JSON.parse(fs.readFileSync(path.join(nativeDir, 'metadata.json'), 'utf8'));

// Public app config, as Expo Go expects in extra.expoClient.
const config = JSON.parse(
  execFileSync('npx', ['expo', 'config', '--type', 'public', '--json'], { cwd: root, encoding: 'utf8', env: { ...process.env, CI: '1' } }),
);
const sdkVersion = config.sdkVersion;
const runtimeVersion = `exposdk:${sdkVersion}`;
// Detach from EAS so Expo Go treats this as a plain self-hosted project.
delete config.updates;
delete config.owner;
delete config.runtimeVersion;
if (config.extra) delete config.extra.eas;

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
const createdAt = new Date().toISOString();
const copied = new Set();

function publish(relPath) {
  const src = path.join(nativeDir, relPath);
  const dest = path.join(outDir, relPath);
  if (!copied.has(relPath)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    copied.add(relPath);
  }
  return fs.readFileSync(src);
}

const summary = [];
for (const platform of ['ios', 'android']) {
  const meta = metadata.fileMetadata?.[platform];
  if (!meta) throw new Error(`No ${platform} bundle in ${nativeDir}/metadata.json — export with --platform ${platform}`);
  if (meta.bundle.endsWith('.hbc')) throw new Error('Expo Go needs plain JS for self-hosted updates: export with --no-bytecode');

  const bundle = publish(meta.bundle);
  const assets = meta.assets.map(({ path: p, ext }) => {
    const buf = publish(p);
    return {
      hash: sha256url(buf),
      key: path.basename(p), // Metro's md5 file hash — what expo-asset looks assets up by
      contentType: CONTENT_TYPES[ext] ?? 'application/octet-stream',
      fileExtension: `.${ext}`,
      url: `${baseUrl}/${p}`,
    };
  });

  const manifest = {
    id: uuidFrom(`${platform}:${sha256url(bundle)}:${assets.map((a) => a.hash).join(',')}`),
    createdAt,
    runtimeVersion,
    launchAsset: {
      hash: sha256url(bundle),
      key: md5(bundle),
      contentType: 'application/javascript',
      url: `${baseUrl}/${meta.bundle}`,
    },
    assets,
    metadata: {},
    extra: {
      expoClient: { ...config, sdkVersion },
      scopeKey: `@anonymous/${config.slug}-${host}`,
    },
  };
  fs.writeFileSync(path.join(outDir, `${platform}.json`), JSON.stringify(manifest));
  summary.push(`${platform}: bundle ${(bundle.length / 1e6).toFixed(2)} MB, ${assets.length} assets`);
}

// Landing page for people who open the link in a browser.
const deepLink = `exps://${host}/expo-go`;
fs.writeFileSync(
  path.join(outDir, 'index.html'),
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SOLARIS · Open in Expo Go</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#03040a;color:#fff;font:16px/1.5 -apple-system,system-ui,sans-serif}
main{max-width:420px;padding:32px 20px;text-align:center}h1{letter-spacing:.3em;font-size:28px;margin:0 0 4px}p{color:#aab}
a.btn{display:block;margin:20px 0;padding:16px;border-radius:16px;background:linear-gradient(135deg,#7c8cff,#5ee7ff);color:#060815;font-weight:600;text-decoration:none}
img{width:240px;height:240px;background:#fff;border-radius:16px;padding:12px}code{word-break:break-all;color:#cfd5ff;font-size:13px}</style></head>
<body><main><h1>SOLARIS</h1><p>Solar System Explorer · runs in Expo Go (SDK ${sdkVersion})</p>
<a class="btn" href="${deepLink}">Open in Expo Go</a>
<img src="/expo-go/qr.png" alt="QR code for ${deepLink}"><p>On iPhone, scan with the Camera app. On Android, scan from inside Expo Go.<br>No Expo account needed.</p>
<p><code>${deepLink}</code></p><p><a style="color:#aab4ff" href="/">Or use the web version</a></p></main></body></html>`,
);
const qr = path.join(root, 'docs', 'expo-go-qr.png');
if (fs.existsSync(qr)) fs.copyFileSync(qr, path.join(outDir, 'qr.png'));

console.log(`Expo Go update written to ${path.relative(root, outDir)} (${runtimeVersion})\n  ${summary.join('\n  ')}\n  open: ${deepLink}`);
