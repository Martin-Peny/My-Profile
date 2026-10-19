import { useLanguage } from "./i18n";
export const portraitUrl = `${import.meta.env.BASE_URL}images/hero-portrait.webp`;
export const portraitDescription = "Haoyang Ling wearing a red hoodie and holding a microphone";

export default function PortraitFallback() {
  const { t } = useLanguage();
  return <img className="portrait-fallback" src={portraitUrl} alt={t(portraitDescription)}
    width="630" height="997" fetchPriority="high" draggable={false} />;
}
