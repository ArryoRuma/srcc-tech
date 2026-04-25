import { writeFile, mkdir } from 'fs/promises'
import { resolve } from 'path'
import { normalizeCategory, normalizeTags } from '~~/utils/updateTaxonomy'

const UPDATES_DIR = 'content/updates'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const {
    title,
    date,
    category,
    tags,
    published,
    relatedFiles,
    body: markdownBody
  } = body ?? {}

  if (!title || typeof title !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Missing or invalid title' })
  }

  if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw createError({ statusCode: 400, statusMessage: 'Missing or invalid date (expected YYYY-MM-DD)' })
  }

  const categoryResult = normalizeCategory(typeof category === 'string' ? category : undefined)
  if (categoryResult.unknown) {
    throw createError({
      statusCode: 400,
      statusMessage: `Unknown category: ${categoryResult.unknown}`
    })
  }

  const normalizedTags = normalizeTags(Array.isArray(tags) ? tags : undefined)
  if (normalizedTags.unknown.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `Unknown tags: ${normalizedTags.unknown.join(', ')}`
    })
  }

  // Build filename
  const slug = slugify(title)
  const filename = `${date}-${slug}.md`

  // Security: validate filename
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid title produces an unsafe filename' })
  }

  const resolvedDir = resolve(UPDATES_DIR)
  const resolvedFile = resolve(`${UPDATES_DIR}/${filename}`)
  if (!resolvedFile.startsWith(resolvedDir + '/')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid filename generated' })
  }

  // Build YAML frontmatter
  const tagsList = normalizedTags.values.length > 0
    ? JSON.stringify(normalizedTags.values)
    : null

  const relatedFilesList = Array.isArray(relatedFiles) && relatedFiles.length > 0
    ? '\nrelatedFiles:\n' + relatedFiles.map((f: { section: string, name: string }) =>
      `  - section: ${f.section}\n    name: ${f.name}`
    ).join('\n')
    : ''

  const frontmatter = [
    '---',
    `title: ${title}`,
    `date: ${date}`,
    ...(categoryResult.value ? [`category: ${categoryResult.value}`] : []),
    ...(tagsList ? [`tags: ${tagsList}`] : []),
    `published: ${published !== false}`,
    ...(relatedFilesList ? [relatedFilesList.trimStart()] : []),
    '---'
  ].join('\n')

  const fileContent = `${frontmatter}\n\n${typeof markdownBody === 'string' ? markdownBody.trim() : ''}\n`

  await mkdir(UPDATES_DIR, { recursive: true })
  await writeFile(resolvedFile, fileContent, 'utf-8')

  return { filename, path: `${UPDATES_DIR}/${filename}` }
})
