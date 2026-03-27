/* ============================================================
   SIMPLY NUTRITION v2 — Contact & Application Page JavaScript
   ============================================================ */

// ── Navigation ──

const nav = document.querySelector("nav");

const navToggle = document.querySelector(".navToggle");

const navLinks = document.querySelector(".navLinks");

if (nav) {
  window.addEventListener("scroll", () => {
    nav.classList.toggle("scrolled", window.scrollY > 30);
  });

  if (window.scrollY > 30) {
    nav.classList.add("scrolled");
  }
}

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");

    const spans = navToggle.querySelectorAll("span");

    spans[0].style.transform = isOpen
      ? "rotate(45deg) translate(5px, 5px)"
      : "";

    spans[1].style.opacity = isOpen ? "0" : "1";

    spans[2].style.transform = isOpen
      ? "rotate(-45deg) translate(5px, -5px)"
      : "";
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");

      navToggle.querySelectorAll("span").forEach((span) => {
        span.style.transform = "";
        span.style.opacity = "";
      });
    });
  });
}

// ── Scroll Reveal ──

const revealEls = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.08, rootMargin: "0px 0px -50px 0px" },
);

revealEls.forEach((el) => revealObserver.observe(el));

// ── Shared Form Utilities ──

function showFormPill(message, type) {
  const pill = document.createElement("div");
  pill.className =
    "formSuccessPill" + (type === "error" ? " formErrorPill" : "");
  pill.textContent = message;
  document.body.appendChild(pill);
  requestAnimationFrame(() =>
    requestAnimationFrame(() => pill.classList.add("visible")),
  );
  setTimeout(
    () => {
      pill.classList.remove("visible");
      setTimeout(
        () => pill.parentNode && pill.parentNode.removeChild(pill),
        400,
      );
    },
    type === "error" ? 3200 : 2800,
  );
}

function clearFormStatus(form) {
  const status = form.querySelector(".formStatusMessage");
  if (status) status.remove();
}

function showFormStatus(form, message, type) {
  clearFormStatus(form);
  const status = document.createElement("div");
  status.className = `formStatusMessage formStatus${type === "error" ? "Error" : "Success"}`;
  status.setAttribute("role", type === "error" ? "alert" : "status");
  status.textContent = message;
  form.prepend(status);
}

function validateForm(form) {
  let valid = true;
  clearFormStatus(form);
  form
    .querySelectorAll(".formInput, .formSelect, .formTextarea")
    .forEach((field) => {
      field.classList.remove("error", "valid");
      const prev = field.parentNode.querySelector(".formErrorText");
      if (prev) prev.remove();
    });
  form.querySelectorAll("[required]").forEach((field) => {
    const value = field.value.trim();
    let err = "";
    if (!value) {
      err = "This field is required.";
    } else if (
      field.type === "email" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    ) {
      err = "Please enter a valid email address.";
    }
    if (err) {
      valid = false;
      field.classList.add("error");
      const errEl = document.createElement("span");
      errEl.className = "formErrorText";
      errEl.textContent = err;
      field.parentNode.appendChild(errEl);
    } else if (value) {
      field.classList.add("valid");
    }
  });
  return valid;
}

// ── Contact / Application Form Submission ──

const contactForm = document.getElementById("contactForm");

if (contactForm) {
  const isApplication = contactForm.action.includes("mvzvzpgn");
  const submitBtn = contactForm.querySelector('[type="submit"]');
  const btnOriginal = submitBtn ? submitBtn.textContent.trim() : "Submit";

  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateForm(contactForm)) return;

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";
    }

    fetch(contactForm.action, {
      method: "POST",
      body: new FormData(contactForm),
      headers: { Accept: "application/json" },
    })
      .then((res) => {
        if (res.ok) {
          contactForm.reset();
          contactForm
            .querySelectorAll(".formInput, .formSelect, .formTextarea")
            .forEach((f) => f.classList.remove("valid", "error"));
          clearFormStatus(contactForm);
          showFormPill(
            isApplication
              ? "Application received! We'll be in touch soon."
              : "Message sent! We'll be in touch soon.",
            "success",
          );
        } else {
          showFormStatus(
            contactForm,
            "Something went wrong. Please try again in a moment.",
            "error",
          );
          showFormPill("Something went wrong. Try again.", "error");
        }
      })
      .catch(() => {
        showFormStatus(
          contactForm,
          "Something went wrong. Please check your connection and try again.",
          "error",
        );
        showFormPill("Something went wrong. Try again.", "error");
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = btnOriginal;
        }
      });
  });
}
