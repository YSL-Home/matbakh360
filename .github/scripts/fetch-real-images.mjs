/**
 * fetch-real-images.mjs — Vraies photos Google Places pour les restaurants
 * ─────────────────────────────────────────────────────────────────────────
 * Chaque run :
 *   1. Lit restos.json, cible les restos avec images génériques/vides
 *   2. findplacefromtext → photo_reference
 *   3. Suit le redirect → lh3.googleusercontent.com (URL permanente sans clé)
 *   4. Met à jour restos.json
 *
 * Coût Google Places (sur free tier $200/mois) :
 *   Find Place     $0.017/req
 *   Place Photo    $0.007/req
 *   Total          ~$0.024/resto → ~8 333 gratuits/mois
 *
 * Variables d'environnement :
 *   GOOGLE_PLACES_KEY  (requis)
 *   IMG_BATCH          (défaut 300) — restos traités par run
 */

import fs   from 'fs';
import https from 'https';
import path  from 'path';

const GOOGLE_KEY  = process.env.GOOGLE_PLACES_KEY || '';
const DATA_DIR    = path.resolve(process.cwd(), 'data');
const MAX_PER_RUN = parseInt(process.env.IMG_BATCH || '300');
const RESTOS_FILE = `${DATA_DIR}/restos.json`;

// Patterns qui signalent une image générique (à remplacer)
const GENERIC = [
  'themealdb.com/images/media/meals/',
  'ssrrrs',
];
const isGeneric = img => !img || img.length < 8 || GENERIC.some(p => img.includes(p));

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
function getJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Matbakh360/1.0' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

function followRedirect(url) {
  return new Promise(resolve => {
    const req = https.get(url, { headers: { 'User-Agent': 'Matbakh360/1.0' } }, res => {
      res.resume(); // drain
      const loc = res.headers['location'];
      resolve((res.statusCode === 301 || res.statusCode === 302) && loc ? loc : null);
    });
    req.on('error', () => resolve(null));
    req.setTimeout(8000, () => { req.destroy(); resolve(null); });
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Google Places Photo ──────────────────────────────────────────────────────
async function fetchPlacePhoto(nameEn, cityEn) {
  // 1. Find Place
  const q   = encodeURIComponent(`${nameEn} restaurant ${cityEn}`);
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json`
            + `?input=${q}&inputtype=textquery&fields=photos,name&key=${GOOGLE_KEY}`;
  const data = await getJSON(url);
  const ref  = data?.candidates?.[0]?.photos?.[0]?.photo_reference;
  if (!ref) return null;

  // 2. Follow redirect → URL permanente googleusercontent.com
  const photoUrl = `https://maps.googleapis.com/maps/api/place/photo`
                 + `?maxwidth=800&photoreference=${ref}&key=${GOOGLE_KEY}`;
  const finalUrl = await followRedirect(photoUrl);

  // N'accepte que les URLs googleusercontent (permanentes, sans clé)
  return finalUrl?.includes('googleusercontent.com') ? finalUrl : null;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
if (!GOOGLE_KEY) {
  console.error('❌ GOOGLE_PLACES_KEY manquant');
  process.exit(0); // exit 0 pour ne pas bloquer le workflow
}

const restos  = JSON.parse(fs.readFileSync(RESTOS_FILE, 'utf8'));
const targets = restos.filter(r => isGeneric(r.img));
const batch   = targets.slice(0, MAX_PER_RUN);

console.log(`🖼️  ${targets.length} restos sans image réelle → traitement de ${batch.length} ce run`);

const idxMap = new Map(restos.map((r, i) => [r.id, i]));
let updated = 0, skipped = 0;

for (let i = 0; i < batch.length; i++) {
  const r     = batch[i];
  const name  = r.nameEn || r.name || '';
  const city  = r.cityEn || '';

  const photo = await fetchPlacePhoto(name, city);
  if (photo) {
    restos[idxMap.get(r.id)].img = photo;
    updated++;
  } else {
    skipped++;
  }

  // Rate limit : 4 req/s (findplace + photo = 2 appels par resto → 8 req/s max)
  await sleep(260);

  if ((i + 1) % 25 === 0 || i === batch.length - 1) {
    process.stdout.write(`  [${i+1}/${batch.length}] ✅ ${updated} ok / ❌ ${skipped} skip\n`);
  }
}

fs.writeFileSync(RESTOS_FILE, JSON.stringify(restos));
console.log(`\n✅ Done: ${updated} images réelles ajoutées, ${skipped} non trouvées`);
console.log(`   Restos restants sans image: ${targets.length - updated}`);
