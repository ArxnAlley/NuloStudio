/* ============================================================
   SIMPLY NUTRITION v2 — Index Page JavaScript
   ============================================================ */

// ── Navigation ──

const nav = document.querySelector('nav');

const navToggle = document.querySelector('.navToggle');

const navLinks = document.querySelector('.navLinks');

if (nav) {

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 30);
  });

  if (window.scrollY > 30) {
    nav.classList.add('scrolled');
  }

}

if (navToggle && navLinks) {

  navToggle.addEventListener('click', () => {

    const isOpen = navLinks.classList.toggle('open');

    const spans = navToggle.querySelectorAll('span');

    spans[0].style.transform = isOpen ? 'rotate(45deg) translate(5px, 5px)' : '';

    spans[1].style.opacity = isOpen ? '0' : '1';

    spans[2].style.transform = isOpen ? 'rotate(-45deg) translate(5px, -5px)' : '';

  });

  navLinks.querySelectorAll('a').forEach(link => {

    link.addEventListener('click', () => {

      navLinks.classList.remove('open');

      navToggle.querySelectorAll('span').forEach(span => {
        span.style.transform = '';
        span.style.opacity = '';
      });

    });

  });

}

// ── Drink Selector ──

const drinkData = {

  pinkSugar: {
    headline: ['Better Energy', 'Starts Here'],
    italic: 'Starts Here',
    sub: 'Refreshing teas, protein shakes, smoothies, and bowls made to fuel your day.',
    accentColor: '#F48FB1',
    bgTint: 'rgba(252, 228, 236, 0.45)',
    blobColor: 'rgba(244, 143, 177, 1)'
  },

  tropical: {
    headline: ['Taste The', 'Tropics'],
    italic: 'Tropics',
    sub: 'Bold citrus and tropical fruit flavors fused with clean energy. Zero crash, all day glow.',
    accentColor: '#FF7043',
    bgTint: 'rgba(255, 236, 225, 0.45)',
    blobColor: 'rgba(255, 112, 67, 1)'
  },

  berry: {
    headline: ['Go Bold With', 'Berry Blast'],
    italic: 'Berry Blast',
    sub: 'Deep berry goodness packed with antioxidants and natural energy. The fan favorite is here.',
    accentColor: '#7B1FA2',
    bgTint: 'rgba(237, 222, 247, 0.45)',
    blobColor: 'rgba(123, 31, 162, 1)'
  },

  lemon: {
    headline: ['Fresh & Bright', 'Lemon Lime'],
    italic: 'Lemon Lime',
    sub: 'Crisp citrus energy with a kick. Light, refreshing, and perfect before or after the gym.',
    accentColor: '#8BC34A',
    bgTint: 'rgba(236, 247, 219, 0.45)',
    blobColor: 'rgba(139, 195, 74, 1)'
  },

  heart: {
    headline: ['Happy Heart,', 'Happy You'],
    italic: 'Happy You',
    sub: 'Hydrate and energize with love. This feel-good blend keeps you glowing all day long.',
    accentColor: '#E91E63',
    bgTint: 'rgba(252, 228, 236, 0.45)',
    blobColor: 'rgba(233, 30, 99, 1)'
  },

  coffee: {
    headline: ['Skip The', 'Coffee Line'],
    italic: 'Coffee Line',
    sub: 'Rich, creamy, and packed with protein. The morning upgrade that actually keeps you full.',
    accentColor: '#795548',
    bgTint: 'rgba(245, 236, 231, 0.45)',
    blobColor: 'rgba(121, 85, 72, 1)'
  }

};

const heroBgOverlay = document.getElementById('heroBgOverlay');

const heroBlob = document.getElementById('heroBlob');

const heroHeadline = document.getElementById('heroHeadline');

const heroSub = document.getElementById('heroSub');

const heroCtas = document.getElementById('heroCtas');

const drinkCards = document.querySelectorAll('.drinkCard');

function activateDrink(key, animate = true) {

  const d = drinkData[key];

  if (!d) return;

  if (heroBgOverlay) {
    heroBgOverlay.style.background = d.bgTint;
  }

  if (heroBlob) {
    heroBlob.style.background = d.blobColor;
  }

  if (heroHeadline) {

    if (animate) {
      heroHeadline.style.opacity = '0';
      heroHeadline.style.transform = 'translateY(12px)';
    }

    setTimeout(() => {
      heroHeadline.innerHTML = `${d.headline[0]} <span class="italic">${d.italic}</span>`;
      heroHeadline.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      heroHeadline.style.opacity = '1';
      heroHeadline.style.transform = 'translateY(0)';
    }, animate ? 160 : 0);

  }

  if (heroSub) {

    if (animate) {
      heroSub.style.opacity = '0';
    }

    setTimeout(() => {
      heroSub.textContent = d.sub;
      heroSub.style.transition = 'opacity 0.4s ease';
      heroSub.style.opacity = '1';
    }, animate ? 200 : 0);

  }

  if (heroCtas && animate) {
    heroCtas.classList.remove('slideIn');
    void heroCtas.offsetWidth;
    heroCtas.classList.add('slideIn');
  }

  drinkCards.forEach(card => card.classList.remove('active'));

  const activeCard = document.querySelector(`.drinkCard[data-drink="${key}"]`);

  if (activeCard) {
    activeCard.classList.add('active');
  }

}

drinkCards.forEach(card => {
  card.addEventListener('click', () => activateDrink(card.dataset.drink, true));
});

activateDrink('pinkSugar', false);

// ── Menu Tabs ──

const menuTabs = document.querySelectorAll('.menuTab');

const menuItems = document.querySelectorAll('.menuItem');

menuTabs.forEach(tab => {

  tab.addEventListener('click', () => {

    menuTabs.forEach(t => t.classList.remove('active'));

    tab.classList.add('active');

    const cat = tab.dataset.cat;

    menuItems.forEach(item => {
      item.classList.toggle('visible', item.dataset.cat === cat);
    });

  });

});

// ── How Did You Find Us ──

const findUsOptions = document.querySelectorAll('.findUsOption');

findUsOptions.forEach(option => {

  option.addEventListener('click', () => {

    findUsOptions.forEach(o => o.classList.remove('selected'));

    option.classList.add('selected');

  });

});

// ── Scroll Reveal ──

const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {

  entries.forEach(entry => {

    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }

  });

}, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });

revealEls.forEach(el => revealObserver.observe(el));

// ── Today's Hours ──

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const todayName = days[new Date().getDay()];

document.querySelectorAll('.hoursRow').forEach(row => {

  const dayEl = row.querySelector('.hoursDay');

  if (dayEl && dayEl.textContent.trim() === todayName) {
    row.classList.add('today');
  }

});

// ── Simply VIP Club Popup ──

const vipOverlay = document.getElementById('vipOverlay');

const vipClose = document.getElementById('vipClose');

const vipForm = document.getElementById('vipForm');

const vipSuccess = document.getElementById('vipSuccess');

const vipFooterLink = document.getElementById('vipFooterLink');

let vipShown = false;

function showVipPopup() {

  if (vipShown) return;

  if (sessionStorage.getItem('vipDismissed')) return;

  vipShown = true;

  vipOverlay.classList.add('visible');

  vipOverlay.setAttribute('aria-hidden', 'false');

}

function hideVipPopup() {

  vipOverlay.classList.remove('visible');

  vipOverlay.classList.remove('active');

  vipOverlay.setAttribute('aria-hidden', 'true');

  sessionStorage.setItem('vipDismissed', '1');

}

if (vipFooterLink && vipOverlay) {
  vipFooterLink.addEventListener('click', function(e) {
    e.preventDefault();
    vipShown = true;
    vipOverlay.classList.add('active');
    vipOverlay.classList.add('visible');
    vipOverlay.setAttribute('aria-hidden', 'false');
  });
}

// Trigger after scrolling 40% down the page

window.addEventListener('scroll', () => {

  const scrollPct = window.scrollY / (document.body.scrollHeight - window.innerHeight);

  if (scrollPct > 0.4) {
    showVipPopup();
  }

}, { passive: true });

// Trigger after 12 seconds on page (fallback for users who don't scroll)

setTimeout(showVipPopup, 12000);

// Close on X button

if (vipClose) {
  vipClose.addEventListener('click', hideVipPopup);
}

// Close on overlay click (outside modal)

if (vipOverlay) {

  vipOverlay.addEventListener('click', (e) => {

    if (e.target === vipOverlay) {
      hideVipPopup();
    }

  });

}

// Close on Escape key

document.addEventListener('keydown', (e) => {

  if (e.key === 'Escape' && vipOverlay.classList.contains('visible')) {
    hideVipPopup();
  }

});

// Form submission

if (vipForm) {

  vipForm.addEventListener('submit', (e) => {

    e.preventDefault();

    vipForm.style.display = 'none';

    if (vipSuccess) {
      vipSuccess.style.display = 'block';
    }

    setTimeout(hideVipPopup, 3200);

  });

}
