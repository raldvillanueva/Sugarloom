/* ── service-area.js — where we deliver ─────────────────────────
   Region and City are picked from lists rather than typed. A free-text
   city box let people write anything — one order arrived with the city
   name mashed into the postcode field as "1001Cainta" — and a typo
   there throws the distance lookup off, which throws the delivery fee
   off with it.

   Only the areas actually served are listed. The old form offered all
   81 provinces, so a customer in Cebu could fill in the whole checkout
   before being told they were out of range. To serve somewhere new, add
   it here and nowhere else. */

const SERVICE_AREA = {
  'Metro Manila': [
    ['Caloocan', '1400'], ['Las Piñas', '1740'], ['Makati', '1200'],
    ['Malabon', '1470'],  ['Mandaluyong', '1550'], ['Manila', '1000'],
    ['Marikina', '1800'], ['Muntinlupa', '1770'], ['Navotas', '1485'],
    ['Parañaque', '1700'],['Pasay', '1300'],      ['Pasig', '1600'],
    ['Pateros', '1620'],  ['Quezon City', '1100'],['San Juan', '1500'],
    ['Taguig', '1630'],   ['Valenzuela', '1440']
  ],
  'Rizal': [
    ['Angono', '1930'],   ['Antipolo', '1870'],   ['Baras', '1970'],
    ['Binangonan', '1940'],['Cainta', '1900'],    ['Cardona', '1950'],
    ['Jala-Jala', '1990'],['Morong', '1960'],     ['Pililla', '1910'],
    ['Rodriguez', '1860'],['San Mateo', '1850'],  ['Tanay', '1980'],
    ['Taytay', '1920'],   ['Teresa', '1880']
  ]
};

function regionNames() {
  return Object.keys(SERVICE_AREA);
}

function citiesIn(region) {
  return SERVICE_AREA[region] || [];
}

function postalFor(region, city) {
  const hit = citiesIn(region).find(([name]) => name === city);
  return hit ? hit[1] : '';
}

/* Which region a city belongs to — used to restore a saved address
   where only the city was kept. */
function regionForCity(city) {
  const wanted = String(city || '').trim().toLowerCase();
  return regionNames().find(r => citiesIn(r).some(([name]) => name.toLowerCase() === wanted)) || '';
}

function fillRegionSelect(select, selected) {
  select.innerHTML = '<option value="">Select region</option>' +
    regionNames().map(r => `<option${r === selected ? ' selected' : ''}>${r}</option>`).join('');
}

function fillCitySelect(select, region, selected) {
  const cities = citiesIn(region);
  select.disabled = cities.length === 0;
  select.innerHTML = cities.length
    ? '<option value="">Select city</option>' +
      cities.map(([name]) => `<option${name === selected ? ' selected' : ''}>${name}</option>`).join('')
    : '<option value="">Choose a region first</option>';
}
