// This service worker unregisters itself.
// It is used to gracefully remove an old service worker and prevent 404 errors in the terminal.

self.addEventListener('install', function () {
    self.skipWaiting();
});

self.addEventListener('activate', function () {
    self.registration.unregister()
        .then(function () {
            return self.clients.matchAll();
        })
        .then(function (clients) {
            clients.forEach(client => {
                if (client.url && "navigate" in client) {
                    client.navigate(client.url);
                }
            });
        });
});
