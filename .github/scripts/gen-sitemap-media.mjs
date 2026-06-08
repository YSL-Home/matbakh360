/**
 * gen-sitemap-media.mjs
 * Génère sitemap-images.xml + sitemap-videos.xml (formats Google spéciaux)
 * Et met à jour sitemap.xml index pour les référencer.
 */
import fs from 'fs';

const BASE  = 'https://matbakh360.com';
const today = new Date().toISOString().split('T')[0];
const esc   = (s) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

const recipes = JSON.parse(fs.readFileSync('data/recipes.json','utf8'));
const restos  = JSON.parse(fs.readFileSync('data/restos.json','utf8'));
const vids    = JSON.parse(fs.readFileSync('data/vids.json','utf8'));

const recIdx = JSON.parse(fs.readFileSync('recipes/index.json','utf8'));
const rstIdx = JSON.parse(fs.readFileSync('restaurants/index.json','utf8'));
const vidIdx = JSON.parse(fs.readFileSync('videos/index.json','utf8'));

const recById = Object.fromEntries(recipes.map(r => [r.id, r]));
const rstById = Object.fromEntries(restos.map(r => [r.id, r]));
const vidById = Object.fromEntries(vids.map(v => [v.id, v]));

// ── sitemap-images.xml ──────────────────────────────────────────────────
const imgEntries = [];
for (const { id, slug } of recIdx) {
  const r = recById[id]; if (!r?.img) continue;
  imgEntries.push(`  <url><loc>${BASE}/recipes/${slug}.html</loc><image:image><image:loc>${esc(r.img)}</image:loc><image:title>${esc(r.ti||'')}</image:title></image:image></url>`);
}
for (const { id, slug } of rstIdx) {
  const r = rstById[id]; if (!r?.img) continue;
  imgEntries.push(`  <url><loc>${BASE}/restaurants/${slug}.html</loc><image:image><image:loc>${esc(r.img)}</image:loc><image:title>${esc(r.nameEn||r.name||'')}</image:title></image:image></url>`);
}

const imgXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${imgEntries.join('\n')}
</urlset>`;
fs.writeFileSync('sitemap-images.xml', imgXml);

// ── sitemap-videos.xml ──────────────────────────────────────────────────
const vidEntries = [];
for (const { id, slug } of vidIdx) {
  const v = vidById[id]; if (!v) continue;
  const thumb = v.thumb || v.thumbnail || '';
  const title = (v.title || v.titleAr || '').substring(0, 100);
  const desc  = (v.title || v.titleAr || '').substring(0, 2048) || 'فيديو طبخ من مطبخ 360';
  const content = v.url || (v.vid_id ? `https://www.youtube.com/watch?v=${v.vid_id}` : '');
  if (!thumb || !content) continue;
  vidEntries.push(`  <url>
    <loc>${BASE}/videos/${slug}.html</loc>
    <video:video>
      <video:thumbnail_loc>${esc(thumb)}</video:thumbnail_loc>
      <video:title>${esc(title)}</video:title>
      <video:description>${esc(desc)}</video:description>
      <video:content_loc>${esc(content)}</video:content_loc>
      ${v.published ? `<video:publication_date>${esc(v.published)}T00:00:00+00:00</video:publication_date>` : ''}
    </video:video>
  </url>`);
}

const vidXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${vidEntries.join('\n')}
</urlset>`;
fs.writeFileSync('sitemap-videos.xml', vidXml);

console.log(`✅ sitemap-images.xml (${imgEntries.length} URLs avec image) + sitemap-videos.xml (${vidEntries.length} URLs avec vidéo)`);
