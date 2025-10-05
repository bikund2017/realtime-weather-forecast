const CACHE_NAME = "simple-weather-app-v1";
const ESSENTIAL_FILES = ["/", "/index.html", "/style.css", "/main.js"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ESSENTIAL_FILES))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
