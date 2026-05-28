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

// ── Slugify ───────────────────────────────────────────────────────────────
function slugify(str) {
  return str
    .normalize('NFD')                        // décomposer les accents
    .replace(/[̀-ͯ]/g, '')         // supprimer les diacritiques latins
    .replace(/[؀-ۿݐ-ݿ]/g, c => {
      // Translittération basique arabe → latin
      const map = {
        'ا':'a','أ':'a','إ':'a','آ':'a','ب':'b','ت':'t','ث':'th','ج':'j',
        'ح':'h','خ':'kh','د':'d','ذ':'dh','ر':'r','ز':'z','س':'s','ش':'sh',
        'ص':'s','ض':'d','ط':'t','ظ':'z','ع':'a','غ':'gh','ف':'f','ق':'q',
        'ك':'k','ل':'l','م':'m','ن':'n','ه':'h','و':'w','ي':'y','ى':'a',
        'ة':'a','ء':'','ئ':'y','ؤ':'w','لا':'la',
      };
      return map[c] || '';
    })
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

// ── Template HTML (~3KB) ──────────────────────────────────────────────────
function buildHtml(r, slug) {
  const title       = r.ti  || 'وصفة';
  const description = r.de  || title;
  const image       = r.img || `${BASE}/icons/icon-512.png`;
  const category    = r.cat || '';
  const cookTime    = parseCookTime(r.tm);
  const yield_      = r.sv  ? String(r.sv) : '4';
  const calories    = r.nut && r.nut.cal ? `${r.nut.cal} cal` : '';
  const canonical   = `${BASE}/recipes/${slug}.html`;

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

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: title,
    description,
    image,
    recipeCategory: category,
    cookTime,
    recipeYield: yield_,
    nutrition: {
      '@type': 'NutritionInformation',
      calories,
    },
    recipeIngredient: ingredients,
    recipeInstructions: instructions,
  };

  const schemaStr = JSON.stringify(schema);

  // Tronquer la description meta à 160 chars
  const metaDesc = description.length > 160
    ? description.substring(0, 157) + '...'
    : description;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escHtml(title)} | مطبخ 360</title>
<meta name="description" content="${escAttr(metaDesc)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${canonical}">
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
<script>window.location='/#recipe/${escJs(r.id)}';</script>
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

// Limiter au batch
const toProcess = recipes.slice(0, BATCH);
const total     = toProcess.length;
let generated   = 0;
let skipped     = 0;
const newEntries = [];

for (let i = 0; i < total; i++) {
  const r    = toProcess[i];
  if (!r || !r.id || !r.ti) { skipped++; continue; }

  const slug = slugify(r.ti) || `recipe-${r.id}`;
  const file = path.join(RECIPES_DIR, `${slug}.html`);

  // Skip si déjà généré
  if (existingSlugs.has(slug) && fs.existsSync(file)) {
    skipped++;
    continue;
  }

  const html = buildHtml(r, slug);
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
