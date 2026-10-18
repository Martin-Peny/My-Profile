function Earbud({ right = false }: { right?: boolean }) {
  return (
    <svg
      className={`about-earbud about-earbud-${right ? "right" : "left"}`}
      viewBox="-40 -8 80 80"
      fill="none"
      focusable="false"
    >
      <g transform={`rotate(${right ? 32 : 19})`} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <g transform="translate(0 26)" strokeWidth="1.25">
          <g className="about-earphones-guides" strokeWidth="0.6">
            <path d="M-36 0h72M0-30v60" strokeDasharray="2 6" />
            <path d="M-37-17v-10h10M27 26h10V16" />
          </g>
          <path d="M-3-18v-8m6 8v-8" />
          <path d="M-7-14c0-5 14-5 14 0v25c0 5-14 5-14 0z" fill="#080808" />
          <ellipse cy="-14" rx="7" ry="3" />
          <path d="M-7 6c2 3 12 3 14 0M-3-9V2m6-11V2" />
          <g transform={right ? "scale(-1 1)" : undefined}>
            <path d="M-7-8c-6-6-18-6-24 0s-5 16 2 21c6 4 16 2 22-3" fill="#080808" />
            <ellipse cx="-27" cy="3" rx="7" ry="11" />
            <ellipse cx="-27" cy="3" rx="3.5" ry="6.5" />
            <path d="m-18-5 6 1m-6 5h6m-5 5 5-1" opacity="0.65" />
          </g>
          <path d="M-4 20h8m-8 3h8" strokeWidth="0.7" />
        </g>
      </g>
    </svg>
  );
}

const desktopCables = [
  "M1268-8C1245 95 1300 165 1268 280S1250 440 1230 500",
  "M1368-8C1334 150 1400 220 1374 385S1330 630 1280 710",
];

const mobileCables = [
  "M1100-8C1000 150 1250 230 1080 370S920 470 860 530",
  "M1380-8C1260 180 1470 320 1360 520S1280 710 1190 810",
];

export default function AboutEarphones() {
  return (
    <div className="about-earphones" aria-hidden="true">
      <svg className="about-earphones-cables" viewBox="0 0 1440 1100" preserveAspectRatio="none" fill="none" focusable="false">
        {[desktopCables, mobileCables].map((cables, index) => (
          <g className={`about-earphones-${index ? "mobile" : "desktop"}`} key={index} stroke="currentColor" strokeLinecap="round">
            {cables.map((path) => (
              <g key={path}>
                <path d={path} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
                <path d={path} transform="translate(4 0)" opacity="0.28" strokeWidth="0.7" vectorEffect="non-scaling-stroke" />
              </g>
            ))}
          </g>
        ))}
      </svg>
      <Earbud />
      <Earbud right />
    </div>
  );
}
