import { describe, expect, it } from 'vitest'
import appSource from './App.tsx?raw'

const getFunctionSource = (name: string) => {
  const start = appSource.indexOf(`function ${name}`)
  const nextFunction = appSource.indexOf('\nfunction ', start + 1)
  return appSource.slice(start, nextFunction === -1 ? undefined : nextFunction)
}

describe('polished interaction source contracts', () => {
  it('uses a custom headless locale dropdown instead of a native select', () => {
    const localeSwitcherSource = getFunctionSource('LocaleSwitcher')

    expect(appSource).toContain("@radix-ui/react-dropdown-menu")
    expect(localeSwitcherSource).toContain('function LocaleSwitcher')
    expect(localeSwitcherSource).not.toContain('<select')
    expect(localeSwitcherSource).not.toContain("createElement(\n                    'select'")
    expect(localeSwitcherSource).toContain('role="listbox"')
    expect(localeSwitcherSource).toContain('aria-expanded={localeMenuOpen}')
    expect(localeSwitcherSource).toContain('onKeyDown={handleLocaleMenuKeyDown}')
  })

  it('animates idea cards on lens changes with staggered blur lift', () => {
    expect(appSource).toContain('ideaPoolAnimationKey')
    expect(appSource).toContain('style={{ \'--stagger-index\'')
  })

  it('gives settings a distinct animated reveal rather than a hard view swap', () => {
    expect(appSource).toContain('settings-view-shell')
    expect(appSource).toContain('settings-orbit')
  })

  it('covers edge states for empty lenses and guarded file uploads', () => {
    expect(appSource).toContain('empty-state')
    expect(appSource).toContain("t('workbench.empty.title')")
    expect(appSource).toContain('filenameInputRef')
    expect(appSource).toContain('filenameInputRef.current?.value ?? filename')
    expect(appSource).toContain("setMessageKey('detail.files.filenameRequired')")
    expect(appSource).toMatch(/if \(!trimmedFilename\)/)
  })
})
