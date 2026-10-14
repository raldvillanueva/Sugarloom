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
- `app_settings` — runtime settings; currently the audit retention period
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

- **Super Admin** — Audit Trail, Reports, Users, Customers. Governs
  people and the records; the only role that can reach staff accounts
  or the trail. Seeded as `superadmin@sugarloom.ph` / `super123`, and
  `ensureSuperAdmin()` creates the account on databases seeded before
  the role existed.
- **Administrator** — runs the shop: Dashboard, Products, Orders,
  Customers, Inventory, Reports, Messages, Content, Reviews. The CMS is
  here because keeping the homepage current is ordinary work, not
  governance. No Users and no Audit Trail — an administrator who could
  grant themselves a role, or read the log of their own actions, is not
  being audited by it.
- **Baker**, **Packer** — Orders only.

Every recorded action goes through `logAudit(area, action, entity,
detail)`. Reads go through `logRead(...)`, the same thing folded over a
ten-minute window per actor and record.

A read is logged only when it is **a customer's personal details** or
**data leaving the system** (an export, a print). Navigation is not a
read: opening a page, landing on your home view, opening an order you
are working on. The first version logged all of those, and since the
Super Admin lands on the Audit Trail it filled with "Audit trail
viewed" — a log that mostly describes itself is one nobody reads.
Before adding a `logRead`, check it clears that bar.

Retention is set by the Super Admin on the Audit Trail page and stored
in `app_settings` (id `audit`, default 365 days). `purge_audit_log()`
reads that same row, so there is one number rather than a page and a
database that can drift. Enforcement is in the database on a daily
pg_cron schedule because the panel has no delete policy and cannot
remove a row.

Both ends clamp it to 30–3650 days. The database clamp is the one that
matters: `app_settings` is writable with the public anon key, so
without a floor anyone holding it could set one day and let the next
purge destroy the trail without deleting anything themselves. A change
is written to the trail *before* it is applied, so a shortening leaves
evidence among the entries it is about to remove. The page flags
entries past retention, so a purge that has stopped is visible.

Both write straight to `audit_log` rather than through
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

## GCash payments

Paying by GCash means uploading a receipt. The checkout shows the shop's
account (`GCASH_ACCOUNT` in `js/gcash-proof.js`) beside the QR
(`Images/GCASHMOJO.png`), takes a screenshot, and reads it in the browser
with Tesseract.js, fetched from a CDN only when someone actually
uploads. The order then carries `paymentProof` (image, reference,
amount read, the checks) and `paymentStatus: 'Awaiting verification'`.

`GCASH_ACCOUNT` has a `label` and a `holder`, and they are not the same
thing. Customers are told to send to **GCASHMOJO**; GCash prints the
registered account holder on the receipt, masked, as **GE\*\*\*D V.**
Matching against the label would fail on every genuine payment, so
`holder` is what `nameLooksRight()` compares against, treating the mask
as a wildcard. If the GCash account ever changes, update `holder` to
exactly what the QR card shows, mask characters and all.

**The reading is a first pass, not proof.** A screenshot is an image and
can be edited; the only real confirmation is the money in the shop's
GCash history, which a person checks. So the reader never sets
`paymentStatus` — the admin does, with Verify or Reject in the order,
and both are written to the audit trail. A failed read never blocks the
customer either: it uploads as `unread` and goes to a human.

What it does catch is the common stuff — a screenshot of the wrong
transaction, the wrong amount, money sent to someone else, something
that is not a receipt at all, and the same reference attached to two
orders. Note `NOT_THE_AMOUNT` in `findAmount()`: the wallet balance is
usually the largest figure on a receipt, so "take the biggest number"
reads it as the payment.

A GCash order cannot be confirmed through to the baker until the
payment is verified — confirming is what consumes the ingredients.
Orders placed before receipts existed have no `paymentStatus` and are
not held up.

**Rejecting a payment cancels the order.** An unpaid order is not a
waiting order: left Pending it sits in the baker's path and in the
overdue warnings for something nobody will make. The reason is
required (8 characters minimum) because it reaches the customer
verbatim — the old blank fallback put "No matching payment found" in
their inbox under the shop's name whether or not that was what
happened. The cancel reason is written as `Payment rejected — <why>`,
and `checkOrderNotifications()` matches that prefix to suppress the
generic "order cancelled" line, so one decision produces one email and
one notification rather than two of each.

## Telling the customer

`checkOrderNotifications()` in `js/homepage.js` drives the customer's
bell. It reads orders **from Supabase**, not from localStorage. It used
to read the local copy, which is why the bell was always empty on a
real deployment: the admin panel writes that copy with
`syncStatusToCustomer()`, but that runs in the admin's browser and
writes to the admin's localStorage. It only appeared to work because
both sides were open in the same browser during testing. The local copy
is still the fallback when the network is down.

Four things are watched per order, each on its own key in
`sl_notif_seen_<email>` so one cannot mask another: `status`,
`preparingSubStatus` (baking/packing/packed), Lalamove `tracking`, and
`paymentStatus`. Payment needs its own key because an order sits
**Pending** while the receipt is checked — a status-only watcher would
never fire.

Email goes through `sendStatusEmail()` in `admin.js`. Every status
passed to `syncStatusToCustomer()` or `sendStatusEmail()` must have an
entry in its `messages` map, or the customer gets "Your order status
has been updated to: X". Payment decisions call `sendStatusEmail()`
**directly** rather than `syncStatusToCustomer()`, because that
function assigns its argument to `order.status` and a payment decision
is not an order status.

⚠ **Email does not actually send yet.** `apiAvailable()` is false until
`js/server.js` is hosted and `HOSTED_API` is set in `js/api-config.js`,
so `sendStatusEmail()` returns immediately. The in-app bell works
either way.

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
