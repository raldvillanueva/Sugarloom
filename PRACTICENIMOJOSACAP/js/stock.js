/* ── stock.js — what is left to sell today ────────────────────────
   One rule, shared by the shop, the product page, the cart and
   checkout, so the four cannot disagree about whether something can
   still be ordered.

   The admin panel counts a product's day in two fields: dailyLimit is
   how many can be made, soldToday how many are spoken for. The shop
   used to ignore both — products.js dropped them when it mapped the
   rows — so a product with nothing left still went in the basket and
   straight through checkout, and the baker found out afterwards. */

/* A product with no dailyLimit is unlimited rather than sold out:
   plenty of rows predate the field, and reading a missing limit as
   zero would empty the shop. */
function remainingStock(p){
  if(!p) return 0;
  const limit = Number(p.dailyLimit);
  if(!Number.isFinite(limit) || limit <= 0) return Infinity;
  const sold = Number(p.soldToday) || 0;
  return Math.max(0, limit - sold);
}

function isSoldOut(p){
  return remainingStock(p) === 0;
}

/* How many more of this product the customer may add, given what is
   already in their basket. */
function stockHeadroom(p, qtyInCart){
  const left = remainingStock(p);
  if(left === Infinity) return Infinity;
  return Math.max(0, left - (Number(qtyInCart) || 0));
}

/* Checked again at checkout, because a basket can sit for an hour
   while the last few sell to somebody else. Returns the lines that no
   longer fit, so the customer is told which ones rather than simply
   being refused. */
function unavailableLines(cart, byName){
  return (cart || []).reduce((bad, line) => {
    const p = byName[line.name];
    if(!p) return bad;                      // not in the catalogue; leave it alone
    const left = remainingStock(p);
    if(left === Infinity) return bad;
    if(left < (line.qty || 1)) bad.push({ name: line.name, wanted: line.qty || 1, left });
    return bad;
  }, []);
}
