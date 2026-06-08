/**
 * gen-sitemap.mjs
 * Génère sitemap-index + sitemaps fragmentés (limite Google = 50k URLs/fichier).
 */
import fs from 'fs';
import path from 'path';

const BASE = 'https://matbakh360.com';
const today = new Date().toISOString().split('T')[0];
const CHUNK = 40000; // marge sous la limite 50k
const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');

const load = (p) => fs.existsSync(p) ? JSON.parse(fs.readFileSync(p,'utf8')) : [];
const seoRecipes = load(path.resolve('recipes','index.json'));
const seoRestos  = load(path.resolve('restaurants','index.json'));
const seoVids    = load(path.resolve('videos','index.json'));
const seoHubs    = load(path.resolve('hubs','index.json'));

const recipeIds = [...html.matchAll(/"id":"(r[^"]+)"/g)].map(m => m[1]);
const restoIds  = [...html.matchAll(/"id":"(rst_[^"]+)"/g)].map(m => m[1]);

const staticPages = [
  { url: BASE+'/',               pri:'1.0', freq:'daily'  },
  { url: BASE+'/?page=restos',   pri:'0.9', freq:'daily'  },
  { url: BASE+'/?page=videos',   pri:'0.8', freq:'daily'  },
  { url: BASE+'/?page=map',      pri:'0.7', freq:'weekly' },
];

const urlEntry = (loc, freq='monthly', pri='0.7') =>
  `\n  <url><loc>${loc}</loc><lastmod>${today}</lastmod><changefreq>${freq}</changefreq><priority>${pri}</priority></url>`;

const allUrls = [
  ...staticPages.map(p => urlEntry(p.url, p.freq, p.pri)),
  ...recipeIds.map(id => urlEntry(`${BASE}/?recipe=${id}`,'monthly','0.6')),
  ...restoIds.map(id  => urlEntry(`${BASE}/?resto=${id}`,'weekly','0.7')),
  ...seoRecipes.map(({slug}) => urlEntry(`${BASE}/recipes/${slug}.html`,'monthly','0.8')),
  ...seoRestos.map(({slug})  => urlEntry(`${BASE}/restaurants/${slug}.html`,'weekly','0.8')),
  ...seoVids.map(({slug})    => urlEntry(`${BASE}/videos/${slug}.html`,'weekly','0.7')),
  ...seoHubs.map(({url})     => urlEntry(url,'weekly','0.9')),
];

// Chunk en fichiers de CHUNK URLs
const chunks = [];
for (let i = 0; i < allUrls.length; i += CHUNK) chunks.push(allUrls.slice(i, i + CHUNK));

// Cleanup anciens sitemap-N
for (const f of fs.readdirSync('.').filter(f => /^sitemap-\d+\.xml$/.test(f))) fs.unlinkSync(f);

const sitemapFiles = [];
chunks.forEach((urls, i) => {
  const name = `sitemap-${i+1}.xml`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}\n</urlset>`;
  fs.writeFileSync(name, xml);
  sitemapFiles.push(name);
});

// sitemap.xml = sitemap-index (inclut aussi les sitemaps média si présents)
const mediaSitemaps = [];
if (fs.existsSync('sitemap-images.xml')) mediaSitemaps.push('sitemap-images.xml');
if (fs.existsSync('sitemap-videos.xml')) mediaSitemaps.push('sitemap-videos.xml');
const allSitemaps = [...sitemapFiles, ...mediaSitemaps];
const index = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allSitemaps.map(f => `  <sitemap><loc>${BASE}/${f}</loc><lastmod>${today}</lastmod></sitemap>`).join('\n')}
</sitemapindex>`;
fs.writeFileSync('sitemap.xml', index);

const robots = `User-agent: *
Allow: /

User-agent: Mediapartners-Google
Allow: /

User-agent: AdsBot-Google
Allow: /

User-agent: AdsBot-Google-Mobile
Allow: /

Sitemap: ${BASE}/sitemap.xml
`;
fs.writeFileSync('robots.txt', robots);

console.log(`✅ sitemap-index → ${sitemapFiles.length} fichiers (${allUrls.length} URLs)`);
console.log(`   recettes SPA:${recipeIds.length}  restos SPA:${restoIds.length}  recettes SEO:${seoRecipes.length}  restos SEO:${seoRestos.length}  vidéos SEO:${seoVids.length}  hubs:${seoHubs.length}  statiques:${staticPages.length}`);
console.log('✅ robots.txt');
