"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type LanguageCode = "en" | "hi" | "mr" | "ta" | "bn";

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
];

interface TranslationContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  translateText: (text: string) => Promise<string>;
  translateTextWithLang: (text: string, targetLang: LanguageCode) => Promise<string>;
  loading: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const [loading, setLoading] = useState(false);

  // Load language preference from local storage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem("tatva_language") as LanguageCode;
    if (savedLang && SUPPORTED_LANGUAGES.some((l) => l.code === savedLang)) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem("tatva_language", lang);
  };

  const translateTextWithLang = async (text: string, targetLang: LanguageCode): Promise<string> => {
    if (!text || !text.trim() || targetLang === "en") return text;

    const cacheKey = `tatva_trans_${targetLang}_${encodeURIComponent(text.trim())}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;

    setLoading(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, target: targetLang }),
      });
      const data = await res.json();
      if (data.translatedText) {
        // Decode HTML entities that might be returned by Google Translate
        const parser = new DOMParser();
        const decodedText = parser.parseFromString(data.translatedText, "text/html").body.textContent || data.translatedText;
        localStorage.setItem(cacheKey, decodedText);
        return decodedText;
      }
      return text;
    } catch (err) {
      console.error("Translation API failure:", err);
      return text;
    } finally {
      setLoading(false);
    }
  };

  const translateText = async (text: string): Promise<string> => {
    return translateTextWithLang(text, language);
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, translateText, translateTextWithLang, loading }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
};

// Component helper for inline string translations
export const T: React.FC<{ children: string }> = ({ children }) => {
  const { language, translateText } = useTranslation();
  const [translated, setTranslated] = useState(children);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (language === "en") {
      setTranslated(children);
      return;
    }

    let isMounted = true;
    setLoading(true);

    translateText(children).then((res) => {
      if (isMounted) {
        setTranslated(res);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [children, language, translateText]);

  return <span className={loading ? "opacity-75 transition-opacity" : ""}>{translated}</span>;
};
