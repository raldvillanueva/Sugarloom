/* ── forgot.js — Supabase Auth password reset ─────────────────
   Flow:
     Step 1  Enter email → Supabase sends 6-digit OTP
     Step 2  Enter OTP   → verify and sign in temporarily
     Step 3  Enter new password → updateUser
   ──────────────────────────────────────────────────────────── */

let _fpEmail = '';

function showMsg(text, type = 'error') {
  const msg = document.getElementById('msg');
  msg.innerText = text;
  msg.className = 'msg show ' + type;
  setTimeout(() => msg.classList.remove('show'), 2500);
}

/* STEP 1 — send OTP */
async function sendOTP() {
  const email = document.getElementById('email').value.trim();
  if (!email) { showMsg('Enter email first'); return; }

  const btn = document.querySelector('#step1 button');
  if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }

  const { error } = await _supa.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false }
  });

  if (btn) { btn.disabled = false; btn.textContent = 'Send OTP'; }

  if (error) {
    showMsg(
      error.message.includes('not found') || error.message.includes('registered')
        ? 'No account found for this email'
        : 'Failed to send OTP. Try again.'
    );
    return false;
  }

  _fpEmail = email;
  showMsg('OTP sent to your email', 'success');
  const label = document.getElementById('otp-sent-to');
  if (label) label.textContent = email;
  document.getElementById('step1').classList.add('hidden');
  document.getElementById('step2').classList.remove('hidden');
  document.getElementById('otp')?.focus();
  return true;
}

/* Arriving from "Forgot your password?" — the email was already typed on
   the sign-in page, so send the code straight away and go to the code
   step. If it fails, fall back to step 1 with the address filled in so
   it can be corrected rather than retyped. */
document.addEventListener('DOMContentLoaded', async () => {
  const carried = sessionStorage.getItem('sl_reset_email');
  if (!carried) return;
  sessionStorage.removeItem('sl_reset_email');

  const emailEl = document.getElementById('email');
  if (emailEl) emailEl.value = carried;

  const step1 = document.getElementById('step1');
  if (step1) step1.classList.add('hidden');

  const sending = document.getElementById('auto-sending');
  if (sending) sending.classList.remove('hidden');

  const ok = await sendOTP();

  if (sending) sending.classList.add('hidden');
  if (!ok && step1) step1.classList.remove('hidden');
});

/* Re-send to the address we already have, without going back a step. */
async function resendResetOTP() {
  const email = _fpEmail || document.getElementById('email').value.trim();
  if (!email) { showMsg('Enter your email first'); return; }

  const { error } = await _supa.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false }
  });

  showMsg(error ? 'Could not resend. Try again.' : 'New code sent', error ? 'error' : 'success');
}

/* STEP 2 — verify OTP */
async function verifyOTP() {
  const otp = document.getElementById('otp').value.trim();
  if (!otp) { showMsg('Enter OTP'); return; }

  const { error } = await _supa.auth.verifyOtp({
    email: _fpEmail,
    token: otp,
    type:  'email'
  });

  if (error) { showMsg('Invalid OTP'); return; }

  showMsg('OTP verified', 'success');
  document.getElementById('step2').classList.add('hidden');
  document.getElementById('step3').classList.remove('hidden');
}

/* STEP 3 — set new password */
async function resetPassword() {
  const newpass = document.getElementById('newpass').value;
  const confirm = document.getElementById('confirmpass').value;

  if (!newpass || newpass.length < 6) { showMsg('Password must be at least 6 characters'); return; }
  if (newpass !== confirm) { showMsg('Passwords do not match'); return; }

  const { error } = await _supa.auth.updateUser({ password: newpass });

  if (error) { showMsg('Failed to update password. Try again.'); return; }

  showMsg('Password updated!', 'success');
  await _supa.auth.signOut();
  setTimeout(() => { window.location.href = 'login.html'; }, 1500);
}

function goToLogin() { window.location.href = 'login.html'; }
