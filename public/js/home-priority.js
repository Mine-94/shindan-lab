'use strict';

(function () {
  function sendEvent(name, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params);
    }
  }

  function initHomePriorityTracking() {
    var section = document.querySelector('[data-home-priority-version]');
    if (!section) return;

    var version = section.getAttribute('data-home-priority-version') || 'unknown';
    var cards = Array.prototype.slice.call(
      section.querySelectorAll('[data-home-priority-id]')
    );

    sendEvent('home_priority_view', {
      ranking_version: version,
      priority_item_count: cards.length,
    });

    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        sendEvent('home_priority_click', {
          ranking_version: version,
          priority_item: card.getAttribute('data-home-priority-id') || 'unknown',
          priority_rank: Number(card.getAttribute('data-home-priority-rank') || 0),
          editorial_score: Number(card.getAttribute('data-home-priority-score') || 0),
          destination_path: card.getAttribute('href') || '',
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomePriorityTracking);
  } else {
    initHomePriorityTracking();
  }
})();
