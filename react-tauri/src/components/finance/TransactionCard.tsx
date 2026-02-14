import { format } from 'date-fns'
import { ArrowDownLeft, ArrowUpRight, Car, Edit, Eye, FileText, Globe, Printer, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'

type Transaction = any // Using any for now

interface TransactionCardProps {
    transaction: Transaction
    onDelete: (id: string) => void
}

export default function TransactionCard({ transaction, onDelete }: TransactionCardProps) {
    const { t } = useLanguage()
    const isIncome = transaction.type === 'Income'
    const statusColor: Record<string, string> = {
        Paid: 'bg-green-100 text-green-800',
        Partial: 'bg-yellow-100 text-yellow-800',
        Unpaid: 'bg-red-100 text-red-800',
        Pending: 'bg-gray-100 text-gray-800',
    }

    const statusLabel: Record<string, string> = {
        Paid: t.finance.paid,
        Partial: t.finance.partial,
        Unpaid: t.finance.unpaid,
        Pending: t.finance.pending,
    }

    const currentStatusColor = statusColor[transaction.payment_status || 'Pending'] || statusColor.Pending
    const currentStatusLabel = statusLabel[transaction.payment_status || 'Pending'] || statusLabel.Pending

    // Calculations
    const calculateRemaining = () => {
        const total = transaction.amount || 0
        const paid = transaction.paid_amount || 0
        return Math.max(0, total - paid)
    }

    const calculateProfit = () => {
        const sellingPrice = transaction.amount || 0
        const buyingPrice = transaction.car_buying_price || 0
        const commissions = (transaction.seller_commission || 0) + (transaction.buyer_commission || 0) + (transaction.bureau_commission || 0)
        return sellingPrice - buyingPrice - commissions
    }

    const isCarTransaction = transaction.category === 'Car Sale' || transaction.category === 'Buying Car'
    const netProfit = calculateProfit()

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col h-full overflow-hidden">
            {/* Header Section */}
            <div className="p-5 border-b border-gray-50 bg-gray-50/30">
                <div className="flex justify-between items-start">
                    {/* Amount & Date (Left) */}
                    <div>
                        <div className={`text-2xl font-bold ${isIncome ? 'text-green-600' : 'text-red-600'} dir-ltr`}>
                            {isIncome ? '+' : '-'}{transaction.amount.toLocaleString()} <span className="text-sm font-normal text-gray-500">{transaction.currency}</span>
                        </div>

                        {/* Net Profit Display for Car Sales */}
                        {isCarTransaction && isIncome && (
                            <div className={`text-sm font-medium mt-1 ${netProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {t.finance.netProfit}: {netProfit.toLocaleString()} {transaction.currency}
                            </div>
                        )}

                        <p className="text-xs text-gray-400 mt-1 font-medium">
                            {format(new Date(transaction.transaction_date), 'dd MMMM yyyy')}
                        </p>
                    </div>

                    {/* Title & Parties (Right) */}
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-2 mb-1">
                            <h3 className="font-bold text-gray-900">{transaction.description.split('\n')[0]}</h3>
                            <div className={`p-1.5 rounded-full ${isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                            </div>
                        </div>

                        <div className="text-xs text-gray-500 flex flex-col gap-0.5">
                            {transaction.seller_name && (
                                <span>{t.finance.seller}: <span className="font-medium text-gray-700">{transaction.seller_name}</span></span>
                            )}
                            {transaction.buyer_name && (
                                <span>{t.finance.buyer}: <span className="font-medium text-gray-700">{transaction.buyer_name}</span></span>
                            )}
                        </div>

                        <div className="mt-2 flex flex-col items-end gap-1">
                            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${currentStatusColor}`}>
                                {currentStatusLabel}
                            </span>
                            {transaction.is_paid_in_korea && (
                                <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 flex items-center gap-1">
                                    <Globe className="w-3 h-3" />
                                    {t.finance.paidInKorea}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Sections */}
            <div className="p-5 space-y-6 flex-1">

                {/* Remaining Amount for Partial Payments */}
                {transaction.payment_status === 'Partial' && (
                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-yellow-800 font-medium">{t.finance.remainingAmount}:</span>
                            <span className="font-bold text-yellow-900">
                                {calculateRemaining().toLocaleString()} {transaction.currency}
                            </span>
                        </div>
                    </div>
                )}

                {/* Car Information */}
                {(transaction.car_model || transaction.car_year) && (
                    <div>
                        <div className="flex items-center gap-2 mb-3 text-purple-600">
                            <Car className="w-5 h-5" />
                            <h4 className="font-bold text-sm">{t.common.carDetails}</h4>
                        </div>
                        <div className="bg-purple-50/50 rounded-lg p-3 grid grid-cols-2 gap-4 text-sm">
                            {transaction.car_model && (
                                <div>
                                    <span className="text-gray-500 text-xs block">{t.inventory.model}</span>
                                    <span className="font-medium text-gray-900">{transaction.car_model}</span>
                                </div>
                            )}
                            {transaction.car_year && (
                                <div className="text-right">
                                    <span className="text-gray-500 text-xs block">{t.inventory.year}</span>
                                    <span className="font-medium text-gray-900">{transaction.car_year}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Commissions & Brokerage */}
                {(transaction.bureau_commission || transaction.seller_commission || transaction.buyer_commission) && (
                    <div>
                        <div className="flex items-center gap-2 mb-3 text-blue-600">
                            <FileText className="w-5 h-5" />
                            <h4 className="font-bold text-sm">{t.finance.commissions}</h4>
                        </div>
                        <div className="bg-blue-50/50 rounded-lg p-3 space-y-2 text-sm">
                            {transaction.bureau_commission ? (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">{t.finance.officeCommission}</span>
                                    <span className="font-bold text-blue-700">{transaction.bureau_commission.toLocaleString()} DZD</span>
                                </div>
                            ) : null}
                            {transaction.seller_commission ? (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">
                                        {t.finance.seller}
                                    </span>
                                    <span className="font-bold text-blue-700">{transaction.seller_commission.toLocaleString()} DZD</span>
                                </div>
                            ) : null}
                            {transaction.buyer_commission ? (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">
                                        {t.finance.buyer}
                                    </span>
                                    <span className="font-bold text-blue-700">{transaction.buyer_commission.toLocaleString()} DZD</span>
                                </div>
                            ) : null}
                            <div className="pt-2 border-t border-blue-100 flex justify-between items-center text-xs text-gray-500">
                                <span>{t.finance.totalCommissions}</span>
                                <span>
                                    {((transaction.bureau_commission || 0) + (transaction.seller_commission || 0) + (transaction.buyer_commission || 0)).toLocaleString()} DZD
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions Footer */}
            <div className="grid grid-cols-4 gap-0 border-t border-gray-100 divide-x divide-gray-100">
                <Link
                    to={`/finance/${transaction.id}`}
                    className="flex items-center justify-center gap-2 p-3 bg-gray-50 text-gray-600 hover:bg-gray-100 transition font-medium text-sm"
                    title={t.finance.viewDetails}
                >
                    <Eye className="w-4 h-4" />
                </Link>

                <Link
                    to={`/finance/${transaction.id}`}
                    className="flex items-center justify-center gap-2 p-3 bg-gray-50 text-gray-600 hover:bg-gray-100 transition font-medium text-sm"
                    title="Print Invoice"
                >
                    <Printer className="w-4 h-4" />
                </Link>

                <Link
                    to={`/finance/${transaction.id}/edit`}
                    className="flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition font-medium text-sm"
                    title={t.common.edit}
                >
                    <Edit className="w-4 h-4" />
                </Link>

                <button
                    onClick={() => onDelete(transaction.id)}
                    className="flex items-center justify-center gap-2 p-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition font-medium text-sm"
                    title={t.common.delete}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
