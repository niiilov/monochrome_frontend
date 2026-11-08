const featurePaths = [
  "M14 16h44v40H14zM24 26h24M24 35h16M24 44h19",
  "M36 11 63 25 36 39 9 25zM9 36l27 14 27-14M9 47l27 14 27-14",
  "M18 26h36v31H18zM24 26v-7a12 12 0 0 1 24 0v7m-12 13v8",
  "M36 10 60 19v15c0 13-10 22-24 29-14-7-24-16-24-29V19zM26 35l7 7 14-14",
  "M25 48 17 56a8 8 0 0 1-11-11l15-15a8 8 0 0 1 11 0m15-6 8-8a8 8 0 0 1 11 11L51 42a8 8 0 0 1-11 0M27 45l18-18",
  "M25 22 11 36l14 14m22-28 14 14-14 14m-6-35-10 42",
];

const solutionShapes = [
  // Three input streams narrow into a filter.
  "M107 58h27v10h-27z M147 58h26v10h-26z M186 58h27v10h-27z " +
    "M91 81h138v18l-55 53v25l-28 15v-40L91 99z M115 105h90l-10 10h-70z",
  // Two articles converge into a single document.
  "M75 58h30l13 13v43H75z M83 77h27v7H83z M83 94h20v7H83z " +
    "M75 126h30l13 13v43H75z M83 145h27v7H83z M83 162h20v7H83z " +
    "M125 81h20l24 34h12v-9l17 14-17 14v-9h-12l-24 34h-20v-9h15l21-30-21-30h-15z " +
    "M204 84h30l16 16v57h-46z M213 108h28v7h-28z M213 128h22v7h-22z",
  // A source document with a verification seal.
  "M94 59h79l23 23v20h-11V88h-22V70h-58v100h53v11H94z " +
    "M118 88h35v9h-35z M118 111h42v9h-42z M118 134h32v9h-32z " +
    "M197 108a39 39 0 1 1 0 78 39 39 0 1 1 0-78z M197 118a29 29 0 1 0 0 58 29 29 0 1 0 0-58z " +
    "M176 148l7-7 11 11 16-18 8 7-23 26z",
];

const glyphTile = Array.from({ length: 64 }, (_, i) => {
  const x = i % 8 * 5 + 2.5;
  const y = Math.floor(i / 8) * 5 + 2.5;
  if (i % 11 === 0) return `M${x} ${y - 1.35}a.9 1.35 0 1 1 0 2.7 .9 1.35 0 1 1 0-2.7`;
  if (i % 7 === 0) return `M${x - 1.35} ${y - 0.55}h2.7m-2.7 1.1h2.7M${x - 0.2} ${y - 1.5}l-.8 3m2-3-.8 3`;
  if (i % 5 < 2) return `M${x - 0.75} ${y + 1.3}l1.5 -2.6`;
  if (i % 13 === 0) return `M${x - 0.8} ${y}h1.6m-.8 -1v2`;
  return `M${x - 0.35} ${y}h.7`;
}).join(" ");

export function SolutionArt({ index }: { index: number }) {
  const id = `solution-art-${index}`;
  return (
    <svg className="solution-art" viewBox="17 13 286 214" aria-hidden="true">
      <defs>
        <pattern id={`${id}-glyphs`} width="40" height="40" patternUnits="userSpaceOnUse">
          <path d={glyphTile} fill="none" stroke="white" strokeWidth=".85" strokeLinecap="round" />
        </pattern>
        <mask id={`${id}-shape`} x="0" y="0" width="320" height="240" maskUnits="userSpaceOnUse">
          <path d={solutionShapes[index]} fill={`url(#${id}-glyphs)`} fillRule="evenodd" />
        </mask>
        <linearGradient id={`${id}-ink`} x2=".75" y2="1">
          <stop stopColor="var(--solution-ink-start)" />
          <stop offset="1" stopColor="var(--solution-ink-end)" />
        </linearGradient>
        <linearGradient id={`${id}-shine`}>
          <stop stopColor="var(--solution-shine)" stopOpacity="0" />
          <stop offset=".5" stopColor="var(--solution-shine)" stopOpacity=".9" />
          <stop offset="1" stopColor="var(--solution-shine)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="solution-glyphs" mask={`url(#${id}-shape)`}>
        <rect width="320" height="240" fill={`url(#${id}-ink)`} />
        <rect className="solution-sweep" x="56" width="58" height="240" fill={`url(#${id}-shine)`} />
      </g>
    </svg>
  );
}

export function FeatureArt({ index }: { index: number }) {
  return (
    <svg className="feature-art" viewBox="0 0 72 72" aria-hidden="true">
      <path d={featurePaths[index]} />
    </svg>
  );
}

export function GuideArt() {
  return (
    <svg className="guide-art" viewBox="0 0 480 490" aria-hidden="true">
      <defs>
        <linearGradient id="guide-cover" x2="1" y2="1">
          <stop stopColor="#3b3728" />
          <stop offset="1" stopColor="#14140f" />
        </linearGradient>
        <linearGradient id="guide-wave" x2=".9" y2="1">
          <stop stopColor="#f7de62" />
          <stop offset="1" stopColor="#f7de62" stopOpacity=".12" />
        </linearGradient>
        <pattern id="guide-dots" width="5" height="5" patternUnits="userSpaceOnUse">
          <rect width="1.2" height="2.2" fill="#f7de62" opacity=".45" />
        </pattern>
      </defs>
      <g transform="translate(60 27) rotate(-12 180 210) skewY(3)">
        <path d="M24 18h311l19 14v397l-24 21H25z" fill="#968c63" />
        <path d="M24 28h317v402l-15 12H24z" fill="#ccc299" />
        <path d="M24 37h314m-314 6h314m-314 382h314m-314 6h311" stroke="#958b66" />
        <rect x="12" y="12" width="319" height="422" rx="4" fill="url(#guide-cover)" stroke="#625738" />
        <path d="M25 14v418" stroke="#aaa071" opacity=".3" />
        <rect x="42" y="212" width="266" height="190" fill="url(#guide-dots)" opacity=".45" />
        <path d="M43 346c58-87 100-113 159-83s80 24 109-24m-268 132c58-87 100-113 159-83s80 24 109-24m-268 132c58-87 100-113 159-83s80 24 109-24" fill="none" stroke="url(#guide-wave)" />
        <path d="M44 82h129m-129 12h100m-100 29h198m-198 17h165m-165 17h182" stroke="#f7de62" opacity=".7" />
        <path d="M44 48h48" stroke="#f7de62" strokeWidth="5" />
      </g>
    </svg>
  );
}
