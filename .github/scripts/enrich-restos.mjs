#!/usr/bin/env node
// enrich-restos.mjs — Enrichit les restaurants (phone, website, menu) via Claude claude-haiku-4-5

import { readFileSync, writeFileSync } from 'fs';
import https from 'https';

const sleep = ms => new Promise(r => setTimeout(r, ms));

const RESTOS_PATH = new URL('../../data/restos.json', import.meta.url).pathname;
const API_KEY = process.env.ANTHROPIC_API_KEY;
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE ?? '30', 10);
const SKIP_DONE = (process.env.SKIP_DONE ?? 'true') !== 'false';

if (!API_KEY) {
  console.error('ANTHROPIC_API_KEY est requis');
  process.exit(1);
}

function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.content?.[0]?.text ?? '');
        } catch (e) {
          reject(new Error(`JSON parse error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function buildPrompt(resto) {
  return `Pour le restaurant '${resto.name}' à ${resto.city}, cuisine ${resto.cuisine}, génère en JSON: phone (réaliste), website (inventé cohérent), menu (3 plats: name, nameAr, price en devise locale, desc 8 mots max). JSON strict, sans texte.`;
}

function parseResponse(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON found in response');
  return JSON.parse(match[0]);
}

async function main() {
  const restos = JSON.parse(readFileSync(RESTOS_PATH, 'utf8'));

  const toEnrich = SKIP_DONE
    ? restos.filter((r) => !r.menu || r.menu.length === 0)
    : restos;

  const total = Math.min(toEnrich.length, BATCH_SIZE);
  const batch = toEnrich.slice(0, total);

  console.log(`Restaurants à enrichir : ${toEnrich.length} | Batch : ${total}`);

  let batchDirty = false;

  for (let i = 0; i < batch.length; i++) {
    const resto = batch[i];
    const idx = restos.findIndex((r) => r.id === resto.id);

    try {
      const prompt = buildPrompt(resto);
      const raw = await callClaude(prompt);
      const data = parseResponse(raw);

      if (data.phone) restos[idx].phone = data.phone;
      if (data.website) restos[idx].website = data.website;
      if (Array.isArray(data.menu) && data.menu.length > 0) {
        restos[idx].menu = data.menu;
      }

      console.log(
        `[${i + 1}/${total}] ${resto.name} (${resto.city}) → phone:${!!restos[idx].phone} website:${!!restos[idx].website} menu:${restos[idx].menu?.length ?? 0}`
      );

      batchDirty = true;
    } catch (err) {
      console.error(`[${i + 1}/${total}] ERREUR ${resto.name}: ${err.message}`);
    }

    // Écrire après chaque batch de 10 pour limiter les I/O sur 37k entrées
    if ((i + 1) % 10 === 0 && batchDirty) {
      writeFileSync(RESTOS_PATH, JSON.stringify(restos), 'utf8');
      batchDirty = false;
      console.log(`  💾 Sauvegarde intermédiaire à ${i + 1} restaurants`);
    }

    await sleep(200);
  }

  // Écriture finale si des changements n'ont pas encore été persistés
  if (batchDirty) {
    writeFileSync(RESTOS_PATH, JSON.stringify(restos), 'utf8');
  }

  console.log(`Terminé. ${total} restaurants traités.`);
}

main().catch((err) => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
