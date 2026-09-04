'use strict';

(function () {
  function track(name, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params || {});
    }
  }

  function observeOnce(element, callback, threshold) {
    if (!element) return;
    if (!('IntersectionObserver' in window)) {
      callback();
      return;
    }
    const observer = new IntersectionObserver(
      function (entries) {
        if (entries.some(function (entry) { return entry.isIntersecting; })) {
          callback();
          observer.disconnect();
        }
      },
      { threshold: threshold || 0.25 }
    );
    observer.observe(element);
  }

  document.querySelectorAll('[data-type16-celebrity-section]').forEach(function (section) {
    const typeCode = section.getAttribute('data-type-code') || '';
    const celebrityCount = Number.parseInt(section.getAttribute('data-celebrity-count') || '0', 10) || 0;
    let tracked = false;
    observeOnce(section, function () {
      if (tracked) return;
      tracked = true;
      track('type16_celebrity_section_view', {
        type_code: typeCode,
        celebrity_count: celebrityCount,
        page_path: window.location.pathname,
      });
    });
  });

  const teaser = document.querySelector('[data-type16-celebrity-home-teaser]');
  if (teaser) {
    let tracked = false;
    observeOnce(teaser, function () {
      if (tracked) return;
      tracked = true;
      track('type16_celebrity_teaser_view', {
        page_path: window.location.pathname,
      });
    });
  }

  const directory = document.querySelector('[data-type16-celebrity-directory]');
  if (directory) {
    const input = directory.querySelector('[data-type16-celebrity-search]');
    const status = directory.querySelector('[data-type16-celebrity-search-status]');
    const grid = directory.querySelector('[data-type16-celebrity-directory-grid]');
    const empty = directory.querySelector('[data-type16-celebrity-empty]');
    const toggle = directory.querySelector('[data-type16-celebrity-toggle]');
    const entries = Array.from(directory.querySelectorAll('[data-celebrity-directory-entry]'));
    const total = entries.length;
    let expanded = false;
    let searchTimer = null;
    let directoryTracked = false;

    observeOnce(directory, function () {
      if (directoryTracked) return;
      directoryTracked = true;
      track('type16_celebrity_directory_view', {
        celebrity_count: total,
        page_path: window.location.pathname,
      });
    }, 0.15);

    function normalize(value) {
      return String(value || '').normalize('NFKC').trim().toLowerCase();
    }

    function updateDirectory(trackSearch) {
      const query = normalize(input && input.value);
      let visible = 0;

      entries.forEach(function (entry) {
        const searchText = normalize(entry.getAttribute('data-search-text'));
        const matches = !query || searchText.indexOf(query) !== -1;
        entry.hidden = !matches;
        if (matches) visible += 1;
      });

      if (grid) {
        grid.classList.toggle('is-collapsed', !query && !expanded);
      }
      if (toggle) {
        toggle.hidden = Boolean(query);
        toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        toggle.textContent = expanded ? '表示を少なくする' : `${total}人をすべて見る`;
      }
      if (empty) empty.hidden = visible !== 0;
      if (status) {
        status.textContent = query ? `${visible}人が該当` : `${total}人を掲載`;
      }

      if (trackSearch && query) {
        window.clearTimeout(searchTimer);
        searchTimer = window.setTimeout(function () {
          track('type16_celebrity_directory_search', {
            query_length: query.length,
            result_count: visible,
            page_path: window.location.pathname,
          });
        }, 500);
      }
    }

    if (input) {
      input.addEventListener('input', function () {
        updateDirectory(true);
      });
      input.addEventListener('search', function () {
        updateDirectory(false);
      });
    }

    if (toggle) {
      toggle.addEventListener('click', function () {
        expanded = !expanded;
        updateDirectory(false);
        track('type16_celebrity_directory_toggle', {
          expanded: expanded ? 1 : 0,
          celebrity_count: total,
          page_path: window.location.pathname,
        });
      });
    }

    updateDirectory(false);
  }

  document.addEventListener('click', function (event) {
    const target = event.target.closest && event.target.closest('a');
    if (!target) return;

    if (target.matches('[data-type16-celebrity-source]')) {
      track('type16_celebrity_source_click', {
        type_code: target.getAttribute('data-type-code') || '',
        celebrity_name: target.getAttribute('data-celebrity-name') || '',
        source_url: target.href,
        page_path: window.location.pathname,
      });
      return;
    }

    if (target.matches('[data-type16-celebrity-profile]')) {
      track('type16_celebrity_profile_click', {
        type_code: target.getAttribute('data-type-code') || '',
        celebrity_name: target.getAttribute('data-celebrity-name') || '',
        page_path: window.location.pathname,
      });
      return;
    }

    if (target.matches('[data-type16-celebrity-directory-cta]')) {
      track('type16_celebrity_directory_cta_click', {
        page_path: window.location.pathname,
        destination: target.getAttribute('href') || '',
      });
    }
  });
})();
