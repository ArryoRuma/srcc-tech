import { writeFile, mkdir } from 'fs/promises'
import { resolve } from 'path'

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
  const tagsList = Array.isArray(tags) && tags.length > 0
    ? `[${tags.map((t: string) => t.trim()).join(', ')}]`
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
    ...(category ? [`category: ${category}`] : []),
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
