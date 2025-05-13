// Import Workbox dari CDN (Content Delivery Network)
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

// Konfigurasi Workbox, mode debug dimatikan untuk penggunaan di lingkungan produksi
workbox.setConfig({ debug: false });

// Mengimpor fungsi-fungsi spesifik dari Workbox untuk digunakan dalam service worker ini
const { registerRoute } = workbox.routing;
const { CacheFirst, NetworkFirst, StaleWhileRevalidate } = workbox.strategies;
const { CacheableResponsePlugin } = workbox.cacheableResponse;
const { ExpirationPlugin } = workbox.expiration;
const { precacheAndRoute } = workbox.precaching;
const { BackgroundSyncPlugin } = workbox.backgroundSync;

// Melakukan precache pada aset statis
// Precache adalah proses menyimpan file ke dalam cache saat service worker diinstal
// Setiap file memiliki parameter revision untuk mengelola versi cache
precacheAndRoute([
  { url: '/', revision: '1' },
  { url: '/index.html', revision: '1' },
  { url: '/css/style.css', revision: '1' },
  { url: '/js/app.js', revision: '1' },
  { url: '/manifest.json', revision: '1' },
  { url: '/tomato.png', revision: '1' },
  { url: '/icons/apple-icon-180.png', revision: '1' },
  { url: '/icons/manifest-icon-192.maskable.png', revision: '1' },
  { url: '/icons/manifest-icon-512.maskable.png', revision: '1' },
  { url: '/musics/lofi-background-music-336230.mp3', revision: '1' },
  { url: '/musics/lofi-coffee-332824.mp3', revision: '1' },
  { url: '/musics/lofi-rain-lofi-music-332732.mp3', revision: '1' },
  { url: '/musics/coffee-lofi-chill-lofi-music-332738.mp3', revision: '1' },
  { url: '/musics/rainy-lofi-city-lofi-music-332746.mp3', revision: '1' }
]);

// Caching halaman navigasi dengan strategi Network First
// Network First: Mencoba mengambil data dari jaringan terlebih dahulu, jika gagal maka menggunakan cache
// Ini memastikan pengguna mendapatkan konten terbaru saat online, tetapi tetap bisa mengakses aplikasi saat offline
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      })
    ]
  })
);

// Caching file CSS, JavaScript, dan Web Worker dengan strategi Stale While Revalidate
// Stale While Revalidate: Memberikan respons dari cache (jika ada) terlebih dahulu, kemudian memperbarui cache dari jaringan
// Strategi ini memberikan keseimbangan antara kecepatan dan kesegaran data
registerRoute(
  ({ request }) => 
    request.destination === 'style' || 
    request.destination === 'script' ||
    request.destination === 'worker',
  new StaleWhileRevalidate({
    cacheName: 'assets-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 60, // Jumlah maksimal entri yang disimpan di cache
        maxAgeSeconds: 30 * 24 * 60 * 60, // Masa berlaku cache selama 30 hari
      })
    ]
  })
);

// Caching gambar dengan strategi Cache First
// Cache First: Menggunakan cache sebagai sumber utama, dan hanya menggunakan jaringan jika tidak ada di cache
// Strategi ini cocok untuk aset statis seperti gambar yang jarang berubah
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50, // Membatasi jumlah gambar yang disimpan
        maxAgeSeconds: 60 * 24 * 60 * 60, // Masa berlaku cache gambar selama 60 hari
      })
    ]
  })
);

// Caching file audio dengan strategi Cache First
// Optimal untuk file media yang berukuran besar dan jarang berubah
registerRoute(
  ({ request }) => request.destination === 'audio',
  new CacheFirst({
    cacheName: 'audio-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 20, // Membatasi jumlah file audio yang disimpan
        maxAgeSeconds: 90 * 24 * 60 * 60, // Masa berlaku cache audio selama 90 hari
      })
    ]
  })
);

// Background Sync untuk data offline
// Memungkinkan aplikasi mengirim data ke server saat pengguna kembali online
const bgSyncPlugin = new BackgroundSyncPlugin('pomodoro-sync-queue', {
  maxRetentionTime: 24 * 60 // Mencoba kembali selama maksimal 24 jam (dalam menit)
});

// Mendaftarkan rute untuk panggilan API yang akan menggunakan background sync
// Memungkinkan aplikasi tetap berfungsi bahkan saat offline atau koneksi buruk
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    plugins: [bgSyncPlugin]
  }),
  'POST'
);

// Penanganan event push notification
// Event ini dipicu ketika server mengirim notifikasi push ke service worker
self.addEventListener('push', event => {
  let notificationData = {
    title: 'Pomodoro Timer',
    options: {
      body: 'Notifikasi waktu dari Pomodoro Timer',
      icon: '/tomato.png',
      badge: '/icons/manifest-icon-192.maskable.png',
      vibrate: [100, 50, 100], // Pola getar: 100ms aktif, 50ms istirahat, 100ms aktif
      data: {
        url: self.location.origin // URL yang akan dibuka ketika notifikasi diklik
      }
    }
  };
  
  // Menggunakan data dari event push jika tersedia
  // Ini memungkinkan server mengirim data spesifik untuk notifikasi
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      console.error('[Service Worker] Error parsing push data:', e);
    }
  }
  
  // Menampilkan notifikasi kepada pengguna
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData.options)
  );
});

// Penanganan event klik notifikasi
// Event ini dipicu ketika pengguna mengklik notifikasi yang ditampilkan
self.addEventListener('notificationclick', event => {
  event.notification.close(); // Menutup notifikasi setelah diklik
  
  // URL yang akan dibuka ketika notifikasi diklik
  const urlToOpen = new URL('/', self.location.origin);
  
  // Logika untuk membuka aplikasi:
  // 1. Jika aplikasi sudah terbuka di tab lain, fokus ke tab tersebut
  // 2. Jika tidak, buka aplikasi di tab baru
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            return client.focus(); // Fokus ke jendela yang sudah ada
          }
        }
        return clients.openWindow(urlToOpen); // Buka jendela baru jika tidak ada yang terbuka
      })
  );
}); 