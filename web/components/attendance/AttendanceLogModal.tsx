'use client'

import { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import { Calendar, Clock, X } from 'lucide-react'
import { useEffect, useState } from 'react'

type Employee = Database['public']['Tables']['employees']['Row']

interface AttendanceLogModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    employee: Employee | null
    initialDate?: Date
    editingLogId?: string | null
    initialData?: {
        clockIn: string
        clockOut: string | null
    }
}

export default function AttendanceLogModal({
    isOpen,
    onClose,
    onSuccess,
    employee,
    initialDate,
    editingLogId,
    initialData
}: AttendanceLogModalProps) {
    const [loading, setLoading] = useState(false)
    const [date, setDate] = useState(initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0])

    // Time inputs (HH:MM)
    const [clockInTime, setClockInTime] = useState('')
    const [clockOutTime, setClockOutTime] = useState('')

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Parse ISO strings to HH:MM
                const inDate = new Date(initialData.clockIn)
                setClockInTime(inDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }))

                if (initialData.clockOut) {
                    const outDate = new Date(initialData.clockOut)
                    setClockOutTime(outDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }))
                } else {
                    setClockOutTime('')
                }
            } else {
                setClockInTime('09:00')
                setClockOutTime('')
            }
        }
    }, [isOpen, initialData])

    if (!isOpen || !employee) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Construct ISO timestamps
            const baseDate = new Date(date)

            const [inHour, inMinute] = clockInTime.split(':').map(Number)
            const clockInDate = new Date(baseDate)
            clockInDate.setHours(inHour, inMinute, 0, 0)

            let clockOutDate = null
            if (clockOutTime) {
                const [outHour, outMinute] = clockOutTime.split(':').map(Number)
                clockOutDate = new Date(baseDate)
                clockOutDate.setHours(outHour, outMinute, 0, 0)
            }

            const payload = {
                employee_id: employee.id,
                clock_in: clockInDate.toISOString(),
                clock_out: clockOutDate ? clockOutDate.toISOString() : null,
                status: clockOutDate ? 'completed' : 'present'
            }

            if (editingLogId) {
                const { error } = await (supabase
                    .from('attendance_logs') as any)
                    .update(payload)
                    .eq('id', editingLogId)
                if (error) throw error
            } else {
                const { error } = await (supabase
                    .from('attendance_logs') as any)
                    .insert(payload)
                if (error) throw error
            }

            onSuccess()
            onClose()
        } catch (error) {
            console.error('Error saving log:', error)
            alert('Error saving log')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                        {editingLogId ? 'Edit Attendance' : 'Manual Entry'}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase">Employee</span>
                        <div className="font-medium text-gray-900 dark:text-white">{employee.full_name}</div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Clock In</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="time"
                                    required
                                    value={clockInTime}
                                    onChange={e => setClockInTime(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Clock Out</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="time"
                                    value={clockOutTime}
                                    onChange={e => setClockOutTime(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                            {loading ? 'Saving...' : 'Save Record'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
