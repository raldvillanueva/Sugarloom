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
    /* Which receipt reader understands this wallet's screenshots.
       null means nobody does yet, so the upload goes straight to a
       person — see readWalletProof() in js/checkout.js. */
    reader: 'gcash'
  },

  Maya: {
    /* ⚠ PLACEHOLDERS. Fill these in with the real Maya account before
       taking a payment through it: `label` and `number` are what the
       customer is told to send to, and `holder` is the name Maya
       prints on its receipt — the same masked form GCash uses, if a
       reader is ever written for it.

       `qr: ''` is deliberate rather than missing: the panel shows a
       "no QR code yet" note instead of a broken image, and starts
       showing the picture the moment a path is put here. */
    label:  'SugarLoom Ph',
    holder: '',
    number: '0949 399 7899',
    qr:     '',
    reader: null
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

/* The wallets the shop can be paid through, in the order they are
   offered. */
function walletMethods(){
  return Object.keys(WALLET_ACCOUNTS);
}
