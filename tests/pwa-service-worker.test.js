const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(projectRoot, 'service-worker.js'), 'utf8');

function createHarness() {
  const listeners = new Map();
  const cacheEntries = new Map();
  const cacheNames = new Set();
  const deleted = [];
  let claimed = false;
  let skipped = false;
  let fetchImpl = async () => new Response('network', { status: 200 });

  const makeCache = (name) => ({
    async addAll(assets) {
      cacheNames.add(name);
      for (const asset of assets) {
        const url = new URL(asset, 'https://example.test/solonote/').href;
        cacheEntries.set(url, new Response(`cached:${asset}`, { status: 200 }));
      }
    },
    async put(request, response) {
      cacheNames.add(name);
      const url = typeof request === 'string'
        ? new URL(request, 'https://example.test/solonote/').href
        : request.url;
      cacheEntries.set(url, response.clone());
    },
    async keys() {
      return [...cacheEntries.keys()].map((url) => new Request(url));
    },
  });

  const caches = {
    async open(name) {
      cacheNames.add(name);
      return makeCache(name);
    },
    async keys() {
      return [...cacheNames];
    },
    async delete(name) {
      deleted.push(name);
      cacheNames.delete(name);
      return true;
    },
    async match(request, options = {}) {
      const url = typeof request === 'string'
        ? new URL(request, 'https://example.test/solonote/').href
        : request.url;
      if (cacheEntries.has(url)) return cacheEntries.get(url).clone();
      if (options.ignoreSearch) {
        const target = new URL(url);
        target.search = '';
        for (const [key, value] of cacheEntries) {
          const candidate = new URL(key);
          candidate.search = '';
          if (candidate.href === target.href) return value.clone();
        }
      }
      return undefined;
    },
  };

  const self = {
    location: { origin: 'https://example.test' },
    registration: { scope: 'https://example.test/solonote/' },
    clients: { async claim() { claimed = true; } },
    addEventListener(type, handler) { listeners.set(type, handler); },
    skipWaiting() { skipped = true; },
  };

  const context = vm.createContext({
    self,
    caches,
    URL,
    Request,
    Response,
    fetch: (...args) => fetchImpl(...args),
    console,
    Promise,
    setTimeout,
    clearTimeout,
  });
  new vm.Script(source, { filename: 'service-worker.js' }).runInContext(context);

  return {
    listeners,
    cacheEntries,
    cacheNames,
    deleted,
    get claimed() { return claimed; },
    get skipped() { return skipped; },
    setFetch(fn) { fetchImpl = fn; },
  };
}

function createEvent(extra = {}) {
  const waits = [];
  let responsePromise = null;
  return {
    ...extra,
    waitUntil(promise) { waits.push(Promise.resolve(promise)); },
    respondWith(promise) { responsePromise = Promise.resolve(promise); },
    async settle() {
      await Promise.all(waits);
      return responsePromise ? responsePromise : undefined;
    },
  };
}

test('service worker precaches the release app shell', async () => {
  const h = createHarness();
  const event = createEvent();
  h.listeners.get('install')(event);
  await event.settle();
  assert.ok(h.cacheNames.has('hoonnote-v4-6-0-rc1-cache'));
  assert.ok([...h.cacheEntries.keys()].some((url) => url.endsWith('/index.html')));
  assert.ok([...h.cacheEntries.keys()].some((url) => url.includes('style.css?v=468')));
});

test('service worker removes old HoonNote caches and claims clients', async () => {
  const h = createHarness();
  h.cacheNames.add('hoonnote-v4-5-16-cache');
  h.cacheNames.add('other-app-cache');
  const event = createEvent();
  h.listeners.get('activate')(event);
  await event.settle();
  assert.ok(h.deleted.includes('hoonnote-v4-5-16-cache'));
  assert.ok(!h.deleted.includes('other-app-cache'));
  assert.equal(h.claimed, true);
});

test('service worker only skips waiting after explicit update action', () => {
  const h = createHarness();
  h.listeners.get('message')({ data: { type: 'IGNORED' } });
  assert.equal(h.skipped, false);
  h.listeners.get('message')({ data: { type: 'SKIP_WAITING' } });
  assert.equal(h.skipped, true);
});

test('offline navigation falls back to the cached app shell', async () => {
  const h = createHarness();
  const cache = await (async () => {
    const event = createEvent();
    h.listeners.get('install')(event);
    await event.settle();
  })();
  void cache;
  h.setFetch(async () => { throw new Error('offline'); });
  const request = new Request('https://example.test/solonote/?v=468', { method: 'GET' });
  Object.defineProperty(request, 'mode', { value: 'navigate' });
  const event = createEvent({ request });
  h.listeners.get('fetch')(event);
  const response = await event.settle();
  assert.equal(response.status, 200);
  assert.match(await response.text(), /cached:\.\/(?:index\.html)?/);
});

test('cached static assets are returned while network refresh runs', async () => {
  const h = createHarness();
  const install = createEvent();
  h.listeners.get('install')(install);
  await install.settle();
  let networkCalls = 0;
  h.setFetch(async () => {
    networkCalls += 1;
    return new Response('fresh', { status: 200 });
  });
  const request = new Request('https://example.test/solonote/css/style.css?v=468');
  const event = createEvent({ request });
  h.listeners.get('fetch')(event);
  const response = await event.settle();
  assert.equal(response.status, 200);
  assert.match(await response.text(), /cached:/);
  assert.equal(networkCalls, 1);
});
