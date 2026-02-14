'use client'

import { useLanguage } from '@/context/LanguageContext'
import { clsx } from 'clsx'

export default function LanguageToggle() {
    const { language, setLanguage } = useLanguage()

    return (
        <div className="flex items-center bg-gray-100 dark:bg-slate-800/50 rounded-xl p-1 border border-gray-100 dark:border-slate-700/50">
            <button
                onClick={() => setLanguage('en')}
                className={clsx(
                    'flex-1 px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200',
                    language === 'en'
                        ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                )}
            >
                English
            </button>
            <button
                onClick={() => setLanguage('ar')}
                className={clsx(
                    'flex-1 px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200',
                    language === 'ar'
                        ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                )}
            >
                العربية
            </button>
        </div>
    )
}
