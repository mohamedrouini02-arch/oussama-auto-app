import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export type UserRole = 'admin' | 'staff' | null

export function usePermissions() {
    const [role, setRole] = useState<UserRole>(null)
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)

    useEffect(() => {
        async function fetchRole() {
            try {
                const { data: { session } } = await supabase.auth.getSession()

                if (!session?.user) {
                    setRole(null)
                    setUserId(null)
                    return
                }

                setUserId(session.user.id)

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single()

                if (profile) {
                    setRole(((profile as any).role as UserRole) || null)
                }
            } catch (error) {
                console.error('Error fetching role:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchRole()
    }, [])

    const canEdit = (item: { added_by?: string | null }) => {
        if (loading) return false
        if (role === 'admin') return true
        if (role === 'staff') {
            // If item has no added_by, assume older item -> maybe restrict? 
            // Or allow if system is new. Let's strict: only own items.
            return item.added_by === userId
        }
        return false
    }

    const canDelete = (item: { added_by?: string | null }) => {
        return canEdit(item) // Same rule for now
    }

    const isAdmin = role === 'admin'
    const isStaff = role === 'staff'

    return {
        role,
        loading,
        userId,
        canEdit,
        canDelete,
        isAdmin,
        isStaff
    }
}
