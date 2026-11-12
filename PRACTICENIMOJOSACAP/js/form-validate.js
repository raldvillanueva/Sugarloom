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

/* ── While they type ──
   A Philippine mobile number is ten digits. How many a box should
   take depends on how it is being written, and a single number for
   all three spellings is wrong for two of them:

     9171234567     10 — the number itself
     09171234567    11 — the national trunk 0
     639171234567   12 — the country code instead of that 0

   One flat limit of twelve let 094939978999 be typed into a field
   that already shows +63 beside it. So the limit follows what is
   there: the leading digits say which spelling this is. Nothing is
   ambiguous — a local number starts 9, so one starting 0 or 63 can
   only be the longer form. */
function phoneDigitLimit(digits){
  if(digits.startsWith('63')) return 12;
  if(digits.startsWith('0'))  return 11;
  return 10;
}

function trimPhoneInput(raw){
  const s = String(raw == null ? '' : raw);
  const limit = phoneDigitLimit(s.replace(/[^0-9]/g, ''));

  let digits = 0, out = '';
  for(let i = 0; i < s.length; i++){
    const ch = s[i];
    /* A + is the country prefix, so it belongs at the front or not
       at all. */
    if(ch === '+'){ if(out === '') out = '+'; continue; }
    if(!/[0-9\s()-]/.test(ch)) continue;

    if(ch >= '0' && ch <= '9'){
      if(digits >= limit) continue;
      digits++;
    }
    out += ch;
  }
  return out;
}

/* The same number in the eleven-digit form GCash prints. */
function phoneWithZero(raw){
  const d = normalisePhoneDigits(raw);
  return d ? '0' + d : null;
}

/* ── Obvious junk ──
   9999999999 is a well-formed Philippine mobile number: 0999 is a real
   Smart prefix and the shape is right, so the format rule above lets
   it through. It is also what someone types when they do not want to
   give a number.

   The temptation is a list of assigned prefixes, and it is the wrong
   answer here. The published lists disagree with each other, new
   prefixes are issued, and number portability means a prefix no
   longer says much anyway — this form has already been fixed once for
   refusing people's real numbers, and a stale list would do it again.

   So this only rejects what cannot be a real number rather than
   guessing what is: fewer than three different digits in the whole
   ten (9999999999, 9000000000, 9090909090), or the whole thing
   counting up or down. 0917-111-1111 is a real sort of number, costs
   a premium, and has three different digits — it still goes in.

   None of this proves the number belongs to them. Only a code sent to
   it does, and that is a separate job. */
function looksLikeJunkNumber(digits){
  if(new Set(digits).size < 3) return true;

  const step = d => {
    for(let i = 1; i < d.length; i++){
      if(+d[i] - +d[i - 1] !== +d[1] - +d[0]) return false;
    }
    return true;
  };
  /* 1234567890 and 9876543210, but not a number that merely starts
     with a run. */
  return step(digits) && Math.abs(+digits[1] - +digits[0]) === 1;
}

function isValidPhone(raw){
  const d = normalisePhoneDigits(raw);
  return d !== null && !looksLikeJunkNumber(d);
}

function isValidEmail(raw){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(raw || '').trim());
}

/* ── Names and addresses ──
   A whitelist rather than a list of things to ban. Emoji are only the
   visible half of the problem: an address is read by a courier and
   typed into a delivery booking, and anything that is not a letter, a
   digit or ordinary punctuation does not survive that trip. Banning
   emoji one block at a time means chasing every new release of
   Unicode; saying what an address is made of does not.

   \p{L} is any letter in any script, so Ñ, é and non-Latin names pass
   — this is a Philippine address field, not an ASCII one. */
const NAME_CHARS = /^[\p{L} .'\-]+$/u;
const ADDRESS_CHARS = /^[\p{L}\p{N} .,'\-#/&()]+$/u;

/* The same two sets, inverted, for stripping as someone types. One
   definition would be neater than two, but a regex cannot be both
   anchored and global, and the pair is checked against each other in
   the tests. */
const FIELD_CHARSETS = {
  name:    /[^\p{L} .'\-]/gu,
  address: /[^\p{L}\p{N} .,'\-#/&()]/gu,
};

function isValidName(raw){
  const s = String(raw == null ? '' : raw).trim();
  return s.length > 0 && NAME_CHARS.test(s);
}

function isValidAddress(raw){
  const s = String(raw == null ? '' : raw).trim();
  return s.length > 0 && ADDRESS_CHARS.test(s);
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

/* ── Stopping it at the keyboard ──
   Rejecting an emoji address after the fact is a worse experience
   than not accepting the emoji: the whole point of a rule nobody
   means to break is that it should be impossible to break by
   accident. The character simply does not appear, the way maxlength
   stops the eleventh digit without an argument about it.

   The submit-time check stays. This handles typing and pasting; it
   does not handle a value set by autofill, a browser extension or the
   console, and a rule that only lives in the keyboard is not a rule. */
function filterChars(el, strip){
  const before = el.value;
  const after  = before.replace(strip, '');
  if(after === before) return;

  /* Where the caret ends up is the length of the kept text before it,
     otherwise pasting into the middle of an address throws the cursor
     to the end. */
  const pos = typeof el.selectionStart === 'number' ? el.selectionStart : before.length;
  const kept = before.slice(0, pos).replace(strip, '').length;

  el.value = after;
  try { el.setSelectionRange(kept, kept); } catch {}
}

/* Applies the set named in the markup: <input data-chars="address">. */
function applyCharFilters(scope){
  (scope || document).querySelectorAll('[data-chars]').forEach(el => {
    const strip = FIELD_CHARSETS[el.dataset.chars];
    if(!strip || el.dataset.charsOn) return;
    el.dataset.charsOn = '1';

    const run = () => filterChars(el, strip);
    el.addEventListener('input', run);
    /* Autofill and drag-and-drop do not always raise input. */
    el.addEventListener('change', run);
    el.addEventListener('blur', run);
  });
}

/* <input id="phone" data-phone> — the same trimming wherever a number
   is typed, rather than each page carrying its own idea of it. The
   profile page had none at all, so its box took whatever fitted in
   maxlength. */
function applyPhoneInputs(scope){
  (scope || document).querySelectorAll('input[data-phone]').forEach(el => {
    if(el.dataset.phoneOn) return;
    el.dataset.phoneOn = '1';

    const run = () => {
      const before = el.value;
      const after  = trimPhoneInput(before);
      if(after === before) return;

      const pos  = typeof el.selectionStart === 'number' ? el.selectionStart : before.length;
      const kept = trimPhoneInput(before.slice(0, pos)).length;
      el.value = after;
      try { el.setSelectionRange(kept, kept); } catch {}
    };
    el.addEventListener('input', run);
    el.addEventListener('change', run);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  applyFieldLimits();
  applyCharFilters();
  applyPhoneInputs();
});
