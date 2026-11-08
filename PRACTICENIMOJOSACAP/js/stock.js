/* ── stock.js — what is left to sell today ────────────────────────
   One rule, shared by the shop, the product page, the cart and
   checkout, so the four cannot disagree about whether something can
   still be ordered.

   The admin panel counts a product's day in two fields: dailyLimit is
   how many can be made, soldToday how many are spoken for. The shop
   used to ignore both — products.js dropped them when it mapped the
   rows — so a product with nothing left still went in the basket and
   straight through checkout, and the baker found out afterwards. */

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
    const { data, error } = await supa.from('orders').select('status,data');
    if(error || !data) return null;
    const orders = data.map(r => Object.assign({ status: r.status }, r.data || {}));
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

/* The single question the storefront asks.

   `committed` is the live count for the delivery day in question,
   from loadCommitted(); without it this falls back to soldToday,
   which is better than nothing but lags.

   `shortNotice` is what two clear days' warning changes, and all it
   changes. The threshold is a buffer for orders the shop has no time
   to prepare for, so notice lifts it — but the daily limit still
   applies, measured against that date. Notice buys a fresh day's
   capacity, not unlimited capacity: without that, fifty people could
   each order a day's worth for the same Friday, every one of them
   waved through on their own, and nothing would ever add up Friday. */
function availability(p, committed, opts){
  const shortNotice = !opts || opts.shortNotice !== false;

  const limit = Number(p && p.dailyLimit);
  if(!Number.isFinite(limit) || limit <= 0){
    return { left: Infinity, orderable: true, state: 'ok' };
  }

  const used = committed && Object.prototype.hasOwnProperty.call(committed, p.name)
    ? committed[p.name]
    : Number(p.soldToday) || 0;

  const left = Math.max(0, limit - used);
  const bar  = shortNotice ? hideThreshold(p) : 0;

  if(left === 0)   return { left, orderable: false, state: 'out' };
  if(left <= bar)  return { left, orderable: false, state: 'low' };
  return { left, orderable: true, state: left <= bar + 3 ? 'nearly' : 'ok' };
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
