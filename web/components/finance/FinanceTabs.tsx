'use client'

interface FinanceTabsProps {
    activeTab: 'transactions' | 'car_sales' | 'car_expenses' | 'general_expenses' | 'exchange'
    onChange: (tab: 'transactions' | 'car_sales' | 'car_expenses' | 'general_expenses' | 'exchange') => void
}

export default function FinanceTabs({ activeTab, onChange }: FinanceTabsProps) {
    return (
        <div className="flex space-x-2 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl mb-6 w-full overflow-x-auto scrollbar-hide md:w-auto touch-pan-x">
            <button
                onClick={() => onChange('transactions')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${activeTab === 'transactions'
                    ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
            >
                All
            </button>
            <button
                onClick={() => onChange('car_sales')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${activeTab === 'car_sales'
                    ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
            >
                Car Sales
            </button>
            <button
                onClick={() => onChange('car_expenses')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${activeTab === 'car_expenses'
                    ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
            >
                Car Expenses
            </button>
            <button
                onClick={() => onChange('general_expenses')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${activeTab === 'general_expenses'
                    ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
            >
                General Expenses
            </button>
            <button
                onClick={() => onChange('exchange')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${activeTab === 'exchange'
                    ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
            >
                Exchange & Transfers
            </button>
        </div>
    )
}
