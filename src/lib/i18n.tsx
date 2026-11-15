import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { en, he } from "./translations";

export type Lang = "ar" | "en" | "he";

const DICTS: Record<Exclude<Lang, "ar">, Record<string, string>> = { en, he };
const STORAGE_KEY = "hj-lang";

interface I18nContextValue {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (lang: Lang) => void;
  /** Translate an Arabic source string. Falls back to the key itself. */
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function readSavedLang(): Lang {
  if (typeof window === "undefined") return "ar";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "en" || saved === "he" ? saved : "ar";
  } catch {
    return "ar";
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readSavedLang);
  const dir: "rtl" | "ltr" = lang === "en" ? "ltr" : "rtl";

  useEffect(() => {
    document.documentElement.lang = lang === "he" ? "he" : lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  function setLang(next: Lang) {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable */
    }
  }

  function t(key: string): string {
    if (lang === "ar") return key;
    return DICTS[lang][key] ?? key;
  }

  return (
    <I18nContext.Provider value={{ lang, dir, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Safe fallback when used outside the provider (shouldn't happen).
    return { lang: "ar", dir: "rtl", setLang: () => {}, t: (k) => k };
  }
  return ctx;
}
