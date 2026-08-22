document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('copy-link-btn');
  if (!btn) return;

  const url = btn.dataset.url;
  const text = btn.dataset.text;

  function trackShare(method) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'share_success', {
        method,
        page_path: window.location.pathname,
      });
    }
  }

  btn.addEventListener('click', async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: text, text, url });
        trackShare('web_share');
        return;
      } catch (err) {
        // ユーザーが共有をキャンセルした場合などはクリップボードコピーにフォールバック
      }
    }

    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      trackShare('copy_link');
      const original = btn.textContent;
      btn.textContent = 'コピー完了！貼り付けてシェアしよう';
      setTimeout(() => {
        btn.textContent = original;
      }, 2000);
    } catch (err) {
      window.prompt('下のリンクをコピーしてシェアしてください', url);
      trackShare('manual_copy');
    }
  });
});
