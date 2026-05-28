/**
 * fix-recipe-images.mjs
 * Remplace les URLs Unsplash génériques `?food,dish` par des URLs
 * plus précises basées sur le titre anglais de chaque recette.
 *
 * Usage : node fix-recipe-images.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const RECIPES_PATH = join(__dir, 'data', 'recipes.json');

// Mots à ignorer lors de la construction des mots-clés
const STOPWORDS = new Set([
  'a','an','the','and','or','with','in','on','of','for','to','at','by',
  '&','from','into','over','under','about','as','up','it','its','is',
  'are','was','were','be','been','has','have','had','do','does','did',
]);

/**
 * Extrait 2-3 mots significatifs du titre anglais et construit
 * une query Unsplash : "word1,word2,word3,food"
 */
function buildUnsplashQuery(title) {
  if (!title || typeof title !== 'string') return 'food,dish';

  // Nettoie : retire la ponctuation sauf tirets, minuscules
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w));

  const keywords = words.slice(0, 3);
  if (!keywords.length) return 'food,dish';

  // Ajoute "food" comme dernier terme pour les résultats culinaires
  keywords.push('food');
  return keywords.map(k => encodeURIComponent(k)).join(',');
}

function buildUnsplashUrl(title) {
  const query = buildUnsplashQuery(title);
  return `https://source.unsplash.com/400x300/?${query}`;
}

// ─── Lecture ───────────────────────────────────────────────
console.log('Lecture de recipes.json…');
const raw = readFileSync(RECIPES_PATH, 'utf8');
const recipes = JSON.parse(raw);

console.log(`Total recettes : ${recipes.length}`);

// ─── Traitement ────────────────────────────────────────────
const GENERIC_URL = 'https://source.unsplash.com/400x300/?food,dish';
let updated = 0;

for (const recipe of recipes) {
  if (recipe.img && recipe.img === GENERIC_URL) {
    const newUrl = buildUnsplashUrl(recipe.ti);
    recipe.img = newUrl;
    updated++;
  }
}

console.log(`Recettes mises à jour : ${updated}`);

// ─── Écriture ──────────────────────────────────────────────
if (updated > 0) {
  writeFileSync(RECIPES_PATH, JSON.stringify(recipes), 'utf8');
  console.log('recipes.json mis à jour avec succès.');
} else {
  console.log('Aucune image générique trouvée — pas de modification.');
}

// ─── Aperçu des 5 premières modifications ──────────────────
const sample = recipes
  .filter(r => r.img && r.img.includes('source.unsplash.com') && r.img !== GENERIC_URL)
  .slice(0, 5);

if (sample.length) {
  console.log('\nExemples de nouvelles URLs :');
  for (const r of sample) {
    console.log(`  [${r.id}] "${r.ti}"`);
    console.log(`    → ${r.img}`);
  }
}
