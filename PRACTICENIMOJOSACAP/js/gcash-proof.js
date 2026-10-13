/* ── gcash-proof.js — reading a GCash receipt screenshot ─────────
   Shared by the checkout page (customer uploads) and the admin panel
   (staff reviews). Loaded by both, so keep it free of page-specific
   assumptions.

   WHAT THIS IS, AND WHAT IT IS NOT

   A screenshot is not proof of payment. It is an image, and an image
   can be edited. Nothing done here changes that, and the panel never
   claims otherwise: the only real confirmation is the money appearing
   in the shop's own GCash history.

   What the reading is for is catching the things that go wrong far more
   often than forgery — a screenshot of the wrong transaction, the wrong
   amount, a payment sent to somebody else's number, a blurry photo of a
   screen, or the same receipt attached to two orders. Those are ordinary
   mistakes and lazy fraud, and spotting them before an order goes to the
   baker saves a cake. Anything it cannot read is handed to a person
   rather than guessed at.
   ──────────────────────────────────────────────────────────────── */

/* The shop's own GCash account. One place to change.

   `label` and `holder` are two different things and the distinction
   matters. The customer is told to send to GCASHMOJO, which is what the
   shop calls its account — but GCash puts the registered account
   HOLDER on the receipt, masked, as "GE***D V.". Matching a receipt
   against the label would fail on every genuine payment, so `holder` is
   what the reader compares against. Set it to exactly what the GCash
   card shows, mask characters and all. */
const GCASH_ACCOUNT = {
  label:  'GCASHMOJO',          // shown to the customer
  holder: 'GE***D V.',          // as GCash prints it on the receipt
  number: '0949 399 7899'
};

/* Tesseract is ~2 MB with its language data, so it is fetched only when
   somebody actually uploads a receipt rather than on every page load. */
const TESSERACT_SRC = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.0/dist/tesseract.min.js';
let _tesseractLoading = null;

function loadTesseract(){
  if(window.Tesseract) return Promise.resolve(window.Tesseract);
  if(_tesseractLoading) return _tesseractLoading;
  _tesseractLoading = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = TESSERACT_SRC;
    s.onload  = () => resolve(window.Tesseract);
    s.onerror = () => reject(new Error('Could not load the receipt reader'));
    document.head.appendChild(s);
  });
  return _tesseractLoading;
}

/* Screenshots go into a jsonb row with the order, so they are resized
   first. Wide enough that the reference number stays legible, small
   enough not to bloat every read of the orders table. */
function shrinkProof(file, maxW = 1000, quality = 0.72){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not an image'));
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const c = document.createElement('canvas');
        c.width  = Math.round(img.width  * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ── Pulling the figures out of the text ── */

function normaliseOcr(text){
  return (text || '')
    .replace(/ /g, ' ')
    .replace(/[|]/g, '1')        // a common misread of 1 in receipt fonts
    .replace(/\s+/g, ' ')
    .trim();
}

/* GCash reference numbers are 13 digits, usually printed in groups.
   Spaces inside the number are stripped before matching. */
function findReference(text){
  const flat = text.replace(/[\s-]/g, '');
  const m = flat.match(/(?:refno|referenceno|reference)[:.]?(\d{10,16})/i)
         || flat.match(/\b(\d{13})\b/);
  return m ? m[1] : null;
}

/* Figures on a send receipt that are not the payment. The balance is
   the dangerous one: it is usually the largest number on the screen, so
   a naive "take the biggest" reads someone's wallet balance as the
   amount they sent. */
const NOT_THE_AMOUNT = /(balance|fee|charge|discount|rebate|cashback|points)/i;

function findAmount(text){
  // A labelled figure is the reliable one — "Amount", "Total Amount Sent".
  const labelled = text.match(/(?:amount|total(?:\s+amount)?(?:\s+sent)?)[^\d₱]{0,12}(?:₱|php)?\s*([\d,]+(?:\.\d{2})?)/i);
  if(labelled){
    const n = parseFloat(labelled[1].replace(/,/g, ''));
    if(!isNaN(n)) return n;
  }

  /* Otherwise take the largest peso figure that is not sitting next to
     a word saying it is something else. */
  const candidates = [];
  for(const m of text.matchAll(/(?:₱|php)\s*([\d,]+(?:\.\d{2})?)/gi)){
    const before = text.slice(Math.max(0, m.index - 20), m.index);
    if(NOT_THE_AMOUNT.test(before)) continue;
    const n = parseFloat(m[1].replace(/,/g, ''));
    if(!isNaN(n)) candidates.push(n);
  }
  return candidates.length ? Math.max(...candidates) : null;
}

function findDate(text){
  const m = text.match(/\b(\d{1,2}\s+\w{3,9}\s+\d{4})\b/)
         || text.match(/\b(\w{3,9}\s+\d{1,2},?\s+\d{4})\b/)
         || text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if(!m) return null;
  const d = new Date(m[1]);
  return isNaN(d.getTime()) ? null : d;
}

/* GCash masks the middle of the account holder's name — "GE***D V." —
   so there is no exact string to look for. The mask is treated as a
   wildcard: the letters either side of it have to appear, in order, in
   whatever the receipt calls the recipient.

   That still catches a payment sent to someone else, because the
   surviving letters and their order rarely line up by accident. What it
   cannot do is distinguish two people whose names mask to the same
   shape, and nothing reading a screenshot could. */
function maskedNamePattern(expected){
  const letters = expected.toUpperCase().replace(/[^A-Z*•·.]/g, '');
  const parts = letters.split(/[*•·.]+/).filter(Boolean);
  if(!parts.length) return null;
  // the visible fragments, in order, with anything allowed between them
  return new RegExp(parts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[A-Z]*'));
}

function nameLooksRight(text, expected){
  if(!expected) return false;
  const hay = String(text).toUpperCase().replace(/[^A-Z]/g, '');

  // a plain name, present as written
  const plain = expected.toUpperCase().replace(/[^A-Z]/g, '');
  if(plain && !/[*•·]/.test(expected) && hay.includes(plain)) return true;

  const re = maskedNamePattern(expected);
  return re ? re.test(hay) : false;
}

/* ── The verdict ──
   `pass`   — everything checkable lines up
   `review` — readable, but something does not match or could not be found
   `fail`   — this is not a GCash receipt, or the amount is plainly wrong
*/
function judgeGcashProof(rawText, expected = {}){
  const text = normaliseOcr(rawText);
  const low  = text.toLowerCase();

  const found = {
    reference: findReference(text),
    amount:    findAmount(text),
    date:      findDate(text)
  };

  const isGcash = /gcash/.test(low) || /express\s*send/.test(low) ||
                  /send\s*money/.test(low) || /ref(?:erence)?\s*no/.test(low);

  const checks = [];
  const add = (ok, label, detail) => checks.push({ ok, label, detail: detail || '' });

  add(isGcash, 'Looks like a GCash receipt',
      isGcash ? '' : 'None of the usual GCash wording was found in the image');

  add(!!found.reference, 'Reference number',
      found.reference || 'No 13-digit reference number found');

  if(expected.amount != null){
    /* A peso or two of rounding is not worth a rejection; a different
       amount is. */
    const near = found.amount != null && Math.abs(found.amount - expected.amount) <= 1;
    add(near, 'Amount matches the order',
        found.amount == null
          ? 'No amount could be read'
          : `Receipt says ₱${found.amount.toLocaleString()}, order is ₱${expected.amount.toLocaleString()}`);
  }

  /* Matched against the registered holder, reported as the name the
     customer was given — they were told GCASHMOJO, so a message about
     "GE***D V." would mean nothing to them. */
  const holder = expected.holder || GCASH_ACCOUNT.holder;
  const shown  = expected.label  || GCASH_ACCOUNT.label;
  const nameOk = nameLooksRight(text, holder);
  add(nameOk, `Sent to ${shown}`,
      nameOk ? '' : `The receipt does not name ${holder}, the account behind ${shown}`);

  if(found.date){
    const ageDays = (Date.now() - found.date.getTime()) / 86400000;
    add(ageDays <= 3 && ageDays >= -1, 'Dated recently',
        `Receipt dated ${found.date.toLocaleDateString('en-PH', { day:'numeric', month:'short', year:'numeric' })}`);
  }

  const amountWrong = checks.some(c => c.label.startsWith('Amount') && !c.ok && found.amount != null);
  const failed      = checks.filter(c => !c.ok).length;

  let verdict;
  if(!isGcash || amountWrong) verdict = 'fail';
  else if(failed === 0)       verdict = 'pass';
  else                        verdict = 'review';

  return { text, found, checks, verdict };
}

/* Reads an uploaded file end to end. Returns the shrunken image
   alongside the verdict so a caller can store both together. */
async function readGcashProof(file, expected = {}, onProgress){
  const img = await shrinkProof(file);

  let rawText = '';
  try {
    const T = await loadTesseract();
    const { data } = await T.recognize(img, 'eng', {
      logger: m => {
        if(onProgress && m.status === 'recognizing text') onProgress(m.progress || 0);
      }
    });
    rawText = data.text || '';
  } catch(err){
    /* Offline, blocked CDN, or an image it cannot decode. The upload
       still stands — it just goes to the admin unread rather than
       being refused, because a customer who has genuinely paid should
       not be blocked by our reader failing. */
    console.warn('receipt reading failed:', err);
    return {
      img,
      verdict: 'unread',
      text: '',
      found: {},
      checks: [{ ok: false, label: 'Could not read the receipt',
                 detail: 'The image will be checked by hand' }]
    };
  }

  return { img, ...judgeGcashProof(rawText, expected) };
}

const GCASH_VERDICT_LABEL = {
  pass:   'Checks passed',
  review: 'Needs a look',
  fail:   'Does not match',
  unread: 'Could not be read'
};
