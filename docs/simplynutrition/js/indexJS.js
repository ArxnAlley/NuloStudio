/* ============================================================
   SIMPLY NUTRITION v2 — Index Page JavaScript
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

// ── Drink Selector ──

const drinkData = {
  pinkSugar: {
    headline: ["Better Energy", "Starts Here"],
    italic: "Starts Here",
    sub: "Refreshing teas, protein shakes, smoothies, and bowls made to fuel your day.",
    accentColor: "#F48FB1",
    bgTint: "rgba(252, 228, 236, 0.45)",
    blobColor: "rgba(244, 143, 177, 1)",
  },

  tropical: {
    headline: ["Taste The", "Tropics"],
    italic: "Tropics",
    sub: "Bold citrus and tropical fruit flavors fused with clean energy. Zero crash, all day glow.",
    accentColor: "#FF7043",
    bgTint: "rgba(255, 236, 225, 0.45)",
    blobColor: "rgba(255, 112, 67, 1)",
  },

  berry: {
    headline: ["Go Bold With", "Berry Blast"],
    italic: "Berry Blast",
    sub: "Deep berry goodness packed with antioxidants and natural energy. The fan favorite is here.",
    accentColor: "#7B1FA2",
    bgTint: "rgba(237, 222, 247, 0.45)",
    blobColor: "rgba(123, 31, 162, 1)",
  },

  lemon: {
    headline: ["Fresh & Bright", "Lemon Lime"],
    italic: "Lemon Lime",
    sub: "Crisp citrus energy with a kick. Light, refreshing, and perfect before or after the gym.",
    accentColor: "#8BC34A",
    bgTint: "rgba(236, 247, 219, 0.45)",
    blobColor: "rgba(139, 195, 74, 1)",
  },

  heart: {
    headline: ["Happy Heart,", "Happy You"],
    italic: "Happy You",
    sub: "Hydrate and energize with love. This feel-good blend keeps you glowing all day long.",
    accentColor: "#E91E63",
    bgTint: "rgba(252, 228, 236, 0.45)",
    blobColor: "rgba(233, 30, 99, 1)",
  },

  coffee: {
    headline: ["Skip The", "Coffee Line"],
    italic: "Coffee Line",
    sub: "Rich, creamy, and packed with protein. The morning upgrade that actually keeps you full.",
    accentColor: "#795548",
    bgTint: "rgba(245, 236, 231, 0.45)",
    blobColor: "rgba(121, 85, 72, 1)",
  },
};

const heroBgOverlay = document.getElementById("heroBgOverlay");

const heroBlob = document.getElementById("heroBlob");

const heroHeadline = document.getElementById("heroHeadline");

const heroSub = document.getElementById("heroSub");

const heroCtas = document.getElementById("heroCtas");

const drinkCards = document.querySelectorAll(".drinkCard");

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
      heroHeadline.style.opacity = "0";
      heroHeadline.style.transform = "translateY(12px)";
    }

    setTimeout(
      () => {
        heroHeadline.innerHTML = `${d.headline[0]} <span class="italic">${d.italic}</span>`;
        heroHeadline.style.transition =
          "opacity 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)";
        heroHeadline.style.opacity = "1";
        heroHeadline.style.transform = "translateY(0)";
      },
      animate ? 160 : 0,
    );
  }

  if (heroSub) {
    if (animate) {
      heroSub.style.opacity = "0";
    }

    setTimeout(
      () => {
        heroSub.textContent = d.sub;
        heroSub.style.transition = "opacity 0.4s ease";
        heroSub.style.opacity = "1";
      },
      animate ? 200 : 0,
    );
  }

  if (heroCtas && animate) {
    heroCtas.classList.remove("slideIn");
    void heroCtas.offsetWidth;
    heroCtas.classList.add("slideIn");
  }

  drinkCards.forEach((card) => card.classList.remove("active"));

  const activeCard = document.querySelector(`.drinkCard[data-drink="${key}"]`);

  if (activeCard) {
    activeCard.classList.add("active");
  }
}

drinkCards.forEach((card) => {
  card.addEventListener("click", () => activateDrink(card.dataset.drink, true));
});

activateDrink("pinkSugar", false);

// ── Hero Badge: Dynamic Open / Closed Status ──

function checkBusinessHours() {
  const now = new Date();
  const day = now.getDay(); // 0 Sun … 6 Sat
  const time = now.getHours() * 60 + now.getMinutes(); // minutes since midnight

  const isWeekend = day === 0 || day === 6;
  const openTime = isWeekend ? 8 * 60 : 7 * 60; // 8:00 or 7:00 AM
  const closeTime = isWeekend ? 16 * 60 : 18 * 60; // 4:00 or 6:00 PM
  const isOpen = time >= openTime && time < closeTime;

  const dot = document.querySelector(".heroBadgeDot");
  const badgeText = document.getElementById("heroBadgeText");

  if (!dot || !badgeText) return;

  dot.style.background = isOpen ? "#4CAF50" : "#F44336";
  badgeText.textContent = isOpen
    ? "Now Open in Wheelersburg, OH"
    : "We are closed in store — Be back in the morning";
}

checkBusinessHours();

// ── Guided Drink Intro (runs once on load) ──

// ── How Did You Find Us Tracking ──

(function () {
  const findUsOptions = document.querySelectorAll(".findUsOption");
  const endpoint = "https://formspree.io/f/xojpjavp";
  let isSubmitting = false;

  if (findUsOptions.length) {
    const showTrackingMessage = (message, type = "success") => {
      if (window.SimplyForms?.showFloatingPill) {
        window.SimplyForms.showFloatingPill(message, type);
        return;
      }

      showFormPill(message, type);
    };

    const setDisabledState = (disabled) => {
      findUsOptions.forEach((option) => {
        option.disabled = disabled;
      });
    };

    findUsOptions.forEach((option) => {
      option.addEventListener("click", async () => {
        if (isSubmitting) return;

        const selectedSource = option.dataset.source;
        if (!selectedSource) return;

        isSubmitting = true;
        setDisabledState(true);
        option.classList.add("isActive");

        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              formType: "How did you find us",
              source: selectedSource,
            }),
          });

          if (!response.ok) {
            throw new Error(
              `Tracking request failed with status ${response.status}`,
            );
          }

          showTrackingMessage("Thanks for letting us know!");
        } catch (error) {
          showTrackingMessage(
            "We couldn't save that right now. Please try again in a moment.",
            "error",
          );
        } finally {
          setTimeout(() => {
            option.classList.remove("isActive");
            setDisabledState(false);
            isSubmitting = false;
          }, 900);
        }
      });
    });
  }
})();

(function () {
  let introPlayed = false;
  let introInterval = null;
  const sequence = ["pinkSugar", "tropical", "berry"];
  let step = 0;

  function cancelIntro() {
    clearInterval(introInterval);
    introInterval = null;
  }

  function runDrinkIntro() {
    if (introPlayed) return;
    introPlayed = true;

    setTimeout(function () {
      activateDrink(sequence[step++], true);

      introInterval = setInterval(function () {
        activateDrink(sequence[step++], true);

        if (step >= sequence.length) {
          clearInterval(introInterval);
          introInterval = setTimeout(function () {
            activateDrink("pinkSugar", true);
            introInterval = null;
          }, 900);
        }
      }, 1100);
    }, 800);
  }

  document.querySelectorAll(".drinkCard").forEach(function (card) {
    card.addEventListener("click", cancelIntro);
  });

  runDrinkIntro();
})();

// ── Tablet Carousel: activate drink on scroll-snap ──

(function () {
  const drinksEl = document.querySelector(".heroDrinks");
  const cards = [...document.querySelectorAll(".drinkCard")];

  if (!drinksEl) return;

  let scrollTimer = null;

  drinksEl.addEventListener("scroll", () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const cardWidth = (cards[0] ? cards[0].offsetWidth : 260) + 14;
      const index = Math.min(
        Math.round(drinksEl.scrollLeft / cardWidth),
        cards.length - 1,
      );
      const key = cards[index] && cards[index].dataset.drink;
      if (key) activateDrink(key, true);
    }, 80);
  });
})();

// ── Menu Tabs ──

const menuTabs = document.querySelectorAll(".menuTab");

const menuItems = document.querySelectorAll(".menuItem");

menuTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    menuTabs.forEach((t) => t.classList.remove("active"));

    tab.classList.add("active");

    const cat = tab.dataset.cat;

    menuItems.forEach((item) => {
      item.classList.toggle("visible", item.dataset.cat === cat);
    });
  });
});

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

// ── Today's Hours ──

const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const todayName = days[new Date().getDay()];

document.querySelectorAll(".hoursRow").forEach((row) => {
  const dayEl = row.querySelector(".hoursDay");

  if (dayEl && dayEl.textContent.trim() === todayName) {
    row.classList.add("today");
  }
});

// ── Simply VIP Club Popup ──

const vipOverlay = document.getElementById("vipOverlay");

const vipClose = document.getElementById("vipClose");

const vipForm = document.getElementById("vipForm");

const vipFooterLink = document.getElementById("vipFooterLink");

let vipShown = false;

function showVipPopup() {
  if (vipShown) return;

  if (sessionStorage.getItem("vipDismissed")) return;

  vipShown = true;

  vipOverlay.classList.add("visible");

  vipOverlay.setAttribute("aria-hidden", "false");
}

function hideVipPopup() {
  vipOverlay.classList.remove("visible");

  vipOverlay.classList.remove("active");

  vipOverlay.setAttribute("aria-hidden", "true");

  sessionStorage.setItem("vipDismissed", "1");
}

if (vipFooterLink && vipOverlay) {
  vipFooterLink.addEventListener("click", function (e) {
    e.preventDefault();
    vipShown = true;
    vipOverlay.classList.add("active");
    vipOverlay.classList.add("visible");
    vipOverlay.setAttribute("aria-hidden", "false");
  });
}

// Trigger after scrolling 40% down the page

window.addEventListener(
  "scroll",
  () => {
    const scrollPct =
      window.scrollY / (document.body.scrollHeight - window.innerHeight);

    if (scrollPct > 0.4) {
      showVipPopup();
    }
  },
  { passive: true },
);

// Trigger after 12 seconds on page (fallback for users who don't scroll)

setTimeout(showVipPopup, 12000);

// Close on X button

if (vipClose) {
  vipClose.addEventListener("click", hideVipPopup);
}

// Close on overlay click (outside modal)

if (vipOverlay) {
  vipOverlay.addEventListener("click", (e) => {
    if (e.target === vipOverlay) {
      hideVipPopup();
    }
  });
}

// Close on Escape key

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && vipOverlay.classList.contains("visible")) {
    hideVipPopup();
  }
});

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
    .querySelectorAll(".formInput, .vipInput, .formSelect, .formTextarea")
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

// ── VIP Success Pill (rich layout with copyable code) ──

function showVipSuccessPill() {
  const pill = document.createElement("div");
  pill.className = "formSuccessPill vipSuccessPill";

  // Header: ✓ You're in
  const header = document.createElement("div");
  header.className = "vipSuccessPillHeader";
  const check = document.createElement("span");
  check.className = "vipSuccessCheck";
  check.textContent = "✓";
  const title = document.createElement("span");
  title.className = "vipSuccessTitle";
  title.textContent = "You're in";
  header.append(check, title);

  // Body text
  const body = document.createElement("p");
  body.className = "vipSuccessBody";
  body.textContent = "Thanks for signing up for the VIP Club.";

  // Code row
  const codeRow = document.createElement("div");
  codeRow.className = "vipSuccessCodeRow";
  codeRow.appendChild(document.createTextNode("Use code: "));

  const codeBadge = document.createElement("span");
  codeBadge.className = "vipCodeBadge";
  codeBadge.textContent = "VIP10";
  codeBadge.title = "Tap to copy";

  const copyButton = document.createElement("button");
  copyButton.className = "vipCopyButton";
  copyButton.type = "button";
  copyButton.textContent = "Copy";

  const copyHint = document.createElement("span");
  copyHint.className = "vipCopyHint";
  copyHint.textContent = "Tap to copy";

  function fallbackCopy(code) {
    const textArea = document.createElement("textarea");
    textArea.value = code;

    textArea.style.position = "fixed";
    textArea.style.opacity = "0";

    document.body.appendChild(textArea);

    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, 999999);

    try {
      document.execCommand("copy");
      handleCopySuccess();
    } catch {
      copyHint.textContent = "Tap and hold to copy";
    }

    document.body.removeChild(textArea);
  }

  function handleCopySuccess() {
    copyHint.textContent = "Copied!";
    copyHint.classList.add("copied");
    copyButton.textContent = "Copied";

    setTimeout(() => {
      copyHint.textContent = "Tap to copy";
      copyHint.classList.remove("copied");
      copyButton.textContent = "Copy";
    }, 1600);
  }

  const copyCode = () => {
    const code = "VIP10";

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(code)
        .then(() => {
          handleCopySuccess();
        })
        .catch(() => {
          fallbackCopy(code);
        });
    } else {
      fallbackCopy(code);
    }
  };

  codeBadge.addEventListener("click", copyCode);
  copyButton.addEventListener("click", copyCode);

  codeRow.append(codeBadge, copyButton);
  pill.append(header, body, codeRow, copyHint);
  document.body.appendChild(pill);

  requestAnimationFrame(() =>
    requestAnimationFrame(() => pill.classList.add("visible")),
  );

  setTimeout(() => {
    pill.classList.remove("visible");
    setTimeout(() => pill.parentNode && pill.parentNode.removeChild(pill), 400);
  }, 6200);
}

// ── VIP Form Submission ──

if (vipForm && window.SimplyForms) {
  SimplyForms.setupFormSubmission(vipForm, {
    loadingText: "Joining...",
    onSuccess: () => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      hideVipPopup();
      setTimeout(() => {
        showVipSuccessPill();
      }, 700);
    },
  });
}

// ── VIP Pull Tab System ──

(function () {
  const pullTab = document.getElementById("vipPullTab");
  const panel = document.getElementById("vipPanel");
  const panelClose = document.getElementById("vipPanelClose");
  const panelCta = document.getElementById("vipPanelCta");

  if (!pullTab || !panel || !vipOverlay) return;

  // ── Panel helpers ──

  function openPanel() {
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
  }

  function closePanel() {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
  }

  // ── Open existing modal directly, bypassing auto-popup guards ──

  function openVipModal() {
    closePanel();
    setTimeout(function () {
      vipShown = true;
      vipOverlay.classList.add("visible");
      vipOverlay.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }, 220);
  }

  // ── Pull tab: toggle panel ──

  pullTab.addEventListener("click", function () {
    panel.classList.contains("open") ? closePanel() : openPanel();
  });

  pullTab.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      panel.classList.contains("open") ? closePanel() : openPanel();
    }
  });

  // ── Panel controls ──

  panelClose.addEventListener("click", closePanel);
  panelCta.addEventListener("click", openVipModal);

  // ── Close panel on outside click ──

  document.addEventListener("click", function (e) {
    if (
      panel.classList.contains("open") &&
      !panel.contains(e.target) &&
      !pullTab.contains(e.target)
    ) {
      closePanel();
    }
  });

  // ── Close panel on Escape ──

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && panel.classList.contains("open")) {
      closePanel();
    }
  });

  // ── Restore body scroll when modal closes ──

  vipOverlay.addEventListener("transitionend", function (e) {
    if (
      e.propertyName === "opacity" &&
      !vipOverlay.classList.contains("visible")
    ) {
      document.body.style.overflow = "";
    }
  });
})();
