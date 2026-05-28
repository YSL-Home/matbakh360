#!/usr/bin/env node
// enrich-steps.mjs — Enrichit les recettes avec steps vides via Claude claude-haiku-4-5

import { readFileSync, writeFileSync } from 'fs';
import https from 'https';

const sleep = ms => new Promise(r => setTimeout(r, ms));

const RECIPES_PATH = new URL('../../data/recipes.json', import.meta.url).pathname;
const API_KEY = process.env.ANTHROPIC_API_KEY;
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE ?? '50', 10);
const SKIP_DONE = (process.env.SKIP_DONE ?? 'true') !== 'false';

if (!API_KEY) {
  console.error('ANTHROPIC_API_KEY est requis');
  process.exit(1);
}

function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 600,
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

function buildPrompt(recipe) {
  const ings = recipe.ing.map((i) => `${i.q} ${i.n}`).join(', ');
  return `أنت طاهٍ محترف. أعطني خطوات تحضير وصفة "${recipe.ti}" بالمكونات: ${ings}.
أجب فقط بـ JSON صحيح بهذا الشكل بدون أي نص إضافي:
{"steps":[{"t":"عنوان الخطوة","tp":"نص مفصل"}],"tips":["نصيحة 1"]}
المطلوب: 4-6 خطوات تفصيلية + 2-3 نصائح. باللغة العربية فقط.`;
}

function parseResponse(text) {
  // Extract JSON from the response (may be wrapped in markdown code block)
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON found in response');
  return JSON.parse(match[0]);
}

async function main() {
  const recipes = JSON.parse(readFileSync(RECIPES_PATH, 'utf8'));

  const toEnrich = SKIP_DONE
    ? recipes.filter((r) => r.steps.every((s) => !s.tp))
    : recipes;

  const total = Math.min(toEnrich.length, BATCH_SIZE);
  const batch = toEnrich.slice(0, total);

  console.log(`Recettes à enrichir : ${toEnrich.length} | Batch : ${total}`);

  for (let i = 0; i < batch.length; i++) {
    const recipe = batch[i];
    const idx = recipes.findIndex((r) => r.id === recipe.id);

    try {
      const prompt = buildPrompt(recipe);
      const raw = await callClaude(prompt);
      const data = parseResponse(raw);

      if (Array.isArray(data.steps) && data.steps.length > 0) {
        recipes[idx].steps = data.steps;
      }
      if (Array.isArray(data.tips) && data.tips.length > 0) {
        recipes[idx].tips = data.tips;
      }

      console.log(
        `[${i + 1}/${total}] ${recipe.ti} → steps:${recipes[idx].steps.length} tips:${recipes[idx].tips.length}`
      );
    } catch (err) {
      console.error(`[${i + 1}/${total}] ERREUR ${recipe.ti}: ${err.message}`);
    }

    // Write after each recipe + rate limit
    writeFileSync(RECIPES_PATH, JSON.stringify(recipes), 'utf8');
    await sleep(300);
  }

  console.log(`Terminé. ${total} recettes traitées.`);
}

main().catch((err) => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
