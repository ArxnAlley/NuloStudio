// =============================================
// OHIO VALLEY CONSTRUCTION & PLUMBING LLC
// Gallery Page Scripts — galleryJS.js
// =============================================

'use strict';

// Sticky header
const siteHeader = document.getElementById('siteHeader');
window.addEventListener('scroll', () => {
  siteHeader.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// Mobile Nav
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');
const mobileNavClose = document.getElementById('mobileNavClose');
const closeMobileMenu = () => {
  hamburger.classList.remove('open');
  mobileNav.classList.remove('open');
  document.body.classList.remove('menuOpen');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
};
hamburger.addEventListener('click', () => {
  const isOpen = hamburger.classList.toggle('open');
  mobileNav.classList.toggle('open');
  document.body.classList.toggle('menuOpen', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
});
mobileNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    closeMobileMenu();
  });
});
if (mobileNavClose) {
  mobileNavClose.addEventListener('click', closeMobileMenu);
}

// Scroll reveal
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
document.querySelectorAll('.reveal, .revealLeft, .revealRight').forEach(el => revealObserver.observe(el));

// Gallery Filter
const filterBtns = document.querySelectorAll('.filterBtn');
const galleryItems = document.querySelectorAll('.galleryMasonryItem');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;

    galleryItems.forEach(item => {
      if (filter === 'all' || item.dataset.category === filter) {
        item.style.opacity = '1';
        item.style.display = 'block';
      } else {
        item.style.opacity = '0.15';
      }
    });
  });
});

// Lightbox
function openLightbox(src, alt) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,0.95); z-index:9999;
    display:flex; align-items:center; justify-content:center;
    cursor:zoom-out; padding:2rem; animation:fadeIn 0.2s ease;
  `;
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.style.cssText = 'max-width:90vw; max-height:90vh; object-fit:contain; border-radius:8px; box-shadow:0 20px 80px rgba(0,0,0,0.8);';

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.style.cssText = `
    position:fixed; top:1.5rem; right:1.5rem;
    background:rgba(90,31,166,0.9); border:none; color:white;
    font-size:2rem; line-height:1; width:48px; height:48px;
    border-radius:50%; cursor:pointer; z-index:10000;
    display:flex; align-items:center; justify-content:center;
  `;

  overlay.appendChild(img);
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  const close = () => {
    document.body.removeChild(overlay);
    document.body.style.overflow = '';
  };

  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', handler); }
  });
}

galleryItems.forEach(item => {
  item.addEventListener('click', () => {
    const img = item.querySelector('img');
    if (img) openLightbox(img.src, img.alt);
  });
  item.addEventListener('keydown', e => {
    if (e.key === 'Enter') item.click();
  });
});

// Inject animation
const style = document.createElement('style');
style.textContent = '@keyframes fadeIn { from { opacity:0 } to { opacity:1 } }';
document.head.appendChild(style);

// =============================================
// EMERGENCY TAB SCRIPT
// =============================================

const emergencyTab = document.getElementById("emergencyTab");
const emergencyPanel = document.getElementById("emergencyPanel");
const emergencyPanelClose = document.getElementById("emergencyPanelClose");

if (emergencyTab && emergencyPanel) {

  const setEmergencyPanelState = (isOpen) => {
    emergencyPanel.classList.toggle("open", isOpen);
    emergencyTab.setAttribute("aria-expanded", String(isOpen));
  };

  emergencyTab.addEventListener("click", () => {
    setEmergencyPanelState(!emergencyPanel.classList.contains("open"));
  });

  if (emergencyPanelClose) {
    emergencyPanelClose.addEventListener("click", () => {
      setEmergencyPanelState(false);
    });
  }

  document.addEventListener("click", (event) => {
    const clickedInsidePanel = emergencyPanel.contains(event.target);
    const clickedTab = emergencyTab.contains(event.target);

    if (!clickedInsidePanel && !clickedTab) {
      setEmergencyPanelState(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setEmergencyPanelState(false);
    }
  });

}
