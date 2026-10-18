import { useLanguage } from "./i18n";
import { artist } from "./content";
import { Arrow, Mark } from "./icons";
import "./SiteFooter.css";

export default function SiteFooter() {
  const { t } = useLanguage();
  return (
    <footer className="site-footer" aria-labelledby="footer-title">
      <img
        className="footer-background"
        src="/images/footer-portrait.webp"
        width="2022"
        height="778"
        alt=""
        loading="lazy"
        decoding="async"
      />
      <div className="footer-topline">
        <a className="footer-brand" href="#index" aria-label={t(`${artist.name}, home`)}>
          <Mark />
          <span>{t(artist.name).toUpperCase()}</span>
        </a>
        <span className="micro footer-signoff">{t("A PERSONAL SPACE.")}<br />{t("A SHARED MOMENT.")}</span>
      </div>

      <div className="footer-main">
        <div className="footer-copy">
          <p className="micro footer-eyebrow"><span className="red-square" /> {t("THE LAST NOTE / FOR NOW")}</p>
          <h2 id="footer-title">{t("THANKS FOR")}<br /><span>{t("TUNING IN.")}</span></h2>
          <p className="footer-message">{t("Music, life, and everything in between.")}<br />{t("See you in the next chapter.")}</p>
          <a className="button button-outline footer-explore" href="#explore">
            {t("BACK TO EXPLORE")} <Arrow diagonal />
          </a>
        </div>

        <nav className="footer-nav" aria-label={t("Footer navigation")}>
          <p className="micro">{t("REVISIT A CHAPTER")}</p>
          <a href="#introduction"><span>{t("INTRODUCTION")}</span><Arrow diagonal /></a>
          <a href="#my-life"><span>{t("MY LIFE")}</span><Arrow diagonal /></a>
          <a href="#academic-experience"><span>{t("ACADEMIC")}</span><Arrow diagonal /></a>
        </nav>
      </div>

      <div className="footer-bottom micro">
        <span>© {new Date().getFullYear()} {t(artist.name).toUpperCase()}</span>
        <span className="footer-endnote">{t("END OF PAGE. STILL IN TUNE.")}</span>
        <a className="back-top" href="#index">{t("BACK TO TOP")} <span aria-hidden="true">↑</span></a>
      </div>
    </footer>
  );
}
