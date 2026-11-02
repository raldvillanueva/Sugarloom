/* ── api/send-order-notification.js — order emails, on Vercel ─────
   A Vercel serverless function, served at /api/send-order-notification
   on the same origin as the site.

   Why here rather than on the Express server: Render's free instances
   block outbound traffic to the SMTP ports (25, 465, 587), so mail
   cannot leave that host at all, whatever the credentials. Vercel
   blocks only port 25, so Gmail on 465 is reachable from a function.
   js/server.js keeps the chatbot, the admin OTP and Lalamove.

   Same origin also means no CORS and no address to configure — the
   admin panel posts to a relative path.

   Credentials come from the environment only: set EMAIL_USER and
   EMAIL_PASS in the Vercel project settings. EMAIL_PASS is a Google
   App Password, not the account password. */

const nodemailer = require("nodemailer");
const { buildOrderEmail } = require("../PRACTICENIMOJOSACAP/js/order-email.js");

const MAIL_READY = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

/* Built once per warm instance rather than per request, so a burst of
   status changes reuses the connection instead of renegotiating TLS
   each time. */
let transporter = null;
function mailer() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host:   "smtp.gmail.com",
      port:   465,
      secure: true,
      family: 4,          // Gmail resolves to IPv6 first; not every host routes it
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
  }
  return transporter;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Use POST" });
  }

  /* Vercel parses a JSON body for us, but a stringified one still
     arrives from some clients. */
  let body = req.body || {};
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const { to_email, order_id } = body;
  if (!to_email || !order_id) {
    return res.status(400).json({ success: false, error: "Missing fields" });
  }
  if (!MAIL_READY) {
    /* Say so at once rather than letting the caller wait out a
       connection timeout to learn nothing. */
    return res.status(503).json({ success: false, error: "EMAIL_USER / EMAIL_PASS are not set" });
  }

  const { subject, html } = buildOrderEmail(body);

  try {
    /* Awaited deliberately: a serverless function is frozen the moment
       it responds, so a send left running in the background is simply
       dropped. */
    await mailer().sendMail({
      from: `"SugarLoomPh" <${process.env.EMAIL_USER}>`,
      to:   to_email,
      subject,
      html
    });
    console.log(`order email sent to ${to_email} [${order_id} -> ${body.status}]`);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("order email failed:", err.message);
    return res.status(502).json({ success: false, error: err.message });
  }
};
