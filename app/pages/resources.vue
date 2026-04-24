<script setup lang="ts">
type SectionKey = 'sops' | 'runbooks' | 'references' | 'vendor-docs' | 'diagrams' | 'handoff' | 'archive'

interface ResourceSectionSummary {
  section: SectionKey
  total: number
}

interface ResourceIndexResponse {
  sections: ResourceSectionSummary[]
  totalFiles: number
}

const folders = [{
  key: 'sops' as SectionKey,
  title: 'SOPs',
  path: 'resources/sops/',
  icon: 'i-lucide-book-check',
  description: 'Finalized standard operating procedures and approved process documents.',
  state: 'Ready for paste'
}, {
  key: 'runbooks' as SectionKey,
  title: 'Runbooks',
  path: 'resources/runbooks/',
  icon: 'i-lucide-activity',
  description: 'Troubleshooting and incident response guides for fast operational recovery.',
  state: 'Ready for paste'
}, {
  key: 'references' as SectionKey,
  title: 'References',
  path: 'resources/references/',
  icon: 'i-lucide-library',
  description: 'Cheat sheets, wiring notes, standards, and quick lookup references.',
  state: 'Ready for paste'
}, {
  key: 'vendor-docs' as SectionKey,
  title: 'Vendor docs',
  path: 'resources/vendor-docs/',
  icon: 'i-lucide-file-stack',
  description: 'Manufacturer manuals, firmware notes, product release docs, and PDFs.',
  state: 'Ready for paste'
}, {
  key: 'diagrams' as SectionKey,
  title: 'Diagrams',
  path: 'resources/diagrams/',
  icon: 'i-lucide-workflow',
  description: 'Signal flow diagrams, room layouts, rack maps, and architecture visuals.',
  state: 'Ready for paste'
}, {
  key: 'handoff' as SectionKey,
  title: 'Handoff',
  path: 'resources/handoff/',
  icon: 'i-lucide-briefcase',
  description: 'Temporary handoff bundles from projects before final classification.',
  state: 'Staging area'
}, {
  key: 'archive' as SectionKey,
  title: 'Archive',
  path: 'resources/archive/',
  icon: 'i-lucide-archive',
  description: 'Superseded or historical versions moved out of active operational folders.',
  state: 'Cold storage'
}]

const templates = [{
  title: 'SOP template',
  path: 'resources/templates/sop-template.md',
  description: 'Use this starter when documenting repeatable operations procedures.'
}, {
  title: 'Runbook template',
  path: 'resources/templates/runbook-template.md',
  description: 'Use this starter for incident and break-fix response playbooks.'
}]

const acceptedFiles = ['.md', '.pdf', '.docx', '.xlsx', '.png', '.jpg', '.drawio', '.vsdx']

const { data: resourceData } = await useFetch<ResourceIndexResponse>('/api/resources/list', {
  key: 'resource-index'
})

const getSectionTotal = (sectionKey: SectionKey) => {
  const section = resourceData.value?.sections?.find((item: ResourceSectionSummary) => item.section === sectionKey)
  return section?.total ?? 0
}
</script>

<template>
  <main class="space-y-8 lg:space-y-10">
    <section class="hero-panel rounded-[2rem] p-6 sm:p-8 lg:p-10">
      <div class="relative grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,360px)] lg:items-end">
        <div class="space-y-4">
          <p class="eyebrow-label text-dimmed">
            Resources
          </p>
          <div class="max-w-2xl space-y-4">
            <h1 class="text-4xl font-semibold tracking-tight text-highlighted sm:text-5xl">
              Paste SOPs, references, and support files into a clean operations library.
            </h1>
            <p class="max-w-2xl text-base leading-7 text-muted sm:text-lg">
              This page maps exactly where docs belong in the repository so you can drop files quickly and keep operations material organized from day one.
            </p>
          </div>
        </div>

        <div class="dashboard-chip rounded-2xl p-5">
          <p class="eyebrow-label mb-3 text-dimmed">
            Intake rule
          </p>
          <p class="mb-3 text-lg font-semibold text-highlighted">
            Name files with date-first format
          </p>
          <p class="mb-3 text-sm leading-6 text-muted">
            Suggested format: YYYY-MM-DD-topic.ext
          </p>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="ext in acceptedFiles"
              :key="ext"
              :label="ext"
              variant="soft"
              color="neutral"
            />
          </div>
        </div>
      </div>
    </section>

    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="item in folders"
        :key="item.key"
        class="hero-panel rounded-[1.75rem] p-5"
      >
        <div class="mb-4 flex items-start justify-between gap-3">
          <UIcon
            :name="item.icon"
            class="size-5 text-primary"
          />
          <UBadge
            :label="item.state"
            variant="subtle"
            color="neutral"
          />
        </div>

        <p class="mb-2 text-lg font-semibold text-highlighted">
          {{ item.title }}
        </p>
        <p class="mb-4 text-sm leading-6 text-muted">
          {{ item.description }}
        </p>

        <div class="mb-4 flex items-center justify-between gap-3">
          <p class="eyebrow-label text-dimmed">
            Files found
          </p>
          <p class="text-base font-semibold text-highlighted">
            {{ getSectionTotal(item.key) }}
          </p>
        </div>

        <UButton
          :to="`/resources/${item.key}`"
          label="Open folder page"
          icon="i-lucide-arrow-up-right"
          trailing
          variant="outline"
          color="neutral"
          block
        />

        <p class="mt-3 font-mono text-xs text-dimmed">
          {{ item.path }}
        </p>
      </article>
    </section>

    <section class="hero-panel rounded-[2rem] p-6 sm:p-8">
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="eyebrow-label mb-2 text-dimmed">
            Templates
          </p>
          <h2 class="text-2xl font-semibold text-highlighted">
            Starter files for consistent documentation
          </h2>
        </div>

        <UButton
          to="/updates"
          icon="i-lucide-scroll-text"
          label="Back to updates"
          color="neutral"
          variant="outline"
        />
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <article
          v-for="template in templates"
          :key="template.path"
          class="dashboard-chip rounded-2xl p-5"
        >
          <p class="mb-2 text-lg font-semibold text-highlighted">
            {{ template.title }}
          </p>
          <p class="mb-4 text-sm leading-6 text-muted">
            {{ template.description }}
          </p>
          <p class="font-mono text-xs text-dimmed">
            {{ template.path }}
          </p>
        </article>
      </div>
    </section>
  </main>
</template>
