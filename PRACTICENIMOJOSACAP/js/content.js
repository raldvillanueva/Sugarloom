/* ── content.js — editable site copy ────────────────────────────
   Text on the storefront is tagged in the HTML with data-cms="key".
   This script looks each key up in the site_content row and swaps the
   text in.

   The copy written into the HTML is the fallback. A blank value, a
   missing row, or an unreachable Supabase all leave the page exactly as
   authored, so the storefront can never render empty because of the CMS.

   Attributes:
     data-cms="key"            replace the element's text
     data-cms-html="key"       replace text, turning newlines into <br>
     data-cms-src="key"        replace an image's src
     data-cms-href="key"       replace a link's href
     data-cms-tel="key"        dial the number that key displays
     data-cms-mailto="key"     write to the address that key displays
   Edited from the admin panel under Content. */

const CMS_PAGE_ID = 'homepage';

async function loadSiteContent() {
  try {
    const { data, error } = await _supa
      .from('site_content')
      .select('data')
      .eq('id', CMS_PAGE_ID)
      .maybeSingle();

    if (error || !data) return null;
    return data.data || null;
  } catch (err) {
    console.warn('CMS unavailable, using built-in copy:', err);
    return null;
  }
}

/* Only non-empty strings win — anything else keeps the authored copy. */
function cmsText(content, key) {
  const val = content[key];
  return typeof val === 'string' && val.trim() !== '' ? val : null;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* What a key will actually show on the page: the CMS value when it is
   set, otherwise the copy authored in the HTML. */
function cmsEffective(content, key) {
  const fromCms = cmsText(content, key);
  if (fromCms !== null) return fromCms;
  const el = document.querySelector(`[data-cms="${key}"]`);
  return el ? el.textContent.trim() : null;
}

/* A "Call or text us" link has to dial the number printed directly above
   it. These used to be two separate CMS fields — the number shown and
   the tel: link — and filling in only the first left the card showing
   the shop's number while the link still dialled the placeholder from
   the HTML. Deriving the link from the same key it sits next to is what
   stops the two drifting apart again. */
function applyDerivedLinks(content) {
  document.querySelectorAll('[data-cms-tel]').forEach(el => {
    const shown = cmsEffective(content, el.dataset.cmsTel);
    if (!shown) return;
    // Spaces and dashes are for reading; a tel: URI wants bare digits.
    const dialled = shown.replace(/[^\d+]/g, '');
    if (dialled) el.href = 'tel:' + dialled;
  });

  document.querySelectorAll('[data-cms-mailto]').forEach(el => {
    const shown = cmsEffective(content, el.dataset.cmsMailto);
    if (shown && shown.includes('@')) el.href = 'mailto:' + shown;
  });
}

function applySiteContent(content) {
  /* Derived links still run with nothing from the CMS, so the authored
     HTML stays self-consistent even when Supabase is unreachable. */
  const c = content || {};

  document.querySelectorAll('[data-cms]').forEach(el => {
    const val = cmsText(c, el.dataset.cms);
    if (val !== null) el.textContent = val;
  });

  document.querySelectorAll('[data-cms-html]').forEach(el => {
    const val = cmsText(c, el.dataset.cmsHtml);
    if (val !== null) el.innerHTML = escapeHtml(val).replace(/\n/g, '<br>');
  });

  document.querySelectorAll('[data-cms-src]').forEach(el => {
    const val = cmsText(c, el.dataset.cmsSrc);
    if (val !== null) el.src = val;
  });

  document.querySelectorAll('[data-cms-href]').forEach(el => {
    const val = cmsText(c, el.dataset.cmsHref);
    if (val !== null) el.href = val;
  });

  applyDerivedLinks(c);
  applyFaq(c.faq);
}

/* The FAQ is a list the admin can grow or shrink, so it is rebuilt rather
   than swapped key by key. */
function applyFaq(faq) {
  const list = document.querySelector('.faq-list');
  if (!list || !Array.isArray(faq) || !faq.length) return;

  const items = faq.filter(item => item && item.q && item.a);
  if (!items.length) return;

  list.innerHTML = items.map(item => `
    <div class="faq-item">
      <div class="faq-q">
        <span>${escapeHtml(item.q)}</span>
        <span class="faq-icon">+</span>
      </div>
      <div class="faq-a">${escapeHtml(item.a)}</div>
    </div>`).join('');

  /* Bound here rather than written as an inline onclick, because the
     shop page shows this same FAQ but does not define toggleFaq. */
  list.querySelectorAll('.faq-q').forEach(q => {
    q.addEventListener('click', () => q.closest('.faq-item').classList.toggle('open'));
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  applySiteContent(await loadSiteContent());
});
