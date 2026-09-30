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

// ── Performer drawers ───────────────────────────────────────────────
// One slide-in dialog per performer. Each drawer is a <aside role="dialog">
// already in the markup; we only manage open/close, focus, scroll-lock and
// a few ARIA attributes. Only one drawer may be open at a time.

const drawerNodes = Array.from(document.querySelectorAll(".drawer"));
const backdrop = document.querySelector("[data-drawer-backdrop]");
const triggers = Array.from(
  document.querySelectorAll("[data-drawer-open]"),
);

if (drawerNodes.length && triggers.length && backdrop) {
  let active = null; // currently open drawer, or null
  let lastTrigger = null; // element to restore focus to on close

  const focusableSelector =
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

  const open = (id, trigger) => {
    const drawer = document.getElementById(id);
    if (!drawer || drawer === active) return;
    // Close any currently-open drawer first.
    if (active) close();

    lastTrigger = trigger;
    drawer.hidden = false;
    backdrop.hidden = false;
    // Two RAFs: the first paints the drawer in its initial off-screen
    // position (display: flex, transform: translateX(100%)); the second
    // adds .is-open so the browser can transition from that first paint to
    // the open state. Without this, going from hidden → is-open in a single
    // frame is treated as an instant state change and the slide animation
    // is skipped on the first open.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        drawer.classList.add("is-open");
        backdrop.classList.add("is-open");
      });
    });
    drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("drawer-open");

    const heading = drawer.querySelector(".drawer-title");
    if (heading) heading.setAttribute("tabindex", "-1");
    active = drawer;
    // Move focus to the heading after the panel has slid in.
    setTimeout(() => heading && heading.focus(), 100);
  };

  const close = () => {
    if (!active) return;
    active.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    active.setAttribute("aria-hidden", "true");
    document.body.classList.remove("drawer-open");
    const wasActive = active;
    active = null;
    // Wait for the slide-out, then hide. Matches the 0.28s transition.
    setTimeout(() => {
      wasActive.hidden = true;
      backdrop.hidden = true;
    }, 300);
    if (lastTrigger && typeof lastTrigger.focus === "function") {
      lastTrigger.focus();
    }
  };

  // Trap Tab inside the active drawer so keyboard users can't escape into
  // the inert page underneath.
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && active) {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab" || !active) return;
    const focusables = Array.from(active.querySelectorAll(focusableSelector))
      .filter((el) => !el.hasAttribute("hidden") && el.offsetParent !== null);
    if (focusables.length === 0) {
      event.preventDefault();
      active.querySelector(".drawer-title")?.focus();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const id = trigger.getAttribute("data-drawer-open");
      if (id) open(id, trigger);
    });
  });

  document.addEventListener("click", (event) => {
    if (!active) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("[data-drawer-close]")) {
      close();
      return;
    }
    if (target === backdrop) close();
  });
}

console.info("Talkestra — we're talking great music.");
