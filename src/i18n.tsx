import { createContext, useCallback, useContext, useLayoutEffect, useState, type ReactNode } from "react";
import chinese from "./locales/zh.json";

export type Locale = "en" | "zh";
export type Translate = (text: string) => string;
const translations: Record<string, string> = chinese;

function readLocale(): Locale {
  const requested = new URL(window.location.href).searchParams.get("lang");
  return requested === "zh" ? "zh" : "en";
}

const LanguageContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translate;
} | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, updateLocale] = useState<Locale>(readLocale);
  const t = useCallback<Translate>((text) => locale === "zh" ? translations[text] ?? text : text, [locale]);

  useLayoutEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    document.title = t("Haoyang Lin — Enter the Frequency");
    document.querySelector('meta[name="description"]')?.setAttribute("content", t("Enter the frequency. The personal website of musician Haoyang Lin — an introduction, stage experience, and academic experience."));
    const syncUrl = () => updateLocale(readLocale());
    window.addEventListener("popstate", syncUrl);
    return () => window.removeEventListener("popstate", syncUrl);
  }, [locale, t]);

  function setLocale(next: Locale) {
    const url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    window.history.replaceState(window.history.state, "", url);
    updateLocale(next);
  }

  return <LanguageContext.Provider value={{ locale, setLocale, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage requires LanguageProvider.");
  return context;
}

export function LanguageSwitch() {
  const { locale, setLocale } = useLanguage();
  return (
    <button className="language-switch" type="button" lang={locale === "en" ? "zh-CN" : "en"}
      aria-label={locale === "en" ? "切换为中文" : "Switch to English"}
      onClick={() => setLocale(locale === "en" ? "zh" : "en")}>
      <span aria-hidden="true">◎</span>{locale === "en" ? "中文" : "EN"}
    </button>
  );
}
