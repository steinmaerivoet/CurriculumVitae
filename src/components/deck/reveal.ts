import { gsap } from "gsap";

/**
 * Gives every animated element in a slide its place in the stagger order.
 * Done once at start-up, so the CSS can stagger without per-component code.
 */
export function prepareReveal(slide: HTMLElement) {
  slide.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el, i) => el.style.setProperty("--ri", String(i)));
  slide.querySelectorAll<HTMLElement>(".split-char").forEach((el, i) => el.style.setProperty("--ci", String(i)));
  slide.querySelectorAll<HTMLElement>("[data-reveal-words] .word").forEach((el, i) => el.style.setProperty("--wi", String(i)));
}

/**
 * Reveals a slide's content the first time it becomes active. Later visits do
 * nothing: content that has been shown stays shown.
 */
export function revealOnce(slide: HTMLElement, reduced: boolean) {
  if (slide.classList.contains("is-seen")) return;
  slide.classList.add("is-seen");

  slide.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
    const target = Number(el.dataset["count"] ?? 0);
    if (reduced || !Number.isFinite(target)) return;
    const counter = { v: 0 };
    el.textContent = "0";
    gsap.to(counter, {
      v: target,
      duration: 1.6,
      delay: 0.35,
      ease: "power3.out",
      onUpdate: () => {
        el.textContent = Math.round(counter.v).toLocaleString("en");
      },
    });
  });
}
