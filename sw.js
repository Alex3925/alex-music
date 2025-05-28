// sw.js
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.url.endsWith('.mp3')) {
        event.respondWith(fetch(event.request));
    }
});
