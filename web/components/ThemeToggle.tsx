"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import * as React from "react"

export function ThemeToggle() {
    const { setTheme, theme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className="w-14 h-7 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse" />
    }

    const currentTheme = theme === 'system' ? resolvedTheme : theme
    const isDark = currentTheme === 'dark'

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDark ? 'bg-indigo-600' : 'bg-gray-300'}`}
            aria-label="Toggle Dark Mode"
            type="button"
        >
            <div
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transform transition-all duration-300 flex items-center justify-center ${isDark ? 'translate-x-7.5 rtl:-translate-x-7.5' : 'translate-x-0.5 rtl:-translate-x-0.5'}`}
                style={{ [isDark ? 'insetInlineStart' : 'insetInlineStart']: isDark ? 'calc(100% - 26px)' : '2px' }}
            >
                {isDark ? (
                    <Moon className="w-3.5 h-3.5 text-indigo-600" />
                ) : (
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                )}
            </div>
        </button>
    )
}
