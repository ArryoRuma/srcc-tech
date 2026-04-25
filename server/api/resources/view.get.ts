import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
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

const mimeTypes: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
}

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

  if (nameParam.includes('..') || nameParam.includes('/') || nameParam.includes('\\')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid filename' })
  }

  const resolvedBase = resolve(dir)
  const resolvedFile = resolve(join(dir, nameParam))
  if (!resolvedFile.startsWith(resolvedBase + '/')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid filename' })
  }

  let fileInfo
  try {
    fileInfo = await stat(resolvedFile)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }

  if (!fileInfo.isFile()) {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }

  const rawExt = nameParam.includes('.') ? `.${nameParam.split('.').pop()!.toLowerCase()}` : ''
  const contentType = mimeTypes[rawExt] ?? 'application/octet-stream'

  setResponseHeaders(event, {
    'Content-Type': contentType,
    'Content-Disposition': `inline; filename="${encodeURIComponent(nameParam)}"`,
    'Content-Length': String(fileInfo.size),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  })

  return sendStream(event, createReadStream(resolvedFile))
})
