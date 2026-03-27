const CACHE_NAME = 'usipel-v1';
const ASSETS = [
  './',
  './index.html',
  './styles/main.css',
  './js/app.js',
  './js/supabase-client.js',
  './js/auth.js',
  './assets/logo_usipel_dark_mode.png',
  './assets/logo_usipel_light_mode.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  // Ignora requests da API Supabase (não cachear dados dinâmicos por padrão no SW básico)
  if (e.request.url.includes('supabase.co')) {
    return;
  }
  
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
