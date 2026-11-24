/* ── payment-methods.js — what the shop accepts ──────────────────
   Shared by checkout and the admin panel.

   The code used to ask `payment === 'GCash'` in fourteen places, and
   every one of them meant the same thing: this is a wallet payment,
   so there is a screenshot to check and an admin has to accept or
   refuse it. Cash on Delivery has none of that. Adding a second
   wallet by writing `|| payment === 'Maya'` fourteen times is how one
   of them gets missed — and the one that gets missed is usually the
   check that stops an unpaid order reaching the baker.

   So the question is asked once, by name: isWalletPayment(method). A
   third wallet is a new entry in this table and nothing else. */

const WALLET_ACCOUNTS = {
  GCash: {
    label:  'GCASHMOJO',          // shown to the customer
    holder: 'GE***D V.',          // as GCash prints it on the receipt
    number: '0949 399 7899',
    qr:     '../Images/GCASHMOJO.png',
    /* Which reader in WALLET_READERS (js/gcash-proof.js) understands
       this wallet's screenshots — its wording and the shape of its
       reference number. null means none does, and the upload goes
       straight to a person unread. */
    reader: 'gcash'
  },

  Maya: {
    /* Taken from the QR card in Images, which is a different account
       and a different name from the GCash one — a customer paying by
       Maya is told to send to Karl, not to GCASHMOJO. */
    label:  'KARL NORBY RONQUILLO',
    holder: 'KARL NORBY RONQUILLO',

    /* Grouped 4-3-4 to match the GCash line above, so the two wallets
       read the same way. The card only shows +63 ••• ••• 7385; these
       are the full digits, and the last four agree with the mask. */
    number: '0994 460 7385',

    /* The space in the filename has to be written as %20 — a raw space
       in an href is not a valid URL and some hosts will not serve it. */
    qr:     '../Images/QR%20MAYAS.png',
    reader: 'maya'
  }
};

/* True for a payment the customer makes before delivery and proves
   with a screenshot. False for Cash on Delivery, and for an order
   placed before any of this existed. */
function isWalletPayment(method){
  return !!method && Object.prototype.hasOwnProperty.call(WALLET_ACCOUNTS, method);
}

function walletAccount(method){
  return WALLET_ACCOUNTS[method] || null;
}

/* What to call the wallet an order was paid through, for anything a
   person reads — a heading, an email, an audit entry.

   Orders placed before Maya existed carry no method, or carry one the
   shop no longer offers. They were all GCash, so that is what they are
   called; the alternative is a panel heading reading "undefined
   payment" over a real receipt. */
function walletName(order){
  const m = order && order.payment;
  return isWalletPayment(m) ? m : 'GCash';
}

/* The wallets the shop can be paid through, in the order they are
   offered. */
function walletMethods(){
  return Object.keys(WALLET_ACCOUNTS);
}
