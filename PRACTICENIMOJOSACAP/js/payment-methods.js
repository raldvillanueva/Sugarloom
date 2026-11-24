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
    /* Taken from the QR card in Images, which is a different account
       and a different name from the GCash one — a customer paying by
       Maya is told to send to Karl, not to GCASHMOJO. */
    label:  'KARL NORBY RONQUILLO',
    holder: 'KARL NORBY RONQUILLO',

    /* The Maya username, not a phone number. Maya masks the number on
       the QR card (+63 ••• ••• 7385), so there are no full digits to
       copy here and guessing them would send money to a stranger. The
       handle is a complete address on Maya and is what the card shows
       in full, so it is what the customer gets. Replace it with the
       phone number only if you have the real one in front of you. */
    number: '@karl.norby',

    /* The space in the filename has to be written as %20 — a raw space
       in an href is not a valid URL and some hosts will not serve it. */
    qr:     '../Images/QR%20MAYAS.png',
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
