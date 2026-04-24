<script setup lang="ts">
const { data: latest } = await useAsyncData('latest-updates', () =>
  queryCollection('updates')
    .where('published', '=', true)
    .order('date', 'DESC')
    .limit(3)
    .all()
)
</script>

<template>
  <div class="py-16 sm:py-24 lg:py-32 max-w-xl">
    <div class="mb-12">
      <p class="text-muted text-sm font-mono uppercase tracking-widest mb-4">
        Technology at SRCC
      </p>
      <h2 class="text-3xl font-semibold text-highlighted mb-4">
        What's new in our tech
      </h2>
      <p class="text-muted leading-relaxed">
        We keep a running log of infrastructure changes, A/V upgrades, software rollouts, and anything else the tech team has shipped. If something looks or sounds different on Sunday, it's probably documented here.
      </p>
    </div>

    <div
      v-if="latest && latest.length"
      class="flex flex-col gap-6 mb-10"
    >
      <NuxtLink
        v-for="item in latest"
        :key="item.stem"
        to="/updates"
        class="group block rounded-xl border border-default bg-elevated p-5 hover:border-accented transition-colors"
      >
        <div class="flex items-start justify-between gap-4 mb-1">
          <span class="font-medium text-highlighted group-hover:text-primary transition-colors">
            {{ item.title }}
          </span>
          <UBadge
            v-if="item.category"
            :label="item.category"
            variant="soft"
            size="sm"
            class="shrink-0"
          />
        </div>
        <p class="text-xs font-mono text-dimmed">
          {{ new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}
        </p>
      </NuxtLink>
    </div>

    <UButton
      to="/updates"
      label="View all updates"
      trailing-icon="i-lucide-arrow-right"
      variant="outline"
      color="neutral"
    />
  </div>
</template>
