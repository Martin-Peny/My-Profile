import { useLanguage } from "./i18n";
import { Fragment, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import images from "./gallery-images.json";
import { Asterisk } from "./icons";

const rows = [
  { id: "top", label: "Top row, landscape photographs", direction: "left" },
  { id: "middle", label: "Middle row, portrait photographs", direction: "left" },
  { id: "bottom", label: "Bottom row, landscape photographs", direction: "left" },
] as const;

function SignalTicker() {
  const { t } = useLanguage();
  return (
    <div className="signal-ticker" aria-hidden="true">
      <div className="ticker-track">
        {[0, 1].map(group => (
          <div className="ticker-sequence" key={group}>
            {[0, 1].map(item => (
              <span className="ticker-phrase" key={item}>
                {t("IDEAS INTO ACTION.")}<Asterisk className="ticker-star" /> {t("PASSION INTO PURPOSE.")}<span className="ticker-arrows">↗↗</span>{t("HAOYANG LING")}
                <Asterisk className="ticker-star" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PhotoGallery() {
  const { t, locale } = useLanguage();
  const galleryRef = useRef<HTMLDivElement>(null);

  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const syncPlaybackRef = useRef<() => void>(() => {});

  useEffect(() => {
    const gallery = galleryRef.current!;
    const viewports = [...gallery.querySelectorAll<HTMLElement>(".gallery-row")];
    const tickers = [...gallery.querySelectorAll<HTMLElement>(".signal-ticker")];
    const media = gsap.matchMedia();
    let tweens: gsap.core.Tween[] = [];
    let visible = false;
    let disposed = false;

    const syncPlayback = () => {
      const running = visible && !document.hidden && !pausedRef.current && gallery.dataset.motion === "auto";
      tweens.forEach(tween => tween.paused(!running));
      gallery.dataset.running = String(running);
    };
    syncPlaybackRef.current = syncPlayback;
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncPlayback();
    });
    visibility.observe(gallery);
    document.addEventListener("visibilitychange", syncPlayback);

    media.add(
      { animate: "(prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)" },
      (context) => {
        const animate = context.conditions!.animate;
        gallery.dataset.motion = animate ? "auto" : "static";
        viewports.forEach(viewport => {
          viewport.scrollLeft = 0;
          viewport.tabIndex = animate ? -1 : 0;
        });
        if (!animate) {
          tweens = [];
          syncPlayback();
          return;
        }
        let frame = 0;
        let active = true;
        // Re-enter the media context so rebuilt tweens are also reverted on cleanup.
        const rebuild = () => context.add(() => {
          const phases = tweens.map(tween => tween.progress());
          tweens.forEach(tween => tween.kill());
          const measurements = viewports.map(viewport => ({
            track: viewport.querySelector<HTMLElement>(".gallery-track")!,
            distance: viewport.querySelector<HTMLElement>(".gallery-sequence")!.getBoundingClientRect().width,
            right: false,
            duration: viewport.querySelector<HTMLElement>(".gallery-sequence")!.getBoundingClientRect().width / 18,
          }));
          measurements.push(...tickers.map(ticker => ({
            track: ticker.querySelector<HTMLElement>(".ticker-track")!,
            distance: ticker.querySelector<HTMLElement>(".ticker-sequence")!.getBoundingClientRect().width,
            right: true,
            duration: 48,
          })));
          tweens = measurements.map(({ track, distance, right, duration }, index) =>
            gsap.fromTo(track,
              { x: right ? -distance : 0 },
              {
                x: right ? 0 : -distance,
                duration,
                repeat: -1,
                ease: "none",
                paused: true,
              },
            ).progress(phases[index] ?? 0),
          );
          syncPlayback();
        });
        const scheduleRebuild = () => {
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(() => { if (!disposed && active) rebuild(); });
        };
        rebuild();
        const observer = new ResizeObserver(scheduleRebuild);
        [...viewports, ...tickers].forEach(viewport => observer.observe(viewport));
        document.fonts.ready.then(() => { if (!disposed && active) scheduleRebuild(); });
        return () => {
          active = false;
          cancelAnimationFrame(frame);
          observer.disconnect();
          tweens = [];
        };
      },
      gallery,
    );

    return () => {
      disposed = true;
      visibility.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      media.revert();
      syncPlaybackRef.current = () => {};
    };
  }, [locale]);

  useEffect(() => {
    pausedRef.current = paused;
    syncPlaybackRef.current();
  }, [paused]);

  return (
    <div className="photo-gallery" ref={galleryRef} data-motion="static" aria-label={t("Photo gallery")}>
      <div className="gallery-controls micro">
        <span><span className="red-square" /> {t("SLOW MOTION / THREE PERSPECTIVES")}</span>
        <button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}>
          {t(paused ? "RESUME GALLERY" : "PAUSE GALLERY")}<span aria-hidden="true">{paused ? "▶" : "Ⅱ"}</span>
        </button>
      </div>
      <p className="gallery-browse-hint micro" id="gallery-browse-hint">
        {t("SCROLL EACH ROW TO EXPLORE · USE LEFT AND RIGHT ARROW KEYS")}
      </p>
      <SignalTicker />
      {rows.map((row) => (
        <Fragment key={row.id}>
          <div
            className="gallery-row"
            data-row={row.id}
            data-direction={row.direction}
            role="region"
            aria-label={t(row.label)}
            aria-describedby="gallery-browse-hint"
            tabIndex={0}
          >
            <div className="gallery-track">
              {[false, true].map(duplicate => (
                <ul className="gallery-sequence" key={String(duplicate)} aria-hidden={duplicate ? true : undefined}>
                  {images.filter((image) => image.row === row.id).map((image) => (
                    <li className="gallery-photo" key={image.id} style={{ aspectRatio: `${image.width} / ${image.height}` }}>
                      <img
                        src={`${import.meta.env.BASE_URL}${image.variants[0].src}`}
                        srcSet={image.variants.map((variant) => `${import.meta.env.BASE_URL}${variant.src} ${variant.width}w`).join(", ")}
                        sizes={`(max-width: 760px) ${Math.ceil(280 * image.width / image.height)}px, ${Math.ceil(420 * image.width / image.height)}px`}
                        width={image.width}
                        height={image.height}
                        alt={duplicate ? "" : t(image.alt)}
                        loading="lazy"
                        decoding="async"
                      />
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
          <SignalTicker />
        </Fragment>
      ))}
    </div>
  );
}
