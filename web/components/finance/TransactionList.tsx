'use client'

import { clsx } from 'clsx'
import { format } from 'date-fns'
import { ArrowDown, ArrowUp, ArrowUpRight, Calendar, Car, Edit, Eye, FileText, MapPin, Phone, Trash, Truck, User, Wallet } from 'lucide-react'
import Link from 'next/link'

// Use a loose type for now
type Transaction = any

interface TransactionListProps {
    transactions: Transaction[]
    onDelete: (id: string) => void
    userRole: string | null
}

export default function TransactionList({ transactions, onDelete, userRole }: TransactionListProps) {
    if (transactions.length === 0) {
        return (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
                <p className="text-gray-500 dark:text-gray-400">No transactions found.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-slate-700 uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3 whitespace-nowrap">Date / Type</th>
                                <th className="px-4 py-3">Client Info</th>
                                <th className="px-4 py-3">Car Details</th>
                                <th className="px-4 py-3">Sales Info</th>
                                <th className="px-4 py-3 text-right">Amount / Remaining</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                            {transactions.map((t) => {
                                const remaining = (t.amount || 0) - (t.paid_amount || 0)
                                return (
                                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                        {/* Address Extraction Logic */}
                                        {(() => {
                                            if (!t.customer_address && t.description) {
                                                const match = t.description.match(/\nAddress: (.*)/)
                                                if (match) t.customer_address = match[1]
                                            }
                                            return null
                                        })()}
                                        {/* Date & Type */}
                                        <td className="px-4 py-3 align-top whitespace-nowrap">
                                            <Link href={`/finance/details?id=${t.id}`} className="group block">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                        {format(new Date(t.transaction_date), 'dd MMM yyyy')}
                                                    </span>
                                                    <div className="flex items-center gap-1.5">
                                                        {t.type === 'Income' ? (
                                                            <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded text-[10px]">
                                                                <ArrowUp className="w-3 h-3" /> Income
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded text-[10px]">
                                                                <ArrowDown className="w-3 h-3" /> Expense
                                                            </span>
                                                        )}
                                                        <span className="text-gray-400">|</span>
                                                        <span className="text-gray-500 dark:text-gray-400">{t.category}</span>
                                                    </div>
                                                </div>
                                            </Link>
                                        </td>

                                        {/* Client Info */}
                                        <td className="px-4 py-3 align-top">
                                            <div className="flex flex-col gap-1 max-w-[200px]">
                                                {(t.customer_name || t.customer_phone || t.customer_email || t.customer_address || t.customer_postal_code) ? (
                                                    <>
                                                        {t.customer_name && (
                                                            <div className="flex items-center gap-1.5 font-medium text-gray-900 dark:text-white truncate">
                                                                <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                                {t.customer_name}
                                                            </div>
                                                        )}
                                                        {t.customer_phone && (
                                                            <div className="flex items-center gap-1.5 text-gray-500">
                                                                <Phone className="w-3 h-3 flex-shrink-0" />
                                                                {t.customer_phone}
                                                            </div>
                                                        )}
                                                        {/* Address / Postal Code */}
                                                        {(t.customer_postal_code || t.customer_address) && (
                                                            <div className="flex items-start gap-1.5 mt-1">
                                                                <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                                                                <span className="text-xs text-gray-700 dark:text-gray-300 break-words whitespace-normal leading-tight">
                                                                    {[t.customer_address, t.customer_postal_code].filter(Boolean).join(' ')}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-gray-400 italic">No client info</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Car Details */}
                                        <td className="px-4 py-3 align-top">
                                            {(t.car_brand || t.car_model) ? (
                                                <div className="flex flex-col gap-1">
                                                    {t.related_order_id ? (
                                                        <Link
                                                            href={`/orders/details?id=${t.related_order_id}`}
                                                            className="group flex flex-col gap-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 -m-2 p-2 rounded transition-colors"
                                                            title="View Order Details"
                                                        >
                                                            <div className="font-medium text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-1.5">
                                                                <Car className="w-3.5 h-3.5 flex-shrink-0" />
                                                                {t.car_year} {t.car_brand} {t.car_model}
                                                                <ArrowUpRight className="w-3 h-3 opacity-50" />
                                                            </div>
                                                            <div className="pl-5 space-y-0.5 text-gray-500">
                                                                {t.car_color && <div>Color: <span className="text-gray-700 dark:text-gray-300">{t.car_color}</span></div>}
                                                                {t.car_milage && <div>Mileage: {t.car_milage.toLocaleString()} km</div>}
                                                                {t.car_vin && <div className="font-mono text-[10px] truncate" title={t.car_vin}>{t.car_vin}</div>}
                                                            </div>
                                                        </Link>
                                                    ) : (
                                                        <>
                                                            <div className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                                                                <Car className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                                {t.car_year} {t.car_brand} {t.car_model}
                                                            </div>
                                                            <div className="pl-5 space-y-0.5 text-gray-500">
                                                                {t.car_color && <div>Color: <span className="text-gray-700 dark:text-gray-300">{t.car_color}</span></div>}
                                                                {t.car_milage && <div>Mileage: {t.car_milage.toLocaleString()} km</div>}
                                                                {t.car_vin && <div className="font-mono text-[10px] truncate" title={t.car_vin}>{t.car_vin}</div>}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic text-xs">-</span>
                                            )}
                                        </td>

                                        {/* Sales Info (Seller & Commissions) */}
                                        <td className="px-4 py-3 align-top">
                                            <div className="flex flex-col gap-1 max-w-[180px]">
                                                {(t.seller_name || t.buyer_name) && (
                                                    <div className="text-gray-900 dark:text-white font-medium">
                                                        {t.seller_name && <span>Seller: {t.seller_name}</span>}
                                                        {t.seller_name && t.buyer_name && <span className="text-gray-400 mx-1">|</span>}
                                                        {t.buyer_name && <span>Buyer: {t.buyer_name}</span>}
                                                    </div>
                                                )}
                                                {(t.seller_commission || t.buyer_commission || t.bureau_commission) && (
                                                    <div className="text-[10px] text-gray-500 space-y-0.5 bg-gray-50 dark:bg-slate-800 p-1.5 rounded">
                                                        {t.seller_commission > 0 && <div className="flex justify-between"><span>Seller Com:</span> <span>{t.seller_commission}</span></div>}
                                                        {t.buyer_commission > 0 && <div className="flex justify-between"><span>Buyer Com:</span> <span>{t.buyer_commission}</span></div>}
                                                        {t.bureau_commission > 0 && <div className="flex justify-between"><span>Bureau:</span> <span>{t.bureau_commission}</span></div>}
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Amount & Remaining */}
                                        <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                                            <div className="flex flex-col items-end gap-0.5">
                                                <span className={clsx(
                                                    "font-bold text-sm",
                                                    t.type === 'Income' ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white"
                                                )}>
                                                    {t.amount?.toLocaleString()} <span className="text-xs text-gray-500 font-normal">{t.currency}</span>
                                                </span>

                                                {remaining > 0 && t.payment_status === 'Partial' && (
                                                    <div className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1 font-medium bg-red-50 dark:bg-red-900/10 px-1.5 py-0.5 rounded">
                                                        <Wallet className="w-3 h-3" />
                                                        Rem: {remaining.toLocaleString()}
                                                    </div>
                                                )}
                                                {t.paid_amount > 0 && (
                                                    <span className="text-[10px] text-gray-400">
                                                        Paid: {t.paid_amount?.toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-3 align-top text-center">
                                            <span className={clsx(
                                                "inline-flex px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide",
                                                t.payment_status === 'Paid' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                                    t.payment_status === 'Partial' ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                                        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                            )}>
                                                {t.payment_status}
                                            </span>
                                            <p className="text-[10px] text-gray-400 mt-1 capitalize">{t.payment_method?.replace('_', ' ')}</p>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/finance/details?id=${t.id}`}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                <Link
                                                    href={`/finance/invoice?id=${t.id}`}
                                                    className="p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                                    title="View Invoice"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </Link>
                                                <Link
                                                    href={`/shipping/new?transaction_id=${t.id}`}
                                                    className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                    title="Create Shipping Form"
                                                >
                                                    <Truck className="w-4 h-4" />
                                                </Link>

                                                {userRole === 'admin' && (
                                                    <>
                                                        <Link
                                                            href={`/finance/edit?id=${t.id}`}
                                                            className="p-1.5 text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => onDelete(t.id)}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
                {transactions.map((t) => {
                    const remaining = (t.amount || 0) - (t.paid_amount || 0)
                    return (
                        <div key={t.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-4">
                            {/* Address Extraction Logic */}
                            {(() => {
                                if (!t.customer_address && t.description) {
                                    const match = t.description.match(/\nAddress: (.*)/)
                                    if (match) t.customer_address = match[1]
                                }
                                return null
                            })()}
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div className={clsx(
                                        "p-2 rounded-lg",
                                        t.type === 'Income' ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                                    )}>
                                        {t.type === 'Income' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            {t.amount?.toLocaleString()} <span className="text-xs font-normal text-gray-500">{t.currency}</span>
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(t.transaction_date), 'dd MMM yyyy')}
                                        </p>
                                    </div>
                                </div>
                                <span className={clsx(
                                    "inline-flex px-2 py-1 rounded-full text-xs font-medium",
                                    t.payment_status === 'Paid' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                        t.payment_status === 'Partial' ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                )}>
                                    {t.payment_status}
                                </span>
                            </div>

                            <div className="space-y-3 mb-4">
                                {/* Client */}
                                {(t.customer_name || t.customer_phone || t.customer_address) && (
                                    <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                        <User className="w-4 h-4 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="font-medium">{t.customer_name || 'Unknown Client'}</p>
                                            <p className="text-xs text-gray-500">{t.customer_phone}</p>
                                            {(t.customer_address || t.customer_postal_code) && (
                                                <p className="text-xs text-gray-400">{t.customer_address} {t.customer_postal_code}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Car */}
                                {(t.car_brand || t.car_model) && (
                                    t.related_order_id ? (
                                        <Link href={`/orders/details?id=${t.related_order_id}`} className="block">
                                            <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-2 rounded hover:bg-blue-100 transition-colors border border-blue-100 dark:border-blue-900/30">
                                                <Car className="w-4 h-4 text-blue-500 mt-0.5" />
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <p className="font-medium text-blue-900 dark:text-blue-100">{t.car_year} {t.car_brand} {t.car_model}</p>
                                                        <ArrowUpRight className="w-3 h-3 text-blue-400" />
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 text-xs text-blue-700 dark:text-blue-300 mt-1">
                                                        {t.car_milage && <span>{t.car_milage.toLocaleString()} km</span>}
                                                        {t.car_color && <span>{t.car_color}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ) : (
                                        <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-800 p-2 rounded">
                                            <Car className="w-4 h-4 text-gray-400 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="font-medium">{t.car_year} {t.car_brand} {t.car_model}</p>
                                                <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-1">
                                                    {t.car_milage && <span>{t.car_milage.toLocaleString()} km</span>}
                                                    {t.car_color && <span>{t.car_color}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                )}

                                {/* Remaining */}
                                {remaining > 0 && t.payment_status === 'Partial' && (
                                    <div className="flex justify-between items-center bg-red-50 dark:bg-red-900/10 p-2 rounded text-sm text-red-700 dark:text-red-400">
                                        <span className="font-medium">Remaining to pay:</span>
                                        <span className="font-bold">{remaining.toLocaleString()} {t.currency}</span>
                                    </div>
                                )}

                                {/* Seller/Buyer/Commissions (Compact) */}
                                {(t.seller_name || t.buyer_name || t.seller_commission > 0) && (
                                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-100 dark:border-slate-800">
                                        {t.seller_name && <span>Sold by: <span className="font-medium text-gray-700 dark:text-gray-300">{t.seller_name}</span></span>}
                                        {t.buyer_name && <span className="ml-2">Buyer: <span className="font-medium text-gray-700 dark:text-gray-300">{t.buyer_name}</span></span>}
                                        {t.seller_commission > 0 && <span className="ml-2">Com: {t.seller_commission}</span>}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-slate-800 pt-3">
                                <Link
                                    href={`/finance/details?id=${t.id}`}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-800 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <Eye className="w-4 h-4" /> Details
                                </Link>
                                <Link
                                    href={`/finance/invoice?id=${t.id}`}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                    <FileText className="w-4 h-4" /> Invoice
                                </Link>
                                <Link
                                    href={`/shipping/new?transaction_id=${t.id}`}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg hover:bg-indigo-100 transition-colors"
                                >
                                    <Truck className="w-4 h-4" /> Ship
                                </Link>
                                {userRole === 'admin' && (
                                    <>
                                        <Link
                                            href={`/finance/edit?id=${t.id}`}
                                            className="p-2 text-gray-500 hover:text-orange-600 dark:hover:text-orange-400 bg-gray-50 dark:bg-slate-800 rounded-lg transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Link>
                                        <button
                                            onClick={() => onDelete(t.id)}
                                            className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 bg-gray-50 dark:bg-slate-800 rounded-lg transition-colors"
                                        >
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
