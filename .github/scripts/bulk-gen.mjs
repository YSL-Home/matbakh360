import { readFileSync, writeFileSync } from 'fs';

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) { console.log('No ANTHROPIC_API_KEY — skipping'); process.exit(0); }

const BATCH_SIZE        = parseInt(process.env.BATCH_SIZE)        || 25;
const BATCHES_PER_CITY  = parseInt(process.env.BATCHES_PER_CITY)  || 20;
const TARGET_CITY       = process.env.TARGET_CITY                 || '';

// ── 15 cities ──────────────────────────────────────────────────────────
const ALL_CITIES = [
  { ar:'مراكش',         en:'Marrakech',  flag:'🇲🇦' },
  { ar:'الدار البيضاء', en:'Casablanca', flag:'🇲🇦' },
  { ar:'دبي',           en:'Dubai',      flag:'🇦🇪' },
  { ar:'باريس',         en:'Paris',      flag:'🇫🇷' },
  { ar:'لندن',          en:'London',     flag:'🇬🇧' },
  { ar:'إسطنبول',       en:'Istanbul',   flag:'🇹🇷' },
  { ar:'طوكيو',         en:'Tokyo',      flag:'🇯🇵' },
  { ar:'نيويورك',       en:'New York',   flag:'🇺🇸' },
  { ar:'ميلان',         en:'Milan',      flag:'🇮🇹' },
  { ar:'القاهرة',       en:'Cairo',      flag:'🇪🇬' },
  { ar:'بيروت',         en:'Beirut',     flag:'🇱🇧' },
  { ar:'تونس',          en:'Tunis',      flag:'🇹🇳' },
  { ar:'مدريد',         en:'Madrid',     flag:'🇪🇸' },
  { ar:'أمستردام',      en:'Amsterdam',  flag:'🇳🇱' },
  { ar:'مونتريال',      en:'Montreal',   flag:'🇨🇦' },
];

const cities = TARGET_CITY
  ? ALL_CITIES.filter(c => c.ar === TARGET_CITY)
  : ALL_CITIES;

if (!cities.length) {
  console.error('City not found:', TARGET_CITY);
  process.exit(1);
}

// ── Claude API ──────────────────────────────────────────────────────────
async function callClaude(prompt, maxTokens = 8000) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  if (!data.content?.[0]?.text) throw new Error(JSON.stringify(data));
  return data.content[0].text;
}

function safeJSON(raw) {
  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(cleaned);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Main ────────────────────────────────────────────────────────────────
let html = readFileSync('index.html', 'utf8');
const date = new Date().toISOString().split('T')[0];
let totalAdded = 0;

for (const city of cities) {
  console.log(`\n=== ${city.ar} (${city.en}) — ${BATCHES_PER_CITY} lots × ${BATCH_SIZE} = ${BATCHES_PER_CITY * BATCH_SIZE} restos ===`);
  let cityTotal = 0;

  // Find highest existing rst ID to avoid duplicates
  const existingIds = (html.match(/id:'rst(\d+)'/g) || [])
    .map(m => parseInt(m.replace("id:'rst", '').replace("'", '')))
    .filter(n => !isNaN(n));
  let idCounter = existingIds.length ? Math.max(...existingIds) + 100 : 1000;

  for (let batch = 0; batch < BATCHES_PER_CITY; batch++) {
    const firstId = `rst${idCounter}`;
    const lastId  = `rst${idCounter + BATCH_SIZE - 1}`;
    idCounter    += BATCH_SIZE;

    // Build prompt without YAML-problematic characters embedded in workflow
    const prompt = [
      `Tu es un expert gastronomique de ${city.en}.`,
      `Génère ${BATCH_SIZE} restaurants DIFFÉRENTS, VARIÉS, AUTHENTIQUES à ${city.en}.`,
      `Retourne UNIQUEMENT un tableau JSON valide (sans markdown) de ${BATCH_SIZE} objets.`,
      `Format de chaque objet:`,
      `id (string de ${firstId} à ${lastId}),`,
      `name (nom en arabe),`,
      `city "${city.ar}",`,
      `cityEn "${city.en}",`,
      `country "${city.flag}",`,
      `cuisine (type principal en arabe),`,
      `cusines (tableau 2-3 types en arabe),`,
      `rating (4.0-5.0),`,
      `rv (100-5000),`,
      `price (parmi: $ ou $$ ou $$$ ou $$$$),`,
      `address (adresse réelle en arabe),`,
      `img (URL Unsplash restaurant ou nourriture, photo-XXXX format),`,
      `tags (tableau 3 mots-clés en arabe),`,
      `ig (@handle instagram),`,
      `tt (@handle tiktok),`,
      `desc (description 2-3 phrases en arabe),`,
      `hours (ex: 12:00-23:00),`,
      `phone (+XX XXX XXX),`,
      `vids (tableau vide []).`,
      `Varie les types de cuisine, les quartiers, les gammes de prix.`,
      `Retourne UNIQUEMENT le tableau JSON, rien d'autre.`,
    ].join(' ');

    try {
      const raw    = await callClaude(prompt, 8000);
      const restos = safeJSON(raw);
      if (!Array.isArray(restos) || !restos.length) throw new Error('Empty or non-array response');

      const entries = restos.map(r => '  ' + JSON.stringify(r)).join(',\n');
      html = html.replace(
        /(\s*\/\/ ═══ INFLUENCER VIDEOS)/,
        `\n  // --- ${city.ar} lot${batch + 1} (AUTO ${date}) ---\n${entries},\n$1`
      );

      cityTotal  += restos.length;
      totalAdded += restos.length;
      console.log(`  ✓ lot ${batch + 1}/${BATCHES_PER_CITY}: ${restos.length} restos (ville total: ${cityTotal})`);
    } catch (e) {
      console.error(`  ✗ lot ${batch + 1} FAIL:`, e.message.substring(0, 100));
    }

    // Generate 8 videos every batch (YouTube + TikTok + Instagram)
    try {
      const ts = Date.now();
      const plList = ['yt','yt','yt','yt','tt','tt','ig','ig'];
      const vidPrompt = [
        `Génère 8 vidéos d'influenceurs gastronomiques pour ${city.en} / ${city.ar}.`,
        `Retourne UNIQUEMENT un tableau JSON de 8 objets.`,
        `Format: id (infb_${ts}_1 à infb_${ts}_8), city "${city.ar}", restoId "rst${idCounter - BATCH_SIZE}",`,
        `ch (@handle influenceur food réaliste), pl selon liste: ${plList.join(',')},`,
        `ytid (11 chars si yt), ttid (19 chiffres si tt), igid (11 chars alphanumériques si ig),`,
        `thumb (URL Unsplash food photo-XXXXXXXX), title (titre accrocheur en arabe), tags (3 tags arabe).`,
        `Varie les handles, styles (review/recette/vlog/découverte), types de plats. Tout en arabe.`,
      ].join(' ');

      const vraw = await callClaude(vidPrompt, 3000);
      const vids = safeJSON(vraw);
      if (Array.isArray(vids) && vids.length) {
        const ventries = vids.map(v => '  ' + JSON.stringify(v)).join(',\n');
        html = html.replace(
          /(\s*\/\/ ═══════════════════════════════════════════════════\n\/\/ STATE)/,
          `\n  // --- ${city.ar} vids lot${batch + 1} (AUTO ${date}) ---\n${ventries},\n$1`
        );
        console.log(`    + ${vids.length} vidéos (yt/tt/ig)`);
      }
    } catch (_) { /* videos are optional */ }

    if (batch < BATCHES_PER_CITY - 1) await sleep(1500);
  }

  console.log(`\n✓ ${city.ar}: ${cityTotal} restaurants ajoutés`);

  // Save intermediate progress after each city
  writeFileSync('index.html', html, 'utf8');

  if (cities.indexOf(city) < cities.length - 1) await sleep(2000);
}

writeFileSync('index.html', html, 'utf8');
console.log(`\n✅ TERMINÉ — ${totalAdded} restaurants ajoutés au total`);
