/* ── forgot.js — Supabase Auth password reset ─────────────────
   Flow:
     Step 1  Enter email → Supabase sends a 6-digit code
     Step 2  Enter code  → verify, which signs in temporarily
     Step 3  Set a new password → updateUser

   Arriving from "Forgot your password?" on the sign-in page skips
   step 1: the email comes across in sessionStorage and the code is
   sent on load.

   The password rules are the ones in js/password-rules.js, the same
   ones registration enforces — a reset must not be able to set a
   password that signing up would have rejected.
   ──────────────────────────────────────────────────────────── */

let _fpEmail = '';
const FP_OTP = 'fp-otp-inputs';

function showMsg(text, type = 'error') {
  const msg = document.getElementById('msg');
  msg.innerText = text;
  msg.className = 'msg show ' + type;
  setTimeout(() => msg.classList.remove('show'), 2500);
}

function flashFieldError(id, text, ms = 4000) {
  const el = document.getElementById(id);
  if (!el) return showMsg(text);
  el.textContent = text;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), ms);
}

function showStep(id) {
  ['step1', 'auto-sending', 'step2', 'step3'].forEach(s => {
    document.getElementById(s)?.classList.toggle('hidden', s !== id);
  });
}

/* STEP 1 — send the code */
async function sendOTP() {
  const email = document.getElementById('email').value.trim();
  if (!email) { flashFieldError('email-error', 'Enter your email address'); return false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    flashFieldError('email-error', 'Enter a valid email address');
    return false;
  }

  const btn = document.getElementById('send-otp-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }

  const { error } = await _supa.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false }
  });

  if (btn) { btn.disabled = false; btn.textContent = 'Send code'; }

  if (error) {
    flashFieldError('email-error',
      error.message.includes('not found') || error.message.includes('registered')
        ? 'No account found for this email'
        : 'Could not send the code. Try again.');
    return false;
  }

  _fpEmail = email;
  document.getElementById('otp-sent-to').textContent = email;
  showStep('step2');
  focusFirstOtpBox(FP_OTP);
  return true;
}

/* Re-send to the address we already have, without going back a step. */
async function resendResetOTP() {
  const email = _fpEmail || document.getElementById('email').value.trim();
  if (!email) { showMsg('Enter your email first'); return; }

  const btn = document.getElementById('fp-resend-btn');
  if (btn) { btn.style.pointerEvents = 'none'; btn.textContent = 'Sending...'; }

  const { error } = await _supa.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false }
  });

  if (btn) {
    btn.textContent = error ? 'Send again' : 'Sent!';
    if (error) btn.style.pointerEvents = '';
    else setTimeout(() => { btn.textContent = 'Send again'; btn.style.pointerEvents = ''; }, 30000);
  }
  if (error) showMsg('Could not resend. Try again.');
}

/* STEP 2 — verify the code */
let _fpVerifying = false;

async function verifyOTP() {
  const otp = otpBoxValue(FP_OTP);

  if (_fpVerifying) return;                       // the boxes auto-submit when full
  if (otp.length < 6) { flashFieldError('otp-error', 'Enter the 6-digit code'); return; }

  _fpVerifying = true;
  const { error } = await _supa.auth.verifyOtp({
    email: _fpEmail,
    token: otp,
    type:  'email'
  });
  _fpVerifying = false;

  if (error) {
    clearOtpBoxes(FP_OTP);
    focusFirstOtpBox(FP_OTP);
    flashFieldError('otp-error', 'Incorrect code. Please try again.');
    return;
  }

  showStep('step3');
  document.getElementById('newpass').focus();
}

/* STEP 3 — set the new password */
async function resetPassword() {
  const newpass = document.getElementById('newpass').value;
  const confirm = document.getElementById('confirmpass').value;

  const unmet = unmetPasswordRules(newpass);
  if (unmet.length) {
    flashFieldError('pass-error', `Password needs: ${unmet[0].label.toLowerCase()}`);
    return;
  }
  if (newpass !== confirm) {
    flashFieldError('pass-error', 'Passwords do not match');
    return;
  }

  const { error } = await _supa.auth.updateUser({ password: newpass });

  if (error) {
    flashFieldError('pass-error', error.message || 'Could not update the password. Try again.');
    return;
  }

  showMsg('Password updated!', 'success');
  await _supa.auth.signOut();
  setTimeout(() => { window.location.href = 'login.html'; }, 1500);
}

function goToLogin() { window.location.href = 'login.html'; }

document.addEventListener('DOMContentLoaded', async () => {
  setupOtpBoxes(FP_OTP, { onComplete: verifyOTP });
  setupPasswordMeter({
    passwordId: 'newpass', confirmId: 'confirmpass',
    meterId: 'fp-pw-meter', labelId: 'fp-pw-label',
    reqsId: 'fp-pw-reqs', matchId: 'fp-pw-match'
  });

  document.getElementById('email')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendOTP();
  });
  document.getElementById('confirmpass')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') resetPassword();
  });

  /* Arriving from "Forgot your password?" — the email was already typed
     on the sign-in page, so send the code straight away. If that fails,
     fall back to step 1 with the address filled in so it can be
     corrected rather than retyped. */
  const carried = sessionStorage.getItem('sl_reset_email');
  if (!carried) return;
  sessionStorage.removeItem('sl_reset_email');

  document.getElementById('email').value = carried;
  showStep('auto-sending');

  const ok = await sendOTP();
  if (!ok) showStep('step1');
});
