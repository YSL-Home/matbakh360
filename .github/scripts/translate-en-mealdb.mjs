/**
 * translate-en-mealdb.mjs — Anglais 100% propre depuis la source (GRATUIT, sans clé)
 * Remplit data/recipe_translations.json[id].en = { ti, de, steps } depuis TheMealDB.
 * Reprenable.
 */
import fs from 'fs';
import https from 'https';

const recipes = JSON.parse(fs.readFileSync('data/recipes.json','utf8'));
const TR_PATH = 'data/recipe_translations.json';
let TR = {};
try { TR = JSON.parse(fs.readFileSync(TR_PATH,'utf8')); } catch {}

const fetchJson = (u) => new Promise(res => {
  https.get(u, r => { let b=''; r.on('data',c=>b+=c); r.on('end',()=>{try{res(JSON.parse(b))}catch{res(null)}}); }).on('error',()=>res(null));
});
const splitSteps = (instr) => !instr ? [] : instr
  .split(/\r?\n+|(?:STEP \d+\s*)/i).map(s=>s.replace(/^\d+[\.\)]\s*/,'').trim())
  .filter(s=>s.length>15).slice(0,12);

const doneSrc = new Set();
for (const r of recipes) if (TR[r.id]?.en?.ti) doneSrc.add(r.src_id);
const uniqueIds = [...new Set(recipes.map(r=>r.src_id).filter(Boolean))];
const todo = uniqueIds.filter(id => !doneSrc.has(id));
console.log(`📊 EN: ${todo.length} src_id restants (${uniqueIds.length-todo.length} faits)`);

const cache = {};
let ok=0, fail=0;
for (let i=0;i<todo.length;i++) {
  const id = todo[i];
  const j = await fetchJson(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
  const m = j?.meals?.[0];
  if (m?.strMeal) {
    cache[id] = { ti:m.strMeal, de:`${m.strMeal} — authentic ${m.strArea||''} ${m.strCategory||''} recipe with step-by-step instructions, ingredients and photos.`.replace(/\s+/g,' ').trim(), steps:splitSteps(m.strInstructions) };
    ok++;
  } else fail++;
  if ((i+1)%50===0) console.log(`  ${i+1}/${todo.length} (ok ${ok}, fail ${fail})`);
  await new Promise(r=>setTimeout(r,180));
}

let filled=0;
for (const r of recipes) {
  const c = cache[r.src_id];
  if (!c?.ti) continue;
  TR[r.id] = TR[r.id] || {};
  TR[r.id].en = { ti:c.ti, de:c.de, ...(c.steps.length?{steps:c.steps}:{}) };
  filled++;
}
fs.writeFileSync(TR_PATH, JSON.stringify(TR), 'utf8');
const totalEN = recipes.filter(r => TR[r.id]?.en?.ti).length;
console.log(`✅ +${filled} EN ce run · total EN: ${totalEN}/${recipes.length}`);
