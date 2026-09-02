document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('copy-link-btn');
  if (!btn) return;

  const rawUrl = btn.dataset.url;
  const text = btn.dataset.text;

  function trackShare(method, sharedUrl) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'share_success', {
        method,
        shared_url: sharedUrl,
        page_path: window.location.pathname,
      });
    }
  }

  function attributedUrl(method) {
    try {
      const url = new URL(rawUrl, window.location.origin);
      if (url.origin === window.location.origin) {
        url.searchParams.set('utm_source', 'result_share');
        url.searchParams.set('utm_medium', method);
        url.searchParams.set('utm_campaign', 'organic_share');
      }
      return url.toString();
    } catch (error) {
      return rawUrl;
    }
  }

  btn.addEventListener('click', async () => {
    const webShareUrl = attributedUrl('web_share');
    if (navigator.share) {
      try {
        await navigator.share({ title: text, text, url: webShareUrl });
        trackShare('web_share', webShareUrl);
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }

    const copyUrl = attributedUrl('copy_link');
    try {
      await navigator.clipboard.writeText(`${text}\n${copyUrl}`);
      trackShare('copy_link', copyUrl);
      const original = btn.textContent;
      btn.textContent = 'コピー完了！貼り付けてシェアしよう';
      setTimeout(() => {
        btn.textContent = original;
      }, 2000);
    } catch (err) {
      window.prompt('下のリンクをコピーしてシェアしてください', copyUrl);
      trackShare('manual_copy', copyUrl);
    }
  });
});
