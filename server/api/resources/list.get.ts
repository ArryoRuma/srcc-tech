import { readdir, stat } from 'fs/promises'

const sectionDirectories = [
  { key: 'sops', dir: 'resources/sops' },
  { key: 'runbooks', dir: 'resources/runbooks' },
  { key: 'references', dir: 'resources/references' },
  { key: 'vendor-docs', dir: 'resources/vendor-docs' },
  { key: 'diagrams', dir: 'resources/diagrams' },
  { key: 'handoff', dir: 'resources/handoff' },
  { key: 'archive', dir: 'resources/archive' }
] as const

type SectionKey = (typeof sectionDirectories)[number]['key']

interface ResourceFile {
  name: string
  relativePath: string
  extension: string
  modifiedAt: string
  sizeBytes: number
}

interface ResourceEntry {
  name: string
  isFile: () => boolean
}

const isSectionKey = (value: string): value is SectionKey => sectionDirectories.some(section => section.key === value)

const listSectionFiles = async (section: SectionKey) => {
  const relativeDir = sectionDirectories.find(item => item.key === section)?.dir

  if (!relativeDir) {
    return {
      section,
      dir: 'resources/',
      total: 0,
      files: [] as ResourceFile[]
    }
  }

  let entries: ResourceEntry[] = []

  try {
    entries = await readdir(relativeDir, { withFileTypes: true }) as ResourceEntry[]
  } catch {
    entries = []
  }

  const files = (await Promise.all(entries
    .filter(entry => entry.isFile() && entry.name !== '.gitkeep')
    .map(async (entry): Promise<ResourceFile> => {
      const fileRelativePath = `${relativeDir}/${entry.name}`
      const info = await stat(fileRelativePath)
      const extension = entry.name.includes('.') ? `.${entry.name.split('.').pop()}` : 'file'

      return {
        name: entry.name,
        relativePath: fileRelativePath,
        extension,
        modifiedAt: info.mtime.toISOString(),
        sizeBytes: info.size
      }
    })))
    .sort((first, second) => Date.parse(second.modifiedAt) - Date.parse(first.modifiedAt))

  return {
    section,
    dir: `${relativeDir}/`,
    total: files.length,
    files
  }
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const sectionParam = typeof query.section === 'string' ? query.section : undefined

  if (sectionParam) {
    if (!isSectionKey(sectionParam)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid resource section'
      })
    }

    return listSectionFiles(sectionParam)
  }

  const sectionKeys = sectionDirectories.map(section => section.key)
  const sections = await Promise.all(sectionKeys.map(section => listSectionFiles(section)))

  return {
    sections,
    totalFiles: sections.reduce((sum, section) => sum + section.total, 0)
  }
})
