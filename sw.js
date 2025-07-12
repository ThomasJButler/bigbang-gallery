/**
 * Service Worker for Big Bang Gallery PWA
 * Handles offline functionality and caching
 * @author Thomas J Butler
 */

const CACHE_NAME = 'bigbang-gallery-v3.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/gallery.js',
    '/manifest.json',
    '/images/icon-32.png',
    '/images/icon-192.png',
    '/images/icon-512.png',
    'https://fonts.googleapis.com/css2?family=VT323&display=swap'
];

// Install event - cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin) && 
        !event.request.url.includes('fonts.googleapis.com') &&
        !event.request.url.includes('cdnjs.cloudflare.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }

                // Clone the request
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(response => {
                    // Check if valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                }).catch(() => {
                    // Offline fallback
                    if (event.request.destination === 'image') {
                        return new Response('<svg>...</svg>', {
                            headers: { 'Content-Type': 'image/svg+xml' }
                        });
                    }
                });
            })
    );
});

// Background sync for analytics
self.addEventListener('sync', event => {
    if (event.tag === 'analytics') {
        event.waitUntil(sendAnalytics());
    }
});

// Push notifications (future enhancement)
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'New artwork added to the gallery!',
        icon: '/images/icon-192.png',
        badge: '/images/badge-72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };

    event.waitUntil(
        self.registration.showNotification('Big Bang Gallery', options)
    );
});