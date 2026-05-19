// ===================================================
// Service Worker — مطبخ 360
// Stratégie de cache pour une expérience hors-ligne
// ===================================================

const CACHE_NAME = 'matbakh360-v1';

// الملفات التي يتم تخزينها مسبقاً عند التثبيت
// Fichiers pré-cachés à l'installation
const PRECACHE_URLS = ['/', '/index.html', '/logo.png', '/manifest.json'];

// مدة صلاحية كاش الصور: 7 أيام بالميلي ثانية
// Durée de validité du cache images : 7 jours
const IMAGE_CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

// ===================================================
// حدث التثبيت — Événement d'installation
// ===================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pré-cache des assets statiques / تخزين الأصول الثابتة مسبقاً');
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// ===================================================
// حدث التفعيل — Événement d'activation
// Supprime les anciens caches / حذف الكاش القديم
// ===================================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Suppression ancien cache / حذف كاش قديم:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ===================================================
// دوال مساعدة — Fonctions utilitaires
// ===================================================

/**
 * Vérifie si une image Unsplash est expirée dans le cache.
 * التحقق من انتهاء صلاحية صورة Unsplash في الكاش
 */
function isCacheEntryExpired(response) {
  if (!response) return true;
  const dateHeader = response.headers.get('sw-cache-date');
  if (!dateHeader) return false; // pas de date → on garde
  const cachedAt = parseInt(dateHeader, 10);
  return (Date.now() - cachedAt) > IMAGE_CACHE_DURATION_MS;
}

/**
 * Clone la réponse en ajoutant l'en-tête de date de mise en cache.
 * نسخ الاستجابة مع إضافة تاريخ التخزين في الكاش
 */
function addCacheDateHeader(response) {
  const headers = new Headers(response.headers);
  headers.append('sw-cache-date', Date.now().toString());
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Détermine si l'URL est une image Unsplash.
 * تحديد ما إذا كان الرابط صورة من Unsplash
 */
function isUnsplashImage(url) {
  return url.hostname === 'images.unsplash.com' || url.hostname === 'unsplash.com';
}

// ===================================================
// حدث الطلب — Événement fetch
// ===================================================
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // -----------------------------------------------
  // 1. صور Unsplash — Cache First avec expiry 7 jours
  // استراتيجية: الكاش أولاً، ثم الشبكة (مع انتهاء صلاحية 7 أيام)
  // -----------------------------------------------
  if (isUnsplashImage(url)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);

        if (cachedResponse && !isCacheEntryExpired(cachedResponse)) {
          // الصورة في الكاش وصالحة — Image en cache et valide
          return cachedResponse;
        }

        // الكاش منتهي أو غير موجود — Cache expiré ou absent, on fetch le réseau
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse.ok) {
            const responseToCache = addCacheDateHeader(networkResponse.clone());
            cache.put(event.request, responseToCache);
          }
          return networkResponse;
        } catch {
          // فشل الشبكة، إرجاع الكاش القديم إن وجد
          // Réseau indisponible, on retourne le cache expiré si disponible
          if (cachedResponse) {
            console.log('[SW] Réseau KO, cache expiré utilisé / الشبكة معطلة، استخدام كاش قديم');
            return cachedResponse;
          }
          // لا كاش ولا شبكة — Pas de cache ni réseau
          return new Response('Image indisponible / الصورة غير متاحة', { status: 503 });
        }
      })
    );
    return;
  }

  // -----------------------------------------------
  // 2. index.html — Network First, Cache Fallback
  // الشبكة أولاً للحصول على أحدث الوصفات، ثم الكاش
  // -----------------------------------------------
  if (url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          console.log('[SW] Network fail pour index.html, fallback cache / فشل الشبكة، استخدام الكاش');
          const cachedResponse = await cache.match(event.request);
          return cachedResponse || new Response('Hors-ligne / غير متصل', {
            status: 503,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        }
      })
    );
    return;
  }

  // -----------------------------------------------
  // 3. كل الطلبات الأخرى — Network First, Cache Fallback
  // جميع الطلبات الأخرى: الشبكة أولاً ثم الكاش
  // -----------------------------------------------
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse.ok) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        return new Response('Ressource indisponible / المورد غير متاح', { status: 503 });
      }
    })
  );
});
