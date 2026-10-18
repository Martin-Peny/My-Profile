import { campusAndMusic, creativeProjects } from "./content";
import { Arrow } from "./icons";
import "./CreativeProjects.css";

function ExternalLink({ label, href }: { label: string; href: string }) {
  return (
    <a className="creative-link" href={href} target="_blank" rel="noopener noreferrer">
      {label}<Arrow diagonal />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function SignalArtwork() {
  return (
    <div className="creative-signal" aria-hidden="true">
      <span className="creative-art-meta">INDEPENDENT VOICE / DIGITAL CHANNELS</span>
      <div className="creative-signal-bars">
        {Array.from({ length: 49 }, (_, index) => (
          <i key={index} style={{ height: `${18 + Math.abs(Math.sin(index * .74) * Math.cos(index * .21)) * 82}%` }} />
        ))}
      </div>
      <span className="creative-signal-type">CREATE.<br /><span>CONNECT.</span></span>
      <span className="creative-art-bottom">IDEA → FRAME → AUDIENCE<span>01 / SOCIAL</span></span>
    </div>
  );
}

function StarsArtwork() {
  return (
    <div className="creative-stars" aria-hidden="true">
      <span className="creative-art-meta">UNNC / 20TH ANNIVERSARY / 2024</span>
      <svg className="creative-star-orbit" viewBox="0 0 600 300" fill="none">
        <ellipse cx="328" cy="149" rx="243" ry="89" transform="rotate(-22 328 149)" />
        <ellipse cx="328" cy="149" rx="219" ry="109" transform="rotate(27 328 149)" />
        <circle cx="328" cy="149" r="117" />
        <path className="creative-star-main" d="m328 22 27 95 100 32-100 27-27 100-30-100-96-27 96-32Z" />
        <path d="m328 60 20 70 69 19-69 19-20 70-20-70-69-19 69-19Z" />
        <path d="M328 0v300M178 149h300" strokeDasharray="3 7" />
        <circle cx="532" cy="71" r="5" className="creative-star-point" />
        <path d="M92 227h20m-10-10v20M502 246h14m-7-7v14" />
      </svg>
      <span className="creative-stars-type">FIERY<br /><span>STARS</span><sup>✳</sup></span>
      <span className="creative-art-bottom">A SONG. A FILM. A SHARED STAGE.<span>02 / MUSIC</span></span>
    </div>
  );
}

export default function CreativeProjects() {
  const { social, music } = creativeProjects;

  return (
    <section className="creative-section" id="creative-projects" aria-labelledby="creative-title" lang="en">
      <div className="creative-topline micro">
        <span><span className="red-square" />CREATIVE SIDE / CONTENT & MUSIC</span>
        <span aria-hidden="true">IDEAS INTO EXPRESSION ↘</span>
      </div>
      <div className="creative-heading">
        <h3 id="creative-title">FIND MY<br /><span>FREQUENCY.</span></h3>
        <div className="creative-heading-copy">
          <span className="creative-asterisk" aria-hidden="true">✳</span>
          <a className="creative-jump micro" href="#campus-and-music">CAMPUS & MUSIC <span aria-hidden="true">↓</span></a>
        </div>
      </div>

      <div className="creative-grid">
        <article className="creative-card creative-social" aria-labelledby="social-project-title">
          <SignalArtwork />
          <div className="creative-card-body">
            <div className="creative-card-meta micro"><span>{social.platforms}</span><span>{social.period}</span></div>
            <h4 id="social-project-title">{social.title}</h4>
            <p className="creative-description">{social.description}</p>
            <dl className="creative-stats">
              {social.statistics.map(statistic => (
                <div key={statistic.label}><dt>{statistic.label}</dt><dd>{statistic.value}</dd></div>
              ))}
            </dl>
            <p className="creative-stats-note">Combined across platforms · as of <time dateTime={social.statisticsDate}>{social.statisticsDateLabel}</time></p>
            <div className="creative-actions">
              {social.links.map(link => <ExternalLink key={link.href} {...link} />)}
            </div>
          </div>
        </article>

        <article className="creative-card creative-music" aria-labelledby="music-project-title">
          <StarsArtwork />
          <div className="creative-card-body">
            <div className="creative-card-meta micro"><span>THEME SONG / MUSIC VIDEO</span><span>{music.period}</span></div>
            <h4 id="music-project-title">{music.title}<span className="creative-title-star" aria-hidden="true">✳</span></h4>
            <p className="creative-project-subtitle">{music.subtitle}</p>
            <p className="creative-description">{music.description}</p>
            <div className="creative-actions">
              <ExternalLink {...music.links[0]} />
              <details className="creative-details">
                <summary>Project notes<span className="creative-disclosure" aria-hidden="true" /></summary>
                <div className="creative-details-body">
                  <p>{music.reflection}</p>
                  <ul>{music.roles.map(role => <li key={role}>{role}</li>)}</ul>
                  <ExternalLink {...music.links[1]} />
                </div>
              </details>
            </div>
          </div>
        </article>
      </div>

      <section className="campus-music" id="campus-and-music" aria-labelledby="campus-title" tabIndex={-1}>
        <div className="creative-topline micro">
          <span><span className="red-square" />07 / CAMPUS & MUSIC</span>
          <span aria-hidden="true">ON STAGE. BEHIND THE SCENES.</span>
        </div>
        <div className="campus-layout">
          <div className="campus-story">
            <p className="micro campus-eyebrow">PERFORMANCE / ORGANIZATION / COLLABORATION</p>
            <h4 id="campus-title">ON STAGE.<br /><span>IN THE TEAM.</span></h4>
          </div>
          <ol className="campus-timeline" aria-label="Campus and music experience timeline">
            {campusAndMusic.timeline.map((entry, index) => (
              <li key={entry.title}>
                <span className="campus-track-number micro" aria-hidden="true">0{index + 1}</span>
                <span className="campus-period micro">{entry.period}</span>
                <h5>{entry.title}</h5>
                <p>{entry.detail}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="creative-endnote micro" aria-hidden="true"><span>DIFFERENT MEDIUMS. THE SAME CURIOSITY.</span><span>HL / EXPRESSION ↗</span></div>
      </section>
    </section>
  );
}
