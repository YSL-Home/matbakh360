/**
 * gen-seo-pages.mjs
 * Génère des pages HTML statiques SEO pour les recettes.
 * Lit data/recipes.json et écrit recipes/{slug}.html
 * Usage : node .github/scripts/gen-seo-pages.mjs
 */
import fs from 'fs';
import path from 'path';

const BASE        = 'https://matbakh360.com';
const BATCH       = parseInt(process.env.PAGES_BATCH) || 500;
const RECIPES_DIR = path.resolve(process.cwd(), 'recipes');
const DATA_FILE   = path.resolve(process.cwd(), 'data', 'recipes.json');
const INDEX_FILE  = path.join(RECIPES_DIR, 'index.json');

// ── Détection de texte arabe ──────────────────────────────────────────────
function isArabic(str) {
  return /[؀-ۿ]/.test(str);
}

// ── Translittération arabe → latin ───────────────────────────────────────
function transliterateArabic(str) {
  const map = {
    'ا':'a','أ':'a','إ':'a','آ':'a','ب':'b','ت':'t','ث':'th','ج':'j',
    'ح':'h','خ':'kh','د':'d','ذ':'dh','ر':'r','ز':'z','س':'s','ش':'sh',
    'ص':'s','ض':'d','ط':'t','ظ':'z','ع':'a','غ':'gh','ف':'f','ق':'q',
    'ك':'k','ل':'l','م':'m','ن':'n','ه':'h','و':'w','ي':'y','ى':'a',
    'ة':'a','ء':'','ئ':'y','ؤ':'w','لا':'la',
  };
  return str.replace(/[؀-ۿݐ-ݿ؀-ۿ]/g, c => map[c] || '');
}

// ── Slugify ───────────────────────────────────────────────────────────────
// Priorité : r.ti (titre anglais) si disponible et non-arabe,
//            sinon translittérer le titre arabe.
function buildSlug(r) {
  const tiEnglish = r.ti && !isArabic(r.ti) ? r.ti : null;
  const source    = tiEnglish || r.ti || `recipe-${r.id}`;
  return slugifyStr(source);
}

function slugifyStr(str) {
  let s = String(str);
  if (isArabic(s)) {
    s = transliterateArabic(s);
  }
  return s
    .normalize('NFD')                        // décomposer les accents latins
    .replace(/[̀-ͯ]/g, '')         // supprimer les diacritiques latins
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')            // remplacer tout non-alphanum par tiret
    .replace(/^-+|-+$/g, '')                // trim tirets en début/fin
    .substring(0, 60);                       // max 60 chars
}

// ── Temps de cuisson en ISO 8601 (PTxM) ──────────────────────────────────
function parseCookTime(tm) {
  if (!tm) return 'PT30M';
  // Si déjà formaté en chiffre
  const num = parseInt(tm);
  if (!isNaN(num)) return `PT${num}M`;
  return 'PT30M';
}

// ── Carte cuisine → label arabe ───────────────────────────────────────────
const CUISINE_LABELS = {
  'esp':'إسبانية','fra':'فرنسية','ita':'إيطالية','jpn':'يابانية',
  'chn':'صينية','ind':'هندية','mex':'مكسيكية','grk':'يونانية',
  'tur':'تركية','mar':'مغربية','egy':'مصرية','tun':'تونسية',
  'lbn':'لبنانية','sau':'سعودية','ira':'إيرانية','tha':'تايلاندية',
};

// ── Template HTML ─────────────────────────────────────────────────────────
function buildHtml(r, slug, titleSuffix) {
  // Titre unique : ajouter suffixe cuisine si doublon détecté
  const title       = titleSuffix ? `${r.ti || 'وصفة'} — ${titleSuffix}` : (r.ti || 'وصفة');
  const description = r.seo_desc && r.seo_desc.length >= 50
    ? r.seo_desc
    : r.de
      ? `${r.de} — وصفة ${r.cat || ''} ${CUISINE_LABELS[r.cid] || ''}`.trim()
      : title;
  // image: utiliser r.img (themealdb CDN stable) plutôt que unsplash dynamique
  const image       = r.img && r.img.startsWith('http') ? r.img : `${BASE}/icons/icon-512.png`;
  const category    = r.cat || '';
  const cookTime    = parseCookTime(r.tm);
  const yield_      = r.sv  ? String(r.sv) : '4';
  const canonical   = `${BASE}/recipes/${slug}.html`;

  // Langue : arabe si r.r contient "عربي", sinon anglais
  const isArabicPage = r.r && r.r.includes('عربي');
  const htmlLang     = isArabicPage ? 'ar" dir="rtl' : 'en';

  const ingredients = Array.isArray(r.ing)
    ? r.ing.map(i => `${i.q || ''} ${i.n || ''}`.trim())
    : [];

  const instructions = Array.isArray(r.steps)
    ? r.steps.map((s, idx) => ({
        '@type': 'HowToStep',
        position: idx + 1,
        text: s.t || '',
      }))
    : [];

  // Nutrition complète depuis r.nut
  const nutritionObj = r.nut ? {
    '@type': 'NutritionInformation',
    ...(r.nut.cal  ? { calories:           `${r.nut.cal} cal` }  : {}),
    ...(r.nut.pro  ? { proteinContent:     `${r.nut.pro} g` }    : {}),
    ...(r.nut.carb ? { carbohydrateContent:`${r.nut.carb} g` }   : {}),
    ...(r.nut.fat  ? { fatContent:         `${r.nut.fat} g` }    : {}),
  } : undefined;

  // VideoObject si YouTube disponible
  const videoObj = r.youtube ? {
    '@type': 'VideoObject',
    name: `طريقة تحضير ${title}`,
    description,
    thumbnailUrl: `https://img.youtube.com/vi/${r.youtube.split('v=')[1]?.split('&')[0]}/maxresdefault.jpg`,
    contentUrl: r.youtube,
    embedUrl: r.youtube.replace('watch?v=', 'embed/'),
    uploadDate: new Date().toISOString().split('T')[0],
  } : undefined;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: title,
    description,
    image,
    recipeCategory: category,
    cookTime,
    recipeYield: yield_,
    ...(nutritionObj ? { nutrition: nutritionObj } : {}),
    ...(videoObj     ? { video: videoObj }         : {}),
    recipeIngredient: ingredients,
    recipeInstructions: instructions,
  };

  const schemaStr = JSON.stringify(schema);

  // seo_title enrichi avec temps + cuisine si disponibles
  const seoTitle = r.seo_title && r.seo_title.length > 10
    ? r.seo_title
    : `طريقة عمل ${title}${r.tm ? ` — ${r.tm}` : ''} | مطبخ 360`;

  // Meta description ≥ 120 chars
  const metaDesc = description.length > 160
    ? description.substring(0, 157) + '...'
    : description;

  return `<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escHtml(seoTitle)}</title>
<meta name="description" content="${escAttr(metaDesc)}">
<meta name="robots" content="index, follow">
<link rel="icon" type="image/svg+xml" href="${BASE}/favicon.svg">
<link rel="apple-touch-icon" href="${BASE}/favicon.svg">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="ar" href="${canonical}">
<link rel="alternate" hreflang="fr" href="${BASE}/fr/recipes/${slug}.html">
<link rel="alternate" hreflang="x-default" href="${canonical}">
<meta property="og:title" content="${escAttr(title)}">
<meta property="og:description" content="${escAttr(metaDesc)}">
<meta property="og:image" content="${escAttr(image)}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="article">
<script type="application/ld+json">${schemaStr}</script>
</head>
<body>
<h1>${escHtml(title)}</h1>
<p>${escHtml(description)}</p>
<script>window.location.replace('/#recipe/'+'${escJs(r.id)}');</script>
<noscript><meta http-equiv="refresh" content="0;url=/#recipe/${escJs(r.id)}"></noscript>
<footer style="margin-top:2rem;padding:1rem 0;border-top:1px solid #eee;text-align:center;font-size:.9rem;">
  <a href="${BASE}" rel="home">مطبخ 360 — الرئيسية</a>
</footer>
</body>
</html>`;
}

// ── Helpers d'échappement ─────────────────────────────────────────────────
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function escAttr(s) {
  return escHtml(s).replace(/"/g, '&quot;');
}
function escJs(s) {
  return String(s).replace(/'/g, "\\'").replace(/\\/g, '\\\\');
}

// ── Main ──────────────────────────────────────────────────────────────────
if (!fs.existsSync(DATA_FILE)) {
  console.error('❌ data/recipes.json introuvable');
  process.exit(1);
}

const recipes = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

if (!Array.isArray(recipes)) {
  console.error('❌ data/recipes.json doit être un tableau JSON');
  process.exit(1);
}

// Créer le répertoire recipes/ si absent
fs.mkdirSync(RECIPES_DIR, { recursive: true });

// Charger l'index existant pour skip_done
let existingIndex = [];
if (fs.existsSync(INDEX_FILE)) {
  try {
    existingIndex = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  } catch (e) {
    existingIndex = [];
  }
}
const existingSlugs = new Set(existingIndex.map(e => e.slug));

// Détecter les titres dupliqués sur l'ensemble des recettes
const titleCounts = {};
for (const r of recipes) {
  const t = (r.ti || '').toLowerCase().trim();
  if (t) titleCounts[t] = (titleCounts[t] || 0) + 1;
}

// Limiter au batch
const toProcess = recipes.slice(0, BATCH);
const total     = toProcess.length;
let generated   = 0;
let skipped     = 0;
const newEntries = [];

for (let i = 0; i < total; i++) {
  const r    = toProcess[i];
  if (!r || !r.id || !r.ti) { skipped++; continue; }

  // Suffixe cuisine pour titres dupliqués
  const isDup = titleCounts[(r.ti || '').toLowerCase().trim()] > 1;
  const titleSuffix = isDup ? (CUISINE_LABELS[r.cid] || r.cid || '') : '';

  let slug = buildSlug(r) || `recipe-${r.id}`;
  // Déduplication globale (existants + générés ce run)
  if (existingSlugs.has(slug)) slug = `${slug}-${r.cid || r.id.slice(-6)}`;
  if (existingSlugs.has(slug)) slug = `${slug}-${r.id.slice(-6)}`;
  if (existingSlugs.has(slug)) slug = `recipe-${r.id}`;
  existingSlugs.add(slug); // marquer pour éviter doublons intra-run
  const file = path.join(RECIPES_DIR, `${slug}.html`);

  // Skip si déjà généré
  if (existingSlugs.has(slug) && fs.existsSync(file)) {
    skipped++;
    continue;
  }

  const html = buildHtml(r, slug, titleSuffix);
  fs.writeFileSync(file, html, 'utf8');

  newEntries.push({ id: r.id, slug, title: r.ti });
  generated++;
  console.log(`[${i + 1}/${total}] ${slug}`);
}

// Fusionner l'index et réécrire
const mergedIndex = [
  ...existingIndex.filter(e => !newEntries.some(n => n.slug === e.slug)),
  ...newEntries,
];
fs.writeFileSync(INDEX_FILE, JSON.stringify(mergedIndex), 'utf8');

console.log(`\n✅ ${generated} pages générées, ${skipped} ignorées — index: ${mergedIndex.length} entrées`);
