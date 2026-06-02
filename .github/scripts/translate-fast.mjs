/**
 * translate-fast.mjs — Traduction ultra-rapide
 * 5 recettes par appel Claude + 8 requêtes parallèles = ~200 recettes/min
 * Usage: ANTHROPIC_API_KEY=... node translate-fast.mjs
 */
import fs from 'fs';
import https from 'https';

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) { console.error('ANTHROPIC_API_KEY requis'); process.exit(1); }

const CONCURRENCY = parseInt(process.env.CONCURRENCY || '8');
const RECIPES_PER_CALL = 5;
const LANGS = ['fr','en','es','pt','it','zh','ja'];
const RECIPES_PATH = 'data/recipes.json';
const RESTOS_PATH = 'data/restos.json';
const TR_PATH = 'data/recipe_translations.json';
const RST_TR_PATH = 'data/resto_translations.json';
const sleep = ms => new Promise(r => setTimeout(r, ms));

function callClaude(prompt) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 4000,
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
        catch { resolve(''); }
      });
    });
    req.on('error', () => resolve(''));
    req.setTimeout(30000, () => { req.destroy(); resolve(''); });
    req.write(body); req.end();
  });
}

// Translate batch of recipes in one call
async function translateBatch(batch) {
  const input = batch.map((r, i) => ({
    id: r.id,
    ti: r.ti || '',
    de: (r.de || '').substring(0, 120),
    steps: (r.steps || []).slice(0, 6).map(s => s.t || '').filter(Boolean),
    tips: (r.tips || []).slice(0, 3).filter(Boolean)
  }));

  const prompt = `Translate these ${batch.length} Arabic recipes into ALL these languages: fr, en, es, pt, it, zh, ja.
Return ONLY a JSON array. Each item must have "id" plus all 7 language objects.

Input: ${JSON.stringify(input)}

Required format:
[
  {"id":"r01","fr":{"ti":"...","de":"...","steps":["step1","step2"],"tips":["tip1"]},"en":{...},"es":{...},"pt":{...},"it":{...},"zh":{...},"ja":{...}},
  ...
]

Rules: Keep steps as simple string array. Keep translations concise. Return valid JSON only.`;

  const raw = await callClaude(prompt);
  const m = raw.match(/\[[\s\S]*\]/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

// Translate batch of restaurants
async function translateRestoBatch(batch) {
  const input = batch.map(r => ({
    id: r.id,
    name: r.nameAr || r.name || '',
    desc: (r.desc || '').substring(0, 80)
  }));

  const prompt = `Translate these ${batch.length} restaurant names/descriptions into: fr, en, es, pt, it, zh, ja.
Return ONLY a JSON array.

Input: ${JSON.stringify(input)}

Format:
[{"id":"...","fr":{"name":"...","desc":"..."},"en":{...},"es":{...},"pt":{...},"it":{...},"zh":{...},"ja":{...}},...]`;

  const raw = await callClaude(prompt);
  const m = raw.match(/\[[\s\S]*\]/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

// Run batches with concurrency limit
async function runParallel(items, batchFn, concurrency, label) {
  const results = [];
  let processed = 0;
  
  for (let i = 0; i < items.length; i += concurrency * RECIPES_PER_CALL) {
    const wave = [];
    for (let j = 0; j < concurrency && (i + j * RECIPES_PER_CALL) < items.length; j++) {
      const start = i + j * RECIPES_PER_CALL;
      const batch = items.slice(start, start + RECIPES_PER_CALL);
      if (batch.length > 0) wave.push(batchFn(batch));
    }
    
    const waveResults = await Promise.all(wave);
    for (const r of waveResults) {
      if (r) results.push(...r);
    }
    
    processed += wave.length * RECIPES_PER_CALL;
    const pct = Math.min(100, Math.round(processed / items.length * 100));
    console.log(`${label}: ${Math.min(processed, items.length)}/${items.length} (${pct}%)`);
    
    await sleep(100); // brief pause between waves
  }
  
  return results;
}

// ── MAIN ──────────────────────────────────────────
const recipes = JSON.parse(fs.readFileSync(RECIPES_PATH, 'utf8'));
const restos = JSON.parse(fs.readFileSync(RESTOS_PATH, 'utf8'));

let recipeTR = {};
let restoTR = {};
try { recipeTR = JSON.parse(fs.readFileSync(TR_PATH, 'utf8')); } catch {}
try { restoTR = JSON.parse(fs.readFileSync(RST_TR_PATH, 'utf8')); } catch {}

// Only untranslated
const recipesToDo = recipes.filter(r => !recipeTR[r.id]?.fr);
const restosToDo = restos.filter(r => r.nameAr && !restoTR[r.id]?.fr);

console.log(`\n📊 To translate: ${recipesToDo.length} recipes, ${restosToDo.length} restos`);
console.log(`⚡ Speed: ${CONCURRENCY} parallel × ${RECIPES_PER_CALL}/call = ${CONCURRENCY * RECIPES_PER_CALL}/round`);
const eta = Math.ceil(recipesToDo.length / (CONCURRENCY * RECIPES_PER_CALL)) * 2;
console.log(`⏱  ETA recipes: ~${eta} seconds (~${Math.ceil(eta/60)} min)\n`);

const start = Date.now();

// Translate recipes
const recResults = await runParallel(recipesToDo, translateBatch, CONCURRENCY, '🍽️ Recettes');
for (const item of recResults) {
  if (item?.id) {
    const { id, ...langs } = item;
    recipeTR[id] = langs;
  }
}
fs.writeFileSync(TR_PATH, JSON.stringify(recipeTR), 'utf8');
console.log(`✅ Recipes: ${Object.keys(recipeTR).length} translated`);

// Translate restos (smaller batch, they're simpler)
const rstResults = await runParallel(restosToDo, translateRestoBatch, CONCURRENCY, '🏪 Restos');
for (const item of rstResults) {
  if (item?.id) {
    const { id, ...langs } = item;
    restoTR[id] = langs;
  }
}
fs.writeFileSync(RST_TR_PATH, JSON.stringify(restoTR), 'utf8');
console.log(`✅ Restos: ${Object.keys(restoTR).length} translated`);

const elapsed = Math.round((Date.now() - start) / 1000);
console.log(`\n🏁 Total: ${elapsed}s`);
