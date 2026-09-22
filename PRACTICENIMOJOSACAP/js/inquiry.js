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

   NOTE: this only validates and clears the form. The message is not
   delivered anywhere — there is no inbox behind it yet. */
function sendInquiry() {
  const name    = document.getElementById("inq-name").value.trim();
  const contact = document.getElementById("inq-contact").value.trim();
  const msg     = document.getElementById("inq-msg").value.trim();

  if (!name || !contact || !msg) {
    showToast("Please fill in all fields before sending.", "error");
    return;
  }

  document.getElementById("inq-name").value = "";
  document.getElementById("inq-contact").value = "";
  document.getElementById("inq-msg").value = "";
  showToast("Message sent! We'll get back to you within 24 hours 🍪", "success");
}
