'use client'

import { useLanguage } from '@/context/LanguageContext'
import { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import { Edit2, Plus, Trash2, User } from 'lucide-react'
import { useState } from 'react'

type Employee = Database['public']['Tables']['employees']['Row']

interface EmployeeManagerProps {
    employees: Employee[]
    onUpdate: () => void
}

export default function EmployeeManager({ employees, onUpdate }: EmployeeManagerProps) {
    const { t } = useLanguage()
    const [loading, setLoading] = useState(false)
    const [isEditing, setIsEditing] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        full_name: '',
        role: 'Staff',
        hourly_rate: ''
    })

    const resetForm = () => {
        setFormData({ full_name: '', role: 'Staff', hourly_rate: '' })
        setIsEditing(null)
    }

    const startEdit = (employee: Employee) => {
        setFormData({
            full_name: employee.full_name,
            role: employee.role || 'Staff',
            hourly_rate: employee.hourly_rate?.toString() || ''
        })
        setIsEditing(employee.id)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const dataToSave = {
                full_name: formData.full_name,
                role: formData.role,
                hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null
            }

            if (isEditing) {
                const { error } = await (supabase
                    .from('employees') as any)
                    .update(dataToSave)
                    .eq('id', isEditing)
                if (error) throw error
            } else {
                const { error } = await (supabase
                    .from('employees') as any)
                    .insert(dataToSave)
                if (error) throw error
            }

            onUpdate()
            resetForm()
        } catch (error) {
            console.error('Error saving employee:', error)
            alert('Error saving employee')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This will delete all attendance history for this employee.')) return
        setLoading(true)
        try {
            const { error } = await (supabase
                .from('employees') as any)
                .delete()
                .eq('id', id)
            if (error) throw error
            onUpdate()
        } catch (error) {
            console.error('Error deleting employee:', error)
            alert('Error deleting employee')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    {isEditing ? 'Edit Employee' : 'Add New Employee'}
                </h3>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="w-full sm:w-1/3">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            value={formData.full_name}
                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            placeholder="e.g. John Doe"
                        />
                    </div>
                    <div className="w-full sm:w-1/4">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                        <select
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        >
                            <option value="Staff">Staff</option>
                            <option value="Driver">Driver</option>
                            <option value="Manager">Manager</option>
                            <option value="Mechanic">Mechanic</option>
                            <option value="Guard">Guard</option>
                        </select>
                    </div>
                    {/* Hourly rate hidden for now to simplify, can be enabled later
                    <div className="w-full sm:w-1/4">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Hr Rate (DZD)</label>
                        <input
                            type="number"
                            value={formData.hourly_rate}
                            onChange={e => setFormData({ ...formData, hourly_rate: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            placeholder="Optional"
                        />
                    </div>
                    */}
                    <div className="flex gap-2">
                        {isEditing && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isEditing ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {isEditing ? 'Update' : 'Add'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 font-medium">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">Joined</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                        {employees.map(emp => (
                            <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-500">
                                        <User className="w-4 h-4" />
                                    </div>
                                    {emp.full_name}
                                </td>
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-xs">
                                        {emp.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-500">
                                    {new Date(emp.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => startEdit(emp)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded dark:hover:bg-blue-900/20"
                                        title="Edit"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(emp.id)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded dark:hover:bg-red-900/20"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {employees.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                    No employees added yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
