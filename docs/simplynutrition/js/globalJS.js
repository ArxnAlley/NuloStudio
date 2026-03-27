/* ============================================================
   SIMPLY NUTRITION v2 — Global JavaScript
   Shared across all pages. Loaded before page-specific scripts.
   ============================================================ */

// ── Navigation ──

function initNavigation() {
  const nav = document.querySelector("nav");
  const navToggle = document.querySelector(".navToggle");
  const navLinks = document.querySelector(".navLinks");

  if (!nav) return;

  window.addEventListener(
    "scroll",
    () => nav.classList.toggle("scrolled", window.scrollY > 30),
    { passive: true },
  );

  if (window.scrollY > 30) nav.classList.add("scrolled");

  if (!navToggle || !navLinks) return;

  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navToggle.classList.toggle("open", isOpen);

    const spans = navToggle.querySelectorAll("span");
    spans[0].style.transform = isOpen ? "rotate(45deg) translate(5px, 5px)" : "";
    spans[1].style.opacity = isOpen ? "0" : "1";
    spans[2].style.transform = isOpen ? "rotate(-45deg) translate(5px, -5px)" : "";
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navToggle.classList.remove("open");

      navToggle.querySelectorAll("span").forEach((span) => {
        span.style.transform = "";
        span.style.opacity = "";
      });
    });
  });
}

// ── Scroll Reveal ──

function initScrollReveal() {
  const revealEls = document.querySelectorAll(".reveal");
  if (!revealEls.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -50px 0px" },
  );

  revealEls.forEach((el) => observer.observe(el));
}

// ── Init ──

initNavigation();
initScrollReveal();
