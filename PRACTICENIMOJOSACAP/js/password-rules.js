/* ── password-rules.js — one password policy ────────────────────
   Shared by registration and password reset, so a reset can't set a
   password that signing up would have rejected. Reset used to ask for
   six characters and nothing else, quietly undercutting the rules on
   the sign-up form.

   Markup the meter expects, with the ids passed to setupPasswordMeter:

     <div class="pw-meter hidden" id="…">
       <div class="pw-bar"><span>×6</span></div>
       <p class="pw-label" id="…"></p>
       <ul class="pw-reqs" id="…"></ul>
     </div>
     <p class="pw-match hidden" id="…"></p>                           */

const PW_RULES = [
  { id: 'len',   label: 'At least 8 characters',  test: v => v.length >= 8 },
  { id: 'upper', label: 'One uppercase letter',   test: v => /[A-Z]/.test(v) },
  { id: 'lower', label: 'One lowercase letter',   test: v => /[a-z]/.test(v) },
  { id: 'num',   label: 'One number',             test: v => /[0-9]/.test(v) },
  { id: 'sym',   label: 'One special character',  test: v => /[^A-Za-z0-9]/.test(v) }
];

const PW_LEVELS = ['weak', 'weak', 'weak', 'fair', 'good', 'strong'];
const PW_LABELS = { weak: 'Weak password', fair: 'Fair password', good: 'Good password', strong: 'Strong password' };

function unmetPasswordRules(pw) {
  return PW_RULES.filter(r => !r.test(pw));
}

/* Fills the checklist and wires the live feedback. Returns a refresh
   function, or null when the markup isn't on the page. */
function setupPasswordMeter({ passwordId, confirmId, meterId, labelId, reqsId, matchId }) {
  const pwEl    = document.getElementById(passwordId);
  const cfEl    = document.getElementById(confirmId);
  const meter   = document.getElementById(meterId);
  const labelEl = document.getElementById(labelId);
  const reqsEl  = document.getElementById(reqsId);
  const matchEl = document.getElementById(matchId);
  if (!pwEl || !cfEl || !meter || !reqsEl) return null;

  reqsEl.innerHTML = PW_RULES
    .map(r => `<li class="pw-req" data-rule="${r.id}"><i class='bx bx-circle'></i>${r.label}</li>`)
    .join('');

  function refresh() {
    const pw = pwEl.value;
    const cf = cfEl.value;

    meter.classList.toggle('hidden', pw === '');

    let passed = 0;
    PW_RULES.forEach(r => {
      const ok = r.test(pw);
      if (ok) passed++;
      const li = meter.querySelector(`[data-rule="${r.id}"]`);
      if (!li) return;
      li.classList.toggle('ok', ok);
      li.querySelector('i').className = ok ? 'bx bx-check' : 'bx bx-circle';
    });

    const level = PW_LEVELS[passed];
    meter.dataset.level = level;
    meter.querySelectorAll('.pw-bar span').forEach((seg, i) => seg.classList.toggle('on', i < passed));
    if (labelEl) labelEl.textContent = PW_LABELS[level];

    if (!matchEl) return;
    matchEl.classList.toggle('hidden', cf === '');
    if (cf === '') return;

    const same = pw === cf;
    matchEl.classList.toggle('ok', same);
    matchEl.classList.toggle('bad', !same);
    matchEl.innerHTML = same
      ? "<i class='bx bx-check'></i>Passwords match"
      : "<i class='bx bx-x'></i>Passwords do not match";
  }

  pwEl.addEventListener('input', refresh);
  cfEl.addEventListener('input', refresh);
  refresh();
  return refresh;
}
