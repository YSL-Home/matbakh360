/**
 * gen-seo-vids.mjs
 * Génère des pages HTML statiques SEO pour les vidéos.
 * Lit data/vids.json et écrit videos/{slug}.html
 */
import fs from 'fs';
import path from 'path';

const BASE       = 'https://matbakh360.com';
const BATCH      = parseInt(process.env.PAGES_BATCH) || 500;
const OUT_DIR    = path.resolve(process.cwd(), 'videos');
const DATA_FILE  = path.resolve(process.cwd(), 'data', 'vids.json');
const INDEX_FILE = path.join(OUT_DIR, 'index.json');

function isArabic(s){return /[؀-ۿ]/.test(String(s||''));}
function translit(s){
  const m={'ا':'a','أ':'a','إ':'a','آ':'a','ب':'b','ت':'t','ث':'th','ج':'j','ح':'h','خ':'kh','د':'d','ذ':'dh','ر':'r','ز':'z','س':'s','ش':'sh','ص':'s','ض':'d','ط':'t','ظ':'z','ع':'a','غ':'gh','ف':'f','ق':'q','ك':'k','ل':'l','م':'m','ن':'n','ه':'h','و':'w','ي':'y','ى':'a','ة':'a','ء':'','ئ':'y','ؤ':'w'};
  return String(s).replace(/[؀-ۿ]/g, c => m[c] || '');
}
function slugify(str){
  let s=String(str||'');
  if(isArabic(s)) s=translit(s);
  return s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase()
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').substring(0,60);
}
function buildSlug(v){
  const base = slugify(v.title) || slugify(v.titleAr) || `video-${v.vid_id||v.id}`;
  return base;
}
function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function escAttr(s){return escHtml(s).replace(/"/g,'&quot;');}
function escJs(s){return String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");}

const PL_LABEL = { yt:'YouTube', tt:'TikTok', ig:'Instagram', fb:'Facebook', pt:'Pinterest' };

function buildHtml(v, slug){
  const title = v.titleAr || v.title || 'فيديو طبخ';
  const channel = v.channel || '';
  const desc = `${title} — ${PL_LABEL[v.pl]||v.pl||'فيديو'} من قناة ${channel}. شاهد طريقة التحضير على مطبخ 360.`;
  const seoTitle = `${title} — ${channel} | مطبخ 360`;
  const metaDesc = desc.length > 160 ? desc.substring(0,157)+'...' : desc;
  const image = v.thumb || v.thumbnail || `${BASE}/icons/icon-512.png`;
  const canonical = `${BASE}/videos/${slug}.html`;
  const contentUrl = v.url || (v.pl==='yt' && v.vid_id ? `https://www.youtube.com/watch?v=${v.vid_id}` : '');
  const embedUrl = v.pl==='yt' && v.vid_id ? `https://www.youtube.com/embed/${v.vid_id}` : '';

  const schema = {
    '@context':'https://schema.org',
    '@type':'VideoObject',
    name: title,
    description: desc,
    thumbnailUrl: image,
    uploadDate: v.published || new Date().toISOString().split('T')[0],
    ...(contentUrl ? { contentUrl } : {}),
    ...(embedUrl   ? { embedUrl }   : {}),
    ...(channel    ? { author:{ '@type':'Person', name:channel } } : {}),
    ...(v.views    ? { interactionStatistic:{ '@type':'InteractionCounter', interactionType:{'@type':'WatchAction'}, userInteractionCount: parseInt(String(v.views).replace(/[^0-9]/g,'')) || 0 } } : {}),
  };
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
<!-- Google AdSense -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6870790039775701" crossorigin="anonymous"></script>
<meta name="google-adsense-account" content="ca-pub-6870790039775701">
<title>${escHtml(seoTitle)}</title>
<meta name="description" content="${escAttr(metaDesc)}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<link rel="icon" type="image/svg+xml" href="${BASE}/favicon.svg">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="ar" href="${canonical}">
<link rel="alternate" hreflang="fr" href="${BASE}/fr/videos/${slug}.html">
<link rel="alternate" hreflang="x-default" href="${canonical}">
<meta property="og:title" content="${escAttr(title)}">
<meta property="og:description" content="${escAttr(metaDesc)}">
<meta property="og:image" content="${escAttr(image)}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="video.other">
<meta property="og:video" content="${escAttr(contentUrl)}">
<script type="application/ld+json">${schemaStr}</script>
</head>
<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NTM6B493" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
<h1>${escHtml(title)}</h1>
<p>${escHtml(desc)}</p>
<script>window.location.replace('/#video/'+'${escJs(v.id)}');</script>
<noscript><meta http-equiv="refresh" content="0;url=/#video/${escJs(v.id)}"></noscript>
<footer style="margin-top:2rem;padding:1rem 0;border-top:1px solid #eee;text-align:center;font-size:.9rem;">
  <a href="${BASE}" rel="home">مطبخ 360 — الرئيسية</a>
</footer>
</body>
</html>`;
}

if(!fs.existsSync(DATA_FILE)){console.error('❌ data/vids.json introuvable');process.exit(1);}
const vids = JSON.parse(fs.readFileSync(DATA_FILE,'utf8'));
if(!Array.isArray(vids)){console.error('❌ vids.json doit être un tableau');process.exit(1);}

fs.mkdirSync(OUT_DIR, { recursive: true });
let existingIndex = [];
if(fs.existsSync(INDEX_FILE)){
  try{existingIndex=JSON.parse(fs.readFileSync(INDEX_FILE,'utf8'));}catch{existingIndex=[];}
}
const existingSlugs = new Set(existingIndex.map(e=>e.slug));

const toProcess = vids.slice(0, BATCH);
let generated=0, skipped=0;
const newEntries=[];

for(let i=0;i<toProcess.length;i++){
  const v = toProcess[i];
  if(!v || !v.id || !(v.title || v.titleAr)){ skipped++; continue; }
  let slug = buildSlug(v);
  if(!slug) slug = `video-${v.vid_id||v.id}`;
  if(existingSlugs.has(slug)) slug = `${slug}-${(v.vid_id||v.id).slice(-8)}`;
  if(existingSlugs.has(slug)) slug = `video-${v.id}`;
  existingSlugs.add(slug);

  const file = path.join(OUT_DIR, `${slug}.html`);
  if(fs.existsSync(file)){ skipped++; continue; }
  fs.writeFileSync(file, buildHtml(v, slug), 'utf8');
  newEntries.push({ id: v.id, slug, title: v.title || v.titleAr, pl: v.pl });
  generated++;
  if(i % 200 === 0) console.log(`[${i}/${toProcess.length}] ${slug}`);
}

const mergedIndex = [...existingIndex, ...newEntries];
fs.writeFileSync(INDEX_FILE, JSON.stringify(mergedIndex), 'utf8');
console.log(`\n✅ ${generated} pages vidéos générées, ${skipped} ignorées — index: ${mergedIndex.length} entrées`);
