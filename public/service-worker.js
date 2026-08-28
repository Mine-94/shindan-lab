// 最小限のサービスワーカー — 「ホーム画面に追加」(PWAインストール)の最低要件のみを満たす。
// 診断結果や運勢など更新されるコンテンツの特性上、キャッシュは行わず常にネットワークへ通す。
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
