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

/* Towns we deliver to. Subdivision and village names are mostly absent
   from OpenStreetMap, so when the full address draws a blank we fall
   back to the barangay or the town — easily accurate enough to put a
   delivery in the right price band.

   Taken from SERVICE_AREA (js/service-area.js) so the dropdown and the
   geocoder can't drift apart. The literal is only a fallback for pages
   that don't load that file. */
const KNOWN_PLACES = typeof SERVICE_AREA !== 'undefined'
  ? Object.values(SERVICE_AREA).flat().map(([name]) => name)
  : [
      'Cainta', 'Taytay', 'Antipolo', 'Angono', 'Binangonan', 'Rodriguez', 'San Mateo',
      'Pasig', 'Marikina', 'Quezon City', 'Mandaluyong', 'San Juan', 'Makati',
      'Manila', 'Taguig', 'Pateros', 'Caloocan', 'Parañaque', 'Las Piñas',
      'Muntinlupa', 'Pasay', 'Valenzuela', 'Malabon', 'Navotas'
    ];

function tidy(s) {
  /* No trailing \b after the optional dot — otherwise "Brgy." keeps its
     full stop and becomes "Barangay.", which then fails to match the
     barangay pattern below. */
  return String(s || '')
    .replace(/\bbrgy\.?\s*/ig, 'Barangay ')
    .replace(/\bblk\.?\s*/ig, 'Block ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Progressively broader guesses, most precise first. */
function addressCandidates({ street, city, postal, region }) {
  const s = tidy(street);
  const c = tidy(city);
  const p = String(postal || '').trim();
  /* Prefer a town named in the street line over the city field. People
     often leave the city box wrong — this address said "Pasig City" in
     the street and "Cainta" in the city box, two towns apart. */
  const findPlace = text => KNOWN_PLACES.find(k => new RegExp(`\\b${k}\\b`, 'i').test(text));
  const place = findPlace(s) || findPlace(c) || c;

  // "Barangay Santa Lucia Pasig City" → "Santa Lucia"
  const brgy = s.match(/Barangay\s+([A-Za-zÑñ]+(?:\s+[A-Za-zÑñ]+)?)/i);
  const brgyName = brgy
    ? brgy[1].replace(new RegExp(`\\s*(${KNOWN_PLACES.join('|')})\\s*$`, 'i'), '').trim()
    : '';

  const out = [];
  const add = (q, precision) => {
    const v = String(q || '').replace(/(^[,\s]+|[,\s]+$)/g, '');
    if (v.length > 2 && !out.some(o => o.q.toLowerCase() === v.toLowerCase())) out.push({ q: v, precision });
  };

  const reg = String(region || '').trim();
  add([s, c, reg, p].filter(Boolean).join(', '), 'exact');
  add(s, 'exact');
  if (brgyName && place) add(`Barangay ${brgyName}, ${place}`, 'barangay');
  add([place, reg].filter(Boolean).join(', '), 'city');
  add(place, 'city');
  add(p, 'city');

  return out.slice(0, 5);
}

async function nominatim(query) {
  const url = 'https://nominatim.openstreetmap.org/search'
            + '?format=json&limit=1&countrycodes=ph'
            + '&q=' + encodeURIComponent(query);
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error('geocoder returned ' + res.status);
  const hits = await res.json();
  if (!hits.length) return null;
  return {
    lat: parseFloat(hits[0].lat),
    lng: parseFloat(hits[0].lon),
    matched: hits[0].display_name
  };
}

async function geocodeAddress(parts) {
  const tries = addressCandidates(parts);
  if (!tries.length) return null;

  const cacheKey = tries[0].q.toLowerCase();
  const cache = readGeocodeCache();
  if (cache[cacheKey]) return cache[cacheKey];

  for (let i = 0; i < tries.length; i++) {
    const { q, precision } = tries[i];
    try {
      const hit = await nominatim(q);
      if (hit) {
        const found = { ...hit, precision, query: q };
        cache[cacheKey] = found;
        writeGeocodeCache(cache);
        return found;
      }
    } catch (err) {
      console.warn('geocode attempt failed:', q, err.message);
    }
    // Nominatim asks for no more than one request a second
    if (i < tries.length - 1) await new Promise(r => setTimeout(r, 1100));
  }
  return null;
}

/* ── the thing checkout calls ──
   Always resolves. If the address can't be placed, it falls back to the
   flat fee rather than blocking the order. */
async function quoteDelivery(parts) {
  const joined = [parts.street, parts.city, parts.postal].filter(Boolean).join(' ');
  if (joined.trim().length < 6) {
    return { fee: FALLBACK_FEE, km: null, coords: null, label: 'Standard', located: false };
  }

  const hit = await geocodeAddress(parts);
  if (!hit) {
    return { fee: FALLBACK_FEE, km: null, coords: null, label: 'Standard', located: false };
  }

  const coords = { lat: hit.lat, lng: hit.lng };
  const km     = haversineKm(BAKERY, coords);
  const band   = bandFor(km);

  return {
    fee:     band.fee,                  // null when out of range
    km:      Math.round(km * 10) / 10,
    coords,
    label:   band.label,
    located: true,
    precision: hit.precision,           // exact | barangay | city
    matched:   hit.matched,             // what the geocoder actually found
    outOfRange: band.fee === null
  };
}
