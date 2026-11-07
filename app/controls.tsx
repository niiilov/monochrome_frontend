"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { localeNames, localePath, locales, type Locale } from "./locales";
import { toggleTheme } from "./theme";

export function LanguagePicker({ locale, label }: { locale: Locale; label: string }) {
  const menu = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && menu.current?.open && !menu.current.contains(event.target)) {
        menu.current.open = false;
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);

  return (
    <details
      className="language-picker"
      ref={menu}
      onKeyDown={(event) => {
        if (event.key === "Escape" && menu.current?.open) {
          event.preventDefault();
          menu.current.open = false;
          trigger.current?.focus();
        }
      }}
    >
      <summary ref={trigger} className="control" aria-label={`${label} · ${localeNames[locale]}`} title={label}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <ellipse cx="12" cy="12" rx="4" ry="9" />
          <path d="M3 12h18" />
        </svg>
        <span dir="ltr" aria-hidden="true">{locale.toUpperCase()}</span>
      </summary>
      <ul className="language-list" aria-label={label}>
        {locales.map((option) => (
          <li key={option}>
            <a
              href={localePath(option)}
              hrefLang={option}
              lang={option}
              aria-current={locale === option ? "page" : undefined}
            >
              <bdi>{localeNames[option]}</bdi>
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function ThemeToggle({ label }: { label: string }) {
  return (
    <button className="control theme-toggle" type="button" onClick={() => toggleTheme()} aria-label={label} title={label}>
      <svg className="theme-moon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.9 13.35A9 9 0 0 1 10.65 3.1 9 9 0 1 0 20.9 13.35Z" />
      </svg>
      <svg className="theme-sun" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42m0-14.14-1.42 1.42m-11.3 11.3-1.42 1.42" />
      </svg>
    </button>
  );
}

type NavLink = { label: string; href: string };
export type NavGroup = { label: string; links: NavLink[] };

export function SiteHeader({
  brand, locale, language, theme, navigation, menuLabel, groups, login,
}: {
  brand: ReactNode; locale: Locale; language: string; theme: string;
  navigation: string; menuLabel: string; groups: NavGroup[]; login: NavLink;
}) {
  const header = useRef<HTMLElement>(null);
  const mobile = useRef<HTMLButtonElement>(null);
  const active = useRef<HTMLButtonElement | null>(null);
  const [opened, setOpened] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const node = header.current;
    if (!node) return;
    let last = window.scrollY;
    function onScroll() {
      const next = window.scrollY;
      node?.classList.toggle("scrolled", next > 100);
      if (next !== last) node?.classList.toggle("slide-away", next > last && next > 100);
      last = next;
    }
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !node?.contains(event.target)) {
        setOpened(null);
        setMobileOpen(false);
      }
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("pointerdown", outside);
    };
  }, []);

  function close() {
    setOpened(null);
    setMobileOpen(false);
  }

  return (
    <>
      {(opened !== null || mobileOpen) && <div className="nav-scrim" aria-hidden="true" />}
      <header
        ref={header}
        className={`header${mobileOpen ? " mobile-open" : ""}${opened !== null ? " nav-open" : ""}`}
        onKeyDown={(event) => {
          if (event.key !== "Escape" || event.defaultPrevented) return;
          if (mobileOpen) mobile.current?.focus();
          else if (opened !== null) active.current?.focus();
          close();
        }}
      >
        {brand}
        <nav className="top-nav" id="site-nav" aria-label={navigation}>
          {groups.map((group, index) => (
            <div className="nav-group" key={group.label}>
              <button
                type="button"
                aria-expanded={opened === index}
                aria-controls={`nav-group-${index}`}
                onClick={(event) => {
                  active.current = event.currentTarget;
                  setOpened(opened === index ? null : index);
                }}
              >
                {group.label}<span className="chevron" aria-hidden="true" />
              </button>
              <div className="dropdown" id={`nav-group-${index}`} hidden={opened !== index}>
                {group.links.map(({ label, href }) => <a key={href} href={href} onClick={close}>{label}</a>)}
              </div>
            </div>
          ))}
        </nav>
        <div className="header-actions">
          <LanguagePicker locale={locale} label={language} />
          <ThemeToggle label={theme} />
          <a className="header-login" href={login.href} onClick={close}>
            {login.label}<span aria-hidden="true">↗</span>
          </a>
          <button
            type="button" className="hamburger" ref={mobile} aria-label={menuLabel}
            aria-expanded={mobileOpen} aria-controls="site-nav"
            onClick={() => { setMobileOpen(!mobileOpen); setOpened(null); }}
          >
            <span /><span /><span />
          </button>
        </div>
      </header>
    </>
  );
}

export function MotionArtwork({ children, className }: { children: ReactNode; className: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      element.toggleAttribute("data-motion-visible", entry.isIntersecting);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div className={className} ref={ref} aria-hidden="true">{children}</div>;
}

export function MotionVideo({ name, className = "" }: { name: string; className?: string }) {
  const holder = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const container = holder.current;
    const video = ref.current;
    if (!container || !video || !("IntersectionObserver" in window)) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;

    function update() {
      if (!video) return;
      if (visible && !preference.matches && !document.hidden) {
        if (!video.getAttribute("src")) video.src = `/media/${name}.mp4`;
        if (!video.error) void video.play().catch(() => {});
      } else {
        video.pause();
      }
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    }, { threshold: 0.15 });
    observer.observe(container);
    preference.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
      video.pause();
    };
  }, [name]);

  return (
    <div className={`motion-video ${className}`} ref={holder} aria-hidden="true">
      <img src={`/media/${name}.jpg`} alt="" loading="lazy" decoding="async" />
      <video
        ref={ref} muted loop playsInline preload="none"
        onPlaying={(event) => event.currentTarget.setAttribute("data-playing", "")}
        onError={(event) => event.currentTarget.removeAttribute("data-playing")}
      />
    </div>
  );
}

export function Carousel({
  children, heading, previous, next,
}: {
  children: ReactNode; heading: ReactNode; previous: string; next: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const id = useId();
  const [edges, setEdges] = useState({ first: true, last: false });

  function update() {
    const node = track.current;
    if (!node) return;
    const offset = Math.abs(node.scrollLeft);
    setEdges({ first: offset < 2, last: offset + node.clientWidth >= node.scrollWidth - 2 });
  }

  useEffect(() => {
    const node = track.current;
    if (!node) return;
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  function move(direction: number) {
    const node = track.current;
    const card = node?.firstElementChild;
    if (!node || !card) return;
    const style = getComputedStyle(node);
    const gap = parseFloat(style.columnGap) || 0;
    const width = card.getBoundingClientRect().width;
    node.scrollBy({
      left: direction * (style.direction === "rtl" ? -1 : 1) * (width + gap),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }

  return (
    <section className="carousel section" id="formats" aria-labelledby="formats-title">
      <div className="carousel-head wide">
        {heading}
        <div className="arrows">
          <button type="button" onClick={() => move(-1)} disabled={edges.first} aria-label={previous} aria-controls={id}>←</button>
          <button type="button" onClick={() => move(1)} disabled={edges.last} aria-label={next} aria-controls={id}>→</button>
        </div>
      </div>
      <div className="carousel-track" id={id} ref={track} onScroll={update}>{children}</div>
    </section>
  );
}
