document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('copy-link-btn');
  if (!btn) return;

  const url = btn.dataset.url;
  const text = btn.dataset.text;

  btn.addEventListener('click', async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: text, text, url });
        return;
      } catch (err) {
        // ユーザーが共有をキャンセルした場合などはクリップボードコピーにフォールバック
      }
    }

    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      const original = btn.textContent;
      btn.textContent = 'コピー完了！貼り付けてシェアしよう';
      setTimeout(() => {
        btn.textContent = original;
      }, 2000);
    } catch (err) {
      window.prompt('下のリンクをコピーしてシェアしてください', url);
    }
  });
});
