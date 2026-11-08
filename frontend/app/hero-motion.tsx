"use client";

import { useEffect, useRef } from "react";
import { createHeroScene } from "./hero-scene";

export function HeroMotion({ emphasis = 0 }: { emphasis?: number }) {
  const holder = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = holder.current;
    const surface = canvas.current;
    const hero = element?.parentElement;
    if (!element || !surface || !hero || !("IntersectionObserver" in window) || !("ResizeObserver" in window)) return;

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let scene: ReturnType<typeof createHeroScene> = null;
    let attempted = false;
    let visible = false;
    let frame = 0;
    let lastPaint = 0;
    let seconds = 0;
    let width = 0;
    let height = 0;
    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;

    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
      lastPaint = 0;
    }

    function paint(now: number) {
      frame = 0;
      if (!scene || !element) return;

      const interval = width < 768 ? 1000 / 24 : 1000 / 30;
      if (!lastPaint || now - lastPaint >= interval - 1) {
        if (lastPaint) seconds += Math.min((now - lastPaint) / 1000, 0.1);
        lastPaint = now;
        x += (targetX - x) * 0.09;
        y += (targetY - y) * 0.09;
        scene.draw(seconds, x, y);
        if (!element.hasAttribute("data-ready")) element.setAttribute("data-ready", "");
      }
      frame = requestAnimationFrame(paint);
    }

    function update() {
      if (!visible || reducedMotion.matches || document.hidden || !width || !height) {
        stop();
        if (reducedMotion.matches) element?.removeAttribute("data-ready");
        return;
      }
      if (!attempted && surface) {
        attempted = true;
        scene = createHeroScene(surface, emphasis);
        scene?.resize(width, height);
      }
      if (scene && !frame) frame = requestAnimationFrame(paint);
    }

    function pointerMove(event: PointerEvent) {
      if (event.pointerType === "touch" || !visible || !scene || !hero) return;
      const bounds = hero.getBoundingClientRect();
      targetX = (event.clientX - bounds.left) / bounds.width - 0.5;
      targetY = 0.5 - (event.clientY - bounds.top) / bounds.height;
    }

    function resetPointer() {
      targetX = 0;
      targetY = 0;
    }

    function contextLost(event: Event) {
      event.preventDefault();
      stop();
      scene = null;
      element?.removeAttribute("data-ready");
    }

    function contextRestored() {
      attempted = false;
      update();
    }

    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    const resize = new ResizeObserver(([entry]) => {
      ({ width, height } = entry.contentRect);
      if (width && height) scene?.resize(width, height);
      update();
    });
    intersection.observe(element);
    resize.observe(element);
    reducedMotion.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    hero.addEventListener("pointermove", pointerMove, { passive: true });
    hero.addEventListener("pointerleave", resetPointer);
    surface.addEventListener("webglcontextlost", contextLost);
    surface.addEventListener("webglcontextrestored", contextRestored);

    return () => {
      stop();
      scene?.dispose();
      element.removeAttribute("data-ready");
      intersection.disconnect();
      resize.disconnect();
      reducedMotion.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
      hero.removeEventListener("pointermove", pointerMove);
      hero.removeEventListener("pointerleave", resetPointer);
      surface.removeEventListener("webglcontextlost", contextLost);
      surface.removeEventListener("webglcontextrestored", contextRestored);
    };
  }, [emphasis]);

  return (
    <div className="hero-motion" ref={holder} aria-hidden="true">
      <div className="hero-texture" />
      <canvas ref={canvas} />
    </div>
  );
}
