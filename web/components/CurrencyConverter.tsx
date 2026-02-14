'use client'

import { useLanguage } from '@/context/LanguageContext'
import { supabase } from '@/lib/supabase'
import { ArrowRightLeft, Calculator, Plus, Save } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function CurrencyConverter() {
    const { t, dir } = useLanguage()
    const [rates, setRates] = useState({
        usdtToDzd: 200,
        usdtToKrw: 1400
    })

    const [amount, setAmount] = useState<string>('')
    const [extraAmount, setExtraAmount] = useState<string>('')
    const [extraCurrency, setExtraCurrency] = useState<'DZD' | 'KRW' | 'USDT'>('KRW')
    const [mode, setMode] = useState<'KRW_DZD' | 'USDT_DZD' | 'DZD_USDT' | 'KRW_USDT'>('KRW_DZD')

    useEffect(() => {
        const loadRates = async () => {
            try {
                const { data, error } = await supabase
                    .from('settings')
                    .select('*')
                    .in('key', ['exchange_rate_dzd_usdt', 'exchange_rate_usdt_krw'])

                if (!error && data && data.length > 0) {
                    const newRates = { ...rates }
                        ; (data as any[]).forEach(setting => {
                            if (setting.key === 'exchange_rate_dzd_usdt') newRates.usdtToDzd = parseFloat(setting.value) || 200
                            if (setting.key === 'exchange_rate_usdt_krw') newRates.usdtToKrw = parseFloat(setting.value) || 1400
                        })
                    setRates(newRates)
                } else {
                    const savedRates = localStorage.getItem('exchange_rates')
                    if (savedRates) {
                        const parsed = JSON.parse(savedRates)
                        setRates({
                            usdtToDzd: parsed.usdtToDzd || 200,
                            usdtToKrw: parsed.usdtToKrw || (parsed.krwToUsdt ? Math.round(1 / parsed.krwToUsdt) : 1400)
                        })
                    }
                }
            } catch {
                const savedRates = localStorage.getItem('exchange_rates')
                if (savedRates) {
                    const parsed = JSON.parse(savedRates)
                    setRates({
                        usdtToDzd: parsed.usdtToDzd || 200,
                        usdtToKrw: parsed.usdtToKrw || (parsed.krwToUsdt ? Math.round(1 / parsed.krwToUsdt) : 1400)
                    })
                }
            }
        }
        loadRates()
    }, [])

    const handleSaveRates = async () => {
        localStorage.setItem('exchange_rates', JSON.stringify(rates))
        try {
            const updates = [
                { key: 'exchange_rate_dzd_usdt', value: rates.usdtToDzd.toString() },
                { key: 'exchange_rate_usdt_krw', value: rates.usdtToKrw.toString() }
            ]
            await supabase.from('settings').upsert(updates as any, { onConflict: 'key' })
            alert(t.currencyConverter.ratesSaved)
        } catch (err) {
            console.error('Error saving rates to Supabase:', err)
            alert(t.currencyConverter.ratesSavedLocal)
        }
    }

    const convertExtraToDzd = () => {
        const val = parseFloat(extraAmount)
        if (isNaN(val) || val === 0) return 0
        switch (extraCurrency) {
            case 'DZD': return val
            case 'KRW': return (val / rates.usdtToKrw) * rates.usdtToDzd
            case 'USDT': return val * rates.usdtToDzd
            default: return 0
        }
    }

    const calculateResult = () => {
        const val = parseFloat(amount)
        if (isNaN(val)) return '---'
        let resultDzd = 0
        switch (mode) {
            case 'USDT_DZD':
                resultDzd = val * rates.usdtToDzd
                break
            case 'DZD_USDT': {
                const usdt = val / rates.usdtToDzd
                const extraDzd = convertExtraToDzd()
                const extraUsdt = extraDzd / rates.usdtToDzd
                return (usdt + extraUsdt).toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' USDT'
            }
            case 'KRW_USDT': {
                const usdt = val / rates.usdtToKrw
                const extraDzd = convertExtraToDzd()
                const extraUsdt = extraDzd / rates.usdtToDzd
                return (usdt + extraUsdt).toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' USDT'
            }
            case 'KRW_DZD':
                resultDzd = (val / rates.usdtToKrw) * rates.usdtToDzd
                break
            default: return '---'
        }
        resultDzd += convertExtraToDzd()
        return resultDzd.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' DZD'
    }

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                    <Calculator className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{t.currencyConverter.title}</h2>
            </div>

            {/* Rate Inputs - using flex row with labels, no absolute positioning */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t.currencyConverter.usdtToDzd}</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={rates.usdtToDzd}
                            onChange={e => setRates({ ...rates, usdtToDzd: parseFloat(e.target.value) || 0 })}
                            className="flex-1 min-w-0 p-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 shrink-0">DZD</span>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t.currencyConverter.usdtToKrw}</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={rates.usdtToKrw}
                            onChange={e => setRates({ ...rates, usdtToKrw: parseFloat(e.target.value) || 0 })}
                            className="flex-1 min-w-0 p-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 shrink-0">KRW</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-end mb-5">
                <button
                    onClick={handleSaveRates}
                    className="text-xs flex items-center gap-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all"
                >
                    <Save className="w-3.5 h-3.5" />
                    {t.currencyConverter.saveRates}
                </button>
            </div>

            {/* Converter Section */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-slate-800 dark:to-slate-800/50 p-5 rounded-xl border border-gray-100 dark:border-slate-700">
                {/* Mode Tabs */}
                <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
                    {(['KRW_DZD', 'USDT_DZD', 'DZD_USDT', 'KRW_USDT'] as const).map(m => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${mode === m
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                                : 'bg-white dark:bg-slate-700 text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500'
                                }`}
                        >
                            {m.replace('_', ' → ')}
                        </button>
                    ))}
                </div>

                {/* Amount & Result */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                            <input
                                type="number"
                                placeholder={t.currencyConverter.amount}
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-lg font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <ArrowRightLeft className="w-5 h-5 text-gray-300 dark:text-gray-600 shrink-0" />
                        <div className="flex-1 min-w-0 text-end">
                            <div className="text-lg font-bold text-blue-600 dark:text-blue-400 truncate">
                                {calculateResult()}
                            </div>
                        </div>
                    </div>

                    {/* Extra Amount */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-slate-700">
                        <Plus className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                        <input
                            type="number"
                            placeholder={t.currencyConverter.extraAmount}
                            value={extraAmount}
                            onChange={e => setExtraAmount(e.target.value)}
                            className="flex-1 min-w-0 p-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <select
                            value={extraCurrency}
                            onChange={e => setExtraCurrency(e.target.value as any)}
                            className="p-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white shrink-0"
                        >
                            <option value="KRW">KRW</option>
                            <option value="DZD">DZD</option>
                            <option value="USDT">USDT</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    )
}
