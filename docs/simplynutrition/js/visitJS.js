/* ============================================================
   SIMPLY NUTRITION v2 — Visit Page JavaScript
   Page-specific logic only. Shared behavior is in globalJS.js
   ============================================================ */

// ── Today's Hours Highlight ──

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

initTodaysHours();
