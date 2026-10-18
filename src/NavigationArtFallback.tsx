import { useId } from "react";
import type { ProfileIcon } from "./content";

// Projected wireframes and sectional lines preserve the site's technical style.
export default function NavigationArtFallback({ icon }: { icon: ProfileIcon }) {
  const id = useId().replace(/:/g, "");
  const figure = icon === "profile" ? "01" : icon === "microphone" ? "02" : "03";
  return (
    <svg className="profile-art-fallback" viewBox="0 0 360 260" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <pattern id={`${id}-grid`} width="18" height="18" patternUnits="userSpaceOnUse">
          <path d="M18 0H0v18" stroke="#89938e" strokeWidth=".4" opacity=".16" />
        </pattern>
        <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#e7e8e0" stopOpacity=".8" />
          <stop offset="1" stopColor="#6c7770" stopOpacity=".35" />
        </linearGradient>
      </defs>
      <path d="M0 0h360v260H0z" fill={`url(#${id}-grid)`} />
      <g stroke="#89938e" strokeWidth=".6" opacity=".4">
        <ellipse cx="180" cy="209" rx="110" ry="22" strokeDasharray="2 5" />
        <path d="M180 38v191M50 137h260" strokeDasharray="3 5" />
        <path d="m54 207 252-133M61 218l13-7m223-118 13-7" />
      </g>
      <g className="profile-object" strokeWidth=".8" strokeLinejoin="round">
        {icon === "profile" && (
          <g transform="translate(91 64) matrix(.96 -.24 .16 .9 0 0)">
            {[24, 16, 8].map((offset, i) => (
              <g key={offset} transform={`translate(${offset} ${offset * .7})`} stroke={i === 1 ? "#ef2e2e" : "#63716a"} opacity={i === 1 ? .7 : .55}>
                <path d="M0 0h146v152H0z" />
                <path d="M0 17h146M14 0v152" opacity=".4" />
              </g>
            ))}
            <path d="M0 0h146v152H0z" fill="#141717" fillOpacity=".9" stroke={`url(#${id}-edge)`} />
            <path d="m0 0 24 17m122-17 24 17M0 152l24 17m122-17 24 17" stroke="#7a8580" />
            <path d="M0 21V0h30m116 122v30h-30" stroke="#fa3a3a" strokeWidth="1.3" />
            <g transform="translate(70 67)" stroke="#aeb6af">
              <path d="m-20-28 8-12 22-1 13 11 3 23-10 19-22 1-15-19Z" />
              <path d="m-20-28 19-4 24 2M-21-6l20 6 27-7M-6 13-1 0l-11-40m11 8L10-41M-1 0l11-41M-21-6l9-34m2 53 11-13 14 12" opacity=".55" />
              <path d="m-6 13-4 12-28 13-14 27h106L43 38 16 23l-1-11" />
              <path d="m-38 38 30 8 51-8M-8 46l-2-21m2 21 3 19m-33-27 16 27m65-27L25 65M-8 46l24-23" opacity=".55" />
              <path d="M-52 65H54m-92-27 30 8 51-8" stroke="#f33636" strokeWidth="1.1" />
            </g>
            <path d="M16 132h24m4 0h7m10 0h50m5 0h12" stroke="#ef2e2e" />
            <path d="M17 14h36m52 0h24" stroke="#7f8c83" />
          </g>
        )}
        {icon === "microphone" && (
          <g>
            <g transform="rotate(29 180 125)">
              <path d="m161 105 7 91c1 7 23 7 24 0l7-91" stroke="#a1ada4" />
              {[0, 1, 2, 3, 4].map(n => (
                <path key={n} d={`M${164 + n * 7.5} 111 180 200`} stroke="#6a786f" opacity=".7" />
              ))}
              {[125, 140, 155, 170, 185].map((y, n) => (
                <ellipse key={y} cx="180" cy={y} rx={17 - n * 1.1} ry="5" stroke={n === 0 ? "#f23838" : "#68756c"} />
              ))}
              <path d="M148 85V66c0-39 64-39 64 0v19c0 31-64 31-64 0Z" fill="#141717" fillOpacity=".9" stroke="#a7b0a8" />
              {Array.from({ length: 15 }, (_, n) => {
                const y = 42 + n * 4.8;
                const r = y < 66 ? Math.sqrt(Math.max(0, 1 - ((66 - y) / 29) ** 2)) * 32 : y > 90 ? 32 * Math.sqrt(Math.max(0, 1 - ((y - 90) / 23) ** 2)) : 32;
                return <ellipse key={n} cx="180" cy={y} rx={r} ry={r * .25} stroke={n > 8 && n < 12 ? "#f23838" : "#8d9a90"} strokeWidth={n > 8 && n < 12 ? 1 : .55} />;
              })}
              {[-22, -11, 0, 11, 22].map((x, n) => (
                <path key={x} d={`M180 37C${180 + x * 1.7} 39 ${180 + x * 1.7} 101 180 113`} stroke="#849187" strokeWidth=".55" opacity={n === 2 ? .8 : .55} />
              ))}
              <ellipse cx="180" cy="112" rx="21" ry="7" stroke="#f23838" strokeWidth="1.2" />
              <path d="M160 124h40m-37 5h34" stroke="#f23838" />
              <path d="M180 30V13m-38 65h-18m94 0h18m-56 129v16" stroke="#7a8c7d" strokeDasharray="2 4" />
            </g>
            <ellipse cx="180" cy="136" rx="100" ry="42" transform="rotate(-29 180 136)" stroke="#ef2e2e" strokeWidth=".6" opacity=".6" />
            <path d="M87 170h29m135-88h26m-29 0v25" stroke="#8d998e" />
            <path d="M87 170v-20m190-68v20" stroke="#ef2e2e" />
          </g>
        )}
        {icon === "book" && (
          <g>
            {[20, 16, 12, 8, 4].map((offset, n) => (
              <g key={offset} transform={`translate(0 ${offset})`} stroke={n === 1 || n === 4 ? "#ef2e2e" : "#77847a"} opacity={n === 1 || n === 4 ? .8 : .55}>
                <path d="m79 79 88 30 17-1 93-44 5 101-99 49-17 1-92-32Z" />
                <path d="m166 109 0 106m18-107-1 106" />
              </g>
            ))}
            <path d="m79 79 88 30 17-1 93-44 5 101-99 49-17 1-92-32Z" fill="#141717" fillOpacity=".85" stroke={`url(#${id}-edge)`} />
            <path d="m79 79 88 30-1 106-92-32Zm105 29 93-44 5 101-99 49Z" stroke="#b0b9af" />
            <path d="m167 109 17-1-1 106-17 1Z" stroke="#f23737" strokeWidth="1.1" />
            {Array.from({ length: 9 }, (_, n) => (
              <g key={n} stroke={n === 2 || n === 6 ? "#ef2e2e" : "#849186"} strokeWidth=".6">
                <path d={`m89 ${96 + n * 8.4} 65 22M199 ${119 + n * 8.4}l66-32`} />
              </g>
            ))}
            <path d="m79 79-5 104 92 32 17-1 99-49" stroke="#f23737" strokeWidth="1.2" />
            <path d="m105 49 68 24 69-34M105 44v10m137-20v10m-69 24v10" stroke="#788a7c" strokeDasharray="2 3" />
            <path d="m105 49 68 24 69-34" stroke="#ef2e2e" strokeWidth=".6" />
            <path d="M298 67v104m-5-104h10m-10 104h10" stroke="#738578" strokeDasharray="2 3" />
          </g>
        )}
      </g>
      <g stroke="#89938e" strokeWidth=".65" opacity=".6">
        <path d="M15 44V17h28m274 0h28v27M15 216v27h28m274 0h28v-27M15 137h14m302 0h14" />
      </g>
      <g fill="#a7b1aa" fontFamily="monospace" fontSize="7" letterSpacing="1">
        <text x="24" y="34">FIG. {figure}</text>
        <text x="24" y="230">HL / {icon === "profile" ? "IDENTITY" : icon === "microphone" ? "PRESENCE" : "KNOWLEDGE"}</text>
      </g>
    </svg>
  );
}
