<script setup lang="ts">
import {
  categoryLabel,
  normalizeCategory,
  normalizeSearchQuery,
  normalizeTags,
  tagLabel
} from '~~/utils/updateTaxonomy'

interface ResourceFile {
  name: string
  relativePath: string
  extension: string
  modifiedAt: string
  sizeBytes: number
}

interface ResourceSectionData {
  section: string
  files: ResourceFile[]
}

interface ResourceListResponse {
  sections: ResourceSectionData[]
  totalFiles: number
}

const search = ref('')
const selectedCategories = ref<string[]>([])
const selectedTags = ref<string[]>([])

const { data: updates } = await useAsyncData('all-updates', () =>
  queryCollection('updates')
    .where('published', '=', true)
    .order('date', 'DESC')
    .all()
)

const { data: resourceData } = await useFetch<ResourceListResponse>('/api/resources/list', {
  key: 'resource-list-updates',
  lazy: true
})

const allUpdates = computed(() => updates.value ?? [])

function extractText(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    return value.map(entry => extractText(entry)).join(' ')
  }
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .map(entry => extractText(entry))
      .join(' ')
  }
  return ''
}

const searchableUpdates = computed(() => allUpdates.value.map((item) => {
  const rawCategory = typeof item.category === 'string' ? item.category : undefined
  const rawTags = Array.isArray(item.tags)
    ? item.tags.filter((tag): tag is string => typeof tag === 'string')
    : undefined

  const normalizedCategory = normalizeCategory(rawCategory).value
  const normalizedTags = normalizeTags(rawTags).values
  const bodyText = extractText(item.body)

  const searchableText = [
    item.title,
    normalizedCategory,
    ...normalizedTags,
    bodyText
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return {
    item,
    normalizedCategory,
    normalizedTags,
    searchableText
  }
}))

const categories = computed<string[]>(() => [
  ...new Set(searchableUpdates.value
    .map(item => item.normalizedCategory)
    .filter(Boolean))
] as string[])

const tags = computed<string[]>(() => [
  ...new Set(searchableUpdates.value
    .flatMap(item => item.normalizedTags)
    .filter(Boolean))
] as string[])

const toggleCategory = (cat: string) => {
  const idx = selectedCategories.value.indexOf(cat)
  if (idx === -1) {
    selectedCategories.value = [...selectedCategories.value, cat]
  } else {
    selectedCategories.value = selectedCategories.value.filter(c => c !== cat)
  }
}

const toggleTag = (tag: string) => {
  const idx = selectedTags.value.indexOf(tag)
  if (idx === -1) {
    selectedTags.value = [...selectedTags.value, tag]
  } else {
    selectedTags.value = selectedTags.value.filter(t => t !== tag)
  }
}

const filteredUpdates = computed(() => {
  const query = normalizeSearchQuery(search.value)

  return searchableUpdates.value.filter(({ normalizedCategory, normalizedTags, searchableText }) => {
    const matchesCategory = selectedCategories.value.length === 0
      || (normalizedCategory ? selectedCategories.value.includes(normalizedCategory) : false)
    const matchesTag = selectedTags.value.length === 0
      || normalizedTags.some(tag => selectedTags.value.includes(tag))
    const matchesQuery = !query || searchableText.includes(query)

    return matchesCategory && matchesTag && matchesQuery
  }).map(result => result.item)
})

const summaryCards = computed(() => {
  const latest = allUpdates.value[0]
  const activeLabel = selectedCategories.value.length === 0
    && selectedTags.value.length === 0
    ? 'All'
    : `${selectedCategories.value.length + selectedTags.value.length} active`

  return [{
    label: 'Published entries',
    value: String(allUpdates.value.length).padStart(2, '0'),
    icon: 'i-lucide-files'
  }, {
    label: 'Active filters',
    value: activeLabel,
    icon: 'i-lucide-filter'
  }, {
    label: 'Latest publish',
    value: latest?.date
      ? new Date(latest.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '--',
    icon: 'i-lucide-calendar-days'
  }]
})

const getRelatedFile = (section: string, name: string): ResourceFile | null => {
  const sectionData = resourceData.value?.sections?.find(s => s.section === section)
  return sectionData?.files?.find(f => f.name === name) ?? null
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
</script>

<template>
  <main class="space-y-8 lg:space-y-10">
    <section class="hero-panel rounded-[2rem] p-6 sm:p-8 lg:p-10">
      <div class="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-end">
        <div class="space-y-4">
          <p class="eyebrow-label text-dimmed">
            Update archive
          </p>
          <div class="max-w-2xl space-y-4">
            <h1 class="text-4xl font-semibold tracking-tight text-highlighted sm:text-5xl">
              Scan the full changelog without digging through long pages.
            </h1>
            <p class="max-w-2xl text-base leading-7 text-muted sm:text-lg">
              Search the existing log, filter the timeline by category, and keep the latest infrastructure context visible while reading older entries.
            </p>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <div
            v-for="card in summaryCards"
            :key="card.label"
            class="dashboard-chip rounded-2xl p-4"
          >
            <div class="mb-3 flex items-center justify-between gap-3">
              <p class="eyebrow-label text-dimmed">
                {{ card.label }}
              </p>
              <UIcon
                :name="card.icon"
                class="size-4 text-primary"
              />
            </div>
            <p class="text-lg font-semibold text-highlighted">
              {{ card.value }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="hero-panel rounded-[2rem] p-4 sm:p-5 lg:p-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Search titles, tags, or categories"
          size="xl"
          class="w-full lg:max-w-md"
        />

        <div class="flex flex-wrap items-center gap-2">
          <UButton
            v-if="selectedCategories.length > 0 || selectedTags.length > 0"
            label="Clear"
            icon="i-lucide-x"
            variant="subtle"
            color="neutral"
            size="sm"
            @click="selectedCategories = []; selectedTags = []"
          />
          <UButton
            v-for="category in categories"
            :key="category"
            :label="categoryLabel(category)"
            :variant="selectedCategories.includes(category) ? 'solid' : 'subtle'"
            :color="selectedCategories.includes(category) ? 'primary' : 'neutral'"
            @click="toggleCategory(category)"
          />
          <UButton
            v-for="tag in tags"
            :key="tag"
            :label="tagLabel(tag)"
            :variant="selectedTags.includes(tag) ? 'solid' : 'subtle'"
            :color="selectedTags.includes(tag) ? 'primary' : 'neutral'"
            @click="toggleTag(tag)"
          />
        </div>
      </div>
    </section>

    <section
      v-if="filteredUpdates.length"
      class="hero-panel rounded-[2rem] px-5 py-6 sm:px-6 sm:py-8 lg:px-8"
    >
      <UChangelogVersions
        as="div"
        :indicator-motion="false"
        :ui="{
          root: 'gap-0',
          indicator: 'inset-y-0'
        }"
      >
        <UChangelogVersion
          v-for="item in filteredUpdates"
          :key="item.stem"
          :tag="item.date ? formatDate(item.date) : item.stem"
          :title="item.title"
          :date="item.date ? new Date(item.date).toISOString() : undefined"
          :ui="{
            root: 'flex items-start',
            container: 'min-w-0 max-w-3xl rounded-2xl pb-8',
            header: 'mb-6 border-b border-default pb-4',
            title: 'text-2xl sm:text-3xl',
            date: 'text-xs/9 text-highlighted font-mono',
            indicator: 'sticky top-28 pt-2'
          }"
        >
          <template #header-trailing>
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-if="item.category"
                :label="categoryLabel(normalizeCategory(item.category).value ?? item.category)"
                variant="soft"
                size="sm"
              />
              <UBadge
                v-for="tag in (item.tags ?? [])"
                :key="tag"
                :label="tagLabel(tag)"
                variant="subtle"
                color="neutral"
                size="sm"
              />
            </div>
          </template>

          <template #body>
            <ContentRenderer
              :value="item"
              class="content-prose prose max-w-none dark:prose-invert"
            />

            <div
              v-if="item.relatedFiles?.length"
              class="mt-8 border-t border-default pt-6"
            >
              <p class="eyebrow-label mb-4 text-dimmed">
                Related files
              </p>
              <div class="grid gap-3">
                <template
                  v-for="ref in item.relatedFiles"
                  :key="`${ref.section}/${ref.name}`"
                >
                  <ResourceFileCard
                    v-if="getRelatedFile(ref.section, ref.name)"
                    :section="ref.section"
                    v-bind="getRelatedFile(ref.section, ref.name)!"
                  />
                  <article
                    v-else
                    class="dashboard-chip rounded-2xl p-4"
                  >
                    <p class="text-sm font-semibold text-highlighted">
                      {{ ref.name }}
                    </p>
                    <p class="mt-1 font-mono text-xs text-dimmed">
                      resources/{{ ref.section }}/
                    </p>
                  </article>
                </template>
              </div>
            </div>
          </template>
        </UChangelogVersion>
      </UChangelogVersions>
    </section>

    <section
      v-else
      class="hero-panel rounded-[2rem] p-8 text-center"
    >
      <UIcon
        name="i-lucide-search-x"
        class="mx-auto mb-4 size-8 text-dimmed"
      />
      <h2 class="mb-2 text-xl font-semibold text-highlighted">
        No entries match that filter.
      </h2>
      <p class="mx-auto max-w-md text-sm leading-6 text-muted">
        Try clearing the search or switching back to the full archive view.
      </p>
    </section>
  </main>
</template>
