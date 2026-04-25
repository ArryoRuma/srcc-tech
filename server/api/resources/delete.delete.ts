import { unlink, stat } from 'fs/promises'
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

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const section = typeof query.section === 'string' ? query.section : null
  const name = typeof query.name === 'string' ? query.name : null

  if (!section || !name) {
    throw createError({ statusCode: 400, statusMessage: 'Missing section or name parameter' })
  }

  const dir = sectionDirs[section]
  if (!dir) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid resource section' })
  }

  // Prevent path traversal
  if (name.includes('..') || name.includes('/') || name.includes('\\')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid filename' })
  }

  const resolvedBase = resolve(dir)
  const resolvedFile = resolve(join(dir, name))
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

  await unlink(resolvedFile)

  return { success: true, deleted: name }
})
