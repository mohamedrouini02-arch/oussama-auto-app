import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export function useUserRole() {
    const { session } = useAuth()
    const [role, setRole] = useState<'admin' | 'employee' | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!session?.user) {
            setRole(null)
            setLoading(false)
            return
        }

        async function fetchRole() {
            try {
                if (!session?.user?.id) return

                const { data, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single()

                if (error) throw error
                setRole(((data as any)?.role as 'admin' | 'employee') || null)
            } catch (error) {
                console.error('Error fetching role:', error)
                setRole(null)
            } finally {
                setLoading(false)
            }
        }

        fetchRole()
    }, [session])

    return { role, loading }
}
