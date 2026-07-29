const CACHE_NAME = "creative-note-v4-8-1-cache";
const APP_CACHE_PREFIXES = ["creative-note-", "hoonnote-", "solonote-"];
const APP_SHELL_URL = "./index.html";

const CORE_ASSETS = [
  "./",
  APP_SHELL_URL,
  "./manifest.json?v=481",
  "./css/style.css?v=481",
  "./js/config.js?v=481",
  "./js/feedback.js?v=481",
  "./js/auth.js?v=481",
  "./js/storage.js?v=481",
  "./js/ui.js?v=481",
  "./js/app.js?v=481",
  "./js/account.js?v=481",
  "./js/pwa.js?v=481",
  "./icons/logo-mark.svg?v=481",
  "./icons/brand-wordmark.svg?v=481",
  "./icons/settings-gear.png?v=481",
  "./icons/icon-192.png?v=481",
  "./icons/icon-512.png?v=481",
  "./icons/icon-maskable-192.png?v=481",
  "./icons/icon-maskable-512.png?v=481",
  "./icons/icon-monochrome-512.png?v=481",
  "./icons/apple-touch-icon.png?v=481",
  "./legal/legal.css?v=481",
  "./legal/privacy.html",
  "./legal/terms.html",
  "./support/index.html",
  "./support/delete-account.html"
];

function canCache(response) {
  return Boolean(response && response.ok && (response.type === "basic" || response.type === "cors"));
}

async function cacheResponse(request, response) {
  if (!canCache(response)) {
    return;
  }
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
}

async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    if (canCache(response)) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(APP_SHELL_URL, response.clone());
    }
    return response;
  } catch (_error) {
    return (
      (await caches.match(request, { ignoreSearch: true })) ||
      (await caches.match(APP_SHELL_URL)) ||
      new Response("오프라인 상태에서는 Creative Note를 처음 열 수 없습니다.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    );
  }
}

async function handleStaticAsset(event) {
  const cached = await caches.match(event.request, { ignoreSearch: false });
  const networkPromise = fetch(event.request)
    .then(async (response) => {
      await cacheResponse(event.request, response);
      return response;
    })
    .catch(() => null);

  if (cached) {
    event.waitUntil(networkPromise);
    return cached;
  }

  return (await networkPromise) || new Response("", { status: 504 });
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter(
            (cacheName) =>
              cacheName !== CACHE_NAME &&
              APP_CACHE_PREFIXES.some((prefix) => cacheName.startsWith(prefix))
          )
          .map((cacheName) => caches.delete(cacheName))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === "navigate" || event.request.destination === "document") {
    event.respondWith(handleNavigation(event.request));
    return;
  }

  event.respondWith(handleStaticAsset(event));
});
