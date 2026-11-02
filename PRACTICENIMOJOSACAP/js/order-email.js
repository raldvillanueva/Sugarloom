/* ── order-email.js — the order status email, in one place ───────
   Required by js/server.js (the Express app) and by the Vercel
   function in api/send-order-notification.js, so the two cannot drift
   into sending different-looking mail.

   This module builds the message. It does not send it: the caller
   owns the transport, because the two hosts reach a mail server by
   different routes. */

/* The name and the item names come from whatever the customer typed
   at checkout and land in an HTML document, so they are escaped. An
   apostrophe is escaped too — the admin panel's escHTML() leaves it,
   which is safe there but not worth relying on here. */
function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function peso(n) {
  return "₱" + Number(n || 0).toLocaleString();
}

/* Returns { subject, html } for one status change. */
function buildOrderEmail({ to_name, order_id, status, status_message, items, order_total, website_url }) {
  const statusText = String(status || "").trim();
  const done       = statusText === "Fulfilled";

  const itemsHtml = (items || []).map(i =>
    `<tr>
      <td style="padding:8px 0;font-size:14px">${esc(i.name)}</td>
      <td style="padding:8px 0;font-size:14px;text-align:center">x${esc(i.qty)}</td>
      <td style="padding:8px 0;font-size:14px;text-align:right">${peso((i.price || 0) * (i.qty || 0))}</td>
    </tr>`
  ).join("");

  const html = `
  <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fafaf8;border-radius:16px;overflow:hidden;border:1px solid #e8e8e0">

    <!-- Header -->
    <div style="background:#1a1a1a;padding:28px 32px;text-align:center">
      <p style="color:#fff;font-size:22px;font-weight:700;margin:0;letter-spacing:1px">🍪 SugarLoomPh</p>
    </div>

    <!-- Body -->
    <div style="padding:32px">
      <p style="font-size:15px;color:#555;margin:0 0 4px">Hi <strong>${esc(to_name || "there")}</strong>,</p>
      <h2 style="font-size:20px;color:#1a1a1a;margin:12px 0">${esc(status_message)}</h2>

      <!-- Order Info -->
      <div style="background:#fff;border:1px solid #e8e8e0;border-radius:12px;padding:20px;margin:20px 0">
        <p style="font-size:12px;color:#999;font-weight:700;letter-spacing:1px;margin:0 0 12px">ORDER DETAILS</p>
        <p style="font-size:13px;color:#777;margin:0 0 12px">Order ID: <strong style="color:#1a1a1a">${esc(order_id)}</strong> &nbsp;|&nbsp; Status: <strong style="color:#1a1a1a">${esc(statusText)}</strong></p>
        <table style="width:100%;border-collapse:collapse;border-top:1px solid #eee">
          <thead>
            <tr>
              <th style="text-align:left;font-size:11px;color:#999;padding:8px 0;font-weight:600">ITEM</th>
              <th style="text-align:center;font-size:11px;color:#999;padding:8px 0;font-weight:600">QTY</th>
              <th style="text-align:right;font-size:11px;color:#999;padding:8px 0;font-weight:600">PRICE</th>
            </tr>
          </thead>
          <tbody style="border-top:1px solid #eee">${itemsHtml}</tbody>
          <tfoot>
            <tr style="border-top:1px solid #eee">
              <td colspan="2" style="padding:12px 0;font-size:14px;font-weight:700;color:#1a1a1a">Total</td>
              <td style="padding:12px 0;font-size:16px;font-weight:700;color:#1a1a1a;text-align:right">${esc(order_total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- CTA -->
      <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 20px">
        ${done
          ? "Thank you for choosing SugarLoomPh! We hope you enjoyed every bite. We&#39;d love to bake for you again — visit our store anytime! 🍪"
          : "Please check the website for further details on your order status and delivery updates."}
      </p>
      <a href="${esc(website_url || "#")}" style="display:inline-block;background:#1a1a1a;color:#fff;padding:13px 28px;border-radius:30px;font-size:14px;font-weight:600;text-decoration:none">
        ${done ? "Visit Store →" : "View Order →"}
      </a>
    </div>

    <!-- Footer -->
    <div style="padding:20px 32px;border-top:1px solid #e8e8e0;text-align:center">
      <p style="font-size:12px;color:#aaa;margin:0">SugarLoomPh &nbsp;·&nbsp; Freshly baked with love 🍪</p>
    </div>

  </div>`;

  return { subject: `Order ${order_id} — ${statusText}`, html };
}

module.exports = { buildOrderEmail, esc };
