'use client'

import AttendanceLogModal from '@/components/attendance/AttendanceLogModal'
import EmployeeAttendanceCard from '@/components/attendance/EmployeeAttendanceCard'
import EmployeeManager from '@/components/attendance/EmployeeManager'
import { useLanguage } from '@/context/LanguageContext'
import { useUserRole } from '@/hooks/useUserRole'
import { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import { clsx } from 'clsx'
import { endOfMonth, format, startOfMonth } from 'date-fns'
import { Calendar, List, RefreshCw, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type Employee = Database['public']['Tables']['employees']['Row']

interface AttendanceLog {
    id: string
    employee_id: string
    clock_in: string
    clock_out: string | null
    status: string
}

export default function AttendancePage() {
    const { role, loading: roleLoading } = useUserRole()
    const router = useRouter()
    const { t } = useLanguage()

    // Tab State
    const [activeTab, setActiveTab] = useState<'attendance' | 'employees' | 'reports'>('attendance')

    // Data State
    const [employees, setEmployees] = useState<Employee[]>([])
    const [logs, setLogs] = useState<AttendanceLog[]>([])
    const [loadingData, setLoadingData] = useState(true)

    // Filter/Selection State
    const [selectedDate, setSelectedDate] = useState(new Date()) // For Attendance Grid
    const [selectedMonth, setSelectedMonth] = useState(new Date()) // For Reports

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalEmployee, setModalEmployee] = useState<Employee | null>(null)
    const [modalInitialData, setModalInitialData] = useState<any>(null)
    const [editingLogId, setEditingLogId] = useState<string | null>(null)

    useEffect(() => {
        if (!roleLoading) {
            if (role !== 'admin') {
                router.push('/')
            } else {
                fetchEmployees()
            }
        }
    }, [role, roleLoading, router])

    useEffect(() => {
        if (activeTab === 'attendance') {
            fetchLogsForDate(selectedDate)
        } else if (activeTab === 'reports') {
            fetchMonthlyData(selectedMonth)
        }
    }, [activeTab, selectedDate, selectedMonth])

    const fetchEmployees = async () => {
        setLoadingData(true)
        try {
            const { data } = await supabase
                .from('employees')
                .select('*')
                .order('full_name')
            if (data) setEmployees(data)
        } catch (error) {
            console.error('Error fetching employees:', error)
        } finally {
            setLoadingData(false)
        }
    }

    const fetchLogsForDate = async (date: Date) => {
        setLoadingData(true)
        try {
            const startOfDay = new Date(date)
            startOfDay.setHours(0, 0, 0, 0)
            const endOfDay = new Date(date)
            endOfDay.setHours(23, 59, 59, 999)

            const { data } = await supabase
                .from('attendance_logs' as any)
                .select('*')
                .gte('clock_in', startOfDay.toISOString())
                .lte('clock_in', endOfDay.toISOString())

            if (data) setLogs(data)
        } catch (error) {
            console.error('Error fetching logs:', error)
        } finally {
            setLoadingData(false)
        }
    }

    const fetchMonthlyData = async (month: Date) => {
        setLoadingData(true)
        try {
            const start = startOfMonth(month).toISOString()
            const end = endOfMonth(month).toISOString()

            const { data } = await supabase
                .from('attendance_logs' as any)
                .select('*')
                .gte('clock_in', start)
                .lte('clock_in', end)

            if (data) setLogs(data)
        } catch (error) {
            console.error('Error fetching monthly data:', error)
        } finally {
            setLoadingData(false)
        }
    }

    const handleAddLogClick = (employee: Employee) => {
        setModalEmployee(employee)
        setEditingLogId(null)
        setModalInitialData(null)
        setIsModalOpen(true)
    }

    const handleEditLogClick = (employee: Employee, log: AttendanceLog) => {
        setModalEmployee(employee)
        setEditingLogId(log.id)
        setModalInitialData({
            clockIn: log.clock_in,
            clockOut: log.clock_out
        })
        setIsModalOpen(true)
    }

    const handleModalSuccess = () => {
        fetchLogsForDate(selectedDate) // Refresh current view
    }

    if (roleLoading || (role !== 'admin' && !roleLoading)) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t.common.attendance}
                </h1>

                <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-lg overflow-x-auto">
                    <TabButton
                        active={activeTab === 'attendance'}
                        onClick={() => setActiveTab('attendance')}
                        icon={<Users className="w-4 h-4" />}
                        label="Attendance"
                    />
                    <TabButton
                        active={activeTab === 'employees'}
                        onClick={() => setActiveTab('employees')}
                        icon={<List className="w-4 h-4" />}
                        label="Employees"
                    />
                    <TabButton
                        active={activeTab === 'reports'}
                        onClick={() => setActiveTab('reports')}
                        icon={<Calendar className="w-4 h-4" />}
                        label="Reports"
                    />
                </div>
            </div>

            {/* Attendance View */}
            {activeTab === 'attendance' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Date:</label>
                        <input
                            type="date"
                            value={selectedDate.toISOString().split('T')[0]}
                            onChange={(e) => setSelectedDate(new Date(e.target.value))}
                            className="px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                        <button
                            onClick={() => fetchLogsForDate(selectedDate)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full dark:hover:bg-slate-700"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {employees.map(employee => (
                            <EmployeeAttendanceCard
                                key={employee.id}
                                employee={employee}
                                todayLog={logs.find(log => log.employee_id === employee.id)}
                                onStatusChange={() => fetchLogsForDate(selectedDate)}
                                onAddLog={() => handleAddLogClick(employee)}
                                onEditLog={(log) => handleEditLogClick(employee, log)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Employees Management View */}
            {activeTab === 'employees' && (
                <EmployeeManager
                    employees={employees}
                    onUpdate={fetchEmployees}
                />
            )}

            {/* Reports View */}
            {activeTab === 'reports' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            Report: {format(selectedMonth, 'MMMM yyyy')}
                        </h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() - 1)))}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded text-gray-500"
                            >
                                ←
                            </button>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-200">{format(selectedMonth, 'MM/yyyy')}</span>
                            <button
                                onClick={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() + 1)))}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded text-gray-500"
                            >
                                →
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 font-medium">
                                <tr>
                                    <th className="px-4 py-3">Employee</th>
                                    <th className="px-4 py-3">Days Worked</th>
                                    <th className="px-4 py-3">First Shift</th>
                                    <th className="px-4 py-3">Last Shift</th>
                                    <th className="px-4 py-3">Total Logs</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                {employees.map(emp => {
                                    const employeeLogs = logs.filter(l => l.employee_id === emp.id)
                                    if (employeeLogs.length === 0) return null

                                    const uniqueDays = new Set(employeeLogs.map(l => l.clock_in.split('T')[0])).size
                                    const sortedLogs = [...employeeLogs].sort((a, b) => new Date(a.clock_in).getTime() - new Date(b.clock_in).getTime())
                                    const firstLog = sortedLogs[0]
                                    const lastLog = sortedLogs[sortedLogs.length - 1]

                                    return (
                                        <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                {emp.full_name}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                {uniqueDays} Days
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">
                                                {firstLog ? format(new Date(firstLog.clock_in), 'dd MMM HH:mm') : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">
                                                {lastLog ? format(new Date(lastLog.clock_in), 'dd MMM HH:mm') : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                {employeeLogs.length}
                                            </td>
                                        </tr>
                                    )
                                })}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                            No attendance data found for this month.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <AttendanceLogModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleModalSuccess}
                employee={modalEmployee}
                initialDate={selectedDate}
                editingLogId={editingLogId}
                initialData={modalInitialData}
            />
        </div>
    )
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                "px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap",
                active
                    ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            )}
        >
            <div className="flex items-center gap-2">
                {icon}
                {label}
            </div>
        </button>
    )
}
