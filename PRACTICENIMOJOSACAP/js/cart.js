/* ── cart.js ── */

let _cartAdminProducts   = [];
let _cartAdminIngredients = [];

// NAV
function gotoHomePage(){
  window.location.href = "../pages/homepage.html";
}

function goToLogin(){
  window.location.href = "../pages/login.html";
}

// RENDER CART ITEMS
function renderCart(){
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  // Sync prices from Supabase-cached products so cart always reflects current pricing
  if (_cartAdminProducts.length) {
    let changed = false;
    cart.forEach(item => {
      const adminProd = _cartAdminProducts.find(p => p.name.toLowerCase() === item.name.toLowerCase());
      if (adminProd && adminProd.price !== item.price) {
        item.price = adminProd.price;
        changed = true;
      }
    });
    if (changed) localStorage.setItem('cart', JSON.stringify(cart));
  }

  const container = document.getElementById("cart-items");

  if(cart.length === 0){
    container.innerHTML = `<p style="color:var(--text-muted);font-size:15px;">Your cart is empty.</p>`;
    document.getElementById("total").innerText = "0";
    document.getElementById("checkoutBtn").disabled = true;
    return;
  }

  document.getElementById("checkoutBtn").disabled = false;
  container.innerHTML = "";

  cart.forEach(item => {
    item.qty = item.qty || 1;
    container.innerHTML += `
      <div class="item">
        <img src="${item.img}" alt="${item.name}">
        <div class="item-info">
          <h3>${item.name}</h3>
          <p class="desc">₱${item.price} each</p>
          <div class="controls">
            <button onclick="changeQty('${item.name}', -1)" ${item.qty <= 1 ? 'disabled style="opacity:0.35;cursor:not-allowed;"' : ''}>−</button>
            <input type="number" id="qty-${item.name.replace(/\s+/g,'_')}" class="qty-input" value="${item.qty}" min="1"
              oninput="setQty('${item.name}', this)"
              onblur="if(!this.value||+this.value<1){this.value=1;setQty('${item.name}',this)}">
            <button onclick="changeQty('${item.name}', 1)">+</button>
          </div>
          <button class="remove-btn" onclick="removeItem('${item.name}')">Remove</button>
        </div>
      </div>
    `;
  });

  updateTotal();
}

// UPDATE TOTAL
function updateTotal(){
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let total = cart.reduce((sum, item) => sum + item.price * (item.qty || 1), 0);
  document.getElementById("total").innerText = total;
}

// CHANGE QTY (via +/- buttons)
function changeQty(name, delta){
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let item = cart.find(i => i.name === name);
  if(!item) return;
  item.qty = Math.max(1, (item.qty || 1) + delta);
  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
}

// SET QTY (via direct input)
function setQty(name, input){
  const val = parseInt(input.value);
  if(!val || val < 1){ input.value = 1; }
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let item = cart.find(i => i.name === name);
  if(!item) return;
  item.qty = Math.max(1, val || 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  updateTotal();
}

// REMOVE ITEM
function removeItem(name){
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart = cart.filter(i => i.name !== name);
  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
}

// SAVE CONTACT METHOD
function saveContactMethod(val){
  localStorage.setItem("contactMethod", val);
}

// SAVE TIME SLOT
function saveTimeSlot(val){
  localStorage.setItem("preferredTime", val);
}

// TIME SLOT FILTER — disable slots that have already passed when date is today
const TIME_SLOTS = [
  { value: "8:00 AM – 11:00 AM",  startHour: 8  },
  { value: "11:00 AM – 2:00 PM",  startHour: 11 },
  { value: "2:00 PM – 5:00 PM",   startHour: 14 },
];

function filterTimeSlots(selectedDateStr){
  const sel = document.getElementById("preferredTime");
  if(!sel) return;

  const now = new Date();
  const todayStr = now.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  const isToday = selectedDateStr === todayStr;
  const currentHour = now.getHours();

  TIME_SLOTS.forEach(slot => {
    const opt = [...sel.options].find(o => o.value === slot.value);
    if(!opt) return;
    const isPast = isToday && slot.startHour <= currentHour;
    opt.disabled = isPast;
    opt.style.color = isPast ? '#aaa' : '';
  });

  // Clear selected value if the saved slot is now disabled
  const currentVal = sel.value;
  const currentSlot = TIME_SLOTS.find(s => s.value === currentVal);
  if(currentSlot && isToday && currentSlot.startHour <= currentHour){
    sel.value = '';
    localStorage.removeItem("preferredTime");
  }
}

// CHECKOUT
function checkout(){
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  if(cart.length === 0){
    showMsg("Your cart is empty!");
    return;
  }

  const minQtyError = document.getElementById("minQtyError");
  const isBoxOnly = cart.every(i => i.name && i.name.toLowerCase().includes("box"));
  const totalCartQty = cart.reduce((sum, i) => sum + (i.qty || 1), 0);
  if(!isBoxOnly && totalCartQty < 4){
    minQtyError.innerText = "A minimum of 4 pcs is required to checkout (boxes are exempt).";
    minQtyError.style.display = "block";
    return;
  }
  minQtyError.innerText = "";
  minQtyError.style.display = "none";

  const adminProducts = _cartAdminProducts;
  const stockErrors = [];
  const todayStr = new Date().toISOString().slice(0,10);
  cart.forEach(item => {
    const match = adminProducts.find(p => p.name.toLowerCase() === item.name.toLowerCase());
    if(match){
      const limit = match.dailyLimit ?? match.stock ?? 0;
      const soldToday = (match.lastResetDate === todayStr) ? (match.soldToday || 0) : 0;
      const available = Math.max(0, limit - soldToday);
      if((item.qty || 1) > available){
        stockErrors.push(`<strong>${item.name}</strong>: you ordered ${item.qty || 1} but only ${available} left for today.`);
      }
    }
  });
  const stockError = document.getElementById("stockError");
  if(stockErrors.length > 0){
    const minRestockDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    minRestockDate.setHours(0, 0, 0, 0);

    const fp = document.getElementById("preferredDate")._flatpickr;
    const selectedDate = fp?.selectedDates[0] || null;

    // If they already picked a date >= today+2, let them through
    if(selectedDate && selectedDate >= minRestockDate){
      stockError.style.display = "none";
    } else {
      // Push flatpickr min and clear any too-early date
      if(fp){
        fp.set('minDate', minRestockDate);
        if(selectedDate && selectedDate < minRestockDate){
          fp.clear();
          localStorage.removeItem("preferredDate");
          document.getElementById("timepickerWrap").classList.add("hidden");
        }
      }
      const minLabel = minRestockDate.toLocaleDateString('en-PH', { month:'long', day:'numeric', year:'numeric' });
      stockError.innerHTML = `Some items have reached their daily order limit:<br>${stockErrors.join('<br>')}
        <br><span style="font-weight:500">Please choose a delivery date from <u>${minLabel}</u> or later, or reduce the quantity.</span>`;
      stockError.style.display = "block";
      return;
    }
  } else {
    stockError.style.display = "none";
  }

  const ingredientError  = document.getElementById('ingredientError');
  const adminIngredients = _cartAdminIngredients;
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
    const fp = document.getElementById("preferredDate")?._flatpickr;
    const selDate = fp?.selectedDates[0];
    if(fp) fp.set('minDate', minRestockDate);
    if(!selDate || selDate < minRestockDate){
      const minLabel = minRestockDate.toLocaleDateString('en-PH', { month:'long', day:'numeric', year:'numeric' });
      if(selDate && selDate < minRestockDate){ fp.clear(); localStorage.removeItem("preferredDate"); document.getElementById("timepickerWrap")?.classList.add("hidden"); }
      ingredientError.innerHTML = `Sorry, we currently don't have enough ingredients to fulfill your order. Please pick a delivery date from <u><strong>${minLabel}</strong></u> or later.`;
      ingredientError.style.display = "block";
      return;
    } else {
      ingredientError.style.display = "none";
    }
  } else {
    ingredientError.style.display = "none";
  }

  const preferredDate = document.getElementById("preferredDate").value.trim();
  const preferredTime = document.getElementById("preferredTime").value.trim();
  const contactMethod = document.getElementById("contactMethod").value.trim();
  const dateError = document.getElementById("dateError");
  const timeError = document.getElementById("timeError");
  const contactError = document.getElementById("contactError");

  dateError.innerText = "";
  timeError.innerText = "";
  contactError.innerText = "";

  let hasError = false;

  if(!preferredDate){
    dateError.innerText = "Please select a preferred delivery date.";
    hasError = true;
  } else {
    const selectedDate = new Date(preferredDate);
    const totalAmt = cart.reduce((sum, item) => sum + item.price * (item.qty || 1), 0);
    if(totalAmt >= 2000){
      const minAllowed = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      minAllowed.setHours(0, 0, 0, 0);
      if(selectedDate < minAllowed){
        dateError.innerText = "Bulk orders (₱2,000+) require at least 2 days advance notice for the delivery date.";
        hasError = true;
      }
    }
  }

  if(!preferredTime){
    timeError.innerText = "Please select a preferred delivery time.";
    hasError = true;
  }

  if(!contactMethod){
    contactError.innerText = "Please enter your preferred contact method.";
    hasError = true;
  }

  if(hasError) return;

  const loggedIn = localStorage.getItem("loggedIn");
  if(loggedIn !== "true"){
    showLoginModal();
    return;
  }

  window.location.href = "../pages/checkout.html";
}

// LOGIN MODAL
function showLoginModal(){
  document.getElementById("loginModal").classList.add("show");
}

function closeLoginModal(){
  document.getElementById("loginModal").classList.remove("show");
}

// MSG
function showMsg(text){
  const msg = document.getElementById("msg");
  msg.innerText = text;
  msg.classList.add("show");
  setTimeout(() => msg.classList.remove("show"), 2500);
}

// INIT
document.addEventListener('DOMContentLoaded', async () => {
  // Load products and ingredients from Supabase for price sync and stock checks
  try {
    const [pRes, iRes] = await Promise.all([
      _supa.from('products').select('data'),
      _supa.from('ingredients').select('data')
    ]);
    _cartAdminProducts    = (pRes.data || []).map(r => r.data);
    _cartAdminIngredients = (iRes.data || []).map(r => r.data);
  } catch(e) {}

  renderCart();

  // restore saved contact method
  const saved = localStorage.getItem("contactMethod");
  if(saved) document.getElementById("contactMethod").value = saved;

  // flatpickr date picker
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 2);

  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartTotal = cart.reduce((sum, item) => sum + item.price * (item.qty || 1), 0);
  const isBulk = cartTotal >= 2000;
  const minDate = isBulk ? new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) : "today";

  flatpickr("#preferredDate", {
    minDate: minDate,
    maxDate: maxDate,
    dateFormat: "F j, Y",
    disableMobile: true,
    showMonths: 1,
    onReady: function(_dates, _str, instance){
      instance.calendarContainer.querySelector('.numInputWrapper')?.remove();
    },
    onMonthChange: function(_dates, _str, instance){
      instance.calendarContainer.querySelector('.numInputWrapper')?.remove();
    },
    onChange: function(_selectedDates, dateStr){
      localStorage.setItem("preferredDate", dateStr);
      const wrap = document.getElementById("timepickerWrap");
      if(dateStr){ wrap.classList.remove("hidden"); filterTimeSlots(dateStr); }
      else { wrap.classList.add("hidden"); }
    }
  });

  // restore saved date
  const savedDate = localStorage.getItem("preferredDate");
  if(savedDate){
    const fp = document.getElementById("preferredDate")._flatpickr;
    if(fp) fp.setDate(savedDate, false);
    document.getElementById("timepickerWrap").classList.remove("hidden");
    filterTimeSlots(savedDate);
  }

  // restore saved time slot
  const savedTime = localStorage.getItem("preferredTime");
  if(savedTime) document.getElementById("preferredTime").value = savedTime;
});
