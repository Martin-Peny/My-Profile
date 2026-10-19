import { useLanguage, LanguageSwitch } from "./i18n";
import { lazy, Suspense, useEffect, useState } from "react";
import { aboutMe, artist, myLife, profileSections } from "./content";
import { Arrow, Asterisk, Mark, SoundIcon } from "./icons";
import { TechnicalOrbit, Waveform } from "./TechnicalArt";
import NavigationArt from "./NavigationArt";
import PortraitFallback from "./PortraitFallback";
import Topography from "./Topography";
import LiquidEther from "./LiquidEther";
import BackgroundMusic from "./BackgroundMusic";
import PhotoGallery from "./PhotoGallery";
import GalleryContentSpace from "./GalleryContentSpace";
import SideRays from "./SideRays";
import SiteFooter from "./SiteFooter";
import VinylRecord from "./VinylRecord";
import AcademicWorkbench from "./AcademicWorkbench";

const HeroPortrait = lazy(() => import("./HeroPortrait"));

function App() {
  const { t, locale } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("index");
  const [musicPlaying, setMusicPlaying] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            setActiveSection(id === "academic-experience" ? "introduction" : id);
          }
        });
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: 0 },
    );
    document
      .querySelectorAll("main > section[id]")
      .forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const button =
          document.querySelector<HTMLButtonElement>(".menu-toggle");
        if (button?.getAttribute("aria-expanded") === "true") {
          setMenuOpen(false);
          button.focus();
        }
      }
    };
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("keydown", close);
    };
  }, []);

  return (
    <>
      <a className="skip-link" href="#main">
        {t("Skip to content")}
      </a>
      <header className="site-header">
        <a
          className="brand"
          href="#index"
          aria-label={t(`${artist.name}, home`)}
          onClick={() => setMenuOpen(false)}
        >
          <Mark />
          <span>
            HAOYANG
            <span>
              LING<span className="brand-dot">↗</span>
            </span>
          </span>
        </a>
        <nav
          className={`main-nav ${menuOpen ? "open" : ""}`}
          id="main-nav"
          aria-label={t("Main navigation")}
        >
          {[
            ["index", "INDEX", "01"],
            ["explore", "EXPLORE", "02"],
            ["introduction", "INTRODUCTION", "03"],
          ].map(([id, title, index]) => (
            <a
              key={id}
              href={`#${id}`}
              className={activeSection === id ? "active" : ""}
              aria-current={activeSection === id ? "location" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              <span>{index}</span>
              {t(title)}
              <i />
            </a>
          ))}
        </nav>
        <a className="header-cta" href="#explore">
          <SoundIcon />
          <span>{t("EXPLORE THE CHAPTERS")}</span>
          <Arrow diagonal />
        </a>
        <LanguageSwitch />
        <button
          className="menu-toggle"
          type="button"
          aria-label={t(menuOpen ? "Close navigation" : "Open navigation")}
          aria-expanded={menuOpen}
          aria-controls="main-nav"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span />
          <span />
        </button>
      </header>

      <main id="main">
        <section className="hero" id="index" aria-labelledby="hero-title">
          <LiquidEther
            className="hero-ether"
            colors={["#f4072e", "#f40808", "#f70f13"]}
            mouseForce={20}
            cursorSize={100}
            persistence={0.75}
            autoDemo
            autoSpeed={0.5}
            autoIntensity={2.2}
            intensity={1}
            viscosity={0}
            resolution={0.5}
            clickBurst
            bounceEdges={false}
            intro
            lightMode={false}
          />
          <div className="hero-meta micro">
            <span>
              <i className="status-dot" />
              {t("INDEPENDENT FREQUENCY")}
            </span>
            <span className="hero-coordinates">
              {t("HL—001 / AUDIO EXPLORATIONS")}
            </span>
            <span>{t("VOLUME UP. WORLD OFF.")}</span>
          </div>
          <div className="hero-main">
            <div className="hero-copy">
              <div className="eyebrow micro">
                <span className="crosshair">+</span>
                {t(artist.name).toUpperCase()}{" "}
                <span className="muted">/ {t(artist.role).toUpperCase()}</span>
              </div>
              <h1 id="hero-title" aria-label={t("I AM, HAOYANG LING")}>
                <span className="hero-title-line hero-title-intro">{t("I AM")}<span className="hero-title-comma">{locale === "zh" ? "，" : ","}</span></span>
                <span className="hero-title-wave" aria-hidden="true">
                  <Waveform animated={musicPlaying} flat={!musicPlaying} />
                </span>
                <span className="hero-title-line hero-title-name">{t("HAOYANG LING")}</span>
              </h1>
              <div className="hero-description">
                <span className="tiny-bars" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                <p>
                  {t("Beyond the noise.")}
                  <br />
                  {t("Into the sound.")}
                </p>
              </div>
              <a className="button button-red" href="#explore">
                <span>{t("EXPLORE MY STORY")}</span>
                <Arrow diagonal />
              </a>
              <p className="hero-note micro">
                {t("A SPACE FOR MUSIC. A PLACE TO FEEL.")}
              </p>
            </div>
            <div className="hero-visual">
              <div className="visual-type" aria-hidden="true">
                HL /<br />
                {t("SONIC")}
              </div>
              <div className="red-cross" aria-hidden="true">
                +
              </div>
              <TechnicalOrbit />
              <Suspense
                fallback={
                  <div className="hero-portrait" data-ready="false">
                    <PortraitFallback />
                  </div>
                }
              >
                <HeroPortrait />
              </Suspense>
              <span className="object-label micro">
                <span className="red-square" /> {t("SOUND HAS NO BOUNDARIES.")}
              </span>
              <span className="vertical-label micro" aria-hidden="true">
                {t("AMPLIFY WHAT YOU FEEL // HL")}
              </span>
              <div className="visual-id micro" aria-hidden="true">
                01
                <span>
                  {t("ARTIST")}
                  <br />
                  {t("PORTRAIT")}
                </span>
                <svg viewBox="0 0 50 27">
                  <path
                    d="m0 0 15 13.5L0 27h11l15-13.5L11 0Zm23 0 15 13.5L23 27h11l15-13.5L34 0Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="hero-bottom">
            <span className="micro">
              {t("SCROLL TO TUNE IN")} <span className="down-arrow">↓</span>
            </span>
            <div className="hero-wave">
              <Waveform />
              <span className="micro">L ───────── R</span>
            </div>
            <span className="micro bottom-right">
              {t("SOUND IS A FEELING.")}
              <br />
              <span className="muted">{t("NOT JUST A FREQUENCY.")}</span>
            </span>
          </div>
        </section>

        <section
          className="explore-section"
          id="explore"
          aria-labelledby="explore-title"
        >
          <Topography
            color="#fa0f0f"
            lineCount={22}
            lineWidth={1.2}
            elevation={1}
            foreground={0.2}
            tilt={32}
            speed={0.25}
            direction="forward"
            glow={0.6}
            depthOfField={0.4}
            fog={0.35}
            hoverEffect="lift"
            clickEffect="pulse"
          />
          <div className="section-topline micro">
            <span>
              <span className="red-square" />
              {t("02 / EXPLORE")}
            </span>
            <span>{t("PERSON. LIFE. ACADEMIA.")}</span>
            <span>{t("[ THREE PERSPECTIVES ]")}</span>
          </div>
          <div className="section-heading">
            <h2 id="explore-title">
              {t("BEHIND THE")}
              <br />
              <span>{t("FREQUENCY.")}</span>
            </h2>
            <div className="section-intro">
              <Asterisk className="section-cross" />
              <p>
                {t("One person. Three perspectives.")}
                <br />
                {t("Choose a chapter. Get to know me.")}
              </p>
              <span className="micro muted">
                {t("A CLOSER LOOK AT HAOYANG LING")}
                <br />
                {t("EXPLORE THE CHAPTERS BELOW ↗")}
              </span>
            </div>
          </div>
          <div className="profile-grid">
            {profileSections.map((section) => (
              <a
                className="profile-card"
                key={section.id}
                href={`#${section.id}`}
                aria-labelledby={`card-title-${section.id}`}
              >
                <div className="profile-card-top micro" aria-hidden="true">
                  <span>CH_{section.index}</span>
                  <span>{t(section.label)}</span>
                  <span className="profile-target">⊕</span>
                </div>
                <div className="profile-art-frame">
                  <NavigationArt icon={section.icon} />
                  <span className="profile-art-action" aria-hidden="true"><Arrow diagonal /></span>
                </div>
                <div className="profile-name">
                  <h3 id={`card-title-${section.id}`} lang={locale === "zh" ? "zh-CN" : section.language}>{t(section.title)}</h3>
                  <span className="micro" aria-hidden="true">/{section.index}</span>
                </div>
                <p className="micro profile-subtitle">{t(section.subtitle)}</p>
                <p className="profile-description" lang={locale === "zh" ? "zh-CN" : section.language}>{t(section.description)}</p>
                <span className="profile-action micro" aria-hidden="true">
                  {t("EXPLORE CHAPTER")}
                  <Arrow />
                </span>
              </a>
            ))}
          </div>
        </section>

        <div className="section-divider" aria-hidden="true" />

        <section
          className="about-section"
          id="introduction"
          tabIndex={-1}
          aria-labelledby="introduction-title"
        >
          <div className="gallery-rays" aria-hidden="true">
            <SideRays
              rayColor1="#e91212"
              rayColor2="#f4072e"
              origin="top-right"
              speed={2.5}
              intensity={2}
              spread={2}
              density={5}
              followMouse
              blend={0.6}
              sharpness={0.5}
              tilt={0}
              falloff={1.6}
              glow={1}
              saturation={1}
              dust={0}
              mouseInfluence={0.5}
              intro
              lightMode={false}
              opacity={1}
            />
          </div>
          <div className="section-topline micro">
            <span>
              <span className="red-square" />
              {t("03 / INTRODUCTION")}
            </span>
            <span>{t("THE PERSON BEHIND THE FREQUENCY")}</span>
            <span>{t("HAOYANG LING")}</span>
          </div>
          <div className="gallery-heading">
            <div>
              <p className="micro" id="introduction-label">{t("INTRODUCTION / IN PICTURES")}</p>
              <h2 className="chapter-title" id="introduction-title">{t("ABOUT")} <span>{t("ME")}</span></h2>
            </div>
            <span className="micro gallery-heading-note" aria-hidden="true">{t("MOMENTS IN FRAME")} <span>↙ ↙ ↙</span></span>
          </div>
          <PhotoGallery />
          <GalleryContentSpace>
            <div className="about-me" lang={locale === "zh" ? "zh-CN" : "en"}>
              <h3 id="about-me-title">{t(aboutMe.title)}</h3>
              {aboutMe.paragraphs.map((paragraph) => (
                <p key={t(paragraph)}>{t(paragraph)}</p>
              ))}
            </div>
          </GalleryContentSpace>
          <div className="section-divider" aria-hidden="true" />
          <section className="my-life" id="my-life" tabIndex={-1} aria-labelledby="my-life-title">
            <div className="my-life-heading">
              <div className="section-topline micro">
                <span><span className="red-square" />{t("04 / MY LIFE")}</span>
                <span>{t("ON STAGE & BEHIND THE SCENES")}</span>
              </div>
              <p className="micro my-life-eyebrow">{t("CONTENT / MUSIC / COLLABORATION")}</p>
              <h3 className="chapter-title" id="my-life-title">{t("MY")} <span>{t("LIFE")}</span></h3>
            </div>
            <VinylRecord />
            <div className="my-life-copy" lang={locale === "zh" ? "zh-CN" : "en"}>
              {myLife.paragraphs.map((paragraph) => <p key={t(paragraph)}>{t(paragraph)}</p>)}
            </div>
          </section>
          <AcademicWorkbench />
        </section>

      </main>

      <SiteFooter />
      <BackgroundMusic onPlayingChange={setMusicPlaying} />
    </>
  );
}

export default App;
