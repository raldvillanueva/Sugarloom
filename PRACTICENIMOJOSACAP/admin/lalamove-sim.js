/* ── lalamove-sim.js — Lalamove delivery simulator ───────────────
   Stands in for the Lalamove API so deliveries can be demonstrated
   without an account, an API key, or any money changing hands.

   This is the same simulation that lives in js/server.js, moved into the
   browser. That server version only answers on http://localhost:5000, so
   it needs a terminal open, and the live HTTPS site can't call it at all
   — browsers block an https page from fetching http://localhost as mixed
   content. Running it here means booking works on the deployed site with
   nothing to start up first.

   A booking's stage is worked out from how long ago it was booked, not
   from anything held in memory, so it keeps progressing across reloads
   and looks the same in every tab. Reaching COMPLETED lets the admin mark
   the order Fulfilled, exactly as a real delivery would. */

const LALAMOVE_DEMO_DRIVER = { name: 'Juan dela Cruz', phone: '+639171234567', plate: 'ABC 1234' };

/* Seconds after booking at which each stage begins. Shorten these to make
   a live demo move faster; the order of the stages matches Lalamove's. */
const LALAMOVE_STAGES = [
  { after:  0, status: 'ASSIGNING_DRIVER', label: 'Finding a driver',   driver: false },
  { after: 10, status: 'ON_GOING',         label: 'Driver on the way',  driver: true  },
  { after: 20, status: 'PICKED_UP',        label: 'Picked up',          driver: true  },
  { after: 30, status: 'COMPLETED',        label: 'Delivered',          driver: true  }
];

const LalamoveSim = {

  /* Mirrors POST /lalamove/create-order */
  createOrder({ customerName, customerPhone, deliveryAddress }) {
    if (!customerName || !customerPhone || !deliveryAddress) {
      return { success: false, error: 'Missing customer name, phone or delivery address.' };
    }
    const bookedAt = Date.now();
    const orderRef = 'LLM-' + bookedAt;
    return {
      success:   true,
      orderRef,
      bookedAt,
      shareLink: 'https://share.lalamove.com/demo/' + orderRef,
      price:     '80.00',
      currency:  'PHP'
    };
  },

  /* Mirrors GET /lalamove/track/:orderRef */
  track(bookedAt) {
    const start = LalamoveSim.resolveBookedAt(bookedAt);
    if (!start) return { success: false, error: 'Booking not found.' };

    const elapsed = (Date.now() - start) / 1000;
    const stage   = LalamoveSim.stageAt(elapsed);

    return {
      success: true,
      status:  stage.status,
      driver:  stage.driver ? { ...LALAMOVE_DEMO_DRIVER } : null
    };
  },

  stageAt(elapsedSeconds) {
    let current = LALAMOVE_STAGES[0];
    for (const s of LALAMOVE_STAGES) if (elapsedSeconds >= s.after) current = s;
    return current;
  },

  stageIndex(bookedAt) {
    const start = LalamoveSim.resolveBookedAt(bookedAt);
    if (!start) return 0;
    const stage = LalamoveSim.stageAt((Date.now() - start) / 1000);
    return LALAMOVE_STAGES.indexOf(stage);
  },

  /* Bookings made before this simulator existed only stored the ref, which
     carries its own timestamp — recover it rather than losing the booking. */
  resolveBookedAt(bookedAt) {
    if (typeof bookedAt === 'number' && bookedAt > 0) return bookedAt;
    if (typeof bookedAt === 'string') {
      const n = Number(bookedAt.replace(/^LLM-/, ''));
      if (!isNaN(n) && n > 0) return n;
    }
    return null;
  },

  /* Presenter control: pretend the booking happened earlier, so it jumps
     straight to the next stage instead of waiting it out on stage. */
  skewToNextStage(bookedAt) {
    const start = LalamoveSim.resolveBookedAt(bookedAt) || Date.now();
    const idx   = LalamoveSim.stageIndex(start);
    const next  = LALAMOVE_STAGES[idx + 1];
    if (!next) return null;                       // already delivered
    return Date.now() - (next.after * 1000) - 500;  // just past the boundary
  },

  totalSeconds() {
    return LALAMOVE_STAGES[LALAMOVE_STAGES.length - 1].after;
  }
};
