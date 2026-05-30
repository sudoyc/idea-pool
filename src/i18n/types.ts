export const supportedLocales = ['zh', 'en'] as const

export type Locale = (typeof supportedLocales)[number]

export const defaultLocale: Locale = 'zh'

export const isLocale = (value: string): value is Locale => supportedLocales.includes(value as Locale)
