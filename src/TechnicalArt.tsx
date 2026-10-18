export function TechnicalOrbit() {
  return (
    <svg
      className="technical-orbit"
      viewBox="0 0 800 700"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="dot-grid"
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1" cy="1" r=".7" fill="#777" opacity=".4" />
        </pattern>
        <linearGradient id="orbit-fade">
          <stop stopColor="#999" stopOpacity=".7" />
          <stop offset="1" stopColor="#888" stopOpacity=".1" />
        </linearGradient>
      </defs>
      <path fill="url(#dot-grid)" d="M0 0h800v700H0z" />
      {[180, 210, 240, 270, 280].map((r, i) => (
        <ellipse
          key={r}
          cx="407"
          cy="343"
          rx={r + 36}
          ry={r}
          transform="rotate(-30 407 343)"
          stroke={i === 3 ? "#ed2929" : "url(#orbit-fade)"}
          strokeWidth={i === 3 ? "1" : ".6"}
          strokeDasharray={i === 4 ? "2 10" : undefined}
        />
      ))}
      <path
        d="M407 25v84m0 464v99M53 343h110m485 0h110M111 83l78 78m423 423 61 61M67 565l86-50m516-304 74-43"
        stroke="#777"
        strokeWidth=".7"
      />
      <path
        d="M110 115h45m-45 0v45m570-45h-45m45 0v45M110 575h45m-45 0v-45m570 45h-45m45 0v-45"
        stroke="#ef2828"
        strokeWidth="2"
      />
      <path
        d="M178 246H79v-77H10m590 268h132v84h60M557 119h143v52"
        stroke="#c7c7c7"
        strokeWidth=".7"
      />
      <g fill="#ef2828">
        <rect x="174" y="242" width="7" height="7" />
        <rect x="596" y="433" width="7" height="7" />
        <rect x="553" y="115" width="7" height="7" />
        <rect x="402" y="17" width="10" height="10" />
      </g>
      <g fill="#a8a8a8" fontFamily="monospace" fontSize="9" letterSpacing="1">
        <text x="15" y="155">
          LIVE / PRESENCE
        </text>
        <text x="659" y="542">
          VOICE / EXPRESSION
        </text>
        <text x="568" y="108">
          ON STAGE
        </text>
        <text x="337" y="659">
          ARTIST PORTRAIT — 001
        </text>
      </g>
      <g stroke="#777" strokeWidth=".8">
        {Array.from({ length: 42 }, (_, i) => {
          const a = (i * Math.PI) / 21;
          return (
            <path
              key={i}
              d={`M${407 + Math.cos(a) * 289} ${343 + Math.sin(a) * 289}l${Math.cos(a) * (i % 3 ? 5 : 11)} ${Math.sin(a) * (i % 3 ? 5 : 11)}`}
            />
          );
        })}
      </g>
    </svg>
  );
}

export function Waveform({
  variant = 0,
  className = "",
  animated = false,
  flat = false,
}: {
  variant?: number;
  className?: string;
  animated?: boolean;
  flat?: boolean;
}) {
  const heights = Array.from({ length: 81 }, (_, i) => {
    if (flat) return 4;
    const envelope = Math.pow(Math.sin((i / 80) * Math.PI), 1.3);
    return (
      3 +
      envelope *
        (10 + Math.abs(Math.sin(i * (variant + 1.7)) * Math.cos(i * 0.39)) * 90)
    );
  });
  return (
    <svg
      className={`${className}${animated ? " waveform-animated" : ""}`}
      viewBox="0 0 600 120"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      <path d="M0 60h600" stroke={flat ? "none" : "currentColor"} opacity=".3" />
      {heights.map((h, i) => (
        <path
          key={i}
          className={animated ? "waveform-bar" : undefined}
          style={animated ? {
            animationDelay: `${(i % 12) * -0.08}s`,
            animationDuration: `${0.55 + (i % 5) * 0.11}s`,
          } : undefined}
          d={`M${i * 7.5} ${60 - h / 2}v${h}`}
          stroke="currentColor"
          strokeWidth={flat ? 3 : 2}
        />
      ))}
    </svg>
  );
}

export function StudyArt({ variant }: { variant: number }) {
  return (
    <svg
      viewBox="0 0 360 230"
      className="study-art"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={`sg-${variant}`}
          width="18"
          height="18"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M18 0H0v18"
            stroke="currentColor"
            strokeWidth=".4"
            opacity=".17"
          />
        </pattern>
        <linearGradient id={`disc-${variant}`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fc4848" />
          <stop offset=".5" stopColor="#a51515" />
          <stop offset="1" stopColor="#161616" />
        </linearGradient>
      </defs>
      <path fill={`url(#sg-${variant})`} d="M0 0h360v230H0z" />
      {variant === 0 ? (
        <g transform="translate(180 117) rotate(-24)">
          {Array.from({ length: 15 }, (_, i) => (
            <ellipse
              key={i}
              cx="0"
              cy={i * 3.5 - 25}
              rx="91"
              ry="40"
              stroke={i % 3 === 0 ? "#ef2828" : "#454545"}
              strokeWidth={i % 3 === 0 ? 1.3 : 0.65}
            />
          ))}
          <ellipse cy="-29" rx="91" ry="40" fill="#191919" stroke="#b1b1b1" />
          {[76, 67, 57, 47, 27].map((r) => (
            <ellipse
              key={r}
              cy="-29"
              rx={r}
              ry={r * 0.44}
              stroke="#777"
              strokeWidth=".6"
            />
          ))}
          <ellipse cy="-29" rx="34" ry="15" fill="#ef2828" />
          <ellipse cy="-29" rx="5" ry="2.3" fill="#191919" />
          <path d="M-91-29v50m182-50v50" stroke="#aaa" />
        </g>
      ) : variant === 1 ? (
        <g transform="translate(180 118)">
          {Array.from({ length: 23 }, (_, i) => {
            const y = (i - 11) * 6;
            const w = Math.sqrt(Math.max(0, 1 - (y / 76) ** 2)) * 95;
            return (
              <ellipse
                key={i}
                cy={y}
                rx={w}
                ry={w * 0.27}
                stroke={i > 7 && i < 13 ? "#ef2828" : "#555"}
                strokeWidth={i > 7 && i < 13 ? "1.2" : ".7"}
              />
            );
          })}
          <ellipse
            rx="105"
            ry="38"
            transform="rotate(-45)"
            stroke="#999"
            strokeWidth=".65"
          />
          <ellipse
            rx="120"
            ry="45"
            transform="rotate(-45)"
            stroke="#ef2828"
            strokeWidth=".6"
          />
          <path
            d="M-135 55 135-55M0-100V100"
            stroke="#888"
            strokeDasharray="2 5"
            strokeWidth=".6"
          />
        </g>
      ) : (
        <g transform="translate(180 115)">
          {Array.from({ length: 30 }, (_, i) => {
            const x = (i - 15) * 5;
            const h = 22 + Math.abs(Math.sin(i * 0.27)) * 47;
            return (
              <path
                key={i}
                d={`M${x - 34} ${-h + 25}l68-40v${h * 2}l-68 40Z`}
                fill={i === 15 ? "#ef2828" : "#151515"}
                fillOpacity=".5"
                stroke={i % 5 === 0 ? "#ef2828" : "#777"}
                strokeWidth=".7"
              />
            );
          })}
          <path
            d="M-120 80 100-47M-100 95 120-32"
            stroke="#ef2828"
            strokeWidth=".5"
          />
        </g>
      )}
      <g stroke="currentColor" strokeWidth=".65" opacity=".5">
        <path d="M15 43V15h28m274 0h28v28M15 187v28h28m274 0h28v-28M15 115h18m294 0h18" />
      </g>
      <g fill="currentColor" opacity=".6" fontFamily="monospace" fontSize="7">
        <text x="19" y="31">
          FIG. 0{variant + 1}
        </text>
        <text x="265" y="204">
          SIGNAL / FORM
        </text>
      </g>
    </svg>
  );
}
