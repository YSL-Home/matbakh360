/**
 * fetch-recipe-images.mjs
 * Récupère de vraies images per-recette depuis TheMealDB + Pexels
 * PEXELS_API_KEY requis (gratuit sur https://www.pexels.com/api/)
 */
import fs from 'fs';
import https from 'https';

const RECIPES_PATH = 'data/recipes.json';
const BATCH = parseInt(process.env.IMG_BATCH || '100');
const PEXELS_KEY = process.env.PEXELS_API_KEY || '';

const sleep = ms => new Promise(r => setTimeout(r, ms));

function getJSON(url, headers = {}) {
  return new Promise((resolve) => {
    const u = new URL(url);
    https.get({
      hostname: u.hostname, path: u.pathname + u.search,
      headers: { 'User-Agent': 'Matbakh360/1.0', ...headers }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(null); } });
    }).on('error', () => resolve(null));
  });
}

async function getTheMealDBImage(srcId) {
  const d = await getJSON(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${srcId}`);
  const img = d?.meals?.[0]?.strMealThumb;
  return img && !img.includes('default') ? img : null;
}

async function getPexelsImage(query) {
  if (!PEXELS_KEY) return null;
  const q = encodeURIComponent(query.replace(/[()]/g,'').trim());
  const d = await getJSON(
    `https://api.pexels.com/v1/search?query=${q}+food+dish&per_page=3&orientation=landscape`,
    { Authorization: PEXELS_KEY }
  );
  // Pick best result (avoid portraits/people)
  const photos = d?.photos || [];
  const best = photos.find(p => p.width > p.height) || photos[0];
  return best?.src?.large || best?.src?.medium || null;
}

const recipes = JSON.parse(fs.readFileSync(RECIPES_PATH, 'utf8'));

// Count image usage → fix most-duplicated first
const imgCount = {};
recipes.forEach(r => { imgCount[r.img] = (imgCount[r.img] || 0) + 1; });

// Fix recipes with images used >2 times AND not yet unique
const toFix = recipes
  .filter(r => (imgCount[r.img] || 0) > 2)
  .sort((a, b) => (imgCount[b.img] || 0) - (imgCount[a.img] || 0)) // worst first
  .slice(0, BATCH);

console.log(`Recipes to fix: ${toFix.length}`);
if (!PEXELS_KEY) console.warn('⚠️  No PEXELS_API_KEY — only TheMealDB fallback');

let fixed = 0;
for (let i = 0; i < toFix.length; i++) {
  const r = toFix[i];
  const idx = recipes.findIndex(x => x.id === r.id);
  let newImg = null;

  // 1. TheMealDB by src_id (unique per TheMealDB meal)
  if (r.src_id && /^\d+$/.test(String(r.src_id))) {
    newImg = await getTheMealDBImage(r.src_id);
    // Only use if not already taken by another recipe
    if (newImg && imgCount[newImg] > 1 && newImg !== recipes[idx].img) {
      newImg = null; // already in use, try Pexels
    }
  }

  // 2. Pexels search by recipe title (unique per title)
  if (!newImg && PEXELS_KEY) {
    const title = r.ti?.replace(/[أإآاى]/g, 'ا') || '';
    const query = title.length < 30 ? title : (r.seo_title || title);
    newImg = await getPexelsImage(query);
    await sleep(50); // Pexels rate limit
  }

  if (newImg && newImg !== recipes[idx].img) {
    imgCount[recipes[idx].img]--;
    imgCount[newImg] = (imgCount[newImg] || 0) + 1;
    recipes[idx].img = newImg;
    fixed++;
    console.log(`[${i+1}/${toFix.length}] ✓ ${r.ti?.substring(0,40)}`);
  } else {
    console.log(`[${i+1}/${toFix.length}] - ${r.ti?.substring(0,40)} (no new img)`);
  }

  if ((i + 1) % 10 === 0) {
    fs.writeFileSync(RECIPES_PATH, JSON.stringify(recipes), 'utf8');
  }
  await sleep(150);
}

fs.writeFileSync(RECIPES_PATH, JSON.stringify(recipes), 'utf8');
console.log(`\n✅ Fixed ${fixed}/${toFix.length}`);
