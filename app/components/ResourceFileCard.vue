<script setup lang="ts">
const props = defineProps<{
  name: string
  relativePath: string
  extension: string
  sizeBytes: number
  modifiedAt: string
  section: string
}>()

const formatBytes = (value: number) => {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

const detailPath = computed(() => `/resources/${props.section}/${encodeURIComponent(props.name)}`)
</script>

<template>
  <NuxtLink
    :to="detailPath"
    class="dashboard-chip block rounded-2xl p-4 transition-colors hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="space-y-1">
        <p class="text-base font-semibold text-highlighted">
          {{ name }}
        </p>
        <p class="font-mono text-xs text-dimmed">
          {{ relativePath }}
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <UBadge
          :label="extension"
          variant="subtle"
          color="neutral"
        />
        <UBadge
          :label="formatBytes(sizeBytes)"
          variant="subtle"
          color="neutral"
        />
      </div>
    </div>

    <p class="mt-3 text-xs text-dimmed">
      Updated {{ new Date(modifiedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) }}
    </p>
  </NuxtLink>
</template>
