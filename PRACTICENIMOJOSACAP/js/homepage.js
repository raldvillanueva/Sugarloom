let cart = 0;

const products = [
  {
    name:"Chocolate Chip Cookies Box",
    price:120,
    description:"A curated box of our classic chocolate chip cookies.",
    img:"https://www.thesevenpantry.com/cdn/shop/files/TSP-50-Shades-FOOD-Cookies-in-a-Box.jpg?v=1700633437&width=800",
    ingredients:["Wheat Flour","Butter","White Sugar","Brown Sugar","Eggs","Vanilla Extract","Chocolate Chips","Baking Soda","Salt"],
    allergens:["Wheat","Dairy","Eggs","Soy"]
  },
  {
    name:"Fudge Brownies Box",
    price:150,
    description:"A gift-ready box of our fudgy brownies.",
    img:"https://cravingskitchenph.com/cdn/shop/files/DSCF6636.jpg?v=1721989391",
    ingredients:["Wheat Flour","Butter","Sugar","Eggs","Cocoa Powder","Dark Chocolate","Vanilla Extract","Baking Powder","Salt"],
    allergens:["Wheat","Dairy","Eggs","Soy"]
  },
  {
    name:"Red Velvet Brownies Box",
    price:180,
    description:"Premium box of red velvet brownies, perfect for gifting.",
    img:"https://freshaprilflours.com/wp-content/uploads/2020/02/red-velvet-brownies-9.jpg",
    ingredients:["Wheat Flour","Butter","Sugar","Eggs","Cocoa Powder","Cream Cheese","Red Food Coloring","Vanilla Extract","Baking Powder","Salt"],
    allergens:["Wheat","Dairy","Eggs"]
  },
  {
    name:"Fudge Brownies",
    price:180,
    description:"Ultra-fudgy brownies with a crinkly top.",
    img:"https://cafedelites.com/wp-content/uploads/2016/08/Fudgy-Cocoa-Brownies-44-1.jpg",
    ingredients:["Wheat Flour","Butter","Sugar","Eggs","Cocoa Powder","Dark Chocolate","Vanilla Extract","Baking Powder","Salt"],
    allergens:["Wheat","Dairy","Eggs","Soy"]
  },
  {
    name:"Chocolate Chip Cookies",
    price:180,
    description:"Classic chewy chocolate chip cookies baked fresh daily.",
    img:"https://www.meatloafandmelodrama.com/wp-content/uploads/2024/10/best-chocolate-chip-cookies-recipe.jpg",
    ingredients:["Wheat Flour","Butter","White Sugar","Brown Sugar","Eggs","Vanilla Extract","Chocolate Chips","Baking Soda","Salt"],
    allergens:["Wheat","Dairy","Eggs","Soy"]
  }
];

//RENDERING THE PRODUCTS 
function render(){
  const container = document.getElementById("list");

  container.innerHTML = ""; // 🔥 prevent duplicates

  products.forEach((p)=>{
    container.innerHTML += `
      <div class="product-item"
        onclick="viewProduct('${p.name}', '${p.price}', '${p.img}')">
        
        <img src="${p.img}">
        <h3>${p.name}</h3>
        <p class="desc">${p.description}</p>
      </div>
    `;
  });
}

//VIEW PRODUCT 
function viewProduct(name, price, img){
  const found = products.find(p => p.name === name);
  const product = found ? { ...found } : { name, price, img, ingredients: [], allergens: [] };

  try {
    const adminDB = JSON.parse(localStorage.getItem('sl_admin_db'));
    const adminProd = adminDB?.products?.find(p => p.name === name);
    if(adminProd?.description) product.description = adminProd.description;
    if(adminProd?.price) product.price = adminProd.price;
  } catch(e){}

  localStorage.setItem("selectedProduct", JSON.stringify(product));
  window.location.href = "../pages/product-view.html";
}

function addProduct(name, price, img){
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  cart.push({ name, price, img });

  localStorage.setItem("cart", JSON.stringify(cart));

  updateCartCount();
}

function updateCartCount(){
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  document.getElementById("cart").innerText = cart.length;
}

updateCartCount();

function goToShop(){
  sessionStorage.removeItem("boxesOnlyMode");
  localStorage.removeItem("selectedCategory");
  window.location.href = "../pages/products.html";
}

function goToBoxes(){
  sessionStorage.setItem("boxesOnlyMode", "true");
  window.location.href = "../pages/products.html";
}

function goToCustomize(){
  sessionStorage.removeItem("boxesOnlyMode");
  localStorage.removeItem("selectedCategory");
  localStorage.setItem("customizeMode", "true");
  window.location.href = "../pages/products.html";
}

function goToCart(){
  window.location.href = "../pages/cart.html";
}

function goToLogin(){
  window.location.href = "../pages/login.html";
}


//LOGGED ON
function hasPendingOrders(){
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if(!user) return false;
  const orders = JSON.parse(localStorage.getItem("orders_" + user.email)) || [];
  const allTracking = JSON.parse(localStorage.getItem('sl_order_tracking') || '{}');
  return orders.some(o => {
    const t = allTracking[o.id] || o.tracking || null;
    if(t && t.status === 'COMPLETED') return false;
    const s = o.status || 'Pending';
    return s === 'Pending' || s === 'Cancel Requested';
  });
}

function updateNavUser(){
  const nav = document.getElementById("nav-actions");
  let loggedIn = localStorage.getItem("loggedIn");

  if(loggedIn === "true"){
    const badge = hasPendingOrders() ? `<span class="order-badge"></span>` : '';
    nav.innerHTML = `
    <div class="user-icon" id="userIcon">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      ${badge}
    </div>
    `;
    document.getElementById("userIcon").onclick = goToOrders;

    const notifWrap = document.getElementById("notifWrap");
    if(notifWrap) notifWrap.style.display = '';
    checkOrderNotifications();
    // Poll every 3s to pick up status changes made by admin/baker/packer
    if(!window._notifPollStarted){
      window._notifPollStarted = true;
      setInterval(checkOrderNotifications, 3000);
    }
  }
}

/* ── NOTIFICATION SYSTEM ── */
const NOTIF_STATUSES = {
  'Confirmed':        '✅ Your order #ID has been confirmed!',
  'Ready for Packing':'🧁 Your order #ID is done baking and getting packaged!',
  'Fulfilled':        '🎉 Your order #ID has been delivered. Enjoy!',
  'Cancelled':        '❌ Your order #ID was cancelled.'
};
const NOTIF_SUB_STATUSES = {
  'baking':  '🔥 Your order #ID is now being baked!',
  'packing': '📦 Your order #ID is now being packed!',
  'packed':  '✅ Your order #ID has been packed and is ready for delivery!'
};
const NOTIF_TRACKING = {
  'ASSIGNING_DRIVER': '🔍 Your order #ID has been dispatched — finding a rider!',
  'ON_GOING':         '🛵 Your order #ID is on the way!',
  'PICKED_UP':        '📍 Your order #ID has been picked up by the rider!'
};

function checkOrderNotifications(){
  const user = JSON.parse(localStorage.getItem('loggedInUser'));
  if(!user) return;

  const orders   = JSON.parse(localStorage.getItem('orders_' + user.email) || '[]');
  const seenKey  = 'sl_notif_seen_'  + user.email;
  const notifKey = 'sl_buyer_notifs_' + user.email;
  const seen     = JSON.parse(localStorage.getItem(seenKey) || '{}');
  const notifs   = JSON.parse(localStorage.getItem(notifKey) || '[]');
  const updatedSeen = Object.assign({}, seen);
  let changed = false;

  orders.forEach(o => {
    const cur    = o.status || 'Pending';
    const curSub = o.preparingSubStatus || null;
    // Use 'Pending' as baseline for orders not yet tracked so any non-Pending status
    // generates a notification even if the admin confirmed while the page was closed.
    const last    = seen.hasOwnProperty(o.id) ? seen[o.id] : 'Pending';
    const lastSub = seen[o.id + '_sub'] || null;

    // Main status change
    if(last !== cur){
      if(NOTIF_STATUSES[cur]){
        notifs.unshift({ id: Date.now() + '_' + o.id, orderId: o.id, message: NOTIF_STATUSES[cur].replace('#ID', o.id), status: cur, seen: false, ts: Date.now() });
      }
      updatedSeen[o.id] = cur;
      changed = true;
    } else if(!seen.hasOwnProperty(o.id)){
      // Order is still Pending and not yet recorded — just track it
      updatedSeen[o.id] = cur;
      changed = true;
    }

    // Sub-status change (baking, packing, packed)
    if(curSub && curSub !== lastSub && NOTIF_SUB_STATUSES[curSub]){
      notifs.unshift({ id: Date.now() + '_' + o.id + '_' + curSub, orderId: o.id, message: NOTIF_SUB_STATUSES[curSub].replace('#ID', o.id), status: curSub, seen: false, ts: Date.now() });
      updatedSeen[o.id + '_sub'] = curSub;
      changed = true;
    }

    // Lalamove tracking status change (on the way, picked up)
    const trackStatus = (o.tracking && o.tracking.status) || null;
    const lastTrack   = seen[o.id + '_track'] || null;
    if(trackStatus && trackStatus !== lastTrack && NOTIF_TRACKING[trackStatus]){
      notifs.unshift({ id: Date.now() + '_' + o.id + '_' + trackStatus, orderId: o.id, message: NOTIF_TRACKING[trackStatus].replace('#ID', o.id), status: trackStatus, seen: false, ts: Date.now() });
      updatedSeen[o.id + '_track'] = trackStatus;
      changed = true;
    }
  });

  if(changed){
    localStorage.setItem(seenKey, JSON.stringify(updatedSeen));
    localStorage.setItem(notifKey, JSON.stringify(notifs.slice(0, 20)));
  }
  renderNotifBadge(notifs);
}

function renderNotifBadge(notifs){
  const countEl = document.getElementById('notifCount');
  if(!countEl) return;
  const unseen = notifs.filter(n => !n.seen).length;
  countEl.textContent = unseen;
  countEl.classList.toggle('hidden', unseen === 0);
}

function toggleNotifPanel(){
  const panel = document.getElementById('notifPanel');
  const user  = JSON.parse(localStorage.getItem('loggedInUser'));
  if(!panel) return;

  const isOpen = !panel.classList.contains('hidden');
  panel.classList.toggle('hidden', isOpen);

  if(!isOpen){
    // Opening — render items and mark all as seen
    const notifKey = 'sl_buyer_notifs_' + (user ? user.email : '');
    const notifs   = JSON.parse(localStorage.getItem(notifKey) || '[]');
    notifs.forEach(n => n.seen = true);
    localStorage.setItem(notifKey, JSON.stringify(notifs));
    renderNotifBadge(notifs);
    renderNotifPanel(notifs);
  }
}

function renderNotifPanel(notifs){
  const container = document.getElementById('notif-items');
  if(!container) return;
  if(!notifs || notifs.length === 0){
    container.innerHTML = '<div class="notif-empty">No notifications</div>';
    return;
  }
  container.innerHTML = notifs.slice(0, 15).map(n => `
    <div class="notif-item" onclick="goToOrders()">
      <div class="notif-msg">${n.message}</div>
      <div class="notif-ts">${formatNotifTime(n.ts)}</div>
    </div>
  `).join('');
}

function formatNotifTime(ts){
  const diff = Date.now() - ts;
  if(diff < 60000)    return 'just now';
  if(diff < 3600000)  return Math.floor(diff / 60000) + 'm ago';
  if(diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return new Date(ts).toLocaleDateString('en-PH', { month:'short', day:'numeric' });
}

function clearAllNotifs(){
  const user = JSON.parse(localStorage.getItem('loggedInUser'));
  if(!user) return;
  localStorage.removeItem('sl_buyer_notifs_' + user.email);
  renderNotifBadge([]);
  renderNotifPanel([]);
}

function goToOrders(){
  window.location.href = "../pages/orders.html";
}

function logout(){
  localStorage.removeItem("loggedIn");
  location.reload();
}

// OPEN CHAT
document.getElementById("chat-toggle").onclick = () => {
  document.getElementById("chatbox").classList.toggle("hidden");
};

// ENTER KEY TO SEND
document.getElementById("user-input").addEventListener("keydown", (e) => {
  if(e.key === "Enter") sendMessage();
});

// CLOSE CHAT
document.getElementById("close-chat").onclick = () => {
  document.getElementById("chatbox").classList.add("hidden");
};

// QUICK REPLIES
function quickReply(type){
  let reply = "";

  if(type === "availability"){
    reply = "All our products are available daily! 🍪";
  }
  else if(type === "price"){
    reply = "Prices range from ₱70 to ₱250 depending on the product 💰";
  }
  else if(type === "delivery"){
    reply = "We offer same-day delivery 🚚 (Depends on the location for the fee)";
  }
  else {
    reply = "Feel free to ask anything about our products 😊";
  }

  addBotMessage(reply);
}

// SEND MESSAGE
async function sendMessage(){
  const input = document.getElementById("user-input");
  const text = input.value.trim();

  if(!text) return;

  addUserMessage(text);
  input.value = "";

  const typingId = addTypingIndicator();

  try {
    const res = await fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });
    const data = await res.json();
    removeTypingIndicator(typingId);
    addBotMessage(data.reply);
  } catch(err) {
    console.error("Chat error:", err);
    removeTypingIndicator(typingId);
    addBotMessage("Sorry, I couldn't connect to the assistant 😅");
  }
}

// ADD USER MESSAGE
function addUserMessage(text){
  const chat = document.getElementById("chat-body");
  chat.innerHTML += `<div class="user-msg">${text}</div>`;
  chat.scrollTop = chat.scrollHeight;
}

// ADD BOT MESSAGE
function addBotMessage(text){
  const chat = document.getElementById("chat-body");
  const formatted = text.replace(/\n/g, "<br>");
  chat.innerHTML += `<div class="bot-msg">${formatted}</div>`;
  chat.scrollTop = chat.scrollHeight;
}

function addTypingIndicator(){
  const chat = document.getElementById("chat-body");
  const id = "typing-" + Date.now();
  chat.innerHTML += `<div class="bot-msg" id="${id}">🧁 Typing...</div>`;
  chat.scrollTop = chat.scrollHeight;
  return id;
}

function removeTypingIndicator(id){
  const el = document.getElementById(id);
  if(el) el.remove();
}

/* RUN ON LOAD */
function revealProducts(){
  const items = document.querySelectorAll(".product-item");

  items.forEach((item, index) => {
    const windowHeight = window.innerHeight;
    const itemTop = item.getBoundingClientRect().top;

    if(itemTop < windowHeight - 100){
      setTimeout(() => {
        item.classList.add("show");
      }, index * 150); // delay for stagger effect
    }
  });
}

window.addEventListener("scroll", revealProducts);

document.addEventListener("DOMContentLoaded", () => {
  revealProducts();
});

function revealSections(){
  const sections = document.querySelectorAll(".reveal");

  sections.forEach(section => {
    const windowHeight = window.innerHeight;
    const top = section.getBoundingClientRect().top;

    if(top < windowHeight - 100){
      section.classList.add("show");
    }
  });
}

window.addEventListener("scroll", revealSections);

document.addEventListener("DOMContentLoaded", () => {
  render();              // ✅ ONLY ONCE
  updateNavUser();       // ✅ login fix
  updateCartCount();     // ✅ cart count
  revealProducts();      // ✅ animation
  revealSections();      // ✅ sections

  // Poll for new order notifications every 30 seconds
  setInterval(checkOrderNotifications, 30000);

  // Close notification panel when clicking outside
  document.addEventListener('click', e => {
    const wrap = document.getElementById('notifWrap');
    if(wrap && !wrap.contains(e.target)){
      const panel = document.getElementById('notifPanel');
      if(panel) panel.classList.add('hidden');
    }
  });
});

// Matcha Cookies 
function orderMatcha(){
  const product = {
    name: "Matcha Cookies",
    price: 130,
    img: "https://teakandthyme.com/wp-content/uploads/2023/09/matcha-white-chocolate-cookies-DSC_5105-1x1-1200.jpg"
  };

  localStorage.setItem("selectedProduct", JSON.stringify(product));

  window.location.href = "../pages/product-view.html";
}

/* FAQ ACCORDION */
function toggleFaq(el) {
  const item = el.closest(".faq-item");
  item.classList.toggle("open");
}

/* TOAST NOTIFICATION */
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

/* CONTACT INQUIRY */
function sendInquiry() {
  const name = document.getElementById("inq-name").value.trim();
  const contact = document.getElementById("inq-contact").value.trim();
  const msg = document.getElementById("inq-msg").value.trim();

  if (!name || !contact || !msg) {
    showToast("Please fill in all fields before sending.", "error");
    return;
  }

  document.getElementById("inq-name").value = "";
  document.getElementById("inq-contact").value = "";
  document.getElementById("inq-msg").value = "";
  showToast("Message sent! We'll get back to you within 24 hours 🍪", "success");
}



