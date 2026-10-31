(() => {
  "use strict";

  const deck = document.getElementById("deck");
  const track = deck.querySelector(".track");
  const slides = Array.from(track.querySelectorAll(".slide"));
  const dotsNav = document.querySelector(".dots");
  const counterCurrent = document.querySelector(".counter__current");
  const counterTotal = document.querySelector(".counter__total");
  const root = document.documentElement;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const DURATION = () => (reducedMotion.matches ? 200 : 900);

  // Tuning for wheel / trackpad.
  const WHEEL_THRESHOLD = 40;      // accumulated delta needed to trigger a slide change
  const WHEEL_IDLE_RESET = 180;    // ms of silence that marks the end of a gesture
  const SWIPE_THRESHOLD = 50;      // px a touch must travel
  const SWIPE_VELOCITY = 0.35;     // px/ms that counts as a flick even if short

  let index = 0;
  let animating = false;
  let animTimer = 0;

  const pad = (n) => String(n).padStart(2, "0");

  // ---------- Setup ----------

  counterTotal.textContent = pad(slides.length);

  slides.forEach((slide, i) => {
    slide.querySelectorAll(".reveal").forEach((el, j) => el.style.setProperty("--d", j));

    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "dot";
    dot.setAttribute("aria-label", slide.dataset.title || `Slide ${i + 1}`);
    dot.innerHTML = `<span class="dot__label">${slide.dataset.title || ""}</span>`;
    dot.addEventListener("click", () => goTo(i));
    dotsNav.appendChild(dot);
  });

  const dots = Array.from(dotsNav.children);

  // ---------- Core ----------

  function render() {
    root.style.setProperty("--index", index);
    root.style.setProperty("--progress", slides.length > 1 ? index / (slides.length - 1) : 1);

    slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === index);
      slide.classList.toggle("is-before", i < index);
      slide.classList.toggle("is-after", i > index);
      slide.setAttribute("aria-hidden", i === index ? "false" : "true");
      slide.inert = i !== index;
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle("is-active", i === index);
      if (i === index) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });

    counterCurrent.textContent = pad(index + 1);
  }

  function goTo(next, { updateHash = true } = {}) {
    next = Math.max(0, Math.min(slides.length - 1, next));
    if (next === index) return false;

    index = next;
    animating = true;
    clearTimeout(animTimer);
    animTimer = setTimeout(() => { animating = false; }, DURATION());

    // Reset inner scroll of the slide we are entering so it starts at the top/bottom.
    const inner = slides[index].querySelector(".slide__inner");
    if (inner) inner.scrollTop = 0;

    render();

    if (updateHash) {
      history.replaceState(null, "", `#${slides[index].id}`);
    }
    return true;
  }

  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  // Lets content that is taller than the screen (small phones) scroll inside
  // the slide first; only when it hits an edge do we move to the next slide.
  function canScrollInside(target, direction) {
    const inner = slides[index].querySelector(".slide__inner");
    if (!inner || !inner.contains(target)) return false;
    if (inner.scrollHeight <= inner.clientHeight + 1) return false;
    if (direction > 0) return inner.scrollTop + inner.clientHeight < inner.scrollHeight - 1;
    return inner.scrollTop > 0;
  }

  // ---------- Wheel / trackpad ----------
  //
  // Trackpads keep firing wheel events for a second or more after the finger
  // lifts (inertia). We treat one continuous stream of events as one gesture:
  // it can move at most one slide. A new gesture starts after a short silence,
  // or when the delta suddenly grows again (a fresh flick during the tail).

  let wheelAccum = 0;
  let wheelLastTime = 0;
  let wheelLastAbs = 0;
  let gestureUsed = false;

  function onWheel(e) {
    if (e.ctrlKey) return; // pinch-zoom

    let dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 16;
    else if (e.deltaMode === 2) dy *= window.innerHeight;

    const direction = Math.sign(dy);
    if (direction === 0) return;

    if (canScrollInside(e.target, direction)) {
      wheelAccum = 0;
      return; // native scroll inside the slide
    }

    e.preventDefault();

    const now = performance.now();
    const abs = Math.abs(dy);
    const idle = now - wheelLastTime > WHEEL_IDLE_RESET;
    const freshFlick = abs > wheelLastAbs * 1.6 && abs > 20 && !animating;
    const reversed = wheelAccum !== 0 && Math.sign(wheelAccum) !== direction;

    if (idle || freshFlick || reversed) {
      gestureUsed = false;
      wheelAccum = 0;
    }

    wheelLastTime = now;
    wheelLastAbs = abs;

    if (gestureUsed || animating) return;

    wheelAccum += dy;
    if (Math.abs(wheelAccum) >= WHEEL_THRESHOLD) {
      const moved = direction > 0 ? next() : prev();
      gestureUsed = true;
      wheelAccum = 0;
      if (!moved) bounce(direction);
    }
  }

  // ---------- Touch ----------

  let touchStartY = 0;
  let touchStartX = 0;
  let touchStartTime = 0;
  let touchScrollable = false;
  let touchStartScrollTop = 0;

  function onTouchStart(e) {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    touchStartY = t.clientY;
    touchStartX = t.clientX;
    touchStartTime = performance.now();

    const inner = slides[index].querySelector(".slide__inner");
    touchScrollable = !!inner && inner.contains(e.target) && inner.scrollHeight > inner.clientHeight + 1;
    touchStartScrollTop = inner ? inner.scrollTop : 0;
  }

  function onTouchMove(e) {
    if (!touchScrollable) {
      e.preventDefault();
      return;
    }
    // Manually scroll overflowing slide content, since the deck blocks native scroll.
    const inner = slides[index].querySelector(".slide__inner");
    const dy = touchStartY - e.touches[0].clientY;
    inner.scrollTop = touchStartScrollTop + dy;
    e.preventDefault();
  }

  function onTouchEnd(e) {
    const t = e.changedTouches[0];
    const dy = touchStartY - t.clientY;
    const dx = touchStartX - t.clientX;
    const dt = Math.max(1, performance.now() - touchStartTime);

    if (Math.abs(dx) > Math.abs(dy)) return;

    const velocity = Math.abs(dy) / dt;
    if (Math.abs(dy) < SWIPE_THRESHOLD && velocity < SWIPE_VELOCITY) return;
    if (Math.abs(dy) < 12) return;

    const direction = Math.sign(dy);

    if (touchScrollable) {
      const inner = slides[index].querySelector(".slide__inner");
      const atTop = touchStartScrollTop <= 0;
      const atBottom = touchStartScrollTop + inner.clientHeight >= inner.scrollHeight - 1;
      // Only change slides if the swipe started at the edge in that direction.
      if (direction > 0 && !atBottom) return;
      if (direction < 0 && !atTop) return;
    }

    if (animating) return;
    const moved = direction > 0 ? next() : prev();
    if (!moved) bounce(direction);
  }

  // ---------- Keyboard ----------

  function onKey(e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return;

    let handled = true;
    switch (e.key) {
      case "ArrowDown":
      case "PageDown":
        if (!animating) next();
        break;
      case " ":
        if (tag === "button" || tag === "a") { handled = false; break; }
        if (!animating) (e.shiftKey ? prev() : next());
        break;
      case "ArrowUp":
      case "PageUp":
        if (!animating) prev();
        break;
      case "Home":
        goTo(0);
        break;
      case "End":
        goTo(slides.length - 1);
        break;
      default:
        handled = false;
    }
    if (handled) e.preventDefault();
  }

  // ---------- Edge feedback ----------

  let bounceTimer = 0;
  function bounce(direction) {
    if (reducedMotion.matches) return;
    clearTimeout(bounceTimer);
    track.style.transition = "transform var(--duration) var(--ease), translate 160ms cubic-bezier(0.33, 1, 0.68, 1)";
    track.style.translate = `0 ${direction > 0 ? -28 : 28}px`;
    bounceTimer = setTimeout(() => {
      track.style.transition = "transform var(--duration) var(--ease), translate 600ms cubic-bezier(0.16, 1, 0.3, 1)";
      track.style.translate = "";
    }, 160);
  }

  // ---------- Wiring ----------

  window.addEventListener("wheel", onWheel, { passive: false });
  deck.addEventListener("touchstart", onTouchStart, { passive: true });
  deck.addEventListener("touchmove", onTouchMove, { passive: false });
  deck.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("keydown", onKey);

  document.querySelectorAll("[data-next]").forEach((el) => el.addEventListener("click", next));
  document.querySelectorAll("[data-first]").forEach((el) => el.addEventListener("click", () => goTo(0)));

  // Keep focus inside the visible slide: tabbing to a link on another slide jumps there.
  document.addEventListener("focusin", (e) => {
    const slide = e.target.closest && e.target.closest(".slide");
    if (slide) {
      const i = slides.indexOf(slide);
      if (i !== -1 && i !== index) goTo(i);
    }
  });

  // Prevent the browser from scrolling the hidden overflow when focusing.
  deck.addEventListener("scroll", () => { deck.scrollTop = 0; });

  window.addEventListener("hashchange", () => {
    const i = slides.findIndex((s) => `#${s.id}` === location.hash);
    if (i !== -1) goTo(i, { updateHash: false });
  });

  // Initial slide from URL hash, without animating in.
  const start = slides.findIndex((s) => `#${s.id}` === location.hash);
  if (start > 0) {
    track.style.transition = "none";
    index = start;
  }
  render();
  requestAnimationFrame(() => requestAnimationFrame(() => { track.style.transition = ""; }));
})();
