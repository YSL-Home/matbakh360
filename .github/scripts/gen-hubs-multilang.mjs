/**
 * gen-hubs-multilang.mjs
 * Étend gen-hubs.mjs en générant les pages cuisine en 8 langues:
 *   hubs/{lang}/cuisine/{cid}.html
 * Pour chaque cuisine ID (esp, fra, ita…) on génère 8 versions
 * + un index global hubs/{lang}/ multilangue + sitemap injecté.
 */
import fs from 'fs';

const BASE = 'https://matbakh360.com';
const recipes = JSON.parse(fs.readFileSync('data/recipes.json','utf8'));
const recIdx  = JSON.parse(fs.readFileSync('recipes/index.json','utf8'));
const recSlug = Object.fromEntries(recIdx.map(e => [e.id, e.slug]));

const esc = (s) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

// Labels cuisine en 8 langues + emoji
const CUIS = {
  esp:{em:'🇪🇸',ar:'إسبانية',fr:'Espagnole',en:'Spanish',es:'Española',pt:'Espanhola',it:'Spagnola',zh:'西班牙',ja:'スペイン'},
  fra:{em:'🇫🇷',ar:'فرنسية',fr:'Française',en:'French',es:'Francesa',pt:'Francesa',it:'Francese',zh:'法国',ja:'フランス'},
  ita:{em:'🇮🇹',ar:'إيطالية',fr:'Italienne',en:'Italian',es:'Italiana',pt:'Italiana',it:'Italiana',zh:'意大利',ja:'イタリア'},
  jpn:{em:'🇯🇵',ar:'يابانية',fr:'Japonaise',en:'Japanese',es:'Japonesa',pt:'Japonesa',it:'Giapponese',zh:'日本',ja:'日本'},
  chn:{em:'🇨🇳',ar:'صينية',fr:'Chinoise',en:'Chinese',es:'China',pt:'Chinesa',it:'Cinese',zh:'中国',ja:'中華'},
  ind:{em:'🇮🇳',ar:'هندية',fr:'Indienne',en:'Indian',es:'India',pt:'Indiana',it:'Indiana',zh:'印度',ja:'インド'},
  mex:{em:'🇲🇽',ar:'مكسيكية',fr:'Mexicaine',en:'Mexican',es:'Mexicana',pt:'Mexicana',it:'Messicana',zh:'墨西哥',ja:'メキシコ'},
  grk:{em:'🇬🇷',ar:'يونانية',fr:'Grecque',en:'Greek',es:'Griega',pt:'Grega',it:'Greca',zh:'希腊',ja:'ギリシャ'},
  tur:{em:'🇹🇷',ar:'تركية',fr:'Turque',en:'Turkish',es:'Turca',pt:'Turca',it:'Turca',zh:'土耳其',ja:'トルコ'},
  mar:{em:'🇲🇦',ar:'مغربية',fr:'Marocaine',en:'Moroccan',es:'Marroquí',pt:'Marroquina',it:'Marocchina',zh:'摩洛哥',ja:'モロッコ'},
  egy:{em:'🇪🇬',ar:'مصرية',fr:'Égyptienne',en:'Egyptian',es:'Egipcia',pt:'Egípcia',it:'Egiziana',zh:'埃及',ja:'エジプト'},
  tun:{em:'🇹🇳',ar:'تونسية',fr:'Tunisienne',en:'Tunisian',es:'Tunecina',pt:'Tunisina',it:'Tunisina',zh:'突尼斯',ja:'チュニジア'},
  lbn:{em:'🇱🇧',ar:'لبنانية',fr:'Libanaise',en:'Lebanese',es:'Libanesa',pt:'Libanesa',it:'Libanese',zh:'黎巴嫩',ja:'レバノン'},
  sau:{em:'🇸🇦',ar:'سعودية',fr:'Saoudienne',en:'Saudi',es:'Saudí',pt:'Saudita',it:'Saudita',zh:'沙特',ja:'サウジ'},
  ira:{em:'🇮🇷',ar:'إيرانية',fr:'Iranienne',en:'Iranian',es:'Iraní',pt:'Iraniana',it:'Iraniana',zh:'伊朗',ja:'イラン'},
  tha:{em:'🇹🇭',ar:'تايلاندية',fr:'Thaïlandaise',en:'Thai',es:'Tailandesa',pt:'Tailandesa',it:'Tailandese',zh:'泰国',ja:'タイ'},
  ken:{em:'🇰🇪',ar:'كينية',fr:'Kenyane',en:'Kenyan',es:'Keniana',pt:'Queniana',it:'Keniota',zh:'肯尼亚',ja:'ケニア'},
  vnm:{em:'🇻🇳',ar:'فيتنامية',fr:'Vietnamienne',en:'Vietnamese',es:'Vietnamita',pt:'Vietnamita',it:'Vietnamita',zh:'越南',ja:'ベトナム'},
  mys:{em:'🇲🇾',ar:'ماليزية',fr:'Malaisienne',en:'Malaysian',es:'Malasia',pt:'Malaia',it:'Malese',zh:'马来西亚',ja:'マレーシア'},
  prt:{em:'🇵🇹',ar:'برتغالية',fr:'Portugaise',en:'Portuguese',es:'Portuguesa',pt:'Portuguesa',it:'Portoghese',zh:'葡萄牙',ja:'ポルトガル'},
  pol:{em:'🇵🇱',ar:'بولندية',fr:'Polonaise',en:'Polish',es:'Polaca',pt:'Polonesa',it:'Polacca',zh:'波兰',ja:'ポーランド'},
  gbr:{em:'🇬🇧',ar:'بريطانية',fr:'Britannique',en:'British',es:'Británica',pt:'Britânica',it:'Britannica',zh:'英国',ja:'イギリス'},
  can:{em:'🇨🇦',ar:'كندية',fr:'Canadienne',en:'Canadian',es:'Canadiense',pt:'Canadense',it:'Canadese',zh:'加拿大',ja:'カナダ'},
  jam:{em:'🇯🇲',ar:'جامايكية',fr:'Jamaïcaine',en:'Jamaican',es:'Jamaicana',pt:'Jamaicana',it:'Giamaicana',zh:'牙买加',ja:'ジャマイカ'},
};

const LANGS = ['ar','fr','en','es','pt','it','zh','ja'];
const RTL = new Set(['ar']);

const STRINGS = {
  ar:{home:'الرئيسية',recipes:'وصفة',discover:'اكتشف',pageTitle:(n,c)=>`${n}+ وصفات ${c}`,desc:(n,c)=>`اكتشف ${n} وصفات أصيلة من المطبخ ${c}. مكونات، خطوات، صور وفيديوهات.`},
  fr:{home:'Accueil',recipes:'recettes',discover:'Découvrir',pageTitle:(n,c)=>`${n}+ recettes ${c}`,desc:(n,c)=>`Découvrez ${n} recettes authentiques de la cuisine ${c}. Ingrédients, étapes, photos et vidéos.`},
  en:{home:'Home',recipes:'recipes',discover:'Discover',pageTitle:(n,c)=>`${n}+ ${c} recipes`,desc:(n,c)=>`Discover ${n} authentic ${c} recipes. Ingredients, steps, photos and videos.`},
  es:{home:'Inicio',recipes:'recetas',discover:'Descubrir',pageTitle:(n,c)=>`${n}+ recetas ${c}`,desc:(n,c)=>`Descubre ${n} recetas auténticas de la cocina ${c}. Ingredientes, pasos, fotos y vídeos.`},
  pt:{home:'Início',recipes:'receitas',discover:'Descobrir',pageTitle:(n,c)=>`${n}+ receitas ${c}`,desc:(n,c)=>`Descubra ${n} receitas autênticas da cozinha ${c}. Ingredientes, passos, fotos e vídeos.`},
  it:{home:'Home',recipes:'ricette',discover:'Scopri',pageTitle:(n,c)=>`${n}+ ricette ${c}`,desc:(n,c)=>`Scopri ${n} ricette autentiche della cucina ${c}. Ingredienti, passi, foto e video.`},
  zh:{home:'首页',recipes:'食谱',discover:'探索',pageTitle:(n,c)=>`${n}+ ${c}食谱`,desc:(n,c)=>`探索 ${n} 道正宗${c}料理。配料、步骤、图片和视频。`},
  ja:{home:'ホーム',recipes:'レシピ',discover:'探す',pageTitle:(n,c)=>`${n}+ ${c}レシピ`,desc:(n,c)=>`本格的な${c}レシピ ${n} 品。材料、手順、写真と動画。`},
};

// Group recipes by cuisine
const byCid = {};
for (const r of recipes) {
  if (!r.cid || !CUIS[r.cid]) continue;
  (byCid[r.cid] ||= []).push(r);
}

const hubIndex = [];

for (const lang of LANGS) {
  fs.mkdirSync(`hubs/${lang}/cuisine`, { recursive: true });
  const S = STRINGS[lang];
  const dir = RTL.has(lang) ? 'rtl' : 'ltr';
  const ck = lang;

  // Pages cuisine par langue
  for (const [cid, list] of Object.entries(byCid)) {
    if (list.length < 3) continue;
    const c = CUIS[cid];
    const label = c[ck];
    const title = `${S.pageTitle(list.length, label)} | Matbakh 360`;
    const desc  = S.desc(list.length, label);
    const url   = `${BASE}/hubs/${lang}/cuisine/${cid}.html`;

    const alternates = LANGS.map(l => `<link rel="alternate" hreflang="${l}" href="${BASE}/hubs/${l}/cuisine/${cid}.html">`).join('\n');

    const cards = list.slice(0, 60).map(r => {
      const slug = recSlug[r.id]; if (!slug) return '';
      const img = r.img || `${BASE}/favicon.svg`;
      return `<a class="card" href="${BASE}/recipes/${slug}.html"><img src="${esc(img)}" loading="lazy" alt="${esc(r.ti||'')}"><h3>${esc(r.ti||'')}</h3><div class="meta">⏱ ${esc(r.tm||'')} · ⭐ ${r.rt||''}</div></a>`;
    }).filter(Boolean).join('');

    const html = `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-NTM6B493');</script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6870790039775701" crossorigin="anonymous"></script>
<meta name="google-adsense-account" content="ca-pub-6870790039775701">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<link rel="icon" type="image/svg+xml" href="${BASE}/favicon.svg">
<link rel="canonical" href="${url}">
${alternates}
<link rel="alternate" hreflang="x-default" href="${BASE}/hubs/en/cuisine/${cid}.html">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="website">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage","name":"${esc(title)}","description":"${esc(desc)}","inLanguage":"${lang}","url":"${url}","numberOfItems":${list.length}}</script>
<style>body{font-family:-apple-system,system-ui,sans-serif;max-width:1100px;margin:0 auto;padding:24px;background:#fafafa;color:#1a1a1a}h1{font-size:30px;margin:0 0 8px;color:#C2410C}p.lead{color:#555;margin:0 0 24px;font-size:15px;line-height:1.6}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}.card{background:#fff;border:1px solid #eee;border-radius:12px;padding:12px;text-decoration:none;color:inherit;transition:.15s;display:block}.card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.08);border-color:#C2410C}.card img{width:100%;height:140px;object-fit:cover;border-radius:8px}.card h3{font-size:14px;margin:8px 0 4px;line-height:1.3}.card .meta{font-size:12px;color:#888}footer{margin-top:48px;padding:24px 0;border-top:1px solid #ddd;text-align:center;font-size:13px;color:#888}.crumb{font-size:13px;color:#888;margin-bottom:8px}.crumb a{color:#C2410C;text-decoration:none}.langbar{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0;font-size:13px}.langbar a{padding:4px 10px;border:1px solid #ddd;border-radius:14px;text-decoration:none;color:#555}.langbar a.on{background:#C2410C;color:#fff;border-color:#C2410C}</style>
</head>
<body>
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NTM6B493" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<div class="crumb"><a href="${BASE}">🏠 ${S.home}</a> › <a href="${BASE}/hubs/${lang}/">Hubs</a> › ${esc(label)} ${c.em}</div>
<h1>${c.em} ${esc(label)} — ${list.length} ${esc(S.recipes)}</h1>
<div class="langbar">${LANGS.map(l => `<a class="${l===lang?'on':''}" href="${BASE}/hubs/${l}/cuisine/${cid}.html">${l.toUpperCase()}</a>`).join('')}</div>
<p class="lead">${esc(desc)}</p>
<div class="grid">${cards}</div>
<footer><a href="${BASE}" rel="home" style="color:#C2410C">Matbakh 360</a> · <a href="${BASE}/sitemap.xml" style="color:#888">Sitemap</a></footer>
</body></html>`;

    fs.writeFileSync(`hubs/${lang}/cuisine/${cid}.html`, html);
    hubIndex.push({ type:'cuisine', lang, slug:cid, url });
  }

  // Index par langue
  const cids = Object.keys(byCid).filter(c => byCid[c].length >= 3);
  const indexCards = cids.map(cid => {
    const c = CUIS[cid];
    return `<a class="card" style="padding:18px" href="${BASE}/hubs/${lang}/cuisine/${cid}.html"><h3>${c.em} ${esc(c[ck])}</h3><div class="meta">${byCid[cid].length} ${esc(S.recipes)}</div></a>`;
  }).join('');
  const indexHtml = `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Matbakh 360 — ${S.discover}</title>
<meta name="description" content="${esc(`${cids.length} ${S.recipes}`)}"><meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<link rel="canonical" href="${BASE}/hubs/${lang}/"><link rel="icon" type="image/svg+xml" href="${BASE}/favicon.svg">
${LANGS.map(l=>`<link rel="alternate" hreflang="${l}" href="${BASE}/hubs/${l}/">`).join('\n')}
<style>body{font-family:-apple-system,system-ui,sans-serif;max-width:1100px;margin:0 auto;padding:24px;background:#fafafa}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}.card{background:#fff;border:1px solid #eee;border-radius:10px;text-decoration:none;color:inherit;transition:.15s}.card:hover{border-color:#C2410C}h1{color:#C2410C}</style>
</head><body><h1>Matbakh 360</h1><p>${cids.length} cuisines</p><div class="grid">${indexCards}</div></body></html>`;
  fs.writeFileSync(`hubs/${lang}/index.html`, indexHtml);
  hubIndex.push({ type:'lang-index', lang, slug:'index', url:`${BASE}/hubs/${lang}/` });
}

// Merge avec ancien hubs/index.json
let prev = [];
if (fs.existsSync('hubs/index.json')) {
  try { prev = JSON.parse(fs.readFileSync('hubs/index.json','utf8')); } catch {}
}
// Garde les anciens hubs non-multilang
const keep = prev.filter(h => !h.lang);
const all  = [...keep, ...hubIndex];
fs.writeFileSync('hubs/index.json', JSON.stringify(all));

console.log(`✅ ${hubIndex.length} pages hub multilangues générées (${LANGS.length} langs × ${Object.keys(byCid).filter(c => byCid[c].length >= 3).length} cuisines + ${LANGS.length} index)`);
