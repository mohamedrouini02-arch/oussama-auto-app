'use client'

import { useLanguage } from '@/context/LanguageContext'
import { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import { clsx } from 'clsx'
import { Clock, Edit, MapPin, Plus } from 'lucide-react'
import { useState } from 'react'

type Employee = Database['public']['Tables']['employees']['Row']

interface AttendanceLog {
    id: string
    employee_id: string
    clock_in: string
    clock_out: string | null
    status: string
}

interface EmployeeAttendanceCardProps {
    employee: Employee
    todayLog?: AttendanceLog
    onStatusChange: () => void
    onAddLog: () => void
    onEditLog: (log: AttendanceLog) => void
}

export default function EmployeeAttendanceCard({
    employee,
    todayLog,
    onStatusChange,
    onAddLog,
    onEditLog
}: EmployeeAttendanceCardProps) {
    const [loading, setLoading] = useState(false)
    const { t } = useLanguage()

    const isClockedIn = !!todayLog && !todayLog.clock_out

    const handleClockIn = async () => {
        setLoading(true)
        try {
            const { error } = await (supabase
                .from('attendance_logs') as any)
                .insert({
                    employee_id: employee.id, // Using employee_id
                    clock_in: new Date().toISOString(),
                    status: 'present'
                })

            if (error) throw error
            onStatusChange()
        } catch (error) {
            console.error('Error clocking in:', error)
            alert('Error clocking in')
        } finally {
            setLoading(false)
        }
    }

    const handleClockOut = async () => {
        if (!todayLog) return

        setLoading(true)
        try {
            const { error } = await (supabase
                .from('attendance_logs') as any)
                .update({
                    clock_out: new Date().toISOString(),
                    status: 'completed'
                })
                .eq('id', todayLog.id)

            if (error) throw error
            onStatusChange()
        } catch (error) {
            console.error('Error clocking out:', error)
            alert('Error clocking out')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                        {employee.full_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            {employee.full_name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {employee.role}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <span
                        className={clsx(
                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
                            isClockedIn
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                        )}
                    >
                        <span className={clsx("w-1.5 h-1.5 rounded-full", isClockedIn ? "bg-green-500" : "bg-gray-500")} />
                        {isClockedIn ? 'Present' : 'Absent/Out'}
                    </span>

                    {/* Manual Actions Dropdown or Buttons */}
                    <div className="flex gap-1 mt-1">
                        <button
                            onClick={onAddLog}
                            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                            title="Add Manual Record"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {todayLog && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            In:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-200">
                            {new Date(todayLog.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    {todayLog.clock_out && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Out:
                            </span>
                            <span className="font-medium text-gray-900 dark:text-gray-200">
                                {new Date(todayLog.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    )}

                    <div className="pt-2 border-t border-gray-200 dark:border-slate-700 flex justify-end">
                        <button
                            onClick={() => onEditLog(todayLog)}
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                            <Edit className="w-3 h-3" /> Edit Times
                        </button>
                    </div>
                </div>
            )}

            <button
                onClick={isClockedIn ? handleClockOut : handleClockIn}
                disabled={loading}
                className={clsx(
                    "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isClockedIn
                        ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800/50"
                        : "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 shadow-sm"
                )}
            >
                {loading ? (
                    'Processing...'
                ) : isClockedIn ? (
                    <>
                        <LogOutIcon className="w-4 h-4" />
                        Clock Out Now
                    </>
                ) : (
                    <>
                        <MapPin className="w-4 h-4" />
                        Clock In Now
                    </>
                )}
            </button>
        </div>
    )
}

function LogOutIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    )
}
