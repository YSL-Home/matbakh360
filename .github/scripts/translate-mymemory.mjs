/**
 * translate-mymemory.mjs — Traduction EN→FR/ES/PT/IT/ZH/JA (GRATUIT, sans clé)
 * Source = recipe_translations.json[id].en. API MyMemory (50k mots/j avec email).
 * Reprenable, budget par run.
 * Env: MM_EMAIL, WORD_BUDGET (défaut 4000), TR_LANGS (défaut fr,es,pt,it,zh,ja)
 */
import fs from 'fs';
import https from 'https';

const TR_PATH = 'data/recipe_translations.json';
const recipes = JSON.parse(fs.readFileSync('data/recipes.json','utf8'));
let TR = {};
try { TR = JSON.parse(fs.readFileSync(TR_PATH,'utf8')); } catch {}

const EMAIL  = process.env.MM_EMAIL || 'lahucef@gmail.com';
const BUDGET = parseInt(process.env.WORD_BUDGET || '4000');
const LANGS  = (process.env.TR_LANGS || 'fr,es,pt,it,zh,ja').split(',');
const wc = (s) => String(s||'').trim().split(/\s+/).filter(Boolean).length;

function mm(text, lang) {
  const q = encodeURIComponent(text.slice(0,480));
  const url = `https://api.mymemory.translated.net/get?q=${q}&langpair=en|${lang}&de=${encodeURIComponent(EMAIL)}`;
  return new Promise(res => {
    https.get(url, r => { let b=''; r.on('data',c=>b+=c); r.on('end',()=>{
      try { const j=JSON.parse(b); res(j?.responseData?.translatedText||null); } catch { res(null); }
    }); }).on('error',()=>res(null));
  });
}

let used=0, done=0;
outer:
for (const lang of LANGS) {
  for (const r of recipes) {
    const en = TR[r.id]?.en;
    if (!en?.ti) continue;
    if (TR[r.id]?.[lang]?.ti) continue;
    const cost = wc(en.ti)+wc(en.de);
    if (used+cost > BUDGET) break outer;
    const ti = await mm(en.ti, lang); await new Promise(r=>setTimeout(r,250));
    const de = await mm(en.de, lang); await new Promise(r=>setTimeout(r,250));
    if (ti) { TR[r.id]=TR[r.id]||{}; TR[r.id][lang]={ ti, ...(de?{de}:{}) }; done++; }
    used += cost;
    if (done%25===0 && done) { fs.writeFileSync(TR_PATH, JSON.stringify(TR)); console.log(`  ${lang}: ${done} (${used} mots)`); }
  }
}
fs.writeFileSync(TR_PATH, JSON.stringify(TR), 'utf8');
const cov={}; for (const l of LANGS) cov[l]=recipes.filter(r=>TR[r.id]?.[l]?.ti).length;
console.log(`✅ +${done} trad ce run (${used} mots) · couverture:`, cov, `/ ${recipes.length}`);
