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
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.zip': 'application/zip'
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
  const contentType = mimeTypes[rawExt] ?? 'application/octet-stream'

  setResponseHeaders(event, {
    'Content-Type': contentType,
    'Content-Disposition': `attachment; filename="${encodeURIComponent(nameParam)}"`,
    'Content-Length': String(fileInfo.size),
    'Cache-Control': 'no-store'
  })

  return sendStream(event, createReadStream(filePath))
})
