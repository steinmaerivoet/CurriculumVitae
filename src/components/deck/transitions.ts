import { gsap } from "gsap";

export type Direction = 1 | -1;

const q = <T extends Element = HTMLElement>(root: Element, sel: string) =>
  Array.from(root.querySelectorAll<T & Element>(sel)) as T[];

/**
 * Content reveal for a slide. Driven entirely by data attributes, so slides
 * stay declarative:
 *   data-anim          fade + rise, staggered in DOM order
 *   .split-char        characters rising out of a mask (see <SplitText>)
 *   data-anim-words    children `.word` light up one after another
 *   data-count="42"    number counts up from 0
 */
export function revealSlide(slide: HTMLElement, reduced: boolean): gsap.core.Timeline {
  const tl = gsap.timeline();
  const items = q(slide, "[data-anim]");
  const chars = q(slide, ".split-char");
  const words = q(slide, "[data-anim-words] .word");
  const counters = q(slide, "[data-count]");

  if (reduced) {
    tl.fromTo(items, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, stagger: 0.03 });
    gsap.set(chars, { y: 0, yPercent: 0 });
    gsap.set(words, { opacity: 1 });
    return tl;
  }

  if (chars.length) {
    tl.fromTo(
      chars,
      { y: 0, yPercent: 110, rotate: 6 },
      { y: 0, yPercent: 0, rotate: 0, duration: 1.1, ease: "expo.out", stagger: 0.028 },
      0,
    );
  }

  tl.fromTo(
    items,
    { autoAlpha: 0, y: 36 },
    { autoAlpha: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.065 },
    chars.length ? 0.25 : 0,
  );

  if (words.length) {
    tl.fromTo(
      words,
      { opacity: 0.12 },
      { opacity: 1, duration: 0.5, ease: "power1.out", stagger: 0.035 },
      0.15,
    );
  }

  counters.forEach((el) => {
    const target = Number(el.dataset["count"] ?? 0);
    const counter = { v: 0 };
    tl.to(
      counter,
      {
        v: target,
        duration: 1.6,
        ease: "power3.out",
        onUpdate: () => {
          el.textContent = String(Math.round(counter.v));
        },
      },
      0.3,
    );
  });

  return tl;
}

/**
 * Moves from one slide to the next with a masked "wipe": the outer wrapper
 * slides in while the inner wrapper counter-moves, so the new slide is
 * revealed rather than pushed. The old slide sinks back and darkens.
 */
export function transitionSlides(opts: {
  from: HTMLElement;
  to: HTMLElement;
  direction: Direction;
  reduced: boolean;
  duration: number;
  onComplete: () => void;
}): gsap.core.Timeline {
  const { from, to, direction: d, reduced, duration, onComplete } = opts;

  const toOuter = to.querySelector(".slide-outer");
  const toInner = to.querySelector(".slide-inner");
  const fromInner = from.querySelector(".slide-inner");
  const fromShade = from.querySelector(".slide-shade");

  gsap.set(to, { visibility: "visible", zIndex: 2 });
  gsap.set(from, { zIndex: 1 });

  const tl = gsap.timeline();
  // Unlock input as soon as the slide has landed; the content reveal may
  // still be running, which keeps navigation snappy.
  const finish = () => {
    gsap.set(from, { visibility: "hidden", zIndex: 0 });
    gsap.set([fromInner, fromShade], { clearProps: "all" });
    onComplete();
  };

  if (reduced) {
    tl.fromTo(to, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: "none" });
    tl.add(revealSlide(to, true), 0);
    tl.call(finish, undefined, 0.35);
    return tl;
  }

  gsap.set(to, { autoAlpha: 1 });
  tl.fromTo(toOuter, { yPercent: 100 * d }, { yPercent: 0, duration, ease: "power4.inOut" }, 0)
    .fromTo(toInner, { yPercent: -70 * d }, { yPercent: 0, duration, ease: "power4.inOut" }, 0)
    .to(fromInner, { yPercent: -28 * d, scale: 0.94, duration, ease: "power4.inOut" }, 0)
    .to(fromShade, { opacity: 0.75, duration, ease: "power2.inOut" }, 0)
    .add(revealSlide(to, false), duration * 0.5)
    .call(finish, undefined, duration);

  return tl;
}
