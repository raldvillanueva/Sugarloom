/* =============================================
   SUGARLOOM ADMIN — admin.js
   ============================================= */

function toggleLoginPw(){
  const input = document.getElementById('login-password');
  const icon  = document.getElementById('login-pw-icon');
  const show  = input.type === 'password';
  input.type  = show ? 'text' : 'password';
  icon.className = show ? 'bx bx-show' : 'bx bx-hide';
}

/* ---- ORDER STATUS EMAIL ----
   Sends via the Node.js server (js/server.js) using nodemailer.
   Make sure the server is running: node js/server.js
   ------------------------------------------------------------ */
function sendStatusEmail(order, status){
  if(!order.customerEmail || order.customerEmail === 'guest') return;

  const messages = {
    'Confirmed':      'Great news! Your order has been confirmed. We\'re preparing to bake your treats fresh.',
    'Preparing':      'We\'re baking your order right now! Your goodies will be ready soon.',
    'Packing':        'Your order is done baking and is now being packed for delivery! 📦',
    'Finding Driver': 'Your order is packed and ready! We\'re finding a rider to deliver it to you.',
    'On the Way':     'Your rider has picked up your order and is heading your way! 🛵',
    'Fulfilled':      'Your order has been delivered! We hope you enjoy every bite. 🍪',
    'Cancelled':      'Your order has been cancelled. If you have any questions, please reach out to us.',
    'Pending':        'Your cancellation request was not accepted. Your order is back to Pending.'
  };

  fetch('http://localhost:5000/send-order-notification', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to_email:       order.customerEmail,
      to_name:        order.customer || 'Valued Customer',
      order_id:       order.id,
      status:         status,
      status_message: messages[status] || `Your order status has been updated to: ${status}.`,
      items:          order.items || [],
      order_total:    '₱' + (order.total || 0).toLocaleString(),
      website_url:    window.location.origin
    })
  }).catch(() => {}); // silently skip if server is unreachable
}

/* ---- PRODUCT RECIPES (qty per unit sold) ---- */
const PRODUCT_RECIPES = {
  p1:  [{ ingredientId:'i1',qty:50 },{ ingredientId:'i2',qty:20 },{ ingredientId:'i3',qty:15 },{ ingredientId:'i4',qty:20 },{ ingredientId:'i5',qty:1 },{ ingredientId:'i8',qty:3 },{ ingredientId:'i19',qty:1 },{ ingredientId:'i21',qty:2 }],
  p2:  [{ ingredientId:'i1',qty:40 },{ ingredientId:'i9',qty:50 },{ ingredientId:'i2',qty:20 },{ ingredientId:'i4',qty:25 },{ ingredientId:'i5',qty:1 },{ ingredientId:'i8',qty:3 },{ ingredientId:'i20',qty:2 },{ ingredientId:'i21',qty:2 }],
  p3:  [{ ingredientId:'i1',qty:50 },{ ingredientId:'i2',qty:20 },{ ingredientId:'i3',qty:25 },{ ingredientId:'i5',qty:1 },{ ingredientId:'i8',qty:3 },{ ingredientId:'i10',qty:10 },{ ingredientId:'i18',qty:2 },{ ingredientId:'i19',qty:1 }],
  p4:  [{ ingredientId:'i1',qty:40 },{ ingredientId:'i2',qty:40 },{ ingredientId:'i3',qty:60 },{ ingredientId:'i5',qty:1 },{ ingredientId:'i7',qty:20 },{ ingredientId:'i8',qty:5 },{ ingredientId:'i18',qty:1 }],
  p5:  [{ ingredientId:'i1',qty:40 },{ ingredientId:'i2',qty:40 },{ ingredientId:'i3',qty:50 },{ ingredientId:'i5',qty:1 },{ ingredientId:'i7',qty:30 },{ ingredientId:'i8',qty:5 },{ ingredientId:'i16',qty:1 }],
  p6:  [{ ingredientId:'i1',qty:40 },{ ingredientId:'i2',qty:35 },{ ingredientId:'i3',qty:50 },{ ingredientId:'i5',qty:1 },{ ingredientId:'i6',qty:30 },{ ingredientId:'i7',qty:10 },{ ingredientId:'i15',qty:5 },{ ingredientId:'i16',qty:1 },{ ingredientId:'i17',qty:5 }],
  p7:  [{ ingredientId:'i1',qty:40 },{ ingredientId:'i2',qty:25 },{ ingredientId:'i3',qty:40 },{ ingredientId:'i5',qty:1 },{ ingredientId:'i13',qty:30 },{ ingredientId:'i8',qty:5 },{ ingredientId:'i11',qty:3 },{ ingredientId:'i14',qty:1 }],
  p8:  [{ ingredientId:'i1',qty:40 },{ ingredientId:'i2',qty:25 },{ ingredientId:'i3',qty:40 },{ ingredientId:'i5',qty:1 },{ ingredientId:'i13',qty:30 },{ ingredientId:'i7',qty:20 },{ ingredientId:'i11',qty:3 },{ ingredientId:'i14',qty:1 }],
  p9:  [{ ingredientId:'i1',qty:40 },{ ingredientId:'i2',qty:25 },{ ingredientId:'i3',qty:30 },{ ingredientId:'i5',qty:1 },{ ingredientId:'i13',qty:30 },{ ingredientId:'i12',qty:20 },{ ingredientId:'i11',qty:3 },{ ingredientId:'i14',qty:1 }],
  p10: [{ ingredientId:'i1',qty:300 },{ ingredientId:'i2',qty:120 },{ ingredientId:'i3',qty:90 },{ ingredientId:'i4',qty:120 },{ ingredientId:'i5',qty:4 },{ ingredientId:'i8',qty:18 },{ ingredientId:'i19',qty:6 },{ ingredientId:'i21',qty:12 }],
  p11: [{ ingredientId:'i1',qty:240 },{ ingredientId:'i2',qty:240 },{ ingredientId:'i3',qty:360 },{ ingredientId:'i5',qty:7 },{ ingredientId:'i7',qty:120 },{ ingredientId:'i8',qty:30 },{ ingredientId:'i18',qty:6 }],
  p12: [{ ingredientId:'i1',qty:240 },{ ingredientId:'i2',qty:210 },{ ingredientId:'i3',qty:300 },{ ingredientId:'i5',qty:7 },{ ingredientId:'i6',qty:180 },{ ingredientId:'i7',qty:60 },{ ingredientId:'i15',qty:30 },{ ingredientId:'i16',qty:6 },{ ingredientId:'i17',qty:30 }],
};

/* ---- SEED DATA ---- */
const SEED = {
  users: [
    { id:'u1', fname:'Admin',  lname:'SugarLoom', email:'admin@sugarloom.ph',  password:'admin123',  role:'Administrator', active:true },
    { id:'u2', fname:'Baker',  lname:'SugarLoom', email:'baker@sugarloom.ph',  password:'baker123',  role:'Baker',         active:true },
    { id:'u3', fname:'Packer', lname:'SugarLoom', email:'packer@sugarloom.ph', password:'packer123', role:'Packer',        active:true },
  ],
  products: [
    { id:'p1',  name:'Chocolate Chip Cookies', category:'Cookies',  flavor:'Chocolate', size:'Regular', price:70,  dailyLimit:50, soldToday:0, lastResetDate:'', threshold:10, description:'Classic chewy chocolate chip cookies baked fresh daily.', active:true, img:'https://www.meatloafandmelodrama.com/wp-content/uploads/2024/10/best-chocolate-chip-cookies-recipe.jpg', recipe: PRODUCT_RECIPES.p1 },
    { id:'p2',  name:'Oatmeal Cookies',         category:'Cookies',  flavor:'Oatmeal',   size:'Regular', price:70,  dailyLimit:50, soldToday:0, lastResetDate:'', threshold:10, description:'Hearty oatmeal cookies with chocolate chips.', active:true, img:'https://whatsgabycooking.com/wp-content/uploads/2023/04/WGC-__-Oatmeal-Chocolate-Chip-Cookies-1200x800-1.jpg', recipe: PRODUCT_RECIPES.p2 },
    { id:'p3',  name:'Matcha Cookies',           category:'Cookies',  flavor:'Matcha',    size:'Regular', price:70,  dailyLimit:50, soldToday:0, lastResetDate:'', threshold:8,  description:'Chewy matcha-infused cookie with a rich earthy taste.', active:true, img:'https://teakandthyme.com/wp-content/uploads/2023/09/matcha-white-chocolate-cookies-DSC_5105-1x1-1200.jpg', recipe: PRODUCT_RECIPES.p3 },
    { id:'p4',  name:'Fudge Brownies',           category:'Brownies', flavor:'Chocolate', size:'Regular', price:80,  dailyLimit:50, soldToday:0, lastResetDate:'', threshold:8,  description:'Ultra-fudgy brownies with a crinkly top.', active:true, img:'https://cafedelites.com/wp-content/uploads/2016/08/Fudgy-Cocoa-Brownies-44-1.jpg', recipe: PRODUCT_RECIPES.p4 },
    { id:'p5',  name:'Dark Chocolate Brownies',  category:'Brownies', flavor:'Dark Choco',size:'Regular', price:80,  dailyLimit:50, soldToday:0, lastResetDate:'', threshold:8,  description:'Intense dark chocolate brownies for true choco lovers.', active:true, img:'https://organicallyaddison.com/wp-content/uploads/2022/09/2022-09-04_17-44-12_390.jpeg', recipe: PRODUCT_RECIPES.p5 },
    { id:'p6',  name:'Red Velvet Brownies',      category:'Brownies', flavor:'Red Velvet',size:'Regular', price:80,  dailyLimit:30, soldToday:0, lastResetDate:'', threshold:6,  description:'Beautiful red velvet brownies with cream cheese swirl.', active:true, img:'https://cakesbymk.com/wp-content/uploads/2025/02/Template-Size-for-Blog-21.jpg', recipe: PRODUCT_RECIPES.p6 },
    { id:'p7',  name:'Vanilla Cupcake',          category:'Cupcakes', flavor:'Vanilla',   size:'Regular', price:75,  dailyLimit:50, soldToday:0, lastResetDate:'', threshold:8,  description:'Light and fluffy vanilla cupcake with buttercream frosting.', active:true, img:'https://clipart-library.com/2024/image-of-a-cupcake/image-of-a-cupcake-4.jpg', recipe: PRODUCT_RECIPES.p7 },
    { id:'p8',  name:'Chocolate Cupcake',        category:'Cupcakes', flavor:'Chocolate', size:'Regular', price:75,  dailyLimit:50, soldToday:0, lastResetDate:'', threshold:8,  description:'Rich chocolate cupcake topped with chocolate ganache frosting.', active:true, img:'https://images.unsplash.com/photo-1606313564200-e75d5e30476c', recipe: PRODUCT_RECIPES.p8 },
    { id:'p9',  name:'Strawberry Cupcake',       category:'Cupcakes', flavor:'Strawberry',size:'Regular', price:75,  dailyLimit:50, soldToday:0, lastResetDate:'', threshold:6,  description:'Fresh strawberry cupcake with strawberry cream frosting.', active:true, img:'https://images.unsplash.com/photo-1607478900766-efe13248b125', recipe: PRODUCT_RECIPES.p9 },
    { id:'p10', name:'Chocolate Chip Cookies Box',category:'Boxes',   flavor:'Chocolate', size:'Box of 6',price:250, dailyLimit:20, soldToday:0, lastResetDate:'', threshold:5,  description:'A curated box of our classic chocolate chip cookies.', active:true, img:'https://www.thesevenpantry.com/cdn/shop/files/TSP-50-Shades-FOOD-Cookies-in-a-Box.jpg?v=1700633437&width=800', recipe: PRODUCT_RECIPES.p10 },
    { id:'p11', name:'Fudge Brownies Box',        category:'Boxes',   flavor:'Chocolate', size:'Box of 6',price:250, dailyLimit:20, soldToday:0, lastResetDate:'', threshold:5,  description:'A gift-ready box of our fudgy brownies.', active:true, img:'https://cravingskitchenph.com/cdn/shop/files/DSCF6636.jpg?v=1721989391', recipe: PRODUCT_RECIPES.p11 },
    { id:'p12', name:'Red Velvet Brownies Box',   category:'Boxes',   flavor:'Red Velvet',size:'Box of 6',price:250, dailyLimit:20, soldToday:0, lastResetDate:'', threshold:5,  description:'Premium box of red velvet brownies, perfect for gifting.', active:true, img:'https://freshaprilflours.com/wp-content/uploads/2020/02/red-velvet-brownies-9.jpg', recipe: PRODUCT_RECIPES.p12 }
  ],
  ingredients: [
    { id:'i1', name:'All-purpose Flour', unit:'g',     stock:25000, threshold:10000,category:'General' },
    { id:'i2', name:'Butter',            unit:'g',     stock:8000,  threshold:4000, category:'General' },
    { id:'i3', name:'White Sugar',       unit:'g',     stock:15000, threshold:5000, category:'General' },
    { id:'i5', name:'Eggs',              unit:'pcs',   stock:72,    threshold:36,   category:'General' },
    { id:'i8', name:'Vanilla Extract',   unit:'ml',    stock:300,   threshold:100,  category:'General' },
    { id:'i4', name:'Brown Sugar',       unit:'g',     stock:8000,  threshold:4000, category:'Cookies' },
    { id:'i9', name:'Oats',              unit:'g',     stock:5000,  threshold:2000, category:'Cookies' },
    { id:'i10',name:'Matcha Powder',     unit:'g',     stock:2000,  threshold:1000, category:'Cookies' },
    { id:'i18',name:'Baking Powder',     unit:'g',     stock:400,   threshold:80,   category:'Cookies' },
    { id:'i19',name:'Salt',              unit:'g',     stock:300,   threshold:50,   category:'Cookies' },
    { id:'i20',name:'Cinnamon',          unit:'g',     stock:200,   threshold:40,   category:'Cookies' },
    { id:'i21',name:'Baking Soda',       unit:'g',     stock:350,   threshold:70,   category:'Cookies' },
    { id:'i7', name:'Cocoa Powder',      unit:'g',     stock:4000,  threshold:2000, category:'Brownies' },
    { id:'i6', name:'Cream Cheese',      unit:'g',     stock:2000,  threshold:2000, category:'Brownies' },
    { id:'i15',name:'Vinegar',           unit:'ml',    stock:500,   threshold:100,  category:'Brownies' },
    { id:'i16',name:'Salt',              unit:'g',     stock:300,   threshold:50,   category:'Brownies' },
    { id:'i17',name:'Red Food Coloring', unit:'ml',    stock:150,   threshold:30,   category:'Brownies' },
    { id:'i11',name:'Baking Powder',     unit:'g',     stock:500,   threshold:100,  category:'Cupcakes' },
    { id:'i12',name:'Strawberry Jam',    unit:'g',     stock:3000,  threshold:1000, category:'Cupcakes' },
    { id:'i13',name:'Milk',              unit:'ml',    stock:2000,  threshold:500,  category:'Cupcakes' },
    { id:'i14',name:'Salt',              unit:'g',     stock:300,   threshold:50,   category:'Cupcakes' }
  ],
  orders: [],
  transactions: [],
  stockLog: [],
  supplierOrders: []
};

function daysAgo(n){
  const d = new Date();
  d.setDate(d.getDate()-n);
  return d.toISOString();
}

function todayDate(){ return new Date().toISOString().slice(0,10); }

function checkDailyReset(){
  const today = todayDate();
  let changed = false;
  DB.products.forEach(p => {
    if((p.lastResetDate||'') !== today){
      p.soldToday = 0;
      p.lastResetDate = today;
      changed = true;
    }
  });
  if(changed) saveDB();
}

/* ---- STATE ---- */
let DB = {};
let _trackingCache = {}; // Supabase order_tracking cache: order_id → data
let currentUser = null;
let orderFilter = 'All';
let ingCatFilter = 'All';
let reportPeriod = 'day';
let histFilterState = { tx: 'all', sales: 'all', ing: 'all' };
let ingHistCat = 'All';
let revenueChartPeriod = 'weekly';
let revenueChartInst = null, categoryChartInst = null, reportChartInst = null, bestSellerChartInst = null;
let currentOrderId = null;
let notifList = [];

/* ---- INIT ---- */
const DB_VERSION = '11';

async function initDB(){
  try {
    const toArr = res => (res.data || []).map(row => row.data);
    const [pRes, iRes, uRes, oRes, txRes, slRes] = await Promise.all([
      _supa.from('products').select('data'),
      _supa.from('ingredients').select('data'),
      _supa.from('admin_users').select('data'),
      _supa.from('orders').select('data').order('date', { ascending: false }),
      _supa.from('transactions').select('data').order('date', { ascending: false }),
      _supa.from('stock_log').select('data').order('date', { ascending: false })
    ]);

    if (!pRes.data || pRes.data.length === 0) {
      // First run — seed the Supabase tables
      const seed = JSON.parse(JSON.stringify(SEED));
      await Promise.all([
        _supa.from('products').insert(seed.products.map(d => ({ id: d.id, data: d }))),
        _supa.from('ingredients').insert(seed.ingredients.map(d => ({ id: d.id, data: d }))),
        _supa.from('admin_users').insert(seed.users.map(d => ({ id: d.id, data: d })))
      ]);
      DB = { ...seed, orders: [], transactions: [], stockLog: [], supplierOrders: [] };
    } else {
      DB = {
        users:          toArr(uRes).length ? toArr(uRes) : SEED.users,
        products:       toArr(pRes),
        ingredients:    toArr(iRes),
        orders:         toArr(oRes),
        transactions:   toArr(txRes),
        stockLog:       toArr(slRes),
        supplierOrders: []
      };
      // Patch recipes for products that are missing them
      let patched = false;
      DB.products.forEach(p => {
        if (!p.recipe && PRODUCT_RECIPES[p.id]) { p.recipe = PRODUCT_RECIPES[p.id]; patched = true; }
      });
      if (patched) saveDB();
    }
  } catch (err) {
    console.error('Supabase initDB error:', err);
    DB = JSON.parse(JSON.stringify(SEED));
    DB.orders = []; DB.transactions = []; DB.stockLog = []; DB.supplierOrders = [];
  }

  // Prime the tracking cache so it's available before first poll
  await refreshTrackingCache().catch(() => {});
  checkDailyReset();
}

function saveDB(){
  if (!DB.stockLog) DB.stockLog = [];

  // Persist all tables to Supabase (fire-and-forget so callers stay synchronous)
  const rows = (arr, extraFn) => arr.map(d => ({ id: d.id, data: d, ...(extraFn ? extraFn(d) : {}) }));

  Promise.all([
    DB.products.length     && _supa.from('products').upsert(rows(DB.products), { onConflict: 'id' }),
    DB.ingredients.length  && _supa.from('ingredients').upsert(rows(DB.ingredients), { onConflict: 'id' }),
    DB.users.length        && _supa.from('admin_users').upsert(rows(DB.users), { onConflict: 'id' }),
    DB.orders.length       && _supa.from('orders').upsert(
      DB.orders.map(o => ({
        id:             o.id,
        customer_email: o.customerEmail || '',
        status:         o.status || 'Pending',
        date:           o.date   || new Date().toISOString(),
        data:           o
      })), { onConflict: 'id' }),
    DB.transactions.length && _supa.from('transactions').upsert(rows(DB.transactions), { onConflict: 'id' }),
    DB.stockLog.length     && _supa.from('stock_log').upsert(rows(DB.stockLog), { onConflict: 'id' })
  ].filter(Boolean)).catch(err => console.error('saveDB error:', err));
}

function logStock({ type, itemId, itemName, unit, op, before, after, note, ref }){
  if(!DB.stockLog) DB.stockLog = [];
  DB.stockLog.push({
    id:       'SL-' + Date.now() + '-' + Math.random().toString(36).slice(2,6),
    date:     new Date().toISOString(),
    type,        // 'product' | 'ingredient'
    itemId,
    itemName,
    unit:     unit || 'units',
    op,          // 'add' | 'sub' | 'set' | 'order'
    before,
    after,
    change:   after - before,
    note:     note || '',
    ref:      ref  || ''
  });
}

function checkLogin(){
  const sess = sessionStorage.getItem('sl_admin_sess');
  if(sess){
    currentUser = JSON.parse(sess);
    showApp();
  }
}

function adminLogin(){
  const email = document.getElementById('login-email').value.trim();
  const pw    = document.getElementById('login-password').value;
  const u = DB.users.find(u=>u.email===email && u.password===pw && u.active);
  if(!u){ showLoginError('Invalid credentials'); return; }
  currentUser = u;
  sessionStorage.setItem('sl_admin_sess', JSON.stringify(u));
  showApp();
}
function showLoginError(msg){
  const el = document.getElementById('login-error');
  el.textContent = msg; el.classList.remove('hidden');
  setTimeout(()=>el.classList.add('hidden'), 3000);
}
function adminLogout(){
  sessionStorage.removeItem('sl_admin_sess');
  location.reload();
}

/* =============================================
   FORGOT PASSWORD
   ============================================= */
let fpVerified = false;

function fpShow(panelId){
  ['fp-panel-login','fp-panel-step1','fp-panel-step2','fp-panel-step3'].forEach(id=>{
    document.getElementById(id).classList.add('hidden');
  });
  document.getElementById(panelId).classList.remove('hidden');
}

function fpShowMsg(elId, text, type='error'){
  const el = document.getElementById(elId);
  el.textContent = text;
  el.className = 'login-error ' + (type==='success' ? 'success' : '');
  el.classList.remove('hidden');
  if(type !== 'success') setTimeout(()=>el.classList.add('hidden'), 3000);
}

function fpSendOTP(){
  const email = document.getElementById('fp-email').value.trim();
  if(!email){ fpShowMsg('fp-msg','Enter your email first'); return; }
  const exists = DB.users.find(u=>u.email.toLowerCase()===email.toLowerCase());
  if(!exists){ fpShowMsg('fp-msg','No admin account found for this email'); return; }

  fetch('http://127.0.0.1:5000/send-otp',{
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ email })
  })
  .then(r=>r.json())
  .then(data=>{
    if(data.success){
      fpShowMsg('fp-msg','OTP sent to your email','success');
      document.getElementById('fp-email-label').textContent = email;
      setTimeout(()=>fpShow('fp-panel-step2'), 1000);
    } else {
      fpShowMsg('fp-msg','Failed to send OTP. Try again.');
    }
  })
  .catch(()=>fpShowMsg('fp-msg','Server error. Make sure the server is running.'));
}

function fpVerifyOTP(){
  const email = document.getElementById('fp-email').value.trim();
  const otp   = document.getElementById('fp-otp').value.trim();
  if(!otp){ fpShowMsg('fp-msg2','Enter the OTP code'); return; }

  fetch('http://127.0.0.1:5000/verify-otp',{
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ email, otp })
  })
  .then(r=>r.json())
  .then(data=>{
    if(data.success){
      fpVerified = true;
      fpShowMsg('fp-msg2','OTP verified!','success');
      setTimeout(()=>fpShow('fp-panel-step3'), 1000);
    } else {
      fpShowMsg('fp-msg2','Invalid OTP. Please try again.');
    }
  })
  .catch(()=>fpShowMsg('fp-msg2','Server error. Make sure the server is running.'));
}

function fpResetPassword(){
  const email   = document.getElementById('fp-email').value.trim();
  const newpass = document.getElementById('fp-newpass').value;
  const confirm = document.getElementById('fp-confirmpass').value;

  if(!fpVerified){ fpShowMsg('fp-msg3','Please verify OTP first'); return; }
  if(!newpass || newpass.length < 6){ fpShowMsg('fp-msg3','Password must be at least 6 characters'); return; }
  if(newpass !== confirm){ fpShowMsg('fp-msg3','Passwords do not match'); return; }

  const u = DB.users.find(u=>u.email.toLowerCase()===email.toLowerCase());
  if(!u){ fpShowMsg('fp-msg3','Account not found'); return; }

  u.password = newpass;
  saveDB();
  fpVerified = false;
  fpShowMsg('fp-msg3','Password updated! Redirecting...','success');
  setTimeout(()=>{ fpShow('fp-panel-login'); }, 1800);
}
function showApp(){
  document.getElementById('login-overlay').classList.add('hidden');
  document.getElementById('app-layout').style.display = 'flex';
  updateUserUI();
  orderFilter = 'All';
  // Reset all order tabs to their default visible/active state for a clean slate
  ['tab-all','tab-pending','tab-confirmed','tab-ready-packing','tab-preparing','tab-ready-for-book','tab-fulfilled','tab-cancel','tab-archived'].forEach(id => {
    const el = document.getElementById(id);
    if(el){ el.style.display = ''; el.classList.remove('active'); }
  });
  const defaultTab = document.getElementById('tab-all');
  if(defaultTab) defaultTab.classList.add('active');
  // Reset all nav items and section labels to visible before applying role restrictions
  document.querySelectorAll('.nav-item').forEach(el => el.style.display = '');
  document.querySelectorAll('.sidebar-section-label').forEach(el => el.style.display = '');
  const isBaker  = currentUser.role === 'Baker';
  const isPacker = currentUser.role === 'Packer';
  const isStaff  = isBaker || isPacker;
  if(currentUser.role !== 'Administrator'){
    document.getElementById('users-nav').style.display = 'none';
  }
  if(isStaff){
    ['dashboard','products','customers','inventory','reports','reviews'].forEach(v => {
      const el = document.querySelector(`.nav-item[data-view="${v}"]`);
      if(el) el.style.display = 'none';
    });
    document.querySelectorAll('.sidebar-section-label').forEach(el => el.style.display = 'none');
    const notifBtn = document.querySelector('.notif-btn');
    if(notifBtn) notifBtn.style.display = 'none';
  }
  syncStoreOrders().then(() => {
    switchView(isStaff ? 'orders' : 'dashboard');
    updateBadges();
    buildNotifs();
    renderNotifPanel();
  });

  // Poll every 3s for new customer orders + Lalamove tracking updates
  setInterval(async ()=>{
    const added = await syncStoreOrders();
    updateBadges();
    buildNotifs();
    if(added > 0 || notifList.length > 0) renderNotifPanel();
    if(document.getElementById('view-orders').classList.contains('active')) renderOrders();
    pollLalamoveStatuses();
  }, 3000);
}

/* =============================================
   SYNC CUSTOMER ORDERS → ADMIN
   ============================================= */
async function refreshTrackingCache(){
  const { data } = await _supa.from('order_tracking').select('order_id, data');
  _trackingCache = {};
  (data || []).forEach(row => { _trackingCache[row.order_id] = row.data; });
}

async function syncStoreOrders(){
  await refreshTrackingCache(); // keep tracking cache fresh every poll cycle
  const { data: rows } = await _supa.from('orders').select('data, status').order('date', { ascending: false });
  if (!rows) return 0;

  const today = todayDate();
  let added = 0;

  for (const row of rows) {
    const order    = row.data;
    const existing = DB.orders.find(o => o.id === order.id);

    if (!existing) {
      DB.orders.push(order);
      const deliveryDate = order.preferredDate
        ? new Date(order.preferredDate).toISOString().slice(0, 10)
        : today;
      if (deliveryDate === today) {
        (order.items || []).forEach(item => {
          const p = DB.products.find(pp => pp.name === item.name || pp.id === item.id);
          if (p) {
            if ((p.lastResetDate || '') !== today) { p.soldToday = 0; p.lastResetDate = today; }
            p.soldToday = (p.soldToday || 0) + (item.qty || 1);
          }
        });
      }
      added++;
    } else {
      // Sync status changes pushed by customer (cancel request)
      const incomingStatus = row.status || order.status;
      if (incomingStatus === 'Cancel Requested' &&
          existing.status !== 'Cancel Requested' &&
          existing.status !== 'Cancelled') {
        existing.status = 'Cancel Requested';
        existing.cancelRequestedByBuyer = true;
        if (order.cancelReason) existing.cancelReason = order.cancelReason;
        const seen = getSeenNotifs();
        seen.delete(`cancel_req_${order.id}`);
        saveSeenNotifs(seen);
        added++;
      } else if (incomingStatus === 'Cancelled' && existing.status !== 'Cancelled') {
        existing.status = 'Cancelled';
        existing.cancelledByBuyer = true;
        added++;
      }
    }
  }

  return added;
}
function updateUserUI(){
  const name = currentUser.fname + ' ' + currentUser.lname;
  const init = currentUser.fname[0].toUpperCase();
  document.getElementById('sidebar-name').textContent = name;
  document.getElementById('sidebar-role').textContent = currentUser.role;
  document.getElementById('sidebar-avatar').textContent = init;
  document.getElementById('topbar-name').textContent = name;
  document.getElementById('topbar-avatar').textContent = init;
}

/* ---- NAVIGATION ---- */
function switchView(view){
  if(currentUser && (currentUser.role === 'Baker' || currentUser.role === 'Packer')){
    if(view !== 'orders') view = 'orders';
  }
  checkDailyReset();
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const el = document.getElementById('view-'+view);
  if(el) el.classList.add('active');
  const nav = document.querySelector(`.nav-item[data-view="${view}"]`);
  if(nav) nav.classList.add('active');

  if(view==='dashboard')  renderDashboard();
  if(view==='products')   renderProducts();
  if(view==='orders'){    syncStoreOrders().then(()=>renderOrders()); }
  if(view==='inventory')  renderInventory();
  if(view==='reports')    renderReports();
  if(view==='customers')  renderCustomers();
  if(view==='users')      renderUsers();
  if(view==='reviews')    renderAdminReviews();
}

function toggleSidebar(){
  document.getElementById('sidebar').classList.toggle('open');
}

/* ---- TOAST ---- */
let toastTimer;
function toast(msg, type=''){
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast' + (type?' '+type:'');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.add('hidden'), 3000);
}

/* ---- GLOBAL SEARCH ---- */
function globalSearch(q){
  if(!q.trim()) return;
  const lq = q.toLowerCase();
  const match = DB.products.find(p=>p.name.toLowerCase().includes(lq));
  if(match){ switchView('products'); setTimeout(()=>{ document.getElementById('product-search').value=q; renderProducts(); },100); }
}

/* =============================================
   DASHBOARD
   ============================================= */
function renderDashboard(){
  // date
  document.getElementById('dash-date').textContent = new Date().toLocaleDateString('en-PH',{weekday:'long',year:'numeric',month:'long',day:'numeric'});

  // stats
  const activeProds = DB.products.filter(p=>p.active).length;
  document.getElementById('stat-products').textContent = DB.products.length;
  document.getElementById('stat-products-active').textContent = activeProds + ' active';

  const allOrders = DB.orders;
  const todayOrders = allOrders.filter(o=>isToday(o.date));
  document.getElementById('stat-orders').textContent = allOrders.length;
  document.getElementById('stat-orders-today').textContent = todayOrders.length + ' today';

  const pendingOrders = allOrders.filter(o => !o.archived && (o.status === 'Pending' || (o.status === 'Preparing' && o.preparingSubStatus === 'readyForBook')));
  const pendingToday  = pendingOrders.filter(o => isToday(o.date));
  document.getElementById('stat-revenue').textContent = pendingOrders.length;
  document.getElementById('stat-revenue-today').textContent = pendingToday.length + ' new today';

  const lowStock = getLowStockItems();
  document.getElementById('stat-lowstock').textContent = lowStock.length;

  // pending orders table
  const pendingBody = document.getElementById('dash-pending-body');
  if(pendingBody){
    const strictPending = allOrders.filter(o => !o.archived && (o.status === 'Pending' || (o.status === 'Preparing' && o.preparingSubStatus === 'readyForBook')));
    if(strictPending.length === 0){
      pendingBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-2);padding:24px">No pending orders</td></tr>';
    } else {
      // Sort by nearest delivery date first; orders without a date go last
      const sorted = [...strictPending].sort((a, b) => {
        if(!a.preferredDate && !b.preferredDate) return 0;
        if(!a.preferredDate) return 1;
        if(!b.preferredDate) return -1;
        return new Date(a.preferredDate) - new Date(b.preferredDate);
      });
      const today = new Date(); today.setHours(0,0,0,0);
      pendingBody.innerHTML = sorted.slice(0,10).map(o=>{
        let deliveryCell = '—';
        if(o.preferredDate){
          const d = new Date(o.preferredDate); d.setHours(0,0,0,0);
          const diff = Math.round((d - today) / 86400000);
          const label = d.toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'});
          const badge = diff === 0 ? '<br><span style="font-size:10px;font-weight:700;color:#ea580c">TODAY</span>'
                      : diff === 1 ? '<br><span style="font-size:10px;font-weight:700;color:#2563eb">TOMORROW</span>'
                      : diff < 0  ? '<br><span style="font-size:10px;font-weight:700;color:#dc2626">OVERDUE</span>'
                      : '';
          deliveryCell = `${label}${badge}`;
        }
        return `
        <tr style="cursor:pointer" onclick="switchView('orders');setTimeout(()=>openOrderModal('${o.id}',true),200)">
          <td><span class="fw-bold">${o.id}</span><br><small class="text-muted">${fmtDate(o.date)}</small><br>${o.preparingSubStatus === 'readyForBook' ? '<span style="font-size:10px;font-weight:700;color:#d97706;background:#fef3c7;padding:2px 6px;border-radius:4px">📍 Ready for Book</span>' : '<span style="font-size:10px;font-weight:700;color:#6b7280;background:#f3f4f6;padding:2px 6px;border-radius:4px">Pending</span>'}</td>
          <td>${o.customer || '—'}</td>
          <td>${o.phone || o.customerEmail || '—'}</td>
          <td>${o.address || '—'}</td>
          <td>${deliveryCell}</td>
          <td>₱${Number(o.total||0).toLocaleString()}</td>
        </tr>`;
      }).join('');
    }
  }

  // product showcase
  const showcaseProds = DB.products.filter(p=>p.active).slice(0,8);
  document.getElementById('dash-product-grid').innerHTML = showcaseProds.map(p=>`
    <div class="dash-prod-card" onclick="switchView('products')">
      <img src="${p.img||''}" onerror="this.style.background='var(--bg-2)'" alt="${p.name}">
      <div class="dash-prod-info">
        <span class="dash-prod-name">${p.name}</span>
        <span class="dash-prod-cat">${p.category||''}</span>
        <span class="dash-prod-price">₱${Number(p.price).toLocaleString()}</span>
      </div>
      <span class="dash-prod-stock${Math.max(0,(p.dailyLimit||0)-(p.soldToday||0))<=(p.threshold||0)?' low':''}">${Math.max(0,(p.dailyLimit||0)-(p.soldToday||0))} left</span>
    </div>`).join('') || '<p style="color:var(--text-2);font-size:13px;padding:8px 0">No active products</p>';

  // recent activity
  const tbody = document.getElementById('recent-activity-body');
  const recent = [...DB.orders].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,6);
  tbody.innerHTML = recent.map(o=>`
    <tr>
      <td><span class="fw-bold">${o.id}</span><br><small class="text-muted">${o.customer}</small></td>
      <td>${fmtDate(o.date)}</td>
      <td>${o.type}</td>
      <td><span class="pill ${o.status.toLowerCase()}">${o.status}</span></td>
    </tr>`).join('');

  // top products
  const sales = {};
  DB.transactions.forEach(t=>t.items.forEach(i=>{
    if(!sales[i.id]) sales[i.id]={name:i.name,sold:0,price:i.price,rev:0};
    sales[i.id].sold += i.qty;
    sales[i.id].rev  += i.qty*i.price;
  }));
  const top = Object.values(sales).sort((a,b)=>b.sold-a.sold).slice(0,5);
  document.getElementById('top-products-body').innerHTML = top.map(p=>`
    <tr>
      <td class="fw-bold">${p.name}</td>
      <td>${p.sold}</td>
      <td>₱${p.price}</td>
      <td>₱${p.rev.toLocaleString()}</td>
    </tr>`).join('') || '<tr><td colspan="4" class="text-muted" style="text-align:center;padding:20px">No sales yet</td></tr>';
}

function setRevenueChart(period, btn){
  revenueChartPeriod = period;
  document.querySelectorAll('.chart-tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderRevenueChart();
}

function chartTheme(){
  const dark = document.body.classList.contains('dark');
  return {
    grid: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
    text: dark ? '#9CA3AF' : '#6B7280',
    border: dark ? '#22223A' : '#fff'
  };
}

// ── Sales Revenue Bar Chart (dashboard) ──────────────────────────────────────
let salesRevPeriod = 'week';
let salesRevChartInst = null;

function setRevPeriod(period, btn){
  salesRevPeriod = period;
  document.querySelectorAll('.rev-period-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderSalesRevenueChart(period);
}

function renderSalesRevenueChart(period){
  const txs = DB.transactions;
  const isCOD    = t => t.payment === 'Cash on Delivery' || t.payment === 'Cash';
  const isGCash  = t => t.payment === 'GCash';
  let labels = [], codData = [], gcashData = [];

  if(period === 'week'){
    for(let i = 6; i >= 0; i--){
      const d = new Date(); d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString('en', {weekday:'short'}));
      const dayStr = d.toDateString();
      const day = txs.filter(t => new Date(t.date).toDateString() === dayStr);
      codData.push(day.filter(isCOD).reduce((s,t) => s+t.total, 0));
      gcashData.push(day.filter(isGCash).reduce((s,t) => s+t.total, 0));
    }
  } else if(period === 'month'){
    labels = ['Week 1','Week 2','Week 3','Week 4'];
    codData = Array(4).fill(0); gcashData = Array(4).fill(0);
    const now = new Date();
    txs.filter(t => { const d=new Date(t.date); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear(); })
      .forEach(t => {
        const w = Math.min(3, Math.floor((new Date(t.date).getDate()-1)/7));
        if(isCOD(t))   codData[w]   += t.total;
        if(isGCash(t)) gcashData[w] += t.total;
      });
  } else {
    const months = {}; const now = new Date();
    for(let i = 5; i >= 0; i--){ const d=new Date(now.getFullYear(), now.getMonth()-i, 1); months[`${d.getFullYear()}-${d.getMonth()}`]={label:d.toLocaleDateString('en',{month:'short'}),cod:0,gcash:0}; }
    txs.forEach(t => {
      const d=new Date(t.date); const key=`${d.getFullYear()}-${d.getMonth()}`;
      if(months[key]){
        if(isCOD(t))   months[key].cod   += t.total;
        if(isGCash(t)) months[key].gcash += t.total;
      }
    });
    Object.values(months).forEach(m => { labels.push(m.label); codData.push(m.cod); gcashData.push(m.gcash); });
  }

  const canvas = document.getElementById('sales-revenue-chart');
  if(!canvas) return;
  if(salesRevChartInst){ salesRevChartInst.destroy(); salesRevChartInst = null; }

  const maxVal = Math.max(...codData, ...gcashData, 1);
  const yMax = Math.ceil(maxVal * 1.25);

  salesRevChartInst = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Cash on Delivery',
          data: codData,
          backgroundColor: 'rgba(99,102,241,0.75)',
          borderWidth: 0,
          borderRadius: 6,
          borderSkipped: false,
          barPercentage: 0.5,
          categoryPercentage: 0.7
        },
        {
          label: 'GCash',
          data: gcashData,
          backgroundColor: 'rgba(16,185,129,0.75)',
          borderWidth: 0,
          borderRadius: 6,
          borderSkipped: false,
          barPercentage: 0.5,
          categoryPercentage: 0.7
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: true, position: 'top', labels: { boxWidth: 12, font: { size: 12 }, color: '#6B7280' } },
        tooltip: {
          backgroundColor: '#fff',
          borderColor: '#e5e7eb',
          borderWidth: 1,
          titleColor: '#111827',
          bodyColor: '#6B7280',
          padding: 12,
          callbacks: {
            label: ctx => `  ${ctx.dataset.label}: ₱${ctx.parsed.y.toLocaleString()}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { font: { size: 12 }, color: '#9CA3AF' }
        },
        y: {
          beginAtZero: true,
          max: yMax || undefined,
          grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false },
          border: { display: false },
          ticks: {
            font: { size: 11 }, color: '#9CA3AF',
            callback: v => v >= 1000 ? (v/1000)+'K' : v
          }
        }
      }
    }
  });
}

function renderRevenueChart(){
  const ctx = document.getElementById('revenueChart').getContext('2d');
  const {labels, data1, data2} = getRevenueData(revenueChartPeriod);
  const t = chartTheme();
  if(revenueChartInst) revenueChartInst.destroy();
  revenueChartInst = new Chart(ctx,{
    type:'bar',
    data:{
      labels,
      datasets:[
        { label:'One-Time Revenue', data:data1, backgroundColor:'#6366F1', borderRadius:6, borderSkipped:false },
        { label:'Recurring Revenue', data:data2, backgroundColor:'#818CF8', borderRadius:6, borderSkipped:false }
      ]
    },
    options:{ responsive:true,
      plugins:{ legend:{ position:'top', labels:{ font:{size:11}, color:t.text } } },
      scales:{
        x:{ grid:{display:false}, ticks:{color:t.text} },
        y:{ grid:{color:t.grid}, ticks:{color:t.text, callback:v=>'₱'+v} }
      }
    }
  });
}

function getRevenueData(period){
  const txs = DB.transactions;
  let labels=[], data1=[], data2=[];
  if(period==='weekly'){
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    labels = days;
    data1 = Array(7).fill(0); data2 = Array(7).fill(0);
    txs.forEach(t=>{ const d=new Date(t.date); data1[d.getDay()]+=t.total; });
    // simulate recurring as 30%
    data2 = data1.map(v=>Math.floor(v*0.3));
    data1 = data1.map((v,i)=>v-data2[i]);
  } else {
    const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    labels = months;
    data1 = Array(12).fill(0); data2 = Array(12).fill(0);
    txs.forEach(t=>{ const d=new Date(t.date); data1[d.getMonth()]+=t.total; });
    data2 = data1.map(v=>Math.floor(v*0.3));
    data1 = data1.map((v,i)=>v-data2[i]);
  }
  return {labels,data1,data2};
}

function renderCategoryChart(){
  const ctx = document.getElementById('categoryChart').getContext('2d');
  const catTotals={};
  DB.transactions.forEach(t=>t.items.forEach(i=>{
    const p = DB.products.find(pp=>pp.id===i.id);
    const cat = p?p.category:'Other';
    catTotals[cat] = (catTotals[cat]||0) + i.qty*i.price;
  }));
  const cats = Object.keys(catTotals);
  const vals = cats.map(c=>catTotals[c]);
  const colors = ['#6366F1','#10B981','#F59E0B','#EF4444','#06B6D4','#8B5CF6'];
  const t = chartTheme();
  if(categoryChartInst) categoryChartInst.destroy();
  categoryChartInst = new Chart(ctx,{
    type:'doughnut',
    data:{ labels:cats, datasets:[{ data:vals, backgroundColor:colors.slice(0,cats.length), borderWidth:2, borderColor:t.border }] },
    options:{ responsive:true, plugins:{legend:{display:false}}, cutout:'65%' }
  });
  document.getElementById('category-legend').innerHTML = cats.map((c,i)=>`
    <div class="legend-item">
      <div class="legend-dot" style="background:${colors[i]}"></div>
      <span class="legend-label">${c}</span>
      <span class="legend-pct">₱${catTotals[c].toLocaleString()}</span>
    </div>`).join('') || '<div class="text-muted" style="font-size:12px">No data yet</div>';
}

/* =============================================
   PRODUCTS
   ============================================= */
function renderProducts(){
  const q   = (document.getElementById('product-search')?.value||'').toLowerCase();
  const cat = document.getElementById('product-filter-cat')?.value||'';
  const st  = document.getElementById('product-filter-status')?.value||'';
  let list = DB.products.filter(p=>{
    const mq = !q || p.name.toLowerCase().includes(q) || (p.flavor||'').toLowerCase().includes(q);
    const mc = !cat || p.category===cat;
    const ms = !st || (st==='active'?p.active:!p.active);
    return mq && mc && ms;
  });
  const tbody = document.getElementById('products-body');
  tbody.innerHTML = list.map(p=>`
    <tr>
      <td>
        <div class="product-cell">
          <div class="product-thumb"><img src="${p.img||''}" alt="${p.name}" onerror="this.style.display='none'"></div>
          <div>
            <div class="product-name">${p.name}</div>
            <div class="product-desc">${p.description||''}</div>
          </div>
        </div>
      </td>
      <td>${p.category}</td>
      <td>${p.flavor||'—'}</td>
      <td>${p.size||'—'}</td>
      <td class="fw-bold">₱${p.price}</td>
      <td>
        <div class="stock-bar-wrap">
          <div class="stock-bar"><div class="stock-bar-fill ${stockClass(p)}" style="width:${stockPct(p)}%"></div></div>
          <div class="stock-label">${Math.max(0,(p.dailyLimit||0)-(p.soldToday||0))}/${p.dailyLimit||0} left</div>
        </div>
      </td>
      <td><span class="pill ${p.active?'active':'inactive'}">${p.active?'Active':'Inactive'}</span></td>
      <td>
        <div class="td-actions">
          <button class="btn-icon edit" onclick="openProductModal('${p.id}')" title="Edit"><i class='bx bx-edit'></i></button>
          <button class="btn-icon ${p.active?'danger':'success'}" onclick="toggleProduct('${p.id}')" title="${p.active?'Deactivate':'Activate'}">
            <i class='bx bx-${p.active?'hide':'show'}'></i>
          </button>
        </div>
      </td>
    </tr>`).join('') || '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-2)">No products found</td></tr>';
}

function ingEstimate(p){
  if(!p.recipe || !p.recipe.length) return p.dailyLimit||0;
  let min = Infinity;
  p.recipe.forEach(r => {
    const ing = DB.ingredients.find(i => i.id === r.ingredientId);
    if(ing && r.qty > 0) min = Math.min(min, Math.floor(ing.stock / r.qty));
  });
  return min === Infinity ? (p.dailyLimit||0) : min;
}
function stockClass(p){
  const remaining = Math.max(0, (p.dailyLimit||0) - (p.soldToday||0));
  if(remaining <= 0) return 'low';
  if(remaining <= (p.threshold||1)) return 'warn';
  return 'ok';
}
function stockPct(p){
  const limit = p.dailyLimit || 1;
  const remaining = Math.max(0, limit - (p.soldToday||0));
  return Math.min(100, Math.round((remaining / limit) * 100));
}

function openProductModal(id){
  const p      = id ? DB.products.find(pp=>pp.id===id) : null;
  const isEdit = !!p;

  document.getElementById('product-modal-title').textContent = isEdit ? 'Edit Product' : 'Add Product';
  document.getElementById('pm-id').value        = p?.id||'';
  document.getElementById('pm-name').value      = p?.name||'';
  document.getElementById('pm-category').value  = p?.category||'';
  document.getElementById('pm-flavor').value    = p?.flavor||'';
  document.getElementById('pm-price').value     = p?.price||'';
  document.getElementById('pm-stock').value     = p?.dailyLimit||'';
  document.getElementById('pm-threshold').value = p?.threshold||5;
  document.getElementById('pm-img').value       = p?.img||'';
  document.getElementById('pm-desc').value      = p?.description||'';
  document.getElementById('pm-active').checked  = p?.active!==false;

  // Lock structural fields when editing (name, flavor, category stay locked)
  const lockFields = ['pm-name','pm-flavor'];
  const roStyle = { background:'var(--bg-2,#f8f9fb)', cursor:'not-allowed', color:'var(--text-2)', resize:'none' };
  lockFields.forEach(fid => {
    const el = document.getElementById(fid);
    el.readOnly  = isEdit;
    Object.assign(el.style, isEdit ? roStyle : { background:'', cursor:'', color:'', resize:'' });
  });
  const catEl = document.getElementById('pm-category');
  catEl.disabled = isEdit;
  Object.assign(catEl.style, isEdit ? roStyle : { background:'', cursor:'', color:'' });

  // Editable fields — always unlocked
  ['pm-desc','pm-threshold','pm-stock'].forEach(fid => {
    const el = document.getElementById(fid);
    el.readOnly = false;
    Object.assign(el.style, { background:'', cursor:'', color:'', resize:'' });
  });

  const activeEl = document.getElementById('pm-active');
  activeEl.disabled = false;
  activeEl.style.opacity = '';
  activeEl.style.cursor  = '';

  // Image preview
  const preview = document.getElementById('pm-img-preview');
  const src = p?.img || '';
  if(src){ preview.src = src; preview.style.display = ''; }
  else { preview.src = ''; preview.style.display = 'none'; }
  document.getElementById('pm-img-filename').textContent = src ? 'Current image loaded' : '';

  document.getElementById('pm-add-ingredient-btn').style.display = isEdit ? 'none' : '';

  renderRecipeRows(p?.recipe || [], isEdit);
  openModal('product-modal');
}

function handleProductImgUpload(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById('pm-img').value = ev.target.result;
    const preview = document.getElementById('pm-img-preview');
    preview.src = ev.target.result;
    preview.style.display = '';
    document.getElementById('pm-img-filename').textContent = file.name;
  };
  reader.readAsDataURL(file);
}

function saveProduct(){
  const id    = document.getElementById('pm-id').value;
  const p     = DB.products.find(pp=>pp.id===id);
  const price = parseFloat(document.getElementById('pm-price').value);
  const stock = parseInt(document.getElementById('pm-stock').value)||0;
  if(isNaN(price)){ toast('Enter a valid price','danger'); return; }
  if(id && p){
    p.price       = price;
    p.dailyLimit  = stock;
    p.description = document.getElementById('pm-desc').value.trim();
    p.threshold   = parseInt(document.getElementById('pm-threshold').value)||5;
    p.active      = document.getElementById('pm-active').checked;
    const imgVal  = document.getElementById('pm-img').value.trim();
    if(imgVal) p.img = imgVal;
    saveDB(); closeModal('product-modal'); renderProducts(); updateBadges();
    toast('Product updated','success');
    return;
  }
  // new product (add flow — kept for completeness)
  const name = document.getElementById('pm-name').value.trim();
  const cat  = document.getElementById('pm-category').value;
  if(!name||!cat||isNaN(price)){ toast('Fill required fields','danger'); return; }
  const data = {
    name, category:cat,
    flavor:      document.getElementById('pm-flavor').value.trim(),
    price, dailyLimit:stock, soldToday:0, lastResetDate:todayDate(),
    threshold:   parseInt(document.getElementById('pm-threshold').value)||5,
    img:         document.getElementById('pm-img').value.trim(),
    description: document.getElementById('pm-desc').value.trim(),
    active:      document.getElementById('pm-active').checked,
    recipe:      collectRecipeRows()
  };
  DB.products.push({id:'p'+Date.now(), ...data});
  saveDB(); closeModal('product-modal'); renderProducts(); updateBadges();
  toast('Product added','success');
}

function toggleProduct(id){
  const p = DB.products.find(pp=>pp.id===id);
  if(p.active){
    showConfirm({
      title: 'Deactivate Product',
      message: `Are you sure you want to deactivate "${p.name}"? It will no longer be visible in the store.`,
      okText: 'Deactivate',
      icon: 'bx-x-circle',
      onConfirm: () => {
        p.active = false;
        saveDB(); renderProducts(); updateBadges();
        toast('Product deactivated', '');
      }
    });
  } else {
    p.active = true;
    saveDB(); renderProducts(); updateBadges();
    toast('Product activated', 'success');
  }
}


/* =============================================
   ORDERS
   ============================================= */
function renderOrders(){
  const isBaker  = currentUser.role === 'Baker';
  const isPacker = currentUser.role === 'Packer';
  const isAdmin  = currentUser.role === 'Administrator';

  // Role alert banners
  const bakerAlert  = document.getElementById('baker-alert');
  const packerAlert = document.getElementById('packer-alert');
  if(bakerAlert){
    const n = DB.orders.filter(o=>o.status==='Confirmed'&&!o.archived).length;
    bakerAlert.style.display  = (isBaker && n > 0) ? 'flex' : 'none';
    const msg = document.getElementById('baker-alert-msg');
    if(msg) msg.textContent = n === 1 ? '1 order is confirmed and waiting to be baked.' : `${n} orders are confirmed and waiting to be baked.`;
  }
  if(packerAlert){
    const n = DB.orders.filter(o=>o.status==='Ready for Packing'&&!o.archived).length;
    packerAlert.style.display = (isPacker && n > 0) ? 'flex' : 'none';
    const msg = document.getElementById('packer-alert-msg');
    if(msg) msg.textContent = n === 1 ? '1 order is ready to be packed.' : `${n} orders are ready to be packed.`;
  }

  // Role-based tab visibility
  if(isBaker){
    ['tab-all','tab-pending','tab-ready-packing','tab-packing','tab-ready-for-book','tab-completed','tab-fulfilled','tab-cancel','tab-archived'].forEach(id => { const el=document.getElementById(id); if(el) el.style.display='none'; });
    ['tab-confirmed','tab-preparing'].forEach(id => { const el=document.getElementById(id); if(el) el.style.display=''; });
    const bakingTab = document.getElementById('tab-preparing');
    if(bakingTab) bakingTab.firstChild.textContent = 'Baking ';
    if(!['Confirmed','Preparing'].includes(orderFilter)){
      orderFilter = 'Confirmed';
      document.querySelectorAll('#order-tabs .status-tab').forEach(b=>b.classList.remove('active'));
      const t=document.getElementById('tab-confirmed'); if(t) t.classList.add('active');
    }
  } else if(isPacker){
    ['tab-all','tab-pending','tab-confirmed','tab-fulfilled','tab-cancel','tab-archived','tab-ready-for-book','tab-packing','tab-completed'].forEach(id => { const el=document.getElementById(id); if(el) el.style.display='none'; });
    ['tab-ready-packing','tab-preparing'].forEach(id => { const el=document.getElementById(id); if(el) el.style.display=''; });
    const prepTab = document.getElementById('tab-preparing');
    if(prepTab) prepTab.firstChild.textContent = 'Packing ';
    // Reorder tabs: Ready for Packing → Packing → Ready for Book
    const tabsContainer = document.getElementById('order-tabs');
    const readyPackingTab = document.getElementById('tab-ready-packing');
    if(tabsContainer && readyPackingTab && prepTab) tabsContainer.insertBefore(readyPackingTab, prepTab);
    if(!['Ready for Packing','Preparing','ReadyForBook'].includes(orderFilter)){
      orderFilter = 'Ready for Packing';
      document.querySelectorAll('#order-tabs .status-tab').forEach(b=>b.classList.remove('active'));
      const t=document.getElementById('tab-ready-packing'); if(t) t.classList.add('active');
    }
  }

  const counts = { Pending:0, Confirmed:0, 'Ready for Packing':0, Preparing:0, Fulfilled:0, 'Cancel Requested':0 };
  DB.orders.filter(o=>!o.archived).forEach(o=>{ if(counts[o.status]!==undefined) counts[o.status]++; });
  const archivedCount = DB.orders.filter(o=>o.archived).length;
  const allCount = DB.orders.filter(o=>!o.archived && o.status !== 'Cancel Requested').length;

  document.getElementById('o-pending').textContent   = counts.Pending;
  document.getElementById('o-confirmed').textContent = counts.Confirmed;
  document.getElementById('o-fulfilled').textContent = counts.Fulfilled;
  const crEl = document.getElementById('o-cancel-requests');
  if(crEl){ crEl.textContent = counts['Cancel Requested']; crEl.closest('.mini-stat').style.display = counts['Cancel Requested'] ? '' : 'none'; }

  // Update tab count badges
  const setTabCount = (id, n) => {
    const el = document.getElementById(id);
    if(!el) return;
    el.textContent = n || '';
    el.style.display = n ? '' : 'none';
  };
  setTabCount('tab-count-all',           allCount);
  setTabCount('tab-count-pending',       counts.Pending);
  setTabCount('tab-count-confirmed',     counts.Confirmed);
  setTabCount('tab-count-ready-packing', counts['Ready for Packing']);
  setTabCount('tab-count-preparing',     isPacker
    ? DB.orders.filter(o=>!o.archived && o.status==='Preparing' && o.preparingSubStatus!=='readyForBook').length
    : DB.orders.filter(o=>!o.archived && o.status==='Preparing' && o.preparingSubStatus==='baking').length);
  setTabCount('tab-count-packing',       DB.orders.filter(o=>!o.archived && o.status==='Preparing' && (o.preparingSubStatus==='packing' || o.preparingSubStatus==='packed')).length);
  const _trackingForCount = _trackingCache;
  setTabCount('tab-count-ready-for-book', DB.orders.filter(o=>!o.archived && o.status==='Preparing' && o.preparingSubStatus==='readyForBook' && _trackingForCount[o.id]?.status!=='COMPLETED').length);
  setTabCount('tab-count-completed', DB.orders.filter(o=>!o.archived && o.status==='Preparing' && _trackingForCount[o.id]?.status==='COMPLETED').length);
  setTabCount('tab-count-fulfilled',     counts.Fulfilled);
  setTabCount('tab-count-cancel',        counts['Cancel Requested']);
  setTabCount('tab-count-archived',      archivedCount);

  let list;
  if(orderFilter==='Archived'){
    list = DB.orders.filter(o=>o.archived);
  } else if(orderFilter==='All'){
    list = DB.orders.filter(o=>!o.archived && o.status !== 'Cancel Requested');
  } else if(isBaker && orderFilter==='Preparing'){
    list = DB.orders.filter(o=>!o.archived && o.status==='Preparing' && o.preparingSubStatus==='baking');
  } else if(orderFilter==='ReadyForBook'){
    const _rfbTr = _trackingCache;
    list = DB.orders.filter(o=>!o.archived && o.status==='Preparing' && o.preparingSubStatus==='readyForBook' && _rfbTr[o.id]?.status!=='COMPLETED');
  } else if(orderFilter==='Completed'){
    const _tr = _trackingCache;
    list = DB.orders.filter(o=>!o.archived && o.status==='Preparing' && _tr[o.id]?.status==='COMPLETED');
  } else if(orderFilter==='Packing'){
    list = DB.orders.filter(o=>!o.archived && o.status==='Preparing' && (o.preparingSubStatus==='packing' || o.preparingSubStatus==='packed'));
  } else if(orderFilter==='Preparing'){
    list = DB.orders.filter(o=>!o.archived && o.status==='Preparing' && (isPacker ? o.preparingSubStatus!=='readyForBook' : o.preparingSubStatus==='baking'));
  } else {
    list = DB.orders.filter(o=>!o.archived && o.status===orderFilter);
  }
  list = [...list].sort((a,b)=>new Date(b.date)-new Date(a.date));

  const allTracking = _trackingCache;
  const lalamoveLabels = {
    ASSIGNING_DRIVER: 'Finding Driver',
    ON_GOING:         'On the Way',
    PICKED_UP:        'Picked Up',
    COMPLETED:        'Completed',
    CANCELED:         'Cancelled',
    REJECTED:         'Rejected',
    EXPIRED:          'Expired'
  };
  const lalamovePill = {
    ASSIGNING_DRIVER: 'finding-driver',
    ON_GOING:         'on-the-way',
    PICKED_UP:        'on-the-way',
    COMPLETED:        'fulfilled',
    CANCELED:         'cancelled',
    REJECTED:         'cancelled',
    EXPIRED:          'cancelled'
  };
  function getStatusPill(o){
    if(o.status === 'Preparing'){
      const t = allTracking[o.id];
      if(t && t.lalamoveRef && lalamoveLabels[t.status]){
        return { label: lalamoveLabels[t.status], cls: lalamovePill[t.status] };
      }
      if(o.preparingSubStatus === 'readyForBook') return { label: '📍 Ready for Book', cls: 'preparing' };
      if(o.preparingSubStatus === 'packed')  return { label: '✅ Packed',    cls: 'preparing' };
      if(o.preparingSubStatus === 'packing') return { label: '📦 Packing',  cls: 'preparing' };
      if(o.preparingSubStatus === 'baking')  return { label: '🔥 Baking',   cls: 'preparing' };
    }
    const cls = o.status === 'Cancel Requested' ? 'cancel-requested' : o.status.toLowerCase().replace(/ /g,'-');
    return { label: o.status, cls };
  }

  document.getElementById('orders-body').innerHTML = list.map(o=>{
    const sp = getStatusPill(o);
    return `
    <tr>
      <td class="fw-bold">${o.id}</td>
      <td>${o.customer}</td>
      <td>${o.items.map(i=>i.name+(i.qty>1?' x'+i.qty:'')).join(', ')}</td>
      <td class="fw-bold">₱${o.total.toLocaleString()}</td>
      <td>${o.type}</td>
      <td>${fmtDate(o.date)}</td>
      <td><span class="pill ${sp.cls}">${sp.label}</span></td>
      <td>
        <div class="td-actions">
          <button class="btn-icon edit" onclick="openOrderModal('${o.id}', true)" title="View"><i class='bx bx-show'></i></button>
          ${isAdmin && !o.archived && (o.status==='Fulfilled'||o.status==='Cancelled')?`<button class="btn-icon danger" onclick="archiveOrder('${o.id}')" title="Archive"><i class='bx bx-archive-in'></i></button>`:isAdmin && o.archived?`<button class="btn-icon success" onclick="unarchiveOrder('${o.id}')" title="Unarchive"><i class='bx bx-archive-out'></i></button>`:''}
          ${isAdmin && o.status==='Pending'&&!o.archived?`<button class="btn-icon success" onclick="openOrderModal('${o.id}')" title="Confirm"><i class='bx bx-check'></i></button>`:''}
          ${(isAdmin||isBaker) && o.status==='Confirmed'&&!o.archived?`<button class="btn-icon success" onclick="openOrderModal('${o.id}')" title="Prepare Order"><i class='bx bx-dish'></i></button>`:''}
          ${(isAdmin||isBaker) && o.status==='Preparing' && o.preparingSubStatus==='baking' && !o.archived?`<button class="btn-icon success" onclick="bakerDoneBaking('${o.id}')" title="Done Baking" style="background:var(--success-light);color:var(--success)"><i class='bx bx-check-double'></i></button>`:''}
          ${(isAdmin||isPacker) && o.status==='Ready for Packing'&&!o.archived?`<button class="btn-icon success" onclick="packerStartPacking('${o.id}')" title="Start Packing" style="background:#EDE9FE;color:#7C3AED"><i class='bx bx-package'></i></button>`:''}
          ${(isAdmin||isPacker) && o.status==='Preparing' && o.preparingSubStatus==='packing' && !o.archived?`<button class="btn-icon success" onclick="packerDonePacking('${o.id}')" title="Done Packing"><i class='bx bx-check-double'></i></button>`:''}
          ${(isAdmin||isPacker) && o.status==='Preparing' && o.preparingSubStatus==='packed' && !o.archived?`<button class="btn-icon success" onclick="packerReadyForBook('${o.id}')" title="Ready for Book"><i class='bx bx-map-pin'></i></button>`:''}
          ${isAdmin && o.status==='Preparing' && o.preparingSubStatus==='readyForBook' && !o.archived?`<button class="btn-icon edit" onclick="openOrderModal('${o.id}')" title="Book Lalamove"><i class='bx bx-map'></i></button>`:''}
          ${isAdmin && o.status==='Cancel Requested'&&!o.archived?`<button class="btn-icon danger" onclick="openOrderModal('${o.id}')" title="Review Cancel Request"><i class='bx bx-x-circle'></i></button>`:''}
          ${isAdmin && o.status==='Cancelled'&&!o.archived&&o.payment==='GCash'&&!o.refunded?`<button class="btn-icon warn" onclick="openRefundModal('${o.id}')" title="Process Refund"><i class='bx bx-money-withdraw'></i></button>`:''}
          ${isAdmin && o.status==='Cancelled'&&!o.archived&&o.payment==='GCash'&&o.refunded?`<span class="refund-done-badge" title="Refund processed">Refunded</span>`:''}
        </div>
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-2)">No orders found</td></tr>';
}

function archiveOrder(id){
  showConfirm({
    title: 'Archive Order',
    message: 'Are you sure you want to archive this order? It will be moved to the Archived tab.',
    okText: 'Archive',
    onConfirm: () => {
      const o = DB.orders.find(oo=>oo.id===id);
      if(o){ o.archived=true; saveDB(); renderOrders(); updateBadges(); toast('Order archived','success'); }
    }
  });
}

function showConfirm({ title='Confirm', message='', okText='Confirm', okClass='btn-danger', icon='bx-archive-in', onConfirm }){
  document.getElementById('confirm-modal-title').textContent = title;
  document.getElementById('confirm-modal-message').textContent = message;
  document.getElementById('confirm-modal-icon').innerHTML = `<i class='bx ${icon}'></i>`;
  const okBtn = document.getElementById('confirm-modal-ok');
  okBtn.textContent = okText;
  okBtn.className = okClass;
  okBtn.onclick = () => { closeConfirmModal(); onConfirm(); };
  document.getElementById('confirm-modal').classList.remove('hidden');
}

function closeConfirmModal(){
  document.getElementById('confirm-modal').classList.add('hidden');
}

function toggleIngRow(id){
  const row  = document.getElementById(id);
  const icon = document.getElementById(id + '_icon');
  if(!row) return;
  const open = row.style.display !== 'none';
  row.style.display  = open ? 'none' : '';
  if(icon) icon.style.transform = open ? '' : 'rotate(180deg)';
}

function unarchiveOrder(id){
  const o = DB.orders.find(oo=>oo.id===id);
  if(o){ o.archived=false; saveDB(); renderOrders(); updateBadges(); toast('Order restored','success'); }
}

function filterOrders(status, btn){
  orderFilter=status;
  document.querySelectorAll('#order-tabs .status-tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderOrders();
  const clearBtn = document.getElementById('clear-pending-btn');
  if(clearBtn) clearBtn.style.display = (status === 'Pending' && currentUser.role === 'Administrator') ? '' : 'none';
}

function clearAllPending(){
  const count = DB.orders.filter(o => o.status === 'Pending' && !o.archived).length;
  if(!count){ toast('No pending orders to clear', ''); return; }
  showConfirm({
    title: 'Clear All Pending Orders',
    message: `Archive all ${count} pending order${count>1?'s':''}? They will be moved to the Archived tab and can be restored later.`,
    okText: 'Clear All',
    onConfirm: () => {
      DB.orders.filter(o => o.status === 'Pending' && !o.archived).forEach(o => { o.archived = true; });
      saveDB();
      renderOrders();
      updateBadges();
      toast(`${count} pending order${count>1?'s':''} archived`, 'success');
    }
  });
}

function filterIngCat(cat, btn){
  ingCatFilter = cat;
  document.querySelectorAll('#ing-cat-tabs .status-tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderInventory();
}

function openOrderModal(id, viewOnly=false){
  currentOrderId = id;
  const o = DB.orders.find(oo=>oo.id===id);
  document.getElementById('order-modal-title').textContent = 'Order '+o.id;

  // Pull any saved Lalamove tracking for this order
  const allTracking = _trackingCache;
  const tracking    = allTracking[o.id] || null;

  // Build Lalamove tracking section
  let lalamoveHTML = '';
  if(tracking){
    const statusLabels = {
      ASSIGNING_DRIVER: 'Finding Driver',
      ON_GOING:         'Driver on the Way',
      PICKED_UP:        'Picked Up',
      COMPLETED:        'Delivered',
      CANCELED:         'Cancelled',
      REJECTED:         'Rejected',
      EXPIRED:          'Expired'
    };
    const statusLabel = statusLabels[tracking.status] || tracking.status;
    const driverHTML  = tracking.driver
      ? `<div style="margin-top:10px;padding:10px 14px;background:var(--bg);border-radius:8px;font-size:13px">
           <strong>Driver:</strong> ${tracking.driver.name} &nbsp;|&nbsp;
           <strong>Phone:</strong> ${tracking.driver.phone} &nbsp;|&nbsp;
           <strong>Plate:</strong> ${tracking.driver.plate}
         </div>` : '';
    const linkHTML = tracking.shareLink
      ? `<a href="${tracking.shareLink}" target="_blank" style="display:inline-block;margin-top:8px;font-size:12px;color:var(--accent)">📍 Live tracking link</a>`
      : '';
    lalamoveHTML = `
      <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border)">
        <div style="font-size:11px;font-weight:700;color:var(--text-2);margin-bottom:8px">LALAMOVE DELIVERY</div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span style="font-size:13px;font-weight:600">Ref:</span>
          <code style="font-size:12px;background:var(--bg);padding:2px 7px;border-radius:4px">${tracking.lalamoveRef}</code>
          <span class="pill ${tracking.status==='COMPLETED'?'fulfilled':tracking.status==='CANCELED'?'danger':'confirmed'}">${statusLabel}</span>
        </div>
        ${driverHTML}
        ${linkHTML}
      </div>`;
  }

  // Derive the display status label for the modal (matches the order list badge)
  const modalStatusLabels = {
    ASSIGNING_DRIVER: 'Finding Driver', ON_GOING: 'On the Way',
    PICKED_UP: 'Picked Up', COMPLETED: 'Delivered',
    CANCELED: 'Cancelled', REJECTED: 'Cancelled', EXPIRED: 'Cancelled'
  };
  const modalStatusPillCls = {
    ASSIGNING_DRIVER: 'finding-driver', ON_GOING: 'finding-driver',
    PICKED_UP: 'confirmed', COMPLETED: 'fulfilled',
    CANCELED: 'cancelled', REJECTED: 'cancelled', EXPIRED: 'cancelled'
  };
  let modalStatusLabel = o.status;
  let modalStatusCls   = o.status.toLowerCase().replace(/ /g, '-');
  if(tracking && modalStatusLabels[tracking.status]){
    modalStatusLabel = modalStatusLabels[tracking.status];
    modalStatusCls   = modalStatusPillCls[tracking.status] || 'confirmed';
  } else if(o.status === 'Preparing'){
    if(o.preparingSubStatus === 'readyForBook'){ modalStatusLabel = '📍 Ready for Book'; }
    else if(o.preparingSubStatus === 'packing'){ modalStatusLabel = '📦 Packing'; }
    else if(o.preparingSubStatus === 'baking'){ modalStatusLabel = '🔥 Baking'; }
    modalStatusCls = 'preparing';
  }

  const isBakerView  = currentUser.role === 'Baker';
  const isStaffView  = isBakerView || currentUser.role === 'Packer';

  const infoGrid = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div><label style="font-size:11px;color:var(--text-2);font-weight:700">ORDER ID</label><div class="fw-bold" style="font-size:13px">${o.id}</div></div>
      <div><label style="font-size:11px;color:var(--text-2);font-weight:700">STATUS</label><div><span class="pill ${modalStatusCls}">${modalStatusLabel}</span></div></div>
      <div><label style="font-size:11px;color:var(--text-2);font-weight:700">CUSTOMER</label><div class="fw-bold">${o.customer}</div></div>
      <div><label style="font-size:11px;color:var(--text-2);font-weight:700">DATE</label><div>${fmtDateTime(o.date)}</div></div>
      <div><label style="font-size:11px;color:var(--text-2);font-weight:700">TYPE</label><div>${o.type}</div></div>
      ${o.payment?`<div><label style="font-size:11px;color:var(--text-2);font-weight:700">PAYMENT</label><div>${o.payment}</div></div>`:''}
      ${o.address?`<div style="grid-column:1/-1"><label style="font-size:11px;color:var(--text-2);font-weight:700">DELIVERY ADDRESS</label><div>${o.address}</div></div>`:''}
      ${o.preferredDate?`<div style="grid-column:1/-1"><label style="font-size:11px;color:var(--text-2);font-weight:700">PREFERRED DELIVERY DATE</label><div>${new Date(o.preferredDate).toLocaleDateString('en-PH',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div></div>`:''}
      ${o.preferredTime?`<div style="grid-column:1/-1"><label style="font-size:11px;color:var(--text-2);font-weight:700">PREFERRED DELIVERY TIME</label><div>${o.preferredTime}</div></div>`:''}
      ${o.contactMethod?`<div style="grid-column:1/-1"><label style="font-size:11px;color:var(--text-2);font-weight:700">PREFERRED CONTACT METHOD</label><div>${o.contactMethod}</div></div>`:''}
    </div>`;

  // Baker view: items with per-item ingredient dropdown, no customer info
  const bakerRows = o.items.map((item, idx) => {
    const p = DB.products.find(pp => pp.name === item.name || pp.id === item.id);
    const ings = (p && p.recipe) ? p.recipe.map(r => {
      const ing = DB.ingredients.find(i => i.id === r.ingredientId);
      return ing ? `<tr><td style="padding:4px 8px;font-size:12px;color:var(--text-2)">${ing.name}</td><td style="padding:4px 8px;font-size:12px;font-weight:600;text-align:right">${r.qty * item.qty} ${ing.unit}</td></tr>` : '';
    }).join('') : '';
    const hasIngs = ings.length > 0;
    return `
      <tr style="cursor:${hasIngs?'pointer':'default'}" onclick="${hasIngs?`toggleIngRow('baking_ing_${idx}')`:''}">
        <td class="fw-bold">${item.name}</td>
        <td>${item.qty}</td>
        <td style="text-align:right;width:32px">${hasIngs?`<i class='bx bx-chevron-down' id='baking_ing_${idx}_icon' style="font-size:16px;color:var(--text-2);transition:transform .2s"></i>`:''}</td>
      </tr>
      ${hasIngs ? `<tr id="baking_ing_${idx}" style="display:none">
        <td colspan="3" style="padding:0 0 8px 0">
          <table style="width:100%;background:var(--bg-2,#f8f9fb);border-radius:8px;overflow:hidden">
            <thead><tr>
              <th style="padding:6px 8px;font-size:10px;color:var(--text-2);font-weight:700;text-align:left">INGREDIENT</th>
              <th style="padding:6px 8px;font-size:10px;color:var(--text-2);font-weight:700;text-align:right">AMOUNT</th>
            </tr></thead>
            <tbody>${ings}</tbody>
          </table>
        </td>
      </tr>` : ''}`;
  }).join('');

  document.getElementById('order-modal-body').innerHTML = isBakerView ? `
    <table class="data-table">
      <thead><tr><th>Item</th><th>Qty</th><th></th></tr></thead>
      <tbody>${bakerRows}</tbody>
    </table>` : isStaffView ? `
    <table class="data-table">
      <thead><tr><th>Item</th><th>Qty</th></tr></thead>
      <tbody>${o.items.map(i=>`<tr><td class="fw-bold">${i.name}</td><td>${i.qty}</td></tr>`).join('')}</tbody>
    </table>` : `
    ${infoGrid}
    <table class="data-table">
      <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
      <tbody>${o.items.map(i=>`<tr><td>${i.name}</td><td>${i.qty}</td><td>₱${i.price}</td><td class="fw-bold">₱${(i.qty*i.price).toLocaleString()}</td></tr>`).join('')}</tbody>
    </table>
    <div style="text-align:right;font-size:16px;font-weight:700;margin-top:12px">Total: ₱${o.total.toLocaleString()}</div>
    ${o.status==='Pending' ? buildIngredientPreview(o) : ''}
    ${lalamoveHTML}`;

  const btn         = document.getElementById('order-confirm-btn');
  const lalamoveBtn = document.getElementById('order-lalamove-btn');
  const prepareBtn  = document.getElementById('order-prepare-btn');
  const rejectBtn   = document.getElementById('order-reject-cancel-btn');

  const packingBtn = document.getElementById('order-packing-btn');

  // reset all
  btn.style.display='none'; lalamoveBtn.style.display='none'; prepareBtn.style.display='none'; rejectBtn.style.display='none'; packingBtn.style.display='none';
  btn.disabled=false; btn.style.background='';

  // View-only mode — no action buttons
  if(viewOnly){ openModal('order-modal'); return; }

  if(o.status==='Cancel Requested'){
    btn.textContent='Accept Cancellation'; btn.style.display=''; btn.style.background='#DC2626';
    rejectBtn.style.display='';
    // Show cancel reason banner inside modal body if present
    if(o.cancelReason){
      const body = document.getElementById('order-modal-body');
      body.innerHTML = `<div style="margin-bottom:16px;padding:12px 16px;background:#FFF7ED;border:1.5px solid #EA580C;border-radius:10px;display:flex;gap:10px;align-items:flex-start">
        <span style="font-size:18px;flex-shrink:0">⚠️</span>
        <div><div style="font-size:12px;font-weight:700;color:#EA580C;margin-bottom:2px">CANCELLATION REQUEST</div>
        <div style="font-size:13px;color:#374151">Reason: <strong>${o.cancelReason}</strong></div></div>
      </div>` + body.innerHTML;
    }
  } else if(o.status==='Cancelled'){
    if(o.cancelledByBuyer){
      btn.textContent='Confirm Cancellation'; btn.style.display='';
      btn.style.background='#DC2626';
    }
    // no other actions for cancelled
  } else if(o.status==='Pending'){
    btn.textContent='Confirm Order'; btn.style.display='';
  } else if(o.status==='Confirmed'){
    prepareBtn.style.display='';
  } else if(o.status==='Ready for Packing'){
    packingBtn.textContent = '📦 Start Packing';
    packingBtn.onclick = () => packerStartPacking(currentOrderId);
    packingBtn.style.display='';
  } else if(o.status==='Preparing'){
    if(!tracking){
      if(o.preparingSubStatus === 'baking'){
        packingBtn.style.display='';
      } else if(o.preparingSubStatus === 'packing'){
        packingBtn.textContent = '✅ Done Packing';
        packingBtn.onclick = () => { packerDonePacking(currentOrderId); closeModal('order-modal'); };
        packingBtn.style.display='';
      } else if(o.preparingSubStatus === 'packed'){
        packingBtn.textContent = '📍 Ready for Book';
        packingBtn.onclick = () => { packerReadyForBook(currentOrderId); closeModal('order-modal'); };
        packingBtn.style.display='';
      } else {
        lalamoveBtn.textContent='🛵 Book Lalamove';
        lalamoveBtn.style.display='';
      }
      if(o.preparingSubStatus === 'readyForBook' && o.preferredDate){
        const today = new Date(); today.setHours(0,0,0,0);
        const pref  = new Date(o.preferredDate); pref.setHours(0,0,0,0);
        const isToday = today.getTime() === pref.getTime();
        lalamoveBtn.disabled = !isToday;
        lalamoveBtn.title = isToday ? '' : `Can only book on the preferred delivery date: ${pref.toLocaleDateString('en-PH',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}`;
      } else {
        lalamoveBtn.disabled = false;
        lalamoveBtn.title = '';
      }
    } else {
      // Lalamove booked — allow Mark Fulfilled only when delivered
      const isDelivered = tracking.status === 'COMPLETED';
      btn.textContent='Mark Fulfilled';
      btn.style.display='';
      btn.disabled = !isDelivered;
      btn.title = isDelivered ? '' : 'Available once Lalamove delivery is completed';
    }
  }

  // Role-based modal action restrictions
  const modalRole = currentUser.role;
  if(modalRole === 'Baker'){
    lalamoveBtn.style.display = 'none';
    btn.style.display = 'none';
    rejectBtn.style.display = 'none';
    if(o.preparingSubStatus && o.preparingSubStatus !== 'baking'){
      packingBtn.style.display = 'none';
    }
  } else if(modalRole === 'Packer'){
    prepareBtn.style.display = 'none';
    lalamoveBtn.style.display = 'none';
    // packingBtn is "Start Packing" for Ready for Packing — keep it visible for Packer
    btn.style.display = 'none';
    rejectBtn.style.display = 'none';
  }

  openModal('order-modal');
}

/* Book a Lalamove delivery for the currently-open order */
function bookLalamove(){
  const o = DB.orders.find(oo=>oo.id===currentOrderId);
  if(!o) return;

  if(o.preferredDate){
    const today = new Date(); today.setHours(0,0,0,0);
    const pref  = new Date(o.preferredDate); pref.setHours(0,0,0,0);
    if(today.getTime() !== pref.getTime()){
      toast(`Lalamove can only be booked on the preferred delivery date: ${pref.toLocaleDateString('en-PH',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}`, 'error');
      return;
    }
  }

  const btn = document.getElementById('order-lalamove-btn');
  btn.disabled   = true;
  btn.textContent = 'Booking...';

  fetch('http://localhost:5000/lalamove/create-order', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName:    o.customer,
      customerPhone:   o.phone,
      deliveryAddress: o.address
    })
  })
  .then(r => r.json())
  .then(data => {
    if(data.success){
      // Save tracking to Supabase order_tracking table
      const trackingData = {
        lalamoveRef: data.orderRef,
        shareLink:   data.shareLink || null,
        status:      'ASSIGNING_DRIVER',
        driver:      null,
        lastUpdated: new Date().toISOString()
      };
      _supa.from('order_tracking')
        .upsert({ order_id: o.id, data: trackingData }, { onConflict: 'order_id' })
        .catch(console.error);

      o.lalamoveRef = data.orderRef;
      saveDB();

      toast('Lalamove booked! Ref: ' + data.orderRef, 'success');
      closeModal('order-modal');
      openOrderModal(o.id); // reopen to show tracking section
    } else {
      btn.disabled   = false;
      btn.textContent = '🛵 Book Lalamove';
      const errMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
      toast('Lalamove error: ' + errMsg, 'error');
    }
  })
  .catch(err => {
    btn.disabled   = false;
    btn.textContent = '🛵 Book Lalamove';
    toast('Network error: ' + err.message, 'error');
  });
}

/* Poll Lalamove statuses for all active bookings and update Supabase order_tracking */
async function pollLalamoveStatuses(){
  const { data: trackingRows } = await _supa.from('order_tracking').select('order_id, data');
  if (!trackingRows) return;

  const active = trackingRows.filter(row => {
    const t = row.data;
    return t.lalamoveRef &&
      t.status !== 'COMPLETED' && t.status !== 'CANCELED' &&
      t.status !== 'EXPIRED'   && t.status !== 'REJECTED';
  });

  for (const row of active) {
    const orderId = row.order_id;
    const t       = row.data;

    try {
      const r    = await fetch(`http://localhost:5000/lalamove/track/${t.lalamoveRef}`);
      const data = await r.json();
      if (!data.success) continue;

      const updatedTracking = {
        ...t,
        status:      data.status,
        lastUpdated: new Date().toISOString(),
        ...(data.driver && { driver: data.driver })
      };

      // Send email once per meaningful status transition
      const lalamoveEmailMap = { 'ASSIGNING_DRIVER': 'Finding Driver', 'ON_GOING': 'On the Way' };
      const friendlyStatus   = lalamoveEmailMap[data.status];
      const adminOrder       = DB.orders.find(o => o.id === orderId);

      if (friendlyStatus && friendlyStatus !== t.emailedStatus && adminOrder) {
        updatedTracking.emailedStatus = friendlyStatus;
        sendStatusEmail(adminOrder, friendlyStatus);
      }

      await _supa.from('order_tracking')
        .upsert({ order_id: orderId, data: updatedTracking }, { onConflict: 'order_id' });
    } catch(e) {
      // silently skip on network error
    }
  }
}

/* ── RECIPE EDITOR HELPERS ── */
function renderRecipeRows(recipe, readOnly=false){
  const wrap = document.getElementById('pm-recipe-rows');
  wrap.innerHTML = '';
  (recipe||[]).forEach(r => addRecipeRow(r, readOnly));
}

function addRecipeRow(data, readOnly=false){
  const wrap = document.getElementById('pm-recipe-rows');
  const row  = document.createElement('div');
  row.className = 'recipe-row';
  row.style.cssText = 'display:flex;gap:8px;align-items:center';

  const roStyle = readOnly ? 'background:var(--bg-2,#f8f9fb);cursor:not-allowed;opacity:0.75;' : '';

  const sel = document.createElement('select');
  sel.style.cssText = `flex:1;border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font:inherit;color:var(--text-1);background:#fff;${roStyle}`;
  sel.disabled = readOnly;
  sel.innerHTML = '<option value="">Select ingredient</option>' +
    DB.ingredients.map(i=>`<option value="${i.id}" ${data?.ingredientId===i.id?'selected':''}>${i.name} (${i.unit})</option>`).join('');

  const qty = document.createElement('input');
  qty.type = 'number'; qty.min = '0'; qty.step = '0.01'; qty.placeholder = 'Qty/unit';
  qty.value = data?.qty ?? '';
  qty.readOnly = readOnly;
  qty.style.cssText = `width:90px;border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font:inherit;color:var(--text-1);${roStyle}`;

  if(!readOnly){
    const del = document.createElement('button');
    del.type = 'button'; del.textContent = '✕';
    del.style.cssText = 'color:var(--danger);font-weight:700;padding:4px 8px;border-radius:6px;background:var(--danger-light)';
    del.onclick = () => row.remove();
    row.append(sel, qty, del);
  } else {
    row.append(sel, qty);
  }
  wrap.appendChild(row);
}

function collectRecipeRows(){
  return [...document.querySelectorAll('#pm-recipe-rows .recipe-row')].map(row=>{
    const [sel, qty] = row.querySelectorAll('select, input');
    return { ingredientId: sel.value, qty: parseFloat(qty.value)||0 };
  }).filter(r => r.ingredientId && r.qty > 0);
}

function buildIngredientPreview(){ return ''; }

function openFulfillModal(id){
  currentOrderId = id;
  openOrderModal(id);
}

function restoreDailyLimit(order){
  const today = todayDate();
  (order.items||[]).forEach(item => {
    const p = DB.products.find(pp => pp.name===item.name || pp.id===item.id);
    if(p && p.lastResetDate === today){
      p.soldToday = Math.max(0, (p.soldToday||0) - (item.qty||1));
    }
  });
}

function confirmOrderAction(){
  const o = DB.orders.find(oo=>oo.id===currentOrderId);
  if(!o) return;

  if(o.status==='Cancel Requested'){
    showConfirm({
      title: 'Accept Cancellation',
      message: `Accept the cancellation request for order ${o.id}? The order will be cancelled.`,
      okText: 'Accept Cancellation',
      icon: 'bx-x-circle',
      onConfirm: () => {
        o.status = 'Cancelled';
        o.cancelRequestedByBuyer = false;

        // Restore soldToday since order was deducted at placement
        restoreDailyLimit(o);

        // Clear from sl_store_orders so syncStoreOrders() doesn't re-trigger
        const storeOrders = JSON.parse(localStorage.getItem('sl_store_orders') || '[]');
        const so = storeOrders.find(x => x.id === o.id);
        if(so){ so.status = 'Cancelled'; localStorage.setItem('sl_store_orders', JSON.stringify(storeOrders)); }

        syncStatusToCustomer(o, 'Cancelled');
        saveDB(); closeModal('order-modal'); renderOrders(); updateBadges();
        toast('Cancellation accepted', 'success');
      }
    });
    return;
  } else if(o.status==='Cancelled'){
    showConfirm({
      title: 'Confirm Cancellation',
      message: `The buyer cancelled order ${o.id}. Accept this cancellation?`,
      okText: 'Accept Cancellation',
      icon: 'bx-x-circle',
      onConfirm: () => {
        o.cancelledByBuyer = false;
        // Restore soldToday since order was deducted at placement
        restoreDailyLimit(o);
        syncStatusToCustomer(o, 'Cancelled');
        saveDB(); closeModal('order-modal'); renderOrders(); updateBadges();
        toast('Order cancellation accepted', 'success');
      }
    });
    return;
  } else if(o.status==='Pending'){
    // Deduct raw ingredients on confirmation (soldToday already counted at placement)
    o.items.forEach(item=>{
      const p = DB.products.find(pp=>pp.name===item.name || pp.id===item.id);
      if(p){
        if(p.recipe){
          p.recipe.forEach(r=>{
            const ing = DB.ingredients.find(i=>i.id===r.ingredientId);
            if(ing){
              const ibefore = ing.stock;
              const deduct = r.qty * item.qty;
              ing.stock = Math.max(0, ing.stock - deduct);
              logStock({ type:'ingredient', itemId:ing.id, itemName:ing.name, unit:ing.unit, op:'order', before:ibefore, after:ing.stock, note:`Order confirmed`, ref:o.id });
            }
          });
        }
      }
    });
    // Update sl_store_orders so syncStoreOrders() doesn't re-import as Pending on reload
    const _soConfirm = JSON.parse(localStorage.getItem('sl_store_orders') || '[]');
    const _soMatchC = _soConfirm.find(x => x.id === o.id);
    if(_soMatchC){ _soMatchC.status = 'Confirmed'; localStorage.setItem('sl_store_orders', JSON.stringify(_soConfirm)); }
    updateOrderStatus(o.id,'Confirmed');
    syncStatusToCustomer(o, 'Confirmed');
  } else if(o.status==='Preparing'){
    // Stock already deducted at confirmation — just record transaction
    updateOrderStatus(o.id,'Fulfilled');
    if(!DB.transactions.find(t=>t.id==='TX-'+o.id))
      DB.transactions.push({ id:'TX-'+o.id, customer:o.customer, items:o.items, total:o.total, date:new Date().toISOString(), payment:o.payment||'GCash' });
    syncStatusToCustomer(o, 'Fulfilled');
  }

  saveDB(); closeModal('order-modal'); renderOrders(); updateBadges(); renderInventory();
}

function prepareOrderAction(){
  const o = DB.orders.find(oo=>oo.id===currentOrderId);
  if(!o) return;
  o.preparingAt = new Date().toISOString();
  o.preparingSubStatus = 'baking';
  const _soPrep = JSON.parse(localStorage.getItem('sl_store_orders') || '[]');
  const _soMatchP = _soPrep.find(x => x.id === o.id);
  if(_soMatchP){ _soMatchP.status = 'Preparing'; localStorage.setItem('sl_store_orders', JSON.stringify(_soPrep)); }
  updateOrderStatus(o.id, 'Preparing');
  syncStatusToCustomer(o, 'Preparing');
  saveDB(); closeModal('order-modal'); renderOrders(); updateBadges();
}

function startPackingAction(){
  const o = DB.orders.find(oo=>oo.id===currentOrderId);
  if(!o) return;
  o.preparingSubStatus = 'packing';
  // Sync only preparingSubStatus to customer (no email yet via syncStatusToCustomer)
  const email = o.customerEmail;
  if(email && email !== 'guest'){
    const key = 'orders_' + email;
    const userOrders = JSON.parse(localStorage.getItem(key) || '[]');
    const uo = userOrders.find(x => x.id === o.id);
    if(uo){ uo.preparingSubStatus = 'packing'; localStorage.setItem(key, JSON.stringify(userOrders)); }
  }
  sendStatusEmail(o, 'Packing');
  saveDB(); closeModal('order-modal'); renderOrders(); updateBadges();
  toast('Order marked as Packing — passed to Packer', 'success');
}

function bakerDoneBaking(id){
  const o = DB.orders.find(oo=>oo.id===id);
  if(!o) return;
  currentOrderId = id;
  showConfirm({
    title: 'Done Baking?',
    message: `Mark order ${o.id} as done baking? It will be passed to the Packer for packaging.`,
    okText: 'Done Baking',
    okClass: 'btn-prepare',
    icon: 'bx-check-double',
    onConfirm: () => {
      delete o.preparingSubStatus;
      o.status = 'Ready for Packing';
      const _soRfp = JSON.parse(localStorage.getItem('sl_store_orders') || '[]');
      const _soMatchRfp = _soRfp.find(x => x.id === o.id);
      if(_soMatchRfp){ _soMatchRfp.status = 'Ready for Packing'; localStorage.setItem('sl_store_orders', JSON.stringify(_soRfp)); }
      syncStatusToCustomer(o, 'Ready for Packing');
      saveDB(); renderOrders(); updateBadges();
      toast('Order is Ready for Packing — Packer notified ✓', 'success');
    }
  });
}

function packerStartPacking(id){
  const o = DB.orders.find(oo=>oo.id===id);
  if(!o) return;
  showConfirm({
    title: 'Start Packing?',
    message: `Start packing order ${o.id}? The order will be marked as being packed.`,
    okText: 'Start Packing',
    okClass: 'btn-prepare',
    icon: 'bx-package',
    onConfirm: () => {
      o.preparingSubStatus = 'packing';
      o.status = 'Preparing';
      const _soPack = JSON.parse(localStorage.getItem('sl_store_orders') || '[]');
      const _soMatchPk = _soPack.find(x => x.id === o.id);
      if(_soMatchPk){ _soMatchPk.status = 'Preparing'; localStorage.setItem('sl_store_orders', JSON.stringify(_soPack)); }
      syncStatusToCustomer(o, 'Packing');
      closeModal('order-modal');
      saveDB(); renderOrders(); updateBadges();
      toast('Packing started!', 'success');
    }
  });
}

function packerDonePacking(id){
  const o = DB.orders.find(oo=>oo.id===id);
  if(!o) return;
  showConfirm({
    title: 'Done Packing?',
    message: `Mark order ${o.id} as done packing? You can then book Lalamove for delivery.`,
    okText: 'Done Packing',
    okClass: 'btn-prepare',
    icon: 'bx-package',
    onConfirm: () => {
      o.preparingSubStatus = 'packed';
      syncStatusToCustomer(o, 'Packed');
      saveDB(); renderOrders(); updateBadges();
      toast('Order packed — ready to book Lalamove!', 'success');
    }
  });
}

function packerReadyForBook(id){
  const o = DB.orders.find(oo=>oo.id===id);
  if(!o) return;
  showConfirm({
    title: 'Ready for Book?',
    message: `Mark order ${o.id} as ready for booking? You can then book Lalamove for delivery.`,
    okText: 'Ready for Book',
    okClass: 'btn-prepare',
    icon: 'bx-map-pin',
    onConfirm: () => {
      o.preparingSubStatus = 'readyForBook';
      syncStatusToCustomer(o, 'Packed');
      saveDB(); renderOrders(); updateBadges();
      toast('Order ready — you can now book Lalamove!', 'success');
    }
  });
}

function openRefundModal(id){
  currentOrderId = id;
  const o = DB.orders.find(oo=>oo.id===id);
  if(!o) return;

  document.getElementById('refund-gcash-number').value = o.phone || '';
  document.getElementById('refund-ref-number').value = '';
  document.getElementById('refund-note').value = '';
  document.getElementById('refund-modal-info').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
      <div><span style="color:var(--text-2);font-size:11px;font-weight:700">ORDER</span><div class="fw-bold">${o.id}</div></div>
      <div><span style="color:var(--text-2);font-size:11px;font-weight:700">CUSTOMER</span><div>${o.customer}</div></div>
      <div><span style="color:var(--text-2);font-size:11px;font-weight:700">AMOUNT TO REFUND</span><div class="fw-bold" style="color:#16A34A;font-size:15px">₱${o.total.toLocaleString()}</div></div>
      <div><span style="color:var(--text-2);font-size:11px;font-weight:700">PAYMENT</span><div>${o.payment}</div></div>
    </div>`;
  openModal('refund-modal');
}

function confirmRefund(){
  const o = DB.orders.find(oo=>oo.id===currentOrderId);
  if(!o) return;
  const gcash = document.getElementById('refund-gcash-number').value.trim();
  if(!gcash){ toast('Please enter the GCash number', 'danger'); return; }
  if(!/^09\d{9}$/.test(gcash)){ toast('Enter a valid 11-digit GCash number (09XXXXXXXXX)', 'danger'); return; }

  o.refunded = true;
  o.refundDetails = {
    gcashNumber: gcash,
    refNo: document.getElementById('refund-ref-number').value.trim() || null,
    note: document.getElementById('refund-note').value.trim() || null,
    date: new Date().toISOString()
  };

  saveDB();
  closeModal('refund-modal');
  renderOrders();
  toast(`Refund of ₱${o.total.toLocaleString()} marked as processed`, 'success');
}

function rejectCancelRequest(){
  const o = DB.orders.find(oo=>oo.id===currentOrderId);
  if(!o) return;
  showConfirm({
    title: 'Reject Cancellation',
    message: `Reject the cancellation request for order ${o.id}? The order will return to Pending.`,
    okText: 'Reject',
    icon: 'bx-revision',
    onConfirm: () => {
      o.status = 'Pending';
      o.cancelRequestedByBuyer = false;
      o.cancelReason = null;

      // Clear from sl_store_orders so syncStoreOrders() doesn't re-apply the request
      const storeOrders = JSON.parse(localStorage.getItem('sl_store_orders') || '[]');
      const so = storeOrders.find(x => x.id === o.id);
      if(so){ so.status = 'Pending'; so.cancelReason = null; localStorage.setItem('sl_store_orders', JSON.stringify(storeOrders)); }

      // Clear from customer's order key and set rejection notice
      syncStatusToCustomer(o, 'Pending');
      const email = o.customerEmail;
      if(email && email !== 'guest'){
        const key = 'orders_' + email;
        const userOrders = JSON.parse(localStorage.getItem(key) || '[]');
        const uo = userOrders.find(x => x.id === o.id);
        if(uo){ uo.cancelReason = null; uo.cancelRejectedNotice = true; localStorage.setItem(key, JSON.stringify(userOrders)); }

        // Push notification to customer's bell notification panel
        const notifKey = 'sl_buyer_notifs_' + email;
        const notifs = JSON.parse(localStorage.getItem(notifKey) || '[]');
        notifs.unshift({ id: Date.now() + '_cancel_rejected_' + o.id, orderId: o.id, message: `❌ Your cancellation request for order ${o.id} was rejected. Your order is still active.`, status: 'cancel_rejected', seen: false, ts: Date.now() });
        localStorage.setItem(notifKey, JSON.stringify(notifs.slice(0, 20)));
      }

      saveDB(); closeModal('order-modal'); renderOrders(); updateBadges();
      toast('Cancellation rejected — order returned to Pending', 'success');
    }
  });
}

function updateOrderStatus(id, status){
  const o = DB.orders.find(oo=>oo.id===id);
  if(!o) return;
  o.status = status;
  // Keep sl_store_orders in sync so a DB re-init never re-imports a stale status
  const _soUpd = JSON.parse(localStorage.getItem('sl_store_orders') || '[]');
  const _soMatchUpd = _soUpd.find(x => x.id === id);
  if(_soMatchUpd){ _soMatchUpd.status = status; localStorage.setItem('sl_store_orders', JSON.stringify(_soUpd)); }
  saveDB(); renderOrders(); updateBadges(); toast('Order '+status,'success');
}

function syncStatusToCustomer(order, status){
  const email = order.customerEmail;
  if(!email || email === 'guest') return;
  const key = 'orders_' + email;
  const userOrders = JSON.parse(localStorage.getItem(key) || '[]');
  const uo = userOrders.find(x => x.id === order.id);
  if(uo){
    uo.status = status;
    if(order.preparingAt) uo.preparingAt = order.preparingAt;
    if(order.preparingSubStatus) uo.preparingSubStatus = order.preparingSubStatus;
    else delete uo.preparingSubStatus;
    localStorage.setItem(key, JSON.stringify(userOrders));
  }
  sendStatusEmail(order, status);
}

/* =============================================
   INVENTORY
   ============================================= */
function renderInventory(){
  // Product stock
  document.getElementById('product-stock-body').innerHTML = DB.products.map(p=>{
    const sc = stockClass(p);
    return `<tr>
      <td><div class="product-cell"><div class="product-thumb"><img src="${p.img||''}" alt="${p.name}" onerror="this.style.display='none'"></div><div class="product-name">${p.name}</div></div></td>
      <td>${p.category}</td>
      <td>
        <div class="stock-bar-wrap">
          <div class="stock-bar"><div class="stock-bar-fill ${sc}" style="width:${stockPct(p)}%"></div></div>
          <div class="stock-label">${Math.max(0,(p.dailyLimit||0)-(p.soldToday||0))}/${p.dailyLimit||0} left</div>
        </div>
      </td>
      <td>${p.threshold}</td>
      <td><span class="pill ${sc==='low'?'low':'ok'}">${sc==='low'?'Near Limit':'Available'}</span></td>
      <td>
        <button class="btn-icon warn" onclick="openAdjustStock('${p.id}','product')" title="Set daily limit"><i class='bx bx-slider'></i></button>
      </td>
    </tr>`;
  }).join('');

  // Ingredients — filtered by active category tab
  const ingCategories = ['General', 'Cookies', 'Brownies', 'Cupcakes'];
  const catIcons = { General:'bx-category', Cookies:'bx-cookie', Brownies:'bx-dish', Cupcakes:'bx-cake' };
  const activeCats = ingCatFilter === 'All' ? ingCategories : [ingCatFilter];
  const ingSearchQ = (document.getElementById('ing-search')?.value || '').toLowerCase().trim();
  let ingHTML = '';
  activeCats.forEach(cat => {
    const items = DB.ingredients.filter(ing =>
      (ing.category||'General') === cat &&
      (!ingSearchQ || ing.name.toLowerCase().includes(ingSearchQ))
    );
    if(!items.length) return;
    if(ingCatFilter === 'All'){
      ingHTML += `<tr>
        <td colspan="6" style="padding:10px 16px 6px;background:var(--bg-2,#f8f9fb);border-top:2px solid var(--border)">
          <span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:var(--text-2);text-transform:uppercase;letter-spacing:.06em">
            <i class='bx ${catIcons[cat]||"bx-category"}' style="font-size:14px"></i>${cat}
          </span>
        </td>
      </tr>`;
    }
    items.forEach(ing => {
      const low = ing.stock <= ing.threshold;
      const pct = Math.min(100,Math.round((ing.stock/Math.max(ing.threshold*3,1))*100));
      ingHTML += `<tr>
        <td class="fw-bold">${ing.name}</td>
        <td>${ing.unit}</td>
        <td>
          <div class="stock-bar-wrap">
            <div class="stock-bar"><div class="stock-bar-fill ${low?'low':'ok'}" style="width:${pct}%"></div></div>
            <div class="stock-label">${ing.stock} ${ing.unit}</div>
          </div>
        </td>
        <td>${ing.threshold} ${ing.unit}</td>
        <td><span class="pill ${low?'low':'ok'}">${low?'Low Stock':'OK'}</span></td>
        <td>
          <div class="td-actions">
            <button class="btn-icon warn" onclick="openAdjustStock('${ing.id}','ingredient')" title="Adjust"><i class='bx bx-slider'></i></button>
            <button class="btn-icon edit" onclick="openIngredientModal('${ing.id}')" title="Edit"><i class='bx bx-edit'></i></button>
            <button class="btn-icon danger" onclick="deleteIngredient('${ing.id}')" title="Delete"><i class='bx bx-trash'></i></button>
            <button class="btn-icon" style="background:#DBEAFE;color:#2563EB" onclick="openOrderStockModal('${ing.id}')" title="Order Stock"><i class='bx bx-cart-add'></i></button>
          </div>
        </td>
      </tr>`;
    });
  });
  document.getElementById('ingredients-body').innerHTML = ingHTML;
}

function openOrderStockModal(ingId){
  const ing = DB.ingredients.find(i => i.id === ingId);
  if(!ing) return;
  document.getElementById('os-ing-name').value  = ing.name;
  document.getElementById('os-ing-stock').value = ing.stock + ' ' + ing.unit;
  document.getElementById('os-unit').value = ing.unit;
  document.getElementById('os-qty').value        = '';
  document.getElementById('os-supplier').value   = '';
  document.getElementById('os-date').value       = '';
  document.getElementById('os-notes').value      = '';
  openModal('order-stock-modal');
}

function openAdjustStock(id, type){
  document.getElementById('adj-id').value   = id;
  document.getElementById('adj-type').value = type;
  let current;
  if(type==='product'){
    const p = DB.products.find(pp=>pp.id===id);
    current = p.dailyLimit||0;
    document.getElementById('adjust-title').textContent = 'Set Daily Limit — '+p.name;
  } else {
    const i = DB.ingredients.find(ii=>ii.id===id);
    current = i.stock;
    document.getElementById('adjust-title').textContent = 'Adjust Stock — '+i.name;
  }
  document.getElementById('adj-current').textContent = current;
  document.getElementById('adj-amount').value = '';
  document.getElementById('adj-note').value   = '';
  openModal('adjust-stock-modal');
}

function confirmAdjustStock(){
  const id     = document.getElementById('adj-id').value;
  const type   = document.getElementById('adj-type').value;
  const op     = document.getElementById('adj-op').value;
  const amount = parseFloat(document.getElementById('adj-amount').value)||0;
  if(amount<=0&&op!=='set'){ toast('Enter valid amount','warning'); return; }

  const note = document.getElementById('adj-note').value.trim();

  if(type==='product'){
    const item = DB.products.find(p=>p.id===id);
    const before = item.dailyLimit||0;
    if(op==='add')      item.dailyLimit = (item.dailyLimit||0) + amount;
    else if(op==='sub') item.dailyLimit = Math.max(0, (item.dailyLimit||0) - amount);
    else                item.dailyLimit = amount;
    logStock({ type, itemId: id, itemName: item.name, unit:'units', op, before, after: item.dailyLimit, note, ref: 'Manual Adjustment' });
  } else {
    const item = DB.ingredients.find(i=>i.id===id);
    const before = item.stock;
    if(op==='add')      item.stock = item.stock + amount;
    else if(op==='sub') item.stock = Math.max(0, item.stock - amount);
    else                item.stock = amount;
    logStock({ type, itemId: id, itemName: item.name, unit: item.unit||'units', op, before, after: item.stock, note, ref: 'Manual Adjustment' });
  }

  saveDB(); closeModal('adjust-stock-modal'); renderInventory(); updateBadges();
  toast('Updated','success');
}

function openIngredientModal(id){
  const ing = id ? DB.ingredients.find(i=>i.id===id) : null;
  const isEdit = !!ing;
  document.getElementById('ing-modal-title').textContent = isEdit?'Edit Ingredient':'Add Ingredient';
  document.getElementById('ing-id').value        = ing?.id||'';
  document.getElementById('ing-name').value      = ing?.name||'';
  document.getElementById('ing-unit').value      = ing?.unit||'g';
  document.getElementById('ing-stock').value     = ing?.stock||'';
  document.getElementById('ing-threshold').value = ing?.threshold||'';
  document.getElementById('ing-category').value  = ing?.category||'General';
  const roStyle = 'background:var(--bg-2,#f8f9fb);cursor:not-allowed;opacity:0.6;pointer-events:none';
  ['ing-name','ing-unit','ing-category','ing-stock'].forEach(elId => {
    const el = document.getElementById(elId);
    el.disabled = isEdit;
    el.style.cssText = isEdit ? roStyle : '';
  });
  openModal('ingredient-modal');
}

function saveIngredient(){
  const id   = document.getElementById('ing-id').value;
  const name = document.getElementById('ing-name').value.trim();
  const unit = document.getElementById('ing-unit').value;
  const stock= parseFloat(document.getElementById('ing-stock').value);
  const thr  = parseFloat(document.getElementById('ing-threshold').value);
  const cat  = document.getElementById('ing-category').value;
  if(!name||isNaN(stock)||isNaN(thr)){ toast('Fill all fields','danger'); return; }
  if(id){
    const idx = DB.ingredients.findIndex(i=>i.id===id);
    DB.ingredients[idx] = {...DB.ingredients[idx], name, unit, stock, threshold:thr, category:cat};
    toast('Ingredient updated','success');
  } else {
    DB.ingredients.push({id:'i'+Date.now(), name, unit, stock, threshold:thr, category:cat});
    toast('Ingredient added','success');
  }
  saveDB(); closeModal('ingredient-modal'); renderInventory(); updateBadges();
}

function deleteIngredient(id){
  const ing = DB.ingredients.find(i=>i.id===id);
  showConfirm({
    title: 'Delete Ingredient',
    message: `Are you sure you want to delete "${ing?.name}"? This cannot be undone.`,
    okText: 'Delete',
    icon: 'bx-trash',
    onConfirm: () => {
      DB.ingredients = DB.ingredients.filter(i=>i.id!==id);
      saveDB(); renderInventory();
      toast('Ingredient deleted');
    }
  });
}

function openProductStockModal(){
  toast('Select a product row to adjust its stock','');
}

/* =============================================
   REPORTS
   ============================================= */
function setReportPeriod(period, btn){
  reportPeriod=period;
  document.querySelectorAll('.period-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderReports();
}

function renderReports(){
  const txs = getFilteredTxs();
  const revenue     = txs.reduce((s,t)=>s+t.items.reduce((ss,i)=>ss+(i.qty*(i.price||0)),0),0);
  const items       = txs.reduce((s,t)=>s+t.items.reduce((ss,i)=>ss+i.qty,0),0);
  const avg         = txs.length ? revenue/txs.length : 0;

  document.getElementById('rpt-revenue').textContent      = '₱'+revenue.toLocaleString();
  document.getElementById('rpt-transactions').textContent  = txs.length;
  document.getElementById('rpt-items').textContent         = items;
  document.getElementById('rpt-avg').textContent           = '₱'+Math.round(avg).toLocaleString();

  renderRevenueTrend(txs);
  renderBestSellers(txs);
  renderTxHistory();
  renderSalesHistoryFiltered();
  renderIngHistory();
}

function buildDailySummaries(){
  const dayMap = {};
  DB.transactions.forEach(t=>{
    const d = new Date(t.date);
    const key = d.toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'});
    if(!dayMap[key]) dayMap[key] = { dateKey: key, dateRaw: new Date(d.setHours(0,0,0,0)).getTime(), txs:[] };
    dayMap[key].txs.push(t);
  });
  return Object.values(dayMap).sort((a,b)=>b.dateRaw-a.dateRaw).map(day=>{
    const revenue = day.txs.reduce((s,t)=>s+t.total,0);
    const itemsSold = day.txs.reduce((s,t)=>s+t.items.reduce((ss,i)=>ss+i.qty,0),0);
    const avg = day.txs.length ? Math.round(revenue/day.txs.length) : 0;
    const prodMap={};
    day.txs.forEach(t=>t.items.forEach(i=>{
      prodMap[i.name]=(prodMap[i.name]||0)+i.qty;
    }));
    const topProduct = Object.entries(prodMap).sort((a,b)=>b[1]-a[1])[0];
    return { date:day.dateKey, revenue, transactions:day.txs.length, itemsSold, avg, topProduct: topProduct?`${topProduct[0]} (${topProduct[1]})`:'—' };
  });
}

function renderSalesHistory(){ renderSalesHistoryFiltered(); }

function exportSalesHistoryCSV(){
  const rows = buildDailySummaries();
  const headers = ['Date','Revenue (₱)','Transactions','Items Sold','Avg. Order Value (₱)','Top Product'];
  const data = rows.map(r=>[r.date, r.revenue, r.transactions, r.itemsSold, r.avg, r.topProduct]);
  const csv = [headers, ...data].map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
  a.download = `sugarloom_sales_history_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

/* ── HISTORY FILTERS ── */
function setHistFilter(prefix, mode){
  histFilterState[prefix] = mode;
  ['today','week','all'].forEach(m=>{
    const btn = document.getElementById(`${prefix}-btn-${m}`);
    if(btn) btn.classList.toggle('active', m === mode);
  });
  if(mode !== 'date'){
    const dateEl = document.getElementById(`${prefix}-date`);
    if(dateEl) dateEl.value = '';
    const lbl = document.getElementById(`${prefix}-date-label`);
    if(lbl) lbl.textContent = 'Select date';
    const clr = document.getElementById(`${prefix}-date-clear`);
    if(clr) clr.style.display = 'none';
    const dp = document.getElementById(`${prefix}-datepicker`);
    if(dp){ dp.classList.remove('has-value','open'); }
    if(calState.selected) calState.selected[prefix] = null;
  } else {
    ['today','week','all'].forEach(m=>{
      const btn = document.getElementById(`${prefix}-btn-${m}`);
      if(btn) btn.classList.remove('active');
    });
  }
  if(prefix === 'tx')    renderTxHistory();
  if(prefix === 'sales') renderSalesHistoryFiltered();
  if(prefix === 'ing')   renderIngHistory();
}

/* ── Custom Calendar Picker ── */
const CAL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
let calState = { prefix: null, year: new Date().getFullYear(), month: new Date().getMonth(), selected: {} };

function openDatePicker(e, prefix){
  e.stopPropagation();
  const popup = document.getElementById('cal-popup');
  if(popup.classList.contains('show') && calState.prefix === prefix){
    closeDatePicker(); return;
  }
  if(calState.prefix && calState.prefix !== prefix){
    const prev = document.getElementById(`${calState.prefix}-datepicker`);
    if(prev) prev.classList.remove('open');
  }
  calState.prefix = prefix;
  const sel = calState.selected[prefix];
  if(sel){ calState.year = sel.getFullYear(); calState.month = sel.getMonth(); }
  else   { const n = new Date(); calState.year = n.getFullYear(); calState.month = n.getMonth(); }
  calRender();
  const trigger = document.getElementById(`${prefix}-datepicker`);
  trigger.classList.add('open');
  popup.classList.add('show');
  const rect = trigger.getBoundingClientRect();
  popup.style.top  = (rect.bottom + 6) + 'px';
  popup.style.left = rect.left + 'px';
  requestAnimationFrame(()=>{
    const pr = popup.getBoundingClientRect();
    if(pr.right  > window.innerWidth)  popup.style.left = (rect.right - pr.width) + 'px';
    if(pr.bottom > window.innerHeight) popup.style.top  = (rect.top - pr.height - 6) + 'px';
  });
}

function closeDatePicker(){
  const popup = document.getElementById('cal-popup');
  popup.classList.remove('show');
  if(calState.prefix){
    const dp = document.getElementById(`${calState.prefix}-datepicker`);
    if(dp) dp.classList.remove('open');
  }
}

function calNav(dir){
  calState.month += dir;
  if(calState.month > 11){ calState.month = 0; calState.year++; }
  if(calState.month < 0) { calState.month = 11; calState.year--; }
  calRender();
}

function calRender(){
  document.getElementById('cal-month-lbl').textContent = CAL_MONTHS[calState.month] + ' ' + calState.year;
  const firstDay     = new Date(calState.year, calState.month, 1).getDay();
  const daysInMonth  = new Date(calState.year, calState.month + 1, 0).getDate();
  const today        = new Date();
  const sel          = calState.selected[calState.prefix];
  let html = '';
  for(let i = 0; i < firstDay; i++) html += '<div class="cal-day cal-empty"></div>';
  for(let d = 1; d <= daysInMonth; d++){
    const isToday = today.getDate()===d && today.getMonth()===calState.month && today.getFullYear()===calState.year;
    const isSel   = sel && sel.getDate()===d && sel.getMonth()===calState.month && sel.getFullYear()===calState.year;
    let cls = 'cal-day';
    if(isToday) cls += ' cal-today';
    if(isSel)   cls += ' cal-selected';
    html += `<div class="${cls}" onclick="calSelectDay(${d})">${d}</div>`;
  }
  document.getElementById('cal-days').innerHTML = html;
}

function calSelectDay(d){
  const date = new Date(calState.year, calState.month, d);
  calState.selected[calState.prefix] = date;
  const val = `${calState.year}-${String(calState.month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const hidden = document.getElementById(`${calState.prefix}-date`);
  if(hidden) hidden.value = val;
  const lbl = document.getElementById(`${calState.prefix}-date-label`);
  if(lbl) lbl.textContent = date.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
  const clr = document.getElementById(`${calState.prefix}-date-clear`);
  if(clr) clr.style.display = '';
  const dp = document.getElementById(`${calState.prefix}-datepicker`);
  if(dp) dp.classList.add('has-value');
  closeDatePicker();
  setHistFilter(calState.prefix, 'date');
}

function calClearDate(e, prefix){
  e.stopPropagation();
  calState.selected[prefix] = null;
  const hidden = document.getElementById(`${prefix}-date`);
  if(hidden) hidden.value = '';
  const lbl = document.getElementById(`${prefix}-date-label`);
  if(lbl) lbl.textContent = 'Select date';
  const clr = document.getElementById(`${prefix}-date-clear`);
  if(clr) clr.style.display = 'none';
  const dp = document.getElementById(`${prefix}-datepicker`);
  if(dp) dp.classList.remove('has-value');
  setHistFilter(prefix, 'all');
}

document.addEventListener('click', function(e){
  const popup = document.getElementById('cal-popup');
  if(popup && popup.classList.contains('show') && !popup.contains(e.target) && !e.target.closest('.hist-datepicker')){
    closeDatePicker();
  }
});

function applyQuickFilter(rows, prefix, dateKey){
  const mode = histFilterState[prefix] || 'all';
  const now  = new Date();
  if(mode === 'today'){
    return rows.filter(r => new Date(r[dateKey]).toDateString() === now.toDateString());
  }
  if(mode === 'week'){
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0,0,0,0);
    return rows.filter(r => new Date(r[dateKey]) >= start);
  }
  if(mode === 'date'){
    const val = document.getElementById(`${prefix}-date`)?.value;
    if(!val) return rows;
    const picked = new Date(val).toDateString();
    return rows.filter(r => new Date(r[dateKey]).toDateString() === picked);
  }
  return rows;
}

function filterIngHistCat(cat, btn){
  ingHistCat = cat;
  document.querySelectorAll('.ing-hist-cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderIngHistory();
}

function renderIngHistory(){
  if(!DB.stockLog) DB.stockLog = [];
  const filtered = applyQuickFilter(
    [...DB.stockLog].filter(l=>l.type==='ingredient'),
    'ing', 'date'
  );
  // Aggregate by ingredient
  const map = {};
  filtered.forEach(r => {
    if(!map[r.itemName]) map[r.itemName] = { name:r.itemName, unit:r.unit, totalUsed:0, totalAdded:0, orderRefs:new Set(), lastDate:null };
    const m = map[r.itemName];
    if(r.op==='order') m.totalUsed += Math.abs(r.change);
    if(r.op==='add')   m.totalAdded += Math.abs(r.change);
    if(r.ref && r.op==='order') m.orderRefs.add(r.ref);
    if(!m.lastDate || new Date(r.date) > new Date(m.lastDate)) m.lastDate = r.date;
  });
  let summary = Object.values(map).sort((a,b)=>a.name.localeCompare(b.name));
  if(ingHistCat !== 'All'){
    summary = summary.filter(s => {
      const ing = DB.ingredients.find(i=>i.name===s.name);
      return ing && ing.category === ingHistCat;
    });
  }
  const ingHistQ = (document.getElementById('ing-hist-search')?.value || '').toLowerCase().trim();
  if(ingHistQ) summary = summary.filter(s => s.name.toLowerCase().includes(ingHistQ));
  document.getElementById('ing-history-body').innerHTML = summary.map(s => {
    const ing = DB.ingredients.find(i=>i.name===s.name);
    const stock = ing ? ing.stock : '—';
    const unit  = ing ? ing.unit  : s.unit;
    const low   = ing && ing.stock <= ing.threshold;
    return `<tr>
      <td class="fw-bold">${s.name}</td>
      <td>${unit}</td>
      <td style="color:${low?'var(--danger)':'inherit'};font-weight:${low?700:400}">${stock} ${unit}</td>
      <td style="color:var(--danger);font-weight:600">${s.totalUsed > 0 ? '-'+s.totalUsed+' '+unit : '—'}</td>
      <td style="color:var(--success);font-weight:600">${s.totalAdded > 0 ? '+'+s.totalAdded+' '+unit : '—'}</td>
      <td style="color:var(--text-2)">${s.lastDate ? fmtDateTime(s.lastDate) : '—'}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-2)">No ingredient data for this period</td></tr>';
}

function exportIngHistoryCSV(){
  if(!DB.stockLog) return;
  const rows = [...DB.stockLog].filter(l=>l.type==='ingredient').sort((a,b)=>new Date(b.date)-new Date(a.date));
  const headers = ['Date','Ingredient','Operation','Before','Change','After','Unit','Reference','Note'];
  const data = rows.map(r=>[fmtDateTime(r.date), r.itemName, r.op, r.before, r.change, r.after, r.unit, r.ref||'', r.note||'']);
  const csv = [headers, ...data].map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
  a.download = `sugarloom_ingredient_history_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

function renderTxHistory(){
  const txs = getFilteredTxs();
  const filtered = applyQuickFilter(
    [...txs].sort((a,b)=>new Date(b.date)-new Date(a.date)),
    'tx', 'date'
  );
  document.getElementById('transactions-body').innerHTML = filtered.map(t=>`
    <tr>
      <td class="fw-bold">${t.id}</td>
      <td>${t.customer}</td>
      <td>${t.items.map(i=>i.name+(i.qty>1?' x'+i.qty:'')).join(', ')}</td>
      <td>${t.payment||'Cash'}</td>
      <td class="fw-bold">₱${t.total.toLocaleString()}</td>
      <td>${fmtDateTime(t.date)}</td>
    </tr>`).join('') || '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-2)">No transactions</td></tr>';
}

function renderSalesHistoryFiltered(){
  const all  = buildDailySummaries();
  const rows = applyQuickFilter(all, 'sales', 'date');
  const tbody = document.getElementById('sales-history-body');
  if(!rows.length){
    tbody.innerHTML='<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-2)">No sales history yet</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(r=>`
    <tr>
      <td class="fw-bold">${r.date}</td>
      <td class="fw-bold" style="color:var(--success)">₱${r.revenue.toLocaleString()}</td>
      <td>${r.transactions}</td>
      <td>${r.itemsSold}</td>
      <td>₱${r.avg.toLocaleString()}</td>
      <td style="color:var(--text-2)">${r.topProduct}</td>
    </tr>`).join('');
}

function getFilteredTxs(){
  const now = new Date();
  return DB.transactions.filter(t=>{
    const d = new Date(t.date);
    if(reportPeriod==='day')   return d.toDateString()===now.toDateString();
    if(reportPeriod==='week'){
      const start = new Date(now);
      start.setDate(now.getDate()-6);
      start.setHours(0,0,0,0);
      return d>=start;
    }
    if(reportPeriod==='month'){
      const start = new Date(now);
      start.setDate(now.getDate()-29);
      start.setHours(0,0,0,0);
      return d>=start;
    }
    return true;
  });
}

let revenueTrendChart = null;
function renderRevenueTrend(txs){
  let labels=[], slots=[];
  if(reportPeriod==='day'){
    labels=['12am–3am','3am–6am','6am–9am','9am–12pm','12pm–3pm','3pm–6pm','6pm–9pm','9pm–12am'];
    slots=Array(8).fill(0);
    txs.forEach(t=>{ const h=new Date(t.date).getHours(); const rev=t.items.reduce((s,i)=>s+(i.qty*(i.price||0)),0); slots[Math.floor(h/3)]+=rev; });
  } else if(reportPeriod==='week'){
    for(let i=6;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); labels.push(d.toLocaleDateString('en',{weekday:'short',month:'short',day:'numeric'})); slots.push(0); }
    txs.forEach(t=>{ const d=new Date(t.date); const di=6-Math.floor((new Date()-d)/86400000); const rev=t.items.reduce((s,i)=>s+(i.qty*(i.price||0)),0); if(di>=0&&di<7) slots[di]+=rev; });
  } else {
    const monthStart = new Date(now); monthStart.setDate(now.getDate()-29); monthStart.setHours(0,0,0,0);
    labels=['Week 1','Week 2','Week 3','Week 4'];
    slots=Array(4).fill(0);
    txs.forEach(t=>{ const d=new Date(t.date); const dayOffset=Math.floor((d-monthStart)/86400000); const w=Math.min(3,Math.floor(dayOffset/7)); const rev=t.items.reduce((s,i)=>s+(i.qty*(i.price||0)),0); if(w>=0) slots[w]+=rev; });
  }
  const canvas = document.getElementById('revenue-trend-info');
  if(revenueTrendChart){ revenueTrendChart.destroy(); revenueTrendChart=null; }
  revenueTrendChart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Revenue',
        data: slots,
        fill: true,
        backgroundColor: 'rgba(99,102,241,0.1)',
        borderColor: 'rgba(99,102,241,1)',
        borderWidth: 2.5,
        pointBackgroundColor: 'rgba(99,102,241,1)',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => '₱' + ctx.parsed.y.toLocaleString()
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: { font: { size: 11 } }
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: {
            font: { size: 11 },
            callback: v => '₱' + v.toLocaleString()
          }
        }
      }
    }
  });
}

function renderBestSellers(txs){
  const sales={};
  txs.forEach(t=>t.items.forEach(i=>{
    const key = i.name;
    if(!sales[key]) sales[key]={name:i.name,qty:0,rev:0};
    sales[key].qty += i.qty;
    sales[key].rev += i.qty * (i.price||0);
  }));
  const top=Object.values(sales).sort((a,b)=>b.qty-a.qty).slice(0,5);
  document.getElementById('best-sellers-info').innerHTML = top.map((p,idx)=>{
    const avgPrice = p.qty ? Math.round(p.rev/p.qty) : 0;
    return `
      <div class="bs-item">
        <span class="bs-rank rank-${idx+1}">${idx+1}</span>
        <div class="bs-info">
          <span class="bs-name">${p.name}</span>
          <span class="bs-sub">${p.qty} sold · ₱${avgPrice} avg</span>
        </div>
        <span class="bs-rev">₱${p.rev.toLocaleString()}</span>
      </div>`;
  }).join('')||'<p style="color:var(--text-2);font-size:13px;padding:12px 0">No sales data yet</p>';
}

function exportCSV(){
  const txs = getFilteredTxs();
  const rows = [['Tx ID','Customer','Items','Payment','Total','Date']];
  txs.forEach(t=>rows.push([t.id,t.customer,t.items.map(i=>i.name+' x'+i.qty).join('; '),t.payment||'',t.total,fmtDateTime(t.date)]));
  const csv = rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
  a.download = 'sugarloom_transactions.csv';
  a.click();
}

/* =============================================
   CUSTOMERS
   ============================================= */
function renderCustomers(){
  const q = (document.getElementById('customer-search')?.value||'').toLowerCase();

  // Pull registered users from store localStorage
  const storeUsers = JSON.parse(localStorage.getItem('sl_users')) || [];

  // Build a map of email → order stats from admin orders
  const statsMap = {};
  DB.orders.forEach(o => {
    const key = (o.customerEmail || '').toLowerCase();
    if(!key || key === 'guest') return;
    if(!statsMap[key]) statsMap[key] = { count:0, spent:0, lastDate:null, phone:'', address:'' };
    statsMap[key].count++;
    statsMap[key].spent += o.total || 0;
    if(!statsMap[key].lastDate || new Date(o.date) > new Date(statsMap[key].lastDate))
      statsMap[key].lastDate = o.date;
    if(o.phone)   statsMap[key].phone   = o.phone;
    if(o.address) statsMap[key].address = o.address;
  });

  // Merge: start with store users, enrich with order data
  let customers = storeUsers.map(u => {
    const key   = u.email.toLowerCase();
    const stats = statsMap[key] || { count:0, spent:0, lastDate:null, phone:'', address:'' };
    const addr  = (u.addresses && u.addresses[0])
      ? [u.addresses[0].address, u.addresses[0].city].filter(Boolean).join(', ')
      : stats.address;
    const reviewCount = Object.keys(JSON.parse(localStorage.getItem('reviews_' + u.email) || '{}')).length;
    const hasPending = DB.orders.some(o => (o.customerEmail||'').toLowerCase() === key && o.status === 'Pending' && !o.archived);
    return {
      name:     (u.fname + ' ' + u.lname).trim() || '—',
      email:    u.email,
      phone:    u.phone || stats.phone || '—',
      address:  addr || '—',
      orders:   stats.count,
      spent:    stats.spent,
      lastDate: stats.lastDate,
      hasOrders: stats.count > 0,
      reviews:  reviewCount,
      hasPending
    };
  });

  // Also include guests/customers who ordered but never registered
  Object.entries(statsMap).forEach(([email, stats]) => {
    if(!storeUsers.find(u => u.email.toLowerCase() === email)) {
      const order = DB.orders.find(o => (o.customerEmail||'').toLowerCase() === email);
      const reviewCount = Object.keys(JSON.parse(localStorage.getItem('reviews_' + email) || '{}')).length;
      customers.push({
        name:     order?.customer || '—',
        email,
        phone:    stats.phone || '—',
        address:  stats.address || '—',
        orders:   stats.count,
        spent:    stats.spent,
        lastDate: stats.lastDate,
        hasOrders: true,
        reviews:  reviewCount
      });
    }
  });

  // Apply search filter
  if(q) customers = customers.filter(c =>
    c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
  );

  // Table
  document.getElementById('customers-body').innerHTML = customers.length
    ? customers.sort((a,b) => (b.lastDate||'') > (a.lastDate||'') ? 1 : -1).map(c => `
      <tr>
        <td>
          <div class="product-cell">
            <div class="avatar-wrap">
              <div class="avatar sm">${c.name[0]?.toUpperCase()||'?'}</div>
              ${c.hasPending ? `<span class="pending-dot" title="Has pending order"></span>` : ''}
            </div>
            <div class="product-name">${c.name}</div>
          </div>
        </td>
        <td>${c.email}</td>
        <td>${c.phone}</td>
        <td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${c.address}">${c.address}</td>
        <td class="fw-bold">${c.orders}</td>
        <td class="fw-bold">₱${c.spent.toLocaleString()}</td>
        <td>${c.lastDate ? fmtDate(c.lastDate) : '—'}</td>
        <td>${c.reviews > 0 ? `<span class="pill active">${c.reviews} Review${c.reviews > 1 ? 's' : ''}</span>` : '<span style="color:var(--text-2)">—</span>'}</td>
        <td><span class="pill ${c.hasOrders?'active':'inactive'}">${c.hasOrders?'Active':'No Orders'}</span></td>
        <td>
          <div style="display:flex;gap:6px;align-items:center">
            <button class="btn-icon edit" onclick="viewCustomer('${c.email}')" title="View"><i class='bx bx-show'></i></button>
            ${c.reviews > 0 ? `<button class="btn-icon" onclick="viewCustomerReviews('${c.email}')" title="View Reviews" style="color:#f59e0b;border-color:#f59e0b22;background:#fffbeb"><i class='bx bx-star'></i></button>` : ''}
          </div>
        </td>
      </tr>`).join('')
    : '<tr><td colspan="10" style="text-align:center;padding:24px;color:var(--text-2)">No customers found</td></tr>';
}

function viewCustomer(email){
  const storeUsers = JSON.parse(localStorage.getItem('sl_users')) || [];
  const u = storeUsers.find(x => x.email.toLowerCase() === email.toLowerCase());

  const orders = DB.orders.filter(o => (o.customerEmail||'').toLowerCase() === email.toLowerCase());

  const name    = u ? (u.fname + ' ' + u.lname).trim() || '—' : '—';
  const phone   = u?.phone || orders.find(o=>o.phone)?.phone || '—';

  // Saved profile addresses + unique addresses from orders
  const profileAddrs = (u?.addresses && u.addresses.length)
    ? u.addresses.map((a,i) => `
        <div style="padding:8px 12px;background:var(--bg-2,#f8f9fb);border-radius:8px;font-size:13px;margin-bottom:6px">
          <strong>Saved Address ${i+1}${a.label?' — '+a.label:''}:</strong><br>
          ${[a.address, a.city, a.province, a.zip].filter(Boolean).join(', ')}
        </div>`).join('')
    : '';

  // Unique addresses used in orders
  const orderAddrs = [...new Set(orders.map(o=>o.address).filter(Boolean))];
  const orderAddrHTML = orderAddrs.map((addr,i) => `
    <div style="padding:8px 12px;background:var(--bg-2,#f8f9fb);border-radius:8px;font-size:13px;margin-bottom:6px">
      <strong>Order Address${orderAddrs.length > 1 ? ' '+(i+1) : ''}:</strong><br>${addr}
    </div>`).join('');

  const addrHTML = (profileAddrs + orderAddrHTML) ||
    `<div style="color:var(--text-2);font-size:13px">No address on record</div>`;

  // Order history
  const ordersHTML = orders.length
    ? `<table class="data-table" style="margin-top:8px">
        <thead><tr><th>Order ID</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>${[...orders].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(o=>`
          <tr>
            <td class="fw-bold">${o.id}</td>
            <td style="font-size:12px">${o.items.map(i=>i.name+(i.qty>1?' x'+i.qty:'')).join(', ')}</td>
            <td class="fw-bold">₱${o.total.toLocaleString()}</td>
            <td>${o.payment||'—'}</td>
            <td><span class="pill ${o.status.toLowerCase().replace(/\s+/g,'-')}">${o.status}</span></td>
            <td>${fmtDate(o.date)}</td>
          </tr>`).join('')}
        </tbody>
      </table>`
    : `<div style="color:var(--text-2);font-size:13px;padding:8px 0">No orders yet</div>`;

  const totalSpent = orders.reduce((s,o)=>s+o.total,0);

  document.getElementById('cust-modal-title').textContent = name === '—' ? email : name;
  document.getElementById('cust-modal-body').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div><label style="font-size:11px;color:var(--text-2);font-weight:700">FULL NAME</label><div class="fw-bold">${name}</div></div>
      <div><label style="font-size:11px;color:var(--text-2);font-weight:700">EMAIL</label><div>${email}</div></div>
      <div><label style="font-size:11px;color:var(--text-2);font-weight:700">PHONE</label><div>${phone}</div></div>
      <div><label style="font-size:11px;color:var(--text-2);font-weight:700">TOTAL SPENT</label><div class="fw-bold">₱${totalSpent.toLocaleString()}</div></div>
    </div>
    <div style="margin-bottom:16px">
      <div style="font-size:11px;font-weight:700;color:var(--text-2);margin-bottom:8px">ADDRESSES</div>
      ${addrHTML}
    </div>
    <div>
      <div style="font-size:11px;font-weight:700;color:var(--text-2);margin-bottom:4px">ORDER HISTORY (${orders.length})</div>
      ${ordersHTML}
    </div>`;

  openModal('customer-modal');
}

function viewCustomerReviews(email){
  const storeUsers = JSON.parse(localStorage.getItem('sl_users')) || [];
  const u = storeUsers.find(x => x.email.toLowerCase() === email.toLowerCase());
  const name = u ? (u.fname + ' ' + u.lname).trim() || email : email;

  const reviews = JSON.parse(localStorage.getItem('reviews_' + email) || '{}');
  const entries = Object.entries(reviews);

  document.getElementById('reviews-modal-title').textContent = name + ' — Reviews';
  document.getElementById('reviews-modal-body').innerHTML = entries.length === 0
    ? `<div style="color:var(--text-2);font-size:13px;padding:8px 0">No reviews submitted yet.</div>`
    : entries.map(([orderId, r]) => {
        const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
        const date  = r.date ? new Date(r.date).toLocaleDateString('en-PH', {month:'short',day:'numeric',year:'numeric'}) : '—';
        const order = DB.orders.find(o => o.id === orderId);
        const items = order ? order.items.map(i => i.name).join(', ') : orderId;
        return `
          <div style="padding:14px;background:var(--bg-2,#f8f9fb);border-radius:10px;margin-bottom:12px">
            <div style="font-size:11px;color:var(--text-2);font-weight:700;margin-bottom:4px">${items}</div>
            <div style="color:#f59e0b;font-size:18px;letter-spacing:2px;margin-bottom:6px">${stars}</div>
            <div style="font-size:13px;font-style:italic;color:var(--text)">"${r.comment}"</div>
            <div style="font-size:11px;color:var(--text-2);margin-top:6px">Reviewed on ${date}</div>
          </div>`;
      }).join('');

  openModal('reviews-modal');
}

/* =============================================
   USERS
   ============================================= */
function renderUsers(){
  document.getElementById('users-body').innerHTML = DB.users.map(u=>`
    <tr>
      <td>
        <div class="product-cell">
          <div class="avatar sm ${u.role==='Administrator'?'':u.role==='Baker'?'orange':'green'}">${u.fname[0]}</div>
          <div><div class="product-name">${u.fname} ${u.lname}</div></div>
        </div>
      </td>
      <td>${u.email}</td>
      <td><span class="pill ${u.role==='Administrator'?'confirmed':u.role==='Baker'?'preparing':'active'}">${u.role}</span></td>
      <td><span class="pill ${u.active?'active':'inactive'}">${u.active?'Active':'Inactive'}</span></td>
      <td>
        <div class="td-actions">
          <button class="btn-icon edit" onclick="openUserModal('${u.id}')" title="Edit"><i class='bx bx-edit'></i></button>
          ${u.id!==currentUser.id?`<button class="btn-icon ${u.active?'danger':'success'}" onclick="toggleUser('${u.id}')" title="${u.active?'Deactivate':'Activate'}"><i class='bx bx-${u.active?'x':'check'}'></i></button>`:''}
        </div>
      </td>
    </tr>`).join('');
}

function openUserModal(id){
  const u = id ? DB.users.find(uu=>uu.id===id) : null;
  document.getElementById('user-modal-title').textContent = u?'Edit User':'Add User';
  document.getElementById('um-id').value       = u?.id||'';
  document.getElementById('um-fname').value    = u?.fname||'';
  document.getElementById('um-lname').value    = u?.lname||'';
  document.getElementById('um-email').value    = u?.email||'';
  document.getElementById('um-password').value = '';
  document.getElementById('um-role').value     = u?.role||'Administrator';
  const pwLabel = u ? 'New Password (leave blank to keep)' : 'Password *';
  document.querySelector('#user-modal [for=um-password]').textContent = pwLabel;
  openModal('user-modal');
}

function saveUser(){
  const id    = document.getElementById('um-id').value;
  const fname = document.getElementById('um-fname').value.trim();
  const lname = document.getElementById('um-lname').value.trim();
  const email = document.getElementById('um-email').value.trim();
  const pw    = document.getElementById('um-password').value;
  const role  = document.getElementById('um-role').value;
  if(!fname||!lname||!email){ toast('Fill required fields','danger'); return; }
  if(!id && !pw){ toast('Password required for new user','danger'); return; }
  if(id){
    const idx = DB.users.findIndex(u=>u.id===id);
    DB.users[idx] = {...DB.users[idx], fname, lname, email, role, ...(pw?{password:pw}:{})};
    toast('User updated','success');
  } else {
    if(DB.users.find(u=>u.email===email)){ toast('Email already exists','danger'); return; }
    DB.users.push({id:'u'+Date.now(), fname, lname, email, password:pw, role, active:true});
    toast('User added','success');
  }
  saveDB(); closeModal('user-modal'); renderUsers();
}

function toggleUser(id){
  const u = DB.users.find(uu=>uu.id===id);
  if(!u) return;
  const deactivating = u.active;
  showConfirm({
    title: deactivating ? 'Deactivate User' : 'Activate User',
    message: deactivating
      ? `Deactivate ${u.fname} ${u.lname}? They will no longer be able to log in.`
      : `Activate ${u.fname} ${u.lname}? They will regain access to the system.`,
    okText: deactivating ? 'Deactivate' : 'Activate',
    okClass: deactivating ? 'btn-danger' : 'btn-primary',
    icon: deactivating ? 'bx-user-x' : 'bx-user-check',
    onConfirm: () => {
      u.active = !u.active;
      saveDB(); renderUsers();
      toast(u.active ? 'User activated' : 'User deactivated', u.active ? 'success' : '');
    }
  });
}

/* =============================================
   NOTIFICATIONS & BADGES
   ============================================= */
function getLowStockItems(){
  const lowP = DB.products.filter(p => p.active && Math.max(0,(p.dailyLimit||0)-(p.soldToday||0)) <= (p.threshold||0));
  const lowI = DB.ingredients.filter(i => i.stock <= i.threshold);
  return [...lowP, ...lowI];
}

function getSeenNotifs(){ return new Set(JSON.parse(localStorage.getItem('sl_seen_notifs')||'[]')); }
function saveSeenNotifs(seen){ localStorage.setItem('sl_seen_notifs', JSON.stringify([...seen])); }
function getReadNotifs(){ return new Set(JSON.parse(localStorage.getItem('sl_read_notifs')||'[]')); }
function saveReadNotifs(read){ localStorage.setItem('sl_read_notifs', JSON.stringify([...read])); }

function buildNotifs(){
  const seen = getSeenNotifs();
  notifList = [];

  // Near daily limit products
  DB.products.filter(p => p.active && Math.max(0,(p.dailyLimit||0)-(p.soldToday||0)) <= (p.threshold||0)).forEach(p=>{
    const remaining = Math.max(0,(p.dailyLimit||0)-(p.soldToday||0));
    const id = `product_${p.id||p.name}`;
    if(seen.has(id)) return;
    notifList.push({ id, icon:'bx-error-circle', color:'#DC2626',
      text:`Near daily limit: ${p.name} (${remaining} left today)`,
      action(){ switchView('inventory'); document.getElementById('notif-panel').classList.add('hidden'); }
    });
  });

  // Low stock ingredients
  DB.ingredients.filter(i=>i.stock<=i.threshold).forEach(ing=>{
    const id = `ingredient_${ing.id||ing.name}`;
    if(seen.has(id)) return;
    notifList.push({ id, icon:'bx-error-circle', color:'#EA580C',
      text:`Low stock ingredient: ${ing.name} (${ing.stock} left)`,
      action(){ switchView('inventory'); document.getElementById('notif-panel').classList.add('hidden'); }
    });
  });

  // Cancel requests from buyers
  DB.orders.filter(o=>o.status==='Cancel Requested'&&!o.archived).forEach(o=>{
    const id = `cancel_req_${o.id}`;
    if(seen.has(id)) return;
    notifList.push({ id, icon:'bx-x-circle', color:'#DC2626',
      text:`Cancel request for order ${o.id} from ${o.customer}${o.cancelReason ? ' — "'+o.cancelReason+'"' : ''}`,
      action(){ switchView('orders'); setTimeout(()=>openOrderModal(o.id),150); document.getElementById('notif-panel').classList.add('hidden'); }
    });
  });

  // New (Pending) orders
  DB.orders.filter(o=>o.status==='Pending'&&!o.archived).forEach(o=>{
    const id = `order_${o.id}`;
    if(seen.has(id)) return;
    notifList.push({ id, icon:'bx-shopping-bag', color:'#2563EB',
      text:`New order ${o.id} from ${o.customer}`,
      action(){ switchView('orders'); setTimeout(()=>openOrderModal(o.id),150); document.getElementById('notif-panel').classList.add('hidden'); }
    });
  });

  // Confirmed orders — need to be prepared
  DB.orders.filter(o=>o.status==='Confirmed'&&!o.archived).forEach(o=>{
    const id = `prepare_${o.id}`;
    if(seen.has(id)) return;
    notifList.push({ id, icon:'bx-dish', color:'#D97706',
      text:`Order ${o.id} from ${o.customer} needs to be prepared`,
      action(){ switchView('orders'); setTimeout(()=>openOrderModal(o.id),150); document.getElementById('notif-panel').classList.add('hidden'); }
    });
  });

  const allTracking = _trackingCache;

  // Orders ready to be packed
  DB.orders.filter(o=>o.status==='Ready for Packing'&&!o.archived).forEach(o=>{
    const id = `ready_pack_${o.id}`;
    if(seen.has(id)) return;
    notifList.push({ id, icon:'bx-package', color:'#7C3AED',
      text:`Order ${o.id} from ${o.customer} is ready to be packed`,
      action(){ switchView('orders'); setTimeout(()=>openOrderModal(o.id, true),150); document.getElementById('notif-panel').classList.add('hidden'); }
    });
  });

  // Orders currently being packed — packed, waiting for Ready for Book
  DB.orders.filter(o=>o.status==='Preparing'&&!o.archived&&o.preparingSubStatus==='packed'&&!allTracking[o.id]).forEach(o=>{
    const id = `packed_${o.id}`;
    if(seen.has(id)) return;
    notifList.push({ id, icon:'bx-box', color:'#0891B2',
      text:`Order ${o.id} from ${o.customer} is packed — mark ready for Lalamove`,
      action(){ switchView('orders'); setTimeout(()=>openOrderModal(o.id),150); document.getElementById('notif-panel').classList.add('hidden'); }
    });
  });

  // Orders ready to book Lalamove (readyForBook sub-status only)
  DB.orders.filter(o=>o.status==='Preparing'&&!o.archived&&o.preparingSubStatus==='readyForBook'&&!allTracking[o.id]).forEach(o=>{
    const id = `ready_book_${o.id}`;
    if(seen.has(id)) return;
    notifList.push({ id, icon:'bx-map', color:'#16A34A',
      text:`Order ${o.id} from ${o.customer} is ready to book Lalamove`,
      action(){ switchView('orders'); setTimeout(()=>openOrderModal(o.id),150); document.getElementById('notif-panel').classList.add('hidden'); }
    });
  });

  // Delivery completed — needs Mark Fulfilled (Preparing + tracking COMPLETED)
  DB.orders.filter(o=>o.status==='Preparing'&&!o.archived).forEach(o=>{
    const t = allTracking[o.id];
    if(!t || t.status!=='COMPLETED') return;
    const id = `delivered_${o.id}`;
    if(seen.has(id)) return;
    notifList.push({ id, icon:'bx-check-circle', color:'#6366F1',
      text:`Delivery complete for order ${o.id} — mark as Fulfilled`,
      action(){ switchView('orders'); setTimeout(()=>openOrderModal(o.id),150); document.getElementById('notif-panel').classList.add('hidden'); }
    });
  });

  // New customer reviews
  const storeUsers = JSON.parse(localStorage.getItem('sl_users') || '[]');
  storeUsers.forEach(u => {
    const reviews = JSON.parse(localStorage.getItem('reviews_' + u.email) || '{}');
    const name = ((u.fname||'') + ' ' + (u.lname||'')).trim() || u.email;
    Object.entries(reviews).forEach(([orderId, r]) => {
      const id = `review_${u.email}_${orderId}`;
      if(seen.has(id)) return;
      notifList.push({ id, icon:'bx-star', color:'#f59e0b',
        text:`${name} left a ${r.rating}★ review — "${r.comment}"`,
        action(){ switchView('customers'); document.getElementById('notif-panel').classList.add('hidden'); setTimeout(()=>viewCustomerReviews(u.email), 150); }
      });
    });
  });
}

function updateBadges(){
  const allTracking = _trackingCache;

  // Single red dot for Orders — lights up whenever anything needs attention
  const hasActivity = DB.orders.some(o => !o.archived && (
    o.status === 'Pending' ||
    o.status === 'Confirmed' ||
    o.status === 'Ready for Packing' ||
    o.status === 'Cancel Requested' ||
    (o.status === 'Preparing' && (!allTracking[o.id] || allTracking[o.id]?.status === 'COMPLETED'))
  ));
  const ordersDot = document.getElementById('orders-dot');
  const isAdmin = currentUser && currentUser.role === 'Administrator';
  if(ordersDot) ordersDot.style.display = (isAdmin && hasActivity) ? '' : 'none';

  const low = getLowStockItems().length;
  const lb = document.getElementById('low-stock-badge');
  lb.style.display = low ? '' : 'none';

  const custPending = DB.orders.filter(o => o.status === 'Pending' && !o.archived).length;
  const cpb = document.getElementById('cust-pending-badge');
  if(cpb){ cpb.textContent = custPending; cpb.style.display = custPending ? '' : 'none'; }

  buildNotifs();
  const read = getReadNotifs();
  const unreadCount = notifList.filter(n => !read.has(n.id)).length;
  const notifDot = document.getElementById('notif-dot');
  notifDot.classList.toggle('hidden', unreadCount === 0);
}

function toggleNotifPanel(){
  const panel = document.getElementById('notif-panel');
  const opening = panel.classList.contains('hidden');
  if(opening){ buildNotifs(); renderNotifPanel(); }
  panel.classList.toggle('hidden');
}

function clearNotifs(){
  const seen = getSeenNotifs();
  notifList.forEach(n=>seen.add(n.id));
  saveSeenNotifs(seen);
  localStorage.removeItem('sl_read_notifs');
  notifList=[];
  renderNotifPanel();
  document.getElementById('notif-dot').classList.add('hidden');
}

function handleNotifClick(idx){
  const n = notifList[idx];
  if(!n) return;
  const read = getReadNotifs();
  read.add(n.id);
  saveReadNotifs(read);
  renderNotifPanel();
  const unread = notifList.filter(x => !read.has(x.id)).length;
  document.getElementById('notif-dot').classList.toggle('hidden', unread === 0);
  if(n.action) n.action();
}

function renderNotifPanel(){
  const list = document.getElementById('notif-list');
  if(notifList.length===0){ list.innerHTML='<div class="notif-empty">No new notifications</div>'; return; }
  const read = getReadNotifs();
  list.innerHTML = notifList.map((n,i)=>`
    <div class="notif-item notif-clickable${read.has(n.id) ? '' : ' unread'}" onclick="handleNotifClick(${i})">
      <i class='bx ${n.icon}' style="color:${n.color||'#6B7280'}"></i>
      <span>${n.text}</span>
      <i class='bx bx-chevron-right' style="margin-left:auto;color:#9CA3AF;flex-shrink:0"></i>
    </div>`).join('');
}

document.addEventListener('click', e=>{
  if(!e.target.closest('.notif-btn') && !e.target.closest('.notif-panel')){
    document.getElementById('notif-panel')?.classList.add('hidden');
  }
});

/* =============================================
   MODAL HELPERS
   ============================================= */
function openModal(id){ document.getElementById(id).classList.remove('hidden'); }
function closeModal(id){ document.getElementById(id).classList.add('hidden'); }

document.addEventListener('keydown', e=>{
  if(e.key==='Escape') document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m=>m.classList.add('hidden'));
});

/* =============================================
   THEME
   ============================================= */
function toggleTheme(){
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('sl_theme', isDark ? 'dark' : 'light');
  const icon = document.querySelector('#theme-btn i');
  icon.className = isDark ? 'bx bx-sun' : 'bx bx-moon';
  renderRevenueTrend(getFilteredTxs());
  renderBestSellers(getFilteredTxs());
}

function applyTheme(){
  const saved = localStorage.getItem('sl_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if(saved === 'dark' || (!saved && prefersDark)){
    document.body.classList.add('dark');
    const icon = document.querySelector('#theme-btn i');
    if(icon) icon.className = 'bx bx-sun';
  }
}

/* =============================================
   DATE HELPERS
   ============================================= */
function isToday(dateStr){
  return new Date(dateStr).toDateString() === new Date().toDateString();
}
function fmtDate(d){
  return new Date(d).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'});
}
function fmtDateTime(d){
  return new Date(d).toLocaleString('en-PH',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
}

/* =============================================
   ADMIN REVIEWS
   ============================================= */
let _adminReviewsFilter = 'pending';

function renderAdminReviews() {
  const products = DB.products || [];
  const allReviews = [];

  products.forEach(p => {
    const key = 'reviews_' + p.name;
    const reviews = JSON.parse(localStorage.getItem(key) || '[]');
    reviews.forEach((r, idx) => {
      allReviews.push({ ...r, productName: p.name, storageKey: key, index: idx });
    });
  });

  // Update pending badge
  const pendingCount = allReviews.filter(r => r.approved === undefined || r.approved === null).length;
  const badge = document.getElementById('reviews-pending-badge');
  if(badge){ badge.textContent = pendingCount; badge.style.display = pendingCount ? '' : 'none'; }

  const filtered = allReviews.filter(r => {
    if(_adminReviewsFilter === 'pending')  return r.approved === undefined || r.approved === null;
    if(_adminReviewsFilter === 'approved') return r.approved === true;
    if(_adminReviewsFilter === 'rejected') return r.approved === false;
    return true;
  });

  const container = document.getElementById('admin-reviews-list');
  if(!container) return;

  if(filtered.length === 0){
    container.innerHTML = `<div class="card" style="text-align:center;padding:48px;color:var(--text-2)">No ${_adminReviewsFilter} reviews</div>`;
    return;
  }

  container.innerHTML = filtered.map(r => `
    <div class="card" style="margin-bottom:12px;padding:20px 24px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap">
            <span style="font-weight:700;font-size:14px">${escHTML(r.name)}</span>
            <span style="color:#f5a623;font-size:15px;letter-spacing:2px">${'★'.repeat(r.stars)}${'☆'.repeat(5-r.stars)}</span>
            <span style="font-size:11px;color:var(--text-2)">${r.date || ''}</span>
          </div>
          <p style="font-size:14px;color:var(--text-1);margin:0 0 10px;line-height:1.6">${escHTML(r.text)}</p>
          <span style="font-size:11px;font-weight:600;color:var(--text-2);background:var(--bg-2);padding:3px 10px;border-radius:20px">${escHTML(r.productName)}</span>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0;align-items:center">
          ${r.approved !== true  ? `<button class="btn-sm success" onclick="approveAdminReview('${r.storageKey}',${r.index})"><i class='bx bx-check'></i> Approve</button>` : '<span style="font-size:12px;color:var(--success);font-weight:600">✓ Approved</span>'}
          ${r.approved !== false ? `<button class="btn-sm danger"  onclick="rejectAdminReview('${r.storageKey}',${r.index})"><i class='bx bx-x'></i> Reject</button>`  : '<span style="font-size:12px;color:var(--danger);font-weight:600">✕ Rejected</span>'}
        </div>
      </div>
    </div>
  `).join('');
}

function filterAdminReviews(filter){
  _adminReviewsFilter = filter;
  ['pending','approved','rejected'].forEach(f => {
    document.getElementById('rev-tab-'+f)?.classList.toggle('active', f === filter);
  });
  renderAdminReviews();
}

function approveAdminReview(key, index){
  const reviews = JSON.parse(localStorage.getItem(key) || '[]');
  if(reviews[index]){ reviews[index].approved = true; localStorage.setItem(key, JSON.stringify(reviews)); }
  renderAdminReviews();
  toast('Review approved — now visible on the store', 'success');
}

function rejectAdminReview(key, index){
  const reviews = JSON.parse(localStorage.getItem(key) || '[]');
  if(reviews[index]){ reviews[index].approved = false; localStorage.setItem(key, JSON.stringify(reviews)); }
  renderAdminReviews();
  toast('Review rejected — hidden from the store', '');
}

function escHTML(str){ return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* =============================================
   BOOT
   ============================================= */
document.addEventListener('DOMContentLoaded', async ()=>{
  applyTheme();
  await initDB();
  checkLogin();
  document.getElementById('login-password')?.addEventListener('keydown', e=>{ if(e.key==='Enter') adminLogin(); });
});
