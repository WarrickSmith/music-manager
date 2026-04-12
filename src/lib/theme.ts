export const THEME_COOKIE_NAME = 'mm-theme'
export const DEFAULT_THEME = 'dark'
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export type Theme = 'light' | 'dark'

export function isTheme(value: string | undefined | null): value is Theme {
  return value === 'light' || value === 'dark'
}

export function resolveThemePreference(
  value: string | undefined | null
): Theme {
  return isTheme(value) ? value : DEFAULT_THEME
}
