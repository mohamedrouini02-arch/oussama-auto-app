import { clsx } from 'clsx'
import { useLanguage } from '../contexts/LanguageContext'

export default function LanguageToggle() {
    const { language, setLanguage } = useLanguage()

    return (
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
                onClick={() => setLanguage('en')}
                className={clsx(
                    'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                    language === 'en'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                )}
            >
                English
            </button>
            <button
                onClick={() => setLanguage('ar')}
                className={clsx(
                    'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                    language === 'ar'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                )}
            >
                العربية
            </button>
        </div>
    )
}
