/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-main': 'var(--bg-main)',
        'card-bg': 'var(--card-bg)',
        'accent-primary': 'var(--accent-primary)',
        'accent-secondary': 'var(--accent-secondary)',
        'primary-foreground': 'var(--primary-foreground)',
        'text-main': 'var(--text-main)',
        'text-muted': 'var(--text-muted)',
        'border-subtle': 'var(--border-subtle)',
      },
      backgroundColor: {
        main: 'var(--bg-main)',
        card: 'var(--card-bg)',
      },
      textColor: {
        main: 'var(--text-main)',
        muted: 'var(--text-muted)',
        'primary-foreground': 'var(--primary-foreground)',
      },
      borderColor: {
        subtle: 'var(--border-subtle)',
      },
    },
  },
  plugins: [],
};
