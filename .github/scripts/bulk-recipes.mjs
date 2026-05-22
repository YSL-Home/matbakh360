/**
 * bulk-recipes.mjs — Génère des centaines de recettes via Claude Haiku
 * et les injecte dans index.html
 */
import { readFileSync, writeFileSync } from 'fs';

const API_KEY       = process.env.ANTHROPIC_API_KEY;
const TARGET_REGION = process.env.TARGET_REGION || '';   // vide = toutes
const COUNT         = parseInt(process.env.COUNT) || 500; // recettes par région
const BATCH         = parseInt(process.env.BATCH) || 20;  // recettes par appel Claude

if(!API_KEY){ console.error('❌ ANTHROPIC_API_KEY requis'); process.exit(1); }

// ── Régions + catégories ──────────────────────────────────────────────
const ALL_REGIONS = [
  { r:'عربي', en:'Arabic', cats:[
    { cid:'mgh', cat:'مغربي',   f:'🇲🇦', em:'🫕', en:'Moroccan',   kws:['كسكس','طاجين','حريرة','بسطيلة','مرقة','سلطة'] },
    { cid:'egy', cat:'مصري',    f:'🇪🇬', em:'🫘', en:'Egyptian',   kws:['فول','كشري','ملوخية','محشي','فطير','كفتة'] },
    { cid:'lbn', cat:'لبناني',  f:'🇱🇧', em:'🫙', en:'Lebanese',   kws:['حمص','تبولة','فتوش','كبة','شاورما','مقبلات'] },
    { cid:'sau', cat:'سعودي',   f:'🇸🇦', em:'🍚', en:'Saudi',      kws:['كبسة','مندي','جريش','مطازيز','مرق','هريسة'] },
    { cid:'tun', cat:'تونسي',   f:'🇹🇳', em:'🌶️', en:'Tunisian',  kws:['كسكس','لبلابي','برك','مرقة','بريك','شورباء'] },
    { cid:'irq', cat:'عراقي',   f:'🇮🇶', em:'🍖', en:'Iraqi',      kws:['تمن','دولمة','كباب','تشريب','مرق','مسكوف'] },
    { cid:'syr', cat:'سوري',    f:'🇸🇾', em:'🫔', en:'Syrian',     kws:['كبة','شاورما','مجدرة','فتة','محاشي','كفتة'] },
  ]},
  { r:'أوروبي', en:'European', cats:[
    { cid:'ita', cat:'إيطالي',  f:'🇮🇹', em:'🍝', en:'Italian',   kws:['باستا','بيتزا','ريزوتو','لازانيا','كاربونارا','جيلاتو'] },
    { cid:'fra', cat:'فرنسي',   f:'🇫🇷', em:'🥐', en:'French',    kws:['كروسون','سوفليه','كيش','بوف بورغينيون','كريب','تارت'] },
    { cid:'esp', cat:'إسباني',  f:'🇪🇸', em:'🥘', en:'Spanish',   kws:['بايلا','توتيلا','غازباتشو','تاباس','تشوريثو','كروكيتاس'] },
    { cid:'grc', cat:'يوناني',  f:'🇬🇷', em:'🫒', en:'Greek',     kws:['موساكا','تزاتزيكي','سوفلاكي','سبانوكوبيتا','بقلاوة','هوموس'] },
    { cid:'tur', cat:'تركي',    f:'🇹🇷', em:'🍢', en:'Turkish',   kws:['دونر','منتي','بورك','باكلاوا','لحم أجون','كيفتة'] },
    { cid:'prt', cat:'برتغالي', f:'🇵🇹', em:'🥧', en:'Portuguese',kws:['باستيل دي ناتا','باكالهاو','كالدو فيردي','سرديناس'] },
  ]},
  { r:'آسيوي', en:'Asian', cats:[
    { cid:'jpn', cat:'ياباني',  f:'🇯🇵', em:'🍜', en:'Japanese',  kws:['راميان','سوشي','تيمبورا','تاكوياكي','أوبنتو','ميسو'] },
    { cid:'chn', cat:'صيني',    f:'🇨🇳', em:'🥟', en:'Chinese',   kws:['دمبلينغ','كونغ باو','بيكينغ داك','دياو','تشاو فان','بو لو بهو'] },
    { cid:'ind', cat:'هندي',    f:'🇮🇳', em:'🍛', en:'Indian',    kws:['بيريانى','كاري','ماساله','دال','تيكا ماسالا','سامبار'] },
    { cid:'tha', cat:'تايلاندي',f:'🇹🇭', em:'🌶️', en:'Thai',     kws:['باد تاي','توم يام','كاري أخضر','بو بيا','مانغو رايس','لاب'] },
    { cid:'kor', cat:'كوري',    f:'🇰🇷', em:'🍚', en:'Korean',    kws:['بيبيمباب','كيمتشي','بولغوغي','سامغيوبسال','تتوكبوكي','رامن'] },
    { cid:'idn', cat:'إندونيسي',f:'🇮🇩', em:'🍳', en:'Indonesian',kws:['ناسي غورينغ','ميي غورينغ','ساتاي','رندانغ','غادو غادو'] },
    { cid:'vnm', cat:'فيتنامي', f:'🇻🇳', em:'🍲', en:'Vietnamese',kws:['فو','بانه مي','كوم','شاكا بابا','نيم كوين','بون بو'] },
  ]},
  { r:'أمريكي', en:'American', cats:[
    { cid:'usa', cat:'أمريكي',  f:'🇺🇸', em:'🍔', en:'American',  kws:['برغر','ريبس','ماك أند شيز','لوبستر','بيف ستيك','تشيكن ويينغز'] },
    { cid:'mex', cat:'مكسيكي',  f:'🇲🇽', em:'🌮', en:'Mexican',   kws:['تاكو','برريتو','غواكامولي','إنشيلاداس','كيساديلا','موله'] },
    { cid:'bra', cat:'برازيلي', f:'🇧🇷', em:'🥩', en:'Brazilian', kws:['شوراسكو','فيجواداه','كيبي','كوكسينهاس','موكيكا','باو دي كيجو'] },
    { cid:'per', cat:'بيروفي',  f:'🇵🇪', em:'🐟', en:'Peruvian',  kws:['سيفيتشي','لومو سالتادو','آهي دي غالينا','بيكو سور'] },
    { cid:'arg', cat:'أرجنتيني',f:'🇦🇷', em:'🥟', en:'Argentinian',kws:['إمباناداس','أسادو','كيمبي','ميلانيسا','دولتشي دي ليتشي'] },
  ]},
  { r:'أفريقي', en:'African', cats:[
    { cid:'nga', cat:'نيجيري',  f:'🇳🇬', em:'🍚', en:'Nigerian',  kws:['جولوف رايس','إيغوسي','إيويدو','أكارا','سوبا','ميان'] },
    { cid:'eth', cat:'إثيوبي',  f:'🇪🇹', em:'🫓', en:'Ethiopian', kws:['إنجيرا','دورو وات','تبس','مسر وات','عياب','قطو'] },
    { cid:'sen', cat:'سنغالي',  f:'🇸🇳', em:'🍛', en:'Senegalese',kws:['تشيبو دييان','ياسا','مافي','بينيي','ندامبي','بودي'] },
    { cid:'mar', cat:'شمال أفريقي', f:'🌍', em:'🫙', en:'North African', kws:['مرق','كسكسي','لبلابي','شرمولا','برباري'] },
  ]},
  { r:'حلويات', en:'Desserts', cats:[
    { cid:'hlw', cat:'حلويات عربية', f:'🍮', em:'🍮', en:'Arab Sweets',   kws:['بقلاوة','كنافة','قطايف','بسبوسة','مهلبية','أم علي','حلاوة'] },
    { cid:'hlf', cat:'حلويات أوروبية',f:'🍰', em:'🎂', en:'European Sweets',kws:['تيراميسو','كريم برولي','مولان أو شوكولا','ماكارون','إكلير','كروكمبوش'] },
    { cid:'hla', cat:'حلويات آسيوية', f:'🧁', em:'🍡', en:'Asian Sweets',  kws:['موتشي','أنميتسو','هالوا','خير موهان','تانغ يوان','داالغنا'] },
  ]},
  { r:'صحي', en:'Healthy', cats:[
    { cid:'veg', cat:'نباتي',   f:'🥗', em:'🥗', en:'Vegan',       kws:['سلطة','بوديه بول','أفوكادو','كينوا','فجل','عدس','حمص'] },
    { cid:'kto', cat:'كيتو',    f:'⚡', em:'🥩', en:'Keto',        kws:['لحم','بيض','أجبان','أفوكادو','مكسرات','سمك','زبدة'] },
    { cid:'fit', cat:'رياضي',   f:'💪', em:'💪', en:'Fitness',     kws:['بروتين','دجاج','ترميد','إدامامي','توفو','شوفان'] },
  ]},
  { r:'رمضان', en:'Ramadan', cats:[
    { cid:'rmdn', cat:'رمضان',  f:'🌙', em:'🌙', en:'Ramadan',     kws:['حريرة','شربة','قطايف','بسبوسة','سمبوسة','لقيمات','شعبية'] },
  ]},
  { r:'سريع', en:'Quick', cats:[
    { cid:'fst', cat:'سريع',    f:'⚡', em:'⚡', en:'Quick',       kws:['10 دقائق','20 دقائق','فطور سريع','وجبة خفيفة','ساندويتش'] },
  ]},
  { r:'بحري', en:'Seafood', cats:[
    { cid:'sea', cat:'بحري',    f:'🦐', em:'🦐', en:'Seafood',     kws:['سمك','جمبري','كاليماري','بطلينوس','أخطبوط','محار','سلمون'] },
  ]},
];

const DIFF_OPTS = ['e','m','h']; // سهل/متوسط/صعب

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function callClaude(prompt, maxTokens=8000){
  const res = await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{'x-api-key':API_KEY,'anthropic-version':'2023-06-01','content-type':'application/json'},
    body:JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:maxTokens,
      messages:[{role:'user',content:prompt}] }),
  });
  const data = await res.json();
  if(!data.content?.[0]?.text) throw new Error(JSON.stringify(data).substring(0,200));
  return data.content[0].text;
}

function safeJSON(raw){
  return JSON.parse(raw.replace(/```json\n?|\n?```/g,'').trim());
}

// ── Image par catégorie ───────────────────────────────────────────────
const CAT_IMGS = {
  مغربي:['photo-1578662996442-48f60103fc96','photo-1585937421612-70a008356c36','photo-1612874742237-6526221588e3'],
  مصري: ['photo-1574756358916-ebdae0a5a437','photo-1584947897558-bce70ca82aef','photo-1565958011703-44f9829ba187'],
  لبناني:['photo-1565299507177-b0ac66763828','photo-1530554764233-e79e16c91d08','photo-1544681280-d8d9fa36e9e1'],
  سعودي:['photo-1547592180-85f173990554','photo-1526367790999-0150786686a2','photo-1608732221156-40cb3ed65b9b'],
  تونسي:['photo-1563379926898-05f4575a45d8','photo-1568158879083-c42860933ed7','photo-1544681280-d8d9fa36e9e1'],
  عراقي:['photo-1543352634-99a5d50ae78e','photo-1598932895748-f80f2a65c3b5','photo-1565958011703-44f9829ba187'],
  سوري: ['photo-1546069901-ba9599a7e63c','photo-1565299507177-b0ac66763828','photo-1568158879083-c42860933ed7'],
  إيطالي:['photo-1555396273-367ea4eb4db5','photo-1612874742237-6526221588e3','photo-1567620905732-2d1ec7ab7445'],
  فرنسي:['photo-1414235077428-338989a2e8c0','photo-1555507036-ab1f4038808a','photo-1547592180-85f173990554'],
  إسباني:['photo-1534080564583-6be75777b70a','photo-1515443961218-a51367888e4b','photo-1562802378-063ec186a863'],
  يوناني:['photo-1544681280-d8d9fa36e9e1','photo-1490645935967-10de6ba17061','photo-1529692236671-f1f6cf9683ba'],
  تركي: ['photo-1599487488170-d11ec9c172f0','photo-1578662996442-48f60103fc96','photo-1571104508999-893933ded431'],
  برتغالي:['photo-1591107576521-87091dc07797','photo-1582878826629-29b7ad1cdc43','photo-1560769629-975ec94e6a86'],
  ياباني:['photo-1569718212165-3a8278d5f624','photo-1619096252214-ef06c45683e3','photo-1580822184713-af4f1d12e3f6'],
  صيني: ['photo-1563245372-f21724e3856d','photo-1496116218417-1a781b1c416c','photo-1603496987674-79600a000f55'],
  هندي: ['photo-1455619452474-d2be8b1e70cd','photo-1588166524941-3bf61a9c41db','photo-1603894584373-5ac82b2ae398'],
  تايلاندي:['photo-1548943487-a2e4e43b4853','photo-1562565652-a0d8f0c59eb4','photo-1608732221156-40cb3ed65b9b'],
  كوري: ['photo-1590301157890-4810ed352733','photo-1580822184713-af4f1d12e3f6','photo-1547592180-85f173990554'],
  إندونيسي:['photo-1647093953000-9065ed6f85ef','photo-1569718212165-3a8278d5f624','photo-1548943487-a2e4e43b4853'],
  فيتنامي:['photo-1519984388953-d2406bc725e1','photo-1569718212165-3a8278d5f624','photo-1612874742237-6526221588e3'],
  أمريكي:['photo-1568901346375-23c9450c58cd','photo-1587241321921-91a834d6d191','photo-1561758033-d89a9ad46330'],
  مكسيكي:['photo-1565299585323-38d6b0865b47','photo-1565299624946-b28f40a0ae38','photo-1556910103-1c02745aae4d'],
  برازيلي:['photo-1594041680534-e8c8cdebd659','photo-1558618666-fcd25c85cd64','photo-1603496987351-f84a3ba5ec85'],
  بيروفي:['photo-1611262359546-64e2822b2ab5','photo-1568158879083-c42860933ed7','photo-1565299507177-b0ac66763828'],
  أرجنتيني:['photo-1579752902789-99ef3e7d0edc','photo-1603496987674-79600a000f55','photo-1562802378-063ec186a863'],
  نيجيري:['photo-1598932895748-f80f2a65c3b5','photo-1555939594-58d7cb561ad1','photo-1544025162-d76694265947'],
  إثيوبي:['photo-1731703953437-36c375c2c38a','photo-1765338915553-6e02fe63ff4f','photo-1603496987351-f84a3ba5ec85'],
  سنغالي:['photo-1725393325387-07f0d4951528','photo-1598932895748-f80f2a65c3b5','photo-1555939594-58d7cb561ad1'],
  'شمال أفريقي':['photo-1578662996442-48f60103fc96','photo-1585937421612-70a008356c36','photo-1574756358916-ebdae0a5a437'],
  'حلويات عربية':['photo-1571104508999-893933ded431','photo-1564918031455-72f4e35ba7a6','photo-1566454419431-8a4b8b37b5ca'],
  'حلويات أوروبية':['photo-1578985545062-69928b1d9587','photo-1563729784474-d77dbb933a9e','photo-1567620832903-9fc6debc209f'],
  'حلويات آسيوية':['photo-1569718212165-3a8278d5f624','photo-1536304929831-ee1ca9d44906','photo-1509440159596-0249088772ff'],
  نباتي:['photo-1512621776951-a57141f2eefd','photo-1546069901-ba9599a7e63c','photo-1490645935967-10de6ba17061'],
  كيتو:  ['photo-1544025162-d76694265947','photo-1548940740-204726a19be3','photo-1568158879083-c42860933ed7'],
  رياضي:['photo-1490645935967-10de6ba17061','photo-1512621776951-a57141f2eefd','photo-1512003867696-6d5ce6835040'],
  رمضان:['photo-1571104508999-893933ded431','photo-1578662996442-48f60103fc96','photo-1564918031455-72f4e35ba7a6'],
  سريع: ['photo-1567620905732-2d1ec7ab7445','photo-1555507036-ab1f4038808a','photo-1568901346375-23c9450c58cd'],
  بحري: ['photo-1559737558-2f5a35f4523b','photo-1519984388953-d2406bc725e1','photo-1546069901-ba9599a7e63c'],
};
function getImg(cat){
  const arr = CAT_IMGS[cat] || [CAT_IMGS.نباتي[0]];
  const id = arr[Math.floor(Math.random()*arr.length)];
  return `https://images.unsplash.com/${id}?w=500&q=80`;
}

// ── Génération d'un lot de recettes ──────────────────────────────────
async function generateBatch(cat, count, existingNames=[]){
  const avoid = existingNames.length ? `\nÉvite ces noms déjà générés: ${existingNames.slice(-30).join(', ')}` : '';
  const raw = await callClaude(
    `Tu es un chef cuisinier expert en gastronomie ${cat.en} (${cat.cat}).
Génère exactement ${count} recettes ORIGINALES et DIFFÉRENTES de cuisine ${cat.cat} (${cat.en}).
${avoid}

Chaque recette doit avoir:
- ti: titre en arabe (court, appétissant, avec pays/style si possible)
- de: description arabe 1-2 phrases
- tm: temps de préparation (ex: "30 دق" ou "2 ساعة")
- sv: portions (2-8)
- df: difficulté ("e"=سهل, "m"=متوسط, "h"=صعب)
- ing: 4-8 ingrédients [{q:"كمية",n:"اسم المكون"}]
- steps: 3-5 خطوات [{t:"الخطوة",tp:"نصيحة"}]
- kw: 3-5 كلمات مفتاحية عربية
- cal: سعرات حرارية (100-900)
- pro: بروتين بالغرام
- carb: كربوهيدرات
- fat: دهون

Retourne UNIQUEMENT un tableau JSON valide de ${count} objets:
[{"ti":"...","de":"...","tm":"...","sv":4,"df":"m","ing":[{"q":"...","n":"..."}],"steps":[{"t":"...","tp":""}],"kw":["..."],"cal":400,"pro":25,"carb":35,"fat":15}]`,
    9000
  );
  return safeJSON(raw);
}

// ── Injection dans index.html ─────────────────────────────────────────
const MARKER = '// ═══ BULK_RECIPES_INJECT ═══';

function inject(html, entries){
  if(!html.includes(MARKER)){
    throw new Error('Marqueur BULK_RECIPES_INJECT introuvable dans index.html');
  }
  return html.replace(MARKER, entries + '\n' + MARKER);
}

// ── Main ──────────────────────────────────────────────────────────────
let html = readFileSync('index.html','utf8');
const date = new Date().toISOString().split('T')[0];
let totalAdded = 0;
let recipeIdx = Date.now(); // ID unique basé sur timestamp

const regions = TARGET_REGION
  ? ALL_REGIONS.filter(r => r.r === TARGET_REGION || r.en.toLowerCase() === TARGET_REGION.toLowerCase())
  : ALL_REGIONS;

if(!regions.length){ console.error('Région introuvable:', TARGET_REGION); process.exit(1); }

for(const region of regions){
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📍 Région: ${region.r} (${region.en}) — objectif: ${COUNT} recettes`);
  console.log(`${'═'.repeat(60)}`);

  const regionEntries = [];
  const generatedNames = [];
  const perCat = Math.ceil(COUNT / region.cats.length);

  for(const cat of region.cats){
    console.log(`\n  🍽️  Catégorie: ${cat.cat} (${cat.en}) — ${perCat} recettes`);
    let catCount = 0;
    const batchesNeeded = Math.ceil(perCat / BATCH);

    for(let b = 0; b < batchesNeeded; b++){
      const remaining = perCat - catCount;
      const batchSize = Math.min(BATCH, remaining);
      if(batchSize <= 0) break;

      try{
        const batch = await generateBatch(cat, batchSize, generatedNames);
        batch.forEach((recipe, idx) => {
          const rid = `rbulk_${++recipeIdx}`;
          const obj = {
            id: rid,
            cid: cat.cid,
            f: cat.f,
            r: region.r,
            cat: cat.cat,
            em: cat.em,
            img: getImg(cat.cat),
            ti: recipe.ti || `وصفة ${cat.cat} ${catCount+idx+1}`,
            de: recipe.de || '',
            tm: recipe.tm || '30 دق',
            sv: recipe.sv || 4,
            df: ['e','m','h'].includes(recipe.df) ? recipe.df : 'm',
            rt: parseFloat((4.0 + Math.random()*0.9).toFixed(1)),
            rv: 10 + Math.floor(Math.random()*500),
            ing: Array.isArray(recipe.ing) ? recipe.ing.slice(0,8) : [],
            steps: Array.isArray(recipe.steps) ? recipe.steps.slice(0,6) : [],
            tips: [],
            nut: { cal:recipe.cal||300, pro:recipe.pro||15, carb:recipe.carb||35, fat:recipe.fat||10 },
            kw: Array.isArray(recipe.kw) ? recipe.kw : [cat.cat],
          };
          regionEntries.push('  ' + JSON.stringify(obj));
          generatedNames.push(recipe.ti||'');
          catCount++;
        });
        console.log(`    ✓ Lot ${b+1}/${batchesNeeded}: ${batch.length} recettes (${catCount}/${perCat})`);
      }catch(e){
        console.error(`    ✗ Lot ${b+1} échoué:`, e.message.substring(0,80));
      }
      if(b < batchesNeeded-1) await sleep(1200);
    }
    console.log(`    📊 ${cat.cat}: ${catCount} recettes générées`);
    if(region.cats.indexOf(cat) < region.cats.length-1) await sleep(2000);
  }

  // Injection dans le HTML
  if(regionEntries.length > 0){
    const pushCode = `\n// ─── ${region.r} (${date}) — ${regionEntries.length} recettes ───\nRECIPES.push(\n${regionEntries.join(',\n')}\n);`;
    html = inject(html, pushCode);
    writeFileSync('index.html', html, 'utf8');
    totalAdded += regionEntries.length;
    console.log(`\n  ✅ ${regionEntries.length} recettes injectées (${region.r})`);
  }

  if(regions.indexOf(region) < regions.length-1){
    console.log('  ⏳ Pause 5s...');
    await sleep(5000);
  }
}

writeFileSync('index.html', html, 'utf8');
console.log(`\n${'═'.repeat(60)}`);
console.log(`✅ TERMINÉ — ${totalAdded} recettes ajoutées`);
console.log(`${'═'.repeat(60)}`);
