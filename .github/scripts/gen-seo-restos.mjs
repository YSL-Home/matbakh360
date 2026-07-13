/**
 * gen-seo-restos.mjs
 * Génère des pages HTML statiques SEO pour les restaurants.
 * Lit data/restos.json et écrit restaurants/{slug}.html
 * Usage : node .github/scripts/gen-seo-restos.mjs
 */
import fs from 'fs';
import path from 'path';

const BASE        = 'https://matbakh360.com';
const BATCH       = parseInt(process.env.PAGES_BATCH) || 500;
const OUT_DIR     = path.resolve(process.cwd(), 'restaurants');
const DATA_FILE   = path.resolve(process.cwd(), 'data', 'restos.json');
const INDEX_FILE  = path.join(OUT_DIR, 'index.json');

// ── Cuisine → label AR ────────────────────────────────────────────────────
const CUISINE_AR = {
  pizza:'بيتزا', italian:'إيطالية', french:'فرنسية', moroccan:'مغربية',
  lebanese:'لبنانية', turkish:'تركية', japanese:'يابانية', chinese:'صينية',
  indian:'هندية', mexican:'مكسيكية', thai:'تايلاندية', greek:'يونانية',
  spanish:'إسبانية', american:'أمريكية', seafood:'مأكولات بحرية',
  burger:'برغر', kebab:'كباب', sushi:'سوشي', vegetarian:'نباتية',
  vegan:'نباتية صرفة', cafe:'مقهى', bakery:'مخبز', dessert:'حلويات',
  steakhouse:'مشاوي', fastfood:'وجبات سريعة', restaurant:'مطعم',
};

// ── Helpers ───────────────────────────────────────────────────────────────
function isArabic(s) { return /[؀-ۿ]/.test(String(s||'')); }
function translit(s) {
  const m = {'ا':'a','أ':'a','إ':'a','آ':'a','ب':'b','ت':'t','ث':'th','ج':'j','ح':'h','خ':'kh','د':'d','ذ':'dh','ر':'r','ز':'z','س':'s','ش':'sh','ص':'s','ض':'d','ط':'t','ظ':'z','ع':'a','غ':'gh','ف':'f','ق':'q','ك':'k','ل':'l','م':'m','ن':'n','ه':'h','و':'w','ي':'y','ى':'a','ة':'a','ء':'','ئ':'y','ؤ':'w'};
  return String(s).replace(/[؀-ۿ]/g, c => m[c] || '');
}
function slugify(str) {
  let s = String(str || '');
  if (isArabic(s)) s = translit(s);
  return s.normalize('NFD').replace(/[̀-ͯ]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'').substring(0,60);
}
function buildSlug(r) {
  const name = r.nameEn || (r.name && !isArabic(r.name) ? r.name : null) || r.nameAr || r.name || '';
  const city = r.cityEn || (r.city && !isArabic(r.city) ? r.city : null) || '';
  const base = slugify(`${name}-${city}`) || slugify(name) || `resto-${r.id}`;
  return base;
}

function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function escAttr(s){return escHtml(s).replace(/"/g,'&quot;');}
function escJs(s){return String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");}

function priceRange(p) {
  if (!p) return undefined;
  if (typeof p === 'string' && /^\${1,4}$/.test(p)) return p;
  return undefined;
}

function buildHtml(r, slug) {
  const nameAr   = r.nameAr || r.name || 'مطعم';
  const nameEn   = r.nameEn || r.name || nameAr;
  const cityAr   = r.city   || r.cityEn || '';
  const cityEn   = r.cityEn || r.city   || '';
  const cuisine  = (r.cuisine || '').toLowerCase();
  let cuisAr     = CUISINE_AR[cuisine] || '';
  if (cuisAr === 'مطعم') cuisAr = ''; // évite "مطعم مطعم"
  const kindAr   = cuisAr || 'مطعم';
  const title    = `${nameAr} — ${kindAr} في ${cityAr}`.trim();
  const seoTitle = `${nameAr} ${cityAr} — ${kindAr} | مطبخ 360`;
  const baseDesc = r.desc && r.desc.length > 40
    ? r.desc
    : `${nameAr} ${cuisAr ? 'مطعم ' + cuisAr : 'مطعم'} في ${cityAr}${r.rating ? ` — تقييم ${r.rating}/5` : ''}${r.rv ? ` (${r.rv} مراجعة)` : ''}. العنوان: ${r.address || cityAr}.`;
  const metaDesc = baseDesc.length > 160 ? baseDesc.substring(0,157)+'...' : baseDesc;
  const image    = r.img && /^https?:/.test(r.img) ? r.img : `${BASE}/icons/icon-512.png`;
  const canonical = `${BASE}/restaurants/${slug}.html`;

  const schema = {
    '@context':'https://schema.org',
    '@type':'Restaurant',
    name: nameEn,
    alternateName: nameAr !== nameEn ? nameAr : undefined,
    description: baseDesc,
    image,
    url: canonical,
    servesCuisine: cuisine || undefined,
    address: {
      '@type':'PostalAddress',
      streetAddress: r.address || cityEn,
      addressLocality: cityEn,
      addressCountry: (r.country || '').replace(/[^A-Z]/gi,'') || undefined,
    },
    ...(r.lat && r.lng ? { geo: { '@type':'GeoCoordinates', latitude:r.lat, longitude:r.lng } } : {}),
    ...(r.rating ? {
      aggregateRating: {
        '@type':'AggregateRating',
        ratingValue: r.rating,
        reviewCount: r.rv || 1,
        bestRating: 5, worstRating: 1,
      }
    } : {}),
    ...(priceRange(r.price) ? { priceRange: r.price } : {}),
    ...(r.phone   ? { telephone: r.phone } : {}),
    ...(r.website ? { sameAs: [r.website] } : {}),
    ...(r.hours   ? { openingHours: r.hours } : {}),
  };
  // strip undefined
  for (const k of Object.keys(schema)) if (schema[k] === undefined) delete schema[k];
  if (schema.address) for (const k of Object.keys(schema.address)) if (schema.address[k] === undefined) delete schema.address[k];

  const schemaStr = JSON.stringify(schema);

  return `<!DOCTYPE html>
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
<!-- End Google Tag Manager -->
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-TLBQXXRBG6"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-TLBQXXRBG6');
</script>
<!-- Google AdSense -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6870790039775701" crossorigin="anonymous"></script>
<meta name="google-adsense-account" content="ca-pub-6870790039775701">
<title>${escHtml(seoTitle)}</title>
<meta name="description" content="${escAttr(metaDesc)}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<link rel="icon" type="image/svg+xml" href="${BASE}/favicon.svg">
<link rel="apple-touch-icon" href="${BASE}/favicon.svg">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="ar" href="${canonical}">
<link rel="alternate" hreflang="fr" href="${BASE}/fr/restaurants/${slug}.html">
<link rel="alternate" hreflang="x-default" href="${canonical}">
<meta property="og:title" content="${escAttr(title)}">
<meta property="og:description" content="${escAttr(metaDesc)}">
<meta property="og:image" content="${escAttr(image)}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="restaurant">
<script type="application/ld+json">${schemaStr}</script>
</head>
<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NTM6B493" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
<main style="max-width:720px;margin:0 auto;padding:20px;font-family:'Tajawal',-apple-system,system-ui,sans-serif;line-height:1.8;color:#1a1a1a">
<nav style="font-size:13px;color:#888;margin-bottom:12px"><a href="${BASE}" style="color:#C2410C;text-decoration:none">مطبخ 360</a> › <a href="${BASE}/?page=restos" style="color:#C2410C;text-decoration:none">المطاعم</a> › ${escHtml(cityAr)}</nav>
<h1 style="font-size:26px;color:#C2410C;margin:0 0 8px">${escHtml(title)}</h1>
${r.img&&/^https?:/.test(r.img)?`<img src="${escAttr(r.img)}" alt="${escAttr(nameAr)}" style="width:100%;max-height:360px;object-fit:cover;border-radius:14px;margin:8px 0" loading="lazy">`:''}
<p style="font-size:16px">${escHtml(baseDesc)}</p>
<div style="display:flex;flex-wrap:wrap;gap:14px;background:#fff7f2;border:1px solid #f0d9cc;border-radius:12px;padding:14px;margin:16px 0;font-size:14px">
  ${cuisAr?`<span>🍽️ المطبخ: <b>${escHtml(cuisAr)}</b></span>`:''}
  ${r.rating?`<span>⭐ التقييم: <b>${escHtml(String(r.rating))}/5</b></span>`:''}
  ${r.rv?`<span>💬 <b>${escHtml(String(r.rv))}</b> مراجعة</span>`:''}
  ${priceRange(r.price)?`<span>💰 السعر: <b>${escHtml(r.price)}</b></span>`:''}
</div>
<h2 style="font-size:19px;color:#C2410C;border-bottom:2px solid #f0d9cc;padding-bottom:6px">📍 الموقع والتواصل</h2>
<ul style="padding-right:22px">
  <li>المدينة: ${escHtml(cityAr)}</li>
  ${r.address?`<li>العنوان: ${escHtml(r.address)}</li>`:''}
  ${r.phone?`<li>الهاتف: ${escHtml(r.phone)}</li>`:''}
  ${r.hours?`<li>ساعات العمل: ${escHtml(r.hours)}</li>`:''}
  ${r.website?`<li>الموقع: <a href="${escAttr(r.website)}" rel="nofollow noopener" target="_blank">${escHtml(r.website)}</a></li>`:''}
</ul>
<p style="margin-top:20px">
  <a href="https://www.google.com/maps/search/${encodeURIComponent((nameEn||nameAr)+' '+cityEn)}" rel="nofollow noopener" target="_blank" style="display:inline-block;background:#C2410C;color:#fff;padding:10px 20px;border-radius:24px;text-decoration:none;font-weight:700;margin-${'left'}:8px">🗺️ عرض على الخريطة</a>
  <a href="${BASE}/#restaurant/${escJs(r.id)}" style="display:inline-block;background:#fff;color:#C2410C;border:1px solid #C2410C;padding:10px 20px;border-radius:24px;text-decoration:none;font-weight:700">التفاصيل في التطبيق</a>
</p>
</main>
<footer style="margin-top:2rem;padding:20px;border-top:1px solid #eee;text-align:center;font-size:13px;color:#888;font-family:sans-serif">
  <a href="${BASE}" rel="home" style="color:#C2410C">مطبخ 360</a> ·
  <a href="${BASE}/about.html" style="color:#888">من نحن</a> ·
  <a href="${BASE}/contact.html" style="color:#888">اتصل بنا</a> ·
  <a href="${BASE}/privacy.html" style="color:#888">الخصوصية</a> ·
  <a href="${BASE}/terms.html" style="color:#888">الشروط</a>
</footer>
</body>
</html>`;
}

// ── Main ──────────────────────────────────────────────────────────────────
if (!fs.existsSync(DATA_FILE)) { console.error('❌ data/restos.json introuvable'); process.exit(1); }
const restos = JSON.parse(fs.readFileSync(DATA_FILE,'utf8'));
if (!Array.isArray(restos)) { console.error('❌ restos.json doit être un tableau'); process.exit(1); }

fs.mkdirSync(OUT_DIR, { recursive: true });

let existingIndex = [];
if (fs.existsSync(INDEX_FILE)) {
  try { existingIndex = JSON.parse(fs.readFileSync(INDEX_FILE,'utf8')); } catch { existingIndex = []; }
}
const existingSlugs = new Set(existingIndex.map(e => e.slug));

const toProcess = restos.slice(0, BATCH);
let generated = 0, skipped = 0;
const newEntries = [];

for (let i = 0; i < toProcess.length; i++) {
  const r = toProcess[i];
  if (!r || !r.id || !(r.name || r.nameAr || r.nameEn)) { skipped++; continue; }

  let slug = buildSlug(r);
  if (!slug) slug = `resto-${r.id}`;
  if (existingSlugs.has(slug)) slug = `${slug}-${(r.cityEn||r.city||'').toLowerCase().replace(/[^a-z0-9]+/g,'').substring(0,8) || r.id.slice(-6)}`;
  if (existingSlugs.has(slug)) slug = `${slug}-${r.id.slice(-6)}`;
  if (existingSlugs.has(slug)) slug = `resto-${r.id}`;
  existingSlugs.add(slug);

  const file = path.join(OUT_DIR, `${slug}.html`);
  if (fs.existsSync(file)) { skipped++; continue; }

  fs.writeFileSync(file, buildHtml(r, slug), 'utf8');
  newEntries.push({ id: r.id, slug, name: r.nameEn || r.name, city: r.cityEn || r.city });
  generated++;
  if (i % 100 === 0) console.log(`[${i}/${toProcess.length}] ${slug}`);
}

const mergedIndex = [...existingIndex, ...newEntries];
fs.writeFileSync(INDEX_FILE, JSON.stringify(mergedIndex), 'utf8');

console.log(`\n✅ ${generated} pages restos générées, ${skipped} ignorées — index: ${mergedIndex.length} entrées`);
