import { createContext, useContext, useEffect, type ReactNode } from 'react'

interface ThemeContextValue {
  resolvedTheme: 'light'
}

const ThemeContext = createContext<ThemeContextValue>({ resolvedTheme: 'light' })

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark')
    root.classList.add('light')
    localStorage.setItem('theme', 'light')
  }, [])

  return (
    <ThemeContext.Provider value={{ resolvedTheme: 'light' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
