#!/bin/sh
# Génère les pages SEO statiques pour les recettes
# Usage : sh run-seo.sh
# Variable optionnelle : PAGES_BATCH (défaut 500)
export PAGES_BATCH="${PAGES_BATCH:-500}"
node .github/scripts/gen-seo-pages.mjs
