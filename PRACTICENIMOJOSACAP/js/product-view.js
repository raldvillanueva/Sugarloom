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
  const name = document.getElementById("reviewer-name").value.trim();
  const text = document.getElementById("review-text").value.trim();

  if (!name) { showToast("Please enter your name"); return; }
  if (!selectedStars) { showToast("Please select a star rating"); return; }
  if (!text) { showToast("Please write a review"); return; }

  const reviews = getReviews();
  reviews.push({
    name,
    stars: selectedStars,
    text,
    date: new Date().toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }),
    approved: null
  });
  saveReviews(reviews);

  document.getElementById("reviewer-name").value = "";
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
  renderReviews();
});