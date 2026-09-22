/* ── inquiry.js — contact form + toast ───────────────────────────
   Shared by homepage.html and products.html. Both pages carry the same
   "Send us a quick message" form, but sendInquiry() and showToast() used
   to live only in homepage.js — so on the products page the Send Message
   button threw a ReferenceError and did nothing at all. */

function showToast(message, type = "success") {
  let toast = document.getElementById("site-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "site-toast";
    document.body.appendChild(toast);
  }

  toast.className = "site-toast " + type;
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}

/* CONTACT INQUIRY
   Saves the message to the inquiries table, where it shows up under
   Admin → Messages. It used to only clear the form and claim the message
   had been sent, while discarding it. */
async function sendInquiry() {
  const nameEl    = document.getElementById("inq-name");
  const contactEl = document.getElementById("inq-contact");
  const msgEl     = document.getElementById("inq-msg");
  const btn       = document.querySelector(".inquiry-btn");

  const name    = nameEl.value.trim();
  const contact = contactEl.value.trim();
  const message = msgEl.value.trim();

  if (!name || !contact || !message) {
    showToast("Please fill in all fields before sending.", "error");
    return;
  }

  const original = btn ? btn.textContent : "";
  if (btn) { btn.disabled = true; btn.textContent = "Sending..."; }

  try {
    const { error } = await _supa.from("inquiries").insert({
      id:   "INQ-" + Date.now(),
      date: new Date().toISOString(),
      data: { name, contact, message, handled: false }
    });
    if (error) throw error;

    nameEl.value = "";
    contactEl.value = "";
    msgEl.value = "";
    showToast("Message sent! We'll get back to you within 24 hours 🍪", "success");
  } catch (err) {
    console.error("inquiry failed:", err);
    showToast("Couldn't send your message. Please email sugarloomph@gmail.com.", "error");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = original; }
  }
}
