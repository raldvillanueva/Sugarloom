/* ── cod-policy.js — who may pay cash on delivery ───────────────
   Cash on Delivery is where a bakery loses money to fake orders: the
   goods are baked, the rider is paid, and nobody answers the door. The
   bigger the order the worse it hurts, so bulk orders carry the most
   risk.

   Three rules, in one place so checkout and the admin panel judge an
   order the same way:

     1. A hard ceiling. Above it, the order must be paid online.
     2. Above a lower "trusted" threshold, the customer needs at least
        one completed order behind them. A first-time buyer can still
        use COD for a small order — which is how they earn the history —
        but cannot have ₱2,000 of cake baked on a promise.
     3. Anyone who has walked away from orders before loses COD.

   Everyone ordering is signed in with a verified email already, so this
   builds on an identity rather than on nothing. */

const COD_POLICY = {
  maxAmount:        2000,   // above this, online payment only
  trustThreshold:   800,    // above this, a completed order is required
  maxCancellations: 2       // this many walk-aways and COD is withdrawn
};

/* Reads one customer's order history. Returns zeroes if it can't be
   read — a lookup failure should not hand out COD it shouldn't. */
async function customerOrderRecord(email){
  if(!email || email === 'guest') return { fulfilled: 0, cancelled: 0, known: false };

  try {
    const { data, error } = await _supa
      .from('orders')
      .select('status, data')
      .eq('customer_email', email);
    if(error) throw error;

    let fulfilled = 0, cancelled = 0;
    (data || []).forEach(row => {
      const status = row.status || row.data?.status;
      if(status === 'Fulfilled') fulfilled++;
      // Only count cancellations the buyer caused, not ones we caused
      if(status === 'Cancelled' && (row.data?.cancelledByBuyer || row.data?.cancelRequestedByBuyer)) cancelled++;
    });
    return { fulfilled, cancelled, known: true };
  } catch (err) {
    console.warn('Could not read order history:', err);
    return { fulfilled: 0, cancelled: 0, known: false };
  }
}

/* Decides whether this order may be COD, and says why not in words the
   customer can act on. */
function judgeCod(total, record){
  if(total > COD_POLICY.maxAmount){
    return {
      allowed: false,
      reason: `Orders over ₱${COD_POLICY.maxAmount.toLocaleString()} need to be paid online. Please choose GCash.`
    };
  }
  if(record.cancelled >= COD_POLICY.maxCancellations){
    return {
      allowed: false,
      reason: 'Cash on Delivery isn\'t available on this account. Please pay with GCash.'
    };
  }
  if(total > COD_POLICY.trustThreshold && record.fulfilled < 1){
    return {
      allowed: false,
      reason: `Cash on Delivery is available up to ₱${COD_POLICY.trustThreshold.toLocaleString()} on a first order. Pay this one with GCash and COD opens up for larger orders next time.`
    };
  }
  return { allowed: true, reason: '' };
}

/* Used by the admin panel to flag an order worth a phone call before
   anyone starts baking. */
function codRiskLevel(order, record){
  if(order.payment !== 'Cash on Delivery') return null;
  if(record.cancelled >= 1) return { level: 'high', note: `${record.cancelled} previous cancellation${record.cancelled > 1 ? 's' : ''}` };
  if(record.fulfilled === 0 && order.total >= COD_POLICY.trustThreshold) return { level: 'high', note: 'First order, large COD' };
  if(record.fulfilled === 0) return { level: 'watch', note: 'First-time customer' };
  return null;
}
