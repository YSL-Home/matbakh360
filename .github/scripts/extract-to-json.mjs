/**
 * extract-to-json.mjs — extrait les données inline de index.html vers data/*.json
 * Utilise une approche marker-based (robuste, pas de comptage de parenthèses)
 */
import fs from 'fs';
import path from 'path';

const HTML = path.resolve(process.cwd(), 'index.html');
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

let html = fs.readFileSync(HTML, 'utf8');
const origSize = html.length;

// Extrait les objets JSON d'un bloc de texte via comptage {}
function extractJsonObjects(text) {
  const items = [];
  let d = 0, start = -1;
  for (let j = 0; j < text.length; j++) {
    const c = text[j];
    if (c === '{') { if (d === 0) start = j; d++; }
    else if (c === '}') {
      d--;
      if (d === 0 && start !== -1) {
        try { items.push(JSON.parse(text.slice(start, j + 1))); } catch (e) {}
        start = -1;
      }
    }
  }
  return items;
}

// Vide la section entre startMarker et endMarker, retourne les items extraits
function clearSection(startMarker, endMarker) {
  const s = html.indexOf(startMarker);
  if (s === -1) return [];
  const e = endMarker ? html.indexOf(endMarker, s) : html.length;
  const sectionEnd = e === -1 ? html.length : e;
  const section = html.slice(s + startMarker.length, sectionEnd);
  const items = extractJsonObjects(section);
  html = html.slice(0, s + startMarker.length) + '\n' + html.slice(sectionEnd);
  return items;
}

const datasets = [
  { startMarker: '// ═══ BULK_RECIPES_INJECT ═══', endMarker: 'const VIDS=[];',      file: 'recipes.json' },
  { startMarker: '// ═══ RESTAURANTS_INJECT ═══',  endMarker: 'const INF_VIDS=[];',  file: 'restos.json'  },
  { startMarker: '// ═══ INF_VIDS_INJECT ═══',     endMarker: '// ═══════════════════════════════════════════════════\n// RECIPE TRANSLATIONS', file: 'vids.json' },
];

for (const { startMarker, endMarker, file } of datasets) {
  const existing = fs.existsSync(`${DATA_DIR}/${file}`)
    ? JSON.parse(fs.readFileSync(`${DATA_DIR}/${file}`, 'utf8'))
    : [];
  const existingIds = new Set(existing.map(x => x.id));
  const extracted = clearSection(startMarker, endMarker);
  const fresh = extracted.filter(x => x.id && !existingIds.has(x.id));
  const merged = [...existing, ...fresh];
  fs.writeFileSync(`${DATA_DIR}/${file}`, JSON.stringify(merged));
  console.log(`✅ ${file}: ${merged.length} total (+${fresh.length} new) | extracted ${extracted.length} from HTML`);
}

// Vide aussi la section VIDS (entre VIDS_INJECT et RESTAURANTS)
const vidsIdx = html.indexOf('// ═══ VIDS_INJECT ═══');
if (vidsIdx !== -1) {
  const nextSection = html.indexOf('const RESTAURANTS=[];', vidsIdx);
  if (nextSection !== -1) {
    html = html.slice(0, vidsIdx + '// ═══ VIDS_INJECT ═══'.length) + '\n' + html.slice(nextSection);
    console.log('✅ VIDS section vidée');
  }
}

// Nettoie les marqueurs dupliqués
for (const m of ['BULK_RECIPES_INJECT', 'RESTAURANTS_INJECT', 'INF_VIDS_INJECT', 'VIDS_INJECT']) {
  const pat = new RegExp(`(// ═══ ${m} ═══\\n?){2,}`, 'g');
  html = html.replace(pat, `// ═══ ${m} ═══\n`);
}

fs.writeFileSync(HTML, html);
console.log(`\n📏 HTML: ${(html.length / 1024).toFixed(0)}KB (était ${(origSize / 1024).toFixed(0)}KB) — ${html.split('\n').length} lignes`);
