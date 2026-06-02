/**
 * translate-all.mjs
 * Traduit recettes + restos dans toutes les langues via Claude haiku-4-5
 * Langues: fr, en, es, pt, it, zh, ja (+ ar déjà stocké)
 * Usage: ANTHROPIC_API_KEY=... TRANSLATE_BATCH=50 node translate-all.mjs
 */
import fs from 'fs';
import https from 'https';

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) { console.error('ANTHROPIC_API_KEY requis'); process.exit(1); }

const BATCH = parseInt(process.env.TRANSLATE_BATCH || '30');
const LANGS = ['fr','en','es','pt','it','zh','ja'];
const RECIPES_PATH = 'data/recipes.json';
const RESTOS_PATH = 'data/restos.json';
const TR_PATH = 'data/recipe_translations.json';
const RST_TR_PATH = 'data/resto_translations.json';
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Claude API ────────────────────────────────────────────────────
function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }]
    });
    const req = https.request({
      hostname: 'api.anthropic.com', path: '/v1/messages', method: 'POST',
      headers: { 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01',
        'content-type': 'application/json', 'content-length': Buffer.byteLength(body) }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d).content?.[0]?.text || ''); }
        catch { reject(new Error('parse error')); }
      });
    });
    req.on('error', reject);
    req.setTimeout(20000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body); req.end();
  });
}

function parseJSON(txt) {
  const m = txt.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

// ── Translate a recipe into all 7 languages at once ───────────────
async function translateRecipe(r) {
  const steps = (r.steps || []).slice(0, 6).map(s => s.t || '').filter(Boolean);
  const tips = (r.tips || []).slice(0, 3).filter(Boolean);
  const prompt = `Translate this Arabic recipe data into: fr, en, es, pt, it, zh, ja.
Return ONLY valid JSON. No extra text.

Input:
- title: "${r.ti}"
- description: "${(r.de || '').substring(0, 150)}"
- steps: ${JSON.stringify(steps)}
- tips: ${JSON.stringify(tips)}

Output format exactly:
{"fr":{"ti":"...","de":"...","steps":["..."],"tips":["..."]},"en":{...},"es":{...},"pt":{...},"it":{...},"zh":{...},"ja":{...}}`;

  const raw = await callClaude(prompt);
  return parseJSON(raw);
}

// ── Translate a restaurant name + description ──────────────────────
async function translateResto(r) {
  const name = r.nameAr || r.name || '';
  const desc = (r.desc || '').substring(0, 100);
  const prompt = `Translate this restaurant info into: fr, en, es, pt, it, zh, ja.
Return ONLY valid JSON. No extra text.

Input:
- name: "${name}"
- description: "${desc}"

Output:
{"fr":{"name":"...","desc":"..."},"en":{...},"es":{...},"pt":{...},"it":{...},"zh":{...},"ja":{...}}`;

  const raw = await callClaude(prompt);
  return parseJSON(raw);
}

// ── Load existing translations ─────────────────────────────────────
function loadJSON(path, def = {}) {
  try { return JSON.parse(fs.readFileSync(path, 'utf8')); }
  catch { return def; }
}

// ═══════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════
const recipes = JSON.parse(fs.readFileSync(RECIPES_PATH, 'utf8'));
const restos = JSON.parse(fs.readFileSync(RESTOS_PATH, 'utf8'));
const recipeTR = loadJSON(TR_PATH);
const restoTR = loadJSON(RST_TR_PATH);

// Find recipes not yet translated
const recipesToDo = recipes.filter(r => !recipeTR[r.id] || !recipeTR[r.id].fr).slice(0, BATCH);
// Find restos not yet translated (only those with Arabic names)
const restosToDo = restos.filter(r => r.nameAr && (!restoTR[r.id] || !restoTR[r.id].fr))
  .slice(0, Math.floor(BATCH / 2));

console.log(`Recipes to translate: ${recipesToDo.length} | Restos: ${restosToDo.length}`);
console.log(`Remaining recipes: ${recipes.filter(r => !recipeTR[r.id]?.fr).length - recipesToDo.length}`);

let rDone = 0, rstDone = 0;

// Translate recipes
for (let i = 0; i < recipesToDo.length; i++) {
  const r = recipesToDo[i];
  try {
    const tr = await translateRecipe(r);
    if (tr && tr.fr) {
      recipeTR[r.id] = tr;
      rDone++;
      console.log(`[R ${i+1}/${recipesToDo.length}] ✓ ${r.ti?.substring(0,40)}`);
    } else {
      console.log(`[R ${i+1}/${recipesToDo.length}] ✗ ${r.ti?.substring(0,40)}`);
    }
  } catch(e) { console.error(`[R ${i+1}] Error:`, e.message); }
  
  if ((i + 1) % 5 === 0) fs.writeFileSync(TR_PATH, JSON.stringify(recipeTR), 'utf8');
  await sleep(400);
}
fs.writeFileSync(TR_PATH, JSON.stringify(recipeTR), 'utf8');

// Translate restos
for (let i = 0; i < restosToDo.length; i++) {
  const r = restosToDo[i];
  try {
    const tr = await translateResto(r);
    if (tr && tr.fr) {
      restoTR[r.id] = tr;
      rstDone++;
      console.log(`[RST ${i+1}/${restosToDo.length}] ✓ ${r.name?.substring(0,30)}`);
    }
  } catch(e) { console.error(`[RST ${i+1}] Error:`, e.message); }
  
  if ((i + 1) % 5 === 0) fs.writeFileSync(RST_TR_PATH, JSON.stringify(restoTR), 'utf8');
  await sleep(300);
}
fs.writeFileSync(RST_TR_PATH, JSON.stringify(restoTR), 'utf8');

console.log(`\n✅ Done: ${rDone} recipes, ${rstDone} restos translated`);
console.log(`Files: ${TR_PATH} (${Object.keys(recipeTR).length} entries), ${RST_TR_PATH} (${Object.keys(restoTR).length} entries)`);
