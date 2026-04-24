<script setup lang="ts">
type SectionKey = 'sops' | 'runbooks' | 'references' | 'vendor-docs' | 'diagrams' | 'handoff' | 'archive'

interface FileMetadata {
  name: string
  section: string
  relativePath: string
  extension: string
  modifiedAt: string
  sizeBytes: number
}

interface TextFileResponse {
  type: 'text'
  extension: string
  content: string
  metadata: FileMetadata
}

interface BinaryFileResponse {
  type: 'binary'
  metadata: FileMetadata
}

type FileResponse = TextFileResponse | BinaryFileResponse

const sectionMeta: Record<SectionKey, { title: string, icon: string }> = {
  'sops': { title: 'SOPs', icon: 'i-lucide-book-check' },
  'runbooks': { title: 'Runbooks', icon: 'i-lucide-activity' },
  'references': { title: 'References', icon: 'i-lucide-library' },
  'vendor-docs': { title: 'Vendor docs', icon: 'i-lucide-file-stack' },
  'diagrams': { title: 'Diagrams', icon: 'i-lucide-workflow' },
  'handoff': { title: 'Handoff', icon: 'i-lucide-briefcase' },
  'archive': { title: 'Archive', icon: 'i-lucide-archive' }
}

const nonTextExtensionLabels: Record<string, { label: string, icon: string }> = {
  '.pdf': { label: 'PDF document', icon: 'i-lucide-file-text' },
  '.docx': { label: 'Word document', icon: 'i-lucide-file-text' },
  '.xlsx': { label: 'Spreadsheet', icon: 'i-lucide-sheet' },
  '.pptx': { label: 'Presentation', icon: 'i-lucide-presentation' },
  '.png': { label: 'PNG image', icon: 'i-lucide-image' },
  '.jpg': { label: 'JPEG image', icon: 'i-lucide-image' },
  '.jpeg': { label: 'JPEG image', icon: 'i-lucide-image' },
  '.gif': { label: 'GIF image', icon: 'i-lucide-image' },
  '.webp': { label: 'WebP image', icon: 'i-lucide-image' },
  '.svg': { label: 'SVG graphic', icon: 'i-lucide-vector' },
  '.zip': { label: 'ZIP archive', icon: 'i-lucide-archive' }
}

const route = useRoute()
const rawSection = Array.isArray(route.params.section) ? route.params.section[0] : route.params.section
const rawFile = Array.isArray(route.params.file) ? route.params.file[0] : route.params.file

const section = (rawSection ?? '') as SectionKey
const fileName = rawFile ?? ''

const sectionInfo = sectionMeta[section]
if (!sectionInfo) {
  throw createError({ statusCode: 404, statusMessage: 'Resource section not found' })
}

if (!fileName) {
  throw createError({ statusCode: 404, statusMessage: 'File not found' })
}

const { data, pending, error } = await useFetch<FileResponse>('/api/resources/file', {
  query: { section, name: fileName },
  key: `resource-file-${section}-${fileName}`
})

const metadata = computed(() => data.value?.metadata)
const isMarkdown = computed(() => data.value?.type === 'text' && (data.value.extension === '.md' || data.value.extension === '.mdx' || data.value.extension === '.markdown'))
const markdownContent = computed(() => (data.value?.type === 'text' ? data.value.content : ''))

const downloadUrl = computed(() =>
  `/api/resources/download?section=${encodeURIComponent(section)}&name=${encodeURIComponent(fileName)}`
)

const fileTypeInfo = computed(() => {
  const ext = metadata.value?.extension ?? ''
  return nonTextExtensionLabels[ext] ?? { label: `${ext.replace('.', '').toUpperCase() || 'Unknown'} file`, icon: 'i-lucide-file' }
})

const formatBytes = (value: number) => {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

useSeoMeta({
  title: fileName,
  description: `${sectionInfo.title} — ${fileName}`
})
</script>

<template>
  <main class="space-y-8 lg:space-y-10">
    <!-- Header -->
    <section class="hero-panel rounded-[2rem] p-6 sm:p-8 lg:p-10">
      <div class="relative flex flex-wrap items-start justify-between gap-5">
        <div class="max-w-3xl space-y-4">
          <p class="eyebrow-label text-dimmed">
            {{ sectionInfo.title }}
          </p>
          <div class="flex items-center gap-3">
            <UIcon
              :name="sectionInfo.icon"
              class="size-5 text-primary"
            />
            <h1 class="break-all text-3xl font-semibold tracking-tight text-highlighted sm:text-4xl">
              {{ fileName }}
            </h1>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <UButton
            :to="`/resources/${section}`"
            icon="i-lucide-arrow-left"
            :label="`Back to ${sectionInfo.title}`"
            color="neutral"
            variant="outline"
          />
          <UButton
            :href="downloadUrl"
            target="_blank"
            rel="noopener"
            icon="i-lucide-download"
            label="Download"
            color="primary"
            variant="subtle"
          />
        </div>
      </div>
    </section>

    <!-- Loading state -->
    <section
      v-if="pending"
      class="hero-panel rounded-[2rem] p-6 sm:p-8"
    >
      <div class="space-y-3">
        <USkeleton class="h-4 w-1/3 rounded-lg" />
        <USkeleton class="h-4 w-full rounded-lg" />
        <USkeleton class="h-4 w-full rounded-lg" />
        <USkeleton class="h-4 w-5/6 rounded-lg" />
        <USkeleton class="h-4 w-full rounded-lg" />
        <USkeleton class="h-4 w-2/3 rounded-lg" />
      </div>
    </section>

    <!-- Error state -->
    <section
      v-else-if="error"
      class="hero-panel rounded-[2rem] p-8 text-center"
    >
      <UIcon
        name="i-lucide-file-x"
        class="mx-auto mb-3 size-8 text-dimmed"
      />
      <p class="mb-2 text-lg font-semibold text-highlighted">
        File could not be loaded.
      </p>
      <p class="mx-auto max-w-md text-sm leading-6 text-muted">
        {{ error.statusMessage ?? 'An unexpected error occurred.' }}
      </p>
    </section>

    <template v-else-if="data">
      <!-- File metadata strip -->
      <section class="hero-panel rounded-[2rem] p-5 sm:p-6">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex flex-wrap gap-2">
            <UBadge
              :label="metadata!.extension"
              variant="subtle"
              color="neutral"
            />
            <UBadge
              :label="formatBytes(metadata!.sizeBytes)"
              variant="subtle"
              color="neutral"
            />
          </div>
          <p class="font-mono text-xs text-dimmed">
            Updated {{ new Date(metadata!.modifiedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) }}
          </p>
          <p class="font-mono text-xs text-dimmed">
            {{ metadata!.relativePath }}
          </p>
        </div>
      </section>

      <!-- Markdown render -->
      <section
        v-if="isMarkdown"
        class="hero-panel rounded-[2rem] p-6 sm:p-8 lg:p-10"
      >
        <div class="prose prose-neutral dark:prose-invert max-w-none
          prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-highlighted
          prose-p:text-muted prose-p:leading-7
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-code:font-mono prose-code:text-sm prose-code:text-highlighted
          prose-pre:bg-elevated prose-pre:rounded-xl
          prose-blockquote:border-primary prose-blockquote:text-muted
          prose-strong:text-highlighted
          prose-hr:border-default"
        >
          <MDC :value="markdownContent" />
        </div>
      </section>

      <!-- Non-text / binary file card -->
      <section
        v-else
        class="hero-panel rounded-[2rem] p-8 text-center"
      >
        <UIcon
          :name="fileTypeInfo.icon"
          class="mx-auto mb-4 size-10 text-dimmed"
        />
        <p class="mb-1 text-lg font-semibold text-highlighted">
          {{ fileTypeInfo.label }}
        </p>
        <p class="mx-auto mb-6 max-w-md text-sm leading-6 text-muted">
          This file type can't be previewed in the browser. Download it to open it locally.
        </p>
        <UButton
          :href="downloadUrl"
          target="_blank"
          rel="noopener"
          icon="i-lucide-download"
          label="Download file"
          color="primary"
          variant="solid"
          size="lg"
        />
      </section>
    </template>
  </main>
</template>
