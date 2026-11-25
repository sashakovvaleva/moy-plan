// Кэширует приложение, чтобы оно открывалось без интернета,
// и создаёт файлы-напоминания для Календаря iPhone.
// При каждом обновлении файлов увеличивайте номер версии ниже.
const CACHE = 'moy-plan-v5';
const MUST = ['./', './index.html'];
const OPTIONAL = ['./manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
const fresh = u => new Request(u, { cache: 'reload' }); // в обход кэша браузера, чтобы взять новую версию

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(MUST.map(fresh)).then(() => Promise.all(OPTIONAL.map(f => c.add(fresh(f)).catch(() => {})))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Напоминание для Календаря: файл .ics создаётся прямо на телефоне, без интернета
  if (url.origin === self.location.origin && url.pathname.endsWith('/event.ics')) {
    e.respondWith(new Response(url.searchParams.get('c') || '', {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="napominanie.ics"'
      }
    }));
    return;
  }

  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      return fetch(e.request).catch(() => caches.match('./index.html'));
    })
  );
});
