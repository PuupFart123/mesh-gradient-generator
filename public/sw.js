// Service Worker for Animated Mesh Gradient Generator
// Prevents caching to avoid WebGL context issues

const CACHE_NAME = 'mesh-gradient-v1';
const NO_CACHE_URLS = [
  '/',
  '/index.html',
  '/static/js/',
  '/static/css/'
];

// Install event - don't cache anything
self.addEventListener('install', function(event) {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - always fetch fresh content
self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);
  
  // For HTML, JS, and CSS files, always fetch fresh content
  if (NO_CACHE_URLS.some(pattern => url.pathname.includes(pattern))) {
    event.respondWith(
      fetch(event.request, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }).catch(function() {
        // If fetch fails, return a simple offline page
        return new Response(
          '<html><body><h1>Offline</h1><p>Please check your connection and refresh the page.</p></body></html>',
          {
            headers: { 'Content-Type': 'text/html' }
          }
        );
      })
    );
  } else {
    // For other resources, use network-first strategy
    event.respondWith(
      fetch(event.request).catch(function() {
        return caches.match(event.request);
      })
    );
  }
});

// Message handling for cache clearing
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            return caches.delete(cacheName);
          })
        );
      })
    );
  }
}); 