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
const audienceCharts = [...document.querySelectorAll("[data-audience-chart]")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const precisePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const parallaxMotionStates = new Map();
let parallaxMotionFrame = 0;

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
    ".proof__community-copy > p:last-child",
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

function renderParallaxMotion() {
  let keepAnimating = false;

  parallaxMotionStates.forEach((state, image) => {
    if (!state.moving) return;
    state.x += (state.targetX - state.x) * state.response;
    state.y += (state.targetY - state.y) * state.response;
    state.rotation += (state.targetRotation - state.rotation) * state.response;
    state.scale += (state.targetScale - state.scale) * state.response;

    image.style.transform = `translate3d(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px, 0) rotate(${state.rotation.toFixed(3)}deg) scale(${state.scale.toFixed(4)})`;

    const remaining = Math.max(
      Math.abs(state.targetX - state.x),
      Math.abs(state.targetY - state.y),
      Math.abs(state.targetRotation - state.rotation) * 10,
      Math.abs(state.targetScale - state.scale) * 100,
    );
    if (remaining > 0.025) {
      keepAnimating = true;
    } else {
      state.x = state.targetX;
      state.y = state.targetY;
      state.rotation = state.targetRotation;
      state.scale = state.targetScale;
      state.moving = false;
      image.style.transform = `translate3d(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px, 0) rotate(${state.rotation.toFixed(3)}deg) scale(${state.scale.toFixed(4)})`;
    }
  });

  if (keepAnimating) parallaxMotionFrame = requestAnimationFrame(renderParallaxMotion);
  else parallaxMotionFrame = 0;
}

function setParallaxTarget(image, { x = 0, y = 0, rotation = 0, scale = 1.11, response = 0.06 }) {
  let state = parallaxMotionStates.get(image);
  if (!state) {
    state = { x: 0, y: 0, rotation: 0, scale: 1.11, targetX: x, targetY: y, targetRotation: rotation, targetScale: scale, response, moving: true };
    parallaxMotionStates.set(image, state);
  } else {
    state.targetX = x;
    state.targetY = y;
    state.targetRotation = rotation;
    state.targetScale = scale;
    state.response = response;
    state.moving = true;
  }

  if (!parallaxMotionFrame) parallaxMotionFrame = requestAnimationFrame(renderParallaxMotion);
}

function setParallax() {
  if (reducedMotion || !parallaxItems.length) return;
  const viewportHeight = window.innerHeight;
  const isMobile = window.innerWidth < 700;
  const motionFactor = isMobile ? 1.3 : 1.45;
  const activePadding = viewportHeight * 0.42;

  if (heroMedia && heroImage) {
    if (isMobile) {
      const heroBounds = heroMedia.getBoundingClientRect();
      const heroActive = heroBounds.bottom >= -activePadding && heroBounds.top <= viewportHeight + activePadding;
      heroMedia.classList.toggle("is-scroll-parallax-active", heroActive);
      if (heroActive) {
        const heroOffset = (heroBounds.top + heroBounds.height / 2 - viewportHeight / 2) / (viewportHeight + heroBounds.height);
        const heroShift = Math.max(-32, Math.min(32, heroOffset * -68));
        setParallaxTarget(heroImage, { y: heroShift, scale: 1.11, response: 0.052 });
      }
    } else {
      heroMedia.classList.remove("is-scroll-parallax-active");
      parallaxMotionStates.delete(heroImage);
      heroImage.style.removeProperty("transform");
    }
  }

  parallaxItems.forEach((item, index) => {
    const bounds = item.getBoundingClientRect();
    const image = item.querySelector("img");
    const active = bounds.bottom >= -activePadding && bounds.top <= viewportHeight + activePadding;
    item.classList.toggle("is-parallax-active", active);
    if (!active || !image) return;
    const centerOffset = (bounds.top + bounds.height / 2 - viewportHeight / 2) / (viewportHeight + bounds.height);
    const intensity = Number(item.dataset.parallax || 12) * motionFactor;
    const shift = Math.max(-intensity * 1.45, Math.min(intensity * 1.45, centerOffset * -intensity * 2.8));
    const direction = index % 2 === 0 ? -1 : 1;
    const horizontalShift = shift * direction * (isMobile ? 0.18 : 0.12);
    const rotation = isMobile ? shift * direction * 0.006 : 0;
    setParallaxTarget(image, { x: horizontalShift, y: shift, rotation, scale: 1.11, response: isMobile ? 0.052 : 0.064 });
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

function initAudienceCharts() {
  audienceCharts.forEach((chart) => {
    const controls = [...chart.querySelectorAll("[data-audience-control]")];
    const segments = [...chart.querySelectorAll("[data-audience-segment]")];
    const centerValue = chart.querySelector("[data-audience-value]");
    const centerLabel = chart.querySelector("[data-audience-label]");

    function selectAudience(index) {
      const control = controls[index];
      if (!control) return;

      chart.classList.add("has-selection");
      controls.forEach((item, itemIndex) => {
        const selected = itemIndex === index;
        item.classList.toggle("is-selected", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      segments.forEach((item, itemIndex) => item.classList.toggle("is-selected", itemIndex === index));

      const label = control.querySelector("span")?.textContent || "";
      const value = control.querySelector("strong")?.textContent || "";
      if (centerLabel) centerLabel.textContent = label;
      if (centerValue) centerValue.textContent = value;
    }

    controls.forEach((control, index) => {
      control.addEventListener("pointerenter", () => selectAudience(index));
      control.addEventListener("focus", () => selectAudience(index));
      control.addEventListener("click", () => selectAudience(index));
      control.addEventListener("keydown", (event) => {
        if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        let nextIndex = index;
        if (["ArrowRight", "ArrowDown"].includes(event.key)) nextIndex = (index + 1) % controls.length;
        if (["ArrowLeft", "ArrowUp"].includes(event.key)) nextIndex = (index - 1 + controls.length) % controls.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = controls.length - 1;
        selectAudience(nextIndex);
        controls[nextIndex].focus();
      });
    });

    segments.forEach((segment, index) => {
      segment.addEventListener("pointerenter", () => selectAudience(index));
      segment.addEventListener("click", () => selectAudience(index));
    });

    selectAudience(0);
  });
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
initAudienceCharts();
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

/* Presença editorial — cards que expandem no lugar (acordeão, um aberto por vez) */
(function () {
  "use strict";
  var tiles = [].slice.call(document.querySelectorAll(".press-tile"));
  if (!tiles.length) return;
  function setOpen(tile, open) {
    tile.classList.toggle("is-open", open);
    tile.setAttribute("aria-expanded", String(open));
    var lbl = tile.querySelector(".press-tile__cta-label");
    if (lbl) lbl.textContent = open ? "Fechar" : "Ler";
  }
  tiles.forEach(function (t) {
    t.addEventListener("click", function () {
      var willOpen = !t.classList.contains("is-open");
      tiles.forEach(function (o) { if (o !== t) setOpen(o, false); });
      setOpen(t, willOpen);
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") tiles.forEach(function (o) { setOpen(o, false); });
  });
})();

/* ============================================================
   Hero Materialização (v15) — cascata das barras + frase word-by-word
   ============================================================ */
(function () {
  var hero = document.querySelector(".hero-mat");
  if (!hero) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  hero.querySelectorAll(".bars i").forEach(function (b, i) {
    b.style.transitionDelay = (i * 150) + "ms";
  });

  var line = hero.querySelector("[data-line]");
  if (line) {
    var words = line.textContent.trim().split(/\s+/);
    line.textContent = "";
    words.forEach(function (w, i) {
      var s = document.createElement("span");
      s.className = "w";
      s.textContent = w;
      s.style.transitionDelay = (4900 + i * 95) + "ms";
      line.appendChild(s);
      if (i < words.length - 1) line.appendChild(document.createTextNode(" "));
    });
  }

  if (reduce) { hero.classList.add("is-in"); return; }
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { hero.classList.add("is-in"); });
  });
})();
