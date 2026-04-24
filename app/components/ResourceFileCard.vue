<script setup lang="ts">
defineProps<{
  name: string
  relativePath: string
  extension: string
  sizeBytes: number
  modifiedAt: string
}>()

const formatBytes = (value: number) => {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <article class="dashboard-chip rounded-2xl p-4">
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
  </article>
</template>
