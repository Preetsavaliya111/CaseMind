import { useEffect, useCallback } from 'react'

type KeyCombo = string // e.g. 'ctrl+k', 'escape', 'enter'

function matchesCombo(e: KeyboardEvent, combo: KeyCombo): boolean {
  const parts = combo.toLowerCase().split('+')
  const key = parts[parts.length - 1]
  const ctrl = parts.includes('ctrl') || parts.includes('meta')
  const shift = parts.includes('shift')
  const alt = parts.includes('alt')

  return (
    e.key.toLowerCase() === key &&
    e.ctrlKey === ctrl &&
    e.metaKey === ctrl &&
    e.shiftKey === shift &&
    e.altKey === alt
  )
}

export function useKeyboardShortcut(combo: KeyCombo, handler: () => void, enabled = true) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return
      if (matchesCombo(e, combo)) {
        e.preventDefault()
        handler()
      }
    },
    [combo, handler, enabled],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
