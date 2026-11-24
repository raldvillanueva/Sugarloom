/* ── product-image.js — one picture for a product with none ───────
   A product saved without an image put an empty src on the page, and
   an empty src is not "no picture" — the browser resolves it against
   the page address, fails, and draws the broken-image icon. A torn
   page on a cake shop reads as a broken site rather than a product
   nobody has photographed yet.

   Shared by the admin panel and the customer pages so the gap looks
   the same wherever it shows, and so a product that is simply
   missing a photo is told apart from one whose photo failed to load
   — which looks identical and is not the same problem.

   The placeholder is an inline SVG rather than a file: it is part of
   the markup, so it cannot itself 404 and leave a broken icon where
   the fallback for a broken icon was supposed to be. */

const PRODUCT_PLACEHOLDER =
  'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">' +
      '<rect width="400" height="300" fill="#f1efea"/>' +
      '<g fill="none" stroke="#c9c3b8" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">' +
        '<rect x="142" y="110" width="116" height="92" rx="10"/>' +
        '<path d="M142 176l30-26 24 20 26-24 36 32"/>' +
      '</g>' +
      '<circle cx="178" cy="139" r="9" fill="#c9c3b8"/>' +
      '<text x="200" y="232" text-anchor="middle" font-family="Inter,Arial,sans-serif" ' +
        'font-size="15" fill="#a9a296">No picture yet</text>' +
    '</svg>'
  );

/* The src to use for a product. Anything blank — never uploaded, or
   lost to the save that read the field before the resize finished —
   gets the placeholder instead of an empty string. */
function productImgSrc(product){
  const src = product && typeof product.img === 'string' ? product.img.trim() : '';
  return src || PRODUCT_PLACEHOLDER;
}

/* ── A CART LINE OR AN ORDER ITEM ──
   These carry a copy of the product's picture, and for an uploaded
   one that copy is blank: products.js strips a data URL out of the
   hand-off because it is a six-figure string and localStorage is
   small. So a product with an uploaded photo showed the placeholder
   in the cart even though the picture exists.

   Carrying the picture was the wrong idea anyway. A data URL in the
   cart eats the browser's storage, and the same string copied into
   every order is what put 1.8 MB of base64 into the orders table and
   the project 400% over its egress quota. The name is the key; the
   picture is looked up from the product list the page has already
   loaded for its prices and stock.

   An item that does carry a usable picture — an ordinary http one —
   keeps it, so an order placed before a product's photo changed
   still shows what was bought. */
let PRODUCT_IMG_BY_NAME = {};

function rememberProductImages(products){
  (products || []).forEach(p => {
    if(p && p.name && String(p.img || '').trim()){
      PRODUCT_IMG_BY_NAME[p.name.toLowerCase()] = p.img;
    }
  });
}

function itemImgSrc(item){
  const own = item && typeof item.img === 'string' ? item.img.trim() : '';
  if(own) return own;
  const known = item && item.name ? PRODUCT_IMG_BY_NAME[item.name.toLowerCase()] : '';
  return known || PRODUCT_PLACEHOLDER;
}

/* For an <img> that already has a src: swap to the placeholder when
   that src fails, and only once, so a placeholder that somehow fails
   cannot loop. Used as onerror="productImgFallback(this)". */
function productImgFallback(el){
  if(!el || el.dataset.fellBack) return;
  el.dataset.fellBack = '1';
  el.src = PRODUCT_PLACEHOLDER;
}
