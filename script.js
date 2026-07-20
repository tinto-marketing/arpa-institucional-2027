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

const sectorBrowser = document.querySelector("[data-sector-browser]");
const sectorTabs = sectorBrowser ? [...sectorBrowser.querySelectorAll("[role='tab']")] : [];
const sectorImage = sectorBrowser?.querySelector("[data-sector-image]");
const sectorPanel = sectorBrowser?.querySelector("[role='tabpanel']");
const sectorIndex = sectorBrowser?.querySelector("[data-sector-index]");
const sectorTitle = sectorBrowser?.querySelector("[data-sector-title]");
const sectorText = sectorBrowser?.querySelector("[data-sector-text]");

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

function preloadSectorImages() {
  const preload = () => {
    sectorTabs.forEach((tab) => {
      const image = new Image();
      image.src = `assets/2027/${tab.dataset.sector}-960.webp`;
    });
  };

  if ("requestIdleCallback" in window) window.requestIdleCallback(preload, { timeout: 1400 });
  else window.setTimeout(preload, 500);
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

function activateSector(tab, moveFocus = false) {
  if (!tab || !sectorImage || !sectorPanel) return;

  const name = tab.dataset.sector;
  const wide = `assets/2027/${name}-1920.webp`;
  const small = `assets/2027/${name}-960.webp`;

  sectorTabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
  });

  sectorImage.classList.add("is-changing");
  window.setTimeout(() => {
    sectorImage.src = wide;
    sectorImage.srcset = `${small} 960w, ${wide} 1920w`;
    sectorImage.alt = tab.dataset.alt;
    sectorImage.classList.remove("is-changing");
  }, reducedMotion ? 0 : 180);

  sectorIndex.textContent = `${tab.dataset.index} / 05`;
  sectorTitle.textContent = tab.dataset.title;
  sectorText.textContent = tab.dataset.text;
  sectorPanel.setAttribute("aria-labelledby", tab.id);
  if (moveFocus) tab.focus();
}

function initSectors() {
  sectorTabs.forEach((tab, index) => {
    tab.tabIndex = index === 0 ? 0 : -1;
    tab.addEventListener("click", () => activateSector(tab));
    tab.addEventListener("mouseenter", () => {
      if (window.matchMedia("(hover: hover)").matches) activateSector(tab);
    });
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (["ArrowDown", "ArrowRight"].includes(event.key)) next = (index + 1) % sectorTabs.length;
      if (["ArrowUp", "ArrowLeft"].includes(event.key)) next = (index - 1 + sectorTabs.length) % sectorTabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = sectorTabs.length - 1;
      activateSector(sectorTabs[next], true);
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
initSectors();
preloadSectorImages();
setHeader();
setProgress();
setActiveNav();

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);
