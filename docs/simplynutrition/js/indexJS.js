/* ============================================================
   SIMPLY NUTRITION v2 — Index Page JavaScript
   Page-specific logic only. Shared behavior is in globalJS.js
   ============================================================ */

// ── Drink Selector: Data ──

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

// ── Drink Selector: DOM Refs (module-level — shared across init functions) ──

const heroBgOverlay = document.getElementById("heroBgOverlay");
const heroBlob = document.getElementById("heroBlob");
const heroHeadline = document.getElementById("heroHeadline");
const heroSub = document.getElementById("heroSub");
const heroCtas = document.getElementById("heroCtas");
const drinkCards = document.querySelectorAll(".drinkCard");

// ── Drink Selector: Activate ──

function activateDrink(key, animate = true) {
  const d = drinkData[key];
  if (!d) return;

  if (heroBgOverlay) heroBgOverlay.style.background = d.bgTint;
  if (heroBlob) heroBlob.style.background = d.blobColor;

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
    if (animate) heroSub.style.opacity = "0";

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

  drinkCards.forEach((card) => card.classList.remove("active", "drinkSelected"));

  const activeCard = document.querySelector(`.drinkCard[data-drink="${key}"]`);
  if (activeCard) activeCard.classList.add("active", "drinkSelected");
}

// ── Init: Drink Selector ──

function initDrinkSelector() {
  if (!drinkCards.length) return;

  drinkCards.forEach((card) => {
    card.addEventListener("click", () => activateDrink(card.dataset.drink, true));
  });

  activateDrink("pinkSugar", false);
}

// ── Init: Business Hours Badge ──

function initBusinessHours() {
  const dot = document.querySelector(".heroBadgeDot");
  const badgeText = document.getElementById("heroBadgeText");
  if (!dot || !badgeText) return;

  const now = new Date();
  const day = now.getDay();
  const time = now.getHours() * 60 + now.getMinutes();
  const isWeekend = day === 0 || day === 6;
  const openTime = isWeekend ? 8 * 60 : 7 * 60;
  const closeTime = isWeekend ? 16 * 60 : 18 * 60;
  const isOpen = time >= openTime && time < closeTime;

  dot.style.background = isOpen ? "#4CAF50" : "#F44336";
  badgeText.textContent = isOpen
    ? "Now Open in Wheelersburg, OH"
    : "We are closed in store \u2014 Be back in the morning";
}

// ── Init: Guided Drink Intro ──

function initDrinkIntro() {
  if (!drinkCards.length) return;

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

    setTimeout(() => {
      activateDrink(sequence[step++], true);

      introInterval = setInterval(() => {
        activateDrink(sequence[step++], true);

        if (step >= sequence.length) {
          clearInterval(introInterval);
          introInterval = setTimeout(() => {
            activateDrink("pinkSugar", true);
            introInterval = null;
          }, 900);
        }
      }, 1100);
    }, 800);
  }

  drinkCards.forEach((card) => card.addEventListener("click", cancelIntro));
  runDrinkIntro();
}

// ── Init: Tablet Carousel ──

function initTabletCarousel() {
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
}

// ── Init: Menu Tabs ──

function initMenuTabs() {
  const menuTabs = document.querySelectorAll(".menuTab");
  const menuItems = document.querySelectorAll(".menuItem");
  if (!menuTabs.length) return;

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
}

// ── Init: Today's Hours ──

function initTodaysHours() {
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
}

// ── VIP System: Module-level state ──

const vipOverlay = document.getElementById("vipOverlay");
let vipShown = false;

// ── Init: VIP Popup + Pull Tab ──

function initVipSystem() {
  if (!vipOverlay) return;

  const vipClose = document.getElementById("vipClose");
  const vipForm = document.getElementById("vipForm");
  const vipFooterLink = document.getElementById("vipFooterLink");

  function showVipPopup() {
    if (vipShown || sessionStorage.getItem("vipDismissed")) return;
    vipShown = true;
    vipOverlay.classList.add("visible");
    vipOverlay.setAttribute("aria-hidden", "false");
  }

  function hideVipPopup() {
    vipOverlay.classList.remove("visible", "active");
    vipOverlay.setAttribute("aria-hidden", "true");
    sessionStorage.setItem("vipDismissed", "1");
  }

  // Footer link bypasses auto-popup guards
  if (vipFooterLink) {
    vipFooterLink.addEventListener("click", (e) => {
      e.preventDefault();
      vipShown = true;
      vipOverlay.classList.add("active", "visible");
      vipOverlay.setAttribute("aria-hidden", "false");
    });
  }

  // Scroll trigger: show after 40% scroll depth
  window.addEventListener(
    "scroll",
    () => {
      const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (pct > 0.4) showVipPopup();
    },
    { passive: true },
  );

  // Fallback timer: 12 seconds
  setTimeout(showVipPopup, 12000);

  // Close triggers
  if (vipClose) vipClose.addEventListener("click", hideVipPopup);

  vipOverlay.addEventListener("click", (e) => {
    if (e.target === vipOverlay) hideVipPopup();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && vipOverlay.classList.contains("visible")) hideVipPopup();
  });

  // Restore body scroll when overlay finishes closing
  vipOverlay.addEventListener("transitionend", (e) => {
    if (e.propertyName === "opacity" && !vipOverlay.classList.contains("visible")) {
      document.body.style.overflow = "";
    }
  });

  // VIP success pill with copyable code
  function showVipSuccessPill() {
    const pill = document.createElement("div");
    pill.className = "formSuccessPill vipSuccessPill";

    const header = document.createElement("div");
    header.className = "vipSuccessPillHeader";
    const check = document.createElement("span");
    check.className = "vipSuccessCheck";
    check.textContent = "\u2713";
    const title = document.createElement("span");
    title.className = "vipSuccessTitle";
    title.textContent = "You're in";
    header.append(check, title);

    const body = document.createElement("p");
    body.className = "vipSuccessBody";
    body.textContent = "Thanks for signing up for the VIP Club.";

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

    function fallbackCopy(code) {
      const ta = document.createElement("textarea");
      ta.value = code;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, 999999);
      try {
        document.execCommand("copy");
        handleCopySuccess();
      } catch {
        copyHint.textContent = "Tap and hold to copy";
      }
      document.body.removeChild(ta);
    }

    const copyCode = () => {
      const code = "VIP10";
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(code).then(handleCopySuccess).catch(() => fallbackCopy(code));
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

  // VIP form via SimplyForms
  if (vipForm && window.SimplyForms) {
    SimplyForms.setupFormSubmission(vipForm, {
      loadingText: "Joining...",
      onSuccess: () => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        hideVipPopup();
        setTimeout(showVipSuccessPill, 700);
      },
    });
  }

  // VIP pull tab
  const pullTab = document.getElementById("vipPullTab");
  const panel = document.getElementById("vipPanel");
  const panelClose = document.getElementById("vipPanelClose");
  const panelCta = document.getElementById("vipPanelCta");

  if (!pullTab || !panel) return;

  function openPanel() {
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
  }

  function closePanel() {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
  }

  function openVipModal() {
    closePanel();
    setTimeout(() => {
      vipShown = true;
      vipOverlay.classList.add("visible");
      vipOverlay.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }, 220);
  }

  pullTab.addEventListener("click", () => {
    panel.classList.contains("open") ? closePanel() : openPanel();
  });

  pullTab.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      panel.classList.contains("open") ? closePanel() : openPanel();
    }
  });

  if (panelClose) panelClose.addEventListener("click", closePanel);
  if (panelCta) panelCta.addEventListener("click", openVipModal);

  document.addEventListener("click", (e) => {
    if (
      panel.classList.contains("open") &&
      !panel.contains(e.target) &&
      !pullTab.contains(e.target)
    ) {
      closePanel();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel.classList.contains("open")) closePanel();
  });

  // Hide pull tab when #findUs bottom reaches 75% of viewport
  const findUsSection = document.getElementById("findUs");

  function updatePillVisibility() {
    if (!findUsSection) return;
    const bottom = findUsSection.getBoundingClientRect().bottom;
    const hide = bottom <= window.innerHeight * 0.75;
    pullTab.style.opacity = hide ? "0" : "";
    pullTab.style.pointerEvents = hide ? "none" : "";
  }

  window.addEventListener("scroll", updatePillVisibility, { passive: true });
  updatePillVisibility();
}

// ── Init: How Did You Find Us Tracking ──

function initTracking() {
  const findUsOptions = document.querySelectorAll(".findUsOption");
  if (!findUsOptions.length) return;

  const endpoint = "https://formspree.io/f/xojpjavp";
  let isSubmitting = false;

  const setDisabledState = (disabled) =>
    findUsOptions.forEach((opt) => { opt.disabled = disabled; });

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
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ formType: "How did you find us", source: selectedSource }),
        });

        if (!response.ok) throw new Error(`Status ${response.status}`);

        SimplyForms.showFloatingPill("Thanks for letting us know!");
      } catch {
        SimplyForms.showFloatingPill(
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

// ── Run ──

initDrinkSelector();
initBusinessHours();
initDrinkIntro();
initTabletCarousel();
initMenuTabs();
initTodaysHours();
initVipSystem();
initTracking();
