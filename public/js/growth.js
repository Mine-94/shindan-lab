(() => {
  'use strict';

  function track(name, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params || {});
    }
  }

  function setStatus(container, message, state) {
    const status = container && container.querySelector('[data-growth-status]');
    if (!status) return;
    status.textContent = message || '';
    status.dataset.state = state || '';
  }

  function attributedUrl(rawUrl, source, medium, campaign) {
    const url = new URL(rawUrl, window.location.origin);
    if (url.origin === window.location.origin) {
      url.searchParams.set('utm_source', source);
      url.searchParams.set('utm_medium', medium);
      url.searchParams.set('utm_campaign', campaign);
    }
    return url.toString();
  }

  async function shareInvitation(button) {
    const container = button.closest('.growth-invite-panel');
    const relation = button.dataset.type16InviteRelation || '';
    const inviterType = button.dataset.inviterType || '';
    const rawUrl = button.dataset.inviteUrl || '';
    const text = button.dataset.inviteText || '16タイプを比べてみよう';
    const url = attributedUrl(
      rawUrl,
      'invite',
      navigator.share ? 'web_share' : 'copy_link',
      `type16_${relation}_compare`
    );
    const originalLabel = button.textContent;
    button.disabled = true;

    try {
      if (navigator.share) {
        try {
          await navigator.share({ title: text, text, url });
          track('type16_invite_share', {
            relation,
            inviter_type: inviterType,
            method: 'web_share',
            page_path: window.location.pathname,
          });
          setStatus(container, '共有メニューを開きました。', 'success');
          return;
        } catch (error) {
          if (error && error.name === 'AbortError') {
            setStatus(container, '共有をキャンセルしました。', 'neutral');
            return;
          }
        }
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        track('type16_invite_share', {
          relation,
          inviter_type: inviterType,
          method: 'copy_link',
          page_path: window.location.pathname,
        });
        button.textContent = '比較リンクをコピーしました';
        setStatus(container, '相手へ貼り付けて送ってください。', 'success');
        window.setTimeout(() => {
          button.textContent = originalLabel;
        }, 2200);
        return;
      }

      window.prompt('下の比較リンクをコピーしてください', url);
      track('type16_invite_share', {
        relation,
        inviter_type: inviterType,
        method: 'manual_copy',
        page_path: window.location.pathname,
      });
      setStatus(container, '表示したリンクをコピーしてください。', 'success');
    } catch (error) {
      console.error(error);
      setStatus(container, 'リンクを共有できませんでした。もう一度お試しください。', 'error');
    } finally {
      button.disabled = false;
    }
  }

  function trackOnce(element, eventName, params) {
    if (!element || element.dataset.analyticsTracked === 'true') return;
    element.dataset.analyticsTracked = 'true';
    track(eventName, params);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const relationPage = document.querySelector('[data-relation-guide]');
    if (relationPage) {
      trackOnce(relationPage, 'relation_guide_view', {
        relation: relationPage.dataset.relationGuide || '',
        page_path: window.location.pathname,
      });
    }

    const landing = document.querySelector('[data-share-landing]');
    if (landing) {
      trackOnce(landing, 'share_landing', {
        compare_type: landing.dataset.compareCode || '',
        relation: landing.dataset.compareRelation || '',
        page_path: window.location.pathname,
      });
    }

    const comparison = document.querySelector('[data-comparison-ready="true"]');
    if (comparison) {
      trackOnce(comparison, 'type16_comparison_ready', {
        self_type: comparison.dataset.selfCode || '',
        partner_type: comparison.dataset.partnerCode || '',
        relation: comparison.dataset.relation || '',
      });
    }

    document.querySelectorAll('[data-relation-guide-form]').forEach((form) => {
      form.addEventListener('submit', () => {
        track('relation_guide_submit', {
          relation: form.dataset.relationGuideForm || '',
          self_type: form.elements.self ? form.elements.self.value : '',
          partner_type: form.elements.partner ? form.elements.partner.value : '',
          page_path: window.location.pathname,
        });
      });
    });

    document.querySelectorAll('[data-type16-invite]').forEach((button) => {
      button.addEventListener('click', () => shareInvitation(button));
    });

    document.querySelectorAll('[data-relation-guide-link]').forEach((link) => {
      link.addEventListener('click', () => {
        track('relation_guide_click', {
          relation: link.dataset.relationGuideLink || '',
          source_path: window.location.pathname,
        });
      });
    });

    const comparisonLink = document.querySelector('[data-comparison-ready-link]');
    if (comparisonLink) {
      comparisonLink.addEventListener('click', () => {
        const panel = comparisonLink.closest('[data-comparison-ready]');
        track('type16_comparison_click', {
          self_type: panel ? panel.dataset.selfCode || '' : '',
          partner_type: panel ? panel.dataset.partnerCode || '' : '',
          relation: panel ? panel.dataset.relation || '' : '',
        });
      });
    }
  });
})();
