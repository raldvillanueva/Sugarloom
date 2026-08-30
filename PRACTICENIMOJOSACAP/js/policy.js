/* ── SHARED POLICY MODAL ──
   Used by login.html and register.html. The overlay markup is injected on
   first use, so a page only needs this script plus a link that calls
   showPolicy('tos') or showPolicy('privacy'). */

const POLICIES = {
  tos: {
    title: 'Terms of Service',
    content: `
      <p class="policy-updated">Last updated: April 17, 2026</p>

      <h4>1. Acceptance of Terms</h4>
      <p>By accessing or using SugarLoomPh ("we", "our", "us"), you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.</p>

      <h4>2. About SugarLoomPh</h4>
      <p>SugarLoomPh is a home-based bakery specializing in handcrafted cookies, brownies, and cupcakes. All products are made to order and baked fresh.</p>

      <h4>3. Orders & Payments</h4>
      <p>All orders are subject to availability. We accept GCash and Cash on Delivery (COD) as payment methods. COD is limited to orders not exceeding ₱2,000. Orders are confirmed only after payment verification or admin approval.</p>

      <h4>4. Delivery</h4>
      <p>We deliver within Cainta and nearby areas. A delivery fee of ₱50 applies to all orders. Preferred delivery dates are subject to our availability and may be adjusted. We will contact you through your preferred contact method to confirm.</p>

      <h4>5. Cancellations & Refunds</h4>
      <p>Orders may be cancelled before they are confirmed by our team. Once confirmed, cancellations are no longer accepted as products are made to order. Refunds are issued only in cases of wrong or damaged items upon delivery.</p>

      <h4>6. Minimum Order</h4>
      <p>Cookies require a minimum order of 4 pieces per checkout. This ensures freshness and quality in every batch.</p>

      <h4>7. Account Responsibility</h4>
      <p>You are responsible for maintaining the security of your account. SugarLoomPh will never ask for your OTP or password through any channel.</p>

      <h4>8. Changes to Terms</h4>
      <p>We reserve the right to update these Terms at any time. Continued use of the platform after changes constitutes acceptance of the new Terms.</p>

      <h4>9. Contact Us</h4>
      <p>For questions or concerns, reach us at <strong>sugarloomph@gmail.com</strong> or through our website's contact form.</p>
    `
  },
  privacy: {
    title: 'Privacy Policy',
    content: `
      <p class="policy-updated">Last updated: April 17, 2026</p>

      <h4>1. Information We Collect</h4>
      <p>When you use SugarLoomPh, we may collect the following information:</p>
      <ul>
        <li>Name, email address, and phone number</li>
        <li>Delivery address and postal code</li>
        <li>Order history and preferences</li>
        <li>Preferred contact method and delivery date</li>
      </ul>

      <h4>2. How We Use Your Information</h4>
      <p>We use your personal information solely to:</p>
      <ul>
        <li>Process and fulfill your orders</li>
        <li>Contact you about your order status</li>
        <li>Improve our products and services</li>
        <li>Send order confirmations and delivery updates</li>
      </ul>

      <h4>3. Data Storage</h4>
      <p>Your data is stored locally on your browser using localStorage and is never transmitted to third-party servers without your consent. We do not sell or share your personal data with any third parties.</p>

      <h4>4. Cookies</h4>
      <p>SugarLoomPh uses browser localStorage to remember your login session, cart contents, and saved addresses. No tracking cookies are used for advertising purposes.</p>

      <h4>5. OTP & Security</h4>
      <p>We use One-Time Passwords (OTP) sent to your email to verify your identity. These codes expire after a short period and are used only for authentication purposes. We will never ask for your OTP via phone call or text.</p>

      <h4>6. Your Rights</h4>
      <p>You have the right to access, correct, or delete your personal data at any time. You may do so through your account profile settings or by contacting us directly.</p>

      <h4>7. Third-Party Services</h4>
      <p>We use Lalamove for delivery logistics. By placing a delivery order, you consent to sharing your name, phone number, and delivery address with Lalamove for the purpose of completing your delivery.</p>

      <h4>8. Children's Privacy</h4>
      <p>SugarLoomPh is not directed at children under 13. We do not knowingly collect personal information from minors.</p>

      <h4>9. Contact Us</h4>
      <p>For any privacy-related concerns, contact us at <strong>sugarloomph@gmail.com</strong>.</p>
    `
  }
};

function buildPolicyModal() {
  const overlay = document.createElement('div');
  overlay.id = 'policy-overlay';
  overlay.className = 'policy-overlay hidden';
  overlay.innerHTML = `
  <div class="policy-card">
    <div class="policy-header">
      <h3 id="policy-title"></h3>
      <button class="policy-close" onclick="closePolicy()"><i class='bx bx-x'></i></button>
    </div>
    <div class="policy-body" id="policy-body"></div>
    <div class="policy-footer">
      <button class="btn-continue" onclick="closePolicy()">I Understand</button>
    </div>
  </div>`;
  overlay.onclick = e => { if (e.target === overlay) closePolicy(); };
  document.body.appendChild(overlay);
  return overlay;
}

function showPolicy(type) {
  const p = POLICIES[type];
  if (!p) return;
  const overlay = document.getElementById('policy-overlay') || buildPolicyModal();
  document.getElementById('policy-title').textContent = p.title;
  document.getElementById('policy-body').innerHTML = p.content;
  overlay.classList.remove('hidden');
}

function closePolicy() {
  const overlay = document.getElementById('policy-overlay');
  if (overlay) overlay.classList.add('hidden');
}
