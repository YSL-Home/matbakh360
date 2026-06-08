/**
 * enrich-static-pages.mjs
 * Sur chaque page SEO statique:
 *  1. Injecte BreadcrumbList schema.org (SERP rich snippets)
 *  2. Injecte un bloc "Recettes/Restos/Vidéos similaires" (internal linking)
 *  3. Boost crawl depth + dwell time
 */
import fs from 'fs';
import path from 'path';

const BASE = 'https://matbakh360.com';
const esc = (s) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

const recipes = JSON.parse(fs.readFileSync('data/recipes.json','utf8'));
const restos  = JSON.parse(fs.readFileSync('data/restos.json','utf8'));
const vids    = JSON.parse(fs.readFileSync('data/vids.json','utf8'));

const recIdx = JSON.parse(fs.readFileSync('recipes/index.json','utf8'));
const rstIdx = JSON.parse(fs.readFileSync('restaurants/index.json','utf8'));
const vidIdx = JSON.parse(fs.readFileSync('videos/index.json','utf8'));

const recById = Object.fromEntries(recipes.map(r => [r.id, r]));
const rstById = Object.fromEntries(restos.map(r => [r.id, r]));
const vidById = Object.fromEntries(vids.map(v => [v.id, v]));

const recSlugById = Object.fromEntries(recIdx.map(e => [e.id, e.slug]));
const rstSlugById = Object.fromEntries(rstIdx.map(e => [e.id, e.slug]));
const vidSlugById = Object.fromEntries(vidIdx.map(e => [e.id, e.slug]));

// Pré-build par catégorie / cuisine / ville
const recByCat = {};
for (const r of recipes) (recByCat[r.cat] ||= []).push(r);
const rstByCity = {};
for (const r of restos) {
  const k = r.cityEn || r.city;
  if (k) (rstByCity[k] ||= []).push(r);
}
const rstByCuisine = {};
for (const r of restos) {
  const k = (r.cuisine||'').toLowerCase();
  if (k) (rstByCuisine[k] ||= []).push(r);
}

const STYLE = `<style>.mb360-related{margin:32px auto;max-width:1100px;padding:0 20px;font-family:-apple-system,system-ui,sans-serif;}
.mb360-related h2{font-size:18px;color:#C2410C;margin:0 0 14px;font-weight:800;}
.mb360-related .mb360-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;}
.mb360-related a{background:#fff;border:1px solid #eee;border-radius:10px;padding:10px;text-decoration:none;color:#1a1a1a;font-size:13px;transition:.15s;display:block;}
.mb360-related a:hover{border-color:#C2410C;box-shadow:0 4px 14px rgba(0,0,0,.06);transform:translateY(-1px);}
.mb360-related a img{width:100%;height:90px;object-fit:cover;border-radius:6px;margin-bottom:6px;}
.mb360-related a .mb360-meta{color:#888;font-size:11px;margin-top:3px;}
.mb360-crumb{max-width:1100px;margin:12px auto 0;padding:0 20px;font-family:-apple-system,system-ui,sans-serif;font-size:13px;color:#888;}
.mb360-crumb a{color:#C2410C;text-decoration:none;}</style>`;

function buildBreadcrumb(items) {
  return {
    '@context':'https://schema.org','@type':'BreadcrumbList',
    itemListElement: items.map((it,i) => ({ '@type':'ListItem', position:i+1, name:it.name, item:it.url }))
  };
}

function buildRelatedBlock(title, items, kind) {
  if (!items.length) return '';
  const cards = items.map(it => {
    const img = it.img || `${BASE}/favicon.svg`;
    return `<a href="${esc(it.url)}"><img src="${esc(img)}" loading="lazy" alt="${esc(it.title)}"><div>${esc(it.title)}</div><div class="mb360-meta">${esc(it.meta||'')}</div></a>`;
  }).join('');
  return `<div class="mb360-related"><h2>${esc(title)}</h2><div class="mb360-grid">${cards}</div></div>`;
}

function pickRelatedRecipes(r, n=8) {
  const pool = (recByCat[r.cat]||[]).filter(x => x.id !== r.id);
  return pool.sort(() => 0.5 - Math.random()).slice(0, n).map(x => ({
    url: `${BASE}/recipes/${recSlugById[x.id]||''}.html`,
    title: x.ti || 'وصفة',
    img: x.img,
    meta: `⏱ ${x.tm||''} · ⭐ ${x.rt||''}`,
  })).filter(x => x.url.includes('.html') && !x.url.endsWith('/.html'));
}
function pickRelatedRestos(r, n=8) {
  const city = r.cityEn || r.city;
  const pool = (rstByCity[city]||[]).filter(x => x.id !== r.id);
  return pool.sort(() => 0.5 - Math.random()).slice(0, n).map(x => ({
    url: `${BASE}/restaurants/${rstSlugById[x.id]||''}.html`,
    title: x.nameEn || x.name || 'مطعم',
    img: x.img,
    meta: `⭐ ${x.rating||''} · ${x.cuisine||''}`,
  })).filter(x => x.url.includes('.html') && !x.url.endsWith('/.html'));
}
function pickRelatedVideos(v, n=8) {
  const pool = vids.filter(x => x.id !== v.id && x.channel === v.channel);
  const fallback = vids.filter(x => x.id !== v.id);
  const list = pool.length >= n ? pool : [...pool, ...fallback].slice(0, n);
  return list.slice(0, n).map(x => ({
    url: `${BASE}/videos/${vidSlugById[x.id]||''}.html`,
    title: x.title || x.titleAr || 'فيديو',
    img: x.thumb || x.thumbnail,
    meta: x.channel || '',
  })).filter(x => x.url.includes('.html') && !x.url.endsWith('/.html'));
}

function injectInto(html, breadcrumbObj, breadcrumbHtml, relatedHtml) {
  if (html.includes('mb360-related')) return html; // déjà enrichi
  // schema breadcrumb avant </head>
  const breadcrumbScript = `<script type="application/ld+json">${JSON.stringify(breadcrumbObj)}</script>${STYLE}`;
  html = html.replace('</head>', `${breadcrumbScript}\n</head>`);
  // breadcrumb visible + related avant </body>
  html = html.replace('</body>', `${breadcrumbHtml}${relatedHtml}\n</body>`);
  return html;
}

let processed = 0, skipped = 0;

// ── Recettes ────────────────────────────────────────────────────────────
for (const f of fs.readdirSync('recipes').filter(f => f.endsWith('.html'))) {
  const p = path.join('recipes', f);
  let h = fs.readFileSync(p, 'utf8');
  if (h.includes('mb360-related')) { skipped++; continue; }
  const m = h.match(/\/#recipe\/'?\+'?'?([a-zA-Z0-9_]+)'?/);
  if (!m) { skipped++; continue; }
  const r = recById[m[1]];
  if (!r) { skipped++; continue; }
  const url = `${BASE}/recipes/${f.replace('.html','')}.html`;
  const breadcrumbObj = buildBreadcrumb([
    { name: 'الرئيسية', url: BASE },
    { name: r.cat || 'وصفات', url: `${BASE}/?cat=${encodeURIComponent(r.cat||'')}` },
    { name: r.ti || 'وصفة', url },
  ]);
  const crumb = `<div class="mb360-crumb"><a href="${BASE}">🏠 الرئيسية</a> › ${esc(r.cat||'')} › ${esc(r.ti||'')}</div>`;
  const related = buildRelatedBlock('🍽️ وصفات مشابهة', pickRelatedRecipes(r, 8), 'recipe');
  h = injectInto(h, breadcrumbObj, crumb, related);
  fs.writeFileSync(p, h, 'utf8');
  processed++;
  if (processed % 2000 === 0) console.log(`  recettes ${processed}…`);
}

// ── Restos ──────────────────────────────────────────────────────────────
for (const f of fs.readdirSync('restaurants').filter(f => f.endsWith('.html'))) {
  const p = path.join('restaurants', f);
  let h = fs.readFileSync(p, 'utf8');
  if (h.includes('mb360-related')) { skipped++; continue; }
  const m = h.match(/\/#restaurant\/'?\+'?'?([a-zA-Z0-9_]+)'?/);
  if (!m) { skipped++; continue; }
  const r = rstById[m[1]];
  if (!r) { skipped++; continue; }
  const url = `${BASE}/restaurants/${f.replace('.html','')}.html`;
  const city = r.cityEn || r.city || '';
  const breadcrumbObj = buildBreadcrumb([
    { name: 'الرئيسية', url: BASE },
    { name: city, url: `${BASE}/?city=${encodeURIComponent(city)}` },
    { name: r.nameEn || r.name || 'مطعم', url },
  ]);
  const crumb = `<div class="mb360-crumb"><a href="${BASE}">🏠 الرئيسية</a> › ${esc(city)} › ${esc(r.nameEn||r.name||'')}</div>`;
  const related = buildRelatedBlock('🍴 مطاعم أخرى في نفس المدينة', pickRelatedRestos(r, 8), 'resto');
  h = injectInto(h, breadcrumbObj, crumb, related);
  fs.writeFileSync(p, h, 'utf8');
  processed++;
  if (processed % 2000 === 0) console.log(`  total ${processed}…`);
}

// ── Vidéos ──────────────────────────────────────────────────────────────
for (const f of fs.readdirSync('videos').filter(f => f.endsWith('.html'))) {
  const p = path.join('videos', f);
  let h = fs.readFileSync(p, 'utf8');
  if (h.includes('mb360-related')) { skipped++; continue; }
  const m = h.match(/\/#video\/'?\+'?'?([a-zA-Z0-9_]+)'?/);
  if (!m) { skipped++; continue; }
  const v = vidById[m[1]];
  if (!v) { skipped++; continue; }
  const url = `${BASE}/videos/${f.replace('.html','')}.html`;
  const breadcrumbObj = buildBreadcrumb([
    { name: 'الرئيسية', url: BASE },
    { name: 'فيديوهات', url: `${BASE}/?page=videos` },
    { name: v.title || v.titleAr || 'فيديو', url },
  ]);
  const crumb = `<div class="mb360-crumb"><a href="${BASE}">🏠 الرئيسية</a> › فيديوهات › ${esc(v.title||v.titleAr||'')}</div>`;
  const related = buildRelatedBlock('🎬 فيديوهات مشابهة', pickRelatedVideos(v, 8), 'video');
  h = injectInto(h, breadcrumbObj, crumb, related);
  fs.writeFileSync(p, h, 'utf8');
  processed++;
  if (processed % 2000 === 0) console.log(`  total ${processed}…`);
}

console.log(`\n✅ ${processed} pages enrichies, ${skipped} ignorées`);
