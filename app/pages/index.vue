<script setup lang="ts">
interface ResourceSectionSummary {
  section: string
  total: number
}

interface ResourceIndexResponse {
  sections: ResourceSectionSummary[]
  totalFiles: number
}

const { data: updates } = await useAsyncData('latest-updates', () =>
  queryCollection('updates')
    .where('published', '=', true)
    .order('date', 'DESC')
    .all()
)

const { data: resourceData } = await useFetch<ResourceIndexResponse>('/api/resources/list', {
  key: 'resource-index-home',
  lazy: true
})

const featuredUpdates = computed(() => updates.value?.slice(0, 3) ?? [])

const stats = computed(() => {
  const items = updates.value ?? []
  const latest = items[0]
  const categories = new Set(items.map(item => item.category).filter(Boolean))

  return [{
    label: 'Published logs',
    value: String(items.length).padStart(2, '0')
  }, {
    label: 'Latest publish',
    value: latest?.date
      ? new Date(latest.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '--'
  }, {
    label: 'Categories',
    value: String(categories.size).padStart(2, '0')
  }]
})

const resourceFolders = [{
  key: 'sops',
  title: 'SOPs',
  icon: 'i-lucide-book-check'
}, {
  key: 'runbooks',
  title: 'Runbooks',
  icon: 'i-lucide-activity'
}, {
  key: 'references',
  title: 'References',
  icon: 'i-lucide-library'
}, {
  key: 'vendor-docs',
  title: 'Vendor docs',
  icon: 'i-lucide-file-stack'
}, {
  key: 'diagrams',
  title: 'Diagrams',
  icon: 'i-lucide-workflow'
}, {
  key: 'handoff',
  title: 'Handoff',
  icon: 'i-lucide-briefcase'
}]

const getSectionTotal = (key: string) => {
  return resourceData.value?.sections?.find(s => s.section === key)?.total ?? 0
}
</script>

<template>
  <main class="space-y-8 lg:space-y-10">
    <section class="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,420px)] lg:items-stretch">
      <div class="hero-panel fade-slide-in rounded-[2rem] p-6 sm:p-8 lg:p-10">
        <div class="relative space-y-8">
          <div class="space-y-4">
            <p class="eyebrow-label text-dimmed">
              Technology at SRCC
            </p>
            <div class="max-w-2xl space-y-4">
              <h1 class="text-4xl font-semibold tracking-tight text-highlighted sm:text-5xl lg:text-6xl">
                Everything all in one place.
              </h1>
              <p class="max-w-xl text-base leading-7 text-muted sm:text-lg">
                See what's changed, user manuals, and other technical documentation all in one place.
              </p>
            </div>
          </div>

          <div class="flex flex-wrap gap-3">
            <UButton
              to="/updates"
              label="Open update archive"
              trailing-icon="i-lucide-arrow-right"
              size="xl"
            />
            <UButton
              to="/resources"
              label="Browse resources"
              icon="i-lucide-folder-open"
              color="neutral"
              variant="subtle"
              size="xl"
            />
          </div>

          <div class="grid gap-3 sm:grid-cols-3">
            <div
              v-for="item in stats"
              :key="item.label"
              class="dashboard-chip rounded-2xl p-4"
            >
              <p class="eyebrow-label mb-2 text-dimmed">
                {{ item.label }}
              </p>
              <p class="text-2xl font-semibold text-highlighted">
                {{ item.value }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <aside class="hero-panel fade-slide-in-delay rounded-[2rem] p-5 sm:p-6">
        <div class="relative flex h-full flex-col">
          <div class="mb-5 flex items-center justify-between gap-3">
            <div>
              <p class="eyebrow-label mb-2 text-dimmed">
                Recent ship log
              </p>
              <h2 class="text-xl font-semibold text-highlighted">
                Latest published updates
              </h2>
            </div>

            <UBadge
              label="Live"
              variant="soft"
              color="primary"
            />
          </div>

          <div class="flex flex-1 flex-col gap-3">
            <NuxtLink
              v-for="item in featuredUpdates"
              :key="item.stem"
              to="/updates"
              class="dashboard-chip group rounded-2xl p-4 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div class="mb-2 flex items-start justify-between gap-3">
                <p class="font-medium text-highlighted transition-colors group-hover:text-primary">
                  {{ item.title }}
                </p>

                <UBadge
                  v-if="item.category"
                  :label="item.category"
                  variant="subtle"
                  color="neutral"
                />
              </div>

              <div class="flex items-center justify-between gap-3 text-sm text-dimmed">
                <span>{{ new Date(item.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }}</span>
                <UIcon
                  name="i-lucide-arrow-up-right"
                  class="size-4"
                />
              </div>
            </NuxtLink>
          </div>
        </div>
      </aside>
    </section>

    <section class="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div class="hero-panel rounded-[2rem] p-6 sm:p-8">
        <div class="mb-6 flex items-start justify-between gap-4">
          <div>
            <p class="eyebrow-label mb-2 text-dimmed">
              Browse faster
            </p>
            <h2 class="text-2xl font-semibold text-highlighted">
              The archive stays one click away.
            </h2>
          </div>

          <UButton
            to="/updates"
            icon="i-lucide-scroll-text"
            label="View timeline"
            color="neutral"
            variant="outline"
          />
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div class="dashboard-chip rounded-2xl p-5">
            <p class="eyebrow-label mb-3 text-dimmed">
              Primary route
            </p>
            <p class="mb-2 text-lg font-semibold text-highlighted">
              Update timeline
            </p>
            <p class="text-sm leading-6 text-muted">
              Built for scanning recent changes first, then reading each entry in full without losing context.
            </p>
          </div>

          <div class="dashboard-chip rounded-2xl p-5">
            <p class="eyebrow-label mb-3 text-dimmed">
              Fast access
            </p>
            <p class="mb-2 text-lg font-semibold text-highlighted">
              Cleaner navigation
            </p>
            <p class="text-sm leading-6 text-muted">
              Header actions and a tighter page frame reduce dead space and make the two-site routes feel intentional.
            </p>
          </div>
        </div>
      </div>

      <div class="hero-panel rounded-[2rem] p-5 sm:p-6">
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <p class="eyebrow-label mb-2 text-dimmed">
              Resources library
            </p>
            <h2 class="text-xl font-semibold text-highlighted">
              Operations file store
            </h2>
          </div>

          <UBadge
            :label="`${resourceData?.totalFiles ?? 0} files`"
            variant="soft"
            color="primary"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <NuxtLink
            v-for="folder in resourceFolders"
            :key="folder.key"
            :to="`/resources/${folder.key}`"
            class="dashboard-chip group rounded-2xl p-4 transition-transform duration-200 hover:-translate-y-0.5"
          >
            <div class="mb-2 flex items-center justify-between gap-2">
              <UIcon
                :name="folder.icon"
                class="size-4 text-primary"
              />
              <span class="font-mono text-xs text-dimmed">{{ getSectionTotal(folder.key) }}</span>
            </div>
            <p class="text-sm font-semibold text-highlighted transition-colors group-hover:text-primary">
              {{ folder.title }}
            </p>
          </NuxtLink>
        </div>

        <UButton
          to="/resources"
          label="Browse all sections"
          trailing-icon="i-lucide-arrow-right"
          variant="ghost"
          color="neutral"
          block
          class="mt-4"
        />
      </div>
    </section>
  </main>
</template>
