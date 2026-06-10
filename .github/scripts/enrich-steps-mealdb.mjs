/**
 * enrich-steps-mealdb.mjs — GRATUIT (sans clé API)
 * Remplace les steps placeholder (1 step générique) par les vraies instructions
 * TheMealDB (strInstructions) via les 422 src_id uniques.
 */
import fs from 'fs';
import https from 'https';

const DATA = 'data/recipes.json';
const recipes = JSON.parse(fs.readFileSync(DATA,'utf8'));

const fetchJson = (url) => new Promise((res) => {
  https.get(url, r => { let b=''; r.on('data',c=>b+=c); r.on('end',()=>{try{res(JSON.parse(b))}catch{res(null)}}); }).on('error',()=>res(null));
});

// Découpe strInstructions en steps propres
function splitSteps(instr) {
  if (!instr) return [];
  return instr
    .split(/\r?\n+|(?:STEP \d+\s*)/i)
    .map(s => s.replace(/^\d+[\.\)]\s*/, '').trim())
    .filter(s => s.length > 15)
    .slice(0, 12);
}

const targets = recipes.filter(r => r.src_id && (r.steps||[]).length <= 1);
const uniqueIds = [...new Set(targets.map(r => r.src_id))];
console.log(`📊 ${targets.length} recettes à enrichir via ${uniqueIds.length} src_id`);

const cache = {};
for (let i = 0; i < uniqueIds.length; i++) {
  const j = await fetchJson(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${uniqueIds[i]}`);
  const m = j?.meals?.[0];
  if (m?.strInstructions) cache[uniqueIds[i]] = splitSteps(m.strInstructions);
  if ((i+1) % 50 === 0) console.log(`  ${i+1}/${uniqueIds.length}`);
  await new Promise(r => setTimeout(r, 70));
}

let enriched = 0, skipped = 0;
for (const r of recipes) {
  if (!r.src_id || (r.steps||[]).length > 1) { skipped++; continue; }
  const steps = cache[r.src_id];
  if (!steps || steps.length < 2) { skipped++; continue; }
  r.steps = steps.map(t => ({ t }));
  enriched++;
}

fs.writeFileSync(DATA, JSON.stringify(recipes), 'utf8');
console.log(`✅ ${enriched} recettes enrichies (vraies instructions), ${skipped} inchangées`);
