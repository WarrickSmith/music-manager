/**
 * Each kind of grade gets a soft colour so a long list of music files can be
 * scanned by colour before reading. Colours are theme tokens (see --tone-*
 * in globals.css) and look right in both light and dark mode.
 */
export type GradeTone = 'sky' | 'mint' | 'gold' | 'lilac' | 'peach' | 'rose'

const TONES: GradeTone[] = ['sky', 'mint', 'gold', 'lilac', 'peach', 'rose']

const KNOWN: Record<string, GradeTone> = {
  singles: 'sky',
  'adult singles': 'mint',
  'masters singles': 'mint',
  'ice dance': 'lilac',
  'adult ice dance': 'lilac',
  pairs: 'peach',
  'adult pairs': 'peach',
  'synchronized skating': 'rose',
  'individual showcase': 'gold',
  'duet showcase': 'gold',
  'group showcase': 'gold',
  'theatre on ice': 'gold',
}

export function gradeTone(gradeType: string): GradeTone {
  const key = gradeType.trim().toLowerCase()
  if (KNOWN[key]) return KNOWN[key]
  // Unknown grade types get a stable colour from their name
  let hash = 0
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return TONES[hash % TONES.length]
}

/** Tailwind classes for a grade chip (fill from the tone, dark ink on top) */
export const TONE_CLASS: Record<GradeTone, string> = {
  sky: 'bg-tone-sky text-tone-ink',
  mint: 'bg-tone-mint text-tone-ink',
  gold: 'bg-tone-gold text-tone-ink',
  lilac: 'bg-tone-lilac text-tone-ink',
  peach: 'bg-tone-peach text-tone-ink',
  rose: 'bg-tone-rose text-tone-ink',
}

export function gradeChipClass(gradeType: string): string {
  return TONE_CLASS[gradeTone(gradeType)]
}
