const body = document.body;
const header = document.querySelector("[data-header]");
const progress = document.querySelector(".reading-progress span");
const menuButton = document.querySelector("[data-menu-button]");
const nav = document.querySelector("[data-nav]");
const navLinks = [...document.querySelectorAll(".site-nav a[href^='#']")];
const heroMedia = document.querySelector("[data-hero-media]");
const heroImage = heroMedia?.querySelector("img");
const tickerTrack = document.querySelector("[data-ticker-track]");
const tickerGroup = document.querySelector("[data-ticker-group]");
const tickerToggle = document.querySelector("[data-ticker-toggle]");
const parallaxItems = [...document.querySelectorAll("[data-parallax]")];
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

function splitHeadingIntoWords(heading) {
  const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
  });
  const textNodes = [];
  let currentNode = walker.nextNode();

  while (currentNode) {
    textNodes.push(currentNode);
    currentNode = walker.nextNode();
  }

  let wordIndex = 0;
  textNodes.forEach((node) => {
    const fragment = document.createDocumentFragment();
    node.nodeValue.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) {
        fragment.append(part);
        return;
      }

      const word = document.createElement("span");
      word.className = "motion-word";
      word.style.setProperty("--word-index", wordIndex);
      word.textContent = part;
      fragment.append(word);
      wordIndex += 1;
    });
    node.replaceWith(fragment);
  });

  heading.classList.add("motion-text");
}

function initTextMotion() {
  const headings = [...document.querySelectorAll(".hero h1, .section h2, .section h3, .partnership h2")];
  const copyItems = [...document.querySelectorAll([
    ".hero__intro",
    ".manifesto__body > p",
    ".model__header > p:last-child",
    ".proof__heading > p:last-child",
    ".sectors__heading > p:last-child",
    ".year-round__copy > p:last-child",
    ".impact__heading > p:last-child",
    ".territories__heading > p:last-child",
    ".brand-cases__heading > p:last-child",
    ".partnership__content > p:not(.chapter)",
    ".principles p",
    ".sector-row__in p",
    ".impact__list p:last-child",
    ".brand-case p",
  ].join(","))];

  headings.forEach(splitHeadingIntoWords);
  copyItems.forEach((item) => item.classList.add("motion-copy"));
  body.classList.add("motion-ready");

  const showAll = () => {
    headings.forEach((item) => item.classList.add("is-text-visible"));
    copyItems.forEach((item) => item.classList.add("is-copy-visible"));
  };

  if (reducedMotion || !("IntersectionObserver" in window)) {
    showAll();
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add(entry.target.classList.contains("motion-text") ? "is-text-visible" : "is-copy-visible");
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -6%" });

  headings.forEach((item) => observer.observe(item));
  copyItems.forEach((item) => observer.observe(item));
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

function setTickerSpeed() {
  if (!tickerTrack || !tickerGroup || reducedMotion) return;
  const width = tickerGroup.getBoundingClientRect().width;
  const duration = Math.max(15, width / 58);
  tickerTrack.style.setProperty("--ticker-duration", `${duration.toFixed(2)}s`);
}

function initTicker() {
  setTickerSpeed();
  document.fonts?.ready.then(setTickerSpeed);

  if (reducedMotion && tickerToggle) {
    tickerToggle.hidden = true;
    return;
  }

  tickerToggle?.addEventListener("click", () => {
    const ticker = tickerToggle.closest("[data-ticker]");
    const paused = ticker?.classList.toggle("is-paused") || false;
    const label = tickerToggle.querySelector("span");
    const icon = tickerToggle.querySelector("i");
    tickerToggle.setAttribute("aria-label", paused ? "Retomar faixa em movimento" : "Pausar faixa em movimento");
    if (label) label.textContent = paused ? "Retomar" : "Pausar";
    if (icon) icon.textContent = paused ? "▶" : "Ⅱ";
  });
}

function setParallax() {
  if (reducedMotion || !parallaxItems.length) return;
  const viewportHeight = window.innerHeight;
  const isMobile = window.innerWidth < 700;
  const motionFactor = isMobile ? 0.9 : 1;

  if (isMobile && heroMedia && heroImage) {
    const heroBounds = heroMedia.getBoundingClientRect();
    const heroActive = heroBounds.bottom >= -120 && heroBounds.top <= viewportHeight + 120;
    heroMedia.classList.toggle("is-scroll-parallax-active", heroActive);
    if (heroActive) {
      const heroOffset = (heroBounds.top + heroBounds.height / 2 - viewportHeight / 2) / (viewportHeight + heroBounds.height);
      const heroShift = Math.max(-18, Math.min(18, heroOffset * -36));
      heroImage.style.transform = `translate3d(0, ${heroShift.toFixed(2)}px, 0) scale(1.085)`;
    }
  }

  parallaxItems.forEach((item, index) => {
    const bounds = item.getBoundingClientRect();
    const image = item.querySelector("img");
    const active = bounds.bottom >= -120 && bounds.top <= viewportHeight + 120;
    item.classList.toggle("is-parallax-active", active);
    if (!active || !image) return;
    const centerOffset = (bounds.top + bounds.height / 2 - viewportHeight / 2) / (viewportHeight + bounds.height);
    const intensity = Number(item.dataset.parallax || 12) * motionFactor;
    const shift = Math.max(-intensity, Math.min(intensity, centerOffset * -intensity * 2));
    const direction = index % 2 === 0 ? -1 : 1;
    const horizontalShift = shift * direction * (isMobile ? 0.3 : 0.16);
    const rotation = isMobile ? shift * direction * 0.012 : 0;
    image.style.transform = `translate3d(${horizontalShift.toFixed(2)}px, ${shift.toFixed(2)}px, 0) rotate(${rotation.toFixed(3)}deg) scale(1.085)`;
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
  menuButton?.setAttribute("aria-label", "Abrir menu");
  body.classList.remove("menu-open");
}

function initMenu() {
  menuButton?.addEventListener("click", () => {
    const willOpen = !nav?.classList.contains("is-open");
    nav?.classList.toggle("is-open", willOpen);
    menuButton.setAttribute("aria-expanded", String(willOpen));
    menuButton.setAttribute("aria-label", willOpen ? "Fechar menu" : "Abrir menu");
    body.classList.toggle("menu-open", willOpen);
  });

  navLinks.forEach((link) => link.addEventListener("click", closeMenu));
  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) closeMenu();
  });
}

function openSectorRow(row, instant = false) {
  const list = row.closest(".sector-list");
  if (instant) list?.classList.add("is-keyboard-nav");

  sectorRows.forEach((item) => {
    const open = item === row;
    item.classList.toggle("is-open", open);
    item.querySelector(".sector-row__head")?.setAttribute("aria-expanded", String(open));
  });

  if (instant) requestAnimationFrame(() => list?.classList.remove("is-keyboard-nav"));
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
      openSectorRow(sectorRows[next], true);
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
    setParallax();
    ticking = false;
  });
}

initTextMotion();
openHero();
initReveal();
initHeroParallax();
initTicker();
initCounts();
initMenu();
initSectorRows();
setHeader();
setProgress();
setActiveNav();
setParallax();

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", () => {
  setTickerSpeed();
  onScroll();
});
