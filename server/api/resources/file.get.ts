import { readFile, stat } from 'fs/promises'
import { join, resolve } from 'path'

const sectionDirs: Record<string, string> = {
  'sops': 'resources/sops',
  'runbooks': 'resources/runbooks',
  'references': 'resources/references',
  'vendor-docs': 'resources/vendor-docs',
  'diagrams': 'resources/diagrams',
  'handoff': 'resources/handoff',
  'archive': 'resources/archive'
}

const textExtensions = new Set(['.md', '.mdx', '.markdown', '.txt'])

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const sectionParam = typeof query.section === 'string' ? query.section : null
  const nameParam = typeof query.name === 'string' ? query.name : null

  if (!sectionParam || !nameParam) {
    throw createError({ statusCode: 400, statusMessage: 'Missing section or name parameter' })
  }

  const dir = sectionDirs[sectionParam]
  if (!dir) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid resource section' })
  }

  // Prevent path traversal
  if (nameParam.includes('..') || nameParam.includes('/') || nameParam.includes('\\')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid filename' })
  }

  const filePath = join(dir, nameParam)

  // Double-check resolved path stays within the expected directory
  const resolvedBase = resolve(dir)
  const resolvedFile = resolve(filePath)
  if (!resolvedFile.startsWith(resolvedBase + '/')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid filename' })
  }

  let fileInfo
  try {
    fileInfo = await stat(filePath)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }

  if (!fileInfo.isFile()) {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }

  const rawExt = nameParam.includes('.') ? `.${nameParam.split('.').pop()!.toLowerCase()}` : ''
  const isText = textExtensions.has(rawExt)

  const metadata = {
    name: nameParam,
    section: sectionParam,
    relativePath: filePath,
    extension: rawExt || 'file',
    modifiedAt: fileInfo.mtime.toISOString(),
    sizeBytes: fileInfo.size
  }

  if (!isText) {
    return { type: 'binary' as const, metadata }
  }

  const content = await readFile(filePath, 'utf-8')
  return { type: 'text' as const, extension: rawExt, content, metadata }
})
