/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        // Standard semantic tokens (driven by CSS vars)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          border: 'hsl(var(--sidebar-border))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
        },

        // Semantic Backgrounds (Design Spec)
        'bg-page': 'var(--bg-page, #F8F9FB)',
        'bg-primary': 'var(--bg-primary, #FFFFFF)',
        'bg-secondary': 'var(--bg-secondary, #F3F4F6)',
        'bg-elevated': 'var(--bg-elevated, #FFFFFF)',

        // Semantic Borders
        'border-subtle': 'var(--border-subtle, rgba(15, 23, 42, 0.06))',
        'border-default': 'var(--border-default, rgba(15, 23, 42, 0.10))',
        'border-strong': 'var(--border-strong, rgba(15, 23, 42, 0.16))',

        // Semantic Text
        'text-primary': 'var(--text-primary, #0F172A)',
        'text-secondary': 'var(--text-secondary, #475569)',
        'text-muted': 'var(--text-muted, #64748B)',
        'text-disabled': 'var(--text-disabled, #94A3B8)',

        // CaseMind Accents
        'accent-primary': 'var(--accent-primary, #D97706)',
        'accent-primary-hover': 'var(--accent-primary-hover, #B45309)',
        'accent-secondary': 'var(--accent-secondary, #059669)',
        'accent-secondary-hover': 'var(--accent-secondary-hover, #047857)',
        'accent-tertiary': 'var(--accent-tertiary, #7C3AED)',

        // Semantic Status Colors
        'success-bg': 'var(--success-bg, #F0FDF4)',
        'success-text': 'var(--success-text, #166534)',
        'success-border': 'var(--success-border, #BBF7D0)',

        'warning-bg': 'var(--warning-bg, #FFFBEB)',
        'warning-text': 'var(--warning-text, #92400E)',
        'warning-border': 'var(--warning-border, #FDE68A)',

        'error-bg': 'var(--error-bg, #FEF2F2)',
        'error-text': 'var(--error-text, #991B1B)',
        'error-border': 'var(--error-border, #FECACA)',

        'info-bg': 'var(--info-bg, #EFF6FF)',
        'info-text': 'var(--info-text, #1E40AF)',
        'info-border': 'var(--info-border, #BFDBFE)',

        // Interaction States
        'hover': 'var(--hover, rgba(15, 23, 42, 0.04))',
        'active': 'var(--active, rgba(15, 23, 42, 0.08))',
        'selected': 'var(--selected, rgba(217, 119, 6, 0.08))',
        'focus-ring': 'var(--focus-ring, rgba(217, 119, 6, 0.40))',

        // Semantic tokens for HSL compatibility
        success: {
          DEFAULT: 'hsl(var(--color-success))',
          foreground: 'hsl(0 0% 100%)',
        },
        warning: {
          DEFAULT: 'hsl(var(--color-warning))',
          foreground: 'hsl(0 0% 100%)',
        },
        danger: {
          DEFAULT: 'hsl(var(--color-danger))',
          foreground: 'hsl(0 0% 100%)',
        },
        info: {
          DEFAULT: 'hsl(var(--color-info))',
          foreground: 'hsl(0 0% 100%)',
        },
        ai: {
          DEFAULT: 'hsl(var(--color-ai))',
          foreground: 'hsl(0 0% 100%)',
        },
      },

      // Shadow System (Subtle, Layered Elevation)
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'default': '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.08)',
        'strong': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.08)',
        'focus': '0 0 0 3px rgba(217, 119, 6, 0.40)',
        'glow': '0 0 20px rgba(217, 119, 6, 0.15)',
      },

      borderRadius: {
        'none': '0',
        'sm': 'calc(var(--radius) - 4px)',
        'md': 'calc(var(--radius) - 2px)',
        'lg': 'var(--radius)',
        'xl': '12px',
        '2xl': '16px',
        'full': '9999px',
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },

      letterSpacing: {
        display: '-0.02em',
      },

      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
}
