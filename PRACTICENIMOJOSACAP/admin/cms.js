/* ── cms.js — Website Content editor ─────────────────────────────
   Drives the Content view in the admin panel.

   CMS_SECTIONS describes every editable piece of the homepage. Each
   field's `key` matches a data-cms attribute in pages/homepage.html, and
   `placeholder` is the wording currently baked into that page — so an
   empty box shows the admin what the site says today, and saving it
   empty keeps that original wording.

   To make something new editable: tag it in the HTML with
   data-cms="your_key", then add a field with the same key below. */

const CMS_PAGE_ID = 'homepage';

const CMS_SECTIONS = [
  {
    title: 'Hero (top of the page)',
    fields: [
      { key: 'hero_tag',          label: 'Small tagline',      placeholder: '✦ Freshly baked, Manila-made' },
      { key: 'hero_title',        label: 'Main heading',       placeholder: 'Freshly baked\nhandcrafted cookies\nin Manila', type: 'textarea', hint: 'Press Enter to start a new line' },
      { key: 'hero_text',         label: 'Description',        placeholder: 'Serving quality baked goods with convenient ordering and delivery services.', type: 'textarea' },
      { key: 'hero_btn_primary',  label: 'Main button',        placeholder: 'Order Now' },
      { key: 'hero_btn_secondary',label: 'Second button',      placeholder: 'See Best Sellers' },
      { key: 'hero_image',        label: 'Photo',              placeholder: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52', type: 'image' }
    ]
  },
  {
    title: 'Highlights bar',
    fields: [
      { key: 'feature1_title', label: 'Highlight 1 title',    placeholder: 'Freshly Baked Daily' },
      { key: 'feature1_sub',   label: 'Highlight 1 subtitle', placeholder: 'Every morning at 6am' },
      { key: 'feature2_title', label: 'Highlight 2 title',    placeholder: 'Fast Delivery' },
      { key: 'feature2_sub',   label: 'Highlight 2 subtitle', placeholder: 'Metro Manila same-day' },
      { key: 'feature3_title', label: 'Highlight 3 title',    placeholder: 'Premium Ingredients' },
      { key: 'feature3_sub',   label: 'Highlight 3 subtitle', placeholder: 'No artificial flavors' },
      { key: 'feature4_title', label: 'Highlight 4 title',    placeholder: 'Custom Orders' },
      { key: 'feature4_sub',   label: 'Highlight 4 subtitle', placeholder: 'For events & gifting' }
    ]
  },
  {
    title: 'Best Sellers heading',
    note:  'The products themselves are managed under Products.',
    fields: [
      { key: 'best_label', label: 'Small label',  placeholder: 'Most Loved' },
      { key: 'best_title', label: 'Heading',      placeholder: 'Best Sellers' },
      { key: 'best_sub',   label: 'Subtitle',     placeholder: "Our customers' favorites, baked fresh every day" },
      { key: 'best_cta',   label: 'Button',       placeholder: 'View All Products →' }
    ]
  },
  {
    title: 'Staff Pick section',
    fields: [
      { key: 'staff_label', label: 'Small label', placeholder: 'Staff Pick' },
      { key: 'staff_title', label: 'Heading',     placeholder: 'Matcha Cookies!' },
      { key: 'staff_text',  label: 'Description', placeholder: 'A chewy matcha-infused cookie with a rich earthy taste and a perfectly sweet, smooth finish.', type: 'textarea' },
      { key: 'staff_btn',   label: 'Button',      placeholder: 'Order Now' },
      { key: 'staff_image', label: 'Photo',       placeholder: 'https://teakandthyme.com/wp-content/uploads/2023/09/matcha-white-chocolate-cookies-DSC_5105-1x1-1200.jpg', type: 'image' }
    ]
  },
  {
    title: 'Boxes section',
    fields: [
      { key: 'boxes_label', label: 'Small label', placeholder: 'New Feature' },
      { key: 'boxes_title', label: 'Heading',     placeholder: 'SugarLoom Boxes!' },
      { key: 'boxes_text',  label: 'Description', placeholder: 'Delicious freshly made treats carefully prepared and packed for every order!', type: 'textarea' },
      { key: 'boxes_btn',   label: 'Button',      placeholder: 'Order Now' },
      { key: 'boxes_image', label: 'Photo',       placeholder: 'https://cravingskitchenph.com/cdn/shop/files/DSCF6636.jpg?v=1721989391', type: 'image' }
    ]
  },
  {
    title: 'About / Our Story',
    fields: [
      { key: 'about_label',  label: 'Small label',      placeholder: 'Our Story' },
      { key: 'about_title',  label: 'Heading',          placeholder: 'Baked with love since day one' },
      { key: 'about_text',   label: 'Story',            placeholder: 'SugarLoom Ph started as a passion project — baking happiness for friends and family. Today, we serve freshly baked cookies, brownies, and desserts crafted with love, delivered straight to your door across Metro Manila.', type: 'textarea', rows: 4 },
      { key: 'pillar1_title', label: 'Point 1 title',    placeholder: 'Local Ingredients' },
      { key: 'pillar1_sub',   label: 'Point 1 subtitle', placeholder: 'Sourced from trusted Filipino suppliers' },
      { key: 'pillar2_title', label: 'Point 2 title',    placeholder: 'Small Batch Baking' },
      { key: 'pillar2_sub',   label: 'Point 2 subtitle', placeholder: 'Every order baked fresh, never pre-made' },
      { key: 'pillar3_title', label: 'Point 3 title',    placeholder: 'Made with Love' },
      { key: 'pillar3_sub',   label: 'Point 3 subtitle', placeholder: 'Every cookie packed with care' }
    ]
  },
  {
    title: 'FAQ heading',
    fields: [
      { key: 'faq_label', label: 'Small label', placeholder: 'Help Center' },
      { key: 'faq_title', label: 'Heading',     placeholder: 'Frequently Asked Questions' },
      { key: 'faq_sub',   label: 'Subtitle',    placeholder: 'Everything you need to know about SugarLoom Ph' }
    ]
  },
  {
    title: 'Contact section',
    fields: [
      { key: 'contact_label',         label: 'Small label',        placeholder: 'Get in Touch' },
      { key: 'contact_title',         label: 'Heading',            placeholder: 'Contact Us' },
      { key: 'contact_sub',           label: 'Subtitle',           placeholder: "We'd love to hear from you — orders, questions, or just to say hi 🍪" },
      { key: 'contact_email',         label: 'Email shown',        placeholder: 'sugarloomph@gmail.com' },
      { key: 'contact_email_link',    label: 'Email link',         placeholder: 'mailto:sugarloomph@gmail.com', hint: 'Keep the mailto: prefix' },
      { key: 'contact_phone',         label: 'Phone shown',        placeholder: '0912 345 6789' },
      { key: 'contact_phone_link',    label: 'Phone link',         placeholder: 'tel:09123456789', hint: 'Keep the tel: prefix, no spaces' },
      { key: 'contact_facebook',      label: 'Facebook shown',     placeholder: '@sugarloomph' },
      { key: 'contact_facebook_link', label: 'Facebook link',      placeholder: 'https://facebook.com/sugarloomph' },
      { key: 'inquiry_title',         label: 'Message form title', placeholder: 'Send us a quick message' },
      { key: 'inquiry_note',          label: 'Message form note',  placeholder: 'We reply within 24 hours on weekdays 🍪' }
    ]
  },
  {
    title: 'Footer',
    fields: [
      { key: 'footer_logo',      label: 'Footer name',    placeholder: 'SugarLoomPh' },
      { key: 'footer_text',      label: 'Footer blurb',   placeholder: 'Freshly baked handcrafted cookies delivered across Metro Manila. Made with love, baked with purpose.', type: 'textarea' },
      { key: 'footer_email',     label: 'Contact line 1', placeholder: '📧 sugarloomph@gmail.com' },
      { key: 'footer_phone',     label: 'Contact line 2', placeholder: '📞 0912 345 6789' },
      { key: 'footer_social',    label: 'Contact line 3', placeholder: '📸 @sugarloomph' },
      { key: 'footer_address',   label: 'Contact line 4', placeholder: '📍 Manila, Philippines' },
      { key: 'footer_copyright', label: 'Copyright line', placeholder: '© 2026 SugarLoom Ph · All rights reserved · Handcrafted with 🍪' }
    ]
  }
];

/* Questions shown when the FAQ list has never been edited. Matches what
   pages/homepage.html ships with. */
const CMS_DEFAULT_FAQ = [
  { q: 'How long does delivery take?',      a: 'We do same day delivery depending on your location within Manila.' },
  { q: 'How do I reheat my cookies?',       a: 'Warm in the oven for 5–8 minutes at low heat, or microwave for 15–20 seconds from room temperature for that fresh-baked feel.' },
  { q: 'Do you do custom orders?',          a: 'Yes! We love doing custom order boxes depending on your likings.' },
  { q: 'How long do cookies stay fresh?',   a: 'Our cookies stay fresh for up to 5 days at room temperature in an airtight container, or up to 2 weeks in the freezer.' },
  { q: 'What are your working hours?',      a: "We're available Monday to Saturday, 8:00 AM – 5:00 PM. Orders and inquiries outside these hours will be attended to the next business day." }
];

let siteContent = {};

function cmsEscape(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function loadSiteContentAdmin() {
  try {
    const { data, error } = await _supa
      .from('site_content').select('data').eq('id', CMS_PAGE_ID).maybeSingle();
    if (error) throw error;
    siteContent = (data && data.data) || {};
  } catch (err) {
    console.error('Could not load site content:', err);
    siteContent = {};
    toast('Could not load website content', 'danger');
  }
}

function cmsFieldHtml(f) {
  const val  = siteContent[f.key] || '';
  const hint = f.hint ? `<small class="cms-hint">${cmsEscape(f.hint)}</small>` : '';

  if (f.type === 'textarea') {
    return `
      <div class="cms-field">
        <label for="cms-${f.key}">${cmsEscape(f.label)}</label>
        <textarea id="cms-${f.key}" data-cms-key="${f.key}" rows="${f.rows || 3}"
          placeholder="${cmsEscape(f.placeholder)}">${cmsEscape(val)}</textarea>
        ${hint}
      </div>`;
  }

  /* Image fields take an upload or a pasted link. The real value lives in
     a hidden input so an uploaded picture doesn't fill the box with a
     giant data URL. */
  if (f.type === 'image') {
    const isUpload = val.startsWith('data:');
    return `
      <div class="cms-field" data-image-field="${f.key}">
        <label>${cmsEscape(f.label)}</label>
        <div class="cms-image-row">
          <img class="cms-thumb" src="${cmsEscape(val || f.placeholder)}" alt=""
               onerror="this.classList.add('broken')">
          <div class="cms-image-controls">
            <input type="hidden" id="cms-${f.key}" data-cms-key="${f.key}" value="${cmsEscape(val)}">
            <input type="file" id="cms-file-${f.key}" accept="image/*" style="display:none"
                   onchange="handleCmsImgUpload(event, '${f.key}')">
            <div class="cms-image-actions">
              <button type="button" class="btn-secondary sm" onclick="document.getElementById('cms-file-${f.key}').click()">
                <i class='bx bx-upload'></i> Upload picture
              </button>
              <button type="button" class="btn-ghost sm" onclick="resetCmsImage('${f.key}')">Reset</button>
            </div>
            <input type="text" class="cms-image-url" placeholder="or paste a link"
                   value="${isUpload ? '' : cmsEscape(val)}"
                   oninput="setCmsImageUrl('${f.key}', this.value)">
            <small class="cms-image-status">${isUpload ? 'Uploaded picture' : (val ? 'Using a link' : 'Using the original picture')}</small>
          </div>
        </div>
      </div>`;
  }

  return `
    <div class="cms-field">
      <label for="cms-${f.key}">${cmsEscape(f.label)}</label>
      <input id="cms-${f.key}" type="text" data-cms-key="${f.key}"
        value="${cmsEscape(val)}" placeholder="${cmsEscape(f.placeholder)}">
      ${hint}
    </div>`;
}

/* Shrinks a picked photo before it is stored. The homepage fetches this
   row on every visit, so a straight-off-the-phone 4MB photo would be paid
   for by every customer. Scales the long edge down to CMS_IMG_MAX_PX and
   re-encodes as JPEG. */
const CMS_IMG_MAX_PX = 1600;
const CMS_IMG_QUALITY = 0.82;

function shrinkImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not an image'));
      img.onload = () => {
        const scale = Math.min(1, CMS_IMG_MAX_PX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', CMS_IMG_QUALITY));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function cmsImageField(key) {
  return document.querySelector(`[data-image-field="${key}"]`);
}

function setCmsImageValue(key, value, status) {
  const field = cmsImageField(key);
  field.querySelector('input[type="hidden"]').value = value;

  const thumb = field.querySelector('.cms-thumb');
  thumb.classList.remove('broken');
  if (value) thumb.src = value;

  field.querySelector('.cms-image-status').textContent = status;
}

async function handleCmsImgUpload(e, key) {
  const file = e.target.files[0];
  if (!file) return;

  const field = cmsImageField(key);
  field.querySelector('.cms-image-status').textContent = 'Working on it…';

  try {
    const dataUrl = await shrinkImage(file);
    setCmsImageValue(key, dataUrl, `Uploaded ${file.name}`);
    field.querySelector('.cms-image-url').value = '';
  } catch (err) {
    console.error('image upload failed:', err);
    field.querySelector('.cms-image-status').textContent = 'Could not use that file — try a JPG or PNG';
    toast('Could not read that picture', 'danger');
  } finally {
    e.target.value = '';   // let the same file be picked again
  }
}

function setCmsImageUrl(key, url) {
  const trimmed = url.trim();
  setCmsImageValue(key, trimmed, trimmed ? 'Using a link' : 'Using the original picture');
}

/* Clearing the field is how you go back to the picture built into the page. */
function resetCmsImage(key) {
  const field = cmsImageField(key);
  field.querySelector('input[type="hidden"]').value = '';
  field.querySelector('.cms-image-url').value = '';
  field.querySelector('.cms-image-status').textContent = 'Using the original picture';

  const thumb = field.querySelector('.cms-thumb');
  const original = CMS_SECTIONS
    .flatMap(s => s.fields)
    .find(f => f.key === key);
  if (original) { thumb.classList.remove('broken'); thumb.src = original.placeholder; }
}

function faqRowHtml(item, i) {
  return `
    <div class="cms-faq-item" data-faq-row>
      <div class="cms-faq-head">
        <span>Question ${i + 1}</span>
        <button class="btn-icon danger" title="Remove" onclick="removeFaqRow(this)"><i class='bx bx-trash'></i></button>
      </div>
      <input type="text" data-faq-q placeholder="Question" value="${cmsEscape(item.q)}">
      <textarea data-faq-a rows="2" placeholder="Answer">${cmsEscape(item.a)}</textarea>
    </div>`;
}

function renderFaqRows() {
  const list = Array.isArray(siteContent.faq) && siteContent.faq.length
    ? siteContent.faq
    : CMS_DEFAULT_FAQ;
  document.getElementById('cms-faq-rows').innerHTML = list.map(faqRowHtml).join('');
}

function addFaqRow() {
  const rows = document.getElementById('cms-faq-rows');
  rows.insertAdjacentHTML('beforeend', faqRowHtml({ q: '', a: '' }, rows.children.length));
  renumberFaqRows();
}

function removeFaqRow(btn) {
  btn.closest('[data-faq-row]').remove();
  renumberFaqRows();
}

function renumberFaqRows() {
  document.querySelectorAll('#cms-faq-rows [data-faq-row]').forEach((row, i) => {
    row.querySelector('.cms-faq-head span').textContent = `Question ${i + 1}`;
  });
}

async function renderContent() {
  await loadSiteContentAdmin();

  const cards = CMS_SECTIONS.map(sec => `
    <div class="card cms-card">
      <h3 class="cms-card-title">${cmsEscape(sec.title)}</h3>
      ${sec.note ? `<p class="cms-card-note">${cmsEscape(sec.note)}</p>` : ''}
      <div class="cms-grid">${sec.fields.map(cmsFieldHtml).join('')}</div>
    </div>`);

  /* The FAQ editor goes right after its heading card, so the form reads
     in the same order as the page. */
  const faqIndex = CMS_SECTIONS.findIndex(s => s.title === 'FAQ heading');
  cards.splice(faqIndex + 1, 0, `
    <div class="card cms-card">
      <h3 class="cms-card-title">FAQ questions</h3>
      <p class="cms-card-note">Add, edit, or remove the questions shown on the homepage.</p>
      <div id="cms-faq-rows"></div>
      <button class="btn-outline" onclick="addFaqRow()"><i class='bx bx-plus'></i> Add question</button>
    </div>`);

  document.getElementById('cms-form').innerHTML = cards.join('');
  renderFaqRows();
}

function collectSiteContent() {
  const out = {};

  document.querySelectorAll('#cms-form [data-cms-key]').forEach(el => {
    const val = el.value.trim();
    if (val !== '') out[el.dataset.cmsKey] = val;   // blank = keep the built-in wording
  });

  const faq = [];
  document.querySelectorAll('#cms-faq-rows [data-faq-row]').forEach(row => {
    const q = row.querySelector('[data-faq-q]').value.trim();
    const a = row.querySelector('[data-faq-a]').value.trim();
    if (q && a) faq.push({ q, a });
  });
  if (faq.length) out.faq = faq;

  return out;
}

async function saveSiteContent() {
  const content = collectSiteContent();

  try {
    const { error } = await _supa
      .from('site_content')
      .upsert({ id: CMS_PAGE_ID, data: content }, { onConflict: 'id' });

    if (error) throw error;

    siteContent = content;
    toast('Website content saved', 'success');
  } catch (err) {
    console.error('saveSiteContent error:', err);
    toast('Could not save — check your connection and try again', 'danger');
  }
}

function previewSite() {
  window.open('../pages/homepage.html', '_blank');
}
