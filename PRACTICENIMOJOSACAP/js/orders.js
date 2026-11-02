/* ── Supabase helper: get current logged-in customer ── */
async function getCurrentUser() {
  const cached = JSON.parse(localStorage.getItem('loggedInUser'));
  if (cached) return cached;

  const { data: { session } } = await _supa.auth.getSession();
  if (!session) return null;

  const { data: row } = await _supa.from('profiles').select('data').eq('id', session.user.id).single();
  const profile = row?.data || {};
  const user = { email: session.user.email, fname: profile.fname || '', lname: profile.lname || '', phone: profile.phone || '', addresses: profile.addresses || [] };
  localStorage.setItem('loggedIn', 'true');
  localStorage.setItem('loggedInUser', JSON.stringify(user));
  return user;
}

/* ── Fetch all order tracking from Supabase ── */
async function fetchAllTracking(orderIds) {
  if (!orderIds.length) return {};
  const { data } = await _supa.from('order_tracking').select('order_id, data').in('order_id', orderIds);
  const map = {};
  (data || []).forEach(row => { map[row.order_id] = row.data; });
  return map;
}

function goBack(){ window.location.href = '../pages/homepage.html'; }

/* ── PROFILE ── */
async function loadProfile(){
  const user = await getCurrentUser();
  if (!user) return;

  const fullName = ((user.fname || '') + ' ' + (user.lname || '')).trim();
  document.getElementById('fullName').innerText = fullName || '—';
  document.getElementById('emailText').innerText = user.email || '—';

  if (user.phone) {
    document.getElementById('phoneLabel').style.display = '';
    document.getElementById('phoneText').innerText = user.phone;
  }

  document.getElementById('userEmail').innerText = user.email || 'user@email.com';
  loadAddresses();
}

// TOGGLE EDIT PROFILE
function toggleEditProfile(){
  const viewEl = document.getElementById("profileViewData");
  const editEl = document.getElementById("profileEditForm");
  const isEditing = editEl.style.display !== "none";

  if(isEditing){
    viewEl.style.display = "";
    editEl.style.display = "none";
    document.getElementById("editProfileBtn").innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      Edit`;
  } else {
    const user = JSON.parse(localStorage.getItem("loggedInUser")) || {};
    document.getElementById("fnameInput").value = user.fname || "";
    document.getElementById("lnameInput").value = user.lname || "";
    document.getElementById("emailInput").value = user.email || "";
    document.getElementById("phoneInput").value = user.phone || "";
    viewEl.style.display = "none";
    editEl.style.display = "";
    document.getElementById("editProfileBtn").innerHTML = `Cancel`;
  }
}

async function saveProfile(){
  const { data: { session } } = await _supa.auth.getSession();
  if (!session) return;

  const fname = document.getElementById('fnameInput').value.trim();
  const lname = document.getElementById('lnameInput').value.trim();
  const phone = document.getElementById('phoneInput').value.trim();

  // Fetch current profile to preserve addresses
  const { data: row } = await _supa.from('profiles').select('data').eq('id', session.user.id).single();
  const current = row?.data || {};

  const updated = { ...current, fname, lname, phone };
  await _supa.from('profiles').upsert({ id: session.user.id, data: updated });

  // Refresh localStorage cache
  const user = { email: session.user.email, ...updated };
  localStorage.setItem('loggedInUser', JSON.stringify(user));

  loadProfile();
  toggleEditProfile();
}

// TOGGLE ADDRESS FORM
function toggleAddressForm(){
  const form = document.getElementById("addressForm");
  form.style.display = form.style.display === "none" ? "" : "none";
  if(form.style.display !== "none"){
    document.getElementById("addrInput").value = "";
    document.getElementById("cityInput").value = "";
  }
}

async function saveAddress(){
  const addr = document.getElementById('addrInput').value.trim();
  const city = document.getElementById('cityInput').value.trim();
  if (!addr || !city) { alert('Please fill in both fields.'); return; }

  const { data: { session } } = await _supa.auth.getSession();
  if (!session) return;

  const { data: row } = await _supa.from('profiles').select('data').eq('id', session.user.id).single();
  const profile = row?.data || {};
  profile.addresses = profile.addresses || [];
  profile.addresses.push({ address: addr, city });
  await _supa.from('profiles').upsert({ id: session.user.id, data: profile });

  const user = JSON.parse(localStorage.getItem('loggedInUser')) || {};
  user.addresses = profile.addresses;
  localStorage.setItem('loggedInUser', JSON.stringify(user));

  toggleAddressForm();
  loadAddresses();
}

function loadAddresses(){
  const user      = JSON.parse(localStorage.getItem('loggedInUser')) || {};
  const list      = document.getElementById('addressList');
  const addresses = user.addresses || [];

  if (addresses.length === 0) {
    list.innerHTML = `<div class="no-address">No addresses added</div>`;
    return;
  }

  list.innerHTML = addresses.map((a, i) => `
    <div class="address-item">
      <div class="address-item-text">
        <p>${a.address}</p>
        <p class="city-text">${a.city}</p>
      </div>
      <span class="remove-addr" onclick="removeAddress(${i})">✕</span>
    </div>
  `).join('');
}

async function removeAddress(index){
  const { data: { session } } = await _supa.auth.getSession();
  if (!session) return;

  const { data: row } = await _supa.from('profiles').select('data').eq('id', session.user.id).single();
  const profile = row?.data || {};
  profile.addresses = profile.addresses || [];
  profile.addresses.splice(index, 1);
  await _supa.from('profiles').upsert({ id: session.user.id, data: profile });

  const user = JSON.parse(localStorage.getItem('loggedInUser')) || {};
  user.addresses = profile.addresses;
  localStorage.setItem('loggedInUser', JSON.stringify(user));

  loadAddresses();
}

async function logout(){
  await _supa.auth.signOut();
  localStorage.removeItem('loggedIn');
  localStorage.removeItem('loggedInUser');
  window.location.href = '../pages/login.html';
}

async function logoutAll(){
  await _supa.auth.signOut();
  localStorage.removeItem('loggedIn');
  localStorage.removeItem('loggedInUser');
  alert('Signed out everywhere 🔒');
  window.location.href = '../pages/login.html';
}

// 🔥 SHOW VIEW FUNCTION
function showView(view){
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(view).classList.add("active");

  document.getElementById("ordersTab").classList.remove("active");
  document.getElementById("reviewsTab").classList.remove("active");
  document.getElementById("buyAgainTab").classList.remove("active");
  document.getElementById("profileTab").classList.remove("active");

  if(view === "ordersView"){
    document.getElementById("ordersTab").classList.add("active");
  } else if(view === "reviewsView"){
    document.getElementById("reviewsTab").classList.add("active");
    renderReviews();
  } else if(view === "buyAgainView"){
    document.getElementById("buyAgainTab").classList.add("active");
    renderBuyAgain();
  } else {
    document.getElementById("profileTab").classList.add("active");
  }
}

/* ── ARRIVING FROM A NOTIFICATION ──
   The bell links to #order-<id>. The browser's own hash jump is no use
   here: the cards are rendered after an await, so at the moment the
   page loads the element does not exist yet. This runs once the list
   is on screen.

   A finished order is not in the active list at all — it has moved to
   Reviews — so if it is not found here the matching tab is opened and
   searched before giving up. */
async function focusOrderFromHash(){
  const id = decodeURIComponent((location.hash || '').replace(/^#order-/, ''));
  if(!id || !location.hash.startsWith('#order-')) return;

  let el = document.getElementById('order-card-' + id);

  if(!el){
    // delivered or cancelled — it lives under Reviews now
    showView('reviewsView');
    await new Promise(r => setTimeout(r, 120));   // let renderReviews() paint
    el = document.getElementById('review-card-' + id);
  }

  if(!el){
    // nothing to jump to; leave the customer on the list rather than
    // on a blank tab they did not ask for
    showView('ordersView');
    return;
  }

  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('order-card-focus');
  setTimeout(() => el.classList.remove('order-card-focus'), 2600);
}

function updateOrderBadge(){
  // Badge hidden on the orders page itself — nothing needed here
  const userIcon = document.getElementById('userIcon');
  if (userIcon) userIcon.querySelector('.order-badge')?.remove();
}

// 🔥 RUN ON LOAD
document.addEventListener('DOMContentLoaded', async () => {

  const userIcon = document.getElementById('userIcon');
  const dropdown = document.getElementById('dropdown');

  userIcon.onclick = () => { dropdown.classList.toggle('show'); };

  showView('ordersView');
  await loadProfile();
  await renderOrders();
  updateOrderBadge();

  /* Arrived from a notification about one order — go to it. */
  await focusOrderFromHash();

  // Refresh tracking display every 30 seconds
  setInterval(async () => { await renderOrders(); updateOrderBadge(); }, 30000);

  const phoneInput = document.getElementById("phoneInput");
  if(phoneInput){
    phoneInput.addEventListener("keypress", function(e){
      if(!/[0-9]/.test(e.key)) e.preventDefault();
      if(this.value.length >= 11) e.preventDefault();
    });
    phoneInput.addEventListener("input", function(){
      this.value = this.value.replace(/[^0-9]/g, "").slice(0, 11);
    });
    phoneInput.addEventListener("paste", function(e){
      const paste = (e.clipboardData || window.clipboardData).getData("text");
      if(!/^[0-9]+$/.test(paste)) e.preventDefault();
    });
  }
});

async function renderOrders() {
  const container   = document.getElementById('orders-list');
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    container.innerHTML = `<div class="empty-box"><h3>Not logged in</h3><p>Please sign in to view your orders.</p></div>`;
    return;
  }

  // Fetch this customer's orders from Supabase
  const { data: rows } = await _supa
    .from('orders')
    .select('data')
    .eq('customer_email', currentUser.email)
    .order('date', { ascending: false });

  const orders = (rows || []).map(r => r.data);

  if (orders.length === 0) {
    container.innerHTML = `<div class="empty-box"><h3>No orders yet</h3><p>Go to store to place an order.</p></div>`;
    return;
  }

  // Load all tracking data from Supabase
  const allTracking = await fetchAllTracking(orders.map(o => o.id));

  /* An order cancelled because its payment was refused stays on the
     list until the customer dismisses it. Dropping it the way other
     cancellations are dropped would make their order simply vanish,
     with the explanation only in an email they may not have opened —
     and this is the one cancellation they did not ask for. */
  const rejectedPayment = order =>
    (order.status || '') === 'Cancelled' &&
    typeof order.cancelReason === 'string' &&
    order.cancelReason.startsWith('Payment rejected') &&
    (order.paymentRejectedSeen !== true || awaitingRefundNotice(order));

  // Exclude delivered and cancelled orders
  const activeOrders = orders.filter(order => {
    const t = allTracking[order.id] || order.tracking || null;
    if (t && (t.status === 'COMPLETED' || t.status === 'CANCELED')) return false;
    const s = order.status || 'Pending';
    return s !== 'Cancelled' || rejectedPayment(order);
  });

  if (activeOrders.length === 0) {
    container.innerHTML = `
      <div class="empty-box">
        <h3>No active orders</h3>
        <p>All your orders have been delivered. Check the <strong>Reviews</strong> tab!</p>
      </div>
    `;
    return;
  }

  // show newest first
  const sorted = [...activeOrders].reverse();

  container.innerHTML = sorted.map(order => {
    const itemsHTML = order.items.map(item => `
      <div class="order-item">
        <img src="${item.img}" class="order-img" onerror="this.style.display='none'">
        <div class="order-info">
          <p class="name">${item.name}</p>
          <p class="qty">x${item.qty || 1}</p>
        </div>
        <div class="order-price">₱${item.price * (item.qty || 1)}</div>
      </div>
    `).join("");

    const total    = order.total || order.items.reduce((sum, i) => sum + i.price * (i.qty || 1), 0);
    const dateStr  = order.date ? new Date(order.date).toLocaleString('en-PH', {month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}) : '';

    // Merge tracking: prefer the live tracking object, fall back to embedded tracking saved by admin sync
    const tracking = allTracking[order.id] || order.tracking || null;
    const trackingHTML = buildTrackingHTML(order, tracking);

    // Derive display status from live tracking if Lalamove is active
    const trackingStatusLabel = {
      ASSIGNING_DRIVER: 'Finding Driver',
      ON_GOING:         'On the Way',
      PICKED_UP:        'Picked Up',
      COMPLETED:        'Delivered'
    };
    const liveLabel = tracking && trackingStatusLabel[tracking.status];
    const status = liveLabel || order.status || 'Pending';
    const statusColor = status === 'Confirmed' ? '#16A34A'
      : status === 'Preparing' || status === 'Packing' ? '#EA580C'
      : status === 'Packed' ? '#0891B2'
      : status === 'On the Way' || status === 'Finding Driver' || status === 'Picked Up' ? '#2563EB'
      : status === 'Fulfilled' || status === 'Delivered' ? '#6366F1'
      : status === 'Cancelled' ? '#DC2626'
      : status === 'Cancel Requested' ? '#EA580C'
      : '#D97706';
    const prepLabel = order.preparingSubStatus === 'packing' ? '📦 Packing' : '🔥 Baking';
    const statusBadge = status === 'Preparing'
      ? `<span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;background:${statusColor}1a;color:${statusColor}">${prepLabel}</span>`
      : `<span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;background:${statusColor}1a;color:${statusColor}">${status}</span>`;

    return `
      <div class="order-card" id="order-card-${order.id}">
        <div class="order-header" style="display:flex;justify-content:space-between;align-items:center">
          <span>Order • ${dateStr}</span>
          ${statusBadge}
        </div>
        ${itemsHTML}
        <div class="order-divider"></div>
        <div class="order-total"><span>Total</span><span>₱${total}</span></div>
        ${trackingHTML}
        ${order.cancelRejectedNotice ? `
        <div style="margin-top:12px;padding:10px 14px;background:#FEF3C7;border:1px solid #F59E0B;border-radius:10px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:13px;color:#92400E;font-weight:500">⚠️ Your cancellation request was rejected. Your order is still active.</span>
          <button onclick="dismissCancelRejected('${order.id}')" style="background:none;border:none;font-size:18px;cursor:pointer;color:#92400E;line-height:1">×</button>
        </div>` : ''}
        ${rejectedPayment(order) ? `
        <div style="margin-top:12px;padding:12px 14px;background:#FEE2E2;border:1px solid #DC2626;border-radius:10px">
          <div style="font-size:13px;font-weight:700;color:#991B1B;margin-bottom:4px">Payment could not be matched — order cancelled</div>
          <div style="font-size:13px;color:#7F1D1D;line-height:1.5">
            ${escOrderText(String(order.cancelReason).replace(/^Payment rejected — /, ''))}.
            Nothing has been charged. If you think this is a mistake, send us your GCash receipt and the
            number to refund to, and we will look at it again.
          </div>
          ${appealBlock(order)}
        </div>` : ''}
        ${status === 'Pending' ? `
        <div style="margin-top:12px">
          <button class="cancel-order-btn" onclick="cancelOrder('${order.id}')">Cancel Order</button>
        </div>` : status === 'Cancel Requested' ? `
        <div style="margin-top:12px">
          <span class="cancel-requested-badge">Cancellation requested — awaiting admin review</span>
        </div>` : ''}
      </div>
    `;
  }).join("");
}

/* ── APPEALING A REJECTED PAYMENT ───────────────────────────────
   A refused payment used to end at "Got it", which closed the notice
   and left the customer with nothing to do but find the shop on
   Facebook. If they did pay, the two things the shop needs are the
   receipt and the number to send the money back to, so the card asks
   for exactly those and puts them on the order where the admin is
   already standing when they make the decision. */

/* Stored as 09XXXXXXXXX because that is the shape the admin's refund
   form validates. Accepts what people actually type: +63 917…,
   0917…, 917…, with or without spaces and dashes. */
function normalisePhone(raw){
  const d = String(raw || '').replace(/[\s()+-]/g, '');
  if (/^639\d{9}$/.test(d))  return '0' + d.slice(2);
  if (/^9\d{9}$/.test(d))    return '0' + d;
  if (/^09\d{9}$/.test(d))   return d;
  return null;
}

/* A refund brings a hidden order back, once. Someone who waved the
   rejection away is still owed the news that their money came back,
   and an email they may not open is not where that should only live. */
function awaitingRefundNotice(order){
  return order.refunded === true && order.refundSeen !== true;
}

async function dismissRefundNotice(orderId){
  const { data: row } = await _supa.from('orders').select('data').eq('id', orderId).single();
  if (row) {
    const updated = { ...row.data, refundSeen: true, paymentRejectedSeen: true };
    await _supa.from('orders').update({ data: updated }).eq('id', orderId);
  }
  renderOrders();
}

function appealBlock(order){
  const a = order.paymentAppeal;

  /* The money is back. That outranks anything else this panel could
     say, including an appeal still marked as under review. */
  if (order.refunded) {
    const to = order.refundDetails && order.refundDetails.gcashNumber;
    return `
      <div class="appeal-sent appeal-refunded">
        <span class="appeal-sent-tick" aria-hidden="true">✓</span>
        <div>
          <div class="appeal-sent-title">Refunded — ₱${Number(order.total || 0).toLocaleString()} sent back</div>
          <div class="appeal-sent-sub">
            Sent to <strong>${escOrderText(to || 'your GCash')}</strong>${order.refundedAt ? ' on ' + escOrderText(fmtWhen(order.refundedAt)) : ''}.
            It can take up to 24 hours to show in your GCash.
          </div>
          <button class="appeal-link" onclick="dismissRefundNotice('${order.id}')">Got it</button>
        </div>
      </div>`;
  }

  if (a) {
    return `
      <div class="appeal-sent">
        <span class="appeal-sent-tick" aria-hidden="true">✓</span>
        <div>
          <div class="appeal-sent-title">Receipt sent — we are checking it</div>
          <div class="appeal-sent-sub">
            Sent ${escOrderText(fmtWhen(a.sentAt))} · refund to <strong>${escOrderText(a.gcashNumber)}</strong>.
            We will message you once someone has looked at it.
          </div>
          <button class="appeal-link" onclick="dismissPaymentRejected('${order.id}')">Hide this</button>
        </div>
      </div>`;
  }

  const prefill = order.phone ? (normalisePhone(order.phone) || order.phone) : '';

  return `
    <div class="appeal-wrap">
      <div class="appeal-cta">
        <button class="appeal-btn" onclick="openAppeal('${order.id}')">Send my receipt</button>
        <button class="appeal-link" onclick="dismissPaymentRejected('${order.id}')">No thanks</button>
      </div>

      <div id="appeal-${order.id}" class="appeal-form hidden">
        <div class="appeal-field">
          <label class="appeal-label" for="appeal-phone-${order.id}">GCash number to refund to</label>
          <input class="appeal-input" id="appeal-phone-${order.id}" type="tel" inputmode="numeric"
                 placeholder="09XXXXXXXXX" value="${escOrderText(prefill)}">
        </div>

        <div class="appeal-field">
          <label class="appeal-label" for="appeal-file-${order.id}">Your GCash receipt</label>
          <label class="appeal-drop" id="appeal-drop-${order.id}">
            <input type="file" id="appeal-file-${order.id}" accept="image/*"
                   onchange="appealFilePicked('${order.id}', this)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span id="appeal-dropmsg-${order.id}">Choose a screenshot</span>
          </label>
        </div>

        <div class="appeal-field">
          <label class="appeal-label" for="appeal-note-${order.id}">
            Anything to add <span class="appeal-optional">(optional)</span>
          </label>
          <textarea class="appeal-input appeal-textarea" id="appeal-note-${order.id}" rows="2"
                    placeholder="e.g. I sent it at 2:15 PM from a different number"></textarea>
        </div>

        <div id="appeal-err-${order.id}" class="appeal-err hidden"></div>

        <div class="appeal-actions">
          <button class="appeal-btn" id="appeal-send-${order.id}" onclick="submitAppeal('${order.id}')">Send to the shop</button>
          <button class="appeal-link" onclick="closeAppeal('${order.id}')">Cancel</button>
        </div>
      </div>
    </div>`;
}

/* Swaps the dropzone's prompt for the chosen file, with a thumbnail —
   a file field that still says "Choose a screenshot" after you have
   chosen one gives no sign it worked. */
function appealFilePicked(orderId, input){
  const drop = document.getElementById(`appeal-drop-${orderId}`);
  const msg  = document.getElementById(`appeal-dropmsg-${orderId}`);
  const file = input?.files?.[0];
  if (!drop || !msg) return;

  document.getElementById(`appeal-err-${orderId}`)?.classList.add('hidden');
  drop.querySelector('.appeal-thumb')?.remove();

  if (!file) {
    drop.classList.remove('has-file');
    msg.textContent = 'Choose a screenshot';
    return;
  }

  drop.classList.add('has-file');
  msg.textContent = file.name.length > 34 ? file.name.slice(0, 31) + '…' : file.name;

  const img = document.createElement('img');
  img.className = 'appeal-thumb';
  img.alt = '';
  img.onload = () => URL.revokeObjectURL(img.src);
  img.src = URL.createObjectURL(file);
  drop.prepend(img);
}

function fmtWhen(iso){
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d) ? '' : d.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
}

function openAppeal(orderId){
  document.getElementById(`appeal-${orderId}`)?.classList.remove('hidden');
  document.getElementById(`appeal-phone-${orderId}`)?.focus();
}

function closeAppeal(orderId){
  document.getElementById(`appeal-${orderId}`)?.classList.add('hidden');
}

function appealError(orderId, msg){
  const el = document.getElementById(`appeal-err-${orderId}`);
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
}

/* Receipts live inside a database row, so they are resized first —
   the same reason checkout shrinks the original upload. */
function shrinkAppealImage(file, maxW = 1000, quality = 0.72){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not an image'));
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const c = document.createElement('canvas');
        c.width  = Math.round(img.width  * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function submitAppeal(orderId){
  const phoneEl = document.getElementById(`appeal-phone-${orderId}`);
  const fileEl  = document.getElementById(`appeal-file-${orderId}`);
  const noteEl  = document.getElementById(`appeal-note-${orderId}`);
  const btn     = document.getElementById(`appeal-send-${orderId}`);
  document.getElementById(`appeal-err-${orderId}`)?.classList.add('hidden');

  const phone = normalisePhone(phoneEl?.value);
  if (!phone) return appealError(orderId, 'Enter the GCash number as 09XXXXXXXXX.');

  const file = fileEl?.files?.[0];
  if (!file) return appealError(orderId, 'Attach the GCash receipt screenshot.');
  if (!/^image\//.test(file.type)) return appealError(orderId, 'That is not an image — attach a screenshot.');

  btn.disabled = true;
  btn.textContent = 'Sending...';

  try {
    const img = await shrinkAppealImage(file);

    /* Read, change, write — the row holds the whole order as one blob,
       so anything read before the admin's last edit would overwrite it. */
    const { data: row, error: readErr } = await _supa
      .from('orders').select('data').eq('id', orderId).single();
    if (readErr || !row) throw new Error(readErr?.message || 'Could not find that order');

    const updated = {
      ...row.data,
      paymentAppeal: {
        gcashNumber: phone,
        img,
        note:   (noteEl?.value || '').trim() || null,
        sentAt: new Date().toISOString(),
        seen:   false
      }
    };

    const { error: writeErr } = await _supa.from('orders').update({ data: updated }).eq('id', orderId);
    if (writeErr) throw new Error(writeErr.message);

    renderOrders();
  } catch (err) {
    console.warn('appeal failed:', err);
    btn.disabled = false;
    btn.textContent = 'Send to the shop';
    appealError(orderId, 'Could not send that — check your connection and try again.');
  }
}

/* The customer's text is reflected back into the card, so it is
   escaped on the way out like anything else from the database. */
function escOrderText(t){
  return String(t == null ? '' : t)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function dismissPaymentRejected(orderId){
  const { data: row } = await _supa.from('orders').select('data').eq('id', orderId).single();
  if (row) {
    const updated = { ...row.data, paymentRejectedSeen: true };
    await _supa.from('orders').update({ data: updated }).eq('id', orderId);
  }
  renderOrders();
}

async function dismissCancelRejected(orderId){
  const { data: row } = await _supa.from('orders').select('data').eq('id', orderId).single();
  if (row) {
    const updated = { ...row.data, cancelRejectedNotice: false };
    await _supa.from('orders').update({ data: updated }).eq('id', orderId);
  }
  renderOrders();
}

function cancelOrder(orderId){
  const modal  = document.getElementById('cancel-confirm-modal');
  const okBtn  = document.getElementById('cancel-confirm-ok');

  // Reset state every time modal opens
  document.querySelectorAll('input[name="cancel-reason"]').forEach(r => r.checked = false);
  document.querySelectorAll('.o-reason-item').forEach(el => el.classList.remove('selected'));
  okBtn.disabled = true;

  const othersInput = document.getElementById('others-reason-input');
  othersInput.value = '';
  othersInput.classList.add('hidden');

  // Enable button only when a reason is picked (and "Others" has text)
  document.querySelectorAll('input[name="cancel-reason"]').forEach(radio => {
    radio.onchange = () => {
      document.querySelectorAll('.o-reason-item').forEach(el => el.classList.remove('selected'));
      radio.closest('.o-reason-item').classList.add('selected');
      if(radio.value === '__others__'){
        othersInput.classList.remove('hidden');
        othersInput.focus();
        okBtn.disabled = othersInput.value.trim() === '';
      } else {
        othersInput.classList.add('hidden');
        okBtn.disabled = false;
      }
    };
  });

  othersInput.oninput = () => {
    const othersRadio = document.querySelector('input[name="cancel-reason"][value="__others__"]');
    if(othersRadio && othersRadio.checked){
      okBtn.disabled = othersInput.value.trim() === '';
    }
  };

  modal.classList.remove('hidden');

  okBtn.onclick = async () => {
    const selected = document.querySelector('input[name="cancel-reason"]:checked');
    if (!selected) return;
    const othersText = document.getElementById('others-reason-input').value.trim();
    const reason = selected.value === '__others__' ? (othersText || 'Others') : selected.value;
    if (selected.value === '__others__' && !othersText) return;
    closeCancelModal();

    // Update order status in Supabase
    const { data: row } = await _supa.from('orders').select('data').eq('id', orderId).single();
    if (row) {
      const updated = { ...row.data, status: 'Cancel Requested', cancelReason: reason };
      await _supa.from('orders').update({ status: 'Cancel Requested', data: updated }).eq('id', orderId);
    }

    renderOrders();
  };
}

function closeCancelModal(){
  document.getElementById('cancel-confirm-modal').classList.add('hidden');
}

/* ── REVIEWS TAB ─────────────────────────── */

async function renderReviews() {
  const container   = document.getElementById('reviews-list');
  const currentUser = await getCurrentUser();
  if (!currentUser) { container.innerHTML = `<div class="empty-box"><h3>Not logged in</h3></div>`; return; }

  // Fetch orders + tracking + reviews from Supabase
  const [ordersRes, reviewsRes] = await Promise.all([
    _supa.from('orders').select('data').eq('customer_email', currentUser.email),
    _supa.from('reviews').select('data, order_id').eq('user_email', currentUser.email)
  ]);

  const orders      = (ordersRes.data || []).map(r => r.data);
  const reviewedIds = new Set((reviewsRes.data || []).map(r => r.order_id));
  const allTracking = await fetchAllTracking(orders.map(o => o.id));
  const savedReviews = {};
  (reviewsRes.data || []).forEach(r => { savedReviews[r.order_id] = r.data; });

  const delivered = orders.filter(order => {
    const t = allTracking[order.id] || null;
    return t && t.status === 'COMPLETED' && !reviewedIds.has(order.id);
  }).reverse();

  if (delivered.length === 0) {
    container.innerHTML = `
      <div class="empty-box">
        <h3>No pending reviews</h3>
        <p>You've reviewed all your delivered orders. Thank you!</p>
      </div>`;
    return;
  }

  container.innerHTML = delivered.map(order => {
    const dateStr   = order.date ? new Date(order.date).toLocaleString('en-PH', {month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}) : '';
    const total     = order.total || order.items.reduce((sum, i) => sum + i.price * (i.qty || 1), 0);
    const review    = savedReviews[order.id] || null;
    const itemsHTML = order.items.map(item => `
      <div class="order-item">
        <img src="${item.img}" class="order-img" onerror="this.style.display='none'">
        <div class="order-info">
          <p class="name">${item.name}</p>
          <p class="qty">x${item.qty || 1}</p>
        </div>
        <div class="order-price">₱${item.price * (item.qty || 1)}</div>
      </div>`).join("");

    const reviewSection = review
      ? `<div class="review-submitted">
           <div class="review-stars-display">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
           <p class="review-comment-display">"${review.comment}"</p>
           <p class="review-date">Reviewed on ${new Date(review.date).toLocaleDateString('en-PH', {month:'short',day:'numeric',year:'numeric'})}</p>
         </div>`
      : `<div class="review-form" id="review-form-${order.id}">
           <p class="review-form-label">How was your order?</p>
           <div class="star-rating" id="stars-${order.id}">
             ${[1,2,3,4,5].map(n => `<span class="star" data-value="${n}" onclick="setRating('${order.id}', ${n})">☆</span>`).join("")}
           </div>
           <textarea class="review-textarea" id="text-${order.id}" placeholder="Share your experience..."></textarea>
           <button class="review-submit-btn" onclick="submitReview('${order.id}')">Submit Review</button>
         </div>`;

    return `
      <div class="order-card" id="review-card-${order.id}">
        <div class="order-header">Delivered • ${dateStr}</div>
        ${itemsHTML}
        <div class="order-divider"></div>
        <div class="order-total"><span>Total</span><span>₱${total}</span></div>
        <div class="order-divider"></div>
        ${reviewSection}
      </div>`;
  }).join("");
}

/* Store selected rating per order */
const _selectedRating = {};

function setRating(orderId, value) {
  _selectedRating[orderId] = value;
  const stars = document.querySelectorAll(`#stars-${orderId} .star`);
  stars.forEach((s, i) => {
    s.textContent = i < value ? '★' : '☆';
    s.classList.toggle('selected', i < value);
  });
}

async function submitReview(orderId) {
  const rating  = _selectedRating[orderId] || 0;
  const comment = document.getElementById('text-' + orderId)?.value.trim();

  if (!rating)  { alert('Please select a star rating.'); return; }
  if (!comment) { alert('Please write a short review.'); return; }

  const currentUser = await getCurrentUser();
  if (!currentUser) return;

  await _supa.from('reviews').insert({
    order_id:   orderId,
    user_email: currentUser.email,
    data:       { rating, comment, date: new Date().toISOString() }
  });

  renderReviews();
}

/* ── END REVIEWS ─────────────────────────── */

/* ── BUY AGAIN ───────────────────────────── */

let _buyAgainItems = [];

async function renderBuyAgain() {
  const container   = document.getElementById('buy-again-list');
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    container.innerHTML = `<div class="empty-box"><h3>Not logged in</h3><p>Please sign in to view your orders.</p></div>`;
    return;
  }

  const { data: rows } = await _supa
    .from('orders')
    .select('data')
    .eq('customer_email', currentUser.email);

  const orders = (rows || []).map(r => r.data);

  if (orders.length === 0) {
    container.innerHTML = `<div class="empty-box"><h3>No past orders</h3><p>Place an order first to buy again.</p></div>`;
    return;
  }

  const seen = new Map();
  orders.forEach(order => {
    (order.items || []).forEach(item => {
      if (!seen.has(item.name)) {
        seen.set(item.name, { name: item.name, price: item.price, img: item.img });
      }
    });
  });

  _buyAgainItems = [...seen.values()];

  container.innerHTML = `<div class="buy-again-grid">${_buyAgainItems.map((item, idx) => `
    <div class="buy-again-card">
      <img src="${item.img}" class="buy-again-img" onerror="this.style.display='none'">
      <div class="buy-again-info">
        <p class="buy-again-name">${item.name}</p>
        <p class="buy-again-price">₱${item.price}</p>
      </div>
      <button class="buy-again-btn" onclick="addToCartFromHistory(${idx})">Add to Cart</button>
    </div>
  `).join("")}</div>`;
}

function addToCartFromHistory(idx) {
  const item = _buyAgainItems[idx];
  if (!item) return;

  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const existing = cart.find(i => i.name === item.name);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ name: item.name, price: item.price, img: item.img, qty: 1 });
  }
  localStorage.setItem("cart", JSON.stringify(cart));
  showBuyAgainToast("Added to cart 🛒");
}

function showBuyAgainToast(msg) {
  let toast = document.getElementById("buy-again-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "buy-again-toast";
    toast.className = "buy-again-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}

/* ── END BUY AGAIN ───────────────────────── */

/* Build the delivery tracking stepper HTML for one order */
function buildTrackingHTML(order, tracking) {
  const status  = order.status || 'Pending';
  const sub     = order.preparingSubStatus || null;
  const tStatus = tracking ? tracking.status : null;

  // Steps: 0=Placed, 1=Confirmed, 2=Baking, 3=Packing, 4=On the Way, 5=Delivered
  // doneThrough = last step index shown as green (done); activeStep = pink step (-1 = none)
  // Note: customer-side status values differ from admin DB (e.g. 'Packing' display label)
  let doneThrough = -1;
  let activeStep  =  0;

  const packedDone = (sub === 'packed' || sub === 'readyForBook');

  if (tStatus === 'COMPLETED' || status === 'Fulfilled') {
    doneThrough = 5; activeStep = -1;
  } else if (tStatus === 'ON_GOING' || tStatus === 'PICKED_UP' || tStatus === 'ASSIGNING_DRIVER') {
    doneThrough = 3; activeStep = 4;
  } else if (status === 'Packed' || ((status === 'Packing' || status === 'Preparing') && packedDone)) {
    doneThrough = 3; activeStep = -1; // packing done, awaiting driver
  } else if (status === 'Packing' || status === 'Ready for Packing' || (status === 'Preparing' && sub === 'packing')) {
    doneThrough = 2; activeStep = 3;
  } else if (status === 'Preparing') {
    doneThrough = 1; activeStep = 2;
  } else if (status === 'Confirmed') {
    doneThrough = 0; activeStep = 1;
  } else {
    doneThrough = -1; activeStep = 0;
  }

  // Dynamic label for "On the Way" step based on live tracking
  const onTheWayLabel = tStatus === 'ASSIGNING_DRIVER' ? 'Finding Driver'
    : tStatus === 'PICKED_UP' ? 'Picked Up'
    : 'On the Way';

  const STEPS = [
    { label: 'Order Placed', icon: '🛒' },
    { label: 'Confirmed',    icon: '✅' },
    { label: 'Baking',       icon: '🔥' },
    { label: 'Packing',      icon: '📦' },
    { label: onTheWayLabel,  icon: tStatus === 'ASSIGNING_DRIVER' ? '🔍' : tStatus === 'PICKED_UP' ? '📍' : '🛵' },
    { label: 'Delivered',    icon: '🎉' },
  ];

  const isCancelled = tStatus === 'CANCELED' || tStatus === 'REJECTED' || tStatus === 'EXPIRED';

  let stepsHTML;
  if (isCancelled) {
    stepsHTML = `<div class="tracking-cancelled">Delivery was cancelled</div>`;
  } else {
    stepsHTML = `<div class="delivery-stepper">` +
      STEPS.map((step, idx) => {
        const done   = idx <= doneThrough;
        const active = activeStep >= 0 && idx === activeStep;
        return `<div class="step ${done ? 'done' : ''} ${active ? 'active' : ''}">
          <div class="step-icon">${done ? '✓' : step.icon}</div>
          <div class="step-label">${step.label}</div>
        </div>`;
      }).join('') +
    `</div>`;
  }

  const driverHTML = tracking && tracking.driver ? `
    <div class="tracking-driver">
      <div class="driver-info">
        <strong>${tracking.driver.name}</strong>
        <span>${tracking.driver.phone} &nbsp;·&nbsp; ${tracking.driver.plate}</span>
      </div>
    </div>` : '';

  const linkHTML = tracking && tracking.shareLink
    ? `<a class="tracking-link" href="${tracking.shareLink}" target="_blank">📍 Track on Map</a>`
    : '';

  return `
    <div class="tracking-section">
      <div class="tracking-title">Delivery Status</div>
      ${stepsHTML}
      ${driverHTML}
      ${linkHTML}
    </div>`;
}
