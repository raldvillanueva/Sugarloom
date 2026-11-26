/* ── stock.js — what is left to sell today ────────────────────────
   One rule, shared by the shop, the product page, the cart and
   checkout, so the four cannot disagree about whether something can
   still be ordered.

   The admin panel counts a product's day in two fields: dailyLimit is
   how many can be made, soldToday how many are spoken for. The shop
   used to ignore both — products.js dropped them when it mapped the
   rows — so a product with nothing left still went in the basket and
   straight through checkout, and the baker found out afterwards. */

/* There was also a ceiling on the NUMBER of orders one day would take,
   whatever was in them — loadOrderCap() and ordersBookedFor(), read
   from app_settings. It is gone: the capstone documentation describes
   the per-product limits and nothing else, and the shop should not
   turn an order away for a reason the paper cannot account for. What
   remains below limits how much of each product a day can carry,
   which is the rule that was written down. */

/* ── How much of today is already spoken for ──────────────────────
   soldToday cannot answer this. It is only ever incremented inside
   syncStoreOrders(), which runs in the ADMIN's browser and only for
   orders being delivered the same day — so it does not move at all
   until somebody opens the panel, and never for a pre-order. A shop
   that took ten COD orders overnight still reads soldToday: 0 in the
   morning, and every one of those customers was told the product was
   available.

   Counting the orders themselves is the only number that is true
   without anybody being logged in. */

/* Local calendar date, deliberately not toISOString().slice(0,10).
   "November 6, 2026" parses as local midnight, and converting that to
   UTC moves it to the 5th anywhere east of Greenwich — Manila is
   UTC+8, so every delivery date would land a day early and today's
   orders would be counted against yesterday. */
function localDay(d){
  return d.getFullYear() + '-' +
         String(d.getMonth() + 1).padStart(2, '0') + '-' +
         String(d.getDate()).padStart(2, '0');
}

/* Supabase stores preferredDate as text the admin typed, like
   "November 6, 2026", so it is parsed rather than compared. */
function orderDeliveryDay(order){
  const raw = order && order.preferredDate;
  if(!raw) return null;
  const d = new Date(raw);
  return isNaN(d) ? null : localDay(d);
}

/* A cancelled order gives its capacity back; everything else is a
   commitment, including one already delivered — it still used up part
   of what could be baked that day. */
function commitsStock(order){
  return (order.status || 'Pending') !== 'Cancelled';
}

/* { "Fudge Brownies": 6, ... } for one delivery day. */
function committedForDay(orders, isoDay){
  const out = {};
  (orders || []).forEach(o => {
    if(!commitsStock(o)) return;
    if(orderDeliveryDay(o) !== isoDay) return;
    (o.items || []).forEach(it => {
      if(!it || !it.name) return;
      out[it.name] = (out[it.name] || 0) + (Number(it.qty) || 1);
    });
  });
  return out;
}

function todayISO(){
  return localDay(new Date());
}

/* Reads the live commitments. Returns null when it cannot, so the
   caller can fall back to soldToday rather than showing an empty shop
   because one query failed. */
async function loadCommitted(supa, isoDay){
  try {
    /* Three fields, not the whole order. This asked for `data` — the
       entire jsonb of every order, including the base64 GCash receipt
       attached to each one — and ran on the products page, the product
       page, the cart and checkout. 1.8 MB per page view to count how
       many cookies are spoken for.

       committedForDay reads status, items and preferredDate and
       nothing else, so that is what is fetched: the same answer for a
       fraction of a percent of the bytes. */
    const { data, error } = await supa.from('orders')
      .select('status,data->items,data->preferredDate');
    if(error || !data) return null;
    const orders = data.map(r => ({
      status:        r.status,
      items:         r.items || [],
      preferredDate: r.preferredDate
    }));
    return committedForDay(orders, isoDay || todayISO());
  } catch(e){
    console.warn('could not read committed stock:', e);
    return null;
  }
}

/* ── Low stock takes a product off the shelf ──────────────────────
   Not only sold out. A COD order cannot be refused at the door the
   way an unpaid GCash one can be rejected, so the shop needs slack
   between "the last few are going" and "we cannot make this". The
   product's own threshold is that slack: the admin already sets it
   per product for the reorder warnings, and the panel already calls
   that number "low", so there is one definition rather than two.

   A product with no threshold hides only at zero, which is the old
   behaviour. */
function hideThreshold(p){
  const t = Number(p && p.threshold);
  return Number.isFinite(t) && t > 0 ? t : 0;
}

/* ── What notice is worth ─────────────────────────────────────────
   dailyLimit is how much of a product can be made in a day, so a
   delivery date reached with days to spare is not worth one day's
   baking — it is worth every day the shop has to bake into it. Three
   days' warning on a 50-a-day product is 150, because fifty can be
   made on each of them and brownies keep.

   That is what lets a sixty-piece order through on a fifty-a-day
   product, which is the ordinary bulk order this shop wants, while
   still capping the date: the fifty-first person booking the same
   Friday is refused rather than silently added to a pile nobody
   sees until Thursday night.

   Capped at a week so a booking made months out does not read as
   unlimited capacity. Today and tomorrow are worth one day: nothing
   can be baked in advance for them. */
const MAX_LEAD_DAYS = 7;

function capacityFor(limit, leadDays){
  const d = Math.max(1, Math.min(MAX_LEAD_DAYS, Math.floor(Number(leadDays) || 0)));
  return limit * d;
}

/* Whole days between today and a delivery date, local calendar. */
function leadDaysUntil(isoDay){
  if(!isoDay) return 0;
  const target = new Date(isoDay + 'T00:00:00');
  const today  = new Date(todayISO() + 'T00:00:00');
  if(isNaN(target)) return 0;
  return Math.max(0, Math.round((target - today) / 86400000));
}

/* ── BULK ORDERS ──────────────────────────────────────────────────
   How many pieces an order is, counted across every line: thirty
   cookies is a bulk order whether it arrived as one line of thirty or
   five lines of six.

   This lives here, not in the admin panel, because both sides need
   the same answer. The panel groups bulk orders into their own tab;
   checkout refuses Cash on Delivery on them. Two definitions would
   mean an order the panel calls bulk and the shop lets through on
   COD, which is the exact gap this closes.

   The threshold is the shop's, stored in app_settings and loaded by
   whoever needs it. Until it is loaded the default stands. */
const BULK_DEFAULT_THRESHOLD = 30;
let bulkThreshold = BULK_DEFAULT_THRESHOLD;

/* Clamped at both ends. One would make every order bulk; nothing
   sensible is above a few hundred pieces. */
function clampBulkThreshold(n){
  const v = Math.round(Number(n));
  if(!Number.isFinite(v)) return BULK_DEFAULT_THRESHOLD;
  return Math.max(2, Math.min(500, v));
}

function applyBulkThreshold(n){
  bulkThreshold = clampBulkThreshold(n);
  return bulkThreshold;
}

/* Takes an order ({items:[…]}) or a bare cart array, since checkout
   has the one and the panel has the other. */
function orderPieces(o){
  const items = Array.isArray(o) ? o
              : (o && Array.isArray(o.items) ? o.items : []);
  return items.reduce((n, it) => n + (Number(it && it.qty) || 1), 0);
}

function isBulkOrder(o){
  return orderPieces(o) >= bulkThreshold;
}

/* Read once per page. A failure leaves the default standing rather
   than the page inventing a policy. */
async function loadBulkThreshold(supa){
  try {
    const { data, error } = await supa.from('app_settings')
      .select('data').eq('id', 'orders').maybeSingle();
    if(error) throw error;
    if(data?.data?.bulkThreshold) applyBulkThreshold(data.data.bulkThreshold);
  } catch(e){
    console.warn('bulk threshold unavailable, using the default:', e.message || e);
  }
  return bulkThreshold;
}

/* ── WHAT THE INGREDIENTS ACTUALLY ALLOW ──────────────────────────
   dailyLimit is how much the shop is WILLING to bake in a day: oven
   space, hands, hours. It says nothing about whether there is flour,
   so a product could read "50 left" with sugar for three.

   The panel writes stockLimit onto each product — how many whole
   units its recipe can still produce from the ingredients on the
   shelf right now — so the shop can apply the same ceiling without
   needing the ingredient table, which it cannot see.

   The two are different kinds of limit and the honest answer is
   whichever binds first.

   It binds only at short notice. An order for next Friday will be
   baked from flour nobody has bought yet, and the restock draft is
   the thing that gets it bought — refusing that order because the
   shelf is bare today would turn away exactly the bulk orders this
   shop wants. Today and tomorrow nothing can be bought in time, so
   today's shelf is the ceiling.

   An absent stockLimit means the panel has not computed one (a
   product with no recipe, or a version saved before this existed) and
   constrains nothing. Zero is a real answer and means zero. */
function stockCappedLimit(p, leadDays){
  const limit = Number(p && p.dailyLimit);
  const cap   = Number(p && p.stockLimit);
  if(!Number.isFinite(cap) || cap < 0) return limit;
  return (Number(leadDays) || 0) < 2 ? Math.min(limit, cap) : limit;
}

/* The single question the storefront asks.

   `committed` is the live count for the delivery day in question,
   from loadCommitted(); without it this falls back to soldToday,
   which is better than nothing but lags.

   `leadDays` is how far off that date is, and decides both how much
   can be made for it and whether the low-stock threshold applies.
   The threshold is a buffer for orders there is no time to prepare
   for, so it only bites at short notice. */
function availability(p, committed, opts){
  const leadDays    = opts && opts.leadDays != null ? opts.leadDays : 0;
  const shortNotice = leadDays < 2;

  /* Asked of dailyLimit alone, deliberately: a product with no daily
     limit is unlimited, and that must be decided before the
     ingredient ceiling is applied. Otherwise a cap of zero would read
     as "no limit set" and put a product with no ingredients left back
     on the shelf as unlimited. */
  const limit = Number(p && p.dailyLimit);
  if(!Number.isFinite(limit) || limit <= 0){
    return { left: Infinity, orderable: true, state: 'ok', capacity: Infinity };
  }

  const used = committed && Object.prototype.hasOwnProperty.call(committed, p.name)
    ? committed[p.name]
    : Number(p.soldToday) || 0;

  /* Beyond short notice this is dailyLimit unchanged, so nothing about
     booking ahead moves. */
  const capacity = capacityFor(stockCappedLimit(p, leadDays), leadDays);
  const left     = Math.max(0, capacity - used);
  const bar      = shortNotice ? hideThreshold(p) : 0;

  if(left === 0)   return { left, capacity, orderable: false, state: 'out' };
  if(left <= bar)  return { left, capacity, orderable: false, state: 'low' };
  return { left, capacity, orderable: true, state: left <= bar + 3 ? 'nearly' : 'ok' };
}

/* Checked again at checkout, because a basket can sit for an hour
   while the last few sell to somebody else. Returns the lines that no
   longer fit, so the customer is told which ones rather than simply
   being refused. */
function unavailableLines(cart, byName, committed, opts){
  return (cart || []).reduce((bad, line) => {
    const p = byName[line.name];
    if(!p) return bad;                      // not in the catalogue; leave it alone

    const a = availability(p, committed, opts);
    if(a.left === Infinity) return bad;

    /* Below the threshold the product is off the shelf entirely, so
       any quantity is refused — not just one more than is left. */
    if(!a.orderable || a.left < (line.qty || 1)){
      bad.push({ name: line.name, wanted: line.qty || 1, left: a.left, state: a.state });
    }
    return bad;
  }, []);
}
