'use strict';

(function () {
  const section = document.querySelector('[data-type16-celebrity-section]');
  if (!section) return;

  const typeCode = section.getAttribute('data-type-code') || '';
  const celebrityCount = Number.parseInt(section.getAttribute('data-celebrity-count') || '0', 10) || 0;
  let viewTracked = false;

  function track(name, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params || {});
    }
  }

  function trackView() {
    if (viewTracked) return;
    viewTracked = true;
    track('type16_celebrity_section_view', {
      type_code: typeCode,
      celebrity_count: celebrityCount,
      page_path: window.location.pathname,
    });
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        if (entries.some(function (entry) { return entry.isIntersecting; })) {
          trackView();
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(section);
  } else {
    trackView();
  }

  section.addEventListener('click', function (event) {
    const link = event.target.closest && event.target.closest('[data-type16-celebrity-source]');
    if (!link) return;
    track('type16_celebrity_source_click', {
      type_code: link.getAttribute('data-type-code') || typeCode,
      celebrity_name: link.getAttribute('data-celebrity-name') || '',
      source_url: link.href,
      page_path: window.location.pathname,
    });
  });
})();
