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

  // Exclude delivered and cancelled orders
  const activeOrders = orders.filter(order => {
    const t = allTracking[order.id] || order.tracking || null;
    if (t && (t.status === 'COMPLETED' || t.status === 'CANCELED')) return false;
    const s = order.status || 'Pending';
    return s !== 'Cancelled';
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
      <div class="order-card">
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
