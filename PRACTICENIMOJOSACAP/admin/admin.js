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
  if(!apiAvailable()) return;   // no backend reachable — see js/api-config.js

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

  fetch(apiUrl('/send-order-notification'), {
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

/* ── ROLES ──
   What each role may open. The sidebar, the landing view and switchView()
   all read this one map, so a role can never be shown a nav item it is
   not allowed to open, nor open a view whose nav item is hidden.

   Super Admin is deliberately not "an Administrator with extras". The two
   roles divide rather than overlap: Super Admin governs people, published
   content and the records, while Administrator runs the shop day to day.

   So staff accounts, the website copy and the audit trail sit with Super
   Admin alone. That is what makes the trail worth keeping — an
   administrator who could reach the log of their own actions, or grant
   themselves a role, is not being audited by it.

   Each role gets its own sidebar: which items, in what order, under what
   headings. The markup carries the Administrator's layout and
   applyRoleNav() rearranges it, so a role's sidebar reads in the order
   that suits it rather than in whatever order the HTML happens to be
   written. An empty label means no heading, which is what the Baker and
   Packer want with a single item. */
const ROLE_NAV = {
  'Super Admin': [
    { label: 'OVERSIGHT', views: ['audit', 'reports', 'content', 'users', 'customers'] }
  ],
  'Administrator': [
    { label: 'MAIN',       views: ['dashboard', 'products', 'orders', 'customers'] },
    { label: 'MANAGEMENT', views: ['inventory', 'reports', 'messages', 'reviews'] }
  ],
  'Baker':  [{ label: '', views: ['orders'] }],
  'Packer': [{ label: '', views: ['orders'] }]
};

/* Derived so the sidebar and the permission check can never disagree:
   if it is not in the sidebar, the role cannot open it. */
const ROLE_VIEWS = Object.fromEntries(
  Object.entries(ROLE_NAV).map(([role, groups]) => [role, groups.flatMap(g => g.views)])
);

function allowedViews(role){ return ROLE_VIEWS[role] || ROLE_VIEWS['Administrator']; }
function canView(view){ return !!currentUser && allowedViews(currentUser.role).includes(view); }
function homeView(){ return allowedViews(currentUser && currentUser.role)[0]; }
function isSuperAdmin(){ return !!currentUser && currentUser.role === 'Super Admin'; }

/* Rebuilds the sidebar for whoever just signed in: hides everything the
   role may not open, then appends what it may back in the role's own
   order under the role's own headings. Appending an element that is
   already in the container moves it, so no markup is duplicated and the
   onclick handlers written in the HTML survive untouched. */
function applyRoleNav(){
  const nav = document.querySelector('.sidebar-nav');
  if(!nav || !currentUser) return;

  const groups = ROLE_NAV[currentUser.role] || ROLE_NAV['Administrator'];
  const items  = new Map([...nav.querySelectorAll('.nav-item[data-view]')]
                           .map(el => [el.dataset.view, el]));

  /* Headings are thrown away and remade, since which ones a role needs —
     and what they are called — is part of the role, not of the markup. */
  nav.querySelectorAll('.sidebar-section-label').forEach(el => el.remove());
  items.forEach(el => el.style.display = 'none');

  groups.forEach(group => {
    const present = group.views.filter(v => items.has(v));
    if(!present.length) return;          // nothing to put under this heading

    if(group.label){
      const heading = document.createElement('div');
      heading.className   = 'sidebar-section-label';
      heading.textContent = group.label;
      nav.appendChild(heading);
    }
    present.forEach(view => {
      const el = items.get(view);
      el.style.display = '';
      nav.appendChild(el);
    });
  });
}

/* ---- SEED DATA ---- */
const SEED = {
  users: [
    { id:'u0', fname:'Super',  lname:'Admin',     email:'superadmin@sugarloom.ph', password:'super123', role:'Super Admin', active:true },
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
/* Every date filter in Reports is a From–To range. An empty end of a
   range means "no bound that way", so leaving both blank shows everything
   and filling in only From reads as "since". */
let reportRange   = { from: '', to: '' };
let histRangeState = { tx: {from:'',to:''}, sales: {from:'',to:''}, ing: {from:'',to:''} };
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
    const [pRes, iRes, uRes, oRes, txRes, slRes, poRes] = await Promise.all([
      _supa.from('products').select('data'),
      _supa.from('ingredients').select('data'),
      _supa.from('admin_users').select('data'),
      _supa.from('orders').select('data').order('date', { ascending: false }),
      /* No .order('date') here — unlike orders and stock_log, the
         transactions table has no date column; the date lives inside
         the jsonb. Ordering by it returned 42703 and threw the whole
         result away, so every sales report read zero. Sorted below. */
      _supa.from('transactions').select('data'),
      _supa.from('stock_log').select('data').order('date', { ascending: false }),
      _supa.from('supplier_orders').select('data').order('date', { ascending: false })
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
        transactions:   toArr(txRes).sort((a, b) => new Date(b.date) - new Date(a.date)),
        stockLog:       toArr(slRes),
        supplierOrders: toArr(poRes),
        auditLog:       []    // loaded on demand by refreshAudit(), Super Admin only
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

  await ensureSuperAdmin();

  // Prime the tracking cache so it's available before first poll
  await refreshTrackingCache().catch(() => {});
  checkDailyReset();
}

/* Every database seeded before the Super Admin role existed has no
   account that can reach the audit trail, and seeding only runs on an
   empty install — so add the account when it is missing rather than only
   on a first run. Without this the role would be unreachable on every
   database already out there, the live one included. */
async function ensureSuperAdmin(){
  try {
    if((DB.users || []).some(u => u.role === 'Super Admin')) return;
    const sa = { id:'u0', fname:'Super', lname:'Admin',
                 email:'superadmin@sugarloom.ph', role:'Super Admin', active:true };
    await setUserPassword(sa, 'super123');
    DB.users.unshift(sa);
    const { error } = await _supa.from('admin_users')
      .upsert({ id: sa.id, data: sa }, { onConflict: 'id' });
    if(error) console.error('could not create the Super Admin account:', error);
  } catch(err){
    console.error('ensureSuperAdmin failed:', err);
  }
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

/* ── PASSWORDS ──
   Staff passwords are stored as a SHA-256 hash rather than as typed. The
   admin_users table has no row-level security, so anyone holding the
   public anon key could read it; a hash means that read doesn't hand over
   working logins.

   Accounts created before this still have a plain `password`. Those are
   accepted once and upgraded to a hash on the next successful sign-in, so
   nobody is locked out. */
async function hashPassword(plain){
  const bytes = new TextEncoder().encode(String(plain));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2,'0')).join('');
}

async function passwordMatches(user, typed){
  if(user.passwordHash) return user.passwordHash === await hashPassword(typed);
  return user.password !== undefined && user.password === typed;   // legacy
}

async function setUserPassword(user, plain){
  user.passwordHash = await hashPassword(plain);
  delete user.password;
}

async function adminLogin(){
  const email = document.getElementById('login-email').value.trim();
  const pw    = document.getElementById('login-password').value;

  const u = DB.users.find(u => u.email === email && u.active);
  if(!u || !(await passwordMatches(u, pw))){
    /* Recorded against the account when the email is a real one, so a
       run of rejected attempts on one account is visible in the trail.
       The password typed is never written down. */
    const known = DB.users.find(x => x.email === email);
    currentUser = known || null;
    logAudit('Access', 'Sign-in rejected', email,
             !known ? 'No such account' : !known.active ? 'Account is deactivated' : 'Wrong password');
    currentUser = null;
    showLoginError('Invalid credentials');
    return;
  }

  // Quietly move legacy plain-text accounts onto a hash
  if(!u.passwordHash){ await setUserPassword(u, pw); saveDB(); }

  currentUser = u;
  sessionStorage.setItem('sl_admin_sess', JSON.stringify(u));
  logAudit('Access', 'Signed in', u.email, '');
  showApp();
}
function showLoginError(msg){
  const el = document.getElementById('login-error');
  el.textContent = msg; el.classList.remove('hidden');
  setTimeout(()=>el.classList.add('hidden'), 3000);
}
function adminLogout(){
  /* Awaited so the entry reaches Supabase before the reload tears the
     page down — a fire-and-forget insert here is routinely lost. */
  const done = () => { sessionStorage.removeItem('sl_admin_sess'); location.reload(); };
  logAudit('Access', 'Signed out', currentUser?.email || '', '').then(done, done);
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
  if(!apiAvailable()){ fpShowMsg('fp-msg','Password reset needs the mail server running. Ask an administrator.'); return; }

  fetch(apiUrl('/send-otp'),{
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
  if(!apiAvailable()){ fpShowMsg('fp-msg2','Password reset needs the mail server running.'); return; }

  fetch(apiUrl('/verify-otp'),{
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

  setUserPassword(u, newpass).then(saveDB);
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
  applyRoleNav();

  const isStaff = currentUser.role === 'Baker' || currentUser.role === 'Packer';
  const notifBtn = document.querySelector('.notif-btn');
  if(notifBtn) notifBtn.style.display = isStaff ? 'none' : '';

  syncStoreOrders().then(() => {
    switchView(homeView());
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
    if (!order || _deletedOrderIds.has(order.id)) continue;   // just deleted — don't bring it back
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
  /* Never land somewhere this role cannot reach — including by calling
     switchView from the console or following a stale link. */
  if(currentUser && !canView(view)) view = homeView();
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
  if(view==='content')    renderContent();
  if(view==='messages')   renderInquiries();
  if(view==='audit')      refreshAudit();
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
          <td>${escHTML(o.customer || '—')}</td>
          <td>${escHTML(o.phone || o.customerEmail || '—')}</td>
          <td>${escHTML(o.address || '—')}</td>
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
      <td><span class="fw-bold">${o.id}</span><br><small class="text-muted">${escHTML(o.customer)}</small></td>
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
  return {
    grid:   'rgba(0,0,0,0.06)',
    text:   '#6B7280',
    border: '#fff'
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
/* ── INGREDIENT STOCK LEVELS ──
   The low-stock threshold is a percentage of a full shelf rather than a
   raw number: "tell me at 30%" holds whether an ingredient is measured
   in grams or pieces, and it stays right when the par level changes.

   Ingredients saved before this have an absolute `threshold` and no
   `capacity`, so both are derived on read — no migration, and old rows
   keep behaving as they did. Everything goes through these four
   helpers so nothing compares against the wrong figure. */

function ingCapacity(ing){
  const c = Number(ing.capacity);
  if(c > 0) return c;
  // No par level recorded — infer one that keeps the old behaviour
  return Math.max(Number(ing.stock) || 0, (Number(ing.threshold) || 0) * 2, 1);
}

function ingThresholdPct(ing){
  const p = Number(ing.thresholdPct);
  if(p > 0) return Math.min(100, p);
  const derived = Math.round(((Number(ing.threshold) || 0) / ingCapacity(ing)) * 100);
  return derived > 0 ? Math.min(100, derived) : 20;
}

function ingThresholdQty(ing){
  return Math.round(ingCapacity(ing) * ingThresholdPct(ing) / 100);
}

function isIngLow(ing){
  return Number(ing.stock) <= ingThresholdQty(ing);
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

/* Shrinks a picked photo before it is stored. Product and homepage images
   are kept inside the database row and shipped to every visitor, so a
   straight-from-the-phone 4MB photo is paid for by every customer. Scales
   the long edge down and re-encodes as JPEG. Shared with cms.js. */
const IMG_MAX_PX  = 1600;
const IMG_QUALITY = 0.82;

function shrinkImage(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not an image'));
      img.onload = () => {
        const scale  = Math.min(1, IMG_MAX_PX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', IMG_QUALITY));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handleProductImgUpload(e){
  const file = e.target.files[0];
  if(!file) return;

  const nameEl = document.getElementById('pm-img-filename');
  nameEl.textContent = 'Resizing…';

  try {
    const dataUrl = await shrinkImage(file);
    document.getElementById('pm-img').value = dataUrl;
    const preview = document.getElementById('pm-img-preview');
    preview.src = dataUrl;
    preview.style.display = '';
    nameEl.textContent = file.name;
  } catch(err){
    console.error('product image upload failed:', err);
    nameEl.textContent = '';
    toast('Could not read that picture — try a JPG or PNG', 'danger');
  } finally {
    e.target.value = '';   // let the same file be picked again
  }
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
    logAudit('Products', 'Product updated', p.name, `₱${p.price} · daily limit ${p.dailyLimit}`);
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
  logAudit('Products', 'Product added', name, `${cat} · ₱${price}`);
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

  // Tidy away finished orders whose date has passed, before building the lists
  const sweptNow = archiveOverdueOrders();
  if(sweptNow) toast(`${sweptNow} completed order${sweptNow===1?'':'s'} moved to Archived`, '');

  /* Orders past their promised day that nobody finished. These are not
     archived, so this banner is the thing standing between a forgotten
     order and a customer who never hears from anyone. */
  const lateBanner = document.getElementById('late-orders-alert');
  if(lateBanner){
    const late = overdueUnsettledOrders();
    lateBanner.style.display = (isAdmin && late.length) ? 'flex' : 'none';
    const msg = document.getElementById('late-orders-msg');
    if(msg){
      msg.textContent = late.length === 1
        ? `Order ${late[0].id} for ${late[0].customer || 'a customer'} was due ${fmtDate(late[0].preferredDate)} and is still ${late[0].status}.`
        : `${late.length} orders are past their delivery date and still unfinished.`;
    }
  }

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
  /* Staff queues run oldest first — whoever ordered first gets baked and
     packed first. queuedAt is only set when someone sends an order to the
     back, so untouched orders keep their original place. Everywhere else
     stays newest-first. */
  /* The admin sees the same queues the staff work from, so the order on
     screen matches what the kitchen is actually doing, and can reorder
     them — which the staff cannot. */
  const isBakeQueue = (isBaker  || isAdmin) && orderFilter === 'Confirmed';
  const isPackQueue = (isPacker || isAdmin) && orderFilter === 'Ready for Packing';
  const isQueue     = isBakeQueue || isPackQueue;
  const queueTime = o => new Date(o.queuedAt || o.date).getTime();
  list = isQueue
    ? [...list].sort((a,b)=>queueTime(a)-queueTime(b))
    : [...list].sort((a,b)=>new Date(b.date)-new Date(a.date));

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

  document.getElementById('orders-body').innerHTML = list.map((o,idx)=>{
    const sp = getStatusPill(o);
    const nextLabel = isBakeQueue ? 'Bake this one next' : 'Pack this one next';
    const queueTag = isQueue
      ? `<span class="queue-pos ${idx===0?'next':''}" title="${idx===0?nextLabel:'Position in the queue'}">${idx===0?'NEXT':'#'+(idx+1)}</span> `
      : '';
    const deferTag = isQueue && o.deferCount
      ? `<span class="queue-defer" title="Sent to the back ${o.deferCount} time${o.deferCount===1?'':'s'}">↻${o.deferCount}</span>`
      : '';
    const overdueTag = o.autoArchived
      ? `<span class="auto-archived-tag" title="${o.archivedReason || 'Delivery date has passed'}">PAST DUE</span>`
      : '';

    /* The promised delivery day, on the row itself. The dashboard had a
       TOMORROW badge, but an admin working through the Orders tab never
       saw it — which is how an order reaches its delivery date still
       sitting on Pending. */
    const due = deliveryUrgency(o);
    const dueTag = due
      ? `<span class="due-tag ${due.tone}" title="Delivery promised for ${fmtDate(o.preferredDate)}${
           due.key === 'late' ? ' — this has passed and the order is still ' + o.status : ''}">${due.label}</span>`
      : '';

    /* Worth a phone call before anyone starts baking */
    const risk = o.status === 'Pending' ? codRiskFor(o) : null;
    const riskTag = risk
      ? `<span class="cod-risk ${risk.level}" title="Cash on Delivery — ${risk.note}. Worth confirming by phone before baking.">${risk.level === 'high' ? 'VERIFY' : 'NEW'}</span>`
      : '';
    return `
    <tr class="order-row ${isQueue && idx===0 ? 'queue-next-row' : ''}"
        onclick="openOrderModal('${o.id}', true)" title="Click to view details">
      <td class="fw-bold">${queueTag}${o.id}${deferTag}${dueTag}${overdueTag}${riskTag}</td>
      <td>${escHTML(o.customer)}</td>
      <td>${o.items.map(i=>i.name+(i.qty>1?' x'+i.qty:'')).join(', ')}</td>
      <td class="fw-bold">₱${o.total.toLocaleString()}</td>
      <td>${o.type}</td>
      <td>${fmtDate(o.date)}</td>
      <td><span class="pill ${sp.cls}">${sp.label}</span></td>
      <td>
        ${orderActionsHtml(o, { isAdmin, isBaker, isPacker, canReorder: isQueue && list.length > 1 })}
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-2)">No orders found</td></tr>';
}

/* ── ROW ACTIONS ──
   One labelled button for the single thing this order needs next, and
   everything else behind a ⋮ menu with words on it. The row used to show
   up to six unlabelled icons side by side, which nobody could tell
   apart at a glance. */
function orderActionsHtml(o, { isAdmin, isBaker, isPacker, canReorder }){
  const live = !o.archived;
  const sub  = o.preparingSubStatus;

  // The one step this order is waiting for
  let primary = null;
  if(live){
    if(o.status === 'Pending' && isAdmin)
      primary = { label: 'Confirm',       icon: 'bx-check',        cls: 'btn-primary',   fn: `openOrderModal('${o.id}')` };
    else if(o.status === 'Confirmed' && (isAdmin || isBaker))
      primary = { label: 'Start baking',  icon: 'bx-dish',         cls: 'btn-primary',   fn: `openOrderModal('${o.id}')` };
    else if(o.status === 'Preparing' && sub === 'baking' && (isAdmin || isBaker))
      primary = { label: 'Done baking',   icon: 'bx-check-double', cls: 'btn-primary',   fn: `bakerDoneBaking('${o.id}')` };
    else if(o.status === 'Ready for Packing' && (isAdmin || isPacker))
      primary = { label: 'Start packing', icon: 'bx-package',      cls: 'btn-primary',   fn: `packerStartPacking('${o.id}')` };
    else if(o.status === 'Preparing' && sub === 'packing' && (isAdmin || isPacker))
      primary = { label: 'Done packing',  icon: 'bx-check-double', cls: 'btn-primary',   fn: `packerDonePacking('${o.id}')` };
    else if(o.status === 'Preparing' && sub === 'packed' && (isAdmin || isPacker))
      primary = { label: 'Ready to book', icon: 'bx-map-pin',      cls: 'btn-primary',   fn: `packerReadyForBook('${o.id}')` };
    else if(o.status === 'Preparing' && sub === 'readyForBook' && isAdmin)
      primary = { label: 'Book delivery', icon: 'bx-map',          cls: 'btn-primary',   fn: `openOrderModal('${o.id}')` };
    else if(o.status === 'Cancel Requested' && isAdmin)
      primary = { label: 'Review',        icon: 'bx-x-circle',     cls: 'btn-danger',    fn: `openOrderModal('${o.id}')` };
    else if(o.status === 'Cancelled' && isAdmin && o.payment === 'GCash' && !o.refunded)
      primary = { label: 'Refund',        icon: 'bx-money-withdraw', cls: 'btn-secondary', fn: `openRefundModal('${o.id}')` };
  }

  /* Everything else, with words on it. No "View details" here — clicking
     anywhere on the row does that now. */
  const menu = [];

  if(isAdmin && canReorder){
    menu.push({ label: 'Move to front of queue', icon: 'bx-up-arrow-circle',   fn: `adminQueueToFront('${o.id}')` });
    menu.push({ label: 'Move to back of queue',  icon: 'bx-down-arrow-circle', fn: `adminQueueToBack('${o.id}')` });
  }

  if(isBaker && o.status === 'Confirmed' && live){
    if(canReorder) menu.push({ label: 'Not yet — bake later', icon: 'bx-down-arrow-circle', fn: `bakerDeferOrder('${o.id}')` });
    menu.push({ label: "Can't bake — send back", icon: 'bx-undo', danger: true, fn: `bakerDeclineOrder('${o.id}')` });
  }

  if(isPacker && o.status === 'Ready for Packing' && live){
    if(canReorder) menu.push({ label: 'Not yet — pack later', icon: 'bx-down-arrow-circle', fn: `packerDeferOrder('${o.id}')` });
    menu.push({ label: "Can't pack — send to baker", icon: 'bx-undo', danger: true, fn: `packerSendBackToBaker('${o.id}')` });
  }

  if(isAdmin && live && (o.status === 'Fulfilled' || o.status === 'Cancelled'))
    menu.push({ label: 'Archive', icon: 'bx-archive-in', fn: `archiveOrder('${o.id}')` });
  if(isAdmin && o.archived)
    menu.push({ label: 'Restore from archive', icon: 'bx-archive-out', fn: `unarchiveOrder('${o.id}')` });

  if(isAdmin)
    menu.push({ label: 'Delete order', icon: 'bx-trash', danger: true, fn: `deleteOrder('${o.id}')` });

  const refunded = isAdmin && o.status === 'Cancelled' && live && o.payment === 'GCash' && o.refunded
    ? `<span class="refund-done-badge" title="Refund processed">Refunded</span>` : '';

  /* stopPropagation so using a button doesn't also open the row's
     details modal underneath it. */
  return `
    <div class="row-actions" onclick="event.stopPropagation()">
      ${refunded}
      ${primary ? `<button class="${primary.cls} sm" onclick="${primary.fn}"><i class='bx ${primary.icon}'></i> ${primary.label}</button>` : ''}
      ${menu.length ? `
      <div class="row-menu-wrap">
        <button class="btn-icon row-menu-btn" title="More actions" onclick="toggleRowMenu(event, '${o.id}')"><i class='bx bx-dots-vertical-rounded'></i></button>
        <div class="row-menu hidden" id="rowmenu-${o.id}">
          ${menu.map(m => `
            <button class="row-menu-item ${m.danger ? 'danger' : ''}" onclick="closeRowMenus(); ${m.fn}">
              <i class='bx ${m.icon}'></i> ${m.label}
            </button>`).join('')}
        </div>
      </div>` : ''}
    </div>`;
}

function toggleRowMenu(ev, id){
  ev.stopPropagation();
  const menu = document.getElementById('rowmenu-' + id);
  const wasOpen = menu && !menu.classList.contains('hidden');
  closeRowMenus();
  if(menu && !wasOpen) menu.classList.remove('hidden');
}

function closeRowMenus(){
  document.querySelectorAll('.row-menu').forEach(m => m.classList.add('hidden'));
}

document.addEventListener('click', e => {
  if(!e.target.closest('.row-menu-wrap')) closeRowMenus();
});

/* ── COD RISK ──
   Flags a pending Cash on Delivery order that is worth confirming by
   phone first: a first-time buyer placing a large one, or anyone who
   has walked away from orders before. Reads the history already in
   DB.orders, so it costs nothing.

   Thresholds mirror COD_POLICY in js/cod-policy.js. */
const ADMIN_COD_TRUST_THRESHOLD = 800;

function codRiskFor(order){
  if(order.payment !== 'Cash on Delivery') return null;

  const email = order.customerEmail;
  if(!email || email === 'guest') return { level: 'high', note: 'Guest order' };

  let fulfilled = 0, cancelled = 0;
  DB.orders.forEach(o => {
    if(o.customerEmail !== email || o.id === order.id) return;
    if(o.status === 'Fulfilled') fulfilled++;
    if(o.status === 'Cancelled' && (o.cancelledByBuyer || o.cancelRequestedByBuyer)) cancelled++;
  });

  if(cancelled >= 1) return { level: 'high',  note: `${cancelled} previous cancellation${cancelled > 1 ? 's' : ''}` };
  if(fulfilled === 0 && Number(order.total) >= ADMIN_COD_TRUST_THRESHOLD)
    return { level: 'high',  note: 'first order, large COD' };
  if(fulfilled === 0) return { level: 'watch', note: 'first-time customer' };
  return null;
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

function showConfirm({ title='Confirm', message='', okText='Confirm', okClass='btn-danger', icon='bx-archive-in', inputLabel=null, inputPlaceholder='', onConfirm }){
  document.getElementById('confirm-modal-title').textContent = title;
  document.getElementById('confirm-modal-message').textContent = message;
  document.getElementById('confirm-modal-icon').innerHTML = `<i class='bx ${icon}'></i>`;

  // Optional free-text box, used for things like a decline reason
  const wrap  = document.getElementById('confirm-modal-input-wrap');
  const input = document.getElementById('confirm-modal-input');
  input.value = '';
  if(inputLabel){
    document.getElementById('confirm-modal-input-label').textContent = inputLabel;
    input.placeholder = inputPlaceholder;
    wrap.classList.remove('hidden');
  } else {
    wrap.classList.add('hidden');
  }

  const okBtn = document.getElementById('confirm-modal-ok');
  okBtn.textContent = okText;
  okBtn.className = okClass;
  okBtn.onclick = () => { const v = input.value.trim(); closeConfirmModal(); onConfirm(v); };
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
  if(o){
    o.archived=false;
    /* Without this the overdue sweep would re-archive it on the very next
       render and the button would look broken. */
    if(o.autoArchived){ o.noAutoArchive = true; delete o.autoArchived; delete o.archivedReason; }
    saveDB(); renderOrders(); updateBadges(); toast('Order restored','success');
  }
}

/* =============================================
   OVERDUE SWEEP
   Orders whose delivery date has already passed move to Archived, so the
   working tabs only show what can still be acted on. Same date rule the
   dashboard uses for its OVERDUE badge: the delivery day itself counts as
   still live, only the day after does it go. Reversible — restoring one
   from the Archived tab keeps it out of the sweep for good.
   ============================================= */
/* An order nobody acted on is not a finished order. Only these two are
   safe to tidy away on their own — everything else still represents a
   customer waiting, and hiding it would turn a missed cake into a
   silent one. */
const ORDER_SETTLED = ['Fulfilled', 'Cancelled'];

function isOrderSettled(o){ return ORDER_SETTLED.includes(o.status); }

/* How close an unfinished order is to the day it was promised. Returns
   null once it is settled, or if no date was given. */
function deliveryUrgency(o){
  if(!o || o.archived || isOrderSettled(o) || !o.preferredDate) return null;
  const d = new Date(o.preferredDate);
  if(isNaN(d.getTime())) return null;
  d.setHours(0,0,0,0);
  const today = new Date(); today.setHours(0,0,0,0);
  const days = Math.round((d - today) / 86400000);
  if(days <   0) return { key:'late',     days, label:'LATE',         tone:'high' };
  if(days === 0) return { key:'today',    days, label:'DUE TODAY',    tone:'high' };
  if(days === 1) return { key:'tomorrow', days, label:'DUE TOMORROW', tone:'warn' };
  return null;
}

function overdueUnsettledOrders(){
  return DB.orders.filter(o => {
    const u = deliveryUrgency(o);
    return u && u.key === 'late';
  });
}

function archiveOverdueOrders(){
  const today = new Date(); today.setHours(0,0,0,0);
  const swept = [];

  DB.orders.forEach(o => {
    if(o.archived || o.noAutoArchive) return;
    if(!o.preferredDate) return;              // no delivery date promised — leave it alone

    /* Never sweep an order that was not fulfilled or cancelled. It used
       to go quietly into Archived marked "delivery date has passed",
       which is exactly what an order the admin forgot to confirm looks
       like — the customer gets nothing and the evidence files itself
       away. Those stay in their tab, flagged LATE, until a person
       decides what to do with them. */
    if(!isOrderSettled(o)) return;

    const d = new Date(o.preferredDate);
    if(isNaN(d.getTime())) return;
    d.setHours(0,0,0,0);
    if(d >= today) return;                    // today or later is still live

    o.archived       = true;
    o.autoArchived   = true;
    o.archivedAt     = new Date().toISOString();
    o.archivedReason = `Delivery date ${d.toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})} has passed`;
    swept.push(o.id);
  });

  if(swept.length) saveDB();
  return swept.length;
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
  {
    const _o = DB.orders.find(oo => oo.id === id);
    if(_o) logRead('Orders', 'Order details viewed', `${_o.id} — ${_o.customer || 'Customer'}`, '');
  }
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
        <div class="llm-demo">
          <span class="llm-demo-tag">DEMO</span>
          <span class="llm-demo-note">Simulated delivery — advances on its own, or step it manually.</span>
          <div class="llm-demo-actions">
            <button class="btn-secondary sm" onclick="lalamoveDemoAdvance('${o.id}')" ${tracking.status==='COMPLETED'?'disabled':''}>
              <i class='bx bx-fast-forward'></i> Next stage
            </button>
            <button class="btn-ghost sm" onclick="lalamoveDemoRestart('${o.id}')">
              <i class='bx bx-revision'></i> Restart
            </button>
          </div>
        </div>
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
      <div><label style="font-size:11px;color:var(--text-2);font-weight:700">CUSTOMER</label><div class="fw-bold">${escHTML(o.customer)}</div></div>
      <div><label style="font-size:11px;color:var(--text-2);font-weight:700">DATE</label><div>${fmtDateTime(o.date)}</div></div>
      <div><label style="font-size:11px;color:var(--text-2);font-weight:700">TYPE</label><div>${o.type}</div></div>
      ${o.payment?`<div><label style="font-size:11px;color:var(--text-2);font-weight:700">PAYMENT</label><div>${o.payment}</div></div>`:''}
      ${o.address?`<div style="grid-column:1/-1"><label style="font-size:11px;color:var(--text-2);font-weight:700">DELIVERY ADDRESS</label><div>${escHTML(o.address)}</div></div>`:''}
      ${o.preferredDate?`<div style="grid-column:1/-1"><label style="font-size:11px;color:var(--text-2);font-weight:700">PREFERRED DELIVERY DATE</label><div>${new Date(o.preferredDate).toLocaleDateString('en-PH',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div></div>`:''}
      ${o.preferredTime?`<div style="grid-column:1/-1"><label style="font-size:11px;color:var(--text-2);font-weight:700">PREFERRED DELIVERY TIME</label><div>${o.preferredTime}</div></div>`:''}
      ${o.contactMethod?`<div style="grid-column:1/-1"><label style="font-size:11px;color:var(--text-2);font-weight:700">PREFERRED CONTACT METHOD</label><div>${escHTML(o.contactMethod)}</div></div>`:''}
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

  /* Shown to whoever now owns the order after someone handed it back */
  const sendBackBanner = o.declineReason ? `
    <div style="margin-bottom:16px;padding:12px 16px;background:#FFF7ED;border:1.5px solid #EA580C;border-radius:10px;display:flex;gap:10px;align-items:flex-start">
      <span style="font-size:18px;flex-shrink:0">↩️</span>
      <div>
        <div style="font-size:12px;font-weight:700;color:#EA580C;margin-bottom:2px">SENT BACK</div>
        <div style="font-size:13px">${escHTML(o.declineReason)}</div>
        <div style="font-size:11px;color:var(--text-2);margin-top:2px">${o.declinedBy || 'Staff'}${o.declinedAt ? ' · ' + fmtDateTime(o.declinedAt) : ''}</div>
      </div>
    </div>` : '';

  document.getElementById('order-modal-body').innerHTML = isBakerView ? `
    ${sendBackBanner}
    <table class="data-table">
      <thead><tr><th>Item</th><th>Qty</th><th></th></tr></thead>
      <tbody>${bakerRows}</tbody>
    </table>` : isStaffView ? `
    <table class="data-table">
      <thead><tr><th>Item</th><th>Qty</th></tr></thead>
      <tbody>${o.items.map(i=>`<tr><td class="fw-bold">${i.name}</td><td>${i.qty}</td></tr>`).join('')}</tbody>
    </table>` : `
    ${sendBackBanner}
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
        <div style="font-size:13px;color:#374151">Reason: <strong>${escHTML(o.cancelReason)}</strong></div></div>
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

  const data = LalamoveSim.createOrder({
    customerName:    o.customer,
    customerPhone:   o.phone,
    deliveryAddress: o.address
  });

  if(!data.success){
    btn.disabled    = false;
    btn.textContent = '🛵 Book Lalamove';
    toast('Lalamove error: ' + data.error, 'danger');
    return;
  }

  // Save tracking to Supabase order_tracking table
  const trackingData = {
    lalamoveRef: data.orderRef,
    bookedAt:    data.bookedAt,
    shareLink:   data.shareLink || null,
    status:      'ASSIGNING_DRIVER',
    driver:      null,
    lastUpdated: new Date().toISOString()
  };
  _supa.from('order_tracking')
    .upsert({ order_id: o.id, data: trackingData }, { onConflict: 'order_id' })
    .then(() => { _trackingCache[o.id] = trackingData; })
    .catch(console.error);

  _trackingCache[o.id] = trackingData;
  o.lalamoveRef = data.orderRef;
  saveDB();

  toast('Lalamove booked! Ref: ' + data.orderRef, 'success');
  closeModal('order-modal');
  openOrderModal(o.id); // reopen to show tracking section
}

/* Presenter controls — jump the open booking to its next stage, or start
   it over, so a demo doesn't depend on waiting in real time. */
async function lalamoveDemoAdvance(orderId){
  const t = _trackingCache[orderId];
  if(!t) return;

  const skewed = LalamoveSim.skewToNextStage(t.bookedAt || t.lalamoveRef);
  if(skewed === null){ toast('Already delivered', 'warning'); return; }

  await applyLalamoveSkew(orderId, t, skewed);
  toast('Moved to the next delivery stage', 'success');
}

async function lalamoveDemoRestart(orderId){
  const t = _trackingCache[orderId];
  if(!t) return;
  await applyLalamoveSkew(orderId, t, Date.now());
  toast('Delivery restarted', 'success');
}

async function applyLalamoveSkew(orderId, tracking, bookedAt){
  const res = LalamoveSim.track(bookedAt);
  const updated = {
    ...tracking,
    bookedAt,
    status:      res.status,
    driver:      res.driver,
    lastUpdated: new Date().toISOString()
  };
  _trackingCache[orderId] = updated;
  await _supa.from('order_tracking')
    .upsert({ order_id: orderId, data: updated }, { onConflict: 'order_id' })
    .catch(console.error);
  renderOrders();
  closeModal('order-modal');
  openOrderModal(orderId);
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
      const data = LalamoveSim.track(t.bookedAt || t.lalamoveRef);
      if (!data.success) continue;
      if (data.status === t.status) continue;   // nothing moved since last poll

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
        // Put back any ingredients already taken out for baking
        const putBack = restoreIngredientsFor(o);

        // Clear from sl_store_orders so syncStoreOrders() doesn't re-trigger
        const storeOrders = JSON.parse(localStorage.getItem('sl_store_orders') || '[]');
        const so = storeOrders.find(x => x.id === o.id);
        if(so){ so.status = 'Cancelled'; localStorage.setItem('sl_store_orders', JSON.stringify(storeOrders)); }

        syncStatusToCustomer(o, 'Cancelled');
        saveDB(); closeModal('order-modal'); renderOrders(); updateBadges(); renderInventory();
        toast(putBack.length ? 'Cancellation accepted — ingredients returned to stock' : 'Cancellation accepted', 'success');
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
        // Put back any ingredients already taken out for baking
        const putBack = restoreIngredientsFor(o);
        syncStatusToCustomer(o, 'Cancelled');
        saveDB(); closeModal('order-modal'); renderOrders(); updateBadges(); renderInventory();
        toast(putBack.length ? 'Cancellation accepted — ingredients returned to stock' : 'Order cancellation accepted', 'success');
      }
    });
    return;
  } else if(o.status==='Pending'){
    /* Ingredients are NOT taken out here — confirming only accepts the
       order. They come out when baking actually starts, in
       prepareOrderAction(), so stock reflects what is really in the
       kitchen rather than what has merely been agreed to. */
    // Update sl_store_orders so syncStoreOrders() doesn't re-import as Pending on reload
    const _soConfirm = JSON.parse(localStorage.getItem('sl_store_orders') || '[]');
    const _soMatchC = _soConfirm.find(x => x.id === o.id);
    if(_soMatchC){ _soMatchC.status = 'Confirmed'; localStorage.setItem('sl_store_orders', JSON.stringify(_soConfirm)); }
    // Re-confirming clears any earlier send-back, so the banner doesn't linger
    delete o.declineReason; delete o.declinedBy; delete o.declinedAt;
    updateOrderStatus(o.id,'Confirmed');
    syncStatusToCustomer(o, 'Confirmed');
  } else if(o.status==='Preparing'){
    // Stock already deducted when baking started — just record transaction
    updateOrderStatus(o.id,'Fulfilled');
    if(!DB.transactions.find(t=>t.id==='TX-'+o.id))
      DB.transactions.push({ id:'TX-'+o.id, customer:o.customer, items:o.items, total:o.total, date:new Date().toISOString(), payment:o.payment||'GCash' });
    syncStatusToCustomer(o, 'Fulfilled');
  }

  saveDB(); closeModal('order-modal'); renderOrders(); updateBadges(); renderInventory();
}

/* Takes an order's ingredients out of stock. Called when baking starts,
   not when the order is confirmed — stock should reflect what has
   actually gone into the mixing bowl. The flag makes it safe to call more
   than once for the same order, which matters because an order can come
   back to Confirmed and be started again. */
function deductIngredientsFor(o){
  if(o.stockDeducted) return [];

  const used = [];
  o.items.forEach(item=>{
    const p = DB.products.find(pp=>pp.name===item.name || pp.id===item.id);
    if(!p || !p.recipe) return;
    p.recipe.forEach(r=>{
      const ing = DB.ingredients.find(i=>i.id===r.ingredientId);
      if(!ing) return;
      const before = ing.stock;
      const deduct = r.qty * item.qty;
      ing.stock = Math.max(0, ing.stock - deduct);
      used.push({ name: ing.name, deduct, unit: ing.unit, short: before < deduct });
      logStock({ type:'ingredient', itemId:ing.id, itemName:ing.name, unit:ing.unit, op:'order', before, after:ing.stock, note:'Baking started', ref:o.id });
    });
  });

  o.stockDeducted = true;
  return used;
}

/* Puts an order's ingredients back. Cancelling after baking has started
   used to write the stock off permanently, leaving inventory lower than
   what was really in the storeroom. */
function restoreIngredientsFor(o){
  if(!o.stockDeducted) return [];

  const back = [];
  o.items.forEach(item=>{
    const p = DB.products.find(pp=>pp.name===item.name || pp.id===item.id);
    if(!p || !p.recipe) return;
    p.recipe.forEach(r=>{
      const ing = DB.ingredients.find(i=>i.id===r.ingredientId);
      if(!ing) return;
      const before = ing.stock;
      const amount = r.qty * item.qty;
      ing.stock = before + amount;
      back.push({ name: ing.name, amount, unit: ing.unit });
      logStock({ type:'ingredient', itemId:ing.id, itemName:ing.name, unit:ing.unit, op:'return', before, after:ing.stock, note:'Order cancelled', ref:o.id });
    });
  });

  delete o.stockDeducted;
  return back;
}

function prepareOrderAction(){
  const o = DB.orders.find(oo=>oo.id===currentOrderId);
  if(!o) return;
  o.preparingAt = new Date().toISOString();
  o.preparingSubStatus = 'baking';

  // Ingredients come out of stock now that it is actually being baked
  const used  = deductIngredientsFor(o);
  const short = used.filter(u => u.short);
  if(short.length){
    toast(`Started baking — but stock was short on ${short.map(s=>s.name).join(', ')}`, 'warning');
  } else if(used.length){
    toast('Started baking — ingredients deducted from inventory', 'success');
  }
  const _soPrep = JSON.parse(localStorage.getItem('sl_store_orders') || '[]');
  const _soMatchP = _soPrep.find(x => x.id === o.id);
  if(_soMatchP){ _soMatchP.status = 'Preparing'; localStorage.setItem('sl_store_orders', JSON.stringify(_soPrep)); }
  updateOrderStatus(o.id, 'Preparing');
  syncStatusToCustomer(o, 'Preparing');
  saveDB(); closeModal('order-modal'); renderOrders(); updateBadges(); renderInventory();
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

/* ═══════════════════════════════════════════
   ORDER CRUD (admin)
   Create a walk-in order, edit an existing one, delete for good.
   Archive is still the everyday way to clear finished orders — delete
   is here for test rows and genuine mistakes, and is irreversible.
   ═══════════════════════════════════════════ */

/* Ids deleted this session. syncStoreOrders() skips them, so the poll
   can't resurrect an order between the local removal and the next
   fetch. */
const _deletedOrderIds = new Set();

function deleteOrder(id){
  const o = DB.orders.find(oo => oo.id === id);
  if(!o) return;

  showConfirm({
    title: 'Delete order',
    message: `Permanently delete ${o.id} (${o.customer}, ₱${Number(o.total||0).toLocaleString()})? This cannot be undone. To keep the record but clear it from the lists, use Archive instead.`,
    okText: 'Delete for good',
    okClass: 'btn-danger',
    icon: 'bx-trash',
    onConfirm: async () => {
      /* Tombstone first. syncStoreOrders() runs every 3 seconds and adds
         back any Supabase order it can't find locally — without this it
         can re-add the order mid-delete, and the next saveDB() uploads it
         again, undoing the whole thing. */
      _deletedOrderIds.add(id);

      /* supabase-js resolves with { error } instead of rejecting, so a
         .catch() here would never fire and a failed delete would look
         like a success. Check the error. */
      const { error } = await _supa.from('orders').delete().eq('id', id);
      if(error){
        _deletedOrderIds.delete(id);
        console.error('delete order failed:', error);
        toast('Could not delete: ' + error.message, 'danger');
        return;
      }

      const { error: trackErr } = await _supa.from('order_tracking').delete().eq('order_id', id);
      if(trackErr) console.error('could not clear tracking row:', trackErr);

      // Ingredients already taken out for a bake go back on the shelf
      const putBack = restoreIngredientsFor(o);
      DB.orders = DB.orders.filter(oo => oo.id !== id);
      delete _trackingCache[id];

      const store = JSON.parse(localStorage.getItem('sl_store_orders') || '[]');
      localStorage.setItem('sl_store_orders', JSON.stringify(store.filter(x => x.id !== id)));

      saveDB(); renderOrders(); updateBadges(); renderInventory();
      logAudit('Orders', 'Order deleted', `${o.id} — ${o.customer || 'Customer'}`,
               `₱${Number(o.total||0).toLocaleString()}` +
               (putBack.length ? `, ${putBack.length} ingredient${putBack.length===1?'':'s'} returned` : ''));
      toast(putBack.length ? 'Order deleted — ingredients returned to stock' : 'Order deleted', 'success');
    }
  });
}

/* ── ADMIN QUEUE CONTROL ──
   Staff can only push an order back; the admin can also pull one
   forward, for the rush order that has to jump the line. Both work by
   moving queuedAt, the same field the queue sorts on, so there is one
   ordering rule rather than two competing ones. */
function queuePeers(order){
  return DB.orders.filter(o => !o.archived && o.status === order.status);
}

const queueStamp = o => new Date(o.queuedAt || o.date).getTime();

function adminQueueToFront(id){
  const o = DB.orders.find(oo => oo.id === id);
  if(!o) return;

  const earliest = Math.min(...queuePeers(o).map(queueStamp));
  o.queuedAt = new Date(earliest - 1000).toISOString();

  saveDB(); renderOrders(); updateBadges();
  toast(`${o.id} moved to the front of the queue`, 'success');
}

function adminQueueToBack(id){
  const o = DB.orders.find(oo => oo.id === id);
  if(!o) return;

  const latest = Math.max(...queuePeers(o).map(queueStamp));
  o.queuedAt   = new Date(Math.max(latest, Date.now()) + 1000).toISOString();
  o.deferCount = (o.deferCount || 0) + 1;

  saveDB(); renderOrders(); updateBadges();
  toast(`${o.id} moved to the back of the queue`, 'success');
}

/* Baker is mid-way through something else — push this order to the back
   of the bake queue. It stays Confirmed, so nothing changes for the
   customer and no one needs to re-approve it. */
function bakerDeferOrder(id){
  const o = DB.orders.find(oo=>oo.id===id);
  if(!o) return;
  showConfirm({
    title: 'Bake this later?',
    message: `Order ${o.id} moves to the back of the queue. It stays confirmed and the customer sees no change.`,
    okText: 'Send to back',
    okClass: 'btn-secondary',
    icon: 'bx-down-arrow-circle',
    onConfirm: () => {
      o.queuedAt   = new Date().toISOString();
      o.deferCount = (o.deferCount || 0) + 1;
      saveDB(); renderOrders(); updateBadges();
      toast('Moved to the back of the queue', 'success');
    }
  });
}

/* Baker can't take the order at all — hand it back to the admin by
   returning it to Pending, with a reason so they know why. */
function bakerDeclineOrder(id){
  const o = DB.orders.find(oo=>oo.id===id);
  if(!o) return;
  showConfirm({
    title: 'Send back to the admin?',
    message: `Order ${o.id} goes back to Pending for the admin to sort out. Use this when it can't be baked at all — to bake it later instead, use "send to back of queue".`,
    okText: 'Send back',
    okClass: 'btn-danger',
    icon: 'bx-x',
    inputLabel: 'Reason (the admin will see this)',
    inputPlaceholder: 'e.g. out of red velvet mix',
    onConfirm: (reason) => {
      o.status        = 'Pending';
      o.declineReason = reason || 'No reason given';
      o.declinedBy    = `${currentUser.fname} ${currentUser.lname}`.trim();
      o.declinedAt    = new Date().toISOString();
      delete o.queuedAt;
      delete o.preparingSubStatus;

      const _so = JSON.parse(localStorage.getItem('sl_store_orders') || '[]');
      const _soMatch = _so.find(x => x.id === o.id);
      if(_soMatch){ _soMatch.status = 'Pending'; localStorage.setItem('sl_store_orders', JSON.stringify(_so)); }
      syncStatusToCustomer(o, 'Pending');

      saveDB(); renderOrders(); updateBadges();
      toast('Sent back to the admin', 'success');
    }
  });
}

/* Packer is mid-way through another order — push this one to the back of
   the packing queue. Status is untouched. */
function packerDeferOrder(id){
  const o = DB.orders.find(oo=>oo.id===id);
  if(!o) return;
  showConfirm({
    title: 'Pack this later?',
    message: `Order ${o.id} moves to the back of the packing queue. Nothing changes for the customer.`,
    okText: 'Send to back',
    okClass: 'btn-secondary',
    icon: 'bx-down-arrow-circle',
    onConfirm: () => {
      o.queuedAt   = new Date().toISOString();
      o.deferCount = (o.deferCount || 0) + 1;
      saveDB(); renderOrders(); updateBadges();
      toast('Moved to the back of the queue', 'success');
    }
  });
}

/* Something is wrong with what came out of the kitchen — hand it back one
   step to the baker rather than all the way to Pending, so the order
   keeps its place in the workflow and no stock is re-counted. */
function packerSendBackToBaker(id){
  const o = DB.orders.find(oo=>oo.id===id);
  if(!o) return;
  showConfirm({
    title: 'Send back to the baker?',
    message: `Order ${o.id} goes back to the baker's queue to be remade. Use this when what was baked can't be packed — to pack it later instead, use "send to back of queue".`,
    okText: 'Send back',
    okClass: 'btn-danger',
    icon: 'bx-x',
    inputLabel: 'Reason (the baker will see this)',
    inputPlaceholder: 'e.g. brownies came out broken',
    onConfirm: (reason) => {
      o.status        = 'Confirmed';
      o.declineReason = reason || 'No reason given';
      o.declinedBy    = `${currentUser.fname} ${currentUser.lname}`.trim();
      o.declinedAt    = new Date().toISOString();
      o.queuedAt      = new Date().toISOString();   // rejoins the bake queue at the back
      delete o.preparingSubStatus;
      /* It is being made again, which really does use another batch of
         ingredients, so let the re-bake deduct afresh. */
      delete o.stockDeducted;

      const _so = JSON.parse(localStorage.getItem('sl_store_orders') || '[]');
      const _soMatch = _so.find(x => x.id === o.id);
      if(_soMatch){ _soMatch.status = 'Confirmed'; localStorage.setItem('sl_store_orders', JSON.stringify(_so)); }
      syncStatusToCustomer(o, 'Confirmed');

      saveDB(); renderOrders(); updateBadges();
      toast('Sent back to the baker', 'success');
    }
  });
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
      // Remade — clear the packer's note so it doesn't follow the order back
      delete o.declineReason; delete o.declinedBy; delete o.declinedAt;
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
      <div><span style="color:var(--text-2);font-size:11px;font-weight:700">CUSTOMER</span><div>${escHTML(o.customer)}</div></div>
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
  const was = o.status;
  o.status = status;
  logAudit('Orders', 'Status changed', `${o.id} — ${o.customer || 'Customer'}`, `${was} → ${status}`);
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
      const low = isIngLow(ing);
      const pct = Math.min(100, Math.round((ing.stock / ingCapacity(ing)) * 100));
      ingHTML += `<tr>
        <td class="fw-bold">${ing.name}</td>
        <td>${ing.unit}</td>
        <td>
          <div class="stock-bar-wrap">
            <div class="stock-bar"><div class="stock-bar-fill ${low?'low':'ok'}" style="width:${pct}%"></div></div>
            <div class="stock-label">${ing.stock} ${ing.unit}</div>
          </div>
        </td>
        <td>${ingThresholdPct(ing)}% <small style="color:var(--text-2)">(${ingThresholdQty(ing)} ${ing.unit})</small></td>
        <td><span class="pill ${low?'low':'ok'}">${low?'Low Stock':'OK'}</span></td>
        <td>
          <div class="td-actions">
            <button class="btn-icon warn" onclick="openAdjustStock('${ing.id}','ingredient')" title="Adjust"><i class='bx bx-slider'></i></button>
            <button class="btn-icon edit" onclick="openIngredientModal('${ing.id}')" title="Edit"><i class='bx bx-edit'></i></button>
            <button class="btn-icon danger" onclick="deleteIngredient('${ing.id}')" title="Delete"><i class='bx bx-trash'></i></button>
          </div>
        </td>
      </tr>`;
    });
  });
  document.getElementById('ingredients-body').innerHTML = ingHTML;
  syncRestockForm().then(renderSupplierOrders);
}

/* ═══════════════════════════════════════════
   RESTOCK ORDER FORMS
   When any ingredient falls to or below its threshold, a Restock Order
   Form is raised automatically listing everything that is low, with a
   suggested quantity for each. The form is a document to review, print
   and hand to a supplier — it does not move stock. Stock changes when
   someone adjusts it, which keeps the count honest about what is
   actually on the shelf.

   One open form at a time. While it is open, new shortages are added to
   it rather than raising a second form, so a supplier gets one list
   instead of a trickle.
   ═══════════════════════════════════════════ */

/* Enough to get back above the threshold with room to spare, rounded to
   something a supplier would actually sell. */
function suggestedRestockQty(ing){
  const target = ingCapacity(ing);
  const needed = Math.max(target - ing.stock, 1);
  const step   = ing.unit === 'pcs' ? 1 : 50;
  return Math.ceil(needed / step) * step;
}

function restockPriority(ing){
  if(ing.stock <= 0) return 'Out of stock';
  if(ing.stock <= ingThresholdQty(ing) * 0.5) return 'Urgent';
  return 'Low';
}

function lowIngredients(){
  return DB.ingredients.filter(isIngLow);
}

/* Forms raised before the draft/send split used status 'Open'. Read it
   as 'Draft' so old records keep working rather than showing a status
   that no longer means anything. */
function restockStatus(f){ return f.status === 'Open' ? 'Draft' : (f.status || 'Draft'); }
function isRestockDraft(f){ return restockStatus(f) === 'Draft'; }

function draftRestockForm(){
  return (DB.supplierOrders || []).find(isRestockDraft) || null;
}

function restockLineFor(ing){
  const suggested = suggestedRestockQty(ing);
  return {
    ingId:        ing.id,
    name:         ing.name,
    currentStock: ing.stock,
    unit:         ing.unit,
    threshold:    ingThresholdQty(ing),
    thresholdPct: ingThresholdPct(ing),
    capacity:     ingCapacity(ing),
    suggestedQty: suggested,
    /* What will actually be ordered. Starts at the suggestion and is
       the admin's to change — the suggestion is kept beside it so the
       form shows what was advised as well as what was decided. */
    orderQty:     suggested,
    include:      true,
    priority:     restockPriority(ing)
  };
}

/* Older lines predate these two fields. */
function rfOrderQty(l){ return l.orderQty == null ? (l.suggestedQty || 0) : l.orderQty; }
function rfIncluded(l){ return l.include !== false; }
function rfLinesToOrder(f){ return formLines(f).filter(rfIncluded); }

/* Shortages the admin has already been told about this session, so the
   alert fires once rather than on every render. Cleared for an
   ingredient that recovers, so it alerts again if it runs low later. */
const _restockAlerted = new Set();

/* Called on every inventory render. A shortage raises a DRAFT and
   alerts the admin — it is never sent anywhere on its own. The draft
   is a proposal: the admin edits what is on it and how much, and
   nothing counts as ordered until they confirm it. */
async function syncRestockForm(){
  const low = lowIngredients();
  let form  = draftRestockForm();

  DB.ingredients.forEach(i => { if(!isIngLow(i)) _restockAlerted.delete(i.id); });

  /* Keep the draft's stock figures current while it sits unsent, but
     never touch orderQty or include — those are the admin's. */
  let changed = false;
  if(form){
    low.forEach(ing => {
      const line = form.items.find(l => l.ingId === ing.id);
      if(line && line.currentStock !== ing.stock){
        line.currentStock = ing.stock;
        line.suggestedQty = suggestedRestockQty(ing);
        line.priority     = restockPriority(ing);
        changed = true;
      }
    });
  }

  /* Anything low that is not already proposed. A line the admin removed
     from the draft stays removed — removedIds remembers that decision,
     so their edit is not undone by the next render. */
  const fresh = low.filter(ing =>
    !(form && form.items.some(l => l.ingId === ing.id)) &&
    !(form && (form.removedIds || []).includes(ing.id))
  );

  if(fresh.length){
    if(!form){
      form = {
        id:        'RF-' + Date.now(),
        date:      new Date().toISOString(),
        status:    'Draft',
        reference: 'RF-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + String(Date.now()).slice(-4),
        items:     [],
        removedIds: [],
        supplier:  '', contact: '', neededBy: '',
        raisedBy:  'System — low stock'
      };
      DB.supplierOrders.unshift(form);
    }
    fresh.forEach(ing => form.items.push(restockLineFor(ing)));
    changed = true;
  }

  if(changed) await saveRestockForm(form);

  // Alert once per ingredient, wherever the admin happens to be
  const toAlert = fresh.filter(ing => !_restockAlerted.has(ing.id));
  if(toAlert.length){
    toAlert.forEach(ing => _restockAlerted.add(ing.id));
    const names = toAlert.map(i => i.name);
    const list  = names.length <= 2 ? names.join(' and ')
                : `${names.slice(0,2).join(', ')} and ${names.length - 2} more`;
    toast(`${list} running low — restock form ${form.reference} is waiting for your review`, 'warning');
    logAudit('Inventory', 'Restock draft raised', form.reference,
             `${toAlert.length} ingredient${toAlert.length === 1 ? '' : 's'}: ${names.join(', ')}`);
  }

  if(changed) updateBadges();
}

async function saveRestockForm(form){
  const { error } = await _supa.from('supplier_orders')
    .upsert({ id: form.id, date: form.date, data: form }, { onConflict: 'id' });
  if(error){
    console.error('could not save the restock form:', error);
    toast('Could not save the restock form: ' + error.message, 'danger');
    return false;
  }
  return true;
}

/* Older records were one order per ingredient; show them as a one-line
   form so nothing disappears from the history. */
function formLines(f){
  if(Array.isArray(f.items)) return f.items;
  return [{
    ingId: f.ingId, name: f.ingName, currentStock: null, unit: f.unit,
    suggestedQty: f.qty, priority: '—'
  }];
}

function renderSupplierOrders(){
  const box = document.getElementById('supplier-orders-body');
  if(!box) return;

  const list = [...(DB.supplierOrders || [])].sort((a,b) => new Date(b.date) - new Date(a.date));

  const drafts = list.filter(isRestockDraft).length;
  const badge = document.getElementById('po-pending-count');
  if(badge){ badge.textContent = drafts; badge.style.display = drafts ? '' : 'none'; }

  if(!list.length){
    box.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:22px;color:var(--text-2)">
      No restock forms. A draft is raised for you to review when an ingredient reaches its reorder point.</td></tr>`;
    return;
  }

  box.innerHTML = list.slice(0, 15).map(f => {
    const status = restockStatus(f);
    const draft  = isRestockDraft(f);
    const lines  = draft ? formLines(f) : rfLinesToOrder(f);
    const urgent = lines.filter(l => l.priority === 'Urgent' || l.priority === 'Out of stock').length;
    const pill   = draft ? 'pending' : status === 'Cancelled' ? 'cancelled' : 'fulfilled';
    return `
      <tr>
        <td class="fw-bold">${escHTML(f.reference || f.id)}</td>
        <td>${lines.length} item${lines.length === 1 ? '' : 's'}${urgent ? ` <span class="cod-risk high">${urgent} urgent</span>` : ''}</td>
        <td>${escHTML(lines.slice(0,3).map(l => l.name).join(', '))}${lines.length > 3 ? ` +${lines.length - 3} more` : ''}</td>
        <td>${fmtDate(f.date)}</td>
        <td><span class="pill ${pill}">${escHTML(draft ? 'Awaiting review' : status)}</span></td>
        <td>
          <div class="td-actions">
            <button class="${draft ? 'btn-primary' : 'btn-secondary'} sm" onclick="viewRestockForm('${f.id}')">
              <i class='bx bx-${draft ? 'edit' : 'file'}'></i> ${draft ? 'Review & send' : 'View form'}
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

/* A draft opens for review and editing; anything already sent opens as
   the finished document. The same button does both, because "look at
   the form" means a different thing before and after it goes out. */
function viewRestockForm(id){
  const f = (DB.supplierOrders || []).find(x => x.id === id);
  if(!f) return;
  if(isRestockDraft(f)) return openRestockEditor(f);
  renderRestockDocument(f);
}

/* ── REVIEWING A DRAFT ──
   Edits are held here and written once the admin saves or sends, so
   closing the window without saving leaves the draft as it was. */
let rfDraft = null;

function openRestockEditor(f){
  rfDraft = JSON.parse(JSON.stringify(f));
  rfDraft.items = formLines(rfDraft).map(l => ({ ...l, orderQty: rfOrderQty(l), include: rfIncluded(l) }));
  renderRestockEditor();
  openModal('restock-form-modal');
}

function renderRestockEditor(){
  const f = rfDraft;
  if(!f) return;
  const lines  = f.items;
  const chosen = lines.filter(rfIncluded);

  /* Ingredients not already proposed, so the admin can order something
     that has not tripped its threshold — a bulk week, a new recipe. */
  const spare = DB.ingredients
    .filter(i => !lines.some(l => l.ingId === i.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  document.getElementById('rf-body').innerHTML = `
    <div class="rf-edit">
      <div class="rf-edit-head">
        <div>
          <strong>${escHTML(f.reference || f.id)}</strong>
          <small>Raised ${fmtDateTime(f.date)} · ${escHTML(f.raisedBy || 'System')}</small>
        </div>
        <span class="pill pending">Draft — not sent</span>
      </div>

      <p class="rf-edit-intro">
        Raised automatically because these ingredients reached their reorder point.
        Change the quantities, untick anything you are not ordering, or add something else.
        Nothing is sent until you confirm it.
      </p>

      <div class="rf-edit-fields">
        <label>Supplier / store
          <input type="text" id="rf-supplier" value="${escHTML(f.supplier || '')}"
                 placeholder="e.g. Pasig Baking Supply" oninput="rfField('supplier', this.value)">
        </label>
        <label>Contact person &amp; number
          <input type="text" id="rf-contact" value="${escHTML(f.contact || '')}"
                 placeholder="e.g. Aling Rosa — 0917 123 4567" oninput="rfField('contact', this.value)">
        </label>
        <label>Needed by
          <input type="date" id="rf-needed" value="${escHTML(f.neededBy || '')}"
                 onchange="rfField('neededBy', this.value)">
        </label>
      </div>

      <table class="rf-edit-table">
        <thead>
          <tr>
            <th class="col-tick">Order</th>
            <th>Ingredient</th>
            <th class="num">On hand</th>
            <th class="num">Reorder at</th>
            <th>Priority</th>
            <th class="num">Suggested</th>
            <th class="num">Order qty</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${lines.length ? lines.map((l, i) => `
            <tr class="${rfIncluded(l) ? '' : 'rf-row-off'}">
              <td class="col-tick">
                <input type="checkbox" ${rfIncluded(l) ? 'checked' : ''} onchange="rfToggle(${i}, this.checked)"
                       title="Include this ingredient in the order">
              </td>
              <td class="item"><strong>${escHTML(l.name)}</strong></td>
              <td class="num">${l.currentStock == null ? '—' : l.currentStock + ' ' + escHTML(l.unit || '')}</td>
              <td class="num muted">${l.threshold == null ? '—' : l.threshold + ' ' + escHTML(l.unit || '')}</td>
              <td>${l.priority && l.priority !== '—'
                    ? `<span class="rf-pri ${l.priority === 'Low' ? 'low' : 'urgent'}">${escHTML(l.priority)}</span>`
                    : '<span class="muted">—</span>'}</td>
              <td class="num muted">${l.suggestedQty || 0} ${escHTML(l.unit || '')}</td>
              <td class="num">
                <input type="number" min="0" step="1" class="rf-qty" value="${rfOrderQty(l)}"
                       ${rfIncluded(l) ? '' : 'disabled'} oninput="rfQty(${i}, this.value)">
                <span class="u">${escHTML(l.unit || '')}</span>
              </td>
              <td><button class="btn-icon danger" title="Remove from this form"
                          onclick="rfRemove(${i})"><i class='bx bx-trash'></i></button></td>
            </tr>`).join('')
          : `<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--text-2)">
               Nothing on this form. Add an ingredient below, or cancel it.</td></tr>`}
        </tbody>
      </table>

      <div class="rf-edit-add">
        <label>Add another ingredient
          <select id="rf-add-pick">
            <option value="">Choose an ingredient…</option>
            ${spare.map(i => `<option value="${escHTML(i.id)}">${escHTML(i.name)} — ${i.stock} ${escHTML(i.unit || '')} on hand</option>`).join('')}
          </select>
        </label>
        <button class="btn-secondary sm" onclick="rfAdd()"><i class='bx bx-plus'></i> Add</button>
      </div>

      <div class="rf-edit-total">
        <span>${chosen.length} of ${lines.length} ingredient${lines.length === 1 ? '' : 's'} selected to order</span>
      </div>
    </div>`;

  document.getElementById('rf-footer').innerHTML = `
    <button class="btn-ghost danger" onclick="cancelRestockForm('${f.id}')">Cancel form</button>
    <div style="flex:1"></div>
    <button class="btn-ghost" onclick="closeModal('restock-form-modal')">Close</button>
    <button class="btn-secondary" onclick="saveRestockDraft()"><i class='bx bx-save'></i> Save draft</button>
    <button class="btn-primary" onclick="confirmAndSendRestock()" ${chosen.length ? '' : 'disabled'}>
      <i class='bx bx-send'></i> Confirm &amp; send
    </button>`;
}

function rfField(key, value){ if(rfDraft) rfDraft[key] = value; }

function rfToggle(i, on){
  if(!rfDraft) return;
  rfDraft.items[i].include = on;
  renderRestockEditor();
}

/* Not re-rendered on every keystroke — that would move the caret and
   make the field impossible to type in. The count updates on save. */
function rfQty(i, value){
  if(!rfDraft) return;
  rfDraft.items[i].orderQty = Math.max(0, parseInt(value, 10) || 0);
}

function rfRemove(i){
  if(!rfDraft) return;
  const [gone] = rfDraft.items.splice(i, 1);
  /* Remembered so the next inventory render does not put it straight
     back — the admin took it off on purpose. */
  if(gone && gone.ingId){
    rfDraft.removedIds = [...new Set([...(rfDraft.removedIds || []), gone.ingId])];
  }
  renderRestockEditor();
}

function rfAdd(){
  const pick = document.getElementById('rf-add-pick');
  const ing  = DB.ingredients.find(i => i.id === pick?.value);
  if(!ing){ toast('Choose an ingredient first', ''); return; }
  rfDraft.items.push(restockLineFor(ing));
  rfDraft.removedIds = (rfDraft.removedIds || []).filter(id => id !== ing.id);
  renderRestockEditor();
}

/* Writes the held edits back onto the real form. */
function rfCommit(){
  const real = (DB.supplierOrders || []).find(x => x.id === rfDraft.id);
  if(!real) return null;
  real.items      = rfDraft.items;
  real.removedIds = rfDraft.removedIds || [];
  real.supplier   = rfDraft.supplier || '';
  real.contact    = rfDraft.contact  || '';
  real.neededBy   = rfDraft.neededBy || '';
  return real;
}

async function saveRestockDraft(){
  const real = rfCommit();
  if(!real) return;
  const ok = await saveRestockForm(real);
  renderSupplierOrders();
  if(ok) toast('Draft saved — still not sent', 'success');
}

function confirmAndSendRestock(){
  const chosen = rfDraft.items.filter(rfIncluded);
  if(!chosen.length){ toast('Tick at least one ingredient to order', 'danger'); return; }

  const zero = chosen.filter(l => rfOrderQty(l) <= 0);
  if(zero.length){
    toast(`Set a quantity for ${zero.map(l => l.name).join(', ')}`, 'danger');
    return;
  }

  const summary = chosen.map(l => `${l.name} ${rfOrderQty(l)}${l.unit || ''}`).join(', ');

  showConfirm({
    title:   'Send this restock order',
    message: `Order ${chosen.length} ingredient${chosen.length === 1 ? '' : 's'}${rfDraft.supplier ? ' from ' + rfDraft.supplier : ''}: ${summary}.` +
             ` Once sent the form is final — it stays in the history and the next shortage raises a new one.` +
             ` Stock is not changed; adjust it when the delivery actually arrives.`,
    okText:  'Confirm & send',
    okClass: 'btn-primary',
    icon:    'bx-send',
    onConfirm: async () => {
      const real = rfCommit();
      if(!real) return;
      real.status     = 'Sent';
      real.sentAt     = new Date().toISOString();
      real.sentBy     = `${currentUser.fname} ${currentUser.lname}`.trim();
      /* Only what was actually ordered goes into the record. */
      real.items      = chosen;
      const ok = await saveRestockForm(real);
      closeModal('restock-form-modal');
      rfDraft = null;
      renderInventory();
      logAudit('Inventory', 'Restock order sent', real.reference, summary);
      if(ok) toast(`${real.reference} sent — ${chosen.length} ingredient${chosen.length === 1 ? '' : 's'}`, 'success');
    }
  });
}

function cancelRestockForm(id){
  const f = (DB.supplierOrders || []).find(x => x.id === id);
  if(!f) return;
  showConfirm({
    title:   'Cancel this form',
    message: `Discard ${f.reference || f.id} without ordering anything? It stays in the history as cancelled, and the next time something runs low a new form is raised.`,
    okText:  'Cancel form',
    okClass: 'btn-danger',
    icon:    'bx-x-circle',
    onConfirm: async () => {
      f.status      = 'Cancelled';
      f.cancelledAt = new Date().toISOString();
      await saveRestockForm(f);
      closeModal('restock-form-modal');
      rfDraft = null;
      renderInventory();
      logAudit('Inventory', 'Restock form cancelled', f.reference || f.id, '');
      toast('Form cancelled', '');
    }
  });
}

/* Builds the printable document for a form that has been sent. */
function renderRestockDocument(f){
  const lines = rfLinesToOrder(f);

  const urgent = lines.filter(l => l.priority === 'Urgent' || l.priority === 'Out of stock').length;

  document.getElementById('rf-body').innerHTML = `
    <div class="rf-sheet" id="rf-sheet" data-ref="${escHTML(f.reference || f.id)}">

      <header class="rf-head">
        <div class="rf-brand">
          <span class="rf-cookie">🍪</span>
          <div>
            <strong>SugarLoomPh</strong>
            <small>Pinagbuhatan, Pasig City · sugarloomph@gmail.com</small>
          </div>
        </div>
        <div class="rf-ref">
          <span class="rf-ref-label">Restock request</span>
          <strong>${escHTML(f.reference || f.id)}</strong>
          <small>${fmtDateTime(f.date)}</small>
        </div>
      </header>

      <div class="rf-titlebar">
        <h1 class="rf-title">Restock Order Form</h1>
        <div class="rf-summary">
          <span><b>${lines.length}</b> line item${lines.length === 1 ? '' : 's'}</span>
          ${urgent ? `<span class="urgent"><b>${urgent}</b> urgent</span>` : ''}
          <span class="status ${isRestockDraft(f) ? 'open' : ''}">${escHTML(restockStatus(f))}</span>
        </div>
      </div>

      <section class="rf-fill">
        <label>Supplier / Store<span>${escHTML(f.supplier || '')}</span></label>
        <label>Contact Person &amp; Number<span>${escHTML(f.contact || '')}</span></label>
        <label>Required Delivery Date<span>${f.neededBy ? fmtDate(f.neededBy) : ''}</span></label>
      </section>

      <table class="rf-table">
        <thead>
          <tr>
            <th class="col-no">No.</th>
            <th>Ingredient</th>
            <th class="num">On Hand</th>
            <th class="num">Reorder At</th>
            <th class="col-pri">Priority</th>
            <th class="num">Suggested</th>
            <th class="num">Order Qty</th>
            <th class="fill">Received</th>
          </tr>
        </thead>
        <tbody>
          ${lines.map((l, i) => `
            <tr>
              <td class="col-no">${String(i + 1).padStart(2, '0')}</td>
              <td class="item">
                <strong>${escHTML(l.name)}</strong>
                ${l.note ? `<em>${escHTML(l.note)}</em>` : ''}
              </td>
              <td class="num">${l.currentStock == null ? '—' : l.currentStock + '<span class="u">' + escHTML(l.unit || '') + '</span>'}</td>
              <td class="num muted">${l.threshold == null ? '—' : l.threshold + '<span class="u">' + escHTML(l.unit || '') + '</span>'}</td>
              <td class="col-pri">${l.priority === '—' ? '<span class="muted">—</span>' : `<span class="rf-pri ${l.priority === 'Low' ? 'low' : 'urgent'}">${escHTML(l.priority)}</span>`}</td>
              <td class="num muted">${l.suggestedQty}<span class="u">${escHTML(l.unit || '')}</span></td>
              <td class="num strong">${rfOrderQty(l)}<span class="u">${escHTML(l.unit || '')}</span></td>
              <td class="fill"></td>
            </tr>`).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="6" class="foot-label">Total lines to order</td>
            <td class="num strong">${lines.length}</td>
            <td class="fill"></td>
          </tr>
        </tfoot>
      </table>

      <p class="rf-note">
        <b>Note</b> — suggested quantities were calculated from stock on hand against each ingredient's
        reorder point. The order quantities shown were reviewed and confirmed by
        ${escHTML(f.sentBy || 'the administrator')}${f.sentAt ? ' on ' + fmtDateTime(f.sentAt) : ''}.
        Stock is updated when the delivery arrives, not when this form is sent.
      </p>

      <div class="rf-signs">
        <div><span></span><b>Prepared by</b><small>Name &amp; date</small></div>
        <div><span></span><b>Approved by</b><small>Name &amp; date</small></div>
      </div>

      <footer class="rf-foot">
        SugarLoom Ph · Pinagbuhatan, Pasig City · sugarloomph@gmail.com
        <span>${escHTML(f.reference || f.id)}</span>
      </footer>

    </div>`;

  document.getElementById('rf-footer').innerHTML = `
    <button class="btn-ghost" onclick="closeModal('restock-form-modal')">Close</button>
    <button class="btn-primary" onclick="printRestockForm()"><i class='bx bx-printer'></i> Print / Save as PDF</button>`;

  openModal('restock-form-modal');
}

function printRestockForm(){
  const sheet = document.getElementById('rf-sheet');
  if(!sheet) return;
  logAudit('Inventory', 'Restock form printed', sheet.dataset.ref || 'Restock order form', '');
  /* Absolute URL — a relative one would resolve against about:blank in
     the new window and the sheet would print unstyled. */
  const cssHref = new URL('admin.css', location.href).href;

  const w = window.open('', '_blank');
  if(!w){ toast('Allow pop-ups to print the form', 'warning'); return; }

  w.document.write(`<!DOCTYPE html><html><head>
    <title>Restock Order Form</title>
    <link rel="stylesheet" href="${cssHref}">
    <style>body{background:#fff;margin:0;padding:28px;}
           .rf-sheet{max-width:760px;margin:0 auto;}</style>
    </head><body>${sheet.outerHTML}</body></html>`);
  w.document.close();

  /* Wait for the stylesheet and webfont rather than guessing. */
  w.onload = () => {
    const go = () => { w.focus(); w.print(); };
    if(w.document.fonts?.ready) w.document.fonts.ready.then(go).catch(go);
    else setTimeout(go, 300);
  };
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
    logAudit('Inventory', 'Stock adjusted by hand', item.name,
             `${before} → ${item.dailyLimit} units` + (note ? ` · ${note}` : ''));
  } else {
    const item = DB.ingredients.find(i=>i.id===id);
    const before = item.stock;
    if(op==='add')      item.stock = item.stock + amount;
    else if(op==='sub') item.stock = Math.max(0, item.stock - amount);
    else                item.stock = amount;
    logStock({ type, itemId: id, itemName: item.name, unit: item.unit||'units', op, before, after: item.stock, note, ref: 'Manual Adjustment' });
    logAudit('Inventory', 'Stock adjusted by hand', item.name,
             `${before} → ${item.stock} ${item.unit||'units'}` + (note ? ` · ${note}` : ''));
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
  /* Existing rows have no capacity stored — derive one so the slider
     opens on the equivalent of their current absolute threshold. */
  document.getElementById('ing-capacity').value      = ing ? ingCapacity(ing) : '';
  document.getElementById('ing-threshold-pct').value = ing ? ingThresholdPct(ing) : 30;
  document.getElementById('ing-category').value  = ing?.category||'General';
  updateThresholdPreview();
  const roStyle = 'background:var(--bg-2,#f8f9fb);cursor:not-allowed;opacity:0.6;pointer-events:none';
  ['ing-name','ing-unit','ing-category','ing-stock'].forEach(elId => {
    const el = document.getElementById(elId);
    el.disabled = isEdit;
    el.style.cssText = isEdit ? roStyle : '';
  });
  openModal('ingredient-modal');
}

/* Shows what the chosen percentage works out to in real units, so the
   slider isn't an abstraction. */
function updateThresholdPreview(){
  const cap  = parseFloat(document.getElementById('ing-capacity').value) || 0;
  const pct  = parseInt(document.getElementById('ing-threshold-pct').value) || 0;
  const unit = document.getElementById('ing-unit').value;
  const out  = document.getElementById('ing-threshold-readout');
  if(!out) return;
  const qty = Math.round(cap * pct / 100);
  out.innerHTML = cap > 0
    ? `${pct}% &nbsp;<span style="color:var(--text-2);font-weight:500">= ${qty} ${unit}</span>`
    : `${pct}% <span style="color:var(--text-2);font-weight:500">— set a full level</span>`;
}

function saveIngredient(){
  const id    = document.getElementById('ing-id').value;
  const name  = document.getElementById('ing-name').value.trim();
  const unit  = document.getElementById('ing-unit').value;
  const stock = parseFloat(document.getElementById('ing-stock').value);
  const cap   = parseFloat(document.getElementById('ing-capacity').value);
  const pct   = parseInt(document.getElementById('ing-threshold-pct').value);
  const cat   = document.getElementById('ing-category').value;

  if(!name || isNaN(stock)){ toast('Fill all fields','danger'); return; }
  if(isNaN(cap) || cap <= 0){ toast('Set the full stock level','danger'); return; }

  /* threshold is kept in sync as a plain quantity so anything reading it
     directly — reports, exports — still gets a usable number. */
  const fields = {
    name, unit, stock, category: cat,
    capacity:     cap,
    thresholdPct: pct,
    threshold:    Math.round(cap * pct / 100)
  };

  if(id){
    const idx  = DB.ingredients.findIndex(i=>i.id===id);
    const was  = DB.ingredients[idx];
    const moved = was.stock !== stock ? `stock ${was.stock} → ${stock} ${unit}` : '';
    DB.ingredients[idx] = {...was, ...fields};
    logAudit('Inventory', 'Ingredient updated', name,
             [moved, `threshold ${pct}%`].filter(Boolean).join(', '));
    toast('Ingredient updated','success');
  } else {
    DB.ingredients.push({ id:'i'+Date.now(), ...fields });
    logAudit('Inventory', 'Ingredient added', name, `${stock} ${unit} · threshold ${pct}%`);
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
/* ── DATE RANGES ──
   A date input gives back 'YYYY-MM-DD', which `new Date()` reads as UTC
   midnight — an hour or two earlier than local midnight here, so a
   transaction made late in the evening on the From date would fall
   outside its own range. Building the Date from the parts keeps it local,
   and the To bound runs to the end of that day so the day the user picked
   is included. */
function rangeStart(val){
  if(!val) return null;
  const [y,m,d] = val.split('-').map(Number);
  return new Date(y, m-1, d, 0, 0, 0, 0);
}
function rangeEnd(val){
  if(!val) return null;
  const [y,m,d] = val.split('-').map(Number);
  return new Date(y, m-1, d, 23, 59, 59, 999);
}

/* True when the row's date sits inside the range. Either end may be
   blank, and a backwards range (From after To) is read in the order the
   user meant rather than returning nothing. */
function inRange(value, range){
  const t = new Date(value).getTime();
  if(isNaN(t)) return false;
  let from = rangeStart(range.from), to = rangeEnd(range.to);
  if(from && to && from > to){
    const swap = rangeStart(range.to); to = rangeEnd(range.from); from = swap;
  }
  if(from && t < from.getTime()) return false;
  if(to   && t > to.getTime())   return false;
  return true;
}

function rangeIsSet(range){ return !!(range.from || range.to); }

function readRangeInputs(prefix){
  return {
    from: document.getElementById(`${prefix}-from`)?.value || '',
    to:   document.getElementById(`${prefix}-to`)?.value   || ''
  };
}

/* Keeps the two inputs from offering impossible dates in the first
   place — picking a From date pushes the To picker's minimum forward. */
function syncRangeBounds(prefix){
  const f = document.getElementById(`${prefix}-from`);
  const t = document.getElementById(`${prefix}-to`);
  if(f && t){ t.min = f.value || ''; f.max = t.value || ''; }
}

function setReportRange(){
  reportRange = readRangeInputs('rpt');
  syncRangeBounds('rpt');
  renderReports();
}

function clearReportRange(){
  reportRange = { from: '', to: '' };
  ['rpt-from','rpt-to'].forEach(id => {
    const el = document.getElementById(id);
    if(el){ el.value = ''; el.min = ''; el.max = ''; }
  });
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

  /* Run each panel independently. One of these throwing used to take
     the rest of the page down with it — a ReferenceError in the chart
     left Best Sellers and all three history tables showing the previous
     period's data, which looked like wrong numbers rather than a
     crash. */
  [renderRevenueTrend, renderBestSellers, renderTxHistory,
   renderSalesHistoryFiltered, renderIngHistory].forEach(fn => {
    try { fn(txs); }
    catch (err) { console.error(`Reports: ${fn.name} failed —`, err); }
  });
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
  logAudit('Reports', 'Sales history exported', 'Daily sales summary',
           `${rows.length} day${rows.length === 1 ? '' : 's'}`);
  const headers = ['Date','Revenue (₱)','Transactions','Items Sold','Avg. Order Value (₱)','Top Product'];
  const data = rows.map(r=>[r.date, r.revenue, r.transactions, r.itemsSold, r.avg, r.topProduct]);
  const csv = [headers, ...data].map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
  a.download = `sugarloom_sales_history_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

/* ── HISTORY FILTERS ──
   The three history tables each carry their own From–To range, so an
   admin can line up a transaction list against a different stretch of
   ingredient movements without one filter dragging the other along. */
function setHistRange(prefix){
  histRangeState[prefix] = readRangeInputs(prefix);
  syncRangeBounds(prefix);
  renderHistFor(prefix);
}

function clearHistRange(prefix){
  histRangeState[prefix] = { from: '', to: '' };
  [`${prefix}-from`, `${prefix}-to`].forEach(id => {
    const el = document.getElementById(id);
    if(el){ el.value = ''; el.min = ''; el.max = ''; }
  });
  renderHistFor(prefix);
}

function renderHistFor(prefix){
  if(prefix === 'tx')    renderTxHistory();
  if(prefix === 'sales') renderSalesHistoryFiltered();
  if(prefix === 'ing')   renderIngHistory();
}

/* Says what the range left behind, so an empty table reads as "nothing
   happened then" rather than as a broken page. */
function showRangeCount(prefix, shown, total){
  const el = document.getElementById(`${prefix}-range-count`);
  if(!el) return;
  const range = histRangeState[prefix] || {};
  el.textContent = rangeIsSet(range) ? `${shown} of ${total}` : '';
}

function applyRangeFilter(rows, prefix, dateKey){
  const range = histRangeState[prefix] || { from:'', to:'' };
  const out = rangeIsSet(range) ? rows.filter(r => inRange(r[dateKey], range)) : rows;
  showRangeCount(prefix, out.length, rows.length);
  return out;
}

function filterIngHistCat(cat, btn){
  ingHistCat = cat;
  document.querySelectorAll('.ing-hist-cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderIngHistory();
}

function renderIngHistory(){
  if(!DB.stockLog) DB.stockLog = [];
  const filtered = applyRangeFilter(
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
    const low   = ing && isIngLow(ing);
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
  logAudit('Inventory', 'Ingredient history exported', 'Stock movements',
           `${rows.length} row${rows.length === 1 ? '' : 's'}`);
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
  const filtered = applyRangeFilter(
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
  const rows = applyRangeFilter(all, 'sales', 'date');
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
  if(!rangeIsSet(reportRange)) return DB.transactions;
  return DB.transactions.filter(t => inRange(t.date, reportRange));
}

/* Buckets revenue across whatever range the admin picked. The old chart
   had three fixed shapes because there were only three buttons; a free
   range needs the x-axis to follow it, so the bucket size is chosen from
   how long the range is: a single day splits into three-hour slots, a
   few weeks into days, a few months into weeks, longer into months. The
   aim is a readable number of points rather than one per day of a year.

   With no range set, the chart covers the span the transactions
   themselves occupy, so the page still shows a trend on first open. */
function txRevenue(t){ return t.items.reduce((s,i)=>s+(i.qty*(i.price||0)),0); }

function bucketRevenue(txs, range){
  const times = txs.map(t => new Date(t.date).getTime()).filter(n => !isNaN(n));

  let from = rangeStart(range.from);
  let to   = rangeEnd(range.to);
  if(from && to && from > to){ const s = rangeStart(range.to); to = rangeEnd(range.from); from = s; }

  /* Fill in an open end from the data, falling back to the last week so
     an empty range on an empty database still draws an axis. */
  if(!from) from = new Date(times.length ? Math.min(...times) : Date.now() - 6*86400000);
  if(!to)   to   = new Date(times.length ? Math.max(...times) : Date.now());
  if(from > to) from = new Date(to);

  const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.floor((startOfDay(to) - startOfDay(from)) / 86400000) + 1;

  const labels = [], slots = [], edges = [];
  const push = (label, start, end) => { labels.push(label); slots.push(0); edges.push([start.getTime(), end.getTime()]); };

  if(days <= 1){
    const base = startOfDay(from);
    const names = ['12am–3am','3am–6am','6am–9am','9am–12pm','12pm–3pm','3pm–6pm','6pm–9pm','9pm–12am'];
    names.forEach((name, i) => {
      const s = new Date(base); s.setHours(i*3);
      const e = new Date(base); e.setHours(i*3+3);
      push(name, s, e);
    });
  } else if(days <= 31){
    for(let i = 0; i < days; i++){
      const s = new Date(startOfDay(from)); s.setDate(s.getDate()+i);
      const e = new Date(s); e.setDate(e.getDate()+1);
      push(s.toLocaleDateString('en',{month:'short',day:'numeric'}), s, e);
    }
  } else if(days <= 182){
    for(let s = startOfDay(from); s <= to; ){
      const e = new Date(s); e.setDate(e.getDate()+7);
      push(s.toLocaleDateString('en',{month:'short',day:'numeric'}), s, e);
      s = e;
    }
  } else {
    for(let s = new Date(from.getFullYear(), from.getMonth(), 1); s <= to; ){
      const e = new Date(s.getFullYear(), s.getMonth()+1, 1);
      push(s.toLocaleDateString('en',{month:'short',year:'2-digit'}), s, e);
      s = e;
    }
  }

  txs.forEach(t => {
    const ms = new Date(t.date).getTime();
    if(isNaN(ms)) return;
    const i = edges.findIndex(([s,e]) => ms >= s && ms < e);
    if(i >= 0) slots[i] += txRevenue(t);
    else if(ms >= edges[edges.length-1]?.[1]) slots[slots.length-1] += txRevenue(t); // the final bucket's own end
  });

  return { labels, slots };
}

let revenueTrendChart = null;
function renderRevenueTrend(txs){
  const { labels, slots } = bucketRevenue(txs, reportRange);
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
  logAudit('Reports', 'Transactions exported', 'Transaction history',
           `${txs.length} row${txs.length === 1 ? '' : 's'}` +
           (rangeIsSet(reportRange) ? ` · ${reportRange.from || 'start'} to ${reportRange.to || 'today'}` : ' · all time'));
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
            <div class="product-name">${escHTML(c.name)}</div>
          </div>
        </td>
        <td>${escHTML(c.email)}</td>
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
  logRead('Customers', 'Customer record viewed', email, 'Name, phone, address and order history');
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
  logRead('Customers', 'Customer reviews viewed', email, '');
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

  /* Only a Super Admin can hand out, or take away, the role that reads
     the audit trail. An administrator who could promote themselves could
     also quietly clear their own record. */
  if(u && u.role === 'Super Admin' && !isSuperAdmin()){
    toast('Only a Super Admin can edit a Super Admin account','danger');
    return;
  }
  const superOpt = document.getElementById('um-role-super');
  if(superOpt) superOpt.hidden = !isSuperAdmin();

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

async function saveUser(){
  const id    = document.getElementById('um-id').value;
  const fname = document.getElementById('um-fname').value.trim();
  const lname = document.getElementById('um-lname').value.trim();
  const email = document.getElementById('um-email').value.trim();
  const pw    = document.getElementById('um-password').value;
  const role  = document.getElementById('um-role').value;
  if(!fname||!lname||!email){ toast('Fill required fields','danger'); return; }
  if(!id && !pw){ toast('Password required for new user','danger'); return; }
  if(role === 'Super Admin' && !isSuperAdmin()){
    toast('Only a Super Admin can grant the Super Admin role','danger'); return;
  }
  if(id){
    const idx = DB.users.findIndex(u=>u.id===id);
    const was = DB.users[idx];
    if(was.role === 'Super Admin' && role !== 'Super Admin' && lastActiveSuperAdmin(was)){
      toast('This is the only Super Admin — give someone else the role first','danger'); return;
    }
    DB.users[idx] = {...was, fname, lname, email, role};
    if(pw) await setUserPassword(DB.users[idx], pw);   // blank means keep the current one

    const changes = [];
    if(was.role !== role)   changes.push(`role ${was.role} → ${role}`);
    if(was.email !== email) changes.push(`email ${was.email} → ${email}`);
    if(`${was.fname} ${was.lname}` !== `${fname} ${lname}`) changes.push('name changed');
    if(pw) changes.push('password reset');
    logAudit('Users', 'Account updated', `${fname} ${lname}`,
             changes.length ? changes.join(', ') : 'no change');
    toast('User updated','success');
  } else {
    if(DB.users.find(u=>u.email===email)){ toast('Email already exists','danger'); return; }
    const user = {id:'u'+Date.now(), fname, lname, email, role, active:true};
    await setUserPassword(user, pw);
    DB.users.push(user);
    logAudit('Users', 'Account created', `${fname} ${lname}`, `${role} · ${email}`);
    toast('User added','success');
  }
  saveDB(); closeModal('user-modal'); renderUsers();
}

/* True when this is the last Super Admin still able to sign in. Losing
   the role entirely would leave the audit trail unreadable by anyone. */
function lastActiveSuperAdmin(u){
  return DB.users.filter(x => x.role === 'Super Admin' && x.active && x.id !== u.id).length === 0;
}

function toggleUser(id){
  const u = DB.users.find(uu=>uu.id===id);
  if(!u) return;
  const deactivating = u.active;
  if(u.role === 'Super Admin' && !isSuperAdmin()){
    toast('Only a Super Admin can deactivate a Super Admin account','danger'); return;
  }
  if(deactivating && u.role === 'Super Admin' && lastActiveSuperAdmin(u)){
    toast('This is the only active Super Admin — nobody could read the audit trail','danger'); return;
  }
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
      logAudit('Users', u.active ? 'Account activated' : 'Account deactivated',
               `${u.fname} ${u.lname}`, u.role);
      toast(u.active ? 'User activated' : 'User deactivated', u.active ? 'success' : '');
    }
  });
}

/* =============================================
   AUDIT TRAIL

   An append-only record of who did what. Rows go straight to Supabase
   rather than through saveDB(), which upserts whole tables from memory —
   an entry the next save can rewrite is not an audit entry. Nothing in
   the panel edits or deletes them, and only a Super Admin can read them.

   A failed write is reported to the console but never blocks the action
   being recorded: losing a line of the log is better than losing the
   order it describes.
   ============================================= */
let auditRange = { from: '', to: '' };

/* Set once if the table is missing, so a database that has not had
   supabase-schema.sql run against it yet degrades to an empty log with
   an explanation instead of a console full of 404s. */
let auditUnavailable = false;

async function logAudit(area, action, entity, detail){
  const a = currentUser || {};
  const entry = {
    id:         'AU-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    at:         new Date().toISOString(),
    area:       area   || 'Other',        // 'Orders'
    action:     action || '',             // 'Status changed'
    entity:     entity || '',             // 'SL-1024 — Maria Santos'
    detail:     detail || '',             // 'Pending → Confirmed'
    actorId:    a.id    || '—',
    actorName:  `${a.fname || 'Unknown'} ${a.lname || ''}`.trim(),
    actorRole:  a.role  || '—',
    actorEmail: a.email || ''
  };

  if(!DB.auditLog) DB.auditLog = [];
  DB.auditLog.unshift(entry);
  if(document.getElementById('view-audit')?.classList.contains('active')) renderAudit();

  if(auditUnavailable) return;
  const { error } = await _supa.from('audit_log')
    .insert({ id: entry.id, date: entry.at, data: entry });
  if(error){
    if(error.code === 'PGRST205' || /does not exist/i.test(error.message || '')) auditUnavailable = true;
    console.error('audit write failed:', error);
  }
}

/* ── READ EVENTS ──
   Changes are the obvious thing to record, but who *looked* is the other
   half of a trail. A customer's address and phone number can be read
   without anything being modified, and an export takes the data out of
   the system altogether — neither leaves a mark if only writes are
   logged.

   Not every read, though. Rendering a list is not an access decision,
   and a line per render would bury the entries that matter under
   thousands that do not. What is recorded is someone deliberately
   opening one record, or taking data out. Reopening the same record is
   folded together for READ_WINDOW_MS, so working an order through the
   queue does not write a line every time it is looked at.

   Exports are never folded: each one is a separate copy of the data
   leaving, and that is exactly the thing worth counting. */
const READ_WINDOW_MS = 10 * 60 * 1000;
const _readSeen = new Map();

function logRead(area, action, entity, detail){
  const key  = `${(currentUser || {}).id}|${area}|${action}|${entity}`;
  const now  = Date.now();
  const last = _readSeen.get(key);
  if(last && now - last < READ_WINDOW_MS) return;
  _readSeen.set(key, now);
  return logAudit(area, action, entity, detail);
}

/* ── RETENTION ──
   How long entries are kept. The panel cannot enforce this itself, by
   design: audit_log grants insert and select and nothing else, so the
   browser has no way to delete a row. Enforcement belongs to the
   database, where supabase-audit-log.sql installs a scheduled purge.

   What the panel does is state the policy and say when something is
   past it, so a trail that has quietly stopped being purged shows up
   rather than being assumed. */
const AUDIT_RETENTION_DAYS = 365;

function auditRetentionCutoff(){
  const d = new Date();
  d.setDate(d.getDate() - AUDIT_RETENTION_DAYS);
  return d;
}

/* Re-read from Supabase when the view is opened, so a Super Admin sees
   what other staff have done since the page was loaded — the log is the
   one view where stale data would defeat the purpose. */
async function refreshAudit(){
  logRead('Access', 'Audit trail viewed', 'Activity log', '');
  if(!auditUnavailable){
    const { data, error } = await _supa.from('audit_log')
      .select('date, data').order('date', { ascending: false }).limit(500);
    if(error){
      if(error.code === 'PGRST205' || /does not exist/i.test(error.message || '')) auditUnavailable = true;
      console.error('audit read failed:', error);
    } else if(data){
      /* The row's own date column is the fallback for `at`. The table
         cannot be edited to repair a row written without one, so the
         reader has to cope — a row with no timestamp otherwise shows
         as "Invalid Date" and counts as nothing. */
      DB.auditLog = data
        .filter(r => r.data)
        .map(r => ({ ...r.data, at: r.data.at || r.date }));
    }
  }
  renderAudit();
}

function setAuditRange(){
  auditRange = readRangeInputs('audit');
  syncRangeBounds('audit');
  renderAudit();
}

function clearAuditRange(){
  auditRange = { from: '', to: '' };
  ['audit-from','audit-to'].forEach(id => {
    const el = document.getElementById(id);
    if(el){ el.value = ''; el.min = ''; el.max = ''; }
  });
  renderAudit();
}

function auditFiltered(){
  let rows = [...(DB.auditLog || [])].sort((a, b) => new Date(b.at) - new Date(a.at));
  if(rangeIsSet(auditRange)) rows = rows.filter(r => inRange(r.at, auditRange));

  const role = document.getElementById('audit-role')?.value || 'All';
  if(role !== 'All') rows = rows.filter(r => r.actorRole === role);

  const area = document.getElementById('audit-area')?.value || 'All';
  if(area !== 'All') rows = rows.filter(r => r.area === area);

  const q = (document.getElementById('audit-search')?.value || '').trim().toLowerCase();
  if(q) rows = rows.filter(r =>
    [r.action, r.entity, r.detail, r.actorName, r.actorRole, r.area]
      .join(' ').toLowerCase().includes(q));

  return rows;
}

function renderAudit(){
  const body = document.getElementById('audit-body');
  if(!body) return;

  const all  = DB.auditLog || [];
  const rows = auditFiltered();
  const today = new Date().toDateString();

  document.getElementById('audit-total').textContent    = all.length;
  document.getElementById('audit-today').textContent    = all.filter(r => new Date(r.at).toDateString() === today).length;
  /* Identify people by id where there is one, by name otherwise, so a
     row written without an id still counts as somebody. */
  document.getElementById('audit-actors').textContent   =
    new Set(all.map(r => r.actorId || r.actorName).filter(x => x && x !== '—')).size;
  document.getElementById('audit-failures').textContent = all.filter(r => r.action === 'Sign-in rejected').length;

  const count = document.getElementById('audit-range-count');
  if(count) count.textContent = rows.length === all.length ? '' : `${rows.length} of ${all.length}`;

  if(auditUnavailable && !all.length){
    body.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:22px;color:var(--text-2)">
      The audit_log table is not in this Supabase project yet. Run <strong>supabase-schema.sql</strong>
      in the SQL editor and reopen this page — actions taken before then are not recorded.</td></tr>`;
    return;
  }

  if(!rows.length){
    body.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:22px;color:var(--text-2)">
      ${all.length ? 'Nothing recorded in this range.' : 'Nothing recorded yet.'}</td></tr>`;
    return;
  }

  renderAuditRetention(all);

  body.innerHTML = rows.map(r => `
    <tr>
      <td style="white-space:nowrap">${isNaN(new Date(r.at)) ? '<span style="color:var(--text-3)">—</span>' : fmtDateTime(r.at)}</td>
      <td class="fw-bold">${escHTML(r.actorName || '—')}</td>
      <td><span class="pill ${auditRolePill(r.actorRole)}">${escHTML(r.actorRole || '—')}</span></td>
      <td>${escHTML(r.area || '—')}</td>
      <td>${escHTML(r.action || '—')}</td>
      <td style="color:var(--text-2)">
        ${r.entity ? `<span style="color:var(--text)">${escHTML(r.entity)}</span>` : ''}
        ${r.entity && r.detail ? ' — ' : ''}${escHTML(r.detail || '')}
      </td>
    </tr>`).join('');
}

/* States the retention policy, and flags a purge that is not running.
   Entries older than the policy are not an error in themselves — the
   scheduled job runs once a day — but a growing pile of them means it
   has stopped, and silence about that is how a retention policy becomes
   a sentence in a document rather than something that happens. */
function renderAuditRetention(all){
  const el = document.getElementById('audit-retention');
  if(!el) return;

  const cutoff = auditRetentionCutoff();
  const dated  = all.map(r => new Date(r.at)).filter(d => !isNaN(d));
  const oldest = dated.length ? new Date(Math.min(...dated)) : null;
  const stale  = dated.filter(d => d < cutoff).length;

  const months = Math.round(AUDIT_RETENTION_DAYS / 30);
  el.innerHTML = `
    <i class='bx bx-shield-quarter'></i>
    <span>
      Kept for <strong>${AUDIT_RETENTION_DAYS} days</strong> (about ${months} months), then purged by the
      database on a daily schedule. The panel cannot delete an entry, which is why the purge lives there.
      ${oldest ? `Oldest entry held: <strong>${fmtDate(oldest)}</strong>.` : ''}
    </span>
    ${stale ? `<span class="audit-retention-warn">${stale} entr${stale === 1 ? 'y is' : 'ies are'} past retention —
       the scheduled purge may not be running. See supabase-audit-log.sql.</span>` : ''}`;
  el.classList.toggle('overdue', stale > 0);
}

function auditRolePill(role){
  if(role === 'Super Admin')   return 'cancelled';
  if(role === 'Administrator') return 'confirmed';
  if(role === 'Baker')         return 'preparing';
  if(role === 'Packer')        return 'active';
  return '';
}

function exportAuditCSV(){
  const rows = auditFiltered();
  if(!rows.length){ toast('Nothing to export for this filter', ''); return; }
  logAudit('Access', 'Audit trail exported', 'Activity log',
           `${rows.length} entr${rows.length === 1 ? 'y' : 'ies'}`);

  const headers = ['When','Who','Role','Email','Area','Action','Item','Details'];
  const data = rows.map(r => [fmtDateTime(r.at), r.actorName, r.actorRole, r.actorEmail,
                              r.area, r.action, r.entity, r.detail]);
  const csv = [headers, ...data]
    .map(line => line.map(c => '"' + String(c == null ? '' : c).replace(/"/g,'""') + '"').join(','))
    .join('\n');

  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = `sugarloom_audit_trail_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

/* =============================================
   NOTIFICATIONS & BADGES
   ============================================= */
function getLowStockItems(){
  const lowP = DB.products.filter(p => p.active && Math.max(0,(p.dailyLimit||0)-(p.soldToday||0)) <= (p.threshold||0));
  const lowI = DB.ingredients.filter(isIngLow);
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
    notifList.push({ id, view:'inventory', icon:'bx-error-circle', color:'#DC2626',
      text:`Near daily limit: ${p.name} (${remaining} left today)`,
      action(){ switchView('inventory'); document.getElementById('notif-panel').classList.add('hidden'); }
    });
  });

  // Low stock ingredients
  DB.ingredients.filter(isIngLow).forEach(ing=>{
    const id = `ingredient_${ing.id||ing.name}`;
    if(seen.has(id)) return;
    notifList.push({ id, view:'inventory', icon:'bx-error-circle', color:'#EA580C',
      text:`Low stock ingredient: ${ing.name} (${ing.stock} left)`,
      action(){ switchView('inventory'); document.getElementById('notif-panel').classList.add('hidden'); }
    });
  });

  // Restock drafts waiting to be reviewed and sent
  (DB.supplierOrders || []).filter(isRestockDraft).forEach(f => {
    const id = `restock_${f.id}`;
    if(seen.has(id)) return;
    const names = formLines(f).map(l => l.name);
    notifList.push({ id, view:'inventory', icon:'bx-cart-add', color:'#EA580C',
      text:`Restock form ${escHTML(f.reference || f.id)} is waiting for your review — ${escHTML(names.slice(0,3).join(', '))}${names.length > 3 ? ` +${names.length - 3} more` : ''}`,
      action(){ switchView('inventory'); document.getElementById('notif-panel').classList.add('hidden'); setTimeout(()=>viewRestockForm(f.id), 200); }
    });
  });

  /* Orders approaching, or past, the day they were promised and still
     not finished. The id carries the urgency, so dismissing "due
     tomorrow" does not also silence "due today" and then "late" — each
     step is a new warning rather than one the admin already waved
     away. */
  DB.orders.filter(o => !o.archived).forEach(o => {
    const due = deliveryUrgency(o);
    if(!due) return;
    const id = `due_${due.key}_${o.id}`;
    if(seen.has(id)) return;
    const late = due.key === 'late';
    notifList.push({ id, view:'orders',
      icon: late ? 'bx-error' : 'bx-time-five',
      color: late ? '#DC2626' : due.key === 'today' ? '#EA580C' : '#D97706',
      text: late
        ? `Order ${o.id} for ${escHTML(o.customer || 'a customer')} was due ${fmtDate(o.preferredDate)} and is still ${escHTML(o.status)}`
        : `Order ${o.id} for ${escHTML(o.customer || 'a customer')} is due ${due.key === 'today' ? 'today' : 'tomorrow'} and is still ${escHTML(o.status)}`,
      action(){ switchView('orders'); setTimeout(()=>openOrderModal(o.id, true),150); document.getElementById('notif-panel').classList.add('hidden'); }
    });
  });

  // Cancel requests from buyers
  DB.orders.filter(o=>o.status==='Cancel Requested'&&!o.archived).forEach(o=>{
    const id = `cancel_req_${o.id}`;
    if(seen.has(id)) return;
    notifList.push({ id, view:'orders', icon:'bx-x-circle', color:'#DC2626',
      text:`Cancel request for order ${o.id} from ${escHTML(o.customer)}${o.cancelReason ? ' — "'+o.cancelReason+'"' : ''}`,
      action(){ switchView('orders'); setTimeout(()=>openOrderModal(o.id),150); document.getElementById('notif-panel').classList.add('hidden'); }
    });
  });

  // New (Pending) orders
  DB.orders.filter(o=>o.status==='Pending'&&!o.archived).forEach(o=>{
    const id = `order_${o.id}`;
    if(seen.has(id)) return;
    notifList.push({ id, view:'orders', icon:'bx-shopping-bag', color:'#2563EB',
      text:`New order ${o.id} from ${escHTML(o.customer)}`,
      action(){ switchView('orders'); setTimeout(()=>openOrderModal(o.id),150); document.getElementById('notif-panel').classList.add('hidden'); }
    });
  });

  // Confirmed orders — need to be prepared
  DB.orders.filter(o=>o.status==='Confirmed'&&!o.archived).forEach(o=>{
    const id = `prepare_${o.id}`;
    if(seen.has(id)) return;
    notifList.push({ id, view:'orders', icon:'bx-dish', color:'#D97706',
      text:`Order ${o.id} from ${escHTML(o.customer)} needs to be prepared`,
      action(){ switchView('orders'); setTimeout(()=>openOrderModal(o.id),150); document.getElementById('notif-panel').classList.add('hidden'); }
    });
  });

  const allTracking = _trackingCache;

  // Orders ready to be packed
  DB.orders.filter(o=>o.status==='Ready for Packing'&&!o.archived).forEach(o=>{
    const id = `ready_pack_${o.id}`;
    if(seen.has(id)) return;
    notifList.push({ id, view:'orders', icon:'bx-package', color:'#7C3AED',
      text:`Order ${o.id} from ${escHTML(o.customer)} is ready to be packed`,
      action(){ switchView('orders'); setTimeout(()=>openOrderModal(o.id, true),150); document.getElementById('notif-panel').classList.add('hidden'); }
    });
  });

  // Orders currently being packed — packed, waiting for Ready for Book
  DB.orders.filter(o=>o.status==='Preparing'&&!o.archived&&o.preparingSubStatus==='packed'&&!allTracking[o.id]).forEach(o=>{
    const id = `packed_${o.id}`;
    if(seen.has(id)) return;
    notifList.push({ id, view:'orders', icon:'bx-box', color:'#0891B2',
      text:`Order ${o.id} from ${escHTML(o.customer)} is packed — mark ready for Lalamove`,
      action(){ switchView('orders'); setTimeout(()=>openOrderModal(o.id),150); document.getElementById('notif-panel').classList.add('hidden'); }
    });
  });

  // Orders ready to book Lalamove (readyForBook sub-status only)
  DB.orders.filter(o=>o.status==='Preparing'&&!o.archived&&o.preparingSubStatus==='readyForBook'&&!allTracking[o.id]).forEach(o=>{
    const id = `ready_book_${o.id}`;
    if(seen.has(id)) return;
    notifList.push({ id, view:'orders', icon:'bx-map', color:'#16A34A',
      text:`Order ${o.id} from ${escHTML(o.customer)} is ready to book Lalamove`,
      action(){ switchView('orders'); setTimeout(()=>openOrderModal(o.id),150); document.getElementById('notif-panel').classList.add('hidden'); }
    });
  });

  // Delivery completed — needs Mark Fulfilled (Preparing + tracking COMPLETED)
  DB.orders.filter(o=>o.status==='Preparing'&&!o.archived).forEach(o=>{
    const t = allTracking[o.id];
    if(!t || t.status!=='COMPLETED') return;
    const id = `delivered_${o.id}`;
    if(seen.has(id)) return;
    notifList.push({ id, view:'orders', icon:'bx-check-circle', color:'#6366F1',
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
      notifList.push({ id, view:'customers', icon:'bx-star', color:'#f59e0b',
        text:`${name} left a ${r.rating}★ review — "${r.comment}"`,
        action(){ switchView('customers'); document.getElementById('notif-panel').classList.add('hidden'); setTimeout(()=>viewCustomerReviews(u.email), 150); }
      });
    });
  });

  /* Every notification opens a view, so a role is only told about things
     it can actually go and deal with. A Super Admin was being offered
     restock forms and new orders — tapping one took them nowhere,
     because switchView sends them back to a view they are allowed. A
     notification you cannot act on is not information, it is noise. */
  notifList = notifList.filter(n => !n.view || canView(n.view));
}

function updateBadges(){
  // Unread message count, so new enquiries are visible without opening the tab
  if(!_inquiries.length) loadInquiries().then(updateInquiryBadge);
  else updateInquiryBadge();

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
  if(lb) lb.style.display = (low && canView('inventory')) ? '' : 'none';

  /* This counts pending orders, so it belongs to whoever works the
     order queue. On the Super Admin's Customers tab it was a number
     about something they cannot open. */
  const custPending = DB.orders.filter(o => o.status === 'Pending' && !o.archived).length;
  const cpb = document.getElementById('cust-pending-badge');
  if(cpb){
    cpb.textContent = custPending;
    cpb.style.display = (custPending && canView('orders')) ? '' : 'none';
  }

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
   MESSAGES (contact form enquiries)
   ============================================= */
let _inquiries = [];
let _inqFilter = 'new';

async function loadInquiries(){
  try {
    const { data, error } = await _supa.from('inquiries').select('id, date, data').order('date', { ascending: false });
    if(error) throw error;
    _inquiries = (data || []).map(r => ({ id: r.id, date: r.date, ...(r.data || {}) }));
  } catch(err){
    console.error('Could not load messages:', err);
    _inquiries = [];
  }
}

function filterInquiries(f){
  _inqFilter = f;
  ['new','done','all'].forEach(x => document.getElementById('inq-tab-'+x)?.classList.toggle('active', x === f));
  renderInquiries(true);
}

async function renderInquiries(skipFetch){
  if(!skipFetch) await loadInquiries();

  const list = _inquiries.filter(i =>
    _inqFilter === 'all'  ? true :
    _inqFilter === 'done' ? i.handled : !i.handled
  );

  const box = document.getElementById('inquiries-list');
  if(!list.length){
    box.innerHTML = `<div class="card" style="text-align:center;padding:48px;color:var(--text-2)">No ${_inqFilter === 'all' ? '' : _inqFilter + ' '}messages</div>`;
    updateInquiryBadge();
    return;
  }

  box.innerHTML = list.map(i => `
    <div class="card" style="margin-bottom:12px;padding:18px 22px">
      <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:4px">
            <span style="font-weight:700;font-size:14px">${escHTML(i.name)}</span>
            <span class="pill ${i.handled ? 'fulfilled' : 'pending'}">${i.handled ? 'Handled' : 'New'}</span>
            <span style="font-size:11px;color:var(--text-2)">${fmtDateTime(i.date)}</span>
          </div>
          <div style="font-size:12px;color:var(--text-2);margin-bottom:8px">${escHTML(i.contact)}</div>
          <p style="font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap">${escHTML(i.message)}</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0">
          ${/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.contact || '')
            ? `<a class="btn-secondary sm" href="mailto:${escHTML(i.contact)}?subject=Re:%20your%20message%20to%20SugarLoom%20Ph"><i class='bx bx-reply'></i> Reply</a>` : ''}
          <button class="btn-secondary sm" onclick="toggleInquiryHandled('${i.id}')">
            ${i.handled ? 'Mark as new' : 'Mark handled'}
          </button>
          <button class="btn-icon danger" onclick="deleteInquiry('${i.id}')" title="Delete"><i class='bx bx-trash'></i></button>
        </div>
      </div>
    </div>`).join('');

  updateInquiryBadge();
}

async function toggleInquiryHandled(id){
  const i = _inquiries.find(x => x.id === id);
  if(!i) return;
  i.handled = !i.handled;
  const { error } = await _supa.from('inquiries')
    .update({ data: { name: i.name, contact: i.contact, message: i.message, handled: i.handled } })
    .eq('id', id);
  if(error){
    i.handled = !i.handled;                 // put it back, the save did not stick
    console.error('could not update message:', error);
    toast('Could not save that change', 'danger');
  }
  renderInquiries(true);
}

function deleteInquiry(id){
  showConfirm({
    title: 'Delete message',
    message: 'Delete this message for good? This cannot be undone.',
    okText: 'Delete',
    icon: 'bx-trash',
    onConfirm: async () => {
      const { error } = await _supa.from('inquiries').delete().eq('id', id);
      if(error){
        console.error('could not delete message:', error);
        toast('Could not delete: ' + error.message, 'danger');
        return;
      }
      _inquiries = _inquiries.filter(x => x.id !== id);
      renderInquiries(true);
      toast('Message deleted', 'success');
    }
  });
}

function updateInquiryBadge(){
  const badge = document.getElementById('inq-badge');
  if(!badge) return;
  const n = _inquiries.filter(i => !i.handled).length;
  badge.textContent = n;
  badge.style.display = n ? '' : 'none';
}

/* =============================================
   BOOT
   ============================================= */
document.addEventListener('DOMContentLoaded', async ()=>{
  await initDB();
  checkLogin();
  document.getElementById('login-password')?.addEventListener('keydown', e=>{ if(e.key==='Enter') adminLogin(); });
});
