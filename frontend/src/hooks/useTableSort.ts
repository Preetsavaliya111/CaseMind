import { useState, useCallback } from 'react'
import type { SortConfig, SortDirection } from '@/types'

export function useTableSort(defaultField = '', defaultDirection: SortDirection = 'asc') {
  const [sort, setSort] = useState<SortConfig>({ field: defaultField, direction: defaultDirection })

  const toggleSort = useCallback((field: string) => {
    setSort((prev) =>
      prev.field === field
        ? { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { field, direction: 'asc' },
    )
  }, [])

  return { sort, toggleSort }
}
