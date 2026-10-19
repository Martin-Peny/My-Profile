import { useLanguage } from "./i18n";
import type { ReactNode } from "react";
import HalftoneReveal from "./HalftoneReveal";
import AboutEarphones from "./AboutEarphones";

export default function GalleryContentSpace({ children }: { children?: ReactNode }) {
  const { t } = useLanguage();
  return (
    <div className="gallery-content-space">
      <div className="gallery-content-body">
        <HalftoneReveal
          src="/images/about-portrait.webp"
          alt={t("Portrait of Haoyang Ling wearing glasses and dangling earrings.")}
        />
        {children}
      </div>
      <AboutEarphones />
    </div>
  );
}
