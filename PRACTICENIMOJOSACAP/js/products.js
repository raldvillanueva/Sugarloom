const fallbackProducts = [
  { name: "Chocolate Chip Cookies", price: 70, img: "https://www.meatloafandmelodrama.com/wp-content/uploads/2024/10/best-chocolate-chip-cookies-recipe.jpg", category: "cookie", ingredients: ["Wheat Flour","Butter","White Sugar","Brown Sugar","Eggs","Vanilla Extract","Chocolate Chips","Baking Soda","Salt"] },
  { name: "Oatmeal Cookies", price: 70, img: "https://whatsgabycooking.com/wp-content/uploads/2023/04/WGC-__-Oatmeal-Chocolate-Chip-Cookies-1200x800-1.jpg", category: "cookie", ingredients: ["Wheat Flour","Rolled Oats","Butter","Brown Sugar","Eggs","Vanilla Extract","Cinnamon","Baking Soda","Salt"] },
  { name: "Matcha Cookies", price: 70, img: "https://teakandthyme.com/wp-content/uploads/2023/09/matcha-white-chocolate-cookies-DSC_5105-1x1-1200.jpg", category: "cookie", ingredients: ["Wheat Flour","Butter","White Sugar","Brown Sugar","Eggs","Matcha Powder","White Chocolate Chips","Baking Soda","Salt"] },
  { name: "Fudge Brownies", price: 80, img: "https://cafedelites.com/wp-content/uploads/2016/08/Fudgy-Cocoa-Brownies-44-1.jpg", category: "brownie", ingredients: ["Wheat Flour","Butter","Sugar","Eggs","Cocoa Powder","Dark Chocolate","Vanilla Extract","Baking Powder","Salt"] },
  { name: "Dark Chocolate Brownies", price: 80, img: "https://organicallyaddison.com/wp-content/uploads/2022/09/2022-09-04_17-44-12_390.jpeg", category: "brownie", ingredients: ["Wheat Flour","Butter","Sugar","Eggs","Dark Cocoa Powder","Dark Chocolate","Vanilla Extract","Espresso Powder","Baking Powder","Salt"] },
  { name: "Red Velvet Brownies", price: 80, img: "https://cakesbymk.com/wp-content/uploads/2025/02/Template-Size-for-Blog-21.jpg", category: "brownie", ingredients: ["Wheat Flour","Butter","Sugar","Eggs","Cocoa Powder","Cream Cheese","Red Food Coloring","Vanilla Extract","Baking Powder","Salt"] },
  { name: "Vanilla Cupcake", price: 75, img: "https://clipart-library.com/2024/image-of-a-cupcake/image-of-a-cupcake-4.jpg", category: "cupcake", ingredients: ["Wheat Flour","Butter","Sugar","Eggs","Milk","Vanilla Extract","Baking Powder","Salt","Buttercream Frosting"] },
  { name: "Chocolate Cupcake", price: 75, img: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c", category: "cupcake", ingredients: ["Wheat Flour","Butter","Sugar","Eggs","Cocoa Powder","Milk","Vanilla Extract","Baking Powder","Salt","Chocolate Frosting"] },
  { name: "Strawberry Cupcake", price: 75, img: "https://images.unsplash.com/photo-1607478900766-efe13248b125", category: "cupcake", ingredients: ["Wheat Flour","Butter","Sugar","Eggs","Milk","Vanilla Extract","Strawberry Jam","Baking Powder","Salt","Strawberry Frosting"] },
  { name: "Chocolate Chip Cookies Box", price: 250, img: "https://www.thesevenpantry.com/cdn/shop/files/TSP-50-Shades-FOOD-Cookies-in-a-Box.jpg?v=1700633437&width=800", category: "box", ingredients: ["Wheat Flour","Butter","White Sugar","Brown Sugar","Eggs","Vanilla Extract","Chocolate Chips","Baking Soda","Salt"] },
  { name: "Fudge Brownies Box", price: 250, img: "https://cravingskitchenph.com/cdn/shop/files/DSCF6636.jpg?v=1721989391", category: "box", ingredients: ["Wheat Flour","Butter","Sugar","Eggs","Cocoa Powder","Dark Chocolate","Vanilla Extract","Baking Powder","Salt"] },
  { name: "Red Velvet Brownies Box", price: 250, img: "https://freshaprilflours.com/wp-content/uploads/2020/02/red-velvet-brownies-9.jpg", category: "box", ingredients: ["Wheat Flour","Butter","Sugar","Eggs","Cocoa Powder","Cream Cheese","Red Food Coloring","Vanilla Extract","Baking Powder","Salt"] }
];

const catMap = { Cookies:'cookie', Brownies:'brownie', Cupcakes:'cupcake', Boxes:'box' };

let products = fallbackProducts.slice(); // start with fallback until Supabase loads

function render(list){
  const container = document.getElementById("product-list");
  container.innerHTML = "";

  list.forEach((p, i)=>{
    const div = document.createElement("div");
    div.className = "product-clean";
    div.innerHTML = `<img src="${p.img}"><h3>${p.name}</h3><p class="price">₱${p.price}</p>`;
    div.addEventListener("click", () => viewProduct(p.name, p.price, p.img));
    container.appendChild(div);
  });

  setTimeout(revealOnScroll, 50);
}

/* FILTER */
function filterProducts(type){

  // SHOW PRODUCTS AGAIN
  document.querySelector(".products").style.display = "block";

  // HIDE FAQ / CONTACT
  document.querySelectorAll(".about-section").forEach(s=>{
    s.classList.remove("active");
  });

  // UPDATE ACTIVE PILL
  document.querySelectorAll(".filter-pill").forEach(btn=>{
    btn.classList.toggle("active", btn.dataset.filter === type);
  });

  // UPDATE SHOP TITLE
  const titles = { all: "All", cookie: "Cookies", brownie: "Brownies", cupcake: "Cupcakes", box: "Boxes" };
  const titleEl = document.querySelector(".shop-title");
  if(titleEl) titleEl.textContent = "Shop " + (titles[type] || "All");

  let filtered = type === "all"
    ? products
    : products.filter(p => p.category === type);

  // always hide boxes in normal/customize mode — boxes are only shown via goToBoxes()
  if(!window._boxesOnlyMode){
    filtered = filtered.filter(p => p.category !== "box");
  }

  render(filtered);
}

/* CART */
function addProduct(name, price, img){
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  let existing = cart.find(i=>i.name === name);

  if(existing){
    existing.qty++;
  } else {
    cart.push({name,price,img,qty:1});
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCart();
}

function updateCart(){
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  document.getElementById("cart").innerText = cart.length;
}

/* NAV */
function goHome(){
  window.location.href = "../pages/homepage.html";
}

function goToCart(){
  window.location.href = "../pages/cart.html";
}

function goBack(){
  sessionStorage.removeItem("boxesOnlyMode");
  localStorage.removeItem("selectedCategory");
  window.location.href = "../pages/homepage.html";
}

/* VIEWPRODUCT */
function viewProduct(name, price, img){
  const found = products.find(p => p.name === name);
  const product = found ? { ...found } : { name, price, img, ingredients: [] };

  // description already included via Supabase load

  // Strip base64 images before storing — product-view reads img from admin DB
  const toStore = { ...product };
  if(toStore.img && toStore.img.startsWith('data:')) toStore.img = '';

  localStorage.setItem("selectedProduct", JSON.stringify(toStore));
  window.location.href = "../pages/product-view.html";
}

function revealOnScroll(){
  const items = document.querySelectorAll(".product-clean");

  const trigger = window.innerHeight * 0.85;

  items.forEach(item=>{
    const top = item.getBoundingClientRect().top;

    if(top < trigger){
      item.classList.add("show");
    }
  });
}


document.addEventListener('DOMContentLoaded', async () => {
  // Load products from Supabase, fall back to hardcoded list if unavailable
  try {
    const { data } = await _supa.from('products').select('data');
    if (data && data.length > 0) {
      products = data.map(r => r.data)
        .filter(p => p.active)
        .map(p => ({
          name:        p.name,
          price:       p.price,
          img:         p.img || '',
          category:    catMap[p.category] || (p.category || '').toLowerCase(),
          description: p.description || '',
          ingredients: []
        }));
    }
  } catch(e) {}

  const isCustomize  = localStorage.getItem('customizeMode') === 'true';
  const isBoxesOnly  = sessionStorage.getItem("boxesOnlyMode") === "true";
  localStorage.removeItem("customizeMode");

  if(isBoxesOnly){
    window._boxesOnlyMode = true;
    window._customizeMode = false;

    // hide all non-box filter pills, explicitly show the box pill
    document.querySelectorAll(".filter-pill").forEach(btn => {
      btn.style.display = btn.dataset.filter === "box" ? "" : "none";
    });

    // change title
    const titleEl = document.querySelector(".shop-title");
    if(titleEl) titleEl.textContent = "Shop Boxes";

    // show only boxes
    render(products.filter(p => p.category === "box"));

    // mark Boxes pill active
    document.querySelectorAll(".filter-pill").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.filter === "box");
    });

  } else if(isCustomize){
    // hide Boxes pill
    document.querySelectorAll(".filter-pill").forEach(btn => {
      if(btn.dataset.filter === "box") btn.style.display = "none";
    });

    // change title
    const titleEl = document.querySelector(".shop-title");
    if(titleEl) titleEl.textContent = "Choose your orders";

    // mark page so product-view knows minimum qty applies
    localStorage.setItem("customizePage", "true");

    // show all except boxes
    const noBoxes = products.filter(p => p.category !== "box");
    render(noBoxes);

    // set all pills to "all" active state (boxes just hidden)
    document.querySelectorAll(".filter-pill").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.filter === "all");
    });

    window._customizeMode = true;
    window._boxesOnlyMode = false;
  } else {
    localStorage.removeItem("customizePage");
    window._customizeMode = false;
    window._boxesOnlyMode = false;
    const selected = localStorage.getItem("selectedCategory") || "all";
    filterProducts(selected);
  }

  updateCart();
});

window.addEventListener("scroll", revealOnScroll);

/* INIT */
document.querySelectorAll(".dropdown span").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const menu = btn.nextElementSibling;

    document.querySelectorAll(".dropdown-menu").forEach(m=>{
      if(m !== menu) m.style.display = "none";
    });

    menu.style.display =
      menu.style.display === "block" ? "none" : "block";
  });
});

/* click outside = close */
document.addEventListener("click", (e)=>{
  if(!e.target.closest(".dropdown")){
    document.querySelectorAll(".dropdown-menu").forEach(m=>{
      m.style.display = "none";
    });
  }
});

/* SHOW SECTION */
function showSection(type){

  // hide products
  document.querySelector(".products").style.display = "none";

  // hide all sections
  document.querySelectorAll(".about-section").forEach(s=>{
    s.classList.remove("active");
  });

  // show selected
  if(type === "faq"){
    document.getElementById("faqSection").classList.add("active");
  }

  if(type === "contact"){
    document.getElementById("contactSection").classList.add("active");
  }

}

/* SHOW PRODUCTS2 */
function showProducts(){

  // show products
  document.querySelector(".products").style.display = "block";

  // hide other sections
  document.querySelectorAll(".about-section").forEach(s=>{
    s.classList.remove("active");
  });

  // render all again
  render(products);
}

