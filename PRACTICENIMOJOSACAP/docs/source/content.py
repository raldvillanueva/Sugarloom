# -*- coding: utf-8 -*-
"""Content of the SugarLoom Ph alpha-testing questionnaire, revised to
match the system as deployed. Separated from layout so the wording can
be reviewed on its own."""

PH = "₱"

SCOPE = (
    "These are stated project limitations, not defects, and should not be logged as such. "
    "<b>(1) Email is not delivered.</b> Order-status emails, the customer verification code and the staff "
    "forgot-password OTP all need the Node mail server in <font face='Body-B'>js/server.js</font>, which is not "
    "hosted. On the deployed site the system says so and carries on; the in-app notification bell is unaffected. "
    "Customer sign-in needs only the email and password. "
    "<b>(2) The GCash receipt reader is a first pass, not proof.</b> The screenshot is read in the browser and "
    "checked against the order, but a screenshot is an image and can be edited; only a person comparing it with the "
    "shop's GCash history can confirm the money arrived, and the Administrator makes that decision. "
    "<b>(3) Lalamove is a browser-based simulator</b>, not a live booking. "
    "<b>(4) Only Cash on Delivery and GCash are supported.</b> "
    "<b>(5) The SugarLoom Assistant</b> answers from built-in keyword replies in English and Filipino."
)

ACCESS = [
    ("Customer website", "https://sugarloom.vercel.app/pages/homepage.html"),
    ("Staff portal", "https://sugarloom.vercel.app/admin/admin.html"),
    ("Environment",
     "Desktop: Google Chrome, Microsoft Edge, Mozilla Firefox. Mobile: Android 10 or higher (Chrome or Edge) and "
     "iOS 14 or higher (Safari or Chrome). Stable connection of at least 10 Mbps."),
    ("Staff accounts",
     "Super Administrator: superadmin@sugarloom.ph &nbsp;&bull;&nbsp; Administrator: admin@sugarloom.ph "
     "&nbsp;&bull;&nbsp; Baker: baker@sugarloom.ph &nbsp;&bull;&nbsp; Packer: packer@sugarloom.ph "
     "(passwords on your tester sheet)"),
    ("Customer accounts",
     "A fresh customer with no previous orders and a returning customer with at least one Fulfilled order "
     "(both on your tester sheet)"),
    ("Products",
     f"Fudge Brownies {PH}80 &nbsp;&bull;&nbsp; Matcha Cookies {PH}70 &nbsp;&bull;&nbsp; Vanilla Cupcake {PH}75 "
     f"&nbsp;&bull;&nbsp; Fudge Brownies Box {PH}250"),
    (f"Order A ({PH}305 subtotal)",
     f"Fudge Brownies ×2 ({PH}160) + Matcha Cookies ×1 ({PH}70) + Vanilla Cupcake ×1 ({PH}75); "
     "four pieces, the minimum order"),
    (f"Order B ({PH}840 subtotal)",
     f"Fudge Brownies ×6 ({PH}480) + Matcha Cookies ×3 ({PH}210) + Vanilla Cupcake ×2 ({PH}150); "
     f"above {PH}800, at most {PH}2,000"),
    (f"Order C ({PH}2,050 subtotal)",
     f"Fudge Brownies ×15 ({PH}1,200) + Matcha Cookies ×10 ({PH}700) + Vanilla Cupcake ×2 ({PH}150); "
     f"above {PH}2,000. If a daily limit blocks a quantity, swap in other products to keep the subtotal above {PH}2,000."),
    ("Box order", f"Fudge Brownies Box ×1 ({PH}250) on its own — a box is exempt from the four-piece minimum"),
    ("Delivery addresses",
     "A Manila address near the bakery (for example in Ermita), a distant Metro Manila address (for example in "
     "Alabang, Muntinlupa), and one more than 25 km away"),
    ("GCash receipts",
     "A valid screenshot for the order amount, a mismatched one for a different amount, and an ordinary photo that "
     "is not a receipt (all on your tester sheet)"),
    ("Cancellation samples", "One order cancelled before baking and one after baking starts"),
]

PROFILE = [
    ("Name (optional)", ""),
    ("Tester ID (from your tester sheet)", "☐ T01   ☐ T02   ☐ T03"),
    ("Date of Testing", ""),
    ("Current Position / Job Title", ""),
    ("Company / Organization", ""),
    ("Primary Specialization", ""),
    ("Years of Professional IT Experience", "☐ 5–7 years   ☐ 8–10 years   ☐ 10+ years"),
    ("Scope Evaluated", "Entire system (Super Administrator, Administrator, Baker, Packer, and Customer modules)"),
]

# ── Part II ───────────────────────────────────────────────────────────
# (ref, steps, expected)

PART2 = [
("A. Account Management and Access Control", [
 ("A1<br/>FS-32",
  "1. Open the staff portal and sign in as <b>Super Administrator</b> (superadmin@sugarloom.ph).<br/>"
  "2. Note the sidebar: Audit Trail, Reports, Users, Customers.<br/>"
  "3. Open Users and select Add User.<br/>"
  "4. Enter first name, last name, the new Baker email from your tester sheet, a password, and the role Baker; save.",
  "Only the five Super Admin modules are listed. The account is created with the chosen role and appears in the "
  "Users list. Super Admin is offered in the role list."),
 ("A2<br/>FS-32,<br/>MA-04",
  "1. In Users, edit the new Baker account (change the name and the password) and save.<br/>"
  "2. Sign out and sign in with the new password.<br/>"
  "3. As Super Administrator, deactivate that account.<br/>"
  "4. Try to sign in with it.<br/>"
  "5. Try to deactivate the only Super Administrator.",
  "Edits save and the new password works. The deactivated account can no longer sign in and other accounts are "
  "unaffected. The system refuses to deactivate the last Super Administrator and says why."),
 ("A3<br/>SE-02,<br/>SE-04",
  "1. Sign in as <b>Administrator</b> and note the sidebar.<br/>"
  "2. Try to reach Users and Audit Trail by clicking and by calling switchView('users') and switchView('audit') "
  "in the browser console.<br/>"
  "3. Sign in as <b>Baker</b>, then as <b>Packer</b>, and repeat for Products, Inventory and Reports.",
  "The Administrator sees Dashboard, Products, Orders, Customers, Inventory, Reports, Messages, Content and "
  "Reviews — but not Users or Audit Trail. Baker and Packer see Orders only. Every attempt to reach another "
  "role's view returns the user to their own landing view; nothing restricted is displayed."),
 ("A4<br/>FS-05",
  "1. On the customer site select Sign In and register a new customer account.<br/>"
  "2. Check that the password rules are enforced and that the confirm-password field must match.<br/>"
  "3. Sign out, then sign in with the email and password.<br/>"
  "4. Repeat with a wrong password.",
  "The account is created and the name and phone entered at registration appear later in Profile. Sign-in succeeds "
  "with the correct password and is refused with a clear error otherwise. <i>The emailed verification code needs "
  "the mail server (see scope); sign-in itself does not depend on it.</i>"),
 ("A5<br/>FS-06",
  "1. On the staff portal select Forgot Password and enter a staff email.<br/>"
  "2. Read the response.<br/>"
  "3. On the customer Sign In screen select Forgot Password and enter the registered email.",
  "The system states clearly that password reset needs the mail server rather than failing silently or appearing to "
  "send. Normal sign-in is unaffected. <i>Known limit — see scope.</i>"),
 ("A6<br/>SE-07",
  "1. Sign in as Administrator and open Orders.<br/>"
  "2. Select Logout.<br/>"
  "3. Press the browser Back button, then paste the staff portal address into the address bar.",
  "The login screen is shown and no protected data is visible without signing in again."),
 ("A7<br/>SE-03,<br/>SE-04",
  "1. Sign in as Super Administrator and open <b>Audit Trail</b>.<br/>"
  "2. Confirm the sign-ins from A1–A3 are listed with who, role, area, action and time.<br/>"
  "3. Filter with the From and To date boxes, the Role list, the Area list and the search box.<br/>"
  "4. Click any row to open the entry in full, then use Copy as text.<br/>"
  "5. Select Export CSV and open the file.<br/>"
  "6. Sign in with a deliberately wrong password, then return to the trail.",
  "Every action is recorded with the person, their role, the area, what changed and the exact time. Filters narrow "
  "the list and the count beside them follows. The entry view shows the full detail, the actor's email and the "
  "entry id. The CSV opens with readable columns. The rejected sign-in is recorded, and the password typed is not."),
 ("A8<br/>MA-04",
  "1. Still in Audit Trail, read the retention line under the log.<br/>"
  "2. Using Keep for, change retention to 90 days and read the confirmation.<br/>"
  "3. Confirm, then set it back to 1 year.<br/>"
  "4. Check the trail for a record of the change.",
  "The policy is stated in plain words. Shortening retention warns that older entries will be permanently deleted "
  "and asks for confirmation. Both changes are themselves recorded in the trail, and the change is written before "
  "it takes effect."),
]),

("B. Customer Website (Online Ordering)", [
 ("B1<br/>FS-01,<br/>IC-01",
  "1. Open the customer website.<br/>"
  "2. Scroll through the hero, Best Sellers, SugarLoom Boxes, Our Story, FAQ and Contact sections.<br/>"
  "3. Click BEST COOKIES, ABOUT, FAQ and CONTACT US in the top navigation.<br/>"
  "4. In the footer, click All Cookies, Brownies, Cupcakes, Boxes, Our Story, FAQ, Contact Us and Delivery Info.",
  "Every section displays. Each navigation link scrolls to its section with the heading visible, not hidden behind "
  "the fixed bar. Each footer Shop link opens the shop filtered to that category and Boxes opens the box view; "
  "Delivery Info opens the delivery question in the FAQ."),
 ("B2<br/>FS-01,<br/>FS-02",
  "1. Open Shop All.<br/>"
  "2. Click the tabs All, Cookies, Brownies, Cupcakes and Boxes in turn.<br/>"
  "3. Open Fudge Brownies, Matcha Cookies and Vanilla Cupcake.<br/>"
  "4. Narrow the browser window to about 900 px and then to phone width.",
  "Each tab shows only its category. Each product page shows the image, name, price, description, reheating guide, "
  "delivery information and reviews. The page stays centred and readable as the window narrows; the reviews panel "
  "drops below the product rather than being squeezed."),
 ("B3<br/>FS-03",
  "1. Add Fudge Brownies to the cart and open the cart.<br/>"
  "2. Increase the quantity to 3, decrease it to 2, then add Matcha Cookies.<br/>"
  "3. Remove Matcha Cookies.",
  f"The cart shows the right products, quantities (Fudge Brownies ×2 = {PH}160) and subtotal. Every change "
  "updates the order summary and the cart counter."),
 ("B4<br/>FS-04",
  "1. With three pieces in the cart (Fudge Brownies ×2 and Matcha Cookies ×1), select Checkout.<br/>"
  "2. Read the message.<br/>"
  "3. Add one Vanilla Cupcake to reach four pieces and select Checkout.<br/>"
  "4. Empty the cart, add <b>one Fudge Brownies Box</b> on its own and select Checkout.<br/>"
  "5. Add two cupcakes to that box order and select Checkout again.",
  "At three pieces checkout is blocked and the message names the shortfall — “you have 3. Add 1 more, or "
  "any box”. At four pieces it proceeds. A box on its own proceeds, because a box is exempt from the minimum, "
  "and adding more to a box order never blocks it."),
 ("B5<br/>FS-07,<br/>IC-03",
  "1. At checkout open the delivery calendar and select a valid date.<br/>"
  "2. Try a past date and a Sunday (the FAQ states Monday to Saturday, 8:00 AM to 5:00 PM).<br/>"
  "3. Select each time slot: 8–11 AM, 11 AM–2 PM, 2–5 PM.<br/>"
  "4. Enter the address, region and city, then clear the address and try to continue.",
  "The date, slot, address and region appear in the order summary. Unavailable dates are not accepted. A blank "
  "address is blocked and the missing field is named. Region and city are chosen from lists, so the city always "
  "matches its region."),
 ("B6<br/>FS-33",
  "1. With Order A in the cart, enter the near Manila address and note the delivery fee.<br/>"
  "2. Change to the distant Metro Manila address and note the fee.<br/>"
  "3. Change to the out-of-range address and try to place the order.",
  f"The fee is worked out from the geocoded address and lands on one of the published bands — {PH}50, {PH}80, "
  f"{PH}120, {PH}170 or {PH}250 — is higher for the distant address, and is included in the total. Beyond 25 km "
  "the order cannot be placed and the reason is given."),
 ("B7<br/>FS-08,<br/>FS-09",
  "1. Sign in as the returning customer.<br/>"
  f"2. Check out Order A ({PH}305) and open the payment step.<br/>"
  f"3. Go back, check out Order C ({PH}2,050) and open the payment step.",
  f"For Order A both Cash on Delivery and GCash are offered. For Order C, Cash on Delivery is withdrawn with a "
  f"reason — orders over {PH}2,000 must be paid online — and only GCash remains."),
 ("B8<br/>FS-34",
  f"1. As the fresh customer open the payment step for Order A ({PH}305), then for Order B ({PH}840).<br/>"
  "2. As the returning customer, place two orders and cancel both.<br/>"
  "3. Start a new checkout with Order A and open the payment step.",
  f"On a first order Cash on Delivery is offered for Order A but withdrawn for Order B, because Cash on Delivery is "
  f"capped at {PH}800 until one order has been completed. After two cancellations Cash on Delivery is withdrawn "
  "altogether and GCash remains."),
 ("B9<br/>FS-09,<br/>SA-01",
  "1. Choose GCash and read what the page shows beneath the QR code.<br/>"
  "2. Try to place the order with no screenshot attached.<br/>"
  "3. <b>Drag</b> the valid receipt onto the upload box, and separately try <b>Ctrl+V</b> with a screenshot on the "
  "clipboard.<br/>"
  "4. Read the checks the reader reports.<br/>"
  "5. Replace it with the mismatched receipt, then with the photo that is not a receipt.",
  "The shop's account is shown as <b>GCASHMOJO</b> with its number. The order cannot be placed without a "
  "screenshot. Drag and paste both work and the box highlights while a file is over it. The reader reports what it "
  "found — that it looks like a GCash receipt, the reference number, whether the amount matches the order, "
  "whether it was sent to GCASHMOJO and whether it is dated recently. The mismatched amount and the non-receipt "
  "are both called out. A failed reading does not block the customer."),
 ("B10<br/>FS-10,<br/>FS-11",
  "1. Place Order A with the valid receipt.<br/>"
  "2. Note the confirmation and the reference number.<br/>"
  f"3. Compute 2 × {PH}80 + 1 × {PH}70 + 1 × {PH}75 = {PH}305 and add the delivery fee shown.",
  f"The order is time-stamped with a unique WEB-prefixed reference. The total equals {PH}305 plus the delivery fee. "
  "The order is created as Pending with the payment awaiting verification."),
 ("B11<br/>FS-12",
  "1. Open the notification bell and the Orders page.<br/>"
  "2. Have staff verify the payment, then move the order through Confirmed, Baking, Ready for Packing, Packing and "
  "On the Way (Part II, C).<br/>"
  "3. Watch the tracker and the bell after each step without reloading.<br/>"
  "4. Click one notification.<br/>"
  "5. Select Clear all.",
  "The tracker (Order Placed, Confirmed, Baking, Packing, On the Way, Delivered) and the notifications follow the "
  "real status, including a notification when the payment is accepted. Clicking a notification opens <b>that</b> "
  "order and highlights its card rather than the top of the list. Clear all empties the panel."),
 ("B12<br/>FS-13",
  "1. In Orders select an eligible order and choose Cancel.<br/>"
  "2. Pick a reason and submit.<br/>"
  "3. As Administrator open Orders, Cancel Requests.",
  "The order shows Cancel Requested for the customer and appears under Cancel Requests for the Administrator with "
  "the reason."),
 ("B13<br/>FS-14",
  "1. Open Profile.<br/>"
  "2. Check that the name and phone entered at registration are already filled in.<br/>"
  "3. Review saved addresses, orders, reviews and buy-again suggestions.<br/>"
  "4. Edit the contact details and one address, save, and reopen Profile.",
  "All sections display, the registration details are carried over, and the edits persist after reopening."),
 ("B14<br/>FS-15,<br/>IC-04",
  "1. Open the SugarLoom Assistant.<br/>"
  "2. Use the quick actions for availability, pricing and delivery.<br/>"
  "3. Type in English: <i>Do you deliver to Quezon City?</i><br/>"
  "4. Type in Filipino: <i>Magkano ang Matcha Cookies?</i><br/>"
  "5. Ask something complex, such as a wedding order of 500 cookies.",
  "Replies come from the built-in keyword responses, are relevant and consistent with the bakery's information in "
  "both languages, and the complex question is redirected to the owners."),
 ("B15<br/>IC-05",
  "1. Open each of the five FAQ items.<br/>"
  "2. Read the Email, Phone and Facebook cards in Contact Us and click each link.<br/>"
  "3. Send a message through Send us a quick message.<br/>"
  "4. Try again with the message left empty.",
  "Each FAQ answer expands and is readable. The phone card shows one number and the “Call or text us” "
  "link dials <b>that same number</b>; the email link writes to the address shown. The message submits with a "
  "confirmation and an empty message is rejected."),
 ("B16<br/>FS-16",
  "1. As a customer with a completed order, submit a review (rating and comment).<br/>"
  "2. Open the product page as a signed-out visitor.",
  "The review is held for approval and does not appear on the product page until an administrator approves it."),
]),

("C. Order and Queue Management", [
 ("C1<br/>IC-06",
  "1. Sign in as Administrator and open Orders.<br/>"
  "2. Click each tab: Pending, Confirmed, Baking, Ready for Packing, Packing, Ready for Book, Completed, Fulfilled, "
  "Cancel Requests, Archived.<br/>"
  "3. Compare each tab's count with the rows listed.",
  "Each tab lists only orders in that status and its count matches."),
 ("C2<br/>FS-19,<br/>SA-01",
  "1. Open the order placed in B10, still Pending.<br/>"
  "2. Review the customer, delivery, payment and item details against what was entered.<br/>"
  "3. <b>Before verifying the payment</b>, try to Confirm the order.",
  "The details match the submitted order. Confirm is unavailable while the GCash payment is unverified, and the "
  "reason is given — confirming is what commits the ingredients, so it waits for the payment."),
 ("C3<br/>FS-09,<br/>SE-03",
  "1. In the order, open the <b>GCash payment</b> panel.<br/>"
  "2. Compare the screenshot, the reference number and the amount read against the order total.<br/>"
  "3. Select <b>Payment received</b> and read the confirmation.<br/>"
  "4. Place a second order using the <b>same</b> receipt and open its payment panel.<br/>"
  "5. Check the Audit Trail.",
  "The panel shows the screenshot full size, the reference, the amount read beside the order total, and each check. "
  "Verifying asks you to confirm against the GCash history rather than the picture. The second order is flagged "
  "because the same reference is already on another order — one payment cannot settle two orders. Both "
  "decisions appear in the Audit Trail."),
 ("C4<br/>FS-09,<br/>SA-03",
  "1. On another GCash order, select <b>Reject payment</b>.<br/>"
  "2. Try to confirm with the reason left blank, then with one or two words.<br/>"
  "3. Enter a real reason and confirm.<br/>"
  "4. Check the order status, the customer's Orders page and the notification bell.",
  "A reason is required; a blank or very short one is refused and the dialog stays open. On confirmation the order "
  "is <b>cancelled</b>, not left Pending. The customer is told once — one notification carrying the reason, "
  "saying the order is cancelled and that nothing has been charged — and the order stays on their list with "
  "that explanation instead of silently disappearing."),
 ("C5<br/>FS-38",
  "1. In Orders, move at least three Confirmed orders into a new sequence.<br/>"
  "2. Sign in as Baker and open the bake queue.",
  "The new sequence is saved and the Baker sees the same order."),
 ("C6<br/>FS-20",
  "1. As Baker, open the bake queue and open an order.<br/>"
  "2. Review the per-ingredient amounts.<br/>"
  "3. Select Prepare Order, then Done Baking.<br/>"
  "4. Use the queue actions to send an order to the back and to hand one back a step with a reason.<br/>"
  "5. As Administrator check the status and time stamps.",
  "The order shows Baking, then Ready for Packing. Each update is time-stamped and visible to the Administrator, "
  "and ingredient consumption is recorded. The queue runs oldest first and both queue actions work with a reason."),
 ("C7<br/>FS-21",
  "1. As Packer, open the packing queue and open the order.<br/>"
  "2. Select Start Packing, then Done Packing, then Ready to Book.<br/>"
  "3. Review the customer, delivery and payment details shown.",
  "The order moves through Packing to Ready for Book and the details are shown to the Packer."),
 ("C8<br/>FS-22",
  "1. As Administrator, open Ready for Book and open the order.<br/>"
  "2. Select Book Lalamove (simulator).<br/>"
  "3. Review the reference number, tracking link and status.<br/>"
  "4. Select Mark Fulfilled, then Archive and confirm.",
  "A simulated reference, tracking link and Finding Driver status appear; the order becomes Fulfilled, then moves "
  "to Archived after confirmation."),
 ("C9<br/>FS-23",
  "1. Place and confirm two orders and have the customer request cancellation for both.<br/>"
  "2. Open Cancel Requests, open the first and accept it.<br/>"
  "3. Open the second and reject it.<br/>"
  "4. Check ingredient stock and product capacity.",
  "The accepted order becomes Cancelled and stock and capacity are restored. The rejected one returns to Pending "
  "and the customer is told the request was not accepted."),
 ("C10<br/>FS-24",
  "1. Open Orders, Cancelled and select a GCash-paid order.<br/>"
  "2. Select Process Refund, enter a GCash number, a reference number and notes.<br/>"
  "3. Confirm.",
  "The order is marked Refunded and the refund badge is displayed."),
 ("C11<br/>SA-02,<br/>SA-04",
  "1. Place an order with tomorrow's delivery date and leave it Pending.<br/>"
  "2. Look at the order row and the notification bell.<br/>"
  "3. Ask the research team to move the delivery date into the past (or use an order already past its date).<br/>"
  "4. Reload Orders.",
  "The row is flagged DUE TOMORROW, then DUE TODAY, then LATE as the date passes, and a notification is raised at "
  "each step rather than one that was already dismissed. A past-due unfinished order is <b>not</b> archived away: "
  "it stays in its tab under a red banner telling the Administrator to contact the customer or cancel. Only "
  "Fulfilled and Cancelled orders are archived automatically."),
 ("C12<br/>PE-05,<br/>FS-12",
  "1. Keep the Administrator Orders view and the customer Orders page open in two windows, on two devices if "
  "possible.<br/>"
  "2. As Baker or Packer, update an order's status.<br/>"
  "3. Watch both windows without reloading.",
  "The new status appears for the Administrator and in the customer's notifications within a few seconds and "
  "without a manual reload — including when the customer is on a different device."),
 ("C13<br/>FS-35",
  "1. On the customer site send a message through Send us a quick message.<br/>"
  "2. As Administrator open Messages and open it.",
  "The message appears with the sender's details and full content."),
]),

("D. Products and Inventory Management", [
 ("D1<br/>FS-18,<br/>MA-01",
  "1. As Administrator open Products and select Add Product.<br/>"
  "2. Enter name, category, flavour, price, daily limit, description, low-stock level, image and the per-unit "
  "recipe; save.<br/>"
  "3. Edit the price and description, save, and reopen the product.",
  "The product is saved with its recipe and the edits persist."),
 ("D2<br/>FS-18",
  "1. Deactivate the new product.<br/>"
  "2. Use the Category filter and the Status filter.<br/>"
  "3. Open Shop All on the customer site.",
  "The product becomes Inactive and is hidden from customers; the filters return the right items."),
 ("D3<br/>SA-04",
  "1. Set Matcha Cookies' daily limit to 10.<br/>"
  "2. Place orders totalling 8 pieces and check the remaining capacity.<br/>"
  "3. Try to order 5 more.",
  "Remaining capacity falls to 2. The order of 5 is prevented or the customer is warned, and capacity stays "
  "correct."),
 ("D4<br/>FS-26",
  "1. Open Inventory and select Add Ingredient.<br/>"
  "2. Enter name, unit, stock, full-stock capacity and the <b>reorder point as a percentage</b> of full stock; "
  "save.<br/>"
  "3. Select Adjust Stock, add a quantity with a note, then subtract one with a note.<br/>"
  "4. Use the ingredient category filter.",
  "The ingredient is saved and the reorder point is stored as a percentage, with the equivalent quantity shown. "
  "Stock changes are logged with their notes and the filter shows the right category."),
 ("D5<br/>FS-25",
  "1. Note an ingredient's stock and a product's remaining capacity.<br/>"
  "2. Place an order, confirm it, then have the Baker select Prepare Order.<br/>"
  "3. Check stock and capacity after <b>each</b> step.<br/>"
  "4. Place a second order, confirm it, accept its cancellation, and check again.",
  "Capacity reduces when the order is placed. Ingredients are <b>not</b> touched at confirmation — they are "
  "deducted when baking starts — and both are restored on an accepted cancellation. Deducting twice for one "
  "bake is prevented."),
 ("D6<br/>SA-05",
  "1. Lower one recipe ingredient below the amount an order needs.<br/>"
  "2. As Baker open the order and select Prepare Order.<br/>"
  "3. Check the ingredient stock and the stock log.",
  "A warning appears, the stock is set to zero rather than going negative, baking is not blocked, and the movement "
  "is recorded."),
 ("D7<br/>FS-27",
  "1. Set Cream Cheese's reorder point to 50 percent of full stock.<br/>"
  "2. Adjust its stock down to that level.<br/>"
  "3. Open the Dashboard and the Inventory indicator.",
  "A low-stock alert appears on the Dashboard and on the Inventory indicator for that ingredient."),
 ("D8<br/>FS-37,<br/>SA-02",
  "1. With Cream Cheese at or below its reorder point, reload Inventory and read the alert.<br/>"
  "2. Open the restock form from the badge or the notification.<br/>"
  "3. Change one order quantity, untick one ingredient and remove another.<br/>"
  "4. Add an ingredient that is <b>not</b> low using Add another ingredient.<br/>"
  "5. Fill in supplier, contact and needed-by, then Save draft and reload Inventory.<br/>"
  "6. Open it again and select Confirm &amp; send; try first with nothing ticked.<br/>"
  "7. View the sent form and print it.",
  "A shortage raises a <b>Draft</b> and alerts the admin; it is a proposal and is never sent on its own. The draft "
  "is editable and the edits survive a reload — a removed line is not put back. Sending is refused with "
  "nothing ticked or a zero quantity, and asks for confirmation naming the real quantities. The printed form shows "
  "the suggested quantity beside the quantity actually ordered and who confirmed it. Sending moves no stock."),
]),

("E. Dashboard, Reports, Reviews, and Website Content", [
 ("E1<br/>FS-17",
  "1. Open the Dashboard.<br/>"
  "2. Compare Total Products, Total Orders, Pending Orders and the low-stock alerts with the Products, Orders and "
  "Inventory modules.",
  "Each summary card equals the count in its module."),
 ("E2<br/>FS-17",
  "1. On the Dashboard review Pending Orders, Recent Activity and Top Products.<br/>"
  "2. Place one new order and reload.",
  "The sections reflect the recorded data and the new order appears in Pending Orders and Recent Activity."),
 ("E3<br/>FS-28",
  "1. Open Reports.<br/>"
  "2. Using the <b>From</b> and <b>To</b> boxes in the header, select a range covering today, then a range covering "
  "the whole week, then a single past day.<br/>"
  "3. Leave <b>From</b> set and clear <b>To</b>, then use Clear.<br/>"
  "4. Compare Total Revenue, Transactions, Items Sold and Avg. Order Value with the completed orders in the range.",
  "The figures equal the totals of the recorded transactions inside the range. Both ends are inclusive. An open end "
  "reads as “since”; Clear shows everything. Picking a From date limits what the To picker offers."),
 ("E4<br/>FS-28",
  "1. With a one-day range, read the Revenue Trend chart.<br/>"
  "2. Widen the range to a month, then to a year.<br/>"
  "3. Review the Best Sellers list and compare with completed orders.",
  "The chart's x-axis follows the range — three-hour slots for a single day, one point per day for a month, "
  "weekly and then monthly for longer. The chart and list reflect recorded sales and the top item is the one sold "
  "most."),
 ("E5<br/>FS-29,<br/>CO-05",
  "1. Open Transaction Reports History and set a From–To range.<br/>"
  "2. Note the “n of m” count beside the filter.<br/>"
  "3. Select Export CSV and open the file in Excel or Google Sheets.<br/>"
  "4. Compare five rows with the on-screen transactions.",
  "The range narrows the table and the count follows. The CSV downloads, the columns are readable, and the rows "
  "match what is on screen."),
 ("E6<br/>FS-30",
  "1. Open the Ingredients &amp; Raw Materials Report and set a range.<br/>"
  "2. Pick an ingredient used earlier and compare current stock, quantity used, quantity restocked and last "
  "movement with the stock log.",
  "The values match the stock log entries for that range."),
 ("E7<br/>FS-31",
  "1. Open Customers and search for the test customer by name.<br/>"
  "2. Open the record.<br/>"
  "3. As Super Administrator, check the Audit Trail afterwards.",
  "The name, phone number, email, address, total spent and order history are correct. Opening a customer's record "
  "is recorded in the Audit Trail as an access to personal data; simply moving between pages is not."),
 ("E8<br/>FS-16",
  "1. Open Reviews and the Pending list.<br/>"
  "2. Approve one review and reject another.<br/>"
  "3. Open the product page on the customer site.",
  "The approved review appears on the product; the rejected one does not."),
 ("E9<br/>FS-36,<br/>MA-03",
  "1. As <b>Administrator</b> open Content.<br/>"
  "2. Edit the hero text, the photo and a highlight, and select Save changes.<br/>"
  "3. Select View site.<br/>"
  "4. Change the contact phone number, save, and check the Contact card, the footer and the shop page.<br/>"
  "5. Clear one field, save, and view the site again.",
  "The edits appear on the homepage. The phone number set once appears in all three places and the "
  "“Call or text us” link dials it. An empty field keeps the original wording rather than showing blank."),
]),
]

# ── Part III ──────────────────────────────────────────────────────────
# (group title, definition, [(id, statement, procedure, expected)])

PART3 = [
("A. Functional Suitability",
 "The system's capability to provide functions that meet the stated and implied needs of its intended users when "
 "used under specified conditions.",
 [("FS-1", "The system provides all functions needed for bakery operations, from online ordering to delivery "
           "booking, inventory and reports. [functional completeness]",
   "1. As the fresh customer place Order A with GCash and a receipt.<br/>"
   "2. As Administrator verify the payment and confirm; as Baker Prepare Order and Done Baking; as Packer Start "
   "Packing, Done Packing and Ready to Book.<br/>"
   "3. As Administrator Book Lalamove, Mark Fulfilled and Archive.<br/>"
   "4. Check the Dashboard, Inventory, Reports and the Audit Trail.",
   "Every stage completes inside the system with no missing function. The archived order is counted in Reports, "
   "ingredient stock reflects it, and the whole sequence is traceable in the Audit Trail."),
  ("FS-2", "The system produces correct results for totals, payment rules, inventory deductions and report "
           "figures. [functional correctness]",
   f"1. Compute 2 × {PH}80 + 1 × {PH}70 + 1 × {PH}75 = {PH}305 and add the delivery fee shown.<br/>"
   "2. Compare with the order total in Orders and the revenue in Reports for a range covering today.<br/>"
   "3. Compare ingredient stock before and after baking with the recipe amounts.",
   f"The order total equals {PH}305 plus the fee, Reports include it, and ingredients are deducted by exactly the "
   "recipe amounts."),
  ("FS-3", "The functions provided are appropriate for accomplishing the intended tasks. [functional "
           "appropriateness]",
   "1. Count the steps from the homepage to a placed order.<br/>"
   "2. Count the steps for staff from verifying a payment to archiving.<br/>"
   "3. Note any input requested twice or any step with no purpose.",
   "Each task is done in a reasonable number of steps, registration details and saved addresses are reused, and no "
   "input is asked for without being used.")]),

("B. Performance Efficiency",
 "The system's capability to perform its functions within specified time and throughput parameters and to be "
 "efficient in its use of resources under specified conditions.",
 [("PE-1", "The system responds and processes orders within an acceptable time. [time behaviour]",
   "1. On a connection of at least 10 Mbps open the browser's Network tab or use a stopwatch.<br/>"
   "2. Time the homepage load, opening Shop All and a product, adding to cart, Place Order (including the receipt "
   "reading) and the staff Dashboard.",
   "The homepage is usable within about 3 seconds and each other action responds without excessive delay. Reading "
   "a receipt shows progress while it works rather than appearing frozen."),
  ("PE-2", "The system operates without consuming excessive device or browser resources. [resource utilization]",
   "1. Open Chrome's Task Manager (Shift+Esc).<br/>"
   "2. Keep the homepage open with the Assistant, cart and notification panel in use for 5 minutes and note memory "
   "and CPU.<br/>"
   "3. Repeat with the staff Dashboard and Orders, which poll every few seconds.",
   "Memory and CPU stay reasonable and do not climb steadily; no unresponsive-page warning appears."),
  ("PE-3", "The system handles the expected volume of orders and records without slowing down. [capacity]",
   "1. Create at least 10 valid orders using different products.<br/>"
   "2. Open each Orders tab, the Dashboard and Reports, and search for a specific order.<br/>"
   "3. Open the Audit Trail, which by then holds many entries, and filter it.",
   "All 10 orders are listed, counts are correct, and the pages and the trail stay responsive.")]),

("C. Compatibility",
 "The system's capability to exchange information with other products and to perform its required functions while "
 "sharing the same environment and resources.",
 [("CO-1", "The system runs properly alongside other applications on the same device without conflict. "
           "[co-existence]",
   "1. Open the customer site while a video plays in another tab and another website is loaded.<br/>"
   "2. Add four products, use the Assistant, and open Checkout.<br/>"
   "3. Upload a receipt while the other tabs are still busy.<br/>"
   "4. Click the Facebook link and return.",
   "Cart, notifications, checkout and the receipt reading all work with no conflict or visible slowdown; the "
   "Facebook page opens separately."),
  ("CO-2", "The system can exchange or export data with other tools where needed. [interoperability]",
   "1. Export the transaction CSV and the Audit Trail CSV and open both in Excel or Google Sheets.<br/>"
   "2. Check the simulated Lalamove reference and tracking link.<br/>"
   "3. Check the GCash QR code and account shown at payment.<br/>"
   "4. Click the email, phone and Facebook links in Contact Us.<br/>"
   "5. Print a restock form to PDF.",
   "Both CSVs open with readable columns and accurate values. Booking and payment details display as designed. The "
   "contact links open the right applications and the printed form keeps its layout. <i>Emails do not arrive — "
   "see scope.</i>")]),

("D. Interaction Capability",
 "The system's capability to be interacted with by specified users, exchanging information between user and system "
 "through the interface, to complete the intended task.",
 [("IC-1", "It is easy to recognize what the system does and whether it fits the task at hand. [appropriateness "
           "recognizability]",
   "1. Ask a person who has not seen the site to open the homepage.<br/>"
   "2. Within 30 seconds they state what is sold and find BEST COOKIES, Sign In and the cart.",
   "The purpose and the key controls are found without help."),
  ("IC-2", "The system is easy to learn, even for first-time users. [learnability]",
   "1. A first-time customer registers, adds four products, pays by GCash with a receipt and places the order "
   "without help.<br/>"
   "2. A first-time Baker finds an order in the bake queue and completes Prepare Order and Done Baking.",
   "Both tasks are completed unaided on the first attempt, including the receipt upload."),
  ("IC-3", "The system is easy to operate and control. [operability]",
   "1. On desktop and a phone use the navigation links, category tabs, quantity controls, the delivery calendar and "
   "slots, the receipt upload, the notification bell and Clear all, the Assistant, and the FAQ.<br/>"
   "2. In the staff portal use the sidebar, the order tabs, the From–To filters and the modals.",
   "Every control responds as expected, behaves consistently, and can be undone or closed."),
  ("IC-4", "The system helps prevent mistakes and confirms before critical actions. [user error protection]",
   "1. Try checkout with three pieces, a blank address, a quantity of 0 and −1, and GCash with no receipt.<br/>"
   "2. As Administrator begin — and stop before confirming — rejecting a payment, accepting a "
   "cancellation, archiving an order, deactivating a user and shortening audit retention.",
   "Invalid input is blocked with a clear message. A confirmation explaining the consequence appears before each "
   "critical action, and the ones that destroy data say what will be lost."),
  ("IC-5", "Labels, status badges, and prompts are understandable without outside help. [self-descriptiveness]",
   "1. Read the sidebar names, order tab names and status badges from Pending to Archived.<br/>"
   "2. Read the payment, LATE and restock badges, the tracker steps, and the validation messages seen during "
   "testing.",
   "Every label and message is understandable without a manual and leads to the intended page or action."),
  ("IC-6", "The interface is pleasant, consistent, and engaging to use. [user engagement]",
   "1. Scroll the homepage from hero to footer.<br/>"
   "2. Check fonts, colours, spacing and image loading.<br/>"
   "3. Open Shop All and a product page on a wide monitor.",
   "The design is consistent and readable across pages, images load, and content stays centred on a wide screen "
   "instead of hugging one edge."),
  ("IC-7", "The system can be used by people with different needs, devices, and languages. [inclusivity]",
   "1. Zoom the browser to 200 percent and review the homepage and checkout.<br/>"
   "2. Move through the navigation and checkout using only Tab and Enter.<br/>"
   "3. Check the contrast of buttons and small text, and whether status is shown by more than colour alone.<br/>"
   "4. Ask the Assistant in Filipino: <i>Mayroon bang delivery sa Maynila?</i>",
   "Content stays readable and usable at 200 percent, main controls are keyboard reachable, contrast is adequate, "
   "status is not conveyed by colour alone, and Filipino is understood."),
  ("IC-8", "The FAQ, Contact form, and SugarLoom Assistant help users complete tasks. [user assistance]",
   "1. Open all five FAQ items.<br/>"
   "2. Use the Assistant quick actions and one typed question.<br/>"
   "3. Send a message through Send us a quick message.<br/>"
   "4. Compare the answers with how the system actually behaves.",
   "Help is easy to find, the answers are understandable and consistent with actual behaviour, and complex "
   "questions are redirected to the owners.")]),

("E. Reliability",
 "The system's capability to perform specified functions under specified conditions for a specified period of time "
 "without interruptions and failures.",
 [("RE-1", "The system operates consistently without crashing or failing during use. [faultlessness]",
   "1. Complete the full order lifecycle (see FS-1) in the customer, Baker, Packer, Administrator and Super "
   "Administrator views.<br/>"
   "2. Note any crash, blank page or unexpected error, and keep the browser console open.",
   "No crash, blank page or unexpected error occurs, and the console shows no uncaught errors."),
  ("RE-2", "The system is available and accessible whenever it is needed. [availability]",
   "1. Open the customer site and the staff portal at three different times across the testing period.<br/>"
   "2. Leave a signed-in session idle for 15 minutes and continue working.",
   "Both are reachable each time and the idle session continues or asks to sign in again cleanly."),
  ("RE-3", "The system keeps working properly despite invalid inputs or minor errors. [fault tolerance]",
   "1. Sign in with a wrong password and a nonexistent email.<br/>"
   "2. Send the Contact form empty and enter a very long address.<br/>"
   "3. Upload a very large image and a file that is not an image as a receipt.<br/>"
   "4. Click Place Order five times quickly.",
   "Invalid input is rejected with a clear message, a non-image is refused as a receipt, only one order is created "
   "from the repeated clicks, and the system keeps working."),
  ("RE-4", "The system recovers data and status correctly after interruptions or cancellations. [recoverability]",
   "1. Add four products, refresh, then sign out and in.<br/>"
   "2. Begin checkout and close the tab before Place Order; check Orders, capacity and stock.<br/>"
   "3. Accept a cancellation and check stock and capacity.<br/>"
   "4. Delete an order as Administrator, then reload the panel.",
   "The cart persists, no half-made order exists, and stock and capacity are restored after the cancellation. A "
   "deleted order stays deleted after a reload rather than reappearing.")]),

("F. Security",
 "The system's capability to protect information and data so that persons or other products have data access "
 "appropriate to their types and levels of authorization, and to defend against attack patterns by malicious actors.",
 [("SE-1", "The system protects data so that only authorized users can access it. [confidentiality]",
   "1. Sign in as customer A and copy the Orders page address.<br/>"
   "2. Sign in as customer B and paste it.<br/>"
   "3. As Baker try to open Reports; as Administrator try to open Users and the Audit Trail.",
   "A customer sees only their own orders and profile. The Baker is confined to Orders, and the Administrator "
   "cannot reach staff accounts or the log of their own actions."),
  ("SE-2", "The system prevents unauthorized changes to orders, products, inventory, and accounts. [integrity]",
   "1. While signed out, try to open the staff portal by address.<br/>"
   "2. As Baker or Packer try to edit a product price or adjust stock, by menu and by calling the view from the "
   "console.<br/>"
   "3. As Administrator try to grant yourself the Super Administrator role.",
   "Unauthorized modification is prevented and the data is unchanged. The Administrator cannot reach Users at all, "
   "so the role cannot be self-granted."),
  ("SE-3", "Actions taken in the system cannot later be denied by the user who performed them. [non-repudiation]",
   "1. As Administrator verify a payment, reject another and confirm an order; as Baker mark Done Baking; as "
   "Packer mark Done Packing.<br/>"
   "2. As Super Administrator open the Audit Trail and find each action.<br/>"
   "3. Open one entry in full.",
   "Each action is recorded with the person, their role, the area, what changed from and to, and the time to the "
   "second. The entry view also shows the actor's email and the entry id."),
  ("SE-4", "Orders and user activities are recorded and can be traced to the responsible user. [accountability]",
   "1. After SE-3, open the Audit Trail, the order's status history and the stock log.<br/>"
   "2. Identify who or what caused each change.<br/>"
   "3. Try to edit or delete an audit entry from the panel.",
   "Every change can be traced to its cause. The panel offers no way to edit or delete an audit entry; the trail is "
   "append-only."),
  ("SE-5", "Login and email verification correctly confirm the identity of users. [authenticity]",
   "1. Sign in as staff and as a customer with valid credentials.<br/>"
   "2. Repeat with an invalid password and with a deactivated account.<br/>"
   "3. As Super Administrator check how the failures were recorded.",
   "Valid credentials authenticate. Invalid ones and deactivated accounts are rejected without revealing which part "
   "was wrong. Rejected sign-ins are recorded against the account, and the password typed is never stored. "
   "<i>The emailed code needs the mail server — see scope.</i>"),
  ("SE-6", "The system resists unauthorized access to restricted pages and functions. [resistance]",
   "1. Open staff page addresses while signed out, then log out and press Back.<br/>"
   "2. Type plain markup such as &lt;b&gt;test&lt;/b&gt; and &lt;img src=x onerror=alert(1)&gt; into the Contact "
   "message, the delivery address and a cancellation reason.<br/>"
   "3. As Administrator open the order and the message containing them.",
   "Access is denied or redirected and the session has ended. The markup is shown as plain text everywhere it is "
   "displayed back, in the staff panel as well as on the customer site, and no script runs.")]),

("G. Maintainability",
 "The system's capability to be modified by its intended maintainers with effectiveness and efficiency.",
 [("MA-1", "The system is organized into clear modules (Products, Orders, Baker and Packer queues, Inventory, "
           "Reports, Content, Users, Audit Trail, Reviews, Messages) that can be updated independently. [modularity]",
   "1. Edit a product, add an ingredient, change a content item and edit a user, one at a time.<br/>"
   "2. After each change check the other modules for side effects.",
   "A change in one module does not disturb the others."),
  ("MA-2", "Interface components are built so they can be reused across the system. [reusability]",
   "1. Compare product cards, modals, tables, status badges, confirmation dialogs and the From–To date filters "
   "between the customer site and the staff modules.<br/>"
   "2. Optionally inspect the page with the browser's developer tools.",
   "The same components look and behave consistently wherever they appear; the date filter is the same control in "
   "every report."),
  ("MA-3", "When issues occur, their cause can be identified and diagnosed with reasonable effort. [analysability]",
   "1. Trigger the ingredient shortage warning (see D6).<br/>"
   "2. Trace it using the warning, the stock log and the Audit Trail.<br/>"
   "3. Reject a payment and trace the resulting cancellation the same way.",
   "The cause can be identified from the messages, the logs and the status history without guesswork, and the "
   "cancellation can be traced back to the payment decision that caused it."),
  ("MA-4", "Records and settings can be modified without affecting other parts or changing source code. "
           "[modifiability]",
   "1. Edit a price, description, recipe, daily limit, reorder percentage, hero text, contact number, a staff role "
   "and the audit retention period.<br/>"
   "2. Reopen each record and the customer site.",
   "Changes persist and no other record is affected. Each of these is a setting, not a code change."),
  ("MA-5", "The system can be effectively tested using its own interface and records. [testability]",
   "1. Run the Part II procedures with the provided accounts and test data.<br/>"
   "2. Verify each outcome through Orders, the stock log, Reports and the Audit Trail.",
   "Each function can be exercised and its outcome verified through the interface.")]),

("H. Flexibility",
 "The system's capability to be adapted to changes in its requirements, contexts of use, or system environment.",
 [("FL-1", "The system adapts correctly to different devices, screen sizes, and platforms. [adaptability]",
   "1. Open the customer site in Chrome, Edge and Firefox on desktop, on Android 10 or higher and on iOS 14 or "
   "higher.<br/>"
   "2. On each, test navigation, the product page, cart, checkout with a receipt upload, and notifications.",
   "The layout adapts at each width without a horizontal scrollbar and the tested functions remain usable on each "
   "device."),
  ("FL-2", "The system can accommodate growth in products, ingredients, orders, and users over time. [scalability]",
   "1. Add three products, three ingredients and five orders.<br/>"
   "2. Use the Products, Inventory and Orders lists, filters and search.<br/>"
   "3. Check that the shop grid reflows as products are added.",
   "New records are accommodated, existing records stay intact and retrievable, and the layouts absorb the extra "
   "items."),
  ("FL-3", "The system can be accessed without complicated setup. [installability]",
   "1. On a device with no prior setup open the customer site and the staff portal using only a browser and the "
   "addresses provided.",
   "No installation or special configuration is needed."),
  ("FL-4", "The system's data can be carried over to another tool if the system is replaced. [replaceability]",
   "1. Export the transaction history CSV and the Audit Trail CSV.<br/>"
   "2. Check they hold the fields needed elsewhere — reference number, date, items, total, payment method; "
   "and for the trail, who, role, area, action and details.",
   "Both exports are complete and readable by other tools.")]),

("I. Safety",
 "The system's capability, under defined conditions, to avoid a state in which human life, health, property, or the "
 "environment is endangered. For this system, the property at risk is orders, stock, and money.",
 [("SA-1", "The system prevents operations that could cause errors or losses. [operational constraint]",
   "1. Check out with three pieces.<br/>"
   "2. Order above a product's remaining daily limit.<br/>"
   f"3. Choose Cash on Delivery on Order C ({PH}2,050) and on a first order above {PH}800.<br/>"
   "4. Try to confirm a GCash order whose payment has not been verified.",
   "Each operation is blocked or warned, remaining capacity stays correct, and an unverified or rejected payment "
   "cannot be confirmed through to the baker."),
  ("SA-2", "The system identifies risks such as low stock before they cause failed orders. [risk identification]",
   "1. Lower an ingredient below its reorder point.<br/>"
   "2. Check the Dashboard, the Inventory indicator, the notification bell and the restock draft.<br/>"
   "3. Leave an order unfinished past its delivery date and check the Orders view.",
   "The low stock is flagged in all three places and a restock draft lists the ingredient with a suggested "
   "quantity. An order past its promised date is flagged LATE with a banner rather than quietly disappearing."),
  ("SA-3", "The system safeguards against data loss and order discrepancies when something goes wrong. [fail safe]",
   "1. Begin checkout and close the tab.<br/>"
   "2. Accept a cancellation.<br/>"
   "3. Let an ingredient run short during baking.<br/>"
   "4. Reject a payment and check the order, the stock and the customer's view.",
   "No half-made order is created, stock and capacity are restored, and a shortage sets stock to zero with a "
   "warning without blocking baking. A rejected payment cancels the order cleanly, returns any committed "
   "ingredients and tells the customer why."),
  ("SA-4", "The system warns the user before performing risky or irreversible actions. [hazard warning]",
   "1. As staff begin, without confirming: rejecting a payment, accepting or rejecting a cancellation, deleting an "
   "order, archiving an order, deactivating a product, deactivating a user, shortening audit retention, and "
   "sending a restock form.",
   "A confirmation explaining the effect appears before each one, and the destructive ones name what will be lost. "
   "Rejecting a payment additionally requires a written reason."),
  ("SA-5", "The system works safely with the services it connects to. [safe integration]",
   "1. Complete a simulated Lalamove booking and a GCash refund record.<br/>"
   "2. Upload a receipt and let the reader run, then disconnect from the network and upload another.<br/>"
   "3. Compare the order status in Orders, the customer tracker and Reports.",
   "Status and records stay consistent across views with no lost or conflicting data. When the reader cannot run, "
   "the upload is still accepted and marked for a person to check rather than failing the order.")]),
]

FEEDBACK = [
 "1. What bugs or errors did you encounter? (Describe the steps to reproduce, if possible.)",
 "2. Which features or screens were confusing or difficult to use?",
 "3. What improvements or additional features would you suggest?",
 "4. Overall comments about the system:",
]

COVERAGE = [
 ("Functional Suitability", "Completeness, correctness, appropriateness", "FS-1 to FS-3"),
 ("Performance Efficiency", "Time behaviour, resource utilization, capacity", "PE-1 to PE-3"),
 ("Compatibility", "Co-existence, interoperability", "CO-1 to CO-2"),
 ("Interaction Capability", "Appropriateness recognizability, learnability, operability, user error protection, "
  "self-descriptiveness, user engagement, inclusivity, user assistance", "IC-1 to IC-8"),
 ("Reliability", "Faultlessness, availability, fault tolerance, recoverability", "RE-1 to RE-4"),
 ("Security", "Confidentiality, integrity, non-repudiation, accountability, authenticity, resistance", "SE-1 to SE-6"),
 ("Maintainability", "Modularity, reusability, analysability, modifiability, testability", "MA-1 to MA-5"),
 ("Flexibility", "Adaptability, scalability, installability, replaceability", "FL-1 to FL-4"),
 ("Safety", "Operational constraint, risk identification, fail safe, hazard warning, safe integration", "SA-1 to SA-5"),
]

SCALE = [
 ("4", "3.26 to 4.00", "Strongly Agree / Excellent"),
 ("3", "2.51 to 3.25", "Agree / Very Good"),
 ("2", "1.76 to 2.50", "Disagree / Fair"),
 ("1", "1.00 to 1.75", "Strongly Disagree / Poor"),
]
