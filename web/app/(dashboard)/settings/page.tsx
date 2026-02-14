'use client'

import { useLanguage } from '@/context/LanguageContext'
import { supabase } from '@/lib/supabase'
import { Save } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function SettingsPage() {
    const { t } = useLanguage()
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [rates, setRates] = useState({
        dzd_usdt: '',
        usdt_krw: ''
    })

    useEffect(() => {
        fetchSettings()
    }, [])

    async function fetchSettings() {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('settings')
                .select('*')
                .in('key', ['exchange_rate_dzd_usdt', 'exchange_rate_usdt_krw'])

            if (error) throw error

            const newRates = { ...rates }
            const settingsData = data as any[]
            settingsData?.forEach(setting => {
                if (setting.key === 'exchange_rate_dzd_usdt') newRates.dzd_usdt = setting.value
                if (setting.key === 'exchange_rate_usdt_krw') newRates.usdt_krw = setting.value
            })
            setRates(newRates)
        } catch (error) {
            console.error('Error fetching settings:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setMessage(null)

        try {
            const updates = [
                { key: 'exchange_rate_dzd_usdt', value: rates.dzd_usdt },
                { key: 'exchange_rate_usdt_krw', value: rates.usdt_krw }
            ]

            const { error } = await supabase
                .from('settings')
                .upsert(updates as any, { onConflict: 'key' })

            if (error) throw error

            setMessage({ type: 'success', text: t.settings.saved })
        } catch (error) {
            console.error('Error saving settings:', error)
            setMessage({ type: 'error', text: t.common.error })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">{t.settings.title}</h1>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                    {t.settings.exchangeRates}
                </h2>

                {message && (
                    <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                DZD / USDT
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={rates.dzd_usdt}
                                    onChange={(e) => setRates({ ...rates, dzd_usdt: e.target.value })}
                                    className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-950 dark:text-white"
                                    placeholder="e.g. 220"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                    DZD
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">1 USDT = {rates.dzd_usdt || '...'} DZD</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                USDT / KRW
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={rates.usdt_krw}
                                    onChange={(e) => setRates({ ...rates, usdt_krw: e.target.value })}
                                    className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-950 dark:text-white"
                                    placeholder="e.g. 1300"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                    KRW
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">1 USDT = {rates.usdt_krw || '...'} KRW</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                        <button
                            type="submit"
                            disabled={saving || loading}
                            className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? t.common.loading : t.settings.save}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
