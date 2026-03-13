// =============================================
// OHIO VALLEY CONSTRUCTION & PLUMBING LLC
// About Page Scripts — aboutJS.js
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
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal, .revealLeft, .revealRight').forEach(el => revealObserver.observe(el));

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
