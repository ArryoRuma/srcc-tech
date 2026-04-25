import { readdir, readFile, stat } from 'fs/promises'
import { join, resolve } from 'path'
import type { Dirent } from 'fs'

const sectionDirectories = [
  { key: 'sops', dir: 'resources/sops' },
  { key: 'runbooks', dir: 'resources/runbooks' },
  { key: 'references', dir: 'resources/references' },
  { key: 'vendor-docs', dir: 'resources/vendor-docs' },
  { key: 'diagrams', dir: 'resources/diagrams' },
  { key: 'handoff', dir: 'resources/handoff' },
  { key: 'archive', dir: 'resources/archive' }
] as const

const textExtensions = new Set(['.md', '.mdx', '.markdown', '.txt', '.csv'])

const EXCERPT_LENGTH = 200

function buildExcerpt(content: string, query: string): string {
  const lower = content.toLowerCase()
  const idx = lower.indexOf(query.toLowerCase())
  if (idx === -1) return content.slice(0, EXCERPT_LENGTH)
  const start = Math.max(0, idx - 60)
  const end = Math.min(content.length, idx + query.length + 140)
  return (start > 0 ? '…' : '') + content.slice(start, end) + (end < content.length ? '…' : '')
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = typeof query.q === 'string' ? query.q.trim() : ''

  if (!q || q.length < 2) {
    throw createError({ statusCode: 400, statusMessage: 'Query must be at least 2 characters' })
  }

  const results: Array<{
    section: string
    name: string
    relativePath: string
    extension: string
    matchType: 'filename' | 'content'
    excerpt: string
  }> = []

  for (const { key, dir } of sectionDirectories) {
    let entries: Dirent[] = []
    try {
      entries = await readdir(dir, { withFileTypes: true })
      entries = entries.filter(e => e.isFile() && e.name !== '.gitkeep')
    } catch {
      continue
    }

    for (const entry of entries) {
      const name = entry.name
      const extMatch = name.match(/(\.[^.]+)$/)
      const extension = extMatch?.[1]?.toLowerCase() ?? ''
      const relativePath = `${dir}/${name}`

      // Always search by filename
      if (name.toLowerCase().includes(q.toLowerCase())) {
        results.push({ section: key, name, relativePath, extension, matchType: 'filename', excerpt: name })
        continue
      }

      // For text files, also search content
      if (textExtensions.has(extension)) {
        const resolvedBase = resolve(dir)
        const resolvedFile = resolve(join(dir, name))
        if (!resolvedFile.startsWith(resolvedBase + '/')) continue

        try {
          const info = await stat(resolvedFile)
          // Skip very large text files (> 1 MB) in search
          if (info.size > 1024 * 1024) continue

          const content = await readFile(resolvedFile, 'utf-8')
          if (content.toLowerCase().includes(q.toLowerCase())) {
            results.push({
              section: key,
              name,
              relativePath,
              extension,
              matchType: 'content',
              excerpt: buildExcerpt(content, q)
            })
          }
        } catch {
          // Skip unreadable files
        }
      }
    }
  }

  return { q, total: results.length, results }
})
