/* ============================================================
   SIMPLY NUTRITION v2 â€” About Page JavaScript
   ============================================================ */

// â”€â”€ Navigation â”€â”€

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

// â”€â”€ Scroll Reveal â”€â”€

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
