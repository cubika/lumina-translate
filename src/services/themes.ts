export type ThemeId = 'lumina-dark' | 'lumina-light' | 'nord' | 'solarized-light'

export interface ThemeMeta {
  id: ThemeId
  name: string
  type: 'dark' | 'light'
  /** Key swatch colors (hex) for the preview cards */
  swatches: [string, string, string, string, string]
}

/** Color values as RGB triplets (e.g., "17 19 24") for Tailwind alpha support */
type ThemeColors = Record<string, string>

// ── Theme metadata for the settings UI ─────────────────────────────

export const themeMetas: ThemeMeta[] = [
  { id: 'lumina-dark',     name: 'Lumina Dark',     type: 'dark',  swatches: ['#111318', '#282a2e', '#aec6ff', '#f0b429', '#e2e2e8'] },
  { id: 'lumina-light',    name: 'Lumina Light',    type: 'light', swatches: ['#ffffff', '#f5f6fa', '#0054ba', '#b07d08', '#1a1d24'] },
  { id: 'nord',            name: 'Nord',            type: 'dark',  swatches: ['#2E3440', '#3B4252', '#88C0D0', '#A3BE8C', '#D8DEE9'] },
  { id: 'solarized-light', name: 'Solarized Light', type: 'light', swatches: ['#FDF6E3', '#EEE8D5', '#268BD2', '#2AA198', '#586E75'] },
]

// ── Helper: hex to "R G B" triplet ─────────────────────────────────

function h(hex: string): string {
  const c = hex.replace('#', '')
  return `${parseInt(c.slice(0,2),16)} ${parseInt(c.slice(2,4),16)} ${parseInt(c.slice(4,6),16)}`
}

// ── Theme definitions ──────────────────────────────────────────────

const luminaDark: ThemeColors = {
  'surface':                    h('#111318'),
  'surface-dim':                h('#111318'),
  'surface-bright':             h('#37393e'),
  'surface-container-lowest':   h('#0c0e12'),
  'surface-container-low':      h('#1a1c20'),
  'surface-container':          h('#1e2024'),
  'surface-container-high':     h('#282a2e'),
  'surface-container-highest':  h('#333539'),
  'surface-variant':            h('#333539'),
  'background':                 h('#111318'),
  'on-surface':                 h('#e2e2e8'),
  'on-surface-variant':         h('#bac9cc'),
  'on-background':              h('#e2e2e8'),
  'outline':                    h('#849396'),
  'outline-variant':            h('#3b494c'),
  'inverse-surface':            h('#e2e2e8'),
  'inverse-on-surface':         h('#2f3035'),
  'primary':                    h('#e7ecff'),
  'primary-fixed':              h('#d8e2ff'),
  'primary-fixed-dim':          h('#aec6ff'),
  'primary-container':          h('#bed0ff'),
  'on-primary':                 h('#002e6b'),
  'on-primary-fixed':           h('#001a43'),
  'on-primary-fixed-variant':   h('#004397'),
  'on-primary-container':       h('#0054ba'),
  'surface-tint':               h('#aec6ff'),
  'inverse-primary':            h('#0059c5'),
  'secondary':                  h('#fff3d6'),
  'secondary-fixed':            h('#ffe0a0'),
  'secondary-fixed-dim':        h('#f0b429'),
  'secondary-container':        h('#ffc942'),
  'on-secondary':               h('#3d2800'),
  'on-secondary-fixed':         h('#291a00'),
  'on-secondary-fixed-variant': h('#5c4000'),
  'on-secondary-container':     h('#7a5500'),
  'tertiary':                   h('#f2e9ff'),
  'tertiary-fixed':             h('#e9ddff'),
  'tertiary-fixed-dim':         h('#d1bcff'),
  'tertiary-container':         h('#d9c8ff'),
  'on-tertiary':                h('#3c0090'),
  'on-tertiary-fixed':          h('#23005b'),
  'on-tertiary-fixed-variant':  h('#5700c9'),
  'on-tertiary-container':      h('#6c00f7'),
  'error':                      h('#ffb4ab'),
  'error-container':            h('#93000a'),
  'on-error':                   h('#690005'),
  'on-error-container':         h('#ffdad6'),
}

const luminaLight: ThemeColors = {
  'surface':                    h('#ffffff'),
  'surface-dim':                h('#f0f1f5'),
  'surface-bright':             h('#ffffff'),
  'surface-container-lowest':   h('#ffffff'),
  'surface-container-low':      h('#f5f6fa'),
  'surface-container':          h('#eef0f5'),
  'surface-container-high':     h('#e8eaef'),
  'surface-container-highest':  h('#e0e2e8'),
  'surface-variant':            h('#e0e2e8'),
  'background':                 h('#ffffff'),
  'on-surface':                 h('#1a1d24'),
  'on-surface-variant':         h('#44495a'),
  'on-background':              h('#1a1d24'),
  'outline':                    h('#7a8090'),
  'outline-variant':            h('#d0d4dc'),
  'inverse-surface':            h('#2f3035'),
  'inverse-on-surface':         h('#f0f1f5'),
  'primary':                    h('#0054ba'),
  'primary-fixed':              h('#d8e2ff'),
  'primary-fixed-dim':          h('#0054ba'),
  'primary-container':          h('#d8e2ff'),
  'on-primary':                 h('#ffffff'),
  'on-primary-fixed':           h('#001a43'),
  'on-primary-fixed-variant':   h('#004397'),
  'on-primary-container':       h('#0054ba'),
  'surface-tint':               h('#0054ba'),
  'inverse-primary':            h('#aec6ff'),
  'secondary':                  h('#5c4000'),
  'secondary-fixed':            h('#ffe0a0'),
  'secondary-fixed-dim':        h('#b07d08'),
  'secondary-container':        h('#ffe0a0'),
  'on-secondary':               h('#ffffff'),
  'on-secondary-fixed':         h('#291a00'),
  'on-secondary-fixed-variant': h('#5c4000'),
  'on-secondary-container':     h('#7a5500'),
  'tertiary':                   h('#5700c9'),
  'tertiary-fixed':             h('#e9ddff'),
  'tertiary-fixed-dim':         h('#7030c0'),
  'tertiary-container':         h('#e9ddff'),
  'on-tertiary':                h('#ffffff'),
  'on-tertiary-fixed':          h('#23005b'),
  'on-tertiary-fixed-variant':  h('#5700c9'),
  'on-tertiary-container':      h('#6c00f7'),
  'error':                      h('#ba1a1a'),
  'error-container':            h('#ffdad6'),
  'on-error':                   h('#ffffff'),
  'on-error-container':         h('#410002'),
}

const nord: ThemeColors = {
  'surface':                    h('#2E3440'),
  'surface-dim':                h('#2E3440'),
  'surface-bright':             h('#4C566A'),
  'surface-container-lowest':   h('#242933'),
  'surface-container-low':      h('#353B49'),
  'surface-container':          h('#3B4252'),
  'surface-container-high':     h('#434C5E'),
  'surface-container-highest':  h('#4C566A'),
  'surface-variant':            h('#434C5E'),
  'background':                 h('#2E3440'),
  'on-surface':                 h('#D8DEE9'),
  'on-surface-variant':         h('#8892A2'),
  'on-background':              h('#D8DEE9'),
  'outline':                    h('#616E88'),
  'outline-variant':            h('#4C566A'),
  'inverse-surface':            h('#D8DEE9'),
  'inverse-on-surface':         h('#2E3440'),
  'primary':                    h('#88C0D0'),
  'primary-fixed':              h('#88C0D0'),
  'primary-fixed-dim':          h('#88C0D0'),
  'primary-container':          h('#5E81AC'),
  'on-primary':                 h('#2E3440'),
  'on-primary-fixed':           h('#2E3440'),
  'on-primary-fixed-variant':   h('#2E3440'),
  'on-primary-container':       h('#ECEFF4'),
  'surface-tint':               h('#88C0D0'),
  'inverse-primary':            h('#5E81AC'),
  'secondary':                  h('#A3BE8C'),
  'secondary-fixed':            h('#A3BE8C'),
  'secondary-fixed-dim':        h('#A3BE8C'),
  'secondary-container':        h('#A3BE8C'),
  'on-secondary':               h('#2E3440'),
  'on-secondary-fixed':         h('#2E3440'),
  'on-secondary-fixed-variant': h('#2E3440'),
  'on-secondary-container':     h('#2E3440'),
  'tertiary':                   h('#B48EAD'),
  'tertiary-fixed':             h('#B48EAD'),
  'tertiary-fixed-dim':         h('#B48EAD'),
  'tertiary-container':         h('#B48EAD'),
  'on-tertiary':                h('#2E3440'),
  'on-tertiary-fixed':          h('#2E3440'),
  'on-tertiary-fixed-variant':  h('#2E3440'),
  'on-tertiary-container':      h('#2E3440'),
  'error':                      h('#BF616A'),
  'error-container':            h('#3B2228'),
  'on-error':                   h('#2E3440'),
  'on-error-container':         h('#D8DEE9'),
}

const solarizedLight: ThemeColors = {
  'surface':                    h('#FDF6E3'),
  'surface-dim':                h('#F5EDDA'),
  'surface-bright':             h('#FDF6E3'),
  'surface-container-lowest':   h('#FDF6E3'),
  'surface-container-low':      h('#EEE8D5'),
  'surface-container':          h('#E6DFCC'),
  'surface-container-high':     h('#DDD6C3'),
  'surface-container-highest':  h('#D3CCBA'),
  'surface-variant':            h('#EEE8D5'),
  'background':                 h('#FDF6E3'),
  'on-surface':                 h('#475B62'),
  'on-surface-variant':         h('#657B83'),
  'on-background':              h('#586E75'),
  'outline':                    h('#93A1A1'),
  'outline-variant':            h('#C5BBA0'),
  'inverse-surface':            h('#002B36'),
  'inverse-on-surface':         h('#FDF6E3'),
  'primary':                    h('#268BD2'),
  'primary-fixed':              h('#268BD2'),
  'primary-fixed-dim':          h('#268BD2'),
  'primary-container':          h('#b8d4e8'),
  'on-primary':                 h('#FDF6E3'),
  'on-primary-fixed':           h('#FDF6E3'),
  'on-primary-fixed-variant':   h('#1a6aa5'),
  'on-primary-container':       h('#268BD2'),
  'surface-tint':               h('#268BD2'),
  'inverse-primary':            h('#268BD2'),
  'secondary':                  h('#2AA198'),
  'secondary-fixed':            h('#2AA198'),
  'secondary-fixed-dim':        h('#2AA198'),
  'secondary-container':        h('#B0E0DB'),
  'on-secondary':               h('#FDF6E3'),
  'on-secondary-fixed':         h('#FDF6E3'),
  'on-secondary-fixed-variant': h('#1a7a73'),
  'on-secondary-container':     h('#2AA198'),
  'tertiary':                   h('#6C71C4'),
  'tertiary-fixed':             h('#6C71C4'),
  'tertiary-fixed-dim':         h('#6C71C4'),
  'tertiary-container':         h('#C5C7E8'),
  'on-tertiary':                h('#FDF6E3'),
  'on-tertiary-fixed':          h('#FDF6E3'),
  'on-tertiary-fixed-variant':  h('#4a4e9c'),
  'on-tertiary-container':      h('#6C71C4'),
  'error':                      h('#DC322F'),
  'error-container':            h('#F8D0CE'),
  'on-error':                   h('#FDF6E3'),
  'on-error-container':         h('#DC322F'),
}

// ── Theme registry ─────────────────────────────────────────────────

const themes: Record<ThemeId, ThemeColors> = {
  'lumina-dark':     luminaDark,
  'lumina-light':    luminaLight,
  'nord':            nord,
  'solarized-light': solarizedLight,
}

// ── Apply theme to DOM ─────────────────────────────────────────────

export function applyTheme(id: ThemeId): void {
  const colors = themes[id]
  if (!colors) return
  const root = document.documentElement
  for (const [key, value] of Object.entries(colors)) {
    root.style.setProperty(`--color-${key}`, value)
  }
}
