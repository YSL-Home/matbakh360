#!/bin/bash
# ══════════════════════════════════════════════════════════════════
# run-full-enrich.sh — Pipeline complet enrichissement + génération
# Usage : ANTHROPIC_API_KEY="sk-ant-..." bash run-full-enrich.sh
# ══════════════════════════════════════════════════════════════════
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"; }
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
fail() { echo -e "${RED}❌ $1${NC}"; exit 1; }

# ── 0. Vérifications ──────────────────────────────────────────────
[ -z "$ANTHROPIC_API_KEY" ] && fail "ANTHROPIC_API_KEY manquant. Usage : ANTHROPIC_API_KEY='sk-ant-...' bash run-full-enrich.sh"
[ ! -f "data/recipes.json" ] && fail "Lancer depuis la racine du projet matbakh360"

export ANTHROPIC_API_KEY

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  🍽️  Matbakh360 — Pipeline enrichissement complet    ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

TOTAL_RECIPES=$(node -e "
  import fs from 'fs';
  const r = JSON.parse(fs.readFileSync('data/recipes.json'));
  const n = r.filter(x => !Array.isArray(x.steps) || x.steps.length===0 || x.steps.every(s=>!s.tp)).length;
  console.log(n);
" --input-type=module 2>/dev/null)
log "Recettes à enrichir : $TOTAL_RECIPES"

# ── 1. Enrichissement étapes + tips (boucle jusqu'à complet) ──────
log "ÉTAPE 1/5 — Enrichissement steps + tips recettes"
BATCH_SIZE=100
RUN=0
MAX_RUNS=30

while true; do
  RUN=$((RUN + 1))
  [ $RUN -gt $MAX_RUNS ] && warn "Max runs ($MAX_RUNS) atteint" && break

  REMAINING=$(node -e "
    import fs from 'fs';
    const r = JSON.parse(fs.readFileSync('data/recipes.json'));
    console.log(r.filter(x => !Array.isArray(x.steps) || x.steps.length===0 || x.steps.every(s=>!s.tp)).length);
  " --input-type=module 2>/dev/null)

  [ "$REMAINING" = "0" ] && ok "Toutes les recettes enrichies !" && break

  log "  Run $RUN — $REMAINING recettes restantes..."
  BATCH_SIZE=$BATCH_SIZE node .github/scripts/enrich-steps.mjs 2>&1 | tail -2
  sleep 2
done

ok "ÉTAPE 1 terminée"

# ── 2. Régénération pages SEO recettes ────────────────────────────
log "ÉTAPE 2/5 — Régénération pages SEO recettes (force)"
# Force regen en supprimant l'index pour tout regénérer
node -e "
  import fs from 'fs';
  // Reset index pour forcer la regen complète
  if (fs.existsSync('recipes/index.json')) {
    const idx = JSON.parse(fs.readFileSync('recipes/index.json'));
    // Supprimer les entrées pour forcer la regen
    fs.writeFileSync('recipes/index.json', '[]');
    console.log('Index resetté —', idx.length, 'entrées');
  }
" --input-type=module 2>/dev/null

PAGES_BATCH=2000 node .github/scripts/gen-seo-pages.mjs 2>&1 | tail -2
ok "ÉTAPE 2 terminée"

# ── 3. Régénération restos + vidéos + influenceurs ────────────────
log "ÉTAPE 3/5 — Régénération restos + vidéos + influenceurs"
node .github/scripts/gen-seo-restos.mjs 2>&1 | tail -1
node .github/scripts/gen-seo-vids.mjs 2>&1 | tail -1
node .github/scripts/gen-influencer-pages.mjs 2>&1 | tail -1
ok "ÉTAPE 3 terminée"

# ── 4. Hubs + Top10 + Sitemap + Feeds ────────────────────────────
log "ÉTAPE 4/5 — Hubs + Top10 + Sitemap + Feeds"
node .github/scripts/gen-hubs-multilang.mjs 2>&1 | tail -1
node .github/scripts/gen-top10.mjs 2>&1 | tail -1
node .github/scripts/gen-feeds.mjs 2>&1 | tail -1
node .github/scripts/gen-sitemap.mjs 2>&1 | tail -2
ok "ÉTAPE 4 terminée"

# ── 5. Inject GA4 sur les nouvelles pages + Commit + Push ─────────
log "ÉTAPE 5/5 — Injection GA4 + Commit + Push"

node -e "
import fs from 'fs';
import path from 'path';

const GA4 = \`<!-- Google tag (gtag.js) -->
<script async src=\"https://www.googletagmanager.com/gtag/js?id=G-TLBQXXRBG6\"></script>
<script async src=\"https://www.googletagmanager.com/gtag/js?id=G-6R811G3SE7\"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-TLBQXXRBG6');
  gtag('config', 'G-6R811G3SE7');
</script>\`;

const MARKER = '<!-- End Google Tag Manager -->';
let updated = 0;

for (const dir of ['recipes','restaurants','videos','hubs','influencers']) {
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir, {recursive:true})) {
    if (!f.endsWith('.html')) continue;
    const fp = path.join(dir, f);
    const html = fs.readFileSync(fp, 'utf8');
    if (html.includes('G-TLBQXXRBG6')) continue;
    if (!html.includes(MARKER)) continue;
    fs.writeFileSync(fp, html.replace(MARKER, MARKER + '\n' + GA4));
    updated++;
  }
}
console.log('GA4 injecté sur', updated, 'nouvelles pages');
" --input-type=module 2>/dev/null

git config user.name  "Matbakh360 Bot" 2>/dev/null || true
git config user.email "bot@matbakh360.com" 2>/dev/null || true
git add -A

if git diff --staged --quiet; then
  warn "Rien à committer"
else
  DATE=$(date +'%Y-%m-%d %H:%M')
  git commit -m "🚀 Enrichissement complet ${DATE} — steps+tips+pages SEO"
  git pull --rebase -X ours origin main 2>&1 | tail -2
  git push origin main 2>&1 | tail -2
  ok "Pushé sur GitHub ✓"
fi

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅  Pipeline terminé !                              ║"
echo "╚══════════════════════════════════════════════════════╝"

# Résumé final
node -e "
import fs from 'fs';
const r = JSON.parse(fs.readFileSync('data/recipes.json'));
const enriched = r.filter(x => x.tips && x.tips.length > 0).length;
const pages = fs.readdirSync('recipes').filter(f => f.endsWith('.html')).length;
console.log('');
console.log('📊 Résumé :');
console.log('  Recettes enrichies :', enriched, '/', r.length);
console.log('  Pages SEO générées :', pages);
" --input-type=module 2>/dev/null
