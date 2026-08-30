/* ── login.js — Supabase Auth ───────────────────────────────── */

/* ── HELPERS ── */
function showMsg(text) {
  const msg = document.getElementById('msg');
  msg.innerText = text;
  msg.classList.add('show');
  setTimeout(() => msg.classList.remove('show'), 2500);
}

function showPanel(id) {
  ['panel-main', 'panel-otp'].forEach(p => {
    const el = document.getElementById(p);
    if (el) el.classList.add('hidden');
  });
  document.getElementById(id).classList.remove('hidden');

  if (id === 'panel-otp') {
    otpBoxes()[0]?.focus();
  } else {
    clearOtp();
  }
}

/* Load Supabase profile and cache it in localStorage for other pages */
async function storeSession(supaUser) {
  const { data: row } = await _supa
    .from('profiles')
    .select('data')
    .eq('id', supaUser.id)
    .single();

  const profile = row?.data || {};
  const loggedInUser = {
    email:     supaUser.email,
    fname:     profile.fname || '',
    lname:     profile.lname || '',
    phone:     profile.phone || '',
    addresses: profile.addresses || []
  };

  localStorage.setItem('loggedIn', 'true');
  localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
}

/* ── OTP LOGIN (main panel in login.html) ── */

function flashError(el, text, ms = 3000) {
  el.textContent = text;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), ms);
}

function sendEmailOtp(email) {
  return _supa.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
}

async function goToPassword() {
  const email = document.getElementById('email').value.trim();
  const errEl = document.getElementById('email-error');

  if (!email) return flashError(errEl, 'Please enter your email address');

  // Show OTP panel immediately
  document.getElementById('email-display').textContent = email;
  showPanel('panel-otp');

  const { error } = await sendEmailOtp(email);

  if (error) {
    showPanel('panel-main');
    flashError(errEl, error.message.includes('not found') || error.message.includes('registered')
      ? 'No account found. Please register first.'
      : 'Failed to send code. Try again.', 4000);
  }
}

async function resendOTP() {
  const email = document.getElementById('email').value.trim();
  const btn   = document.getElementById('resend-btn');

  btn.style.pointerEvents = 'none';
  btn.textContent = 'Sending...';

  const { error } = await sendEmailOtp(email);

  if (!error) {
    btn.textContent = 'Sent!';
    setTimeout(() => { btn.textContent = 'Resend code'; btn.style.pointerEvents = ''; }, 30000);
  } else {
    btn.textContent = 'Resend code';
    btn.style.pointerEvents = '';
    flashError(document.getElementById('otp-error'), 'Failed to resend. Try again.');
  }
}

/* The boxes auto-submit once full, so guard against Enter or the Submit
   button firing a second verify while the first is still in flight. */
let _otpSubmitting = false;

async function submitOTP() {
  const email = document.getElementById('email').value.trim();
  const otp   = otpValue();
  const errEl = document.getElementById('otp-error');

  if (_otpSubmitting) return;
  if (otp.length < 6) return flashError(errEl, 'Enter the 6-digit code');

  _otpSubmitting = true;
  const { data, error } = await _supa.auth.verifyOtp({ email, token: otp, type: 'email' });
  _otpSubmitting = false;

  if (error) {
    clearOtp();
    otpBoxes()[0]?.focus();
    return flashError(errEl, 'Incorrect code. Please try again.');
  }

  await storeSession(data.user);
  showMsg('Login successful');
  setTimeout(() => { window.location.href = 'homepage.html'; }, 1200);
}

/* ── PASSWORD STRENGTH (register.html) ── */
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

function updatePasswordUI() {
  const pw    = document.getElementById('password').value;
  const cf    = document.getElementById('confirm').value;
  const meter = document.getElementById('pw-meter');

  meter.classList.toggle('hidden', pw === '');

  let passed = 0;
  PW_RULES.forEach(r => {
    const ok = r.test(pw);
    if (ok) passed++;
    const li = meter.querySelector(`[data-rule="${r.id}"]`);
    li.classList.toggle('ok', ok);
    li.querySelector('i').className = ok ? 'bx bx-check' : 'bx bx-circle';
  });

  const level = PW_LEVELS[passed];
  meter.dataset.level = level;
  meter.querySelectorAll('.pw-bar span').forEach((seg, i) => seg.classList.toggle('on', i < passed));
  document.getElementById('pw-label').textContent = PW_LABELS[level];

  const matchEl = document.getElementById('pw-match');
  matchEl.classList.toggle('hidden', cf === '');
  if (cf === '') return;

  const same = pw === cf;
  matchEl.classList.toggle('ok', same);
  matchEl.classList.toggle('bad', !same);
  matchEl.innerHTML = same
    ? "<i class='bx bx-check'></i>Passwords match"
    : "<i class='bx bx-x'></i>Passwords do not match";
}

/* ── REGISTER (register.html) ── */
async function register() {
  const fname    = document.getElementById('fname').value.trim();
  const lname    = document.getElementById('lname').value.trim();
  const email    = document.getElementById('email').value.trim();
  const phone    = document.getElementById('phone').value.trim();
  const password = document.getElementById('password').value;
  const confirm  = document.getElementById('confirm').value;

  if (!fname || !lname || !email || !phone || !password || !confirm) { showMsg('Fill all fields'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showMsg('Invalid email format'); return; }
  if (!/^9\d{9}$/.test(phone)) { showMsg('Invalid phone number (e.g. 9XXXXXXXXX)'); return; }

  const unmet = unmetPasswordRules(password);
  if (unmet.length) { showMsg(`Password needs: ${unmet[0].label.toLowerCase()}`); return; }
  if (password !== confirm) { showMsg('Passwords do not match'); return; }

  const { data, error } = await _supa.auth.signUp({ email, password });

  if (error) {
    showMsg(error.message.includes('already registered')
      ? 'Email already registered'
      : error.message);
    return;
  }

  await _supa.from('profiles').upsert({
    id:   data.user.id,
    data: { fname, lname, phone, addresses: [] }
  });

  showMsg('Account created! Check your email to verify, then sign in.');
  setTimeout(() => { window.location.href = 'login.html'; }, 2000);
}

/* ── NAVIGATION ── */
function goToRegister()  { window.location.href = '../pages/register.html'; }
function goToLogin()     { window.location.href = '../pages/login.html'; }
function forgotPassword(){ showMsg('Redirecting...'); setTimeout(() => { window.location.href = '../pages/forgot.html'; }, 800); }
function goBack()        { window.location.href = '../pages/homepage.html'; }

/* ── KEYBOARD SUPPORT ── */
document.addEventListener('DOMContentLoaded', () => {
  /* Only the login page has the OTP flow — register.html also has an #email
     input, and goToPassword() would blow up on its missing elements. */
  if (document.getElementById('panel-otp')) {
    document.getElementById('email')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') goToPassword();
    });
  }

  const pwInput = document.getElementById('password');
  const cfInput = document.getElementById('confirm');
  if (pwInput && cfInput) {
    document.getElementById('pw-reqs').innerHTML = PW_RULES
      .map(r => `<li class="pw-req" data-rule="${r.id}"><i class='bx bx-circle'></i>${r.label}</li>`)
      .join('');

    pwInput.addEventListener('input', updatePasswordUI);
    cfInput.addEventListener('input', updatePasswordUI);
    cfInput.addEventListener('keydown', e => { if (e.key === 'Enter') register(); });
  }

  const phoneInput = document.getElementById('phone');
  if (phoneInput) {
    /* #phone only lives on register.html now */
    phoneInput.addEventListener('keydown', e => { if (e.key === 'Enter') register(); });
    phoneInput.addEventListener('keypress', function(e) {
      if (!/[0-9]/.test(e.key)) e.preventDefault();
      if (this.value.length >= 10) e.preventDefault();
    });
    phoneInput.addEventListener('input', function() {
      this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
    });
    phoneInput.addEventListener('paste', function(e) {
      const paste = (e.clipboardData || window.clipboardData).getData('text');
      if (!/^[0-9]+$/.test(paste)) e.preventDefault();
    });
  }

  initOtpBoxes();
});

/* ── OTP BOXES ── */
function otpBoxes() {
  return Array.from(document.querySelectorAll('#otp-inputs .otp-box'));
}

function otpValue() {
  return otpBoxes().map(b => b.value).join('');
}

function clearOtp() {
  otpBoxes().forEach(b => { b.value = ''; b.classList.remove('filled'); });
}

/* Spread a string of digits across the boxes from `start`, then park the
   caret on the last one filled. */
function fillOtpFrom(start, digits) {
  const boxes = otpBoxes();
  digits.split('').forEach((d, i) => {
    const box = boxes[start + i];
    if (box) { box.value = d; box.classList.add('filled'); }
  });
  const last = Math.min(start + digits.length, boxes.length - 1);
  boxes[last].focus();
  boxes[last].select();
}

function initOtpBoxes() {
  const boxes = otpBoxes();
  if (!boxes.length) return;

  boxes.forEach((box, i) => {
    box.addEventListener('input', () => {
      const digits = box.value.replace(/\D/g, '');
      box.value = '';
      box.classList.remove('filled');
      if (!digits) return;

      /* A phone keyboard's autofill can drop the whole code into one box */
      fillOtpFrom(i, digits);

      if (otpValue().length === boxes.length) submitOTP();
    });

    box.addEventListener('keydown', e => {
      if (e.key === 'Enter') { submitOTP(); return; }

      if (e.key === 'Backspace' && !box.value && i > 0) {
        e.preventDefault();
        boxes[i - 1].value = '';
        boxes[i - 1].classList.remove('filled');
        boxes[i - 1].focus();
        return;
      }
      if (e.key === 'ArrowLeft'  && i > 0)               boxes[i - 1].focus();
      if (e.key === 'ArrowRight' && i < boxes.length - 1) boxes[i + 1].focus();
    });

    box.addEventListener('paste', e => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text');
      const digits = text.replace(/\D/g, '').slice(0, boxes.length - i);
      if (!digits) return;

      fillOtpFrom(i, digits);
      if (otpValue().length === boxes.length) submitOTP();
    });

    box.addEventListener('focus', () => box.select());
  });
}
