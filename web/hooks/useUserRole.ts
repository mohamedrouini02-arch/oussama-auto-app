import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export type UserRole = 'admin' | 'manager' | 'staff' | null

export function useUserRole() {
    const [role, setRole] = useState<UserRole>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchRole() {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session?.user) {
                    setRole(null)
                    return
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single()

                setRole(((profile as any)?.role as UserRole) || null)
            } catch (error) {
                console.error('Error fetching user role:', error)
                setRole(null)
            } finally {
                setLoading(false)
            }
        }

        fetchRole()
    }, [])

    return { role, loading }
}
