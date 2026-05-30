import { describe, expect, it } from 'vitest'
import appSource from './App.tsx?raw'
import mainSource from './main.tsx?raw'
import storeSource from './store/useIdeaStore.ts?raw'
import typeSource from './workbenchTypes.ts?raw'

describe('app i18n integration source contract', () => {
  it('wraps the React app in I18nProvider and consumes useI18n in App', () => {
    expect(mainSource).toContain('<I18nProvider>')
    expect(mainSource).toContain('</I18nProvider>')
    expect(appSource).toContain('useI18n(')
  })

  it('renders a locale switcher instead of hardcoding a single language app shell', () => {
    expect(appSource).toContain('LocaleSwitcher')
    expect(appSource).toContain('setLocale')
    expect(appSource).not.toContain('<span>Settings</span>')
    expect(appSource).not.toContain('Pool lenses</div>')
    expect(appSource).not.toContain('New Seed')
    expect(appSource).not.toContain('Save Changes')
  })

  it('routes store status messages through i18n message keys instead of hardcoded UI strings', () => {
    expect(storeSource).toContain('createDefaultAnalysis')
    expect(storeSource).toContain('createInitialWorkbenchIdeas')
    expect(storeSource).toContain('type StatusMessageKey =')
    expect(appSource).toContain('t(statusMessage)')
    expect(storeSource).not.toMatch(/New seed created|Moved to Trash|AI analysis merged/)
  })

  it('keeps ordinary App labels and placeholders behind the catalog', () => {
    expect(appSource).not.toContain("locale === 'zh'")
    expect(appSource).not.toContain('locale === "zh"')
    expect(appSource).not.toContain('placeholder="// write some messy thoughts')
    expect(appSource).toContain("t('detail.scratchpad.placeholder')")
    expect(appSource).toContain('idea.status.${idea.status}')
    expect(appSource).toContain('idea.source.${idea.source}')
    expect(appSource).toContain("t('settings.session.mode.disabled')")
  })

  it('keeps local file/settings messages semantic so locale changes re-render them', () => {
    expect(appSource).toContain('const [messageKey, setMessageKey]')
    expect(appSource).toContain('messageKey && <div className="rail-note file-message">{t(messageKey)}</div>')
    expect(appSource).toContain('messageKey && <p className="settings-message">{t(messageKey)}</p>')
    expect(appSource).not.toContain("setMessage(t('detail.files")
    expect(appSource).not.toContain("setMessage(t('settings.")
  })

  it('does not export English status labels from core types', () => {
    expect(typeSource).not.toContain('Unsorted pool')
    expect(typeSource).not.toContain('Active work')
    expect(typeSource).not.toContain('Parked')
  })
})
