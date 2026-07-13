/**
 * gen-influencer-pages.mjs
 * Génère des pages HTML SEO pour chaque influenceur food + une page index par ville.
 * Lit data/influencers.json → écrit influencers/{slug}.html + influencers/index.html
 */
import fs   from 'fs';
import path from 'path';

const BASE    = 'https://matbakh360.com';
const OUT_DIR = path.resolve(process.cwd(), 'influencers');

function escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escAttr(s) { return String(s||'').replace(/"/g,'&quot;'); }
function slugify(s) {
  return String(s||'').toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').replace(/-+/g,'-').replace(/^-|-$/g,'');
}

const GTM = `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-NTM6B493');</script>
<!-- End Google Tag Manager -->
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-TLBQXXRBG6"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-TLBQXXRBG6');
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-6R811G3SE7"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-6R811G3SE7');
</script>
</script>`;

const GTM_NS = `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NTM6B493" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;

const PL_ICON = { instagram:'📸', tiktok:'🎵', youtube:'▶️' };
const PL_LABEL = { instagram:'Instagram', tiktok:'TikTok', youtube:'YouTube' };

function platformUrl(inf) {
  const h = (inf.handle||'').replace(/^@/,'');
  if (inf.platform==='instagram') return `https://www.instagram.com/${h}/`;
  if (inf.platform==='tiktok')    return `https://www.tiktok.com/@${h}`;
  if (inf.platform==='youtube')   return `https://www.youtube.com/@${h}`;
  return inf.videoUrl || '#';
}

function buildInfluencerPage(inf, cityLabel) {
  const title   = `${escHtml(inf.name)} — ${escHtml(inf.titleAr||'مؤثر طعام')} | مطبخ 360`;
  const desc    = `${escHtml(inf.name)} (${escHtml(inf.handle||'')}) مؤثر طعام من ${escHtml(cityLabel)}. ${escHtml(inf.titleAr||'')}`;
  const url     = `${BASE}/influencers/${slugify(inf.id)}.html`;
  const plUrl   = platformUrl(inf);

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
${inf.thumbnail?`<meta property="og:image" content="${escAttr(inf.thumbnail)}">`:''}
<meta property="og:url" content="${url}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
<script type="application/ld+json">${JSON.stringify({
  "@context":"https://schema.org",
  "@type":"Person",
  "name": inf.name,
  "url": url,
  "image": inf.avatar||inf.thumbnail||'',
  "sameAs": [plUrl],
  "description": inf.titleEn||inf.titleAr||'',
  "knowsAbout": "Food, Cooking, Restaurants"
})}</script>
${GTM}
</head>
<body>
${GTM_NS}
<main style="max-width:720px;margin:0 auto;padding:20px;font-family:'Tajawal',-apple-system,system-ui,sans-serif;line-height:1.8;color:#1a1a1a">
<nav style="font-size:13px;color:#888;margin-bottom:12px">
  <a href="${BASE}" style="color:#C2410C;text-decoration:none">مطبخ 360</a> ›
  <a href="${BASE}/influencers/" style="color:#C2410C;text-decoration:none">المؤثرون</a> ›
  ${escHtml(cityLabel)}
</nav>
<div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
  <img src="${escAttr(inf.avatar||`https://i.pravatar.cc/80?u=${inf.id}`)}" alt="${escAttr(inf.name)}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid #C2410C">
  <div>
    <h1 style="font-size:22px;color:#C2410C;margin:0">${escHtml(inf.name)}</h1>
    <p style="margin:4px 0;font-size:14px;color:#888">${escHtml(inf.handle||'')} · ${escHtml(PL_LABEL[inf.platform]||inf.platform||'')} · ${escHtml(cityLabel)}</p>
    ${inf.views?`<p style="margin:0;font-size:13px">👁️ <b>${escHtml(inf.views)}</b> مشاهدة</p>`:''}
  </div>
</div>
<h2 style="font-size:18px;color:#C2410C;border-bottom:2px solid #f0d9cc;padding-bottom:6px">🎬 ${escHtml(inf.titleAr||'آخر فيديو')}</h2>
${inf.thumbnail?`<img src="${escAttr(inf.thumbnail)}" alt="${escAttr(inf.titleAr||inf.name)}" style="width:100%;border-radius:14px;margin:8px 0" loading="lazy">`:''}
${inf.titleEn?`<p style="font-size:14px;color:#666;font-style:italic">${escHtml(inf.titleEn)}</p>`:''}
<p style="margin-top:20px">
  <a href="${escAttr(plUrl)}" rel="nofollow noopener" target="_blank"
     style="display:inline-block;background:#C2410C;color:#fff;padding:10px 22px;border-radius:24px;text-decoration:none;font-weight:700">
    ${PL_ICON[inf.platform]||'🔗'} متابعة على ${escHtml(PL_LABEL[inf.platform]||'المنصة')}
  </a>
</p>
<a href="${BASE}/influencers/" style="display:inline-block;margin-top:12px;font-size:14px;color:#C2410C">← العودة إلى المؤثرين</a>
</main>
<footer style="margin-top:2rem;padding:20px;border-top:1px solid #eee;text-align:center;font-size:13px;color:#888;font-family:sans-serif">
  <a href="${BASE}" rel="home" style="color:#C2410C">مطبخ 360</a> ·
  <a href="${BASE}/about.html" style="color:#888">من نحن</a> ·
  <a href="${BASE}/privacy.html" style="color:#888">الخصوصية</a>
</footer>
</body>
</html>`;
}

function buildCityIndex(citySlug, cityLabel, infs) {
  const title = `مؤثرو الطعام في ${escHtml(cityLabel)} | مطبخ 360`;
  const desc  = `أبرز ${infs.length} مؤثرين في مجال الطعام والمطاعم في ${escHtml(cityLabel)}`;
  const url   = `${BASE}/influencers/${slugify(citySlug)}.html`;

  const cards = infs.map(inf => `
<div style="display:flex;gap:14px;align-items:center;padding:14px;border:1px solid #f0d9cc;border-radius:12px;margin-bottom:10px">
  <img src="${escAttr(inf.avatar||`https://i.pravatar.cc/80?u=${inf.id}`)}" alt="${escAttr(inf.name)}" style="width:60px;height:60px;border-radius:50%;object-fit:cover">
  <div style="flex:1">
    <a href="${BASE}/influencers/${slugify(inf.id)}.html" style="font-weight:700;color:#C2410C;text-decoration:none;font-size:16px">${escHtml(inf.name)}</a>
    <p style="margin:2px 0;font-size:13px;color:#888">${escHtml(inf.handle||'')} · ${escHtml(PL_LABEL[inf.platform]||'')}${inf.views?` · ${escHtml(inf.views)} مشاهدة`:''}</p>
    ${inf.titleAr?`<p style="margin:2px 0;font-size:14px">${escHtml(inf.titleAr)}</p>`:''}
  </div>
</div>`).join('');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${url}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
${GTM}
</head>
<body>
${GTM_NS}
<main style="max-width:720px;margin:0 auto;padding:20px;font-family:'Tajawal',-apple-system,system-ui,sans-serif;line-height:1.8;color:#1a1a1a">
<nav style="font-size:13px;color:#888;margin-bottom:12px">
  <a href="${BASE}" style="color:#C2410C;text-decoration:none">مطبخ 360</a> ›
  <a href="${BASE}/influencers/" style="color:#C2410C;text-decoration:none">المؤثرون</a> ›
  ${escHtml(cityLabel)}
</nav>
<h1 style="font-size:26px;color:#C2410C;margin:0 0 8px">🌟 مؤثرو الطعام في ${escHtml(cityLabel)}</h1>
<p style="font-size:16px;color:#555">${desc}</p>
${cards}
<a href="${BASE}/influencers/" style="display:inline-block;margin-top:16px;font-size:14px;color:#C2410C">← كل المؤثرين</a>
</main>
<footer style="margin-top:2rem;padding:20px;border-top:1px solid #eee;text-align:center;font-size:13px;color:#888;font-family:sans-serif">
  <a href="${BASE}" rel="home" style="color:#C2410C">مطبخ 360</a> ·
  <a href="${BASE}/about.html" style="color:#888">من نحن</a> ·
  <a href="${BASE}/privacy.html" style="color:#888">الخصوصية</a>
</footer>
</body>
</html>`;
}

function buildGlobalIndex(byCity) {
  const title = 'مؤثرو الطعام العرب | مطبخ 360';
  const desc  = 'أبرز مؤثري الطعام والمطاعم في المدن العربية والعالمية';
  const url   = `${BASE}/influencers/`;

  const cityCards = Object.entries(byCity).map(([slug, {label, infs}]) => `
<a href="${BASE}/influencers/${slugify(slug)}.html"
   style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #f0d9cc;border-radius:12px;text-decoration:none;color:#1a1a1a">
  <div style="display:flex">
    ${infs.slice(0,3).map(i=>`<img src="${escAttr(i.avatar||`https://i.pravatar.cc/80?u=${i.id}`)}" style="width:40px;height:40px;border-radius:50%;margin-left:-8px;border:2px solid #fff;object-fit:cover">`).join('')}
  </div>
  <div>
    <div style="font-weight:700;color:#C2410C">${escHtml(label)}</div>
    <div style="font-size:13px;color:#888">${infs.length} مؤثرين</div>
  </div>
</a>`).join('');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${url}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
${GTM}
</head>
<body>
${GTM_NS}
<main style="max-width:720px;margin:0 auto;padding:20px;font-family:'Tajawal',-apple-system,system-ui,sans-serif;line-height:1.8;color:#1a1a1a">
<nav style="font-size:13px;color:#888;margin-bottom:12px">
  <a href="${BASE}" style="color:#C2410C;text-decoration:none">مطبخ 360</a> › المؤثرون
</nav>
<h1 style="font-size:28px;color:#C2410C;margin:0 0 8px">🌟 مؤثرو الطعام</h1>
<p style="font-size:16px;color:#555">${desc}</p>
<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;margin-top:16px">
${cityCards}
</div>
</main>
<footer style="margin-top:2rem;padding:20px;border-top:1px solid #eee;text-align:center;font-size:13px;color:#888;font-family:sans-serif">
  <a href="${BASE}" rel="home" style="color:#C2410C">مطبخ 360</a> ·
  <a href="${BASE}/about.html" style="color:#888">من نحن</a> ·
  <a href="${BASE}/privacy.html" style="color:#888">الخصوصية</a>
</footer>
</body>
</html>`;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const influencers = JSON.parse(fs.readFileSync(path.resolve(process.cwd(),'data','influencers.json'),'utf8'));
fs.mkdirSync(OUT_DIR, { recursive: true });

// Grouper par ville
const byCity = {};
for (const inf of influencers) {
  const slug  = slugify(inf.cityEn || inf.city || 'other');
  const label = inf.cityAr || inf.cityEn || inf.city || slug;
  if (!byCity[slug]) byCity[slug] = { label, infs: [] };
  byCity[slug].infs.push(inf);
}

let pageCount = 0;

// Pages individuelles
for (const inf of influencers) {
  const filename = `${slugify(inf.id)}.html`;
  const citySlug = slugify(inf.cityEn || inf.city || 'other');
  const cityLabel = byCity[citySlug]?.label || inf.cityEn || inf.city || '';
  fs.writeFileSync(path.join(OUT_DIR, filename), buildInfluencerPage(inf, cityLabel));
  pageCount++;
}

// Pages index par ville
for (const [slug, {label, infs}] of Object.entries(byCity)) {
  fs.writeFileSync(path.join(OUT_DIR, `${slugify(slug)}.html`), buildCityIndex(slug, label, infs));
  pageCount++;
}

// Index global
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), buildGlobalIndex(byCity));
pageCount++;

console.log(`✅ ${pageCount} pages influenceurs générées (${influencers.length} profils, ${Object.keys(byCity).length} villes)`);
