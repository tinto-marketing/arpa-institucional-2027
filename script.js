/* ArPa — variante cinética · motion engine (vanilla, sem dependências) */
(function () {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none)").matches;

  /* ---------- split headlines into lines/words ---------- */
  function splitLines(el) {
    const text = el.textContent.trim();
    el.textContent = "";
    // split into words, wrap each word; CSS line-boxing handles wrapping,
    // so we wrap the whole thing in one overflow-line per visual line via words.
    const words = text.split(/\s+/);
    const frag = document.createDocumentFragment();
    // Build a single line container; use inline-block words that animate up.
    words.forEach((w, i) => {
      const line = document.createElement("span");
      line.className = "split-line";
      const inner = document.createElement("span");
      inner.textContent = w;
      line.appendChild(inner);
      frag.appendChild(line);
      if (i < words.length - 1) frag.appendChild(document.createTextNode(" "));
    });
    el.appendChild(frag);
  }
  document.querySelectorAll("[data-split]").forEach((el) => {
    splitLines(el);
    // stagger per-word
    el.querySelectorAll(".split-line > span").forEach((s, i) => {
      s.style.transitionDelay = Math.min(i * 0.045, 0.6) + "s";
    });
  });

  /* ---------- word-by-word illuminate for manifesto lead ---------- */
  const litEls = [];
  document.querySelectorAll("[data-words]").forEach((el) => {
    const text = el.textContent.trim();
    el.textContent = "";
    text.split(/\s+/).forEach((w, i) => {
      const span = document.createElement("span");
      span.className = "word";
      span.textContent = w;
      el.appendChild(span);
      if (i < text.split(/\s+/).length - 1) el.appendChild(document.createTextNode(" "));
    });
    litEls.push(el);
  });

  /* ---------- IntersectionObserver reveals ---------- */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
  );
  document.querySelectorAll("[data-reveal], [data-split]").forEach((el) => {
    if (reduce) el.classList.add("is-in");
    else io.observe(el);
  });

  /* ---------- scroll-driven: progress bar, parallax, word illuminate ---------- */
  const progress = document.querySelector("[data-progress]");
  const parallaxEls = Array.from(document.querySelectorAll("[data-parallax]"));
  let ticking = false;

  function onScroll() {
    const st = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = "scaleX(" + (docH > 0 ? st / docH : 0) + ")";

    if (!reduce) {
      const vh = window.innerHeight;
      parallaxEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) return;
        const speed = parseFloat(el.dataset.parallax) || 0.12;
        const centerOffset = rect.top + rect.height / 2 - vh / 2;
        const img = el.querySelector("img") || el;
        img.style.transform = "translate3d(0," + (-centerOffset * speed).toFixed(1) + "px, 0)";
      });

      // word illuminate
      litEls.forEach((el) => {
        const words = el.querySelectorAll(".word");
        const rect = el.getBoundingClientRect();
        const start = vh * 0.8;
        const end = vh * 0.3;
        const prog = (start - rect.top) / (start - end);
        const clamped = Math.max(0, Math.min(1, prog));
        const lit = Math.floor(clamped * words.length);
        words.forEach((w, i) => w.classList.toggle("lit", i < lit));
      });
    }
    ticking = false;
  }
  function requestScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }
  window.addEventListener("scroll", requestScroll, { passive: true });
  window.addEventListener("resize", requestScroll);
  onScroll();

  /* ---------- marquee (auto + scroll-reactive) ---------- */
  const marquee = document.querySelector("[data-marquee]");
  if (marquee && !reduce) {
    let pos = 0;
    let half = marquee.scrollWidth / 2;
    let lastScroll = window.scrollY;
    function loopMarquee() {
      const now = window.scrollY;
      const delta = now - lastScroll;
      lastScroll = now;
      pos -= 0.6 + Math.abs(delta) * 0.25;
      if (Math.abs(pos) >= half) pos = 0;
      marquee.style.transform = "translate3d(" + pos + "px,0,0)";
      requestAnimationFrame(loopMarquee);
    }
    requestAnimationFrame(loopMarquee);
    window.addEventListener("resize", () => { half = marquee.scrollWidth / 2; });
  }

  /* ---------- horizontal sectors: wheel + drag ---------- */
  const hscroll = document.querySelector("[data-hscroll-track]");
  if (hscroll) {
    let isDown = false, startX = 0, startScroll = 0;
    hscroll.addEventListener("pointerdown", (e) => {
      isDown = true; startX = e.clientX; startScroll = hscroll.scrollLeft; hscroll.setPointerCapture(e.pointerId);
    });
    hscroll.addEventListener("pointermove", (e) => {
      if (!isDown) return;
      hscroll.scrollLeft = startScroll - (e.clientX - startX);
    });
    hscroll.addEventListener("pointerup", () => { isDown = false; });
    hscroll.addEventListener("pointercancel", () => { isDown = false; });
  }

  /* ---------- custom cursor + magnetic ---------- */
  if (!isTouch && !reduce) {
    const cursor = document.querySelector("[data-cursor]");
    let cx = window.innerWidth / 2, cy = window.innerHeight / 2, tx = cx, ty = cy;
    window.addEventListener("mousemove", (e) => { tx = e.clientX; ty = e.clientY; });
    function follow() {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      if (cursor) cursor.style.transform = "translate(" + cx + "px," + cy + "px) translate(-50%,-50%)";
      requestAnimationFrame(follow);
    }
    follow();
    document.querySelectorAll("a, button, [data-magnetic]").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor && cursor.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cursor && cursor.classList.remove("is-hover"));
    });
    // magnetic buttons
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const mx = e.clientX - (r.left + r.width / 2);
        const my = e.clientY - (r.top + r.height / 2);
        el.style.transform = "translate(" + mx * 0.28 + "px," + my * 0.4 + "px)";
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  }

  /* ---------- header hide on scroll down ---------- */
  const header = document.querySelector("[data-header]");
  let lastY = 0;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    if (header) header.style.opacity = y > lastY && y > 400 ? "0" : "1";
    lastY = y;
  }, { passive: true });
})();
