# SugarLoom Ph

Online store and admin panel for a home-based bakery in Cainta, Metro
Manila. Plain HTML, CSS and JavaScript with no build step — files are
served exactly as they sit on disk.

## Layout

```
pages/          Customer pages (homepage, products, cart, checkout, orders, login)
js/             Customer-side scripts, one per page, plus shared helpers
css/            Customer-side styles, one per page
admin/          The whole admin panel (admin.html + admin.js + admin.css)
Images/         Static images committed to the repo
ChatBot/        Node dependencies for the chatbot backend
js/server.js    Express backend — email, OTP, Gemini chat (see "Not hosted")
supabase-schema.sql  Every table; run it in the Supabase SQL editor
```

The git repository root is the **parent** folder, and this directory is a
subfolder of it. Netlify's publish directory is set to this folder, which
is why the deployed site serves `pages/…` from the site root.

## Data

Supabase (project `ruclytedzkdbranurfcq`) holds everything, mostly as
`id` plus a `jsonb` blob:

- `products`, `ingredients` — catalogue and stock, managed in the admin panel
- `orders`, `transactions`, `stock_log` — order flow and audit trail
- `order_tracking` — Lalamove delivery state per order
- `profiles` — customer details, keyed to Supabase Auth users
- `admin_users` — staff accounts, separate from Supabase Auth
- `site_content` — editable homepage copy (Admin → Content)
- `reviews` — customer reviews awaiting approval

Row Level Security is **disabled** on every table (see the bottom of
`supabase-schema.sql`). The anon key in `js/supabase-config.js` therefore
has full read and write access. Fine for coursework, not for real
customer data.

`localStorage` is used alongside this for the cart, the logged-in
customer, and a `sl_store_orders` hand-off between the shop and the admin
panel.

## Order flow

```
Pending → Confirmed → Preparing/baking → Ready for Packing
        → Preparing/packing → packed → readyForBook → Fulfilled
```

Roles see only their own stage. Baker works the **Confirmed** queue,
Packer the **Ready for Packing** queue; both run oldest-first and both
can send an order to the back or hand it back a step with a reason.

**Ingredients are deducted when baking starts**, not at confirmation, and
are returned if the order is later cancelled. `order.stockDeducted`
guards against deducting twice for the same bake.

Orders whose delivery date has passed are archived automatically.
Restoring one exempts it from that sweep.

## Not hosted

`js/server.js` is an Express app that is **not deployed anywhere**.
Netlify serves static files only. Anything calling `http://localhost:5000`
therefore fails on the live site — and cannot be made to work from it,
because browsers block an https page from fetching http://localhost as
mixed content.

Still pointing at it, and degrading gracefully rather than erroring:

- order status emails (`sendStatusEmail`) — silently skipped
- admin **forgot password** OTP — normal admin login is local and unaffected
- the AI chatbot — falls back to keyword replies in `js/homepage.js`

Lalamove used to be in this list; it now runs in the browser via
`admin/lalamove-sim.js`, which simulates booking and delivery so it works
on the deployed site with nothing to start up.

## Conventions

- No framework, no bundler, no npm scripts for the front end. Edit and reload.
- Scripts are loaded with plain `<script>` tags; everything shares one global scope.
  `admin.html` loads `lalamove-sim.js`, then `admin.js`, then `cms.js` — helpers
  defined in an earlier file are used by later ones.
- Phone numbers are stored as 10 digits starting with 9 (`9171234567`) and
  displayed with a `+63` prefix.
- Prices are plain numbers in pesos; format with `toLocaleString()` at render time.
- Homepage copy is tagged `data-cms="key"` and swapped by `js/content.js`,
  with the text in the HTML as the fallback. To make something editable,
  tag it and add a matching field to `CMS_SECTIONS` in `admin/cms.js`.
- Uploaded pictures are resized by `shrinkImage()` before being stored,
  since they live inside database rows.

## Known gaps

- No RLS; the anon key can read and write every table.
- Admin passwords are stored and compared in plain text in `admin_users`.
- Customer names and addresses are interpolated straight into admin HTML,
  so a crafted name could inject markup into the panel.
- Email delivery needs `js/server.js` hosted somewhere.
