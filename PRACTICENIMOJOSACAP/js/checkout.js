/* Products/ingredients cached from Supabase on page load */
let _adminProducts   = [];
let _adminIngredients = [];

function loadCheckout(){
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let container = document.getElementById("summary-items");

  if(!container) return;

  container.innerHTML = "";

  let subtotal = 0;

  cart.forEach(item => {
    item.qty = item.qty || 1;
    let itemTotal = item.price * item.qty;
    subtotal += itemTotal;

    container.innerHTML += `
      <div class="order-item">
        <img src="${item.img}" class="order-img" alt="${item.name}">
        <div class="order-info">
          <p class="name">${item.name}</p>
          <p class="qty">x${item.qty}</p>
        </div>
        <div class="order-price">&#8369;${itemTotal}</div>
      </div>
    `;
  });

  const outOfRange = Boolean(_deliveryQuote?.outOfRange);
  const fee   = currentDeliveryFee();
  let   total = subtotal + (outOfRange ? 0 : fee);

  document.getElementById("subtotal").innerText = subtotal;
  document.getElementById("total").innerText = total;

  /* Keep the summary honest — it used to show a hardcoded ₱50 even when
     the address was out of range and no delivery was possible. */
  const deliveryEl = document.getElementById("summary-delivery");
  if(deliveryEl){
    deliveryEl.innerHTML = outOfRange ? 'Unavailable' : '&#8369;' + fee;
    deliveryEl.classList.toggle('summary-unavailable', outOfRange);
  }

  updatePlaceOrderBtn(total);
}

/* The delivery fee depends on how far the address is from the bakery.
   Until one has been quoted, fall back to the old flat rate. */
let _deliveryQuote = null;
let _quoteTimer    = null;

/* Re-price whenever the address settles. Debounced so we make one
   geocoding request per address, not one per keystroke — Nominatim is
   free and asks to be used sparingly. */
function scheduleDeliveryQuote(){
  clearTimeout(_quoteTimer);
  _quoteTimer = setTimeout(refreshDeliveryQuote, 700);
}

function deliveryAddressParts(){
  return {
    street: document.getElementById('address')?.value.trim() || '',
    city:   document.getElementById('city')?.value.trim() || '',
    postal: document.getElementById('postal')?.value.trim() || '',
    region: document.getElementById('region')?.value.trim() || ''
  };
}

async function refreshDeliveryQuote(){
  const parts = deliveryAddressParts();
  const row   = document.getElementById('shipping-fee');
  const note  = document.getElementById('shipping-note');
  const joined = [parts.street, parts.city, parts.postal, parts.region].filter(Boolean).join(' ');

  if(joined.length < 6){
    _deliveryQuote = null;
    if(row)  row.innerHTML = '&#8369;50.00';
    if(note) note.textContent = 'Enter your address for an exact rate';
    loadCheckout();
    return;
  }

  if(note) note.textContent = 'Checking distance…';
  _deliveryQuote = await quoteDelivery(parts);
  const q = _deliveryQuote;

  if(q.outOfRange){
    if(row)  row.textContent = 'Unavailable';
    if(note) note.textContent = `Sorry — ${q.km} km away is outside our delivery area`;
  } else if(q.located){
    if(row) row.innerHTML = '&#8369;' + q.fee.toFixed(2);
    /* Say how the address was matched. Subdivision names usually aren't
       on the map, so a barangay or town match is the normal case, not a
       failure — the customer should see why the number is what it is. */
    if(note){
      const where = shortPlace(q.matched);
      note.textContent = q.precision === 'exact'
        ? `${q.km} km from our kitchen`
        : `${q.km} km — based on ${where}`;
    }
  } else {
    if(row)  row.innerHTML = '&#8369;' + q.fee.toFixed(2);
    if(note) note.textContent = 'Standard rate — add your city so we can price it exactly';
  }

  loadCheckout();
}

/* "Santa Lucia, Pasig Second District, Pasig, Eastern Manila District,
   Metro Manila, Philippines" → "Santa Lucia, Pasig" */
function shortPlace(displayName){
  if(!displayName) return 'your area';
  return displayName.split(',').slice(0, 2).map(s => s.trim()).join(', ');
}

function currentDeliveryFee(){
  if(_deliveryQuote && typeof _deliveryQuote.fee === 'number') return _deliveryQuote.fee;
  return 50;
}

function updatePlaceOrderBtn(total){
  if(total === undefined){
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let subtotal = cart.reduce((sum, item) => sum + item.price * (item.qty || 1), 0);
    total = subtotal + currentDeliveryFee();
  }

  const btn = document.querySelector('.place-order-btn');
  const notice = document.getElementById("cod-notice");
  if(!btn) return;

  const isCOD = document.querySelector('input[name="payment"]:checked')?.value === 'Cash on Delivery';
  const qr = document.getElementById("gcash-qr");

  if(_deliveryQuote?.outOfRange){
    btn.disabled = true;                       // too far to deliver
    if(notice) notice.style.display = 'none';
  } else if(isCOD && total > 2000){
    btn.disabled = true;
    if(notice) notice.style.display = 'block';
  } else {
    btn.disabled = false;
    if(notice) notice.style.display = 'none';
  }

  if(qr) qr.style.display = isCOD ? 'none' : 'block';
}

function clearFieldErrors(){
  document.querySelectorAll('.field-error').forEach(e => e.remove());
  document.querySelectorAll('.field-invalid').forEach(e => e.classList.remove('field-invalid'));
}

function showFieldError(inputId, msg){
  const input = document.getElementById(inputId);
  if(!input) return;

  // Remove any existing error for this field
  document.querySelectorAll(`.field-error[data-for="${inputId}"]`).forEach(e => e.remove());

  const err = document.createElement('p');
  err.className = 'field-error';
  err.dataset.for = inputId;
  err.textContent = msg;

  const phoneField = input.closest('.phone-field');
  if(phoneField){
    // Phone fields: insert error after the outermost wrapper
    const wrapper = phoneField.parentElement?.classList.contains('field-wrap')
      ? phoneField.parentElement : phoneField;
    wrapper.classList.add('field-invalid');
    wrapper.insertAdjacentElement('afterend', err);
  } else {
    const wrap = input.closest('.field-wrap');
    if(wrap){
      wrap.classList.add('field-invalid');
      wrap.appendChild(err);
    }
  }
}

async function placeOrder(){
  const fname       = document.getElementById("fname").value.trim();
  const lname       = document.getElementById("lname").value.trim();
  const name        = (fname + " " + lname).trim();
  const phone       = document.getElementById("phone").value.trim();
  const address     = document.getElementById("address").value.trim();
  const city        = document.getElementById("city").value.trim();
  const postal      = document.getElementById("postal").value.trim();
  const region      = document.getElementById("region").value.trim();

  /* Refuse out-of-range deliveries here as well as greying the button.
     A disabled button is a hint, not a guarantee — it can be re-enabled
     from the console, and the quote may still have been in flight when
     the customer clicked. */
  if(_deliveryQuote?.outOfRange){
    showMsg(`Sorry, ${_deliveryQuote.km} km is outside our delivery area. We deliver up to 25 km from Pasig City.`, 'error');
    document.getElementById('address')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  if(cart.length === 0){
    showMsg("Your cart is empty");
    return;
  }

  // Ingredient availability check (using Supabase-cached data)
  const adminProducts    = _adminProducts;
  const adminIngredients = _adminIngredients;
  const needed = {};
  cart.forEach(item => {
    const p = adminProducts.find(pp => pp.name.toLowerCase() === item.name.toLowerCase());
    if(p && p.recipe){
      p.recipe.forEach(r => {
        needed[r.ingredientId] = (needed[r.ingredientId] || 0) + r.qty * (item.qty || 1);
      });
    }
  });
  const shortages = [];
  Object.entries(needed).forEach(([ingId, required]) => {
    const ing = adminIngredients.find(i => i.id === ingId);
    if(ing && ing.stock < required) shortages.push(ing.name);
  });
  if(shortages.length > 0){
    const minRestockDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    minRestockDate.setHours(0, 0, 0, 0);
    const chosenDateStr = localStorage.getItem("preferredDate") || "";
    const chosenDate = chosenDateStr ? new Date(chosenDateStr) : null;
    // Only block if the chosen delivery date is too soon for restock
    if(!chosenDate || chosenDate < minRestockDate){
      const minLabel = minRestockDate.toLocaleDateString('en-PH', { month:'long', day:'numeric', year:'numeric' });
      showMsg(`Sorry, we don't have enough ingredients for your order. Please pick a delivery date from ${minLabel} or later.`);
      return;
    }
  }

  // Daily limit check — skip if delivery date is not today
  const todayStr        = new Date().toISOString().slice(0, 10);
  const deliveryDateStr = localStorage.getItem('preferredDate') || '';
  const deliveryDate    = deliveryDateStr ? new Date(deliveryDateStr) : null;
  const deliveryIsToday = deliveryDate && deliveryDate.toISOString().slice(0, 10) === todayStr;
  if (deliveryIsToday) {
    const limitErrors = [];
    cart.forEach(item => {
      const p = adminProducts.find(pp => pp.name.toLowerCase() === item.name.toLowerCase());
      if (p) {
        const limit     = p.dailyLimit ?? p.stock ?? 0;
        const sold      = (p.lastResetDate === todayStr) ? (p.soldToday || 0) : 0;
        const available = Math.max(0, limit - sold);
        if ((item.qty || 1) > available) {
          limitErrors.push(`${item.name}: only ${available} left for today`);
        }
      }
    });
    if (limitErrors.length > 0) {
      showMsg(`Daily limit reached: ${limitErrors.join(', ')}.`);
      return;
    }
  }

  const cookieNotice = document.getElementById("cookie-notice");
  if(cookieNotice) cookieNotice.style.display = "none";

  clearFieldErrors();
  let hasError = false;

  if(!fname)   { showFieldError("fname", "First name cannot be empty"); hasError = true; }
  if(!lname)   { showFieldError("lname", "Last name cannot be empty"); hasError = true; }
  if(!address) { showFieldError("address", "Address cannot be empty"); hasError = true; }
  if(!postal)  { showFieldError("postal", "Postal code cannot be empty"); hasError = true; }
  if(!city)    { showFieldError("city", "City cannot be empty"); hasError = true; }
  if(!region)  { showFieldError("region", "Region cannot be empty"); hasError = true; }
  if(!phone){
    showFieldError("phone", "Phone cannot be empty"); hasError = true;
  } else if(!/^9\d{9}$/.test(phone)){
    showFieldError("phone", "Invalid phone number (e.g. 9XXXXXXXXX)"); hasError = true;
  }


  if(hasError){
    const firstInvalid = document.querySelector('.field-invalid, .field-error');
    if(firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  let subtotal = 0;
  cart.forEach(item => { subtotal += item.price * (item.qty || 1); });
  const deliveryFee = currentDeliveryFee();
  let total = subtotal + deliveryFee;

  const currentUser     = JSON.parse(localStorage.getItem('loggedInUser'));
  const orderId         = 'WEB-' + Date.now();
  const selectedPayment = document.querySelector('input[name="payment"]:checked')?.value || 'Cash on Delivery';
  const preferredDate   = localStorage.getItem('preferredDate') || null;
  const preferredTime   = localStorage.getItem('preferredTime') || null;

  const orderData = {
    id:            orderId,
    customer:      name,
    customerEmail: currentUser ? currentUser.email : 'guest',
    phone,
    address:       address + ', ' + city,
    items:         cart.map(item => ({ id: item.id, name: item.name, qty: item.qty || 1, price: item.price, img: item.img || '' })),
    total,
    type:          'Online',
    status:        'Pending',
    date:          new Date().toISOString(),
    payment:       selectedPayment,
    deliveryFee,
    /* Distance and coordinates from the address lookup. The coordinates
       are what a real Lalamove booking needs — it works in lat/lng, not
       text addresses. */
    ...(_deliveryQuote?.km != null && { distanceKm: _deliveryQuote.km }),
    ...(_deliveryQuote?.coords && { deliveryCoords: _deliveryQuote.coords }),
    ...(preferredDate && { preferredDate }),
    ...(preferredTime && { preferredTime })
  };

  // Save order to Supabase (shared between customer and admin)
  const { error: insertErr } = await _supa.from('orders').insert({
    id:             orderData.id,
    customer_email: orderData.customerEmail,
    status:         orderData.status,
    date:           orderData.date,
    data:           orderData
  });

  if (insertErr) {
    showMsg('Failed to place order. Please try again.');
    return;
  }

  localStorage.removeItem('cart');
  localStorage.removeItem('preferredDate');
  localStorage.removeItem('preferredTime');
  localStorage.removeItem('contactMethod');   // clear any value left from before the field was removed

  showMsg('Order placed successfully 🎉', 'success');
  setTimeout(() => { window.location.href = '../pages/orders.html'; }, 1500);
}

function goBack(){
  window.location.href = "../pages/homepage.html";
}

function toggleContactMenu(e){
  e.stopPropagation();
  document.getElementById("contactDropdown").classList.toggle("open");
}

function signOut(){
  localStorage.removeItem("loggedInUser");
  localStorage.removeItem("loggedIn");
  window.location.href = "../pages/login.html";
}

document.addEventListener("click", function(){
  const dd = document.getElementById("contactDropdown");
  if(dd) dd.classList.remove("open");
});

function goToCart(){
  window.location.href = "../pages/cart.html";
}

function showMsg(text, type="error"){
  const msg = document.getElementById("msg");
  msg.innerText = text;
  msg.className = "msg show " + type;
  setTimeout(() => { msg.classList.remove("show"); }, 2500);
}

/* Region drives City, and City fills in the postcode. Set up before
   prefillFromProfile() so a saved address has options to select. */
function setupServiceAreaSelects(){
  const regionEl = document.getElementById('region');
  const cityEl   = document.getElementById('city');
  const postalEl = document.getElementById('postal');
  if(!regionEl || !cityEl) return;

  fillRegionSelect(regionEl, regionEl.value);
  fillCitySelect(cityEl, regionEl.value, cityEl.value);

  regionEl.addEventListener('change', () => {
    fillCitySelect(cityEl, regionEl.value, '');
    if(postalEl) postalEl.value = '';
    scheduleDeliveryQuote();
  });

  cityEl.addEventListener('change', () => {
    // Fill the postcode from the city, which is where "1001Cainta" came from
    const code = postalFor(regionEl.value, cityEl.value);
    if(postalEl && code) postalEl.value = code;
    scheduleDeliveryQuote();
  });

  // Keep the postcode to four digits whatever gets pasted or autofilled
  postalEl?.addEventListener('input', () => {
    postalEl.value = postalEl.value.replace(/\D/g, '').slice(0, 4);
  });
}

/* A saved address only stored the city, so work the region back out
   from it and select both. */
function applySavedCity(city){
  const regionEl = document.getElementById('region');
  const cityEl   = document.getElementById('city');
  const postalEl = document.getElementById('postal');
  if(!city || !regionEl || !cityEl) return;

  const region = regionForCity(city);
  if(!region) return;                   // saved somewhere we no longer serve

  regionEl.value = region;
  fillCitySelect(cityEl, region, city);
  const code = postalFor(region, city);
  if(postalEl && !postalEl.value && code) postalEl.value = code;
}

function prefillFromProfile(){
  const user = JSON.parse(localStorage.getItem("loggedInUser"));

  // Show email in contact row
  const emailEl = document.getElementById("contactEmailDisplay");
  const avatarEl = document.getElementById("userAvatar");
  if(emailEl){
    const email = user ? user.email : localStorage.getItem("loggedIn") === "true" ? "Logged in" : "Guest";
    emailEl.innerText = email;
    if(avatarEl && user && user.email) avatarEl.innerText = user.email[0].toUpperCase();
  }

  if(!user) return;

  if(user.fname) document.getElementById("fname").value = user.fname;
  if(user.lname) document.getElementById("lname").value = user.lname;
  if(user.phone) document.getElementById("phone").value = user.phone.replace(/^0/, "");

  const addresses = user.addresses || [];
  if(addresses.length > 0){
    document.getElementById("address").value = addresses[0].address || "";
    applySavedCity(addresses[0].city);
  }
}

function toggleInstructions(e){
  e.preventDefault();
  const area = document.getElementById("deliveryInstructions");
  area.classList.toggle("hidden");
  if(!area.classList.contains("hidden")) area.focus();
}

document.addEventListener('DOMContentLoaded', async () => {
  // Load products and ingredients from Supabase for stock/ingredient checks
  const [pRes, iRes] = await Promise.all([
    _supa.from('products').select('data'),
    _supa.from('ingredients').select('data')
  ]);
  _adminProducts    = (pRes.data || []).map(r => r.data);
  _adminIngredients = (iRes.data || []).map(r => r.data);

  loadCheckout();
  prefillFromProfile();

  setupServiceAreaSelects();

  /* Price the delivery from the address, and re-price whenever it
     changes. prefillFromProfile() may have filled it already, so quote
     once on load too. */
  ['address', 'city', 'postal', 'region'].forEach(id => {
    const el = document.getElementById(id);
    if(el){
      el.addEventListener('input', scheduleDeliveryQuote);
      el.addEventListener('change', scheduleDeliveryQuote);
    }
  });
  refreshDeliveryQuote();

  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const countEl = document.getElementById("checkoutCartCount");
  if(countEl) countEl.innerText = cart.length;

  document.querySelectorAll('input[name="payment"]').forEach(radio => {
    radio.addEventListener("change", () => updatePlaceOrderBtn());
  });

  function applyPhoneRestrictions(input){
    if(!input) return;
    input.addEventListener("keypress", function(e){
      if(!/[0-9]/.test(e.key)) e.preventDefault();
      if(this.value.length >= 10) e.preventDefault();
    });
    input.addEventListener("input", function(){
      let v = this.value.replace(/[^0-9]/g, "");
      if(v.startsWith("0")) v = v.slice(1);
      this.value = v.slice(0, 10);
    });
    input.addEventListener("paste", function(e){
      const paste = (e.clipboardData || window.clipboardData).getData("text");
      if(!/^[0-9]+$/.test(paste)) e.preventDefault();
    });
  }

  applyPhoneRestrictions(document.getElementById("phone"));
});
