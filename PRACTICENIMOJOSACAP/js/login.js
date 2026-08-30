/* ── login.js — Supabase Auth ───────────────────────────────── */

/* ── HELPERS ── */
function showMsg(text) {
  const msg = document.getElementById('msg');
  msg.innerText = text;
  msg.classList.add('show');
  setTimeout(() => msg.classList.remove('show'), 2500);
}

function showPanel(id) {
  ['panel-main', 'panel-phone', 'panel-otp'].forEach(p => {
    const el = document.getElementById(p);
    if (el) el.classList.add('hidden');
  });
  document.getElementById(id).classList.remove('hidden');
  if (id !== 'panel-otp') {
    const otpInput = document.getElementById('otp-code');
    if (otpInput) otpInput.value = '';
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

/* Which channel the pending code went out on, so resend and verify both
   use the same one. Set by goToPassword() / loginWithPhone(). */
let _otpTarget = null;   // { channel: 'email' | 'sms', value }

function flashError(el, text, ms = 3000) {
  el.textContent = text;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), ms);
}

function sendOtpTo(target) {
  const opts = { options: { shouldCreateUser: false } };
  return target.channel === 'sms'
    ? _supa.auth.signInWithOtp({ phone: target.value, ...opts })
    : _supa.auth.signInWithOtp({ email: target.value, ...opts });
}

async function goToPassword() {
  const email = document.getElementById('email').value.trim();
  const errEl = document.getElementById('email-error');

  if (!email) return flashError(errEl, 'Please enter your email address');

  _otpTarget = { channel: 'email', value: email };

  // Show OTP panel immediately
  document.getElementById('email-display').textContent = email;
  showPanel('panel-otp');

  const { error } = await sendOtpTo(_otpTarget);

  if (error) {
    showPanel('panel-main');
    flashError(errEl, error.message.includes('not found') || error.message.includes('registered')
      ? 'No account found. Please register first.'
      : 'Failed to send code. Try again.', 4000);
  }
}

/* ── PHONE OTP LOGIN ──
   Requires an SMS provider configured in Supabase (Auth → Providers →
   Phone). Without one, signInWithOtp({ phone }) fails and we say so
   rather than leaving the user on a spinner. */
async function loginWithPhone() {
  const phone = document.getElementById('phone').value.trim();
  const errEl = document.getElementById('phone-error');

  if (!/^9\d{9}$/.test(phone)) {
    return flashError(errEl, 'Enter a valid mobile number (9XXXXXXXXX)');
  }

  _otpTarget = { channel: 'sms', value: '+63' + phone };

  document.getElementById('email-display').textContent = '+63 ' + phone;
  showPanel('panel-otp');

  const { error } = await sendOtpTo(_otpTarget);

  if (error) {
    showPanel('panel-phone');
    flashError(errEl, phoneOtpError(error), 5000);
  }
}

function phoneOtpError(error) {
  const m = (error.message || '').toLowerCase();
  if (m.includes('not found') || m.includes('registered')) {
    return 'No account uses this number yet. Sign in with email to link it.';
  }
  if (m.includes('sms') || m.includes('provider') || m.includes('disabled') || m.includes('unsupported')) {
    return 'SMS sign-in is not available yet. Please use email.';
  }
  return 'Failed to send code. Try again.';
}

async function resendOTP() {
  const btn = document.getElementById('resend-btn');
  if (!_otpTarget) return;

  btn.style.pointerEvents = 'none';
  btn.textContent = 'Sending...';

  const { error } = await sendOtpTo(_otpTarget);

  if (!error) {
    btn.textContent = 'Sent!';
    setTimeout(() => { btn.textContent = 'Resend code'; btn.style.pointerEvents = ''; }, 30000);
  } else {
    btn.textContent = 'Resend code';
    btn.style.pointerEvents = '';
    flashError(document.getElementById('otp-error'), 'Failed to resend. Try again.');
  }
}

async function submitOTP() {
  const otp   = document.getElementById('otp-code').value.trim();
  const errEl = document.getElementById('otp-error');

  if (!otp || otp.length < 6) return flashError(errEl, 'Enter the 6-digit code');
  if (!_otpTarget) return flashError(errEl, 'Request a new code first');

  const { data, error } = _otpTarget.channel === 'sms'
    ? await _supa.auth.verifyOtp({ phone: _otpTarget.value, token: otp, type: 'sms' })
    : await _supa.auth.verifyOtp({ email: _otpTarget.value, token: otp, type: 'email' });

  if (error) return flashError(errEl, 'Incorrect code. Please try again.');

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
    /* Both pages have a #phone input now, so Enter means different things */
    phoneInput.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      if (document.getElementById('phone-error')) loginWithPhone();
      else if (document.getElementById('confirm')) register();
    });
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

  const otpInput = document.getElementById('otp-code');
  if (otpInput) {
    otpInput.addEventListener('input', () => {
      otpInput.value = otpInput.value.replace(/\D/g, '').slice(0, 6);
    });
    otpInput.addEventListener('keydown', e => { if (e.key === 'Enter') submitOTP(); });
  }
});
