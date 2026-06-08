/**
 * gen-feeds.mjs
 * Génère feed.xml (Atom général) + feed-recipes.xml + feed-restos.xml + feed-videos.xml
 */
import fs from 'fs';

const BASE = 'https://matbakh360.com';
const NOW  = new Date().toISOString();
const esc  = (s) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

const load = (p) => fs.existsSync(p) ? JSON.parse(fs.readFileSync(p,'utf8')) : [];

function atom(title, slug, entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${esc(title)}</title>
  <link rel="self" href="${BASE}/${slug}.xml"/>
  <link href="${BASE}/"/>
  <updated>${NOW}</updated>
  <id>${BASE}/${slug}</id>
  <author><name>Matbakh 360</name><email>contact@matbakh360.com</email></author>
${entries.map(e => `  <entry>
    <title>${esc(e.title)}</title>
    <link href="${esc(e.url)}"/>
    <id>${esc(e.url)}</id>
    <updated>${NOW}</updated>
    ${e.summary ? `<summary>${esc(e.summary)}</summary>` : ''}
  </entry>`).join('\n')}
</feed>`;
}

const recipes = load('recipes/index.json').slice(-200).reverse().map(e => ({
  title: e.title || e.slug,
  url: `${BASE}/recipes/${e.slug}.html`,
  summary: 'وصفة طبخ من مطبخ 360 — Recipe from Matbakh 360',
}));
const restos = load('restaurants/index.json').slice(-200).reverse().map(e => ({
  title: `${e.name || e.slug} — ${e.city || ''}`,
  url: `${BASE}/restaurants/${e.slug}.html`,
  summary: 'مطعم على مطبخ 360 — Restaurant on Matbakh 360',
}));
const videos = load('videos/index.json').slice(-200).reverse().map(e => ({
  title: e.title || e.slug,
  url: `${BASE}/videos/${e.slug}.html`,
  summary: 'فيديو طبخ — Cooking video',
}));

fs.writeFileSync('feed-recipes.xml', atom('Matbakh 360 — Recettes', 'feed-recipes', recipes));
fs.writeFileSync('feed-restos.xml',  atom('Matbakh 360 — Restaurants', 'feed-restos', restos));
fs.writeFileSync('feed-videos.xml',  atom('Matbakh 360 — Vidéos', 'feed-videos', videos));

// Feed global = mix des 3 (max 300)
const all = [...recipes, ...restos, ...videos].slice(0, 300);
fs.writeFileSync('feed.xml', atom('Matbakh 360 — Tout', 'feed', all));

console.log(`✅ feed.xml (${all.length}) + feed-recipes.xml (${recipes.length}) + feed-restos.xml (${restos.length}) + feed-videos.xml (${videos.length})`);
