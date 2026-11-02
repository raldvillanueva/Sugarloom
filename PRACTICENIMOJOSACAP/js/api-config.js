/* ── api-config.js — where the backend lives ─────────────────────
   js/server.js handles order emails, the admin forgot-password OTP, and
   the AI chatbot. Every call to it goes through apiUrl() so there is one
   place to point at, instead of a localhost address hardcoded in four
   files.

   ▶ AFTER YOU HOST THE SERVER, paste its address into HOSTED_API below.
     Nothing else needs changing.

   Until then the front end calls the server only when the page itself is
   open on localhost. On the deployed site apiUrl() returns null and
   callers fall back: the chatbot answers from its built-in replies and
   email sending is skipped. That is deliberate — an https page is not
   permitted to call http://localhost, so trying would fail anyway, just
   noisily. */

const HOSTED_API = 'https://sugarloom-api-d375.onrender.com';   // no trailing slash

const LOCAL_API  = 'http://localhost:5000';
const IS_LOCAL   = ['localhost', '127.0.0.1', ''].includes(location.hostname);

const API_BASE = HOSTED_API || (IS_LOCAL ? LOCAL_API : '');

/* Returns a full URL, or null when no backend is reachable from here. */
function apiUrl(path) {
  return API_BASE ? API_BASE + path : null;
}

/* Order emails do NOT go to the server above. Render's free instances
   block outbound traffic to the SMTP ports, so mail cannot leave that
   host however it is configured; the send lives in a Vercel function
   instead, on this same origin — see api/send-order-notification.js.
   Same origin means a relative path, no CORS and nothing to configure.
   Running locally there is no function, so fall back to the Express
   server, which can reach Gmail from a developer machine. */
function mailUrl() {
  return IS_LOCAL ? apiUrl('/send-order-notification') : '/api/send-order-notification';
}

function apiAvailable() {
  return Boolean(API_BASE);
}
