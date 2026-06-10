/**
 * add-faq-schema.mjs
 * Injecte un FAQPage schema JSON-LD auto-généré dans chaque page recette statique.
 * Questions générées depuis les données (temps, calories, portions, difficulté).
 * Idempotent (skip si déjà présent).
 */
import fs from 'fs';
import path from 'path';

const recipes = JSON.parse(fs.readFileSync('data/recipes.json','utf8'));
const recById = Object.fromEntries(recipes.map(r => [r.id, r]));
const DIFF = { e:'سهلة', m:'متوسطة الصعوبة', h:'صعبة وتحتاج خبرة' };

function buildFaq(r) {
  const ti = r.ti || 'هذه الوصفة';
  const qa = [];
  if (r.tm) qa.push({ q:`كم تستغرق ${ti} من الوقت؟`, a:`تحتاج ${ti} إلى حوالي ${r.tm} للتحضير والطهي.` });
  if (r.sv) qa.push({ q:`لكم شخص تكفي ${ti}؟`, a:`هذه الوصفة تكفي ${r.sv} أشخاص.` });
  if (r.nut?.cal) qa.push({ q:`كم عدد السعرات الحرارية في ${ti}؟`, a:`تحتوي الحصة الواحدة على حوالي ${r.nut.cal} سعرة حرارية${r.nut.pro ? ` و${r.nut.pro} غرام بروتين` : ''}.` });
  if (r.df && DIFF[r.df]) qa.push({ q:`هل ${ti} سهلة التحضير؟`, a:`هذه الوصفة ${DIFF[r.df]}.` });
  if (Array.isArray(r.ing) && r.ing.length) qa.push({ q:`ما هي مكونات ${ti}؟`, a:`تحتاج إلى ${r.ing.length} مكونات أساسية منها: ${r.ing.slice(0,5).map(i=>i.n).filter(Boolean).join('، ')}.` });
  if (qa.length < 2) return null;
  return {
    '@context':'https://schema.org','@type':'FAQPage',
    mainEntity: qa.map(({q,a}) => ({ '@type':'Question', name:q, acceptedAnswer:{ '@type':'Answer', text:a } })),
  };
}

let added = 0, skipped = 0;
for (const f of fs.readdirSync('recipes').filter(f => f.endsWith('.html'))) {
  const p = path.join('recipes', f);
  let h = fs.readFileSync(p, 'utf8');
  if (h.includes('"FAQPage"')) { skipped++; continue; }
  const m = h.match(/\/#recipe\/'\+'([a-zA-Z0-9_]+)'/) || h.match(/\/#recipe\/([a-zA-Z0-9_]+)/);
  if (!m) { skipped++; continue; }
  const r = recById[m[1]];
  if (!r) { skipped++; continue; }
  const faq = buildFaq(r);
  if (!faq) { skipped++; continue; }
  h = h.replace('</head>', `<script type="application/ld+json">${JSON.stringify(faq)}</script>\n</head>`);
  fs.writeFileSync(p, h, 'utf8');
  added++;
  if (added % 2000 === 0) console.log(`  ${added}…`);
}
console.log(`✅ FAQPage ajouté sur ${added} pages, ${skipped} ignorées`);
