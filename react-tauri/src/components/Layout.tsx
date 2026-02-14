import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import Sidebar from './Sidebar'

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { dir } = useLanguage()

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className={`min-h-screen flex flex-col transition-all duration-300 ${dir === 'rtl' ? 'lg:mr-64' : 'lg:ml-64'}`}>
                {/* Mobile Header */}
                <div className="sticky top-0 z-30 flex items-center gap-x-4 border-b border-gray-200 bg-white px-4 py-4 shadow-sm lg:hidden print:hidden">
                    <button
                        type="button"
                        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <span className="sr-only">Open sidebar</span>
                        <Menu className="h-6 w-6" aria-hidden="true" />
                    </button>
                    <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">Wahid Auto</div>
                </div>

                <main className="flex-1 py-8">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}
