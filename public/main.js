// Talkestra — small progressive enhancements.
// Plain module, served as-is: no bundler, no build step.

// ── Footer year ──────────────────────────────────────────────────────────
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// ── Mobile navigation ────────────────────────────────────────────────────
const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("site-nav");

if (toggle instanceof HTMLButtonElement && nav) {
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    nav.classList.toggle("is-open", !open);
  });

  // Close the menu after following an in-page link.
  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
    }
  });
}

// ── Dim events whose date has passed ─────────────────────────────────────
// Keeps the season list tidy without editing the markup: add the next
// season's dates and the old ones fade on their own.
const today = new Date();
today.setHours(0, 0, 0, 0);

for (const time of document.querySelectorAll("time[datetime]")) {
  const when = new Date(`${time.getAttribute("datetime")}T23:59:59`);
  if (!Number.isNaN(when.valueOf()) && when < today) {
    time.closest("li")?.classList.add("is-past");
  }
}

console.info("Talkestra — we're talking great music.");
