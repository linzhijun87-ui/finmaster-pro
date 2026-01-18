// Financial Masterplan PRO - Service Worker
const CACHE_NAME = 'finmaster-pro-v2.3'; // Bump version to force update
const urlsToCache = [
  './',
  './index.html',
  './css/main.css',
  './app.js',
  './manifest.json',
  './assets/icons/icon-72x72.png',
  './assets/icons/icon-96x96.png',
  './assets/icons/icon-128x128.png',
  './assets/icons/icon-144x144.png',
  './assets/icons/icon-152x152.png',
  './assets/icons/icon-192x192.png',
  './assets/icons/icon-384x384.png',
  './assets/icons/icon-512x512.png',
  './assets/icons/apple-touch-icon.png'
];

// Install Service Worker
self.addEventListener('install', event => {
  console.log('🛠️ FinMaster PRO: Installing Service Worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache opened');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('🚀 All resources cached');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Cache failed:', error);
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', event => {
  console.log('⚡ FinMaster PRO: Activating Service Worker...');

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log(`🗑️ Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
      .then(() => {
        console.log('✅ Service Worker ready');
        return self.clients.claim();
      })
  );
});

// Fetch Strategy - Network First, Fallback to Cache
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Chrome extensions
  if (event.request.url.startsWith('chrome-extension://')) return;

  // Skip analytics
  if (event.request.url.includes('google-analytics')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache valid responses
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // If HTML request and no cache, return index.html
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// Handle messages from main app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push Notifications
self.addEventListener('push', event => {
  console.log('📱 Push notification received');

  const options = {
    body: event.data?.text() || 'Pengingat dari Financial Masterplan PRO',
    icon: './assets/icons/icon-192x192.png',
    badge: './assets/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: './'
    },
    actions: [
      {
        action: 'open',
        title: 'Buka Aplikasi'
      },
      {
        action: 'close',
        title: 'Tutup'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Financial Masterplan PRO', options)
  );
});

// Notification Click
self.addEventListener('notificationclick', event => {
  console.log('🖱️ Notification clicked');

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url.includes('./') && 'focus' in client) {
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow('./');
        }
      })
  );
});