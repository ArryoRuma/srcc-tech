<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const title = 'SRCC Tech'
const description = 'A running log of technology updates, A/V changes, and infrastructure improvements at SRCC.'

const route = useRoute()

const navigationItems = computed<NavigationMenuItem[]>(() => [{
  label: 'Home',
  icon: 'i-lucide-house',
  to: '/'
}, {
  label: 'Updates',
  icon: 'i-lucide-scroll-text',
  to: '/updates'
}, {
  label: 'Resources',
  icon: 'i-lucide-folder-tree',
  to: '/resources'
}, {
  label: 'Manage',
  icon: 'i-lucide-settings-2',
  to: '/manage'
}])

const utilityItems = computed(() => {
  if (route.path === '/updates') {
    return [{
      label: 'Resources',
      icon: 'i-lucide-folder-tree',
      trailing: true,
      variant: 'subtle' as const,
      color: 'neutral' as const,
      to: '/resources'
    }]
  }

  if (route.path === '/resources') {
    return [{
      label: 'View archive',
      icon: 'i-lucide-scroll-text',
      trailing: true,
      variant: 'subtle' as const,
      color: 'neutral' as const,
      to: '/updates'
    }]
  }

  return [{
    label: 'Resources',
    icon: 'i-lucide-folder-tree',
    trailing: true,
    variant: 'subtle' as const,
    color: 'neutral' as const,
    to: '/resources'
  }]
})

const routeLabel = computed(() => {
  if (route.path === '/updates') {
    return 'Update archive'
  }

  if (route.path === '/resources') {
    return 'Operations library'
  }

  return 'Tech changelog'
})

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp>
    <div class="app-shell min-h-screen">
      <div class="site-backdrop pointer-events-none fixed inset-0 -z-20 overflow-hidden" />
      <div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <SkyBg
          :star-count="72"
          color="color-mix(in srgb, var(--ui-primary) 48%, white)"
          speed="slow"
        />

        <div class="absolute left-[10%] top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div class="absolute right-[8%] top-1/3 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <UHeader class="surface-backdrop border-b border-default">
        <template #title>
          <NuxtLink
            to="/"
            class="flex items-center gap-3"
          >
            <AppLogo class="h-6 w-auto shrink-0 text-highlighted" />
            <span class="eyebrow-label hidden text-dimmed md:inline-block">
              {{ routeLabel }}
            </span>
          </NuxtLink>
        </template>

        <UNavigationMenu
          :items="navigationItems"
          class="hidden md:flex"
        />

        <template #right>
          <UButton
            v-for="item in utilityItems"
            :key="item.to"
            v-bind="item"
            class="hidden sm:inline-flex"
          />
          <UColorModeButton />
        </template>

        <template #body>
          <div class="space-y-4 px-1 pb-4 md:hidden">
            <UNavigationMenu
              :items="navigationItems"
              orientation="vertical"
              class="-mx-2.5"
            />

            <div class="dashboard-chip rounded-2xl p-3">
              <p class="eyebrow-label mb-2 text-dimmed">
                Quick access
              </p>
              <div class="flex flex-wrap gap-2">
                <UButton
                  v-for="item in utilityItems"
                  :key="`${item.to}-mobile`"
                  v-bind="item"
                  size="sm"
                />
              </div>
            </div>
          </div>
        </template>
      </UHeader>

      <UMain>
        <div class="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
          <NuxtPage />
        </div>
      </UMain>
    </div>
  </UApp>
</template>
