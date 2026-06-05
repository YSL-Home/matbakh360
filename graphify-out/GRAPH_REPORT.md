# Graph Report - .  (2026-06-01)

## Corpus Check
- Large corpus: 4518 files · ~1,147,452 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 209 nodes · 254 edges · 23 communities (20 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]

## God Nodes (most connected - your core abstractions)
1. `sleep()` - 8 edges
2. `generateRecipes()` - 7 edges
3. `httpGet()` - 6 edges
4. `generateExtraRecipesWithWikiImg()` - 6 edges
5. `generateRestaurants()` - 6 edges
6. `generateVideos()` - 5 edges
7. `main()` - 5 edges
8. `main()` - 5 edges
9. `main()` - 5 edges
10. `generateInfluencersForCity()` - 5 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (23 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (38): AREA_MAP, BATCH_CLAUDE, _BREAD, CITIES, claudeBatch(), CUISINE_FALLBACK_IMGS, _cuisineImg(), DATA_DIR (+30 more)

### Community 1 - "Community 1"
Cohesion: 0.16
Nodes (18): buildHtml(), buildSlug(), DATA_FILE, escAttr(), escHtml(), escJs(), existingIndex, existingSlugs (+10 more)

### Community 2 - "Community 2"
Cohesion: 0.13
Nodes (14): background_color, categories, description, dir, display, icons, lang, name (+6 more)

### Community 3 - "Community 3"
Cohesion: 0.24
Nodes (13): ALL_CITIES, callClaude(), CUISINE_PHOTO, enrichArabic(), fetchOSMRestaurants(), generateRestaurantsClaude(), getCuisinePhoto(), getLogo() (+5 more)

### Community 4 - "Community 4"
Cohesion: 0.18
Nodes (10): batch, DATA_DIR, fetchPlacePhoto(), followRedirect(), GENERIC, getJSON(), idxMap, MAX_PER_RUN (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.20
Nodes (8): ALL_REGIONS, callClaude(), CAT_IMGS, DIFF_OPTS, generateBatch(), html, recipeIdx, safeJSON()

### Community 6 - "Community 6"
Cohesion: 0.27
Nodes (11): claudeRequest(), DATA_DIR, extractUniqueCities(), generateInfluencersForCity(), INF_BATCH, INFLUENCERS_PATH, main(), parseJsonResponse() (+3 more)

### Community 7 - "Community 7"
Cohesion: 0.20
Nodes (7): ALL_CITIES, html, REAL_TT_IDS, REAL_YT_IDS, rndFrom(), thumb(), THUMBS

### Community 8 - "Community 8"
Cohesion: 0.25
Nodes (8): buildUnsplashQuery(), buildUnsplashUrl(), __dir, raw, recipes, RECIPES_PATH, sample, STOPWORDS

### Community 9 - "Community 9"
Cohesion: 0.25
Nodes (3): BASE_PATH, JSON_DATA_SUFFIXES, PRECACHE_URLS

### Community 10 - "Community 10"
Cohesion: 0.48
Nodes (6): BATCH_SIZE, buildPrompt(), callClaude(), main(), parseResponse(), sleep()

### Community 11 - "Community 11"
Cohesion: 0.48
Nodes (6): BATCH_SIZE, buildPrompt(), callClaude(), main(), parseResponse(), sleep()

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (6): clearSection(), DATA_DIR, datasets, extractJsonObjects(), HTML, vidsIdx

### Community 13 - "Community 13"
Cohesion: 0.29
Nodes (6): html, RECIPE_INDEX_FILE, recipeIds, restoIds, staticPages, urls

### Community 14 - "Community 14"
Cohesion: 0.50
Nodes (3): html, match, NEW_KEYS

### Community 15 - "Community 15"
Cohesion: 0.50
Nodes (3): html, HTML_PATH, TRANS

### Community 16 - "Community 16"
Cohesion: 0.50
Nodes (3): html, HTML_PATH, TRANS

### Community 17 - "Community 17"
Cohesion: 0.50
Nodes (3): AREA_DESC, html, HTML_PATH

## Knowledge Gaps
- **104 isolated node(s):** `version`, `configurations`, `INDEX_HTML`, `RUN_ID`, `RECIPES_PER_RUN` (+99 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `version`, `configurations`, `INDEX_HTML` to the rest of the system?**
  _104 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08013937282229965 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._