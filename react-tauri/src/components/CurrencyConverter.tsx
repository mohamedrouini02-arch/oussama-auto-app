import { ArrowRightLeft, Calculator, Save } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function CurrencyConverter() {
    const [rates, setRates] = useState({
        usdtToDzd: 200,
        krwToUsdt: 0.00075
    })

    const [amount, setAmount] = useState<string>('')
    const [mode, setMode] = useState<'USDT_DZD' | 'DZD_USDT' | 'KRW_USDT' | 'KRW_DZD'>('USDT_DZD')

    useEffect(() => {
        const savedRates = localStorage.getItem('exchange_rates')
        if (savedRates) {
            setRates(JSON.parse(savedRates))
        }
    }, [])

    const handleSaveRates = () => {
        localStorage.setItem('exchange_rates', JSON.stringify(rates))
        alert('Rates saved successfully!')
    }

    const calculateResult = () => {
        const val = parseFloat(amount)
        if (isNaN(val)) return '---'

        switch (mode) {
            case 'USDT_DZD':
                return (val * rates.usdtToDzd).toLocaleString() + ' DZD'
            case 'DZD_USDT':
                return (val / rates.usdtToDzd).toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' USDT'
            case 'KRW_USDT':
                return (val * rates.krwToUsdt).toLocaleString() + ' USDT'
            case 'KRW_DZD':
                // KRW -> USDT -> DZD
                return (val * rates.krwToUsdt * rates.usdtToDzd).toLocaleString() + ' DZD'
            default:
                return '---'
        }
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
                <Calculator className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">Currency Converter</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">1 USDT = ? DZD</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={rates.usdtToDzd}
                            onChange={e => setRates({ ...rates, usdtToDzd: parseFloat(e.target.value) })}
                            className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                        />
                        <span className="absolute right-3 top-2 text-xs text-gray-400">DZD</span>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">1 KRW = ? USDT</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={rates.krwToUsdt}
                            onChange={e => setRates({ ...rates, krwToUsdt: parseFloat(e.target.value) })}
                            className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                        />
                        <span className="absolute right-3 top-2 text-xs text-gray-400">USDT</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-end mb-6">
                <button
                    onClick={handleSaveRates}
                    className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                >
                    <Save className="w-3 h-3" />
                    Save Rates
                </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    <button
                        onClick={() => setMode('USDT_DZD')}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${mode === 'USDT_DZD' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
                    >
                        USDT → DZD
                    </button>
                    <button
                        onClick={() => setMode('DZD_USDT')}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${mode === 'DZD_USDT' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
                    >
                        DZD → USDT
                    </button>
                    <button
                        onClick={() => setMode('KRW_USDT')}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${mode === 'KRW_USDT' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
                    >
                        KRW → USDT
                    </button>
                    <button
                        onClick={() => setMode('KRW_DZD')}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${mode === 'KRW_DZD' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
                    >
                        KRW → DZD
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <input
                            type="number"
                            placeholder="Amount"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-lg font-bold"
                        />
                    </div>
                    <ArrowRightLeft className="w-5 h-5 text-gray-400" />
                    <div className="flex-1 text-right">
                        <div className="text-lg font-bold text-blue-600">
                            {calculateResult()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
