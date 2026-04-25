import { writeFile, mkdir, stat } from 'fs/promises'
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

const allowedExtensions = new Set(['.md', '.pdf', '.docx', '.xlsx', '.png', '.jpg', '.jpeg', '.drawio', '.vsdx', '.txt', '.csv'])

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25 MB

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)

  if (!form) {
    throw createError({ statusCode: 400, statusMessage: 'No multipart form data received' })
  }

  const sectionField = form.find(f => f.name === 'section')
  const fileField = form.find(f => f.name === 'file')
  const customNameField = form.find(f => f.name === 'customName')

  if (!sectionField?.data || !fileField?.data) {
    throw createError({ statusCode: 400, statusMessage: 'Missing section or file field' })
  }

  const section = sectionField.data.toString('utf-8').trim()
  const dir = sectionDirs[section]
  if (!dir) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid resource section' })
  }

  // Determine filename
  const originalName = fileField.filename ?? 'upload'
  const customName = customNameField?.data?.toString('utf-8').trim() || ''
  let baseName = customName || originalName

  // Strip dangerous characters
  baseName = baseName.replace(/[^\w\s.-]/g, '').trim()

  if (!baseName) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid filename' })
  }

  // Get extension from original file
  const extMatch = originalName.match(/(\.[^.]+)$/)
  const extension = extMatch?.[1]?.toLowerCase() ?? ''

  if (!allowedExtensions.has(extension)) {
    throw createError({ statusCode: 400, statusMessage: `File type "${extension}" is not allowed` })
  }

  // Auto-prepend today's date if not already present
  const datePrefix = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const datePattern = /^\d{4}-\d{2}-\d{2}-/
  const nameWithoutExt = baseName.replace(/(\.[^.]+)$/, '')
  const finalName = datePattern.test(nameWithoutExt)
    ? baseName
    : `${datePrefix}-${baseName}`

  // Security: prevent path traversal
  if (finalName.includes('..') || finalName.includes('/') || finalName.includes('\\')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid filename' })
  }

  const resolvedBase = resolve(dir)
  const resolvedFile = resolve(join(dir, finalName))
  if (!resolvedFile.startsWith(resolvedBase + '/')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid filename' })
  }

  // Validate file size
  if (fileField.data.length > MAX_FILE_SIZE) {
    throw createError({ statusCode: 413, statusMessage: 'File exceeds the 25 MB size limit' })
  }

  // Ensure directory exists
  await mkdir(dir, { recursive: true })

  await writeFile(resolvedFile, fileField.data)

  const info = await stat(resolvedFile)

  return {
    name: finalName,
    section,
    relativePath: `${dir}/${finalName}`,
    extension,
    modifiedAt: info.mtime.toISOString(),
    sizeBytes: info.size
  }
})
