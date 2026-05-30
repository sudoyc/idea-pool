export type DetailShortcutAction = 'closeDetail' | 'saveDetail' | 'newSeed'

type ShortcutInput = {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  detailOpen: boolean
  isTextInput: boolean
  isComposing?: boolean
}

export const resolveDetailShortcut = ({ key, ctrlKey = false, metaKey = false, detailOpen, isTextInput, isComposing = false }: ShortcutInput): DetailShortcutAction | null => {
  if (isComposing) return null

  if (key === 'Escape' && detailOpen) return 'closeDetail'

  const lowerKey = key.toLowerCase()
  if ((ctrlKey || metaKey) && lowerKey === 's' && detailOpen) return 'saveDetail'
  if (!ctrlKey && !metaKey && lowerKey === 'n' && !isTextInput) return 'newSeed'

  return null
}
