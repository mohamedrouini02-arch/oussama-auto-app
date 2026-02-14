import { clsx } from 'clsx'
import { Car, DollarSign, LayoutDashboard, LogOut, ShoppingCart, Truck, X } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useUserRole } from '../hooks/useUserRole'
import LanguageToggle from './LanguageToggle'

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const navigate = useNavigate()
    const { signOut } = useAuth()
    const { t, dir } = useLanguage()
    const { role } = useUserRole()

    const navigation = [
        { name: t.common.dashboard, href: '/', icon: LayoutDashboard },
        { name: t.common.orders, href: '/orders', icon: ShoppingCart },
        { name: t.common.inventory, href: '/inventory', icon: Car },
        { name: t.common.finance, href: '/finance', icon: DollarSign },
        { name: t.common.shipping, href: '/shipping', icon: Truck },
    ]

    const handleLogout = async () => {
        await signOut()
        navigate('/login')
    }

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={clsx(
                    'fixed inset-0 z-40 bg-gray-900/50 transition-opacity lg:hidden',
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className={clsx(
                'fixed inset-y-0 z-50 flex w-64 flex-col justify-between bg-white transition-transform duration-300 ease-in-out lg:translate-x-0 print:hidden',
                dir === 'rtl' ? 'right-0 border-l' : 'left-0 border-r',
                isOpen ? 'translate-x-0' : (dir === 'rtl' ? 'translate-x-full' : '-translate-x-full')
            )}>
                <div className="px-4 py-6">
                    <div className="flex items-center justify-between px-2 mb-8">
                        <div className="flex items-center gap-2">
                            <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                {/* <img
                  src="/logo-final.png"
                  alt="Wahid Auto"
                  className="object-cover w-full h-full"
                /> */}
                                <span className="text-2xl font-bold text-blue-600">WA</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">Wahid Auto</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg lg:hidden"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <nav className="space-y-1 mb-8">
                        {navigation.filter(item => {
                            if (item.href === '/finance') return role === 'admin'
                            return true
                        }).map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.href}
                                onClick={() => onClose()}
                                className={({ isActive }) => clsx(
                                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                )}
                            >
                                {({ isActive }) => (
                                    <>
                                        <item.icon className={clsx('w-5 h-5', isActive ? 'text-blue-600' : 'text-gray-400')} />
                                        {item.name}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="px-2">
                        <LanguageToggle />
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                        <LogOut className="w-5 h-5" />
                        {t.common.signOut}
                    </button>
                </div>
            </div>
        </>
    )
}
