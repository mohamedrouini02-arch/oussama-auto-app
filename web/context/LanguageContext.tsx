'use client'

import { Language, translations } from '@/lib/i18n/translations'
import React, { createContext, useContext, useEffect, useState } from 'react'

type LanguageContextType = {
    language: Language
    setLanguage: (lang: Language) => void
    t: typeof translations['en'] | typeof translations['ar']
    dir: 'ltr' | 'rtl'
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('en')

    useEffect(() => {
        const savedLang = localStorage.getItem('language') as Language
        if (savedLang) {
            setLanguage(savedLang)
        }
    }, [])

    useEffect(() => {
        localStorage.setItem('language', language)
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
        document.documentElement.lang = language
    }, [language])

    const value: LanguageContextType = {
        language,
        setLanguage,
        t: translations[language],
        dir: language === 'ar' ? 'rtl' : 'ltr',
    }

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}
