/* ArPa — variante cinética · motion engine (vanilla, sem dependências) */
(function () {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none)").matches;

  /* ---------- split headlines into REAL visual lines ---------- */
  const splitEls = Array.from(document.querySelectorAll("[data-split]"));
  splitEls.forEach((el) => { el.dataset.text = el.textContent.trim(); });

  function splitLines(el) {
    const text = el.dataset.text || el.textContent.trim();
    // 1) lay words out as inline-block to measure real line breaks
    el.textContent = "";
    const words = text.split(/\s+/).map((w) => {
      const s = document.createElement("span");
      s.className = "measure-word";
      s.textContent = w;
      el.appendChild(s);
      el.appendChild(document.createTextNode(" "));
      return s;
    });
    // 2) group by vertical position (same offsetTop = same visual line)
    const lines = [];
    let curTop = null, cur = null;
    words.forEach((w) => {
      const top = w.offsetTop;
      if (curTop === null || Math.abs(top - curTop) > 4) { cur = []; lines.push(cur); curTop = top; }
      cur.push(w.textContent);
    });
    // 3) rebuild: one masked .split-line per visual line
    el.textContent = "";
    lines.forEach((lineWords) => {
      const line = document.createElement("span");
      line.className = "split-line";
      const inner = document.createElement("span");
      inner.textContent = lineWords.join(" ");
      line.appendChild(inner);
      el.appendChild(line);
    });
  }
  function runSplit() { splitEls.forEach(splitLines); }
  // Measure AFTER the display font is ready, else words wrap wrong and clip.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(runSplit);
    setTimeout(runSplit, 1200); // fallback if fonts.ready never resolves
  } else {
    runSplit();
  }

  /* ---------- word-by-word illuminate for manifesto lead ---------- */
  const litEls = [];
  document.querySelectorAll("[data-words]").forEach((el) => {
    const text = el.textContent.trim();
    const parts = text.split(/\s+/);
    el.textContent = "";
    parts.forEach((w, i) => {
      const span = document.createElement("span");
      span.className = "word";
      span.textContent = w;
      el.appendChild(span);
      if (i < parts.length - 1) el.appendChild(document.createTextNode(" "));
    });
    litEls.push(el);
  });

  /* ---------- IntersectionObserver reveals ---------- */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
  );
  const revealEls = Array.from(document.querySelectorAll("[data-reveal], [data-split]"));
  revealEls.forEach((el) => { reduce ? el.classList.add("is-in") : io.observe(el); });
  // safety net: anything already in viewport on load reveals even if IO is late
  window.addEventListener("load", () => {
    revealEls.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("is-in");
    });
  });

  /* ---------- unified scroll loop: progress, parallax, illuminate, header ---------- */
  const progress = document.querySelector("[data-progress]");
  const parallaxEls = Array.from(document.querySelectorAll("[data-parallax]"));
  const header = document.querySelector("[data-header]");
  let ticking = false, lastY = window.scrollY;

  function onScroll() {
    const st = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = "scaleX(" + (docH > 0 ? st / docH : 0) + ")";
    if (header) header.style.opacity = (st > lastY && st > 400) ? "0" : "1";
    lastY = st;

    if (!reduce && !isTouch) {
      const vh = window.innerHeight;
      parallaxEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -240 || rect.top > vh + 240) return;
        const speed = parseFloat(el.dataset.parallax) || 0.12;
        const img = el.querySelector("img") || el;
        const overscan = Math.max(0, (img.offsetHeight - el.clientHeight) / 2);
        const centerOffset = rect.top + rect.height / 2 - vh / 2;
        let y = -centerOffset * speed;
        y = Math.max(-overscan, Math.min(overscan, y)); // clamp to available overscan
        img.style.transform = "translate3d(0," + y.toFixed(1) + "px,0)";
      });

      litEls.forEach((el) => {
        const words = el.querySelectorAll(".word");
        const rect = el.getBoundingClientRect();
        const start = vh * 0.8, end = vh * 0.3;
        const clamped = Math.max(0, Math.min(1, (start - rect.top) / (start - end)));
        const lit = Math.floor(clamped * words.length);
        words.forEach((w, i) => w.classList.toggle("lit", i < lit));
      });
    }
    ticking = false;
  }
  function requestScroll() { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }
  window.addEventListener("scroll", requestScroll, { passive: true });
  window.addEventListener("resize", requestScroll);
  onScroll();

  /* ---------- re-split headlines on resize (debounced) ---------- */
  let resizeT;
  window.addEventListener("resize", () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      splitEls.forEach((el) => {
        const wasIn = el.classList.contains("is-in");
        splitLines(el);
        if (wasIn) el.classList.add("is-in");
      });
    }, 200);
  });

  /* ---------- marquee (auto + scroll-reactive, paused when off-screen) ---------- */
  const marquee = document.querySelector("[data-marquee]");
  if (marquee && !reduce) {
    let pos = 0, half = marquee.scrollWidth / 2, lastScroll = window.scrollY, running = false, rafId;
    function loopMarquee() {
      const now = window.scrollY, delta = now - lastScroll; lastScroll = now;
      pos -= 0.6 + Math.abs(delta) * 0.25;
      if (Math.abs(pos) >= half) pos = 0;
      marquee.style.transform = "translate3d(" + pos + "px,0,0)";
      if (running) rafId = requestAnimationFrame(loopMarquee);
    }
    const rail = marquee.closest(".rail") || marquee;
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !running) { running = true; lastScroll = window.scrollY; loopMarquee(); }
      else if (!e.isIntersecting && running) { running = false; cancelAnimationFrame(rafId); }
    }).observe(rail);
    window.addEventListener("resize", () => { half = marquee.scrollWidth / 2; });
  }

  /* ---------- horizontal sectors: mouse drag with direction lock ---------- */
  const hscroll = document.querySelector("[data-hscroll-track]");
  if (hscroll) {
    let isDown = false, startX = 0, startY = 0, startScroll = 0, locked = false;
    hscroll.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse") return; // touch keeps native scroll
      isDown = true; locked = false; startX = e.clientX; startY = e.clientY; startScroll = hscroll.scrollLeft;
    });
    hscroll.addEventListener("pointermove", (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (!locked) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        if (Math.abs(dy) > Math.abs(dx)) { isDown = false; return; } // vertical gesture: bail
        locked = true; hscroll.setPointerCapture(e.pointerId);
      }
      hscroll.scrollLeft = startScroll - dx;
    });
    const end = () => { isDown = false; };
    hscroll.addEventListener("pointerup", end);
    hscroll.addEventListener("pointercancel", end);
  }

  /* ---------- custom cursor + magnetic ---------- */
  if (!isTouch && !reduce) {
    const cursor = document.querySelector("[data-cursor]");
    let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    window.addEventListener("mousemove", (e) => { tx = e.clientX; ty = e.clientY; });
    function follow() {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      if (cursor) cursor.style.transform = "translate(" + cx + "px," + cy + "px) translate(-50%,-50%)";
      if (!document.hidden) requestAnimationFrame(follow);
    }
    follow();
    document.addEventListener("visibilitychange", () => { if (!document.hidden) follow(); });
    document.querySelectorAll("a, button, [data-magnetic]").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor && cursor.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cursor && cursor.classList.remove("is-hover"));
    });
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
})();
