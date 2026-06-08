/**
 * fix-recipe-images-mealdb.mjs
 * Corrige le mismatch img↔recette en re-fetchant depuis TheMealDB (gratuit, sans clé).
 * Chaque src_id unique → 1 appel API → strMealThumb réel.
 */
import fs from 'fs';
import https from 'https';

const DATA = 'data/recipes.json';
const recipes = JSON.parse(fs.readFileSync(DATA, 'utf8'));

const fetchJson = (url) => new Promise((resolve, reject) => {
  https.get(url, r => {
    let b = '';
    r.on('data', c => b += c);
    r.on('end', () => { try { resolve(JSON.parse(b)); } catch(e) { resolve(null); } });
  }).on('error', reject);
});

// Récolter tous les src_id uniques
const uniqueIds = [...new Set(recipes.map(r => r.src_id).filter(Boolean))];
console.log(`📊 ${recipes.length} recettes → ${uniqueIds.length} src_id uniques à fetcher`);

// Cache id → { thumb, name }
const cache = {};
const start = Date.now();
for (let i = 0; i < uniqueIds.length; i++) {
  const id = uniqueIds[i];
  const j = await fetchJson(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
  const m = j?.meals?.[0];
  if (m?.strMealThumb) {
    cache[id] = { thumb: m.strMealThumb, name: m.strMeal };
  }
  if ((i+1) % 25 === 0) console.log(`  ${i+1}/${uniqueIds.length} …`);
  // soft rate limit
  await new Promise(r => setTimeout(r, 80));
}
console.log(`✅ ${Object.keys(cache).length}/${uniqueIds.length} fetchés en ${Math.round((Date.now()-start)/1000)}s`);

// Réassigner img + img_src
let fixed = 0, kept = 0, missing = 0;
for (const r of recipes) {
  if (!r.src_id) { kept++; continue; }
  const c = cache[r.src_id];
  if (!c) { missing++; continue; }
  if (r.img !== c.thumb) {
    r.img = c.thumb;
    r.img_src = 'themealdb_fixed';
    fixed++;
  } else kept++;
}

fs.writeFileSync(DATA, JSON.stringify(recipes), 'utf8');
console.log(`\n✅ ${fixed} corrigées, ${kept} OK, ${missing} sans match`);
