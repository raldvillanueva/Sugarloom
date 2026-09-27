/* ── delivery-fee.js — distance-based delivery pricing ───────────
   Turns the customer's typed address into coordinates, measures how far
   that is from the bakery, and prices the delivery accordingly. The fee
   used to be a flat ₱50 regardless of whether you were down the street
   or across Metro Manila.

   Geocoding uses OpenStreetMap's Nominatim: free, no API key, no
   billing account. Their usage policy asks for at most one request per
   second and no bulk querying, which a checkout page comfortably
   respects — and results are cached so retyping an address or coming
   back later costs nothing.

   The coordinates are saved on the order too. A real Lalamove booking
   needs lat/lng rather than a text address, so this is also the missing
   piece for that whenever it gets switched on. */

/* Where the rider collects. Same place as LALAMOVE_PICKUP_* on the
   server — keep the two in step if the bakery ever moves. */
const BAKERY = { lat: 14.5786, lng: 121.1222, label: 'Cainta, Rizal' };

/* Fee bands, cheapest first. `upToKm: Infinity` catches everything else. */
const DELIVERY_BANDS = [
  { upToKm: 3,        fee: 50,  label: 'Nearby'   },
  { upToKm: 6,        fee: 80,  label: 'Short'    },
  { upToKm: 10,       fee: 120, label: 'Medium'   },
  { upToKm: 15,       fee: 170, label: 'Long'     },
  { upToKm: 25,       fee: 250, label: 'Far'      },
  { upToKm: Infinity, fee: null, label: 'Out of range' }   // null = we don't deliver
];

const FALLBACK_FEE = 50;          // address not recognised — don't punish the customer
const GEOCODE_CACHE_KEY = 'sl_geocode_cache';

/* ── distance ── */
function haversineKm(a, b) {
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat/2) ** 2 +
            Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function bandFor(km) {
  return DELIVERY_BANDS.find(b => km <= b.upToKm);
}

/* ── geocoding ── */
function readGeocodeCache() {
  try { return JSON.parse(localStorage.getItem(GEOCODE_CACHE_KEY) || '{}'); }
  catch { return {}; }
}

function writeGeocodeCache(cache) {
  try { localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(cache)); } catch {}
}

async function geocodeAddress(address) {
  const key = address.trim().toLowerCase();
  if (!key) return null;

  const cache = readGeocodeCache();
  if (cache[key]) return cache[key];

  /* Bias the search to the Philippines so "Cainta" doesn't match
     somewhere on the other side of the world. */
  const url = 'https://nominatim.openstreetmap.org/search'
            + '?format=json&limit=1&countrycodes=ph'
            + '&q=' + encodeURIComponent(address);

  try {
    const res  = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error('geocoder returned ' + res.status);
    const hits = await res.json();
    if (!hits.length) return null;

    const coords = { lat: parseFloat(hits[0].lat), lng: parseFloat(hits[0].lon) };
    cache[key] = coords;
    writeGeocodeCache(cache);
    return coords;
  } catch (err) {
    console.warn('Could not geocode address:', err);
    return null;
  }
}

/* ── the thing checkout calls ──
   Always resolves. If the address can't be placed, it falls back to the
   flat fee rather than blocking the order. */
async function quoteDelivery(address) {
  if (!address || address.trim().length < 6) {
    return { fee: FALLBACK_FEE, km: null, coords: null, label: 'Standard', located: false };
  }

  const coords = await geocodeAddress(address);
  if (!coords) {
    return { fee: FALLBACK_FEE, km: null, coords: null, label: 'Standard', located: false };
  }

  const km   = haversineKm(BAKERY, coords);
  const band = bandFor(km);

  return {
    fee:     band.fee,                  // null when out of range
    km:      Math.round(km * 10) / 10,
    coords,
    label:   band.label,
    located: true,
    outOfRange: band.fee === null
  };
}
