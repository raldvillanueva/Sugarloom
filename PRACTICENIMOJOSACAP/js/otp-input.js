/* ── otp-input.js — one box per digit ───────────────────────────
   Shared by the sign-in page and the password reset page, which both
   ask for a six-digit emailed code.

   Typing advances, Backspace on an empty box steps back and clears,
   arrows move between boxes, and pasting or autofilling a code spreads
   it across the boxes from wherever the caret is — a phone keyboard
   drops the whole code into a single box, so that case matters.

   Markup expected:
     <div class="otp-inputs" id="whatever">
       <input class="otp-box" maxlength="1"> … six of them
     </div> */

function otpBoxesIn(containerId) {
  return Array.from(document.querySelectorAll(`#${containerId} .otp-box`));
}

function otpBoxValue(containerId) {
  return otpBoxesIn(containerId).map(b => b.value).join('');
}

function clearOtpBoxes(containerId) {
  otpBoxesIn(containerId).forEach(b => { b.value = ''; b.classList.remove('filled'); });
}

function focusFirstOtpBox(containerId) {
  otpBoxesIn(containerId)[0]?.focus();
}

/* Spread a run of digits across the boxes from `start`, then park the
   caret on the last one filled. */
function fillOtpFrom(containerId, start, digits) {
  const boxes = otpBoxesIn(containerId);
  digits.split('').forEach((d, i) => {
    const box = boxes[start + i];
    if (box) { box.value = d; box.classList.add('filled'); }
  });
  const last = Math.min(start + digits.length, boxes.length - 1);
  boxes[last].focus();
  boxes[last].select();
}

/* onComplete fires once every box is filled. */
function setupOtpBoxes(containerId, { onComplete } = {}) {
  const boxes = otpBoxesIn(containerId);
  if (!boxes.length) return;

  const complete = () => {
    if (otpBoxValue(containerId).length === boxes.length && onComplete) onComplete();
  };

  boxes.forEach((box, i) => {
    box.addEventListener('input', () => {
      const digits = box.value.replace(/\D/g, '');
      box.value = '';
      box.classList.remove('filled');
      if (!digits) return;
      fillOtpFrom(containerId, i, digits);
      complete();
    });

    box.addEventListener('keydown', e => {
      if (e.key === 'Enter') { if (onComplete) onComplete(); return; }

      if (e.key === 'Backspace' && !box.value && i > 0) {
        e.preventDefault();
        boxes[i - 1].value = '';
        boxes[i - 1].classList.remove('filled');
        boxes[i - 1].focus();
        return;
      }
      if (e.key === 'ArrowLeft'  && i > 0)                boxes[i - 1].focus();
      if (e.key === 'ArrowRight' && i < boxes.length - 1) boxes[i + 1].focus();
    });

    box.addEventListener('paste', e => {
      e.preventDefault();
      const text   = (e.clipboardData || window.clipboardData).getData('text');
      const digits = text.replace(/\D/g, '').slice(0, boxes.length - i);
      if (!digits) return;
      fillOtpFrom(containerId, i, digits);
      complete();
    });

    box.addEventListener('focus', () => box.select());
  });
}
