/* ── form-validate.js — one way to reject a field ─────────────────
   Shared by checkout, register and the order pages so a number that
   is good enough for one form is good enough for all of them, and a
   field rejected anywhere is marked the same way.

   Before this, each page carried its own copy of the phone rule and
   only checkout marked the offending box; everywhere else a toast
   appeared for two seconds and left the reader to guess which of
   nine fields it meant. */

/* ── Phone numbers ──
   Stored as ten digits starting with 9 (9171234567) and shown with a
   +63 prefix — see CLAUDE.md. What people type is another matter:
   0917 123 4567, +63 917 1234567, (0917)1234567 are all the same
   number, and the old rule accepted exactly one of those spellings
   and called the rest invalid. That was the false rejection the
   testers hit: their own number, correctly typed, refused. */
function normalisePhoneDigits(raw){
  const d = String(raw == null ? '' : raw).replace(/[\s()+.-]/g, '');
  if(/^9\d{9}$/.test(d))    return d;              // 9171234567
  if(/^09\d{9}$/.test(d))   return d.slice(1);     // 09171234567
  if(/^639\d{9}$/.test(d))  return d.slice(2);     // 639171234567
  return null;
}

/* The same number in the eleven-digit form GCash prints. */
function phoneWithZero(raw){
  const d = normalisePhoneDigits(raw);
  return d ? '0' + d : null;
}

function isValidPhone(raw){
  return normalisePhoneDigits(raw) !== null;
}

function isValidEmail(raw){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(raw || '').trim());
}

/* ── Marking a field ──
   The message goes next to the box it is about and the box is
   outlined, because a notice at the top of a long form does not tell
   anyone which field to go back to. */
function markInvalid(input, msg){
  const el = typeof input === 'string' ? document.getElementById(input) : input;
  if(!el) return false;

  el.classList.add('field-invalid');
  el.setAttribute('aria-invalid', 'true');

  const id = el.id || '';
  document.querySelectorAll(`.field-error[data-for="${id}"]`).forEach(e => e.remove());

  const err = document.createElement('p');
  err.className = 'field-error';
  err.dataset.for = id;
  err.textContent = msg;
  (el.parentNode || el).insertBefore(err, el.nextSibling);

  /* Clears as soon as they start fixing it, rather than sitting there
     contradicting what is now in the box. */
  const clear = () => {
    el.classList.remove('field-invalid');
    el.removeAttribute('aria-invalid');
    document.querySelectorAll(`.field-error[data-for="${id}"]`).forEach(e => e.remove());
    el.removeEventListener('input', clear);
    el.removeEventListener('change', clear);
  };
  el.addEventListener('input', clear);
  el.addEventListener('change', clear);

  return false;
}

function clearInvalid(scope){
  const root = scope || document;
  root.querySelectorAll('.field-invalid').forEach(el => {
    el.classList.remove('field-invalid');
    el.removeAttribute('aria-invalid');
  });
  root.querySelectorAll('.field-error').forEach(e => e.remove());
}

/* Scrolls to the first thing wrong, so a long form does not leave the
   reader hunting above the fold for what it objected to. */
function focusFirstInvalid(){
  const first = document.querySelector('.field-invalid');
  if(!first) return;
  first.scrollIntoView({ behavior: 'smooth', block: 'center' });
  try { first.focus({ preventScroll: true }); } catch {}
}

/* ── Length limits ──
   maxlength stops the typing but says nothing, so someone pasting a
   paragraph into a 200-character box watches it silently truncate.
   This puts a count under the field and colours it as it runs out. */
function attachCounter(el, max){
  if(!el || el.dataset.counterOn) return;
  el.dataset.counterOn = '1';
  el.setAttribute('maxlength', String(max));

  const out = document.createElement('small');
  out.className = 'field-count';
  (el.parentNode || el).insertBefore(out, el.nextSibling);

  const paint = () => {
    const n = el.value.length;
    out.textContent = n + ' / ' + max;
    out.classList.toggle('near', n >= max * 0.9);
    out.classList.toggle('full', n >= max);
  };
  el.addEventListener('input', paint);
  paint();
}

/* Applies limits declared in the markup: <textarea data-maxlen="200">.
   Keeping the number in the HTML means the limit sits beside the
   field it governs rather than in a list somewhere else. */
function applyFieldLimits(scope){
  (scope || document).querySelectorAll('[data-maxlen]').forEach(el => {
    const max = parseInt(el.dataset.maxlen, 10);
    if(max > 0) attachCounter(el, max);
  });
}

document.addEventListener('DOMContentLoaded', () => applyFieldLimits());
