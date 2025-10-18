import { useEffect, useMemo, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { DEFAULT_PROVIDER_TYPES, ProviderTypeOption } from '@/constants/providerTypes'

interface ProviderTypeLabelMap {
  [value: string]: ProviderTypeOption
}

export function useProviderTypes() {
  const [providerTypeOptions, setProviderTypeOptions] =
    useState<ProviderTypeOption[]>(DEFAULT_PROVIDER_TYPES)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const fetchProviderTypes = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'master_provider_types'))
        if (!isMounted) return

        const fromFirestore = snapshot.docs
          .map((doc) => {
            const data = doc.data()
            const name = (data?.name as string | undefined)?.trim()
            if (!name) {
              return null
            }
            return {
              value: doc.id,
              label: name,
            } as ProviderTypeOption
          })
          .filter(Boolean) as ProviderTypeOption[]

        const merged = [...fromFirestore]
        DEFAULT_PROVIDER_TYPES.forEach((defaultType) => {
          if (!merged.some((item) => item.value === defaultType.value)) {
            merged.push(defaultType)
          }
        })

        merged.sort((a, b) => a.label.localeCompare(b.label))
        setProviderTypeOptions(merged)
      } catch (error) {
        console.error('Error loading provider types:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchProviderTypes()

    return () => {
      isMounted = false
    }
  }, [])

  const providerTypeMap = useMemo(() => {
    return providerTypeOptions.reduce((acc, option) => {
      acc[option.value] = option
      return acc
    }, {} as ProviderTypeLabelMap)
  }, [providerTypeOptions])

  return {
    providerTypeOptions,
    providerTypeMap,
    loading,
  }
}
