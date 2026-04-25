export const UPDATE_CATEGORIES = [
  'audio',
  'rf',
  'monitoring',
  'console',
  'acoustics',
  'infrastructure'
] as const

export const UPDATE_TAGS = [
  'amplification',
  'antenna',
  'aviom',
  'bodypacks',
  'compression',
  'documentation',
  'dsp',
  'eq',
  'foyer',
  'frequencies',
  'geq',
  'headphones',
  'iem',
  'loudness',
  'microphones',
  'mixing',
  'monitoring',
  'nursery',
  'piano',
  'power',
  'reverb',
  'rf',
  'room-tuning',
  'routing',
  'stereo',
  'wireless'
] as const

export type UpdateCategory = typeof UPDATE_CATEGORIES[number]
export type UpdateTag = typeof UPDATE_TAGS[number]

type AliasMap = Record<string, string>

const CATEGORY_ALIASES: AliasMap = {
  'av': 'audio',
  'a/v': 'audio',
  'audio': 'audio',
  'acoustics': 'acoustics',
  'monitoring': 'monitoring',
  'monitor': 'monitoring',
  'rf': 'rf',
  'console': 'console',
  'infrastructure': 'infrastructure'
}

const TAG_ALIASES: AliasMap = {
  'antennas': 'antenna',
  'antennae': 'antenna',
  'rf antenna': 'antenna',
  'rf antennas': 'antenna',
  'avioms': 'aviom',
  'iems': 'iem',
  'in-ear': 'iem',
  'in-ear monitor': 'iem',
  'in-ear monitors': 'iem',
  'in ear': 'iem',
  'in ear monitor': 'iem',
  'in ear monitors': 'iem',
  'frequencies': 'frequencies',
  'frequency': 'frequencies',
  'mics': 'microphones',
  'mic': 'microphones',
  'microphones': 'microphones',
  'headphone': 'headphones',
  'headphones': 'headphones',
  'compress': 'compression',
  'compressor': 'compression',
  'compressors': 'compression',
  'eq': 'eq',
  'geq': 'geq',
  'routing': 'routing',
  'route': 'routing',
  'reverb': 'reverb',
  'room': 'room-tuning',
  'tuning': 'room-tuning',
  'room tuning': 'room-tuning',
  'loudness': 'loudness',
  'spl': 'loudness',
  'power': 'power',
  'wireless': 'wireless',
  'bodypack': 'bodypacks',
  'bodypacks': 'bodypacks',
  'docs': 'documentation',
  'documentation': 'documentation',
  'foyer': 'foyer',
  'nursery': 'nursery',
  'piano': 'piano',
  'mixing': 'mixing',
  'monitoring': 'monitoring',
  'stereo': 'stereo',
  'dsp': 'dsp',
  'amplification': 'amplification',
  'rf': 'rf',
  'aviom': 'aviom'
}

const categorySet = new Set<string>(UPDATE_CATEGORIES)
const tagSet = new Set<string>(UPDATE_TAGS)

export function normalizeKey(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, ' ')
    .replace(/[^a-z0-9\-/ ]+/g, '')
}

export function categoryLabel(category?: string): string {
  if (!category) return ''

  const tokens = category.split('-')
  return tokens
    .map(token => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ')
}

export function tagLabel(tag?: string): string {
  if (!tag) return ''
  if (tag === 'iem') return 'IEM'
  if (tag === 'rf') return 'RF'
  if (tag === 'geq') return 'GEQ'
  if (tag === 'dsp') return 'DSP'

  const tokens = tag.split('-')
  return tokens
    .map(token => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ')
}

export function normalizeCategory(category?: string | null): { value?: UpdateCategory, unknown?: string } {
  if (!category) return {}

  const normalized = normalizeKey(category)
  const canonical = CATEGORY_ALIASES[normalized] ?? normalized

  if (!categorySet.has(canonical)) {
    return { unknown: category }
  }

  return { value: canonical as UpdateCategory }
}

export function normalizeTags(tags?: string[] | null): { values: UpdateTag[], unknown: string[] } {
  if (!tags || tags.length === 0) {
    return { values: [], unknown: [] }
  }

  const values = new Set<UpdateTag>()
  const unknown: string[] = []

  for (const rawTag of tags) {
    const normalized = normalizeKey(rawTag)
    if (!normalized) continue

    const canonical = TAG_ALIASES[normalized] ?? normalized
    if (!tagSet.has(canonical)) {
      unknown.push(rawTag)
      continue
    }

    values.add(canonical as UpdateTag)
  }

  return {
    values: Array.from(values),
    unknown
  }
}

export function normalizeSearchQuery(input: string): string {
  const normalized = normalizeKey(input)
  if (!normalized) return ''

  const words = normalized.split(' ').filter(Boolean)
  const mappedWords = words.map((word) => {
    const mappedTag = TAG_ALIASES[word]
    const mappedCategory = CATEGORY_ALIASES[word]
    return mappedTag ?? mappedCategory ?? word
  })

  return mappedWords.join(' ')
}
