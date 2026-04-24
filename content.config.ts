import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    updates: defineCollection({
      type: 'page',
      source: 'updates/**/*.md',
      schema: z.object({
        title: z.string(),
        date: z.string(),
        tag: z.string().optional(),
        category: z.string().optional(),
        published: z.boolean().default(true)
      })
    })
  }
})
