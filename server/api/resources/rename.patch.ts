import { rename, stat } from 'fs/promises'
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

const validateFilename = (name: string) => {
  if (!name) return false
  if (name.includes('..') || name.includes('/') || name.includes('\\')) return false
  if (!/^[\w\s.-]+$/.test(name)) return false
  return true
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const { section, oldName, newName } = body ?? {}

  if (!section || !oldName || !newName) {
    throw createError({ statusCode: 400, statusMessage: 'Missing section, oldName, or newName' })
  }

  const dir = sectionDirs[section]
  if (!dir) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid resource section' })
  }

  if (!validateFilename(oldName) || !validateFilename(newName)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid filename' })
  }

  // Check extension matches original or is in allowed list
  const extMatch = newName.match(/(\.[^.]+)$/)
  const newExt = extMatch ? extMatch[1].toLowerCase() : ''
  if (newExt && !allowedExtensions.has(newExt)) {
    throw createError({ statusCode: 400, statusMessage: `File type "${newExt}" is not allowed` })
  }

  const resolvedBase = resolve(dir)
  const resolvedOld = resolve(join(dir, oldName))
  const resolvedNew = resolve(join(dir, newName))

  if (!resolvedOld.startsWith(resolvedBase + '/') || !resolvedNew.startsWith(resolvedBase + '/')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid filename' })
  }

  let fileInfo
  try {
    fileInfo = await stat(resolvedOld)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }

  if (!fileInfo.isFile()) {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }

  // Check target does not already exist
  try {
    await stat(resolvedNew)
    throw createError({ statusCode: 409, statusMessage: 'A file with that name already exists' })
  } catch (err: unknown) {
    const nodeErr = err as { statusCode?: number }
    if (nodeErr?.statusCode === 409) throw err
    // ENOENT expected — target doesn't exist, proceed
  }

  await rename(resolvedOld, resolvedNew)

  const newInfo = await stat(resolvedNew)

  return {
    oldName,
    name: newName,
    section,
    relativePath: `${dir}/${newName}`,
    modifiedAt: newInfo.mtime.toISOString(),
    sizeBytes: newInfo.size
  }
})
