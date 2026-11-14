// Offline support for the installed app. Network first: whenever it's online
// the app opens on the latest published version, so publishing an update is
// just pushing it; the cache is only used to open the app offline.
const CACHE = "floorplan-shell";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png",
  "./icons/icon-maskable-512.png", "./icons/favicon-32.png", "./icons/apple-touch-icon.png",
  "./vendor/three.module.min.js", "./vendor/three.core.js", "./paints.js", "./wallpapers.js"];

self.addEventListener("install", (e)=>{
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e)=>{
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e)=>{
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return; // the Anthropic API etc. go straight to the network
  e.respondWith(
    fetch(req.url, {cache: "no-cache"}) // revalidate with the host every time, past its own short caching
      .then(res => {
        if (res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, {ignoreSearch: true})
        .then(hit => hit || (req.mode === "navigate" ? caches.match("./index.html") : undefined))
        .then(hit => hit || Response.error()))
  );
});
