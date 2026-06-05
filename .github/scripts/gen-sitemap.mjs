/**
 * gen-sitemap.mjs
 * Génère sitemap.xml + robots.txt depuis les données de index.html
 * Usage : node .github/scripts/gen-sitemap.mjs
 */
import fs from 'fs';
import path from 'path';

const BASE = 'https://matbakh360.com';
const today = new Date().toISOString().split('T')[0];
const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');

// Charger l'index des pages SEO statiques si disponible
const RECIPE_INDEX_FILE = path.resolve(process.cwd(), 'recipes', 'index.json');
const seoRecipes = fs.existsSync(RECIPE_INDEX_FILE)
  ? JSON.parse(fs.readFileSync(RECIPE_INDEX_FILE, 'utf8'))
  : [];
const RESTO_INDEX_FILE = path.resolve(process.cwd(), 'restaurants', 'index.json');
const seoRestos = fs.existsSync(RESTO_INDEX_FILE)
  ? JSON.parse(fs.readFileSync(RESTO_INDEX_FILE, 'utf8'))
  : [];

// Extraire les IDs de recettes
const recipeIds = [...html.matchAll(/"id":"(r[^"]+)"/g)].map(m => m[1]);
const restoIds  = [...html.matchAll(/"id":"(rst_[^"]+)"/g)].map(m => m[1]);

// Pages statiques
const staticPages = [
  { url: BASE+'/',               pri:'1.0', freq:'daily'  },
  { url: BASE+'/?page=restos',   pri:'0.9', freq:'daily'  },
  { url: BASE+'/?page=videos',   pri:'0.8', freq:'daily'  },
  { url: BASE+'/?page=map',      pri:'0.7', freq:'weekly' },
];

// Construire le sitemap
const urls = [
  ...staticPages.map(p => `
  <url>
    <loc>${p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.freq}</changefreq>
    <priority>${p.pri}</priority>
  </url>`),

  ...recipeIds.map(id => `
  <url>
    <loc>${BASE}/?recipe=${id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`),

  ...restoIds.map(id => `
  <url>
    <loc>${BASE}/?resto=${id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`),

  ...seoRecipes.map(({ slug }) => `
  <url>
    <loc>${BASE}/recipes/${slug}.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`),

  ...seoRestos.map(({ slug }) => `
  <url>
    <loc>${BASE}/restaurants/${slug}.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('')}
</urlset>`;

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

fs.writeFileSync(path.resolve(process.cwd(), 'sitemap.xml'), sitemap);
fs.writeFileSync(path.resolve(process.cwd(), 'robots.txt'), robots);

console.log(`✅ sitemap.xml — ${recipeIds.length} recettes SPA + ${restoIds.length} restos SPA + ${seoRecipes.length} recettes SEO + ${seoRestos.length} restos SEO + ${staticPages.length} pages statiques`);
console.log('✅ robots.txt');
