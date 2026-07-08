/**
 * gen-influencers.mjs — Matbakh360 Influencer Generator (global)
 * ────────────────────────────────────────────────────────────────
 * Génère 5 influenceurs food fictifs par ville pour une liste mondiale exhaustive.
 * Idempotent : skip les villes déjà couvertes dans data/influencers.json.
 *
 * Variables d'environnement :
 *   ANTHROPIC_API_KEY  (requis)
 *   INF_BATCH          (défaut: 15) — nombre de villes traitées par run
 */

import fs   from 'fs';
import path from 'path';
import https from 'https';

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const INF_BATCH     = parseInt(process.env.INF_BATCH || '15');

const DATA_DIR         = path.resolve(process.cwd(), 'data');
const INFLUENCERS_PATH = path.join(DATA_DIR, 'influencers.json');

if (!ANTHROPIC_KEY) { console.error('❌ ANTHROPIC_API_KEY manquant'); process.exit(1); }

// ─── LISTE MONDIALE EXHAUSTIVE ────────────────────────────────────────────────
// Format : { en, ar, country }
const WORLD_CITIES = [
  // Monde arabe
  { en:'Cairo',        ar:'القاهرة',       country:'Égypte' },
  { en:'Alexandria',   ar:'الإسكندرية',    country:'Égypte' },
  { en:'Luxor',        ar:'الأقصر',        country:'Égypte' },
  { en:'Riyadh',       ar:'الرياض',        country:'Arabie Saoudite' },
  { en:'Jeddah',       ar:'جدة',           country:'Arabie Saoudite' },
  { en:'Mecca',        ar:'مكة المكرمة',   country:'Arabie Saoudite' },
  { en:'Medina',       ar:'المدينة المنورة',country:'Arabie Saoudite' },
  { en:'Dubai',        ar:'دبي',           country:'Émirats Arabes Unis' },
  { en:'Abu Dhabi',    ar:'أبوظبي',        country:'Émirats Arabes Unis' },
  { en:'Sharjah',      ar:'الشارقة',       country:'Émirats Arabes Unis' },
  { en:'Beirut',       ar:'بيروت',         country:'Liban' },
  { en:'Tripoli',      ar:'طرابلس لبنان',  country:'Liban' },
  { en:'Amman',        ar:'عمان',          country:'Jordanie' },
  { en:'Aqaba',        ar:'العقبة',        country:'Jordanie' },
  { en:'Baghdad',      ar:'بغداد',         country:'Irak' },
  { en:'Basra',        ar:'البصرة',        country:'Irak' },
  { en:'Erbil',        ar:'أربيل',         country:'Irak' },
  { en:'Damascus',     ar:'دمشق',          country:'Syrie' },
  { en:'Aleppo',       ar:'حلب',           country:'Syrie' },
  { en:'Kuwait City',  ar:'مدينة الكويت',  country:'Koweït' },
  { en:'Manama',       ar:'المنامة',        country:'Bahreïn' },
  { en:'Doha',         ar:'الدوحة',        country:'Qatar' },
  { en:'Muscat',       ar:'مسقط',          country:'Oman' },
  { en:'Sana\'a',      ar:'صنعاء',         country:'Yémen' },
  { en:'Aden',         ar:'عدن',           country:'Yémen' },
  { en:'Casablanca',   ar:'الدار البيضاء', country:'Maroc' },
  { en:'Rabat',        ar:'الرباط',        country:'Maroc' },
  { en:'Marrakech',    ar:'مراكش',         country:'Maroc' },
  { en:'Fes',          ar:'فاس',           country:'Maroc' },
  { en:'Tangier',      ar:'طنجة',          country:'Maroc' },
  { en:'Agadir',       ar:'أكادير',        country:'Maroc' },
  { en:'Tunis',        ar:'تونس',          country:'Tunisie' },
  { en:'Sfax',         ar:'صفاقس',         country:'Tunisie' },
  { en:'Sousse',       ar:'سوسة',          country:'Tunisie' },
  { en:'Algiers',      ar:'الجزائر',       country:'Algérie' },
  { en:'Oran',         ar:'وهران',         country:'Algérie' },
  { en:'Constantine',  ar:'قسنطينة',       country:'Algérie' },
  { en:'Tripoli Libya',ar:'طرابلس ليبيا',  country:'Libye' },
  { en:'Benghazi',     ar:'بنغازي',        country:'Libye' },
  { en:'Khartoum',     ar:'الخرطوم',       country:'Soudan' },
  { en:'Nouakchott',   ar:'نواكشوط',       country:'Mauritanie' },
  { en:'Mogadishu',    ar:'مقديشو',        country:'Somalie' },
  { en:'Djibouti City',ar:'جيبوتي',        country:'Djibouti' },
  { en:'Ramallah',     ar:'رام الله',      country:'Palestine' },
  { en:'Gaza',         ar:'غزة',           country:'Palestine' },

  // Afrique subsaharienne
  { en:'Lagos',        ar:'لاغوس',         country:'Nigeria' },
  { en:'Abuja',        ar:'أبوجا',         country:'Nigeria' },
  { en:'Accra',        ar:'أكرا',          country:'Ghana' },
  { en:'Dakar',        ar:'داكار',         country:'Sénégal' },
  { en:'Abidjan',      ar:'أبيدجان',       country:'Côte d\'Ivoire' },
  { en:'Nairobi',      ar:'نيروبي',        country:'Kenya' },
  { en:'Addis Ababa',  ar:'أديس أبابا',    country:'Éthiopie' },
  { en:'Dar es Salaam',ar:'دار السلام',    country:'Tanzanie' },
  { en:'Johannesburg', ar:'جوهانسبرغ',     country:'Afrique du Sud' },
  { en:'Cape Town',    ar:'كيب تاون',      country:'Afrique du Sud' },

  // Europe
  { en:'Paris',        ar:'باريس',         country:'France' },
  { en:'Marseille',    ar:'مرسيليا',       country:'France' },
  { en:'Lyon',         ar:'ليون',          country:'France' },
  { en:'London',       ar:'لندن',          country:'Royaume-Uni' },
  { en:'Manchester',   ar:'مانشستر',       country:'Royaume-Uni' },
  { en:'Birmingham',   ar:'برمنغهام',      country:'Royaume-Uni' },
  { en:'Berlin',       ar:'برلين',         country:'Allemagne' },
  { en:'Munich',       ar:'ميونخ',         country:'Allemagne' },
  { en:'Hamburg',      ar:'هامبورغ',       country:'Allemagne' },
  { en:'Madrid',       ar:'مدريد',         country:'Espagne' },
  { en:'Barcelona',    ar:'برشلونة',       country:'Espagne' },
  { en:'Rome',         ar:'روما',          country:'Italie' },
  { en:'Milan',        ar:'ميلانو',        country:'Italie' },
  { en:'Naples',       ar:'نابولي',        country:'Italie' },
  { en:'Amsterdam',    ar:'أمستردام',      country:'Pays-Bas' },
  { en:'Brussels',     ar:'بروكسل',        country:'Belgique' },
  { en:'Zurich',       ar:'زيورخ',         country:'Suisse' },
  { en:'Vienna',       ar:'فيينا',         country:'Autriche' },
  { en:'Stockholm',    ar:'ستوكهولم',      country:'Suède' },
  { en:'Oslo',         ar:'أوسلو',         country:'Norvège' },
  { en:'Copenhagen',   ar:'كوبنهاغن',      country:'Danemark' },
  { en:'Athens',       ar:'أثينا',         country:'Grèce' },
  { en:'Lisbon',       ar:'لشبونة',        country:'Portugal' },
  { en:'Warsaw',       ar:'وارسو',         country:'Pologne' },
  { en:'Prague',       ar:'براغ',          country:'République tchèque' },
  { en:'Budapest',     ar:'بودابست',       country:'Hongrie' },
  { en:'Istanbul',     ar:'إسطنبول',       country:'Turquie' },
  { en:'Ankara',       ar:'أنقرة',         country:'Turquie' },
  { en:'Antalya',      ar:'أنطاليا',       country:'Turquie' },
  { en:'Moscow',       ar:'موسكو',         country:'Russie' },
  { en:'St Petersburg',ar:'سانت بطرسبرغ', country:'Russie' },

  // Asie
  { en:'Tokyo',        ar:'طوكيو',         country:'Japon' },
  { en:'Osaka',        ar:'أوساكا',        country:'Japon' },
  { en:'Kyoto',        ar:'كيوتو',         country:'Japon' },
  { en:'Seoul',        ar:'سيول',          country:'Corée du Sud' },
  { en:'Busan',        ar:'بوسان',         country:'Corée du Sud' },
  { en:'Beijing',      ar:'بكين',          country:'Chine' },
  { en:'Shanghai',     ar:'شنغهاي',        country:'Chine' },
  { en:'Guangzhou',    ar:'غوانغجو',       country:'Chine' },
  { en:'Chengdu',      ar:'تشنغدو',        country:'Chine' },
  { en:'Hong Kong',    ar:'هونغ كونغ',     country:'Hong Kong' },
  { en:'Taipei',       ar:'تايبيه',        country:'Taïwan' },
  { en:'Bangkok',      ar:'بانكوك',        country:'Thaïlande' },
  { en:'Chiang Mai',   ar:'شيانغ ماي',     country:'Thaïlande' },
  { en:'Singapore',    ar:'سنغافورة',      country:'Singapour' },
  { en:'Kuala Lumpur', ar:'كوالالمبور',    country:'Malaisie' },
  { en:'Jakarta',      ar:'جاكرتا',        country:'Indonésie' },
  { en:'Bali',         ar:'بالي',          country:'Indonésie' },
  { en:'Manila',       ar:'مانيلا',        country:'Philippines' },
  { en:'Ho Chi Minh',  ar:'هو تشي منه',    country:'Vietnam' },
  { en:'Hanoi',        ar:'هانوي',         country:'Vietnam' },
  { en:'Mumbai',       ar:'مومباي',        country:'Inde' },
  { en:'Delhi',        ar:'دلهي',          country:'Inde' },
  { en:'Bangalore',    ar:'بنغالور',       country:'Inde' },
  { en:'Kolkata',      ar:'كولكاتا',       country:'Inde' },
  { en:'Hyderabad',    ar:'حيدر آباد',     country:'Inde' },
  { en:'Karachi',      ar:'كراتشي',        country:'Pakistan' },
  { en:'Lahore',       ar:'لاهور',         country:'Pakistan' },
  { en:'Islamabad',    ar:'إسلام آباد',    country:'Pakistan' },
  { en:'Dhaka',        ar:'دكا',           country:'Bangladesh' },
  { en:'Colombo',      ar:'كولومبو',       country:'Sri Lanka' },
  { en:'Kathmandu',    ar:'كاتماندو',      country:'Népal' },
  { en:'Kabul',        ar:'كابول',         country:'Afghanistan' },
  { en:'Tehran',       ar:'طهران',         country:'Iran' },
  { en:'Isfahan',      ar:'أصفهان',        country:'Iran' },
  { en:'Tbilisi',      ar:'تبليسي',        country:'Géorgie' },
  { en:'Baku',         ar:'باكو',          country:'Azerbaïdjan' },
  { en:'Yerevan',      ar:'يريفان',        country:'Arménie' },
  { en:'Tashkent',     ar:'طشقند',         country:'Ouzbékistan' },
  { en:'Almaty',       ar:'ألماتي',        country:'Kazakhstan' },

  // Amériques
  { en:'New York',     ar:'نيويورك',       country:'États-Unis' },
  { en:'Los Angeles',  ar:'لوس أنجلوس',    country:'États-Unis' },
  { en:'Chicago',      ar:'شيكاغو',        country:'États-Unis' },
  { en:'Houston',      ar:'هيوستن',        country:'États-Unis' },
  { en:'Miami',        ar:'ميامي',         country:'États-Unis' },
  { en:'San Francisco',ar:'سان فرانسيسكو', country:'États-Unis' },
  { en:'Las Vegas',    ar:'لاس فيغاس',     country:'États-Unis' },
  { en:'Toronto',      ar:'تورنتو',        country:'Canada' },
  { en:'Montreal',     ar:'مونتريال',      country:'Canada' },
  { en:'Vancouver',    ar:'فانكوفر',       country:'Canada' },
  { en:'Mexico City',  ar:'مكسيكو سيتي',   country:'Mexique' },
  { en:'Guadalajara',  ar:'غوادالاخارا',   country:'Mexique' },
  { en:'São Paulo',    ar:'ساو باولو',     country:'Brésil' },
  { en:'Rio de Janeiro',ar:'ريو دي جانيرو',country:'Brésil' },
  { en:'Buenos Aires', ar:'بوينس آيرس',    country:'Argentine' },
  { en:'Bogotá',       ar:'بوغوتا',        country:'Colombie' },
  { en:'Lima',         ar:'ليما',          country:'Pérou' },
  { en:'Santiago',     ar:'سانتياغو',      country:'Chili' },
  { en:'Havana',       ar:'هافانا',        country:'Cuba' },

  // Océanie
  { en:'Sydney',       ar:'سيدني',         country:'Australie' },
  { en:'Melbourne',    ar:'ملبورن',        country:'Australie' },
  { en:'Auckland',     ar:'أوكلاند',       country:'Nouvelle-Zélande' },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function claudeRequest(prompt, maxTokens = 2000) {
  const body = JSON.stringify({
    model: 'claude-haiku-4-5',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let d = '';
      res.on('data', c => (d += c));
      res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch (e) { reject(new Error(`JSON parse failed: ${e.message} — raw: ${d.slice(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function parseJsonResponse(text) {
  const clean = text.replace(/```json\s*/g,'').replace(/```\s*/g,'').trim();
  if (clean.startsWith('[')) return JSON.parse(clean);
  const match = clean.match(/\[[\s\S]*\]/);
  if (match) return JSON.parse(match[0]);
  throw new Error(`Pas de tableau JSON dans: ${clean.slice(0,300)}`);
}

async function generateInfluencersForCity(cityEn, cityAr, country) {
  const slug = cityEn.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');
  const prompt = `Expert marketing food réseaux sociaux. Génère 5 influenceurs food fictifs réalistes pour ${cityEn}, ${country} (${cityAr}).
RÉPONDS UNIQUEMENT avec un tableau JSON valide, aucun texte avant/après.

Format EXACT (remplace {n} par 1..5) :
[{"id":"inf_${slug}_{n}","city":"${cityEn}","cityAr":"${cityAr}","cityEn":"${cityEn}","country":"${country}","name":"Prénom Nom","handle":"@handle","platform":"instagram|tiktok|youtube","avatar":"https://i.pravatar.cc/80?u=inf_${slug}_{n}","thumbnail":"https://source.unsplash.com/320x180/?food,${encodeURIComponent(cityEn)}","titleAr":"عنوان بالعربية","titleEn":"Title in English","views":"450K","likes":"32K","followers":"120K"}]

Règles: noms/handles adaptés à la culture locale, plateformes variées, chiffres réalistes et variés.`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await claudeRequest(prompt, 2000);
      const text = r.content?.[0]?.text || '[]';
      const arr  = parseJsonResponse(text);
      return arr.map((inf, i) => ({
        ...inf,
        id:     `inf_${slug}_${i+1}`,
        avatar: `https://i.pravatar.cc/80?u=inf_${slug}_${i+1}`,
        cityEn, cityAr, country,
      }));
    } catch (e) {
      console.warn(`  ⚠️ Tentative ${attempt+1}/3 échouée pour ${cityEn}: ${e.message}`);
      await sleep(3000 * (attempt + 1));
    }
  }
  console.error(`  ❌ Échec pour ${cityEn} après 3 tentatives`);
  return [];
}

function readJsonFile(p, fallback=[]) {
  if (!fs.existsSync(p)) return fallback;
  try { return JSON.parse(fs.readFileSync(p,'utf8')); }
  catch { return fallback; }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  const existing      = readJsonFile(INFLUENCERS_PATH, []);
  const coveredCities = new Set(existing.map(inf => (inf.cityEn||inf.city||'').toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'')));

  console.log(`🌍 Matbakh360 — Génération influenceurs mondiale`);
  console.log(`   ${WORLD_CITIES.length} villes cibles | ${existing.length} influenceurs existants (${coveredCities.size} villes couvertes)`);

  const pending = WORLD_CITIES.filter(c => {
    const slug = c.en.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');
    return !coveredCities.has(slug);
  });

  console.log(`   Restantes: ${pending.length} villes — traitement de ${Math.min(pending.length, INF_BATCH)} ce run\n`);

  if (pending.length === 0) {
    console.log('   ✅ Toutes les villes mondiales sont couvertes !');
    return;
  }

  const batch = pending.slice(0, INF_BATCH);
  const newInfluencers = [];

  for (let i = 0; i < batch.length; i++) {
    const { en, ar, country } = batch[i];
    process.stdout.write(`  [${i+1}/${batch.length}] 📍 ${en} (${country})... `);
    const infs = await generateInfluencersForCity(en, ar, country);
    console.log(`${infs.length} influenceurs`);
    newInfluencers.push(...infs);
    if (i < batch.length - 1) await sleep(500);
  }

  const all = [...existing, ...newInfluencers];
  // Dédoublonner par id
  const deduped = [...new Map(all.map(i => [i.id, i])).values()];
  fs.writeFileSync(INFLUENCERS_PATH, JSON.stringify(deduped, null, 2));

  const covered = new Set(deduped.map(i => (i.cityEn||i.city||'').toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'')));
  console.log(`\n✅ +${newInfluencers.length} influenceurs ajoutés`);
  console.log(`   Total: ${deduped.length} influenceurs | ${covered.size}/${WORLD_CITIES.length} villes couvertes`);
  if (pending.length > INF_BATCH) console.log(`   ⏭  Relance pour les ${pending.length - INF_BATCH} villes restantes`);
}

main().catch(e => { console.error(e); process.exit(1); });
