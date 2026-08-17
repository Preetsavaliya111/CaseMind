import { createContext, useContext, useEffect, type ReactNode } from 'react'

interface ThemeContextValue {
  resolvedTheme: 'dark'
}

const ThemeContext = createContext<ThemeContextValue>({ resolvedTheme: 'dark' })

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light')
    root.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  }, [])

  return (
    <ThemeContext.Provider value={{ resolvedTheme: 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
