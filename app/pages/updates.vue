<script setup lang="ts">
const { data: updates } = await useAsyncData('all-updates', () =>
  queryCollection('updates')
    .where('published', '=', true)
    .order('date', 'DESC')
    .all()
)
</script>

<template>
  <UChangelogVersions
    as="main"
    :indicator-motion="false"
    :ui="{
      root: 'py-16 sm:py-24 lg:py-32',
      indicator: 'inset-y-0'
    }"
  >
    <UChangelogVersion
      v-for="item in updates"
      :key="item.stem"
      :tag="item.tag || item.stem"
      :title="item.title"
      :date="item.date ? new Date(item.date).toISOString() : undefined"
      :ui="{
        root: 'flex items-start',
        container: 'max-w-xl min-w-0',
        header: 'border-b border-default pb-4',
        title: 'text-3xl',
        date: 'text-xs/9 text-highlighted font-mono',
        indicator: 'sticky top-0 pt-16 -mt-16 sm:pt-24 sm:-mt-24 lg:pt-32 lg:-mt-32'
      }"
    >
      <template #header-trailing>
        <UBadge
          v-if="item.category"
          :label="item.category"
          variant="soft"
          size="sm"
          class="shrink-0"
        />
      </template>

      <template #body>
        <ContentRenderer
          :value="item"
          class="prose dark:prose-invert max-w-none"
        />
      </template>
    </UChangelogVersion>
  </UChangelogVersions>
</template>
