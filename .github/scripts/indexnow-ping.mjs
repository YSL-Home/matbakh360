/**
 * indexnow-ping.mjs
 * Notifie Bing/Yandex/Seznam/Naver des URLs nouvelles/modifiées via IndexNow (gratuit).
 * Lit recipes/index.json + restaurants/index.json + videos/index.json
 * et ping le sitemap si pas d'index spécifique.
 */
import fs from 'fs';
import https from 'https';

const KEY  = '3759b2162ad7a510cb7226f6f7911296';
const HOST = 'matbakh360.com';
const BASE = `https://${HOST}`;
const KEY_LOC = `${BASE}/${KEY}.txt`;

const load = (p) => fs.existsSync(p) ? JSON.parse(fs.readFileSync(p,'utf8')) : [];
const r = load('recipes/index.json').map(e => `${BASE}/recipes/${e.slug}.html`);
const s = load('restaurants/index.json').map(e => `${BASE}/restaurants/${e.slug}.html`);
const v = load('videos/index.json').map(e => `${BASE}/videos/${e.slug}.html`);

const urls = [BASE+'/', BASE+'/sitemap.xml', ...r, ...s, ...v];
console.log(`📨 IndexNow: ${urls.length} URLs à notifier`);

// IndexNow: max 10 000 URLs par requête
const CHUNK = 9000;
const post = (urlList) => new Promise((resolve, reject) => {
  const body = JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOC, urlList });
  const req = https.request({
    hostname: 'api.indexnow.org', port: 443, path: '/IndexNow', method: 'POST',
    headers: { 'Content-Type':'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) }
  }, res => {
    let d = ''; res.on('data', c => d += c);
    res.on('end', () => resolve({ status: res.statusCode, body: d.slice(0,200) }));
  });
  req.on('error', reject);
  req.write(body); req.end();
});

for (let i = 0; i < urls.length; i += CHUNK) {
  const chunk = urls.slice(i, i + CHUNK);
  const r = await post(chunk);
  console.log(`  chunk ${i/CHUNK + 1}: ${chunk.length} URLs → HTTP ${r.status} ${r.body}`);
}
console.log('✅ IndexNow done');
