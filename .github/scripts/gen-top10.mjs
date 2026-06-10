/**
 * gen-top10.mjs
 * Pages "Top 10" programmatiques (format le plus cliqué en search):
 *  - hubs/top/recettes-{cat-slug}.html  — top 10 recettes par catégorie (tri rating)
 *  - hubs/top/restos-{city-slug}.html   — top 10 restos par ville (tri rating)
 * S'ajoute à hubs/index.json → repris automatiquement par gen-sitemap.
 */
import fs from 'fs';

const BASE = 'https://matbakh360.com';
const esc = (s) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const slugify = (s) => {
  const m={'ا':'a','أ':'a','إ':'a','آ':'a','ب':'b','ت':'t','ث':'th','ج':'j','ح':'h','خ':'kh','د':'d','ذ':'dh','ر':'r','ز':'z','س':'s','ش':'sh','ص':'s','ض':'d','ط':'t','ظ':'z','ع':'a','غ':'gh','ف':'f','ق':'q','ك':'k','ل':'l','م':'m','ن':'n','ه':'h','و':'w','ي':'y','ى':'a','ة':'a','ء':'','ئ':'y','ؤ':'w'};
  return String(s||'').replace(/[؀-ۿ]/g,c=>m[c]||'').normalize('NFD').replace(/[̀-ͯ]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').substring(0,50);
};

const recipes = JSON.parse(fs.readFileSync('data/recipes.json','utf8'));
const restos  = JSON.parse(fs.readFileSync('data/restos.json','utf8'));
const recIdx  = JSON.parse(fs.readFileSync('recipes/index.json','utf8'));
const rstIdx  = JSON.parse(fs.readFileSync('restaurants/index.json','utf8'));
const recSlug = Object.fromEntries(recIdx.map(e=>[e.id,e.slug]));
const rstSlug = Object.fromEntries(rstIdx.map(e=>[e.id,e.slug]));

const page = (title, desc, canonical, h1, intro, itemsHtml, listSchema) => `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-NTM6B493');</script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6870790039775701" crossorigin="anonymous"></script>
<meta name="google-adsense-account" content="ca-pub-6870790039775701">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<link rel="icon" type="image/svg+xml" href="${BASE}/favicon.svg">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}"><meta property="og:type" content="article">
<script type="application/ld+json">${JSON.stringify(listSchema)}</script>
<style>body{font-family:-apple-system,system-ui,sans-serif;max-width:860px;margin:0 auto;padding:24px;background:#fafafa;color:#1a1a1a}h1{font-size:28px;margin:0 0 8px;color:#C2410C}p.lead{color:#555;margin:0 0 28px;font-size:15px;line-height:1.7}.item{display:flex;gap:16px;background:#fff;border:1px solid #eee;border-radius:14px;padding:16px;margin-bottom:14px;text-decoration:none;color:inherit;transition:.15s;align-items:center}.item:hover{border-color:#C2410C;box-shadow:0 6px 20px rgba(0,0,0,.07)}.rank{font-size:26px;font-weight:900;color:#C2410C;min-width:40px;text-align:center}.item img{width:110px;height:80px;object-fit:cover;border-radius:10px;flex-shrink:0}.item h2{font-size:16px;margin:0 0 4px}.item .meta{font-size:13px;color:#888}footer{margin-top:40px;padding:20px 0;border-top:1px solid #ddd;text-align:center;font-size:13px;color:#888}.crumb{font-size:13px;color:#888;margin-bottom:10px}.crumb a{color:#C2410C;text-decoration:none}</style>
</head>
<body>
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NTM6B493" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<div class="crumb"><a href="${BASE}">🏠 الرئيسية</a> › Top 10</div>
<h1>${h1}</h1>
<p class="lead">${esc(intro)}</p>
${itemsHtml}
<footer><a href="${BASE}" style="color:#C2410C">مطبخ 360</a> · <a href="${BASE}/hubs/" style="color:#888">المزيد</a></footer>
</body></html>`;

fs.mkdirSync('hubs/top', { recursive: true });
const newEntries = [];

// ── Top 10 recettes par catégorie ───────────────────────────────────────
const byCat = {};
for (const r of recipes) if (r.cat) (byCat[r.cat] ||= []).push(r);

let recPages = 0;
for (const [cat, list] of Object.entries(byCat)) {
  if (list.length < 10) continue;
  const top = list.filter(r => recSlug[r.id]).sort((a,b)=>(b.rt||0)-(a.rt||0)||(b.rv||0)-(a.rv||0)).slice(0,10);
  if (top.length < 10) continue;
  const cslug = slugify(cat); if (!cslug) continue;
  const fname = `recettes-${cslug}.html`;
  const url = `${BASE}/hubs/top/${fname}`;
  const title = `أفضل 10 وصفات ${cat} — مجربة ومقيّمة | مطبخ 360`;
  const desc = `أفضل 10 وصفات ${cat} حسب تقييمات المستخدمين. القائمة محدثة مع الصور، وقت التحضير والسعرات.`;
  const items = top.map((r,i) => `<a class="item" href="${BASE}/recipes/${recSlug[r.id]}.html"><div class="rank">${i+1}</div><img src="${esc(r.img||'')}" loading="lazy" alt="${esc(r.ti)}"><div><h2>${esc(r.ti)}</h2><div class="meta">⭐ ${r.rt} (${r.rv||0}) · ⏱ ${esc(r.tm||'')} · ${esc(r.f||'')}</div></div></a>`).join('\n');
  const schema = { '@context':'https://schema.org','@type':'ItemList', name:title, itemListElement: top.map((r,i)=>({ '@type':'ListItem', position:i+1, name:r.ti, url:`${BASE}/recipes/${recSlug[r.id]}.html` })) };
  fs.writeFileSync(`hubs/top/${fname}`, page(title, desc, url, `🏆 أفضل 10 وصفات ${esc(cat)}`, desc, items, schema));
  newEntries.push({ type:'top10', slug:`top/${fname.replace('.html','')}`, url });
  recPages++;
}

// ── Top 10 restos par ville ─────────────────────────────────────────────
const byCity = {};
for (const r of restos) { const k = r.cityEn || r.city; if (k) (byCity[k] ||= []).push(r); }

let cityPages = 0;
for (const [city, list] of Object.entries(byCity)) {
  if (list.length < 10) continue;
  const top = list.filter(r => rstSlug[r.id] && r.rating).sort((a,b)=>(b.rating||0)-(a.rating||0)||(b.rv||0)-(a.rv||0)).slice(0,10);
  if (top.length < 10) continue;
  const cslug = slugify(city); if (!cslug) continue;
  const fname = `restos-${cslug}.html`;
  const url = `${BASE}/hubs/top/${fname}`;
  const cityAr = list[0].city || city;
  const title = `أفضل 10 مطاعم في ${cityAr} ${new Date().getFullYear()} | مطبخ 360`;
  const desc = `قائمة أفضل 10 مطاعم في ${cityAr} حسب تقييمات Google. العناوين، الأسعار وأنواع المأكولات.`;
  const items = top.map((r,i) => `<a class="item" href="${BASE}/restaurants/${rstSlug[r.id]}.html"><div class="rank">${i+1}</div><img src="${esc(r.img||'')}" loading="lazy" alt="${esc(r.nameEn||r.name)}"><div><h2>${esc(r.nameAr||r.name)}</h2><div class="meta">⭐ ${r.rating} (${r.rv||0}) · ${esc(r.cuisine||'')} · ${esc(r.price||'')}</div></div></a>`).join('\n');
  const schema = { '@context':'https://schema.org','@type':'ItemList', name:title, itemListElement: top.map((r,i)=>({ '@type':'ListItem', position:i+1, name:r.nameEn||r.name, url:`${BASE}/restaurants/${rstSlug[r.id]}.html` })) };
  fs.writeFileSync(`hubs/top/${fname}`, page(title, desc, url, `🏆 أفضل 10 مطاعم في ${esc(cityAr)}`, desc, items, schema));
  newEntries.push({ type:'top10', slug:`top/${fname.replace('.html','')}`, url });
  cityPages++;
}

// Merge dans hubs/index.json (repris par gen-sitemap)
let idx = [];
try { idx = JSON.parse(fs.readFileSync('hubs/index.json','utf8')); } catch {}
const keep = idx.filter(h => h.type !== 'top10');
fs.writeFileSync('hubs/index.json', JSON.stringify([...keep, ...newEntries]));

console.log(`✅ ${recPages} pages top-recettes + ${cityPages} pages top-restos = ${newEntries.length} pages Top 10`);
