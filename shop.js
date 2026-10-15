'use strict';

const shopState = { products: [], promotions: [], whatsappNumber: '923211212939', search: '', category: '', colour: '', maxPrice: '', availability: 'all', sort: 'newest', activeProduct: null, activeVariantId: null, quantity: 1 };
const byId = id => document.getElementById(id);
const safeText = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const money = amount => `PKR ${Number(amount).toLocaleString('en-PK')}`;
const liveVariants = product => product.variants.filter(variant => variant.images.length);
const displayPrice = (product, variant) => ({
  regular: variant.price ?? product.price,
  sale: variant.salePrice ?? product.salePrice
});
const currentPrice = (product, variant) => {
  const prices = displayPrice(product, variant);
  return prices.sale && prices.sale < prices.regular ? prices.sale : prices.regular;
};
const stockStatus = variant => variant.stock > 0 ? 'In stock' : 'Sold out';

function toast(message) {
  const node = byId('toast');
  node.textContent = message;
  node.classList.add('toast-visible');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove('toast-visible'), 3800);
}

async function fetchStore() {
  const response = await fetch('/api/store.json', { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('The VYERO collection is taking a little longer to load. Please refresh and try again.');
  return response.json();
}

function variantLink(product, variant) {
  return `/product/${encodeURIComponent(product.slug)}?variant=${encodeURIComponent(variant.id)}`;
}

function cardFor(product) {
  const visible = liveVariants(product);
  const variant = visible.find(item => item.stock > 0) || visible[0] || product.variants[0];
  const image = variant?.images?.[0];
  const soldOut = !product.variants.some(item => item.stock > 0);
  const prices = variant ? displayPrice(product, variant) : { regular: product.price, sale: product.salePrice };
  const selectedPrice = variant ? currentPrice(product, variant) : product.price;
  const swatches = product.variants.slice(0, 6).map(item => `
    <a class="swatch-link${item.stock ? '' : ' swatch-soldout'}" href="${safeText(variantLink(product, item))}" title="${safeText(item.colour)} · ${safeText(item.shape)}${item.stock ? '' : ' · sold out'}" aria-label="${safeText(item.colour)}, ${safeText(item.shape)}${item.stock ? '' : ', sold out'}" style="--swatch:${safeText(item.colourHex || '#aa8d6e')}">
      <span></span><span class="sr-only">${safeText(item.colour)} · ${safeText(item.shape)}${item.stock ? '' : ' · sold out'}</span>
    </a>`).join('');
  const buyButton = soldOut
    ? '<span class="button button-disabled" aria-disabled="true">Currently unavailable</span>'
    : `<button class="button button-outline card-buy" type="button" data-buy="${safeText(product.slug)}" data-variant="${safeText(product.variants.length === 1 ? product.variants[0].id : '')}">Buy now <span aria-hidden="true">↗</span></button>`;
  return `<article class="product-card">
    <a class="card-image${image ? '' : ' card-image-empty'}" href="${safeText(variantLink(product, variant))}" data-product="${safeText(product.slug)}" data-variant="${safeText(variant?.id || '')}" aria-label="View ${safeText(product.name)}">
      ${image ? `<img src="/media/${encodeURIComponent(image)}" alt="${safeText(product.name)}${variant ? ` in ${safeText(variant.colour)}, ${safeText(variant.shape)}` : ''}" loading="lazy">` : '<span>PHOTO TO COME</span>'}
      ${product.newArrival ? '<span class="card-badge">JUST ARRIVED</span>' : ''}${prices.sale ? '<span class="card-badge badge-sale">A LITTLE LESS</span>' : ''}
      ${soldOut ? '<span class="card-stock-overlay">Currently unavailable</span>' : ''}
    </a>
    <div class="card-info">
      <span class="card-category">${safeText(product.category)}</span><a class="card-name" href="${safeText(variantLink(product, variant))}" data-product="${safeText(product.slug)}" data-variant="${safeText(variant?.id || '')}">${safeText(product.name)}</a>
      <div class="card-price">${prices.sale ? `<del>${money(prices.regular)}</del><strong>${money(selectedPrice)}</strong>` : `<strong>${money(selectedPrice)}</strong>`}</div>
      <div class="card-options" aria-label="Available colour options">${swatches}${product.variants.length > 6 ? `<span class="more-options">+${product.variants.length - 6}</span>` : ''}</div>
      <div class="card-actions"><a class="button button-quiet" href="${safeText(variantLink(product, variant))}" data-product="${safeText(product.slug)}" data-variant="${safeText(variant?.id || '')}">View bag</a>${buyButton}</div>
    </div>
  </article>`;
}

function populateFilters(products) {
  const categories = [...new Set(products.map(product => product.category))].sort((a, b) => a.localeCompare(b));
  const colours = [...new Set(products.flatMap(product => product.variants.map(variant => variant.colour)))].sort((a, b) => a.localeCompare(b));
  const categorySelect = byId('category-filter');
  const colorSelect = byId('colour-filter');
  categorySelect.innerHTML = '<option value="">All categories</option>' + categories.map(value => `<option value="${safeText(value)}">${safeText(value)}</option>`).join('');
  colorSelect.innerHTML = '<option value="">All colours</option>' + colours.map(value => `<option value="${safeText(value)}">${safeText(value)}</option>`).join('');
  categorySelect.value = shopState.category;
  colorSelect.value = shopState.colour;
}

function filteredProducts() {
  const matches = shopState.products.filter(product => {
    const term = shopState.search.trim().toLowerCase();
    const matchingVariants = product.variants.filter(variant => (!shopState.colour || variant.colour.toLowerCase() === shopState.colour.toLowerCase()) &&
      (shopState.availability === 'all' || (shopState.availability === 'available' ? variant.stock > 0 : variant.stock < 1)) &&
      (!shopState.maxPrice || currentPrice(product, variant) <= Number(shopState.maxPrice)));
    return (!term || `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(term)) &&
      (!shopState.category || product.category === shopState.category) && matchingVariants.length > 0;
  });
  if (shopState.sort === 'low') return matches.sort((a, b) => Math.min(...a.variants.map(variant => currentPrice(a, variant))) - Math.min(...b.variants.map(variant => currentPrice(b, variant))));
  if (shopState.sort === 'high') return matches.sort((a, b) => Math.min(...b.variants.map(variant => currentPrice(b, variant))) - Math.min(...a.variants.map(variant => currentPrice(a, variant))));
  return matches.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function renderCatalog() {
  const products = filteredProducts();
  byId('product-grid').innerHTML = products.map(cardFor).join('');
  byId('product-count').textContent = `${products.length} ${products.length === 1 ? 'beautiful bag' : 'beautiful bags'}`;
  const noneInStore = shopState.products.length === 0;
  byId('catalog-empty').hidden = !noneInStore;
  byId('product-grid').hidden = noneInStore || products.length === 0;
  byId('no-results').hidden = noneInStore || products.length !== 0;
  const newArrivals = shopState.products.filter(product => product.newArrival).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  byId('new-grid').innerHTML = newArrivals.map(cardFor).join('');
  byId('new-grid').hidden = newArrivals.length === 0;
  byId('new-empty').hidden = newArrivals.length !== 0;
  populateFilters(shopState.products);
  const featured = shopState.products.filter(product => product.featured).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const spotlight = byId('spotlight');
  spotlight.hidden = !featured;
  if (featured) {
    const variant = liveVariants(featured)[0];
    const photo = variant?.images?.[0];
    spotlight.classList.toggle('spotlight-with-photo', Boolean(photo));
    spotlight.style.backgroundImage = photo ? `linear-gradient(90deg, #182c43f5 0%, #182c43c7 55%, #182c4340 100%), url("/media/${encodeURIComponent(photo)}")` : '';
    byId('spotlight-description').textContent = featured.description || 'Picked with love. Find the bag that feels like yours.';
  }
}

function selectVariant(product, id) {
  return product.variants.find(variant => variant.id === id) || product.variants.find(variant => variant.stock > 0) || product.variants[0];
}

function openProduct(slug, requestedVariant = '') {
  const product = shopState.products.find(item => item.slug === slug);
  if (!product) {
    toast('That bag is not available in the collection right now.');
    history.replaceState(null, '', '/#shop');
    return;
  }
  shopState.activeProduct = product;
  shopState.activeVariantId = selectVariant(product, requestedVariant)?.id || '';
  shopState.quantity = 1;
  renderProductDetail();
  const dialog = byId('product-dialog');
  if (!dialog.open) dialog.showModal();
  document.title = `${product.name} — VYERO`;
}

function selectedVariant() {
  return shopState.activeProduct?.variants.find(variant => variant.id === shopState.activeVariantId) || null;
}

function renderProductDetail() {
  const product = shopState.activeProduct;
  if (!product) return;
  const variant = selectedVariant();
  const image = variant?.images?.[0] || '';
  const prices = variant ? displayPrice(product, variant) : { regular: product.price, sale: product.salePrice };
  const hasOptions = product.variants.length > 1;
  const colours = [...new Set(product.variants.map(item => item.colour))];
  const shapes = [...new Set(product.variants.map(item => item.shape))];
  const chosenColour = variant?.colour || '';
  const chosenShape = variant?.shape || '';
  const noCombo = !variant;
  const productName = safeText(product.name);
  const chips = colours.map(colour => {
    const option = product.variants.find(item => item.colour === colour && (item.shape === chosenShape || !product.variants.some(candidate => candidate.shape === chosenShape && candidate.colour === colour)));
    return `<button class="colour-choice${colour === chosenColour ? ' is-selected' : ''}" type="button" data-colour="${safeText(colour)}" aria-label="${safeText(colour)}${option?.stock ? '' : ', sold out'}" aria-pressed="${String(colour === chosenColour)}" ${option ? '' : 'disabled'} style="--swatch:${safeText(option?.colourHex || '#aa8d6e')}"><span></span><span class="sr-only">${safeText(colour)}</span></button>`;
  }).join('');
  const shapeOptions = shapes.map(shape => {
    const matching = product.variants.find(item => item.shape === shape && (item.colour === chosenColour || !product.variants.some(candidate => candidate.colour === chosenColour && candidate.shape === shape)));
    return `<button class="shape-choice${shape === chosenShape ? ' is-selected' : ''}" type="button" data-shape="${safeText(shape)}" aria-pressed="${String(shape === chosenShape)}" ${matching ? '' : 'disabled'}>${safeText(shape)}${matching && matching.stock === 0 ? ' · Sold out' : ''}</button>`;
  }).join('');
  const canOrder = Boolean(variant && variant.stock > 0);
  const safeImage = image ? `<img class="detail-main-image" src="/media/${encodeURIComponent(image)}" alt="${productName} in ${safeText(variant.colour)}, ${safeText(variant.shape)}" fetchpriority="high">` : `<div class="detail-image-empty"><span>${variant && variant.images.length ? 'Selected style photo' : 'Photos of this particular style coming soon'}</span></div>`;
  const thumbnailImages = (variant?.images || []).slice(0, 8).map((src, index) => `<button class="detail-thumbnail${index === 0 ? ' is-selected' : ''}" type="button" data-image="${encodeURIComponent(src)}" aria-label="View photo ${index + 1}"><img src="/media/${encodeURIComponent(src)}" alt="" loading="lazy"></button>`).join('');
  const pictures = thumbnailImages ? `<div class="detail-thumbnails">${thumbnailImages}</div>` : '';
  byId('product-detail').innerHTML = `
    <div class="detail-gallery">${safeImage}${pictures}<span class="detail-caption">AN ORIGINAL VYERO EDIT</span></div>
    <div class="detail-copy"><span class="eyebrow">${safeText(product.category)}</span><h2 id="detail-name">${productName}</h2><p class="detail-description">${safeText(product.description || 'A little something to carry with you.')}</p>
      <div class="detail-price">${prices.sale ? `<del>${money(prices.regular)}</del><strong>${money(prices.sale)}</strong>` : `<strong>${money(prices.regular)}</strong>`}</div>
      ${hasOptions ? `<fieldset class="detail-field"><legend>Colour <span>${safeText(chosenColour)}</span></legend><div class="colour-choices">${chips}</div></fieldset>
      <fieldset class="detail-field"><legend>Shape / style <span>${safeText(chosenShape)}</span></legend><div class="shape-choices">${shapeOptions}</div></fieldset>` : `<p class="single-option"><span>STYLE</span>${safeText(variant?.shape || 'Selected style')} · ${safeText(variant?.colour || 'Selected colour')}</p>`}
      <p class="availability ${canOrder ? 'in-stock' : 'out-of-stock'}">${variant ? safeText(stockStatus(variant)) : 'Choose a listed colour and shape'}</p>
      ${variant?.sku ? `<p class="detail-sku">SKU ${safeText(variant.sku)}</p>` : ''}
      ${canOrder ? `<label class="quantity-control">Quantity<select id="order-quantity">${Array.from({ length: Math.min(variant.stock, 20) }, (_, index) => `<option value="${index + 1}">${index + 1}</option>`).join('')}</select></label>` : '<p class="stock-note">Please choose an available colour and style to see the photos for that exact option.</p>'}
      <div class="order-form" aria-label="Customer order details">
        <label class="order-field"><span>Full name</span><input id="buyer-name" name="buyer-name" type="text" autocomplete="name" placeholder="Your full name" required></label>
        <label class="order-field"><span>Phone number</span><input id="buyer-phone" name="buyer-phone" type="tel" autocomplete="tel" placeholder="+92 300 0000000" required></label>
        <label class="order-field"><span>City</span><input id="buyer-city" name="buyer-city" type="text" autocomplete="address-level2" placeholder="Your city" required></label>
        <label class="order-field"><span>Order note (optional)</span><textarea id="buyer-note" name="buyer-note" rows="3" placeholder="Tell us if you want a specific delivery note or timing."></textarea></label>
      </div>
      <p class="delivery-note">Delivery cost and estimate are confirmed on WhatsApp before you decide. Your order isn’t confirmed until VYERO confirms it directly.</p>
      <button id="detail-buy" class="button button-dark detail-buy" type="button" ${canOrder ? '' : 'disabled'}>${canOrder ? 'Buy now' : 'Currently unavailable'} <span aria-hidden="true">↗</span></button>
      <button id="copy-product-link" class="share-link" type="button">Copy product link</button>
    </div>`;
  byId('product-detail').querySelectorAll('[data-colour]').forEach(button => button.addEventListener('click', () => {
    const next = product.variants.find(item => item.colour === button.dataset.colour && item.shape === chosenShape) ||
      product.variants.find(item => item.colour === button.dataset.colour && item.stock > 0) ||
      product.variants.find(item => item.colour === button.dataset.colour);
    if (next) { shopState.activeVariantId = next.id; shopState.quantity = 1; renderProductDetail(); }
  }));
  byId('product-detail').querySelectorAll('[data-shape]').forEach(button => button.addEventListener('click', () => {
    const next = product.variants.find(item => item.shape === button.dataset.shape && item.colour === chosenColour) ||
      product.variants.find(item => item.shape === button.dataset.shape && item.stock > 0) ||
      product.variants.find(item => item.shape === button.dataset.shape);
    if (next) { shopState.activeVariantId = next.id; shopState.quantity = 1; renderProductDetail(); }
  }));
  byId('product-detail').querySelectorAll('[data-image]').forEach(button => button.addEventListener('click', () => {
    const selectedImage = decodeURIComponent(button.dataset.image);
    const imageNode = byId('product-detail').querySelector('.detail-main-image');
    if (imageNode) imageNode.src = `/media/${encodeURIComponent(selectedImage)}`;
    byId('product-detail').querySelectorAll('.detail-thumbnail').forEach(item => item.classList.toggle('is-selected', item === button));
  }));
  const quantityNode = byId('order-quantity');
  if (quantityNode) quantityNode.value = String(shopState.quantity);
  byId('detail-buy')?.addEventListener('click', beginWhatsAppOrder);
  byId('copy-product-link')?.addEventListener('click', copyProductLink);
}

function beginWhatsAppOrder() {
  const product = shopState.activeProduct;
  const variant = selectedVariant();
  if (!product || !variant || variant.stock < 1) {
    toast('Please select a colour and shape that are in stock before ordering.');
    return;
  }
  const quantity = Number(byId('order-quantity')?.value || 1);
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > variant.stock) {
    toast('Choose a valid quantity that is currently in stock.');
    return;
  }
  const buyerName = (byId('buyer-name')?.value || '').trim();
  const buyerPhone = (byId('buyer-phone')?.value || '').trim();
  const buyerCity = (byId('buyer-city')?.value || '').trim();
  const buyerNote = (byId('buyer-note')?.value || '').trim();
  if (!buyerName || !buyerPhone || !buyerCity) {
    toast('Please add your full name, phone number and city before continuing to WhatsApp.');
    return;
  }
  if (!/^[+\d()\-\s]{7,20}$/.test(buyerPhone)) {
    toast('Please add a valid phone number so VYERO can confirm your order.');
    return;
  }
  const price = currentPrice(product, variant);
  const text = [
    'Hello VYERO! I would like to buy this bag:',
    '',
    `Name: ${buyerName}`,
    `Phone: ${buyerPhone}`,
    `City: ${buyerCity}`,
    `Product: ${product.name}`,
    `Price: PKR ${price.toLocaleString('en-PK')}${variant.salePrice || product.salePrice ? ' (sale price)' : ''}`,
    `Colour: ${variant.colour}`,
    `Shape/Style: ${variant.shape}`,
    `Quantity: ${quantity}`,
    `Notes: ${buyerNote || 'None'}`,
    '',
    'Please confirm availability, delivery charges, and the ordering process.'
  ].join('\n');
  const url = `https://wa.me/${shopState.whatsappNumber}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
  toast('Your order details were prepared for WhatsApp. VYERO will confirm the final order after replying.');
}

async function copyProductLink() {
  const product = shopState.activeProduct;
  const variant = selectedVariant();
  const url = `${window.location.origin}${variant ? variantLink(product, variant) : `/product/${encodeURIComponent(product.slug)}`}`;
  try {
    await navigator.clipboard.writeText(url);
    toast('Bag link copied. Ready to share with someone you love.');
  } catch {
    toast(`Copy this product link: ${url}`);
  }
}

function closeProduct(restoreHistory = true) {
  const dialog = byId('product-dialog');
  if (dialog.open) dialog.close();
  shopState.activeProduct = null;
  if (restoreHistory && location.pathname.startsWith('/product/')) {
    history.pushState(null, '', '/#shop');
    document.title = 'VYERO — Shop, Discover, Love';
  }
}

function navigateFromLocation() {
  const match = location.pathname.match(/^\/product\/([^/]+)\/?$/);
  if (match) {
    const product = shopState.products.find(item => item.slug === decodeURIComponent(match[1]));
    if (product) openProduct(product.slug, new URLSearchParams(location.search).get('variant') || '');
    else {
      history.replaceState(null, '', '/#shop');
      toast('That bag is not available in the collection right now.');
    }
  } else if (byId('product-dialog').open) {
    closeProduct(false);
  }
}

function initHeroSlider(products) {
  const slidesNode = byId('hero-bag-slides');
  const counter = byId('hero-bag-count');
  const pictures = products.flatMap(product => product.variants.flatMap(variant => variant.images.map(image => ({
    product,
    variant,
    image
  }))));

  if (!pictures.length) {
    slidesNode.innerHTML = '<p class="hero-bag-empty">VYERO · SHOP · DISCOVER · LOVE</p>';
    return;
  }

  slidesNode.innerHTML = pictures.map(({ product, variant, image }, index) => `
    <a class="hero-bag-slide${index === 0 ? ' is-active' : ''}" href="${safeText(variantLink(product, variant))}" data-product="${safeText(product.slug)}" data-variant="${safeText(variant.id)}" aria-label="View ${safeText(product.name)} in ${safeText(variant.colour)}">
      <img src="/media/${encodeURIComponent(image)}" alt="${safeText(product.name)} in ${safeText(variant.colour)}" ${index === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}>
      <span class="hero-bag-label">${safeText(product.name)} · ${safeText(variant.colour)}</span>
    </a>`).join('');

  let currentIndex = 0;
  let intervalId = null;
  const slides = [...slidesNode.querySelectorAll('.hero-bag-slide')];
  const showSlide = nextIndex => {
    currentIndex = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, index) => slide.classList.toggle('is-active', index === currentIndex));
    counter.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
  };
  const startSlider = () => {
    clearInterval(intervalId);
    if (slides.length > 1) intervalId = window.setInterval(() => showSlide(currentIndex + 1), 2000);
  };

  document.querySelector('[data-hero-previous]').addEventListener('click', () => {
    showSlide(currentIndex - 1);
    startSlider();
  });
  document.querySelector('[data-hero-next]').addEventListener('click', () => {
    showSlide(currentIndex + 1);
    startSlider();
  });
  showSlide(0);
  startSlider();
}

byId('catalog-controls').addEventListener('submit', event => event.preventDefault());
for (const [id, key] of [['search', 'search'], ['category-filter', 'category'], ['colour-filter', 'colour'], ['price-filter', 'maxPrice'], ['availability-filter', 'availability'], ['sort-filter', 'sort']]) {
  byId(id).addEventListener('input', () => {
    shopState[key] = byId(id).value;
    renderCatalog();
  });
  byId(id).addEventListener('change', () => {
    shopState[key] = byId(id).value;
    renderCatalog();
  });
}
document.addEventListener('click', event => {
  const trigger = event.target.closest('[data-product]');
  const buy = event.target.closest('[data-buy]');
  if (trigger) {
    event.preventDefault();
    const product = shopState.products.find(item => item.slug === trigger.dataset.product);
    if (!product) return;
    const variant = selectVariant(product, trigger.dataset.variant || '');
    history.pushState(null, '', variant ? variantLink(product, variant) : `/product/${encodeURIComponent(product.slug)}`);
    openProduct(product.slug, variant?.id || '');
  }
  if (buy) {
    const product = shopState.products.find(item => item.slug === buy.dataset.buy);
    if (!product) return;
    const requestedVariant = buy.dataset.variant || '';
    history.pushState(null, '', requestedVariant ? variantLink(product, requestedVariant) : `/product/${encodeURIComponent(product.slug)}`);
    openProduct(product.slug, requestedVariant);
    if (product.variants.length > 1) toast('Choose the exact colour and shape, then complete your details and buy now.');
  }
});
byId('close-detail').addEventListener('click', () => closeProduct());
byId('product-dialog').addEventListener('click', event => {
  if (event.target === byId('product-dialog')) closeProduct();
});
byId('product-dialog').addEventListener('close', () => { if (shopState.activeProduct) closeProduct(); });
window.addEventListener('popstate', navigateFromLocation);
const menuButton = document.querySelector('.menu-toggle');
menuButton.addEventListener('click', () => {
  const nav = document.querySelector('.main-nav');
  const open = nav.classList.toggle('nav-open');
  menuButton.setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('.main-nav a').forEach(link => link.addEventListener('click', () => {
  document.querySelector('.main-nav').classList.remove('nav-open');
  menuButton.setAttribute('aria-expanded', 'false');
}));

(async () => {
  byId('year').textContent = String(new Date().getFullYear());
  try {
    const store = await fetchStore();
    shopState.products = store.products;
    shopState.promotions = store.promotions;
    shopState.whatsappNumber = store.whatsappNumber;
    initHeroSlider(shopState.products);
    const footerLink = byId('footer-whatsapp');
    footerLink.href = `https://wa.me/${encodeURIComponent(store.whatsappNumber)}?text=${encodeURIComponent('Hello VYERO! I have a question about your bags.')}`;
    const announcements = byId('announcements');
    announcements.innerHTML = shopState.promotions.map(promotion => promotion.link
      ? `<a href="${safeText(promotion.link)}" ${promotion.link.startsWith('https://') ? 'target="_blank" rel="noopener noreferrer"' : ''}>${safeText(promotion.text)} <span aria-hidden="true">↗</span></a>`
      : `<span>${safeText(promotion.text)}</span>`).join('');
    renderCatalog();
    navigateFromLocation();
  } catch (error) {
    byId('product-count').textContent = 'The collection is taking a moment.';
    byId('catalog-empty').hidden = false;
    byId('catalog-empty').innerHTML = `<span class="empty-flower" aria-hidden="true">✳</span><h3>We’ll be right back.</h3><p>${safeText(error.message)}</p>`;
  }
})();
