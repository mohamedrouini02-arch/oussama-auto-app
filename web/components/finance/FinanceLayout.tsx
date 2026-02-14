'use client'

import { useLanguage } from '@/context/LanguageContext'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface FinanceLayoutProps {
    children: React.ReactNode
    currentDate: Date
    onDateChange: (date: Date) => void
}

export default function FinanceLayout({ children, currentDate, onDateChange }: FinanceLayoutProps) {
    const { t } = useLanguage()

    const changeMonth = (increment: number) => {
        const newDate = new Date(currentDate)
        newDate.setMonth(newDate.getMonth() + increment)
        onDateChange(newDate)
    }

    const formatMonth = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date)
    }

    // Generate years for quick select if needed, or just use arrows
    // For now, arrows + text is clean

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <button
                    onClick={() => changeMonth(-1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>

                <h2 className="text-xl font-bold text-gray-800">
                    {formatMonth(currentDate)}
                </h2>

                <button
                    onClick={() => changeMonth(1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            {children}
        </div>
    )
}
