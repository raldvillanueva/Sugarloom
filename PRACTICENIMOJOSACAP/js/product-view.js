let qty = 1;

const INGREDIENTS_MAP = {
  "Chocolate Chip Cookies":     ["Wheat Flour","Butter","White Sugar","Brown Sugar","Eggs","Vanilla Extract","Chocolate Chips","Baking Soda","Salt"],
  "Chocolate Chip Cookies Box": ["Wheat Flour","Butter","White Sugar","Brown Sugar","Eggs","Vanilla Extract","Chocolate Chips","Baking Soda","Salt"],
  "Oatmeal Cookies":            ["Wheat Flour","Rolled Oats","Butter","Brown Sugar","Eggs","Vanilla Extract","Cinnamon","Baking Soda","Salt"],
  "Matcha Cookies":             ["Wheat Flour","Butter","White Sugar","Brown Sugar","Eggs","Matcha Powder","White Chocolate Chips","Baking Soda","Salt"],
  "Fudge Brownies":             ["Wheat Flour","Butter","Sugar","Eggs","Cocoa Powder","Dark Chocolate","Vanilla Extract","Baking Powder","Salt"],
  "Fudge Brownies Box":         ["Wheat Flour","Butter","Sugar","Eggs","Cocoa Powder","Dark Chocolate","Vanilla Extract","Baking Powder","Salt"],
  "Dark Chocolate Brownies":    ["Wheat Flour","Butter","Sugar","Eggs","Dark Cocoa Powder","Dark Chocolate","Vanilla Extract","Espresso Powder","Baking Powder","Salt"],
  "Red Velvet Brownies":        ["Wheat Flour","Butter","Sugar","Eggs","Cocoa Powder","Cream Cheese","Red Food Coloring","Vanilla Extract","Baking Powder","Salt"],
  "Red Velvet Brownies Box":    ["Wheat Flour","Butter","Sugar","Eggs","Cocoa Powder","Cream Cheese","Red Food Coloring","Vanilla Extract","Baking Powder","Salt"],
  "Vanilla Cupcake":            ["Wheat Flour","Butter","Sugar","Eggs","Milk","Vanilla Extract","Baking Powder","Salt","Buttercream Frosting"],
  "Chocolate Cupcake":          ["Wheat Flour","Butter","Sugar","Eggs","Cocoa Powder","Milk","Vanilla Extract","Baking Powder","Salt","Chocolate Frosting"],
  "Strawberry Cupcake":         ["Wheat Flour","Butter","Sugar","Eggs","Milk","Vanilla Extract","Strawberry Jam","Baking Powder","Salt","Strawberry Frosting"],
};

//LOADING PRODUCT
function loadProduct(){
  const data = JSON.parse(localStorage.getItem("selectedProduct"));

  document.getElementById("product-name").innerText = data.name;
  document.getElementById("product-price").innerText = "₱" + data.price;
  document.getElementById("product-img").src = data.img;

  const descEl = document.getElementById("product-desc");
  if(descEl) descEl.innerText = data.description || "Freshly baked premium treat made with love 🍪";

  const boxInfo = document.getElementById("box-info");
  if(boxInfo) boxInfo.style.display = data.name.toLowerCase().includes("box") ? "block" : "none";

  const ingList = document.getElementById("ingredients-list");
  const ingredients = (data.ingredients && data.ingredients.length)
    ? data.ingredients
    : (INGREDIENTS_MAP[data.name] || []);

  if (ingredients.length) {
    ingList.innerHTML = ingredients.map(i => `<li>${i}</li>`).join("");
  } else {
    ingList.innerHTML = "<li>Ingredients not available</li>";
  }

  updateCart();
}

function changeQty(num){
  qty += num;
  if(qty < 1) qty = 1;
  document.getElementById("qty").innerText = qty;
}

// FUNCTION OF THE ADD CART
function addToCart(){
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  const data = JSON.parse(localStorage.getItem("selectedProduct"));

  let existing = cart.find(i => i.name === data.name);

  /* Deliberately no capacity check here. Nothing on this page knows
     the delivery date, and without it there is no question to ask:
     being full today says nothing about next Friday. Refusing the
     add would stop exactly the bulk customer the two-day lead time
     exists for. The cart says what is left and offers a later date,
     and checkout decides against the date actually chosen. */

  if(existing){
    existing.qty += qty;
  } else {
    cart.push({
      name: data.name,
      price: data.price,
      img: data.img,
      qty: qty
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));

  updateCart();

  // 🔥 THIS WAS MISSING
  showToast("Added to cart 🎉");
}

//UPDATING THE CART
function updateCart(){
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  document.getElementById("cart").innerText = cart.length;
}

//GO BACK 
function goBack(){
  window.history.back();
}

//GO TO CART
function goToCart(){
  localStorage.setItem("prevPage", "product");
  window.location.href = "../pages/cart.html";
}

//REHEATING GUIDE AND DELIVERY 
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".acc-header").forEach(header => {
    header.addEventListener("click", () => {
      const item = header.parentElement;
      item.classList.toggle("active"); 
    });
  });
});

//ADD TO CART MESSAGE 
function showToast(text){
  const toast = document.getElementById("toast");
  toast.innerText = text;
  toast.classList.add("show");

  setTimeout(()=>{
    toast.classList.remove("show");
  }, 2000);
}
document.addEventListener("DOMContentLoaded", loadProduct);

// ── REVIEWS ──────────────────────────────────────────────

let selectedStars = 0;

/* Who is writing. The form used to ask for a name, which meant a
   signed-in customer typed one the account already knew, and anyone
   at all could post under any name they liked. Both go away together:
   the name comes from the account, and without an account there is no
   form — only the reviews, which read the same signed in or out. */
function reviewAuthor() {
  if (localStorage.getItem("loggedIn") !== "true") return null;

  let user;
  try { user = JSON.parse(localStorage.getItem("loggedInUser")) || {}; }
  catch { return null; }
  if (!user.email) return null;

  /* A surname initial rather than the whole name: a review is public
     and permanent, and the shop should not publish more of a
     customer's name than the review needs. Accounts made before the
     profile was filled in have no name at all, so the address is the
     last resort — the part before the @, never the domain. */
  const fname = (user.fname || "").trim();
  const lname = (user.lname || "").trim();
  const name =
    fname && lname ? `${fname} ${lname[0].toUpperCase()}.` :
    fname          ? fname :
                     user.email.split("@")[0];

  return { name, email: user.email };
}

/* Shows the form or the sign-in prompt, never both. */
function renderReviewForm() {
  const form   = document.getElementById("write-review");
  const signin = document.getElementById("review-signin");
  if (!form || !signin) return;

  const author = reviewAuthor();
  form.classList.toggle("hidden", !author);
  signin.classList.toggle("hidden", !!author);

  if (author) {
    document.getElementById("posting-as-name").textContent = author.name;
  }
}

function reviewKey() {
  const data = JSON.parse(localStorage.getItem("selectedProduct"));
  return "reviews_" + (data ? data.name : "product");
}

function getReviews() {
  return JSON.parse(localStorage.getItem(reviewKey())) || [];
}

function saveReviews(reviews) {
  localStorage.setItem(reviewKey(), JSON.stringify(reviews));
}

function renderReviews() {
  const reviews = getReviews();
  const approved = reviews.filter(r => r.approved === true);
  const list = document.getElementById("review-list");
  const avgEl = document.getElementById("avg-score");
  const avgStarsEl = document.getElementById("avg-stars");
  const countEl = document.getElementById("review-count");

  if (approved.length === 0) {
    list.innerHTML = '<p class="no-reviews">Be the first to leave a review!</p>';
    avgEl.textContent = "—";
    avgStarsEl.textContent = "";
    countEl.textContent = "No reviews yet";
    return;
  }

  const avg = approved.reduce((s, r) => s + r.stars, 0) / approved.length;
  avgEl.textContent = avg.toFixed(1);
  avgStarsEl.textContent = starsHTML(Math.round(avg), true);
  countEl.textContent = approved.length + (approved.length === 1 ? " review" : " reviews");

  list.innerHTML = approved.slice().reverse().map(r => `
    <div class="review-card">
      <div class="review-card-top">
        <div>
          <div class="reviewer-name">${escapeHTML(r.name)}</div>
          <div class="review-date">${r.date}</div>
        </div>
        <div class="review-stars">${starsHTML(r.stars, true)}</div>
      </div>
      <div class="review-body">${escapeHTML(r.text)}</div>
    </div>
  `).join("");
}

function starsHTML(count, filled) {
  return "★".repeat(count) + (filled ? "☆".repeat(5 - count) : "");
}

function escapeHTML(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function submitReview() {
  /* Checked here as well as in the markup: hiding the form is for the
     customer's benefit, not a lock. */
  const author = reviewAuthor();
  if (!author) { showToast("Please sign in to leave a review"); renderReviewForm(); return; }

  const text = document.getElementById("review-text").value.trim();

  if (!selectedStars) { showToast("Please select a star rating"); return; }
  if (!text) { showToast("Please write a review"); return; }

  const reviews = getReviews();
  reviews.push({
    name: author.name,
    /* Kept so the admin can tell two "Gerald V."s apart, and is never
       rendered on the product page. */
    email: author.email,
    stars: selectedStars,
    text,
    date: new Date().toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }),
    approved: null
  });
  saveReviews(reviews);

  document.getElementById("review-text").value = "";
  setStars(0);
  renderReviews();
  showToast("Review submitted! It will appear after approval 🍪");
}

function setStars(n) {
  selectedStars = n;
  document.querySelectorAll("#star-picker span").forEach(s => {
    s.classList.toggle("active", parseInt(s.dataset.v) <= n);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("#star-picker span").forEach(s => {
    s.addEventListener("mouseenter", () => {
      document.querySelectorAll("#star-picker span").forEach(x =>
        x.classList.toggle("active", parseInt(x.dataset.v) <= parseInt(s.dataset.v))
      );
    });
    s.addEventListener("mouseleave", () => setStars(selectedStars));
    s.addEventListener("click", () => setStars(parseInt(s.dataset.v)));
  });
  renderReviewForm();
  renderReviews();
});