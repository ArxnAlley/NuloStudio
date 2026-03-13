// =============================================
// OHIO VALLEY CONSTRUCTION & PLUMBING LLC
// Contact Page Scripts — contactJS.js
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
}, { threshold: 0.1 });
document.querySelectorAll('.reveal, .revealLeft, .revealRight').forEach(el => revealObserver.observe(el));

// Form Validation & Submission
const contactForm = document.getElementById('contactForm');

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const city = document.getElementById('city').value.trim();
    const service = document.getElementById('service').value;
    const errors = [];

    if (!firstName) errors.push('First name is required.');
    if (!lastName) errors.push('Last name is required.');
    if (!phone) errors.push('Phone number is required.');
    if (!city) errors.push('City is required.');
    if (!service) errors.push('Please select a service.');

    if (errors.length > 0) {
      showMessage(errors.join(' '), 'error');
      return;
    }

    // Simulate form submission
    const submitBtn = contactForm.querySelector('.formSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    setTimeout(() => {
      showMessage('✅ Thank you! We\'ve received your request and will be in touch soon. For urgent needs, call (740) 534-3215.', 'success');
      contactForm.reset();
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send My Request';
    }, 1200);
  });
}

function showMessage(msg, type) {
  const existing = document.getElementById('formMessage');
  if (existing) existing.remove();

  const div = document.createElement('div');
  div.id = 'formMessage';
  div.style.cssText = `
    padding: 1rem 1.25rem;
    border-radius: 6px;
    font-family: var(--fontBody);
    font-size: 0.95rem;
    line-height: 1.5;
    margin-bottom: 1rem;
    background: ${type === 'success' ? 'rgba(34,139,34,0.15)' : 'rgba(200,40,40,0.15)'};
    border: 1px solid ${type === 'success' ? 'rgba(34,139,34,0.4)' : 'rgba(200,40,40,0.4)'};
    color: ${type === 'success' ? '#4ade80' : '#f87171'};
  `;
  div.textContent = msg;

  const submitBtn = contactForm.querySelector('.formSubmitBtn');
  contactForm.insertBefore(div, submitBtn);
  div.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

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
