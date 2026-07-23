const body = document.body;
const header = document.querySelector("[data-header]");
const progress = document.querySelector(".reading-progress span");
const menuButton = document.querySelector("[data-menu-button]");
const nav = document.querySelector("[data-nav]");
const navLinks = [...document.querySelectorAll(".site-nav a[href^='#']")];
const heroMedia = document.querySelector("[data-hero-media]");
const heroImage = heroMedia?.querySelector("img");
const revealItems = [...document.querySelectorAll("[data-reveal]")];
const countItems = [...document.querySelectorAll("[data-count]")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const precisePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

const sectorRows = [...document.querySelectorAll("[data-sector-row]")];

function openHero() {
  requestAnimationFrame(() => {
    window.setTimeout(() => heroMedia?.classList.add("is-open"), reducedMotion ? 0 : 120);
  });
}

function initReveal() {
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8%" });

  revealItems.forEach((item) => observer.observe(item));
}

function initHeroParallax() {
  if (!heroMedia || !heroImage || reducedMotion || !precisePointer.matches) return;

  let frame = 0;
  heroMedia.addEventListener("pointermove", (event) => {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const bounds = heroMedia.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * -12;
      const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -8;
      heroMedia.style.setProperty("--hero-shift-x", `${x.toFixed(2)}px`);
      heroMedia.style.setProperty("--hero-shift-y", `${y.toFixed(2)}px`);
    });
  }, { passive: true });

  heroMedia.addEventListener("pointerleave", () => {
    heroMedia.style.setProperty("--hero-shift-x", "0px");
    heroMedia.style.setProperty("--hero-shift-y", "0px");
  });
}

function formatCount(item, value) {
  const prefix = item.dataset.prefix || "";
  const suffix = item.dataset.suffix || "";
  item.textContent = `${prefix}${Math.round(value)}${suffix}`;
}

function initCounts() {
  if (!countItems.length || reducedMotion || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const item = entry.target;
      const target = Number(item.dataset.value || 0);
      const startedAt = performance.now();
      const duration = 850;

      function tick(now) {
        const progressValue = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - Math.pow(1 - progressValue, 3);
        formatCount(item, target * eased);
        if (progressValue < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
      currentObserver.unobserve(item);
    });
  }, { threshold: 0.65 });

  countItems.forEach((item) => observer.observe(item));
}

function setHeader() {
  header?.classList.toggle("is-solid", window.scrollY > 30);
}

function setProgress() {
  if (!progress) return;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const value = scrollable > 0 ? window.scrollY / scrollable : 0;
  progress.style.transform = `scaleX(${Math.min(1, Math.max(0, value))})`;
}

function setActiveNav() {
  const marker = window.scrollY + window.innerHeight * 0.34;
  navLinks.forEach((link) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    const active = marker >= target.offsetTop && marker < target.offsetTop + target.offsetHeight;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function closeMenu() {
  nav?.classList.remove("is-open");
  menuButton?.setAttribute("aria-expanded", "false");
  body.classList.remove("menu-open");
}

function initMenu() {
  menuButton?.addEventListener("click", () => {
    const willOpen = !nav?.classList.contains("is-open");
    nav?.classList.toggle("is-open", willOpen);
    menuButton.setAttribute("aria-expanded", String(willOpen));
    body.classList.toggle("menu-open", willOpen);
  });

  navLinks.forEach((link) => link.addEventListener("click", closeMenu));
  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) closeMenu();
  });
}

function openSectorRow(row) {
  sectorRows.forEach((item) => {
    const open = item === row;
    item.classList.toggle("is-open", open);
    item.querySelector(".sector-row__head")?.setAttribute("aria-expanded", String(open));
  });
}

function initSectorRows() {
  sectorRows.forEach((row, index) => {
    const head = row.querySelector(".sector-row__head");
    if (!head) return;
    head.addEventListener("click", () => openSectorRow(row));
    head.addEventListener("mouseenter", () => {
      if (window.matchMedia("(hover: hover)").matches) openSectorRow(row);
    });
    head.addEventListener("keydown", (event) => {
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === "ArrowDown") next = (index + 1) % sectorRows.length;
      if (event.key === "ArrowUp") next = (index - 1 + sectorRows.length) % sectorRows.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = sectorRows.length - 1;
      openSectorRow(sectorRows[next]);
      sectorRows[next].querySelector(".sector-row__head")?.focus();
    });
  });
}

let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    setHeader();
    setProgress();
    setActiveNav();
    ticking = false;
  });
}

openHero();
initReveal();
initHeroParallax();
initCounts();
initMenu();
initSectorRows();
setHeader();
setProgress();
setActiveNav();

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);
