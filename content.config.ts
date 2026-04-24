import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    updates: defineCollection({
      type: 'page',
      source: 'updates/**/*.md',
      schema: z.object({
        title: z.string(),
        date: z.string(),
        tags: z.array(z.string()).optional(),
        category: z.string().optional(),
        published: z.boolean().default(true),
        relatedFiles: z.array(z.object({
          section: z.string(),
          name: z.string()
        })).optional()
      })
    })
  }
})
