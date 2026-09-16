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

function applySiteContent(content) {
  if (!content) return;

  document.querySelectorAll('[data-cms]').forEach(el => {
    const val = cmsText(content, el.dataset.cms);
    if (val !== null) el.textContent = val;
  });

  document.querySelectorAll('[data-cms-html]').forEach(el => {
    const val = cmsText(content, el.dataset.cmsHtml);
    if (val !== null) el.innerHTML = escapeHtml(val).replace(/\n/g, '<br>');
  });

  document.querySelectorAll('[data-cms-src]').forEach(el => {
    const val = cmsText(content, el.dataset.cmsSrc);
    if (val !== null) el.src = val;
  });

  document.querySelectorAll('[data-cms-href]').forEach(el => {
    const val = cmsText(content, el.dataset.cmsHref);
    if (val !== null) el.href = val;
  });

  applyFaq(content.faq);
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
      <div class="faq-q" onclick="toggleFaq(this)">
        <span>${escapeHtml(item.q)}</span>
        <span class="faq-icon">+</span>
      </div>
      <div class="faq-a">${escapeHtml(item.a)}</div>
    </div>`).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  applySiteContent(await loadSiteContent());
});
