import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { FeatureArt, GuideArt, SolutionArt } from "../artwork";
import { Carousel, MotionArtwork, MotionVideo, SiteHeader } from "../controls";
import { copy } from "../copy";
import { HeroMotion } from "../hero-motion";
import { isLocale, localePath, locales } from "../locales";
import { sectionCopy } from "../section-copy";

type Props = { params: Promise<{ locale: string }> };
const formatMedia = ["gaming", "marketplaces", "psps", "fintech"];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const text = copy[locale];

  return {
    title: `MONO · ${text.eyebrow}`,
    description: text.intro,
    alternates: {
      canonical: localePath(locale),
      languages: Object.fromEntries(locales.map((code) => [code, localePath(code)])),
    },
  };
}

function Brand() {
  return (
    <a className="brand" href="#top" dir="ltr">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="var(--accent)" />
        <path d="M7 22V10h3l6 7 6-7h3v12h-3v-7l-6 7-6-7v7z" fill="var(--accent-ink)" />
      </svg>
      MONO
    </a>
  );
}

function SectionHeading({ id, tag, title, children }: { id: string; tag: string; title: string; children?: ReactNode }) {
  return (
    <div className="section-heading">
      <div><p className="eyebrow">{tag}</p><h2 id={id}>{title}</h2></div>
      {children && <p>{children}</p>}
    </div>
  );
}

function Pill({ href, children }: { href: string; children: ReactNode }) {
  return <a className="pill" href={href}>{children}</a>;
}

export default async function Landing({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const text = copy[locale];
  const sections = sectionCopy[locale];
  const [features, guide, menu, previous, next, details] = sections.labels;
  const shortcuts = [
    { href: "#overview", label: text.overview },
    { href: "#features", label: features },
    { href: "#formats", label: text.formats },
    { href: "#guide", label: guide },
    { href: "#faq", label: text.questions },
  ];
  const formats = text.outputs;
  const groups = [
    { label: text.formats, links: formats.map(([label], i) => ({ label, href: `#format-${i + 1}` })) },
    { label: text.overview, links: text.cards.map(([label], i) => ({ label, href: `#solution-${i + 1}` })) },
    { label: guide, links: [shortcuts[3], shortcuts[4]] },
    { label: features, links: sections.features.map(([label], i) => ({ label, href: `#feature-${i + 1}` })) },
  ];

  return (
    <>
      <a href="#main" className="skip-link">{text.skip}</a>
      <SiteHeader brand={<a className="header-wordmark" href="#top" aria-label="MONO" />} locale={locale} language={text.language} theme={text.theme} navigation={text.navigation}
        menuLabel={menu} groups={groups}
        login={{ href: `/${locale}/auth`, label: text.tryProduct }} />

      <main id="main" tabIndex={-1}>
        <section className="hero" id="top" aria-labelledby="hero-title">
          <HeroMotion />
          <div className="hero-copy wrap">
            <a className="announcement" href="#guide"><span>{guide}</span>{text.eyebrow}</a>
            <h1 id="hero-title">{text.headline[0]}<br />{text.headline[1]}</h1>
            <p>{text.intro}</p>
            <Pill href="#overview">{text.explore}</Pill>
          </div>
          <nav className="stats wrap" aria-label={text.navigation}>
            {shortcuts.map(({ href, label }, index) => (
              <a href={href} key={href}>
                <span dir="ltr" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                {label}
              </a>
            ))}
          </nav>
        </section>

        <section className="section wrap" id="overview" aria-labelledby="overview-title">
          <SectionHeading id="overview-title" tag={text.overview} title={text.overviewHeading}>{text.overviewIntro}</SectionHeading>
          <div className="solutions-grid">
            {text.cards.map(([title, description], index) => (
              <article className="solution" key={title} id={`solution-${index + 1}`}>
                <div className="solution-visual">
                  <MotionArtwork className="solution-motion"><SolutionArt index={index} /></MotionArtwork>
                  <span>{text.stage} <bdi>{String(index + 1).padStart(2, "0")}</bdi></span>
                </div>
                <div className="solution-copy">
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <Pill href={`#feature-${index + 1}`}>{details}</Pill>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="features section" id="features" aria-labelledby="features-title">
          <div className="wrap">
            <SectionHeading id="features-title" tag={features} title={sections.featuresHeading} />
            <div className="feature-grid">
              {sections.features.map(([title, description], index) => (
                <article className="feature" key={title} id={`feature-${index + 1}`}>
                  <h3>{title}</h3><p>{description}</p><FeatureArt index={index} />
                </article>
              ))}
            </div>
          </div>
        </section>

        <Carousel heading={<SectionHeading id="formats-title" tag={text.formats} title={text.formatsHeading} />}
          previous={previous} next={next}>
          {formats.map(([title, description], index) => (
            <article className="industry-card" key={title} id={`format-${index + 1}`}>
              <a className="industry-arrow" href="#guide" aria-label={guide}>↗</a>
              <MotionArtwork className="industry-art">
                <img src={`/media/${formatMedia[index]}.svg`} width="168" height="168" alt="" loading="lazy" decoding="async" />
              </MotionArtwork>
              <div><h3>{title}</h3><p>{description}</p></div>
            </article>
          ))}
        </Carousel>

        <section className="guide wide" id="guide" aria-labelledby="guide-title">
          <div className="guide-panel">
            <div className="guide-copy">
              <Brand />
              <h2 id="guide-title">{sections.guide[0]}</h2>
              <p>{sections.guide[1]}</p>
              <Pill href={`/${locale}/auth`}>{text.tryProduct}</Pill>
            </div>
            <GuideArt />
          </div>
        </section>

        <section className="faq wide" id="faq" aria-labelledby="faq-title">
          <h2 id="faq-title">{text.faqHeading}</h2>
          <div className="faq-list">
            {text.faq.map(([question, answer], index) => (
              <details name="faq" key={question} open={index === 0}>
                <summary>{question}<span aria-hidden="true" /></summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-cta wide">
          <div><h2>{text.footer}</h2><Pill href="#overview">{text.explore}</Pill></div>
          <div className="footer-promos">
            <a href="#features"><span aria-hidden="true">↗</span>{features}</a>
            <a href="#faq"><span aria-hidden="true">↗</span>{text.faqHeading}</a>
          </div>
        </div>
        <div className="footer-box">
          <MotionVideo name="footer" className="footer-motion" />
          <div className="footer-glass">
            <nav className="footer-grid" aria-label={text.navigation}>
              <div className="footer-brand"><Brand /></div>
              {groups.map(({ label, links }) => (
                <details className="footer-column" key={label} open>
                  <summary>{label}</summary>
                  <ul>{links.map((link) => <li key={link.href}><a href={link.href}>{link.label}</a></li>)}</ul>
                </details>
              ))}
            </nav>
            <div className="footer-bottom"><a href="#top">{text.back} <span aria-hidden="true">↑</span></a></div>
          </div>
        </div>
      </footer>
    </>
  );
}
