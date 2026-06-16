/**
 * gen-seo-pages-lang.mjs
 * Génère les pages recettes localisées /{lang}/recipes/{slug}.html (en, fr)
 * depuis recipes/index.json (slugs propres) + recipe_translations.json.
 * hreflang réciproque AR <-> EN <-> FR. Ne génère que si traduction dispo.
 */
import fs from 'fs';
import path from 'path';

const BASE = 'https://matbakh360.com';
const LANGS = (process.env.LANGS || 'en,fr,es,pt,it,zh,ja').split(',');

const recipes = JSON.parse(fs.readFileSync('data/recipes.json','utf8'));
const recById = Object.fromEntries(recipes.map(r => [r.id, r]));
const index = JSON.parse(fs.readFileSync('recipes/index.json','utf8'));
let TR = {}; try { TR = JSON.parse(fs.readFileSync('data/recipe_translations.json','utf8')); } catch {}

const esc = (s)=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const escA = (s)=>esc(s).replace(/"/g,'&quot;');
const escJ = (s)=>String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");

function parseCook(tm){ if(!tm) return 'PT30M'; const n=parseInt(tm); return isNaN(n)?'PT30M':`PT${n}M`; }

function build(r, slug, lang, tr) {
  const ti = tr.ti;
  const de = tr.de || ti;
  const steps = tr.steps || (r.steps||[]).map(s=>s.t).filter(Boolean);
  const img = r.img && /^https?:/.test(r.img) ? r.img : `${BASE}/icons/icon-512.png`;
  const canonical = `${BASE}/${lang}/recipes/${slug}.html`;
  const ings = Array.isArray(r.ing) ? r.ing.map(i=>`${i.q||''} ${i.n||''}`.trim()) : [];
  const metaDesc = de.length>160 ? de.slice(0,157)+'...' : de;
  const seoTitle = lang==='fr' ? `${ti} — recette | Matbakh 360` : `${ti} — recipe | Matbakh 360`;

  const schema = {
    '@context':'https://schema.org','@type':'Recipe', name:ti, description:de, image:img,
    recipeCategory:r.cat||'', cookTime:parseCook(r.tm), recipeYield:String(r.sv||4), inLanguage:lang,
    ...(r.nut?.cal?{nutrition:{'@type':'NutritionInformation',calories:`${r.nut.cal} cal`,...(r.nut.pro?{proteinContent:`${r.nut.pro} g`}:{}),...(r.nut.carb?{carbohydrateContent:`${r.nut.carb} g`}:{}),...(r.nut.fat?{fatContent:`${r.nut.fat} g`}:{})}}:{}),
    recipeIngredient: ings,
    recipeInstructions: steps.map((t,i)=>({'@type':'HowToStep',position:i+1,text:t})),
  };

  // hreflang: ar (page racine) + en + fr selon dispo
  const alts = [`<link rel="alternate" hreflang="ar" href="${BASE}/recipes/${slug}.html">`];
  for (const l of LANGS) if (TR[r.id]?.[l]?.ti) alts.push(`<link rel="alternate" hreflang="${l}" href="${BASE}/${l}/recipes/${slug}.html">`);
  alts.push(`<link rel="alternate" hreflang="x-default" href="${BASE}/recipes/${slug}.html">`);

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-NTM6B493');</script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6870790039775701" crossorigin="anonymous"></script>
<meta name="google-adsense-account" content="ca-pub-6870790039775701">
<title>${esc(seoTitle)}</title>
<meta name="description" content="${escA(metaDesc)}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<link rel="icon" type="image/svg+xml" href="${BASE}/favicon.svg">
<link rel="canonical" href="${canonical}">
${alts.join('\n')}
<meta property="og:title" content="${escA(ti)}"><meta property="og:description" content="${escA(metaDesc)}">
<meta property="og:image" content="${escA(img)}"><meta property="og:url" content="${canonical}"><meta property="og:type" content="article">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
</head>
<body>
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NTM6B493" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<h1>${esc(ti)}</h1>
<p>${esc(de)}</p>
${ings.length?`<h2>${lang==='fr'?'Ingrédients':'Ingredients'}</h2><ul>${ings.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>`:''}
${steps.length?`<h2>${lang==='fr'?'Préparation':'Instructions'}</h2><ol>${steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>`:''}
<script>window.location.replace('/?lang=${lang}#recipe/'+'${escJ(r.id)}');</script>
<noscript><p><a href="/recipes/${slug}.html">${lang==='fr'?'Voir sur Matbakh 360':'View on Matbakh 360'}</a></p></noscript>
<footer style="margin-top:2rem;padding:1rem 0;border-top:1px solid #eee;text-align:center;font-size:.9rem;">
  <a href="${BASE}" rel="home">Matbakh 360</a>
</footer>
</body></html>`;
}

const out = {};
for (const lang of LANGS) {
  fs.mkdirSync(`${lang}/recipes`, { recursive: true });
  const idx = [];
  for (const { id, slug } of index) {
    const r = recById[id]; const tr = TR[id]?.[lang];
    if (!r || !tr?.ti) continue;
    fs.writeFileSync(`${lang}/recipes/${slug}.html`, build(r, slug, lang, tr));
    idx.push({ id, slug, lang });
  }
  fs.writeFileSync(`${lang}/recipes/index.json`, JSON.stringify(idx));
  out[lang] = idx.length;
}
console.log(`✅ pages localisées:`, out);
