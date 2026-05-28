/**
 * gen-influencers.mjs — Matbakh360 Influencer Generator
 * ──────────────────────────────────────────────────────
 * Pour chaque ville présente dans data/restos.json et non encore couverte
 * dans data/influencers.json, génère 5 influenceurs food via Claude Haiku.
 *
 * Variables d'environnement :
 *   ANTHROPIC_API_KEY  (requis)
 *   INF_BATCH          (défaut: 10) — nombre de villes traitées par run
 */

import fs   from 'fs';
import path from 'path';
import https from 'https';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const INF_BATCH     = parseInt(process.env.INF_BATCH || '10');

const DATA_DIR          = path.resolve(process.cwd(), 'data');
const RESTOS_PATH       = path.join(DATA_DIR, 'restos.json');
const INFLUENCERS_PATH  = path.join(DATA_DIR, 'influencers.json');

if (!ANTHROPIC_KEY) {
  console.error('❌ ANTHROPIC_API_KEY manquant');
  process.exit(1);
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function claudeRequest(prompt, maxTokens = 3000) {
  const body = JSON.stringify({
    model: 'claude-haiku-4-5',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      res => {
        let d = '';
        res.on('data', c => (d += c));
        res.on('end', () => {
          try { resolve(JSON.parse(d)); }
          catch (e) { reject(new Error(`JSON parse failed: ${e.message} — raw: ${d.slice(0, 200)}`)); }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function parseJsonResponse(text) {
  const clean = text
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();
  if (clean.startsWith('[')) return JSON.parse(clean);
  // Parfois Claude enveloppe dans un objet
  const match = clean.match(/\[[\s\S]*\]/);
  if (match) return JSON.parse(match[0]);
  throw new Error(`Impossible de trouver un tableau JSON dans : ${clean.slice(0, 300)}`);
}

// ─── GÉNÉRATION INFLUENCEURS POUR UNE VILLE ───────────────────────────────────
async function generateInfluencersForCity(cityEn, cityAr) {
  const prompt = `Tu es un expert en marketing food sur les réseaux sociaux.
Génère exactement 5 influenceurs food fictifs mais réalistes pour la ville de ${cityEn} (${cityAr}).
RÉPONDS UNIQUEMENT avec un tableau JSON valide, aucun texte avant/après.

Pour chaque influenceur, respecte ce format EXACTEMENT :
[
  {
    "id": "inf_${cityEn.toLowerCase().replace(/\s+/g,'_')}_{n}",
    "city": "${cityEn}",
    "cityAr": "${cityAr}",
    "name": "Prénom Nom",
    "handle": "@handle_unique",
    "platform": "instagram|tiktok|youtube",
    "avatar": "https://i.pravatar.cc/80?u=inf_${cityEn.toLowerCase().replace(/\s+/g,'_')}_{n}",
    "videoUrl": "https://www.tiktok.com/@handle/video/0000000000",
    "thumbnail": "https://source.unsplash.com/320x180/?food,${cityEn.toLowerCase()},street",
    "titleAr": "عنوان الفيديو بالعربية",
    "titleEn": "Video title in English",
    "views": "450K",
    "likes": "32K",
    "followers": "120K"
  }
]

Remplace {n} par 1, 2, 3, 4, 5 dans les champs id et avatar.
Varie les plateformes (instagram, tiktok, youtube).
Adapte les noms, handles et titres à la culture locale de ${cityEn}.
Les chiffres views/likes/followers doivent être réalistes et variés.`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await claudeRequest(prompt, 3000);
      const text = r.content?.[0]?.text || '[]';
      const arr  = parseJsonResponse(text);
      // Normaliser les IDs pour garantir l'unicité
      return arr.map((inf, i) => ({
        ...inf,
        id: `inf_${cityEn.toLowerCase().replace(/\s+/g,'_')}_${i + 1}`,
        avatar: `https://i.pravatar.cc/80?u=inf_${cityEn.toLowerCase().replace(/\s+/g,'_')}_${i + 1}`,
      }));
    } catch (e) {
      console.warn(`  ⚠️ Attempt ${attempt + 1}/3 failed for ${cityEn}: ${e.message}`);
      await sleep(3000 * (attempt + 1));
    }
  }
  console.error(`  ❌ Impossible de générer les influenceurs pour ${cityEn} après 3 tentatives`);
  return [];
}

// ─── LECTURE DATA ─────────────────────────────────────────────────────────────
function readJsonFile(filePath, fallback = []) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.warn(`  ⚠️ Lecture ${path.basename(filePath)} échouée: ${e.message}`);
    return fallback;
  }
}

function extractUniqueCities(restos) {
  const seen = new Map(); // cityEn → cityAr
  for (const r of restos) {
    const en = r.cityEn || r.city || '';
    const ar = r.city   || r.cityEn || '';
    if (en && !seen.has(en)) seen.set(en, ar);
  }
  return [...seen.entries()].map(([en, ar]) => ({ en, ar }));
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🎬 Matbakh360 — Génération influenceurs par ville');
  console.log(`   Batch: ${INF_BATCH} villes max par run`);

  // 1. Lire influencers existants
  const existing      = readJsonFile(INFLUENCERS_PATH, []);
  const coveredCities = new Set(existing.map(inf => inf.city));
  console.log(`   Influenceurs existants: ${existing.length} (${coveredCities.size} villes couvertes)`);

  // 2. Lire restos et extraire les villes uniques
  console.log('   Lecture data/restos.json...');
  const restos         = readJsonFile(RESTOS_PATH, []);
  const allCities      = extractUniqueCities(restos);
  console.log(`   Villes dans restos.json: ${allCities.length}`);

  // 3. Filtrer les villes non encore couvertes
  const pendingCities = allCities.filter(c => !coveredCities.has(c.en));
  console.log(`   Villes restantes à traiter: ${pendingCities.length}`);

  if (pendingCities.length === 0) {
    console.log('   ✅ Toutes les villes sont déjà couvertes. Rien à faire.');
    return;
  }

  // 4. Prendre seulement INF_BATCH villes
  const batch = pendingCities.slice(0, INF_BATCH);
  console.log(`   Traitement de ${batch.length} villes ce run : ${batch.map(c => c.en).join(', ')}\n`);

  // 5. Générer influenceurs par ville
  const newInfluencers = [];
  for (let i = 0; i < batch.length; i++) {
    const city = batch[i];
    console.log(`  [${i + 1}/${batch.length}] 📍 ${city.en} (${city.ar})...`);
    const infs = await generateInfluencersForCity(city.en, city.ar);
    if (infs.length > 0) {
      newInfluencers.push(...infs);
      console.log(`    ✅ ${infs.length} influenceurs générés`);
    } else {
      console.log(`    ⚠️ Aucun influenceur généré`);
    }
    // Pause entre les appels Claude
    if (i < batch.length - 1) await sleep(1500);
  }

  // 6. Merger avec l'existant (dédoublonnage par id)
  const existingIds = new Set(existing.map(inf => inf.id));
  const fresh       = newInfluencers.filter(inf => inf.id && !existingIds.has(inf.id));
  const merged      = [...existing, ...fresh];

  // 7. Écrire
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(INFLUENCERS_PATH, JSON.stringify(merged, null, 2));

  console.log(`\n📊 Résultat :`);
  console.log(`   Nouveaux influenceurs ajoutés : ${fresh.length}`);
  console.log(`   Total influenceurs : ${merged.length}`);
  console.log('✅ Génération influenceurs terminée !');
}

main().catch(e => { console.error('❌ Erreur:', e); process.exit(1); });
