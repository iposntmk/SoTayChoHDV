import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface ProvinceOption {
  value: string
  label: string
}

export function useProvinces() {
  const [provinces, setProvinces] = useState<ProvinceOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const fetchProvinces = async () => {
      try {
        const q = query(collection(db, 'master_provinces'), orderBy('name', 'asc'))
        const snapshot = await getDocs(q)
        if (!isMounted) return

        const provinceList = snapshot.docs
          .map((doc) => {
            const data = doc.data()
            const name = (data?.name as string | undefined)?.trim()
            if (!name) {
              return null
            }
            return {
              value: name,
              label: name,
            } as ProvinceOption
          })
          .filter(Boolean) as ProvinceOption[]

        setProvinces(provinceList)
      } catch (error) {
        console.error('Error loading provinces:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchProvinces()

    return () => {
      isMounted = false
    }
  }, [])

  return {
    provinces,
    loading,
  }
}
