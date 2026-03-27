/* ============================================================
   SIMPLY NUTRITION v2 — Contact & Application Form
   Page-specific logic only. Shared behavior is in globalJS.js
   ============================================================ */

// ── Contact / Application Form Submission ──

function initContactForm() {
  const contactForm = document.getElementById("contactForm");
  if (!contactForm || !window.SimplyForms) return;

  const isApplication = contactForm.action.includes("mvzvzpgn");

  SimplyForms.setupFormSubmission(contactForm, {
    loadingText: "Sending...",
    successMessage: isApplication
      ? "Application received! We'll be in touch soon."
      : "Message sent! We'll be in touch soon.",
  });
}

initContactForm();
