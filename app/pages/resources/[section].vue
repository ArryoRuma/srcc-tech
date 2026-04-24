<script setup lang="ts">
type SectionKey = 'sops' | 'runbooks' | 'references' | 'vendor-docs' | 'diagrams' | 'handoff' | 'archive'

interface ResourceListItem {
  name: string
  relativePath: string
  extension: string
  modifiedAt: string
  sizeBytes: number
}

interface ResourceListResponse {
  section: SectionKey
  dir: string
  total: number
  files: ResourceListItem[]
}

const sectionMeta = [{
  key: 'sops' as SectionKey,
  title: 'SOPs',
  description: 'Standard operating procedures and approved process documentation.',
  path: 'resources/sops/',
  icon: 'i-lucide-book-check'
}, {
  key: 'runbooks' as SectionKey,
  title: 'Runbooks',
  description: 'Troubleshooting and incident response documentation.',
  path: 'resources/runbooks/',
  icon: 'i-lucide-activity'
}, {
  key: 'references' as SectionKey,
  title: 'References',
  description: 'Reference sheets, standards, and supporting notes.',
  path: 'resources/references/',
  icon: 'i-lucide-library'
}, {
  key: 'vendor-docs' as SectionKey,
  title: 'Vendor docs',
  description: 'Manufacturer manuals, release notes, and product documents.',
  path: 'resources/vendor-docs/',
  icon: 'i-lucide-file-stack'
}, {
  key: 'diagrams' as SectionKey,
  title: 'Diagrams',
  description: 'Rack maps, signal flow diagrams, and room layout visuals.',
  path: 'resources/diagrams/',
  icon: 'i-lucide-workflow'
}, {
  key: 'handoff' as SectionKey,
  title: 'Handoff',
  description: 'Project handoff packages waiting for final placement.',
  path: 'resources/handoff/',
  icon: 'i-lucide-briefcase'
}, {
  key: 'archive' as SectionKey,
  title: 'Archive',
  description: 'Superseded resources retained for reference history.',
  path: 'resources/archive/',
  icon: 'i-lucide-archive'
}]

const route = useRoute()
const rawSection = Array.isArray(route.params.section) ? route.params.section[0] : route.params.section
const section = (rawSection ?? '') as SectionKey
const current = sectionMeta.find(item => item.key === section)

if (!current) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Resource section not found'
  })
}

const { data, pending } = await useFetch<ResourceListResponse>('/api/resources/list', {
  query: { section },
  key: `resource-${section}`
})

const files = computed(() => data.value?.files ?? [])
</script>

<template>
  <main class="space-y-8 lg:space-y-10">
    <section class="hero-panel rounded-[2rem] p-6 sm:p-8 lg:p-10">
      <div class="relative flex flex-wrap items-start justify-between gap-5">
        <div class="max-w-3xl space-y-4">
          <p class="eyebrow-label text-dimmed">
            Resource folder
          </p>
          <div class="flex items-center gap-3">
            <UIcon
              :name="current.icon"
              class="size-5 text-primary"
            />
            <h1 class="text-4xl font-semibold tracking-tight text-highlighted sm:text-5xl">
              {{ current.title }}
            </h1>
          </div>
          <p class="max-w-2xl text-base leading-7 text-muted sm:text-lg">
            {{ current.description }}
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <UButton
            to="/resources"
            icon="i-lucide-arrow-left"
            label="All folders"
            color="neutral"
            variant="outline"
          />
          <UButton
            to="/updates"
            icon="i-lucide-scroll-text"
            label="Updates"
            color="neutral"
            variant="subtle"
          />
        </div>
      </div>
    </section>

    <section class="hero-panel rounded-[2rem] p-6 sm:p-8">
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="eyebrow-label mb-2 text-dimmed">
            Folder path
          </p>
          <p class="font-mono text-sm text-highlighted">
            {{ current.path }}
          </p>
        </div>

        <UBadge
          :label="`${files.length} file${files.length === 1 ? '' : 's'}`"
          variant="soft"
          color="primary"
        />
      </div>

      <div
        v-if="pending"
        class="grid gap-3"
      >
        <USkeleton
          v-for="i in 4"
          :key="i"
          class="h-20 rounded-2xl"
        />
      </div>

      <div
        v-else-if="files.length"
        class="grid gap-3"
      >
        <ResourceFileCard
          v-for="file in files"
          :key="file.relativePath"
          v-bind="file"
        />
      </div>

      <div
        v-else
        class="dashboard-chip rounded-2xl p-8 text-center"
      >
        <UIcon
          name="i-lucide-folder-open-dot"
          class="mx-auto mb-3 size-7 text-dimmed"
        />
        <p class="mb-2 text-lg font-semibold text-highlighted">
          No files in this folder yet.
        </p>
        <p class="mx-auto max-w-lg text-sm leading-6 text-muted">
          Drop files into {{ current.path }} and they will automatically appear here.
        </p>
      </div>
    </section>
  </main>
</template>
