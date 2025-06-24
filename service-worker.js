// service-worker.js - Service Worker para funcionalidad offline

const CACHE_NAME = 'expense-tracker-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/settings.html',
    '/css/styles.css',
    '/js/app.js',
    '/js/storage.js',
    '/js/charts.js',
    '/js/settings.js',
    '/manifest.json',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Instalar Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache abierto');
                return cache.addAll(urlsToCache);
            })
    );
});

// Activar Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Eliminando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Interceptar peticiones
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Si encuentra en cache, devolver la respuesta cacheada
                if (response) {
                    return response;
                }

                // Si no está en cache, hacer la petición
                return fetch(event.request).then(response => {
                    // Verificar si recibimos una respuesta válida
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clonar la respuesta
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
            .catch(() => {
                // Si falla la red, mostrar página offline
                return new Response('Sin conexión a Internet. La aplicación funciona en modo offline con los datos guardados localmente.');
            })
    );
});

// Actualizar cache cuando haya cambios
self.addEventListener('message', event => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
