/**
 * OpenAgriMap - Service Worker (P4: installable PWA).
 * Cache-first for the app shell (our own files), network-first for
 * everything else (tiles, proxied APIs). Bump CACHE_VERSION on changes.
 */
"use strict";

const CACHE_VERSION = "openagrimap-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/app.js",
  "./js/api-client.js",
  "./js/data-sources.js",
  "./js/mock-parcels.js",
  "./js/outbreak-engine.js",
  "./js/services.js",
  "./manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only handle GET, same-origin app shell + our API; let tiles/CDN go to network.
  if (event.request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/")) {
    // network-first for API calls (fresh data), cache fallback when offline
    event.respondWith(
      fetch(event.request).then((res) => {
        if (res.ok && event.request.method === "GET") {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
        }
        return res;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // cache-first for the app shell
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((res) => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
      }
      return res;
    }).catch(() => caches.match("./index.html")))
  );
});
