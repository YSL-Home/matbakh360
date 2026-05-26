/**
 * extract-to-json.mjs — extrait TOUS les blocs push() vers data/*.json
 */
import fs from 'fs';
import path from 'path';

const HTML = path.resolve(process.cwd(), 'index.html');
const DATA_DIR = path.resolve(process.cwd(), 'data');
if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

let html = fs.readFileSync(HTML, 'utf8');

function extractAllBlocks(varName){
  const marker = `${varName}.push(`;
  const items = [];
  let pos = 0;
  const ranges = []; // [start, end] of each push block

  while(true){
    const idx = html.indexOf(marker, pos);
    if(idx === -1) break;
    // Find matching closing );
    let depth = 0, i = idx + marker.length - 1; // point to (
    while(i < html.length){
      if(html[i] === '(') depth++;
      else if(html[i] === ')'){
        depth--;
        if(depth === 0){ i++; break; }
      }
      i++;
    }
    const blockContent = html.slice(idx + marker.length, i - 1);
    // Parse JSON objects inside
    let d = 0, start = -1;
    for(let j = 0; j < blockContent.length; j++){
      if(blockContent[j] === '{'){ if(d===0) start=j; d++; }
      else if(blockContent[j] === '}'){ d--; if(d===0&&start!==-1){ try{ items.push(JSON.parse(blockContent.slice(start,j+1))); }catch(e){} start=-1; } }
    }
    ranges.push([idx, i]);
    pos = i;
  }

  // Remove all push blocks from html (in reverse order to preserve positions)
  for(const [s,e] of ranges.reverse()){
    html = html.slice(0,s) + html.slice(e);
  }

  return items;
}

const datasets = [
  { varName:'RECIPES',    file:'recipes.json',  marker:'// ═══ BULK_RECIPES_INJECT ═══' },
  { varName:'RESTAURANTS',file:'restos.json',   marker:'// ═══ RESTAURANTS_INJECT ═══' },
  { varName:'INF_VIDS',   file:'vids.json',     marker:'// ═══ INF_VIDS_INJECT ═══' },
];

for(const {varName, file, marker} of datasets){
  const existing = fs.existsSync(`${DATA_DIR}/${file}`)
    ? JSON.parse(fs.readFileSync(`${DATA_DIR}/${file}`,'utf8'))
    : [];
  const existingIds = new Set(existing.map(x=>x.id));

  const extracted = extractAllBlocks(varName);
  const fresh = extracted.filter(x => x.id && !existingIds.has(x.id));
  const merged = [...existing, ...fresh];

  fs.writeFileSync(`${DATA_DIR}/${file}`, JSON.stringify(merged));
  console.log(`✅ ${file}: ${merged.length} total (+${fresh.length} new) | extracted ${extracted.length} from HTML`);
}

// Clean up duplicate markers
html = html.replace(/(\/\/ ═══ BULK_RECIPES_INJECT ═══\n?){2,}/g, '// ═══ BULK_RECIPES_INJECT ═══\n');
html = html.replace(/(\/\/ ═══ RESTAURANTS_INJECT ═══\n?){2,}/g, '// ═══ RESTAURANTS_INJECT ═══\n');
html = html.replace(/(\/\/ ═══ INF_VIDS_INJECT ═══\n?){2,}/g, '// ═══ INF_VIDS_INJECT ═══\n');

fs.writeFileSync(HTML, html);
console.log(`\n📏 HTML: ${(html.length/1024).toFixed(0)}KB (was ${(fs.statSync(HTML).size/1024).toFixed(0)}KB)`);
