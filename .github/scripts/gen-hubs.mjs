/**
 * gen-hubs.mjs
 * Génère des pages "hub" SEO long-tail :
 *  - hubs/cuisine/{cuisine}.html       — toutes les recettes d'une cuisine
 *  - hubs/city/{city}.html             — top restos d'une ville
 *  - hubs/category/{cat}.html          — toutes les recettes d'une catégorie
 */
import fs from 'fs';
import path from 'path';

const BASE = 'https://matbakh360.com';
const today = new Date().toISOString().split('T')[0];

const recipes = JSON.parse(fs.readFileSync('data/recipes.json','utf8'));
const restos  = JSON.parse(fs.readFileSync('data/restos.json','utf8'));
const recIdx  = JSON.parse(fs.readFileSync('recipes/index.json','utf8'));
const rstIdx  = JSON.parse(fs.readFileSync('restaurants/index.json','utf8'));
const recSlugById = Object.fromEntries(recIdx.map(e => [e.id, e.slug]));
const rstSlugById = Object.fromEntries(rstIdx.map(e => [e.id, e.slug]));

const esc = (s) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const slugify = (s) => String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase()
  .replace(/[؀-ۿ]+/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').substring(0,60);

const HEAD = (title, desc, canonical) => `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-NTM6B493');</script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6870790039775701" crossorigin="anonymous"></script>
<meta name="google-adsense-account" content="ca-pub-6870790039775701">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<link rel="icon" type="image/svg+xml" href="${BASE}/favicon.svg">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="website">
<style>
body{font-family:-apple-system,system-ui,sans-serif;max-width:1100px;margin:0 auto;padding:24px;background:#fafafa;color:#1a1a1a;}
h1{font-size:30px;margin:0 0 8px;color:#C2410C}
h2{font-size:20px;margin:28px 0 12px;}
p.lead{color:#555;margin:0 0 24px;font-size:15px;line-height:1.6}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;}
.card{background:#fff;border:1px solid #eee;border-radius:12px;padding:12px;text-decoration:none;color:inherit;transition:transform .15s,box-shadow .15s;}
.card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.08);border-color:#C2410C}
.card img{width:100%;height:140px;object-fit:cover;border-radius:8px;}
.card h3{font-size:14px;margin:8px 0 4px;line-height:1.3;}
.card .meta{font-size:12px;color:#888;}
.crumb{font-size:13px;color:#888;margin-bottom:8px}
.crumb a{color:#C2410C;text-decoration:none}
footer{margin-top:48px;padding:24px 0;border-top:1px solid #ddd;text-align:center;font-size:13px;color:#888;}
</style>
</head>
<body>
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NTM6B493" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
`;

const FOOT = `<footer><a href="${BASE}" rel="home" style="color:#C2410C">مطبخ 360 — الرئيسية</a> · <a href="${BASE}/sitemap.xml" style="color:#888">Sitemap</a></footer>
</body></html>`;

fs.mkdirSync('hubs/cuisine',  { recursive: true });
fs.mkdirSync('hubs/city',     { recursive: true });
fs.mkdirSync('hubs/category', { recursive: true });

const hubIndex = [];

// ── CUISINES (par cuisine ID code: esp, fra, ita, …) ──────────────────
const CUIS_LABELS = {
  esp:['Espagnole','إسبانية'],fra:['Française','فرنسية'],ita:['Italienne','إيطالية'],
  jpn:['Japonaise','يابانية'],chn:['Chinoise','صينية'],ind:['Indienne','هندية'],
  mex:['Mexicaine','مكسيكية'],grk:['Grecque','يونانية'],tur:['Turque','تركية'],
  mar:['Marocaine','مغربية'],egy:['Égyptienne','مصرية'],tun:['Tunisienne','تونسية'],
  lbn:['Libanaise','لبنانية'],sau:['Saoudienne','سعودية'],ira:['Iranienne','إيرانية'],
  tha:['Thaïlandaise','تايلاندية'],ken:['Kenyane','كينية'],vnm:['Vietnamienne','فيتنامية'],
  mys:['Malaisienne','ماليزية'],prt:['Portugaise','برتغالية'],pol:['Polonaise','بولندية'],
  ury:['Uruguayenne','أوروغوايية'],gbr:['Britannique','بريطانية'],can:['Canadienne','كندية'],
  jam:['Jamaïcaine','جامايكية'],usa:['Américaine','أمريكية'],bra:['Brésilienne','برازيلية'],
  rus:['Russe','روسية'],kor:['Coréenne','كورية'],phl:['Philippine','فلبينية'],
};

const recipesByCuisine = {};
for (const r of recipes) {
  if (!r.cid) continue;
  (recipesByCuisine[r.cid] ||= []).push(r);
}

let cuisHubs = 0;
for (const [cid, list] of Object.entries(recipesByCuisine)) {
  if (list.length < 3) continue;
  const [labelFr, labelAr] = CUIS_LABELS[cid] || [cid, cid];
  const title = `${list.length}+ recettes ${labelFr} — وصفات ${labelAr} | مطبخ 360`;
  const desc  = `Découvrez ${list.length} recettes authentiques de la cuisine ${labelFr}. Plats traditionnels, ingrédients, étapes détaillées. وصفات ${labelAr} أصيلة مع صور وفيديوهات.`;
  const url   = `${BASE}/hubs/cuisine/${cid}.html`;

  const cards = list.slice(0, 60).map(r => {
    const slug = recSlugById[r.id];
    if (!slug) return '';
    const img = r.img || `${BASE}/favicon.svg`;
    return `<a class="card" href="${BASE}/recipes/${slug}.html"><img src="${esc(img)}" loading="lazy" alt="${esc(r.ti)}"><h3>${esc(r.ti)}</h3><div class="meta">⏱ ${esc(r.tm||'')} · ⭐ ${r.rt||''}</div></a>`;
  }).filter(Boolean).join('\n');

  const html = HEAD(title, desc, url) +
    `<div class="crumb"><a href="${BASE}">🏠 الرئيسية</a> › <a href="${BASE}/hubs/">Hubs</a> › Cuisine ${labelFr}</div>
<h1>Cuisine ${labelFr} — مطبخ ${labelAr}</h1>
<p class="lead">${esc(desc)}</p>
<div class="grid">${cards}</div>` + FOOT;

  fs.writeFileSync(`hubs/cuisine/${cid}.html`, html);
  hubIndex.push({ type:'cuisine', slug:cid, url });
  cuisHubs++;
}

// ── VILLES (par r.city pour restos) ────────────────────────────────────
const restosByCity = {};
for (const r of restos) {
  const key = r.cityEn || (r.city && !/[؀-ۿ]/.test(r.city) ? r.city : null);
  if (!key) continue;
  (restosByCity[key] ||= []).push(r);
}

let cityHubs = 0;
for (const [cityName, list] of Object.entries(restosByCity)) {
  if (list.length < 5) continue;
  const slug = slugify(cityName);
  if (!slug) continue;
  const top = list.sort((a,b) => (b.rating||0) - (a.rating||0)).slice(0, 60);
  const title = `Top ${top.length} restaurants à ${cityName} — مطاعم ${cityName} | مطبخ 360`;
  const desc  = `Découvrez les meilleurs restaurants à ${cityName} : avis, cuisines, prix, adresses, photos. Top ${top.length} adresses notées.`;
  const url   = `${BASE}/hubs/city/${slug}.html`;

  const cards = top.map(r => {
    const rslug = rstSlugById[r.id];
    if (!rslug) return '';
    const img = r.img || `${BASE}/favicon.svg`;
    const name = r.nameEn || r.name || '';
    return `<a class="card" href="${BASE}/restaurants/${rslug}.html"><img src="${esc(img)}" loading="lazy" alt="${esc(name)}"><h3>${esc(name)}</h3><div class="meta">⭐ ${r.rating||''} · ${esc(r.cuisine||'')} · ${esc(r.price||'')}</div></a>`;
  }).filter(Boolean).join('\n');

  const html = HEAD(title, desc, url) +
    `<div class="crumb"><a href="${BASE}">🏠 الرئيسية</a> › <a href="${BASE}/hubs/">Hubs</a> › ${esc(cityName)}</div>
<h1>Top restaurants — ${esc(cityName)}</h1>
<p class="lead">${esc(desc)}</p>
<div class="grid">${cards}</div>` + FOOT;

  fs.writeFileSync(`hubs/city/${slug}.html`, html);
  hubIndex.push({ type:'city', slug, url });
  cityHubs++;
}

// ── CATÉGORIES recettes ───────────────────────────────────────────────
const recipesByCat = {};
for (const r of recipes) {
  if (!r.cat) continue;
  (recipesByCat[r.cat] ||= []).push(r);
}

let catHubs = 0;
for (const [cat, list] of Object.entries(recipesByCat)) {
  if (list.length < 5) continue;
  const slug = slugify(cat) || `cat-${catHubs}`;
  const sample = list.sort((a,b) => (b.rt||0) - (a.rt||0)).slice(0, 80);
  const title = `${list.length}+ وصفات ${cat} — Recettes catégorie ${cat} | مطبخ 360`;
  const desc  = `Toutes les recettes de la catégorie ${cat} sur Matbakh 360. ${list.length} recettes avec photos, étapes, conseils. كل وصفات ${cat}.`;
  const url   = `${BASE}/hubs/category/${slug}.html`;

  const cards = sample.map(r => {
    const rslug = recSlugById[r.id];
    if (!rslug) return '';
    const img = r.img || `${BASE}/favicon.svg`;
    return `<a class="card" href="${BASE}/recipes/${rslug}.html"><img src="${esc(img)}" loading="lazy" alt="${esc(r.ti)}"><h3>${esc(r.ti)}</h3><div class="meta">⏱ ${esc(r.tm||'')} · ⭐ ${r.rt||''}</div></a>`;
  }).filter(Boolean).join('\n');

  const html = HEAD(title, desc, url) +
    `<div class="crumb"><a href="${BASE}">🏠 الرئيسية</a> › <a href="${BASE}/hubs/">Hubs</a> › ${esc(cat)}</div>
<h1>${esc(cat)} — وصفات</h1>
<p class="lead">${esc(desc)}</p>
<div class="grid">${cards}</div>` + FOOT;

  fs.writeFileSync(`hubs/category/${slug}.html`, html);
  hubIndex.push({ type:'category', slug, url });
  catHubs++;
}

// ── Index des hubs ────────────────────────────────────────────────────
const indexCards = hubIndex.map(h => `<a class="card" style="padding:18px" href="${h.url}"><h3>${h.type === 'cuisine' ? '🍽️' : h.type === 'city' ? '🏙️' : '📂'} ${h.slug}</h3><div class="meta">${h.type}</div></a>`).join('\n');
const indexHtml = HEAD('Tous les hubs SEO — Matbakh 360', `Index complet des ${hubIndex.length} pages catégories, cuisines et villes de Matbakh 360.`, `${BASE}/hubs/`) +
  `<h1>Hubs Matbakh 360</h1>
<p class="lead">${hubIndex.length} pages thématiques : ${cuisHubs} cuisines, ${cityHubs} villes, ${catHubs} catégories.</p>
<div class="grid">${indexCards}</div>` + FOOT;
fs.writeFileSync('hubs/index.html', indexHtml);
fs.writeFileSync('hubs/index.json', JSON.stringify(hubIndex));

console.log(`✅ ${cuisHubs} hubs cuisine + ${cityHubs} hubs ville + ${catHubs} hubs catégorie = ${hubIndex.length} pages hub`);
