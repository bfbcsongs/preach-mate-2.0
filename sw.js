
"use strict";

const CACHE_NAME = "preach-mate-cache-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.svg"
];

// Install: i-cache ang pangunahing files ng app.
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

// Activate: alisin ang lumang Preach Mate caches.
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key =>
            key.startsWith("preach-mate-cache-") &&
            key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: network-first para sa page navigation,
// cache-first para sa ibang app files.
self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Huwag pakialaman ang ibang websites o origins.
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => cache.put("./index.html", copy))
              .catch(() => {});

          }
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match("./index.html");

          if (cachedPage) return cachedPage;

          const cachedRoot = await caches.match("./");
          if (cachedRoot) return cachedRoot;

          return new Response(
            "Preach Mate is offline. Please open the app online once before using it offline.",
            {
              status: 503,
              headers: {
                "Content-Type": "text/plain; charset=utf-8"
              }
            }
          );
        })
    );

    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        if (
          response &&
          response.ok &&
          response.type === "basic"
        ) {
          const copy = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, copy))
            .catch(() => {});
        }

        return response;
      });
    })
  );
});
