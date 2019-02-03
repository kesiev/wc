
var CACHE = 'worldchangers-cache';
var precacheFiles = [
  "index.html",
  "graphics/gui.png",
  "graphics/wallpaper.png",
  "graphics/font.png",
  "graphics/sprites.png",
  "graphics/decorators.png",
  "graphics/foes.png",
  "graphics/boss.png",
  "graphics/ground.png",
  "music/battle0.mp3",
  "music/battle1.mp3",
  "music/battle2.mp3",
  "music/boss0.mp3",
  "music/boss1.mp3",
  "music/boss2.mp3",
  "music/gameover0.mp3",
  "music/victory0.mp3",
  "music/peace0.mp3",
  "music/decide0.mp3",
  "music/prebattle0.mp3",
  "music/ending0.mp3"
];

self.addEventListener('install', function(evt) {
	evt.waitUntil(precache().then(function() {
			return self.skipWaiting();
	})
	);
});

self.addEventListener('activate', function(event) {
			return self.clients.claim();
});

self.addEventListener('fetch', function(evt) {
	evt.respondWith(fromCache(evt).catch(fromServer(evt.request)));
	evt.waitUntil(update(evt.request));
});


function precache() {
	return caches.open(CACHE).then(function (cache) {
		return cache.addAll(precacheFiles);
	});
}

function fromCache(evt) {
	return caches.open(CACHE).then(function (cache) {
		return cache.match(evt.request).then(function (matching) {
			return matching || fetch(evt.request).then(function(response) {
					cache.put(evt.request, response.clone());
					return response;
				});
		});
	});
}

function update(request) {
	return caches.open(CACHE).then(function (cache) {
		return fetch(request).then(function (response) {
			return cache.put(request, response);
		});
	});
}

function fromServer(request){
	return fetch(request).then(function(response){ return response})
}