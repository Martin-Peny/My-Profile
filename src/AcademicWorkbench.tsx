import { useLanguage } from "./i18n";
import { useEffect, useRef, useState } from "react";
import "./AcademicWorkbench.css";
import AcademicScene, { type DeskProp, type AcademicTarget } from "./AcademicScene";
import { AcademicPages } from "./AcademicPages";

export default function AcademicWorkbench() {
  const { t } = useLanguage();
  const [bookOpen, setBookOpen] = useState(false);
  const [spread, setSpread] = useState(0);
  const [bookHovered, setBookHovered] = useState(false);
  const [propHovered, setPropHovered] = useState<DeskProp | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const targets = useRef<Record<AcademicTarget, HTMLElement | null>>({ book: null, microphone: null, headphones: null, previousPage: null, nextPage: null, bookClose: null });
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bookOpen) return;
    let frame = 0;
    let previousBounds: number[] | undefined;
    const frameBook = () => {
      const viewport = viewportRef.current;
      const book = targets.current.book;
      if (!viewport || !book) return;
      const scene = viewport.querySelector<HTMLElement>(".academic-scene");
      if (sceneReady && (scene?.dataset.open !== "true" || !["idle", "static"].includes(scene.dataset.motion ?? ""))) {
        frame = requestAnimationFrame(frameBook);
        return;
      }
      const bounds = book.getBoundingClientRect();
      const view = viewport.getBoundingClientRect();
      const left = bounds.left - view.left + viewport.scrollLeft;
      const top = bounds.top - view.top + viewport.scrollTop;
      const currentBounds = [left, top, bounds.width, bounds.height];
      // ResizeObserver can update the projection after the first settled render.
      if (!previousBounds || currentBounds.some((value, index) => Math.abs(value - previousBounds![index]!) > .5)) {
        previousBounds = currentBounds;
        frame = requestAnimationFrame(frameBook);
        return;
      }
      viewport.scrollTo({ left: left - 24, top: top - 24 });
    };
    frame = requestAnimationFrame(() => { frame = requestAnimationFrame(frameBook); });
    return () => cancelAnimationFrame(frame);
  }, [bookOpen, sceneReady]);

  function closeBook() {
    setBookOpen(false);
    requestAnimationFrame(() => {
      targets.current.book?.focus({ preventScroll: true });
      targets.current.book?.scrollIntoView({ block: "center", behavior: "instant" });
    });
  }

  return (
    <section
      className={`academic-workbench ${bookOpen ? "is-open" : ""}`}
      id="academic-experience"
      aria-labelledby="academic-title"
      tabIndex={-1}
    >
      <div className="academic-topline micro">
        <span><span className="red-square" />{t("05 / ACADEMIC")}</span>
        <span>{t("RESEARCH DESK / OPEN NOTEBOOK")}</span>
        <span>{t("BOOK 001 / HAOYANG LIN")}</span>
      </div>

      <div className="academic-intro">
        <div>
          <p className="micro academic-eyebrow">{t("MY LIFE / ACADEMIC / WORKTABLE")}</p>
          <h2 className="chapter-title" id="academic-title">{t("ACADEMIC")} <span>{t("LAB")}</span></h2>
        </div>
        <p className="academic-intro-copy">
          {t("A working desk for questions, methods, and the ideas I am still developing.")}
          <span className="micro">{t("HOVER THE BOOK / CLICK TO OPEN")}</span>
        </p>
      </div>

      <div className={`academic-book-viewport ${bookOpen ? "is-zoomed" : ""}`} ref={viewportRef}
        tabIndex={bookOpen ? 0 : undefined} role={bookOpen ? "region" : undefined}
        aria-label={bookOpen ? t("Enlarged book. Scroll horizontally and vertically to read the pages.") : undefined}>
      <div className="academic-stage" aria-label={t("Interactive academic workbench")} data-scene-ready={sceneReady}
        onKeyDown={event => {
          if (!bookOpen) return;
          if (event.key === "Escape") { event.preventDefault(); closeBook(); }
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            setSpread(event.key === "ArrowLeft" ? 0 : 1);
          }
        }}>
        <div className="academic-stage-grid" aria-hidden="true" />
        <AcademicScene open={bookOpen} spread={spread} hovered={bookHovered} propHovered={propHovered} targets={targets} onReadyChange={setSceneReady} />
        <div className="academic-stage-corner academic-stage-corner-tl" aria-hidden="true" />
        <div className="academic-stage-corner academic-stage-corner-br" aria-hidden="true" />
        <div className="academic-stage-label academic-stage-label-top micro" aria-hidden="true">
          <span>{t("FIELD NOTES / 05")}</span><span>{t("◼ SIGNAL / STUDY")}</span>
        </div>
        <div className="academic-stage-label academic-stage-label-bottom micro" aria-hidden="true">
          <span>{t("METHOD / MEMORY / MEANING")}</span><span>01—03</span>
        </div>

        <div className="academic-paper paper-one" aria-hidden="true">
          <span>{t("USER")}</span><i /><i /><i /><b>↗</b>
        </div>
        <div className="academic-paper paper-two" aria-hidden="true">
          <span>{t("RESEARCH")}<br />{t("LOG 02")}</span><i /><i /><b>+</b>
        </div>

        {(["microphone", "headphones"] as const).map(prop => (
          <div
            key={prop}
            className={`academic-prop academic-prop-${prop}`}
            ref={node => { targets.current[prop] = node; }}
            role="img"
            aria-label={t(prop === "microphone" ? "Microphone" : "Headphones")}
            tabIndex={sceneReady ? 0 : -1}
            onPointerEnter={event => { if (event.pointerType !== "touch") setPropHovered(prop); }}
            onPointerLeave={() => setPropHovered(null)}
            onPointerCancel={() => setPropHovered(null)}
            onFocus={event => { if (event.currentTarget.matches(":focus-visible")) setPropHovered(prop); }}
            onBlur={() => setPropHovered(null)}
          />
        ))}

        <button
          className={`academic-book ${bookOpen ? "is-open" : ""}`}
          ref={node => { targets.current.book = node; }}
          type="button"
          aria-label={t(bookOpen ? "Close academic book" : "Open academic book")}
          aria-expanded={bookOpen}
          aria-controls="academic-book-content"
          tabIndex={bookOpen ? -1 : 0}
          onClick={() => { if (bookOpen) closeBook(); else setBookOpen(true); }}
          onPointerEnter={(event) => { if (event.pointerType !== "touch") setBookHovered(true); }}
          onPointerLeave={() => setBookHovered(false)}
          onPointerCancel={() => setBookHovered(false)}
          onFocus={(event) => setBookHovered(event.currentTarget.matches(":focus-visible"))}
          onBlur={() => setBookHovered(false)}
        >
          <svg className="academic-book-fallback" viewBox="0 0 320 450" aria-hidden="true">
            <rect x="8" y="10" width="302" height="426" rx="6" fill="#181214" stroke="#93313c" strokeWidth="2" />
            <path d="M17 20h281v402H17zM30 10v426" fill="none" stroke="#b83542" />
            <text x="48" y="60" fill="#b35860" fontFamily="monospace" fontSize="12">HL / 05</text>
            <text x="48" y="140" fill="#d34651" fontFamily="sans-serif" fontSize="30" fontWeight="700">{t("ACADEMIC")}</text>
            <text x="48" y="169" fill="#a9565f" fontFamily="monospace" fontSize="12">{t("FIELD NOTES")}</text>
            <path d="M48 196h220M48 376h220" stroke="#8e303c" />
            <circle cx="159" cy="284" r="50" fill="none" stroke="#7f303c" />
            <text x="48" y="402" fill="#a16970" fontFamily="monospace" fontSize="11">{t("HAOYANG LIN")}</text>
          </svg>
          {!bookOpen && <span className="academic-book-hint micro">{t("OPEN NOTES")} <b>↗</b></span>}
        </button>

        <button className="academic-page-hit academic-page-hit-left" type="button"
          ref={node => { targets.current.previousPage = node; }} hidden={!bookOpen}
          aria-label={t("Previous pages: education, skills, and research interests")} aria-controls="academic-book-content"
          disabled={spread === 0} onClick={() => setSpread(0)}>
          <span className="academic-page-cue" aria-hidden="true">&lt;&lt;</span>
        </button>
        <button className="academic-page-hit academic-page-hit-right" type="button"
          ref={node => { targets.current.nextPage = node; }} hidden={!bookOpen}
          aria-label={t("Next pages: research projects and professional experience")} aria-controls="academic-book-content"
          disabled={spread === 1} onClick={() => setSpread(1)}>
          <span className="academic-page-cue" aria-hidden="true">&gt;&gt;</span>
        </button>
        <button className="academic-inbook-close" type="button"
          ref={node => { targets.current.bookClose = node; }} hidden={!bookOpen}
          aria-label={t("Close academic book")} onClick={closeBook}>{t("close")}</button>
        <p className="sr-only" aria-live="polite">{bookOpen && t(spread === 0 ? "SPREAD 01 / 02 · BACKGROUND & INTERESTS" : "SPREAD 02 / 02 · RESEARCH & EXPERIENCE")}</p>
        <span className="academic-stage-cross cross-one" aria-hidden="true">+</span>
        <span className="academic-stage-cross cross-two" aria-hidden="true">+</span>
      <div
        className={sceneReady ? "sr-only" : "academic-fallback-pages"}
        id="academic-book-content"
        role="region"
        aria-label={t("Academic notebook reader")}
        hidden={!bookOpen}
      >
        <AcademicPages spread={spread} />
      </div>
      </div>
      </div>
    </section>
  );
}
