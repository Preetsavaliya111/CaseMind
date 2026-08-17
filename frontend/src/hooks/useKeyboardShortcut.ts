import { useEffect, useCallback } from 'react'

type KeyCombo = string // e.g. 'ctrl+k', 'meta+k', 'mod+k', 'escape', 'enter', '/'

function matchesCombo(e: KeyboardEvent, combo: KeyCombo): boolean {
  const parts = combo.toLowerCase().split('+')
  const key = parts[parts.length - 1]
  const wantsMod = parts.includes('ctrl') || parts.includes('meta') || parts.includes('cmd') || parts.includes('mod')
  const wantsShift = parts.includes('shift')
  const wantsAlt = parts.includes('alt')

  const hasMod = e.ctrlKey || e.metaKey
  const hasShift = e.shiftKey
  const hasAlt = e.altKey

  if (wantsMod !== hasMod) return false
  if (wantsShift !== hasShift) return false
  if (wantsAlt !== hasAlt) return false

  return e.key.toLowerCase() === key.toLowerCase()
}

export function useKeyboardShortcut(combo: KeyCombo, handler: () => void, enabled = true) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return
      // If pressing a single character shortcut like '/' without modifier, ignore when typing in inputs/textareas
      if (combo === '/' && (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement)?.isContentEditable)) {
        return
      }
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

