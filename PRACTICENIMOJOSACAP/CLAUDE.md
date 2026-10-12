# SugarLoom Ph

Online store and admin panel for a home-based bakery in Pinagbuhatan,
Pasig City, delivering across Metro Manila and Rizal. Plain HTML, CSS
and JavaScript with no build step — files are served exactly as they sit
on disk.

The shop's coordinates live in `js/delivery-fee.js` (`BAKERY`) and drive
every delivery fee. `js/service-area.js` holds the regions and cities
offered at checkout, and the geocoder reads its town list from there
too — add a new delivery area in that one file.

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
- `audit_log` — who did what in the panel (Super Admin → Audit Trail)
- `site_content` — editable homepage copy (Admin → Content)
- `inquiries` — contact-form messages (Admin → Messages)
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

## Roles

`ROLE_NAV` at the top of `admin.js` is the only place that decides who
sees what, in what order, under what headings. `ROLE_VIEWS` is derived
from it, so the sidebar and the permission check cannot disagree: if it
is not in the sidebar, the role cannot open it — not by clicking, not
from the console. The landing view is each role's first item.

`applyRoleNav()` rebuilds the sidebar on sign-in. The markup carries the
Administrator's layout; other roles get their items moved into their own
order and their headings remade, so a role's sidebar reads the way that
role works rather than the way the HTML happens to be written. A group
with an empty label gets no heading. To change a role, edit `ROLE_NAV`.

The two senior roles divide rather than overlap.

- **Super Admin** — Customers, Reports, Content, Users, Audit Trail.
  Governs people, published copy and the records. The only role that can
  reach staff accounts, the CMS or the trail. Seeded as
  `superadmin@sugarloom.ph` / `super123`, and `ensureSuperAdmin()`
  creates the account on databases seeded before the role existed.
- **Administrator** — runs the shop: Dashboard, Products, Orders,
  Customers, Inventory, Reports, Messages, Reviews. No Content, no
  Users, no Audit Trail — an administrator who could edit staff accounts
  or read the log of their own actions is not being audited by it.
- **Baker**, **Packer** — Orders only.

Every recorded action goes through `logAudit(area, action, entity,
detail)`. It writes straight to `audit_log` rather than through
`saveDB()`, which upserts whole tables from memory — an entry the next
save could rewrite is not an audit entry. A failed write is logged to
the console and never blocks the action it describes. If the table is
missing the page says so and the rest of the panel is unaffected; run
`supabase-audit-log.sql`.

## Restocking

An ingredient at or below its reorder point puts a **Draft** restock
form in front of the admin — a toast, a notification-bell entry and a
badge on Inventory. The draft is a proposal, never an order: the admin
opens it, changes quantities, unticks anything they are not buying, adds
anything else they want, then confirms. Only then does it become
**Sent**.

`suggestedQty` is what the system advised and `orderQty` is what the
admin decided; both are kept, so the printed form shows the advice next
to the decision. A line the admin removes goes into `removedIds` so the
next inventory render does not quietly put it back. Forms raised before
this split have status `Open` and no `orderQty` — `restockStatus()` and
`rfOrderQty()` read those as `Draft` and the suggestion.

Sending moves no stock. Stock changes when someone adjusts it after the
delivery arrives, which keeps the count honest about what is on the
shelf.

**Ingredients are deducted when baking starts**, not at confirmation, and
are returned if the order is later cancelled. `order.stockDeducted`
guards against deducting twice for the same bake.

Orders whose delivery date has passed are archived automatically, but
**only if they were Fulfilled or Cancelled** (`ORDER_SETTLED`). An order
nobody finished is not a finished order: it stays in its tab flagged
LATE, because sweeping it away is indistinguishable from the customer
never being served. Restoring an archived order exempts it from the
sweep for good.

`deliveryUrgency(order)` drives the warnings — a DUE TOMORROW / DUE
TODAY / LATE chip on the order row, an escalating notification (the id
carries the urgency, so dismissing one step does not silence the next),
and a red banner on Orders that cannot be dismissed. The admin recovers
by rescheduling the delivery date from the order, or cancelling it so
the ingredients go back to stock.

## The backend

`js/server.js` is an Express app handling order emails, the admin
forgot-password OTP, and the AI chatbot. Netlify serves static files
only, so it has to be hosted separately — `render.yaml` at the repo root
deploys it in a few clicks.

Every call to it goes through `apiUrl()` in `js/api-config.js`. **After
hosting, paste the service URL into `HOSTED_API` there and nothing else
changes.** Until that is set, the front end only calls the server when
the page itself is open on localhost; on the deployed site those features
degrade instead of erroring:

- order status emails — skipped
- admin forgot-password OTP — says it needs the mail server (normal admin
  login is local and unaffected)
- the AI chatbot — answers from the keyword replies in `js/homepage.js`

Secrets come from the environment only — see `.env.example`. Never add
them back as fallbacks in the code.

Lalamove is not part of this: it runs in the browser via
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

- RLS is off for every table except `profiles` (see `supabase-rls.sql`).
  The admin panel signs in against its own `admin_users` table and then
  uses the same public anon key a customer does, so Postgres can't tell
  staff from visitors. Fixing that means moving staff onto Supabase Auth,
  or putting the panel behind a server holding the service_role key.
- Email delivery and the admin forgot-password OTP need `js/server.js`
  hosted somewhere.

Staff passwords are SHA-256 hashed (unsalted — enough that reading
`admin_users` doesn't hand over logins, not enough to resist a serious
offline attack). Accounts created before that are upgraded on next login.
Customer-supplied text is escaped with `escHTML()` before it reaches
admin markup.
