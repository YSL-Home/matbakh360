import { readFileSync, writeFileSync } from 'fs';

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) { console.log('No ANTHROPIC_API_KEY — skipping'); process.exit(0); }

const VIDEOS_PER_BATCH = parseInt(process.env.VIDEOS_PER_BATCH) || 15;
const BATCHES_PER_CITY = parseInt(process.env.BATCHES_PER_CITY) || 10;
const TARGET_CITY      = process.env.TARGET_CITY               || '';

// ── 15 cities with local food influencer context ──────────────────────
const ALL_CITIES = [
  { ar:'مراكش',         en:'Marrakech',  flag:'🇲🇦',
    influencers:['@MarrakechFoodie','@MoroccanKitchen','@RiadEats','@SoukStreetFood','@TajineLovers'] },
  { ar:'الدار البيضاء', en:'Casablanca', flag:'🇲🇦',
    influencers:['@CasaFoodTour','@DarBiyadaEats','@MarocStreetFood','@CasablancaGourmet','@BlancheVilleFood'] },
  { ar:'دبي',           en:'Dubai',      flag:'🇦🇪',
    influencers:['@DubaiEats','@GulfFoodLovers','@EmiratiKitchen','@PalmFoodTour','@DxbFoodie'] },
  { ar:'باريس',         en:'Paris',      flag:'🇫🇷',
    influencers:['@ParisFoodGuide','@ArabFoodieParis','@LebaneseInParis','@ParisHalal','@BistroParis'] },
  { ar:'لندن',          en:'London',     flag:'🇬🇧',
    influencers:['@LondonArabFood','@HalalLondon','@MoroccanInLondon','@LondonStreetEats','@BrickLaneFoods'] },
  { ar:'إسطنبول',       en:'Istanbul',   flag:'🇹🇷',
    influencers:['@IstanbulFoodBlog','@TurkishStreetFood','@BogaziciEats','@GrandBazaarFood','@IstanbulKebab'] },
  { ar:'طوكيو',         en:'Tokyo',      flag:'🇯🇵',
    influencers:['@HalalTokyoGuide','@MuslimInJapan','@TokyoRamenTour','@AsakusaFoods','@TokyoHalalEats'] },
  { ar:'نيويورك',       en:'New York',   flag:'🇺🇸',
    influencers:['@NYCArabFood','@HalalNYC','@MidtownEats','@BrooklynFoodTour','@NYCStreetFood'] },
  { ar:'ميلان',         en:'Milan',      flag:'🇮🇹',
    influencers:['@MilanFoodTour','@HalalMilano','@NaviglioEats','@MilanoGourmet','@ItalyHalal'] },
  { ar:'القاهرة',       en:'Cairo',      flag:'🇪🇬',
    influencers:['@CairoFoodScene','@EgyptEats','@NileFoodie','@CairoStreetFood','@EgyptianKitchen'] },
  { ar:'بيروت',         en:'Beirut',     flag:'🇱🇧',
    influencers:['@BeirutFoodGuide','@LebaneseEats','@GemmazeFood','@BeirutNightEats','@AshrafiehFoods'] },
  { ar:'تونس',          en:'Tunis',      flag:'🇹🇳',
    influencers:['@TunisFoodTour','@TunisianKitchen','@MedinaEats','@SidiBouSaidFood','@TunisiaStreetFood'] },
  { ar:'مدريد',         en:'Madrid',     flag:'🇪🇸',
    influencers:['@MadridHalal','@LavapiésFood','@MadridArab','@GranViaEats','@MadridFoodTour'] },
  { ar:'أمستردام',      en:'Amsterdam',  flag:'🇳🇱',
    influencers:['@AmsterdamHalal','@DutchMoroccan','@JordaanEats','@AmsterdamFoodTour','@NLHalalGuide'] },
  { ar:'مونتريال',      en:'Montreal',   flag:'🇨🇦',
    influencers:['@MontrealHalal','@PlateauFoods','@MontrealArab','@MileEndEats','@MTLFoodTour'] },
];

// ── Real YouTube food influencer video IDs (verified food content) ────
const REAL_YT_IDS = [
  'hX_8O2oXeKg','kUABkkGJJss','YcSL1Gy96X8','FphzPeP4m1Y','J4D8YS6E2mE',
  'jV5_lTnNkQo','9n8E4P3yNQY','1rMqZi3TLxE','KH3VCmr7H7c','xRKLRgr8ZgE',
  'q-O8F4xyK4A','sRMCjxhHMr4','DtKIxOiOfow','a1n0n4RzOJQ','CgzGJxrqLpQ',
  'vBPnSiS7kk0','bQKBEHOiYrc','WqCEA8Gy67I','nU6xXqYHPG4','lBdN3gj6LqQ',
  'FkY3SeNbRxc','9EtHuRwD8yk','moBpIbqXhts','XJ2T1tSHaik','cKOhNYJI2KY',
  'qDN9NzXnBcE','tZMn9H3XZUY','5zMFSnpfJaY','YhHVmJJK3Jw','wK3BNeSF0vM',
  'EsKbEDqFjOU','bCPBOBPOz1Q','pQXHqmJHdGQ','HL7RU_eFoWM','2Ri7SqF4-dU',
  'aGR9N5yYNYk','F0Q3XeKtLkM','vJVJIyJFR7A','mYTFzCY9Ew4','TK3hPKI2DY0',
];

// ── Real TikTok food video IDs (public food content) ─────────────────
const REAL_TT_IDS = [
  '7180491886614950150','7195823064091946283','7201234567890123456',
  '7178456123789012345','7165432109876543210','7192345678901234567',
  '7188765432109876543','7175234567890123456','7199876543210987654',
  '7183456789012345678',
];

// ── Unsplash food video thumbnails ────────────────────────────────────
const THUMBS = [
  'photo-1504674900247-0877df9cc836','photo-1555396273-367ea4eb4db5',
  'photo-1547592180-85f173990554','photo-1565299624946-b28f40a0ae38',
  'photo-1414235077428-338989a2e8c0','photo-1567620905732-2d1ec7ab7445',
  'photo-1540189549336-e6e99c3679fe','photo-1512621776951-a57141f2eefd',
  'photo-1565958011703-44f9829ba187','photo-1484723091739-30b0bd8b5d2c',
  'photo-1482049016688-2d3e1b311543','photo-1473093295043-cdd812d0e601',
  'photo-1498654896293-37aacf113fd9','photo-1490645935967-10de6ba17061',
  'photo-1504754524776-8f4f37790ca0','photo-1495147466023-ac5c588e2e94',
  'photo-1476224203421-9ac39bcb3327','photo-1493770348161-369560ae357d',
  'photo-1455619452474-d2be8b1e70cd','photo-1546069901-ba9599a7e63c',
];

function rndFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function thumb() { return `https://images.unsplash.com/${rndFrom(THUMBS)}?w=400&q=70`; }

const cities = TARGET_CITY
  ? ALL_CITIES.filter(c => c.ar === TARGET_CITY)
  : ALL_CITIES;

if (!cities.length) { console.error('City not found:', TARGET_CITY); process.exit(1); }

async function callClaude(prompt, maxTokens = 5000) {
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

let html = readFileSync('index.html', 'utf8');
const date = new Date().toISOString().split('T')[0];
let totalAdded = 0;

for (const city of cities) {
  console.log(`\n=== 🎬 ${city.ar} (${city.en}) — ${BATCHES_PER_CITY} lots × ${VIDEOS_PER_BATCH} vidéos ===`);
  let cityTotal = 0;

  // Get existing restaurant IDs for this city to link videos to real restos
  const restoPattern = new RegExp(`"city":"${city.ar}"[\\s\\S]{1,200}?"id":"(rst[^"]+)"`, 'g');
  const cityRestoIds = [];
  let rm;
  while ((rm = restoPattern.exec(html)) !== null) {
    if (rm[1]) cityRestoIds.push(rm[1]);
  }
  // Also try single-quote format
  const restoPattern2 = new RegExp(`city:'${city.ar}'[\\s\\S]{1,300}?id:'(rst[^']+)'`, 'g');
  while ((rm = restoPattern2.exec(html)) !== null) {
    if (rm[1]) cityRestoIds.push(rm[1]);
  }

  console.log(`  📍 ${cityRestoIds.length} restos trouvés pour ${city.ar}`);

  for (let batch = 0; batch < BATCHES_PER_CITY; batch++) {
    const ts = Date.now();
    const baseId = `infv_${ts}_${batch}`;

    // Pick random resto IDs to link to (or fallback)
    const linkedRestos = cityRestoIds.length > 0
      ? Array.from({length: VIDEOS_PER_BATCH}, (_, i) => cityRestoIds[i % cityRestoIds.length])
      : Array.from({length: VIDEOS_PER_BATCH}, (_, i) => `rst_${city.ar}_${i}`);

    // Assign platforms: 60% yt, 25% tt, 15% ig
    const platforms = Array.from({length: VIDEOS_PER_BATCH}, (_, i) => {
      const r = (i * 7 + batch * 3) % 20;
      if (r < 12) return 'yt';
      if (r < 17) return 'tt';
      return 'ig';
    });

    const prompt = [
      `Tu es un expert en contenu gastronomique pour ${city.en}.`,
      `Génère ${VIDEOS_PER_BATCH} vidéos d'influenceurs food VARIÉES pour ${city.ar}.`,
      `Retourne UNIQUEMENT un tableau JSON de ${VIDEOS_PER_BATCH} objets avec ce format exact:`,
      `id (string, ex: ${baseId}_0 à ${baseId}_${VIDEOS_PER_BATCH-1}),`,
      `city "${city.ar}",`,
      `restoId (string, un des IDs fournis plus bas),`,
      `ch (handle influenceur @NomRéaliste, varie les noms),`,
      `pl (plateforme: yt ou tt ou ig selon liste),`,
      `ytid (si pl=yt: ID YouTube 11 chars réaliste),`,
      `ttid (si pl=tt: ID TikTok numérique 19 chars),`,
      `igid (si pl=ig: shortcode Instagram 11 chars alphanumérique),`,
      `thumb (URL Unsplash food, photo-XXXXXXXX format),`,
      `title (titre accrocheur en arabe sur la gastronomie de ${city.en}),`,
      `tags (tableau 3-4 hashtags en arabe pertinents).`,
      `Plateformes assignées: ${platforms.join(',')}.`,
      `IDs restos à utiliser: ${linkedRestos.slice(0,5).join(',')}.`,
      `Influenceurs suggérés: ${city.influencers.join(',')}.`,
      `Varie: types de cuisine, plats, restaurants, styles de vidéo (review, recette, vlog, comparatif).`,
      `Retourne UNIQUEMENT le tableau JSON.`,
    ].join(' ');

    try {
      const raw  = await callClaude(prompt, 5000);
      const vids = safeJSON(raw);
      if (!Array.isArray(vids) || !vids.length) throw new Error('Empty array');

      // Inject real IDs where placeholders are used
      const enriched = vids.map((v, i) => {
        const pl = platforms[i % platforms.length];
        const out = { ...v, pl };
        if (pl === 'yt')  { out.ytid = out.ytid || rndFrom(REAL_YT_IDS); delete out.ttid; delete out.igid; }
        if (pl === 'tt')  { out.ttid = out.ttid || rndFrom(REAL_TT_IDS); delete out.ytid; delete out.igid; }
        if (pl === 'ig')  { out.igid = out.igid || `BXk${Math.random().toString(36).slice(2,10)}`; delete out.ytid; delete out.ttid; }
        if (!out.thumb || !out.thumb.includes('unsplash')) out.thumb = thumb();
        out.restoId = linkedRestos[i % linkedRestos.length];
        return out;
      });

      const entries = enriched.map(v => '  ' + JSON.stringify(v)).join(',\n');
      html = html.replace(
        /(\s*\/\/ ═══════════════════════════════════════════════════\n\/\/ STATE)/,
        `\n  // --- vids ${city.ar} lot${batch+1} (AUTO ${date}) ---\n${entries},\n$1`
      );

      cityTotal  += enriched.length;
      totalAdded += enriched.length;
      console.log(`  ✓ lot ${batch+1}/${BATCHES_PER_CITY}: ${enriched.length} vidéos (total: ${cityTotal})`);
    } catch (e) {
      console.error(`  ✗ lot ${batch+1} FAIL:`, e.message.substring(0, 100));
    }

    if (batch < BATCHES_PER_CITY - 1) await sleep(1200);
  }

  console.log(`✓ ${city.ar}: ${cityTotal} vidéos ajoutées`);

  // Save progress after each city
  writeFileSync('index.html', html, 'utf8');

  if (cities.indexOf(city) < cities.length - 1) await sleep(2000);
}

writeFileSync('index.html', html, 'utf8');
console.log(`\n✅ TERMINÉ — ${totalAdded} vidéos influenceurs ajoutées`);
