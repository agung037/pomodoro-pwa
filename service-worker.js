// Cache name with version - update version when assets change
const CACHE_NAME = 'pomodoro-app-v1';

// List of files to cache for offline use
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/manifest.json',
  '/tomato.png',
  '/icons/apple-icon-180.png',
  '/icons/manifest-icon-192.maskable.png',
  '/icons/manifest-icon-512.maskable.png',
  '/musics/lofi-background-music-336230.mp3',
  '/musics/lofi-coffee-332824.mp3',
  '/musics/lofi-rain-lofi-music-332732.mp3',
  '/musics/coffee-lofi-chill-lofi-music-332738.mp3',
  '/musics/rainy-lofi-city-lofi-music-332746.mp3'
];

// Install event - caches all static assets when the service worker is installed
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing Service Worker...');
  
  // Extend the service worker installation until the cache is populated
  event.waitUntil(
    // Open the cache
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell and content');
        // Add all files to the cache
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => {
        // Force service worker activation
        console.log('[Service Worker] Successfully installed and cached app shell');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Error during install:', error);
      })
  );
});

// Activate event - clean up old caches when a new service worker is activated
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating Service Worker...');
  
  // Remove old caches
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Removing old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Ensure the service worker takes control of all clients immediately
        console.log('[Service Worker] Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when offline, or fetch from the network
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      // Cache-first strategy with network fallback
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Return the cached version
            console.log('[Service Worker] Fetching resource from cache:', event.request.url);
            return cachedResponse;
          }
          
          // If not in cache, fetch from network and cache for future
          return fetch(event.request)
            .then(networkResponse => {
              // Return the network response
              if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                console.log('[Service Worker] Fetched non-cacheable resource:', event.request.url);
                return networkResponse;
              }
              
              // Clone the response - one to return, one to cache
              const responseToCache = networkResponse.clone();
              
              // Open the cache and store the new response
              caches.open(CACHE_NAME)
                .then(cache => {
                  console.log('[Service Worker] Caching new resource:', event.request.url);
                  cache.put(event.request, responseToCache);
                });
              
              return networkResponse;
            })
            .catch(error => {
              console.error('[Service Worker] Fetch failed:', error);
              
              // For navigation requests, provide the offline page
              if (event.request.mode === 'navigate') {
                return caches.match('/index.html');
              }
              
              // Otherwise just indicate the fetch failed
              return new Response('Network error happened', {
                status: 404,
                headers: { 'Content-Type': 'text/plain' }
              });
            });
        })
    );
  }
});

// Push event - handle push notifications
self.addEventListener('push', event => {
  console.log('[Service Worker] Push received:', event);
  
  let notificationData = {
    title: 'Pomodoro Timer',
    options: {
      body: 'Time notification from Pomodoro Timer',
      icon: '/tomato.png',
      badge: '/icons/manifest-icon-192.maskable.png',
      vibrate: [100, 50, 100],
      data: {
        url: self.location.origin
      }
    }
  };
  
  // Use data from the push event if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      console.error('[Service Worker] Error parsing push data:', e);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData.options)
  );
});

// Notification click event - handle when user clicks a notification
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification clicked:', event);
  
  event.notification.close();
  
  // Open a window/tab with the app 
  const urlToOpen = new URL('/', self.location.origin);
  
  // Focus if a window already exists, open a new one if it doesn't
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Check if a client window is already open
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // If no existing client, open a new window
        return clients.openWindow(urlToOpen);
      })
  );
});

// Background sync for offline functionality
self.addEventListener('sync', event => {
  console.log('[Service Worker] Background Sync event:', event);
  
  if (event.tag === 'sync-pomodoro-data') {
    event.waitUntil(
      // Sync data from IndexedDB to server when back online
      // For demo purposes, just log that sync would happen
      console.log('[Service Worker] Syncing data from IndexedDB to server')
    );
  }
}); 